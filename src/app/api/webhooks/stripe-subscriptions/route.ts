import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

function planFromPriceId(priceId: string | null | undefined): string {
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'free';
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  // cancel_at is set when subscription is scheduled to cancel at period end
  const ts = sub.cancel_at ?? sub.billing_cycle_anchor;
  return ts ? new Date(ts * 1000) : null;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  const priceId = sub.items.data[0]?.price?.id ?? null;
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionId: sub.id,
      subscriptionStatus: sub.status,
      planId: planFromPriceId(priceId),
      subscriptionPeriodEnd: periodEnd(sub),
    },
  });
}

async function handleDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'canceled',
      planId: 'free',
      subscriptionPeriodEnd: periodEnd(sub),
    },
  });
}

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_PLATFORM_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
