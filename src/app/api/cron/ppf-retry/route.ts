import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submitInvoiceToPpf, mapPpfStatus } from '@/lib/piste-api';
import { buildFacturxXml } from '@/domains/invoices/facturx';
import { logActivity } from '@/domains/invoices/activity-log';

// GET /api/cron/ppf-retry
// Retries invoices stuck in pending_retry status.
// Called by Vercel cron (see vercel.json) every 30 minutes.
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const pending = await prisma.invoice.findMany({
    where: { ppfStatus: 'pending_retry' },
    include: { client: true, items: true },
    take: 20, // process at most 20 per run to stay within cron timeout
    orderBy: { ppfSubmittedAt: 'asc' },
  });

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let succeeded = 0;
  let failed = 0;

  for (const invoice of pending) {
    if (!invoice.facturxPdfUrl || !invoice.issuerSiret) {
      failed++;
      continue;
    }

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

    let pdfBuffer: Buffer;
    try {
      const pdfRes = await fetch(invoice.facturxPdfUrl);
      if (!pdfRes.ok) throw new Error(`PDF fetch ${pdfRes.status}`);
      pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    } catch {
      failed++;
      continue;
    }

    const result = await submitInvoiceToPpf({
      invoiceNumber: invoice.invoiceNumber,
      facturxPdfBuffer: pdfBuffer,
      facturxXml: xml,
      sellerSiret: invoice.issuerSiret,
      buyerSiret: invoice.clientSiret || invoice.client?.siret || '',
      invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
      totalAmount: Number(invoice.totalAmount),
    });

    if (result.success) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          ppfStatus: mapPpfStatus(result.status!) as any,
          ppfTrackingId: result.trackingId,
          ppfSubmittedAt: new Date(),
          ppfLastEventAt: new Date(),
          ppfError: null,
        },
      });
      await logActivity({
        invoiceId: invoice.id,
        userId: invoice.userId,
        action: 'ppf_retry_succeeded',
        metadata: { trackingId: result.trackingId },
      });
      succeeded++;
    } else {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { ppfError: result.error },
      });
      failed++;
    }
  }

  return NextResponse.json({ processed: pending.length, succeeded, failed });
}
