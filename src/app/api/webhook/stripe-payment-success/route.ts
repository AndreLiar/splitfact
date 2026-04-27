import prisma from '@/lib/prisma';
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
  });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    console.error(`⚠️  Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      const paymentIntentId = session.payment_intent?.toString() || null;

      if (invoiceId) {
        try {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { paymentStatus: "paid", status: "paid", stripePaymentIntentId: paymentIntentId },
          });
        } catch (dbError: any) {
          console.error("[Webhook] Database update error for invoice", invoiceId, dbError.message || dbError);
          return new NextResponse("Database update error", { status: 500 });
        }
      }
      break;
    }
    default:
  }

  return new NextResponse("ok", { status: 200 });
}
