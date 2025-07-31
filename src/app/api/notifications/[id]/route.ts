import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const { id } = await params;
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
    const { isRead } = body;

    const notification = await prisma.notification.updateMany({
      where: {
        id: id,
        userId: user.id, // Ensure user can only update their own notifications
      },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
    });

    if (notification.count === 0) {
      return new NextResponse('Notification not found', { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const { id } = await params;
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

    const deletedNotification = await prisma.notification.deleteMany({
      where: {
        id: id,
        userId: user.id, // Ensure user can only delete their own notifications
      },
    });

    if (deletedNotification.count === 0) {
      return new NextResponse('Notification not found', { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}