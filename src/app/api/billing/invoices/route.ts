import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export interface StripeInvoiceItem {
  id: string;
  number: string | null;
  status: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  created: number;
  periodStart: number;
  periodEnd: number;
  invoicePdf: string | null;
  hostedUrl: string | null;
}

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripePlatformCustomerId: true },
    });

    if (!user?.stripePlatformCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
    const stripeInvoices = await stripe.invoices.list({
      customer: user.stripePlatformCustomerId,
      limit: 24,
    });

    const invoices: StripeInvoiceItem[] = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amountPaid: inv.amount_paid,
      amountDue: inv.amount_due,
      currency: inv.currency,
      created: inv.created,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      invoicePdf: inv.invoice_pdf ?? null,
      hostedUrl: inv.hosted_invoice_url ?? null,
    }));

    return NextResponse.json({ invoices });
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Billing invoices error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
