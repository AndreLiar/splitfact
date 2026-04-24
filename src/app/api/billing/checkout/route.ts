import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripePlatformCustomerId: true, subscriptionStatus: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Already active — send to portal instead
  if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
  }

  const { successUrl, cancelUrl } = await request.json().catch(() => ({} as Record<string, string>));

  let customerId = user.stripePlatformCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripePlatformCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl ?? `${process.env.NEXTAUTH_URL}/dashboard/settings?billing=success`,
    cancel_url: cancelUrl ?? `${process.env.NEXTAUTH_URL}/dashboard/settings?billing=cancelled`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId: session.user.id },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
