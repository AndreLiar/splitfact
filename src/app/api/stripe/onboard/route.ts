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

  const userId = session.user.id;
  console.log("Stripe Onboard: Processing for userId:", userId);

  try {
    let stripeAccountId = (await prisma.user.findUnique({ where: { id: userId } }))?.stripeAccountId;
    console.log("Stripe Onboard: Existing stripeAccountId from DB:", stripeAccountId);

    if (!stripeAccountId) {
      // Create a new Stripe Connect account for the user
      console.log("Stripe Onboard: No existing Stripe account, creating new one...");
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR", // Assuming France for now, can be dynamic
        email: session.user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;
      console.log("Stripe Onboard: New Stripe account created with ID:", stripeAccountId);

      // Save the Stripe account ID to the user in your database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: stripeAccountId },
      });
      console.log("Stripe Onboard: User updated in DB with stripeAccountId:", updatedUser.stripeAccountId);
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/profile?stripe_onboard=success&stripe_status=connected`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/profile?stripe_onboard=success&stripe_status=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Error during Stripe onboarding:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
