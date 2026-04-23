import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// PATCH /api/received-invoices/[id] — mark as read
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = params;
  const inv = await prisma.receivedInvoice.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!inv) return new NextResponse('Not found', { status: 404 });

  await prisma.receivedInvoice.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}

// GET /api/received-invoices/[id] — fetch detail + XML
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = params;
  const inv = await prisma.receivedInvoice.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      cppId: true,
      invoiceNumber: true,
      supplierName: true,
      supplierSiret: true,
      buyerSiret: true,
      totalAmountTTC: true,
      ppfStatus: true,
      depositedAt: true,
      rawXml: true,
      isRead: true,
    },
  });
  if (!inv) return new NextResponse('Not found', { status: 404 });

  return NextResponse.json(inv);
}
