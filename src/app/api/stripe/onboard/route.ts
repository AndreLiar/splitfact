import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
  });
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  try {
    let stripeAccountId = (await prisma.user.findUnique({ where: { id: userId } }))?.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: session.user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: stripeAccountId },
      });
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/settings?stripe_onboard=success&stripe_status=connected`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/settings?stripe_onboard=success&stripe_status=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Error during Stripe onboarding:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
