import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { computeNextReminderDate, parseReminderSchedule } from '@/domains/invoices/reminder-schedule';

// PATCH /api/invoices/[invoiceId]/reminders
// Enable or disable auto-reminders for a specific invoice.
// Body: { enabled: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;
  const body = await req.json();
  const enabled = Boolean(body.enabled);

  const [invoice, user] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      select: { id: true, dueDate: true, reminderCount: true, paymentStatus: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { reminderSchedule: true },
    }),
  ]);

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.paymentStatus === 'paid') {
    return NextResponse.json({ error: 'Cannot modify reminders on a paid invoice.' }, { status: 400 });
  }

  // When re-enabling, recompute next date from current count (don't restart from 0)
  const nextReminderAt = enabled
    ? computeNextReminderDate(
        invoice.dueDate,
        invoice.reminderCount,
        parseReminderSchedule(user?.reminderSchedule)
      )
    : null;

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { reminderEnabled: enabled, nextReminderAt },
    select: { id: true, reminderEnabled: true, nextReminderAt: true },
  });

  return NextResponse.json(updated);
}
