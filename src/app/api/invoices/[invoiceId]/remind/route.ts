import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logActivity } from '@/lib/activity-log';
import { sendReminderEmail } from '@/lib/email-service';


export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    include: { client: { select: { email: true, name: true } } },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.workflowStatus !== 'issued' && invoice.status !== 'sent') {
    return NextResponse.json(
      { error: "La facture n'a pas encore été émise. Émettez-la avant d'envoyer un rappel." },
      { status: 400 }
    );
  }

  const clientEmail = invoice.clientEmail ?? invoice.client?.email;
  if (!clientEmail) {
    return NextResponse.json({ error: "Aucun email client disponible pour envoyer le rappel." }, { status: 400 });
  }

  const daysOverdue = invoice.dueDate
    ? Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86_400_000)
    : 0;

  // Fire-and-forget — don't let email failure block the response
  sendReminderEmail({
    to: clientEmail,
    clientName: invoice.clientName ?? invoice.client?.name ?? 'Client',
    issuerName: invoice.issuerName,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: Number(invoice.totalAmount),
    dueDate: invoice.dueDate,
    daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
  }).catch((err) => console.error('Failed to send reminder email:', err));

  await logActivity({
    invoiceId,
    userId: session.user.id,
    action: 'reminder_sent',
    metadata: {
      clientEmail,
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate,
      daysOverdue,
      sentAt: new Date().toISOString(),
    },
  });

  return NextResponse.json({ success: true, message: 'Rappel envoyé.' });
}
