import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string  }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;

  try {
    // Check if user has access to the invoice first
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, userId: session.user.id },
      select: { id: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const subInvoices = await prisma.subInvoice.findMany({
      where: { parentInvoiceId: invoiceId },
      include: {
        receiver: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(subInvoices);
  } catch (error) {
    console.error('Error fetching sub-invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
