import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ invoiceId: string  }> }) {
  const { invoiceId } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        user: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    if (!invoice.user.stripeAccountId) {
      return NextResponse.json({ error: 'The recipient of this invoice has not connected their Stripe account.' }, { status: 400 });
    }

    // Create a Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur', // Assuming EUR, can be dynamic
            product_data: {
              name: `Invoice ${invoice.invoiceNumber} for ${invoice.clientName}`,
              description: `Payment for invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(invoice.totalAmount.toNumber() * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/payment-success?invoiceId=${invoice.id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/invoices/${invoice.id}/pay?payment=cancelled`,
      metadata: {
        invoiceId: invoice.id, // Pass invoice ID to webhook
      },
    }, {
      stripeAccount: invoice.user.stripeAccountId,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating Stripe Checkout Session:', error);
    return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 });
  }
}
