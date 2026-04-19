import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subInvoices = await prisma.subInvoice.findMany({
      where: { receiverId: session.user.id },
      include: {
        issuer: { select: { name: true, email: true } },
        parentInvoice: { select: { invoiceNumber: true, collective: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(subInvoices);
  } catch (error) {
    console.error('Error fetching sub-invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
