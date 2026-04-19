import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
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

    // Create a test notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'URSSAF_REMINDER',
        title: '🧪 Test: Rappel URSSAF mensuel',
        message: 'Ceci est une notification de test pour vérifier que le système fonctionne. CA estimé: 2,500€, Cotisations: 550€',
        actionUrl: '/dashboard/reports',
        metadata: {
          testData: true,
          cumulativeTurnover: 2500,
          estimatedUrssaf: 550,
          reminderType: 'monthly'
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      notification,
      message: 'Test notification created successfully'
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}