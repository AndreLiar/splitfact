import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { isPro } from '@/lib/subscription';

// GET /api/received-invoices?unread=true&limit=50&page=1
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!(await isPro(session.user.id))) {
    return NextResponse.json(
      { error: 'Received invoices (Chorus Pro) require an InvoiceOps Pro plan.', upgrade: true },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);

  const where = {
    userId: session.user.id,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.receivedInvoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        cppId: true,
        invoiceNumber: true,
        supplierName: true,
        supplierSiret: true,
        totalAmountTTC: true,
        currency: true,
        invoiceDate: true,
        depositedAt: true,
        ppfStatus: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.receivedInvoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, limit });
}

// PATCH /api/received-invoices — mark all as read
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!(await isPro(session.user.id))) {
    return NextResponse.json(
      { error: 'Received invoices (Chorus Pro) require an InvoiceOps Pro plan.', upgrade: true },
      { status: 403 }
    );
  }

  await prisma.receivedInvoice.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
