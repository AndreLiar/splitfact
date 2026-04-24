import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { submitInvoiceToPpf, mapPpfStatus } from '@/lib/piste-api';
import { buildFacturxXml } from '@/lib/facturx';
import { logActivity } from '@/lib/activity-log';
import { getUserPisteCredentials } from '@/lib/user-piste-credentials';
import { isPro } from '@/lib/subscription';

// POST /api/invoices/[invoiceId]/submit-ppf
// Deposits a Factur-X invoice to Chorus Pro via the PISTE API.
// The invoice must be in workflowStatus = "issued" and have a facturxPdfUrl.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await isPro(session.user.id))) {
    return NextResponse.json(
      { error: 'PPF submission requires an InvoiceOps Pro plan.', upgrade: true },
      { status: 403 }
    );
  }

  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    include: { client: true, items: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  if (invoice.workflowStatus !== 'issued') {
    return NextResponse.json(
      { error: 'La facture doit être émise avant dépôt sur Chorus Pro' },
      { status: 400 }
    );
  }

  if (!invoice.facturxPdfUrl) {
    return NextResponse.json(
      { error: 'Le PDF Factur-X doit être généré avant le dépôt' },
      { status: 400 }
    );
  }

  if (!invoice.issuerSiret) {
    return NextResponse.json(
      { error: 'Le SIRET émetteur est requis pour le dépôt sur Chorus Pro' },
      { status: 400 }
    );
  }

  const buyerSiret = invoice.clientSiret || invoice.client?.siret;
  if (!buyerSiret && invoice.transactionType === 'B2B') {
    return NextResponse.json(
      { error: 'Le SIRET client est requis pour une facture B2B' },
      { status: 400 }
    );
  }

  // Mark as pending before async operation
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { ppfStatus: 'pending_retry', ppfError: null },
  });

  // Rebuild XML from stored invoice data (Factur-X EXTENDED)
  const deliveryAddr = invoice.deliveryAddress
    ? (invoice.deliveryAddress as any)?.address ?? null
    : null;

  const xml = buildFacturxXml({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    currency: 'EUR',
    seller: {
      name: invoice.issuerName,
      address: invoice.issuerAddress,
      siret: invoice.issuerSiret,
      vatNumber: invoice.issuerTva,
    },
    buyer: {
      name: invoice.clientName || invoice.client?.name || 'Client',
      address: invoice.clientAddress || invoice.client?.address,
      siret: invoice.clientSiret || invoice.client?.siret,
      vatNumber: invoice.clientTvaNumber || invoice.client?.tvaNumber,
    },
    lines: invoice.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.tvaRate),
    })),
    totalAmount: Number(invoice.totalAmount),
    legalMentions: invoice.legalMentions,
    transactionType: invoice.transactionType as 'B2B' | 'B2C' | 'B2G',
    deliveryAddress: deliveryAddr,
    paymentTerms: invoice.paymentTerms,
    latePenaltyRate: invoice.latePenaltyRate,
    recoveryIndemnity: invoice.recoveryIndemnity != null ? Number(invoice.recoveryIndemnity) : null,
  });

  // Fetch the stored Factur-X PDF
  let pdfBuffer: Buffer;
  try {
    const pdfRes = await fetch(invoice.facturxPdfUrl);
    if (!pdfRes.ok) throw new Error(`PDF fetch failed: ${pdfRes.status}`);
    pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  } catch (err: any) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { ppfStatus: 'pending_retry', ppfError: `PDF fetch error: ${err.message}` },
    });
    return NextResponse.json({ error: `Impossible de récupérer le PDF: ${err.message}` }, { status: 500 });
  }

  // Resolve per-user credentials; fall back to platform env vars if not configured
  const userCreds = await getUserPisteCredentials(session.user.id) ?? undefined;

  // Submit to PISTE
  const result = await submitInvoiceToPpf({
    invoiceNumber: invoice.invoiceNumber,
    facturxPdfBuffer: pdfBuffer,
    facturxXml: xml,
    sellerSiret: invoice.issuerSiret,
    buyerSiret: buyerSiret ?? '',
    invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
    totalAmount: Number(invoice.totalAmount),
    credentials: userCreds ?? undefined,
  });

  if (!result.success) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { ppfStatus: 'pending_retry', ppfError: result.error },
    });

    await logActivity({
      invoiceId,
      userId: session.user.id,
      action: 'ppf_submission_failed',
      metadata: { error: result.error },
    });

    return NextResponse.json(
      { error: result.error ?? 'Échec du dépôt sur Chorus Pro' },
      { status: 502 }
    );
  }

  // Success — persist tracking ID and status
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      ppfStatus: mapPpfStatus(result.status!) as any,
      ppfTrackingId: result.trackingId,
      ppfSubmittedAt: new Date(),
      ppfLastEventAt: new Date(),
      ppfError: null,
    },
  });

  await logActivity({
    invoiceId,
    userId: session.user.id,
    action: 'ppf_submitted',
    metadata: { trackingId: result.trackingId, status: result.status },
  });

  return NextResponse.json({
    success: true,
    ppfStatus: updated.ppfStatus,
    ppfTrackingId: updated.ppfTrackingId,
    ppfSubmittedAt: updated.ppfSubmittedAt,
  });
}
