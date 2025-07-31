import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { subInvoiceId } = await request.json();

  if (!subInvoiceId) {
    return new NextResponse("Sub-invoice ID is required", { status: 400 });
  }

  try {
    const subInvoice = await prisma.subInvoice.findUnique({
      where: {
        id: subInvoiceId,
      },
      include: {
        issuer: true,
        receiver: true,
        parentInvoice: {
          include: {
            collective: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!subInvoice) {
      return new NextResponse("Sub-invoice not found", { status: 404 });
    }

    // Ensure the current user is the receiver (collective owner) of this sub-invoice
    if (subInvoice.receiverId !== session.user.id) {
      return new NextResponse("Forbidden: You are not the receiver of this sub-invoice", { status: 403 });
    }

    // Ensure the receiver (collective owner) has a Stripe account connected
    if (!subInvoice.receiver.stripeAccountId) {
      return new NextResponse("Receiver does not have a Stripe account connected", { status: 400 });
    }

    // Ensure the issuer (freelancer) has a Stripe account connected (or can receive direct charges)
    // For simplicity, we'll assume the issuer also needs a connected account for transfers
    if (!subInvoice.issuer.stripeAccountId) {
      return new NextResponse("Issuer does not have a Stripe account connected", { status: 400 });
    }

    // Create a transfer from the collective owner's account to the freelancer's account
    const transfer = await stripe.transfers.create({
      amount: Math.round(subInvoice.amount.toNumber() * 100), // Amount in cents
      currency: "eur", // Assuming EUR, can be dynamic
      destination: subInvoice.issuer.stripeAccountId,
      source_transaction: subInvoice.parentInvoice.stripePaymentIntentId || undefined, // Link to the original payment if available
    }, {
      stripeAccount: subInvoice.receiver.stripeAccountId, // Execute as the collective owner
    });

    // Update sub-invoice status to paid
    await prisma.subInvoice.update({
      where: { id: subInvoiceId },
      data: { status: "paid", stripePaymentIntentId: transfer.id },
    });

    return NextResponse.json({ success: true, transferId: transfer.id });
  } catch (error) {
    console.error("Error processing payout:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
