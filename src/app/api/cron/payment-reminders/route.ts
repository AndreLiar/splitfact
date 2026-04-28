import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReminderEmail } from '@/lib/email-service';
import {
  computeNextReminderDate,
  isLastReminder,
  parseReminderSchedule,
} from '@/domains/invoices/reminder-schedule';

// GET /api/cron/payment-reminders
// Fires automatic payment reminders on the configured ladder.
// Called daily at 09:00 by Vercel cron (see vercel.json).
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();

  // Fetch eligible invoices — strict nextReminderAt <= now prevents double-firing
  const invoices = await prisma.invoice.findMany({
    where: {
      workflowStatus: 'issued',
      paymentStatus: { not: 'paid' },
      reminderEnabled: true,
      nextReminderAt: { lte: now },
      user: { reminderEnabled: true },
    },
    include: {
      client: { select: { email: true, name: true } },
      user: { select: { reminderSchedule: true } },
    },
    take: 50, // stay within cron timeout
    orderBy: { nextReminderAt: 'asc' },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const invoice of invoices) {
    const clientEmail = invoice.clientEmail ?? invoice.client?.email;

    if (!clientEmail) {
      // No email — exhaust the ladder so we don't re-check daily forever
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { nextReminderAt: null },
      });
      skipped++;
      continue;
    }

    const schedule = parseReminderSchedule(invoice.user?.reminderSchedule);
    const isFinal = isLastReminder(invoice.reminderCount, schedule);
    const daysOverdue = Math.floor(
      (now.getTime() - new Date(invoice.dueDate).getTime()) / 86_400_000
    );

    try {
      await sendReminderEmail({
        to: clientEmail,
        clientName: invoice.clientName ?? invoice.client?.name ?? 'Client',
        issuerName: invoice.issuerName,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        dueDate: invoice.dueDate,
        daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
        reminderCount: invoice.reminderCount,
        isMiseEnDemeure: isFinal,
      });

      const newCount = invoice.reminderCount + 1;
      const nextDate = computeNextReminderDate(invoice.dueDate, newCount, schedule);

      // Atomic update: count + nextDate in the same write — prevents reminder loops
      await prisma.$transaction([
        prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            reminderCount: newCount,
            lastReminderSentAt: now,
            nextReminderAt: nextDate, // null when ladder is exhausted
          },
        }),
        prisma.activityLog.create({
          data: {
            invoiceId: invoice.id,
            userId: invoice.userId,
            action: isFinal ? 'mise_en_demeure_sent' : 'reminder_sent',
            metadata: {
              auto: true,
              reminderCount: newCount,
              daysOverdue,
              clientEmail,
              nextReminderAt: nextDate?.toISOString() ?? null,
              isMiseEnDemeure: isFinal,
            },
          },
        }),
      ]);

      sent++;
    } catch (err: any) {
      errors.push(`${invoice.invoiceNumber}: ${err?.message ?? String(err)}`);
    }
  }

  console.log(`[payment-reminders] sent=${sent} skipped=${skipped} errors=${errors.length}`);

  return NextResponse.json({
    processed: invoices.length,
    sent,
    skipped,
    errors,
  });
}
