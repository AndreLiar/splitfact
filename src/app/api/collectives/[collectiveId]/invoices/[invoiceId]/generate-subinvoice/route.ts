import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateSubInvoices } from "@/lib/subInvoiceGenerator";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collectiveId: string; invoiceId: string  }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { collectiveId, invoiceId } = await params;

  try {
    const collective = await prisma.collective.findUnique({
      where: { id: collectiveId },
      include: {
        members: true,
      },
    });

    if (!collective) {
      return NextResponse.json({ error: 'Collective not found' }, { status: 404 });
    }

    const isCollectiveOwner = collective.members.some(
      (member) => member.userId === session.user.id && member.role === 'owner'
    );

    if (!isCollectiveOwner) {
      return NextResponse.json({ error: 'Forbidden: Only collective owners can generate sub-invoices' }, { status: 403 });
    }

    const result = await generateSubInvoices({ invoiceId, sessionUserId: session.user.id, collectiveId });

    if (!result) {
      return NextResponse.json({ error: 'Failed to generate sub-invoices' }, { status: 500 });
    }

    if (result.message === 'No sub-invoices to generate for this invoice.') {
      return NextResponse.json({ message: result.message }, { status: 200 });
    }

    return NextResponse.json(result.subInvoices, { status: 201 });
  } catch (error: any) {
    
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
