import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { NotificationService } from '@/lib/notification-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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

    const stats = await NotificationService.getQueueStats();

    const userQueue = await prisma.notificationQueue.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        status: true,
        attemptCount: true,
        maxAttempts: true,
        nextRetryAt: true,
        errorMessage: true,
        createdAt: true,
        processedAt: true
      }
    });

    return NextResponse.json({
      globalStats: stats,
      userQueue,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Queue Status] Error fetching queue status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}