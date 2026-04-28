import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getPpfInvoiceStatus, mapPpfStatus, type PpfLifecycleStatus } from '@/lib/piste-api';
import { getUserPisteCredentials } from '@/lib/user-piste-credentials';
import { logActivity } from '@/domains/invoices/activity-log';
import { isPro } from '@/lib/subscription';

const POLLABLE_STATUSES = ['deposee', 'en_cours_de_routage', 'recue'];

// GET /api/invoices/[invoiceId]/ppf-status
// On-demand single-invoice PPF status refresh (Pro-gated).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;

  const pro = await isPro(session.user.id);
  if (!pro) {
    return NextResponse.json({ error: 'Plan Pro requis.' }, { status: 402 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    select: { id: true, ppfStatus: true, ppfTrackingId: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (!invoice.ppfTrackingId) {
    return NextResponse.json({ error: 'Aucun identifiant de suivi PPF — la facture n\'a pas encore été déposée.' }, { status: 400 });
  }

  if (!POLLABLE_STATUSES.includes(invoice.ppfStatus ?? '')) {
    return NextResponse.json({
      ppfStatus: invoice.ppfStatus,
      changed: false,
      message: 'Statut terminal — aucune mise à jour possible.',
    });
  }

  const creds = await getUserPisteCredentials(session.user.id);

  if (!creds) {
    return NextResponse.json({ error: 'Aucun credential Chorus Pro configuré. Renseignez-les dans Paramètres → Chorus Pro.' }, { status: 400 });
  }

  const result = await getPpfInvoiceStatus(invoice.ppfTrackingId, creds);

  if (!result.success || !result.status) {
    return NextResponse.json({
      error: result.error ?? 'Échec de la requête PISTE.',
      ppfStatus: invoice.ppfStatus,
      changed: false,
    }, { status: 502 });
  }

  const newStatus = mapPpfStatus(result.status as PpfLifecycleStatus);

  if (newStatus === invoice.ppfStatus) {
    return NextResponse.json({ ppfStatus: invoice.ppfStatus, changed: false });
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      ppfStatus: newStatus as any,
      ppfLastEventAt: new Date(),
      ppfError: result.rejectionReason ?? null,
    },
  });

  await logActivity({
    invoiceId: invoice.id,
    userId: session.user.id,
    action: 'ppf_status_updated',
    metadata: { from: invoice.ppfStatus, to: newStatus },
  });

  return NextResponse.json({
    ppfStatus: updated.ppfStatus,
    ppfLastEventAt: updated.ppfLastEventAt,
    ppfError: updated.ppfError,
    changed: true,
  });
}
