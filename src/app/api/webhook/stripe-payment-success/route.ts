import { generateSubInvoices } from "@/lib/subInvoiceGenerator";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-06-30.basil",
});

// CRITICAL FUNCTION: Distribute payments to collective members
async function distributePymentsToCollectiveMembers(invoice: any, paymentIntentId: string | null) {
  console.log(`[PaymentDistribution] Starting distribution for invoice ${invoice.id}`);
  
  for (const share of invoice.shares) {
    // Skip the invoice issuer - they keep their share automatically
    if (share.userId === invoice.userId) {
      console.log(`[PaymentDistribution] Skipping invoice issuer ${invoice.userId}`);
      continue;
    }

    // Check if user has Stripe Connect account
    if (!share.user.stripeAccountId) {
      console.error(`[PaymentDistribution] User ${share.userId} has no Stripe Connect account - cannot distribute payment`);
      
      // Create failed payout record
      await prisma.collectivePayout.create({
        data: {
          invoiceId: invoice.id,
          userId: share.userId,
          amount: share.calculatedAmount,
          status: 'failed',
          errorMessage: 'User has no connected Stripe account',
          attemptCount: 1
        }
      });
      continue;
    }

    try {
      // Create CollectivePayout record as processing
      const payout = await prisma.collectivePayout.create({
        data: {
          invoiceId: invoice.id,
          userId: share.userId,
          amount: share.calculatedAmount,
          status: 'processing',
          attemptCount: 1
        }
      });

      // Create Stripe transfer to the member's connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(share.calculatedAmount.toNumber() * 100), // Amount in cents
        currency: "eur",
        destination: share.user.stripeAccountId,
        description: `Collective payment distribution from invoice ${invoice.invoiceNumber}`,
        metadata: {
          invoiceId: invoice.id,
          collectivePayoutId: payout.id,
          shareId: share.id
        }
      });

      // Update payout record with success
      await prisma.collectivePayout.update({
        where: { id: payout.id },
        data: {
          status: 'completed',
          stripeTransferId: transfer.id,
          completedAt: new Date()
        }
      });

      console.log(`[PaymentDistribution] Successfully transferred ${share.calculatedAmount}€ to user ${share.userId} (${transfer.id})`);

    } catch (error: any) {
      console.error(`[PaymentDistribution] Failed to transfer to user ${share.userId}:`, error.message);
      
      // Update or create failed payout record
      await prisma.collectivePayout.upsert({
        where: {
          invoiceId_userId: {
            invoiceId: invoice.id,
            userId: share.userId
          }
        },
        update: {
          status: 'failed',
          errorMessage: error.message,
          attemptCount: { increment: 1 }
        },
        create: {
          invoiceId: invoice.id,
          userId: share.userId,
          amount: share.calculatedAmount,
          status: 'failed',
          errorMessage: error.message,
          attemptCount: 1
        }
      });
    }
  }
  
  console.log(`[PaymentDistribution] Completed distribution for invoice ${invoice.id}`);
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    console.error(`⚠️  Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Received Stripe event type: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded": // Add this case to handle direct charges
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      const paymentIntentId = session.payment_intent?.toString() || null;

      console.log(`[Webhook] Processing invoiceId: ${invoiceId}, PaymentIntentId: ${paymentIntentId}`);

      if (invoiceId) {
        try {
          // Update main invoice status to paid
          const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: { paymentStatus: "paid", status: "paid", stripePaymentIntentId: paymentIntentId },
            include: {
              shares: {
                include: {
                  user: true
                }
              },
              collective: true,
              user: true // Invoice issuer
            }
          });
          console.log(`[Webhook] Invoice ${invoiceId} updated in DB. New status: ${updatedInvoice.status}, paymentStatus: ${updatedInvoice.paymentStatus}`);

          // Find and update all associated sub-invoices to paid
          const updatedSubInvoices = await prisma.subInvoice.updateMany({
            where: { parentInvoiceId: invoiceId },
            data: { paymentStatus: "paid", status: "paid" },
          });
          console.log(`[Webhook] Updated ${updatedSubInvoices.count} sub-invoices for invoice ${invoiceId} to paid.`);

          // CRITICAL: Distribute payments to collective members
          if (updatedInvoice.collectiveId && updatedInvoice.shares && updatedInvoice.shares.length > 0) {
            console.log(`[Webhook] Processing collective payment distribution for invoice ${invoiceId}`);
            
            await distributePymentsToCollectiveMembers(updatedInvoice, paymentIntentId);
          }

        } catch (dbError: any) {
          console.error(`[Webhook] Database update error for invoice ${invoiceId}:`, dbError.message || dbError);
          return new NextResponse("Database update error", { status: 500 });
        }
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse("ok", { status: 200 });
}
