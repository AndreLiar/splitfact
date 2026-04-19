import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { collectiveId, profile, teamMembers } = await request.json();

    // Store the onboarding data for analytics and personalization
    const onboardingData = {
      userId: session.user.id,
      collectiveId,
      agencyProfile: profile,
      teamSetup: teamMembers,
      completedAt: new Date(),
      source: 'agency-onboarding'
    };

    // You could store this in a separate table for analytics
    // For now, we'll add metadata to the collective
    await prisma.collective.update({
      where: { id: collectiveId },
      data: {
        description: `${profile.agencyName} - ${profile.agencyType} agency serving ${profile.clientTypes.join(', ')} with ${profile.teamSize} team members targeting ${profile.monthlyRevenue} monthly revenue`
      }
    });

    // Create a welcome notification for the user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'GENERAL',
        title: `🎉 Bienvenue dans Splitfact Premium!`,
        message: `Votre agence "${profile.agencyName}" est maintenant configurée. Votre équipe va recevoir leurs invitations par email.`,
        metadata: {
          onboardingCompleted: true,
          agencyType: profile.agencyType,
          teamSize: teamMembers.length
        }
      }
    });

    // Log successful onboarding for analytics
    console.log(`Agency onboarding completed for user ${session.user.id}:`, {
      agencyName: profile.agencyName,
      agencyType: profile.agencyType,
      teamSize: teamMembers.length,
      monthlyRevenue: profile.monthlyRevenue,
      clientTypes: profile.clientTypes.length,
      painPoints: profile.painPoints.length,
      goals: profile.goals.length
    });

    return NextResponse.json({ 
      success: true, 
      message: "Onboarding completed successfully",
      collectiveId 
    });

  } catch (error) {
    console.error("Error completing agency onboarding:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}