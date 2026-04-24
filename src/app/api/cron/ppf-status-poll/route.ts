import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPpfInvoiceStatus, mapPpfStatus, type PpfLifecycleStatus } from '@/lib/piste-api';
import { getUserPisteCredentials } from '@/lib/user-piste-credentials';
import { logActivity } from '@/lib/activity-log';

// GET /api/cron/ppf-status-poll
// Polls Chorus Pro for updated lifecycle status on in-flight invoices.
// Runs daily — registered in vercel.json as a Vercel cron.
// Only polls invoices in transient states (deposee, en_cours_de_routage, recue).
const POLL_STATUSES = ['deposee', 'en_cours_de_routage', 'recue'];
const TERMINAL_STATUSES = new Set(['approuvee', 'payee', 'rejetee', 'refusee']);

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { ppfStatus: { in: POLL_STATUSES as any }, ppfTrackingId: { not: null } },
    select: { id: true, userId: true, ppfTrackingId: true, ppfStatus: true },
    take: 50,
    orderBy: { ppfLastEventAt: 'asc' },
  });

  if (invoices.length === 0) return NextResponse.json({ polled: 0 });

  let updated = 0;
  let unchanged = 0;
  let errored = 0;

  for (const invoice of invoices) {
    const userCreds = await getUserPisteCredentials(invoice.userId);
    const result = await getPpfInvoiceStatus(invoice.ppfTrackingId!, userCreds ?? undefined);

    if (!result.success || !result.status) {
      errored++;
      continue;
    }

    const newMapped = mapPpfStatus(result.status as PpfLifecycleStatus);

    if (newMapped === invoice.ppfStatus) {
      unchanged++;
      continue;
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        ppfStatus: newMapped as any,
        ppfLastEventAt: new Date(),
        ppfError: result.rejectionReason ?? null,
      },
    });

    await logActivity({
      invoiceId: invoice.id,
      userId: invoice.userId,
      action: 'ppf_status_polled',
      metadata: { from: invoice.ppfStatus, to: newMapped, trackingId: invoice.ppfTrackingId },
    });

    // Notify on terminal rejection
    if (TERMINAL_STATUSES.has(newMapped) && (newMapped === 'rejetee' || newMapped === 'refusee')) {
      await prisma.notification.create({
        data: {
          userId: invoice.userId,
          type: 'GENERAL',
          title: newMapped === 'rejetee' ? 'Facture rejetée par Chorus Pro' : 'Facture refusée par le client',
          message: result.rejectionReason
            ? `Motif : ${result.rejectionReason}`
            : 'Consultez la facture pour voir le détail.',
          actionUrl: `/dashboard/invoices/${invoice.id}`,
          metadata: { trackingId: invoice.ppfTrackingId, ppfStatus: newMapped },
        },
      });
    }

    updated++;
  }

  return NextResponse.json({ polled: invoices.length, updated, unchanged, errored });
}
