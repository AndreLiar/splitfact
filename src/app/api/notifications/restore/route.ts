import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// POST /api/notifications/restore - Restore sample notifications for users who had them before
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if user already has notifications
    const existingCount = await prisma.notification.count({
      where: { userId: user.id }
    });

    // If user has no notifications, create some sample ones (likely what they had before)
    if (existingCount === 0) {
      const sampleNotifications = [
        {
          userId: user.id,
          type: 'URSSAF_REMINDER' as const,
          title: 'Rappel déclaration URSSAF',
          message: 'Votre déclaration URSSAF mensuelle est due dans 5 jours. N\'oubliez pas de déclarer vos revenus.',
          actionUrl: '/dashboard/reports/urssaf',
          metadata: {
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'monthly'
          }
        },
        {
          userId: user.id,
          type: 'TVA_THRESHOLD_WARNING' as const,
          title: 'Seuil TVA approché',
          message: 'Attention : vous approchez du seuil de TVA (85 700€). Préparez-vous aux obligations TVA.',
          actionUrl: '/dashboard/assistant',
          metadata: {
            currentTurnover: 75000,
            thresholdRemaining: 10700
          }
        },
        {
          userId: user.id,
          type: 'GENERAL' as const,
          title: 'Optimisation fiscale disponible',
          message: 'Découvrez comment optimiser vos charges déductibles et réduire vos cotisations sociales.',
          actionUrl: '/dashboard/assistant',
          metadata: {
            potentialSavings: 1200,
            category: 'optimization'
          }
        }
      ];

      const createdNotifications = await prisma.notification.createMany({
        data: sampleNotifications
      });

      return NextResponse.json({
        success: true,
        message: `${createdNotifications.count} notifications restored`,
        count: createdNotifications.count
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `User already has ${existingCount} notifications`,
        count: existingCount
      });
    }

  } catch (error) {
    console.error('Error restoring notifications:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}