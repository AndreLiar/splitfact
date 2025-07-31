import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Get user's notifications
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
      console.log('[GET /api/notifications] User not found for email:', session.user.email);
      return new NextResponse('User not found', { status: 404 });
    }

    console.log(`[GET /api/notifications] Fetching notifications for user ID: ${user.id}`);

    const { searchParams } = new URL(request.url);
    const onlyUnread = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(onlyUnread && { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    console.log(`[GET /api/notifications] Found ${notifications.length} notifications for user ID: ${user.id}`);

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/notifications - Create a new notification (for testing)
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

    const body = await request.json();
    const { type, title, message, actionUrl, metadata } = body;

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: type || 'GENERAL',
        title,
        message,
        actionUrl,
        metadata,
      },
    });

    return NextResponse.json(notification);

  } catch (error) {
    console.error('Error creating notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}