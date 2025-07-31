import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';

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

    console.log('[Test Notification Service] Testing notification service for user:', user.id);

    const testResult = await NotificationService.queueNotification({
      userId: user.id,
      type: 'GENERAL',
      title: '🧪 Test Notification - System Check',
      message: 'This is a test notification to verify the notification service is working correctly with retry mechanisms.',
      actionUrl: '/dashboard/notifications',
      metadata: {
        testType: 'service_verification',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      },
      maxAttempts: 3
    });

    const queueStats = await NotificationService.getQueueStats();

    return NextResponse.json({
      success: true,
      testResult,
      queueStats,
      message: 'Test notification created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Test Notification Service] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}