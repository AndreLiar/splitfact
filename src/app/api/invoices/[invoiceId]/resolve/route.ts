import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logActivity } from '@/domains/invoices/activity-log';


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;
  const body = await req.json().catch(() => ({}));
  const note: string = body.note ?? '';

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    select: { id: true, workflowStatus: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.workflowStatus !== 'blocked') {
    return NextResponse.json({ error: 'Invoice is not blocked' }, { status: 400 });
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      workflowStatus: 'collecting_data',
      facturxValidationErrors: undefined,
    },
  });

  await logActivity({
    invoiceId,
    userId: session.user.id,
    action: 'exception_resolved',
    metadata: { note, previousStatus: 'blocked' },
  });

  return NextResponse.json({ invoice: updated });
}
