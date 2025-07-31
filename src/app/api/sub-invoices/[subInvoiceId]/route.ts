import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subInvoiceId: string  }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subInvoiceId } = await params;

  try {
    const subInvoice = await prisma.subInvoice.findUnique({
      where: { id: subInvoiceId },
      include: {
        issuer: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
        parentInvoice: { 
          select: { 
            id: true, 
            invoiceNumber: true, 
            userId: true,
            collective: { select: { name: true } } 
          } 
        },
      },
    });

    if (!subInvoice) {
      return NextResponse.json({ error: 'Sub-invoice not found' }, { status: 404 });
    }

    // Check if user is authorized to view this sub-invoice
    // User can view if they are the issuer, receiver, or the owner of the parent invoice
    const canAccess = 
      subInvoice.issuerId === session.user.id || 
      subInvoice.receiverId === session.user.id ||
      subInvoice.parentInvoice.userId === session.user.id;

    if (!canAccess) {
      return NextResponse.json({ error: 'Unauthorized to view this sub-invoice' }, { status: 403 });
    }

    return NextResponse.json(subInvoice);
  } catch (error) {
    console.error('Error fetching sub-invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH method removed - Sub-invoice payment status is automatically managed 
// based on parent invoice payment status, no manual updates needed
