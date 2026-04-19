import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapPpfStatus, type PpfLifecycleStatus } from '@/lib/piste-api';
import { logActivity } from '@/lib/activity-log';

// POST /api/webhooks/ppf
// Receives lifecycle events from PISTE/Chorus Pro for submitted invoices.
// PISTE sends a JSON body with the invoice tracking ID and new status.
// Verify the shared secret via the X-PISTE-Webhook-Secret header.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-piste-webhook-secret');
  if (process.env.PISTE_WEBHOOK_SECRET && secret !== process.env.PISTE_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const event = body as {
    identifiantFactureCPP?: string;
    trackingId?: string;
    statutFacture?: PpfLifecycleStatus;
    status?: PpfLifecycleStatus;
    motifRefus?: string;
    rejectionReason?: string;
  };

  const trackingId = event.identifiantFactureCPP ?? event.trackingId;
  const newStatus = event.statutFacture ?? event.status;
  const rejectionReason = event.motifRefus ?? event.rejectionReason;

  if (!trackingId || !newStatus) {
    return NextResponse.json({ error: 'trackingId and status are required' }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { ppfTrackingId: trackingId },
    select: { id: true, userId: true, ppfStatus: true },
  });

  if (!invoice) {
    // Unknown tracking ID — acknowledge to avoid PISTE retries, log for inspection
    console.warn(`[ppf-webhook] Unknown trackingId: ${trackingId}`);
    return NextResponse.json({ received: true });
  }

  const mappedStatus = mapPpfStatus(newStatus);

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      ppfStatus: mappedStatus as any,
      ppfLastEventAt: new Date(),
      ppfError: rejectionReason ?? null,
    },
  });

  await logActivity({
    invoiceId: invoice.id,
    userId: invoice.userId,
    action: 'ppf_status_updated',
    metadata: { from: invoice.ppfStatus, to: mappedStatus, trackingId, rejectionReason },
  });

  // Surface rejection as a notification so the user sees it in the inbox
  if (newStatus === 'REJETEE' || newStatus === 'REFUSEE') {
    await prisma.notification.create({
      data: {
        userId: invoice.userId,
        type: 'GENERAL',
        title: newStatus === 'REJETEE' ? 'Facture rejetée par Chorus Pro' : 'Facture refusée par le client',
        message: rejectionReason
          ? `Motif : ${rejectionReason}`
          : 'Ouvrez la facture pour consulter le détail et soumettre une correction.',
        actionUrl: `/dashboard/invoices/${invoice.id}`,
        metadata: { trackingId, ppfStatus: mappedStatus },
      },
    });
  }

  return NextResponse.json({ received: true });
}
