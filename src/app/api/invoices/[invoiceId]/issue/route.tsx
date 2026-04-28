import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import cloudinary from '@/lib/cloudinary';
import { evaluateInvoiceReadiness } from '@/domains/invoices/invoice-readiness';
import { generateFacturxDocument } from '@/domains/invoices/facturx';
import { logActivity } from '@/domains/invoices/activity-log';
import { sendInvoiceEmail } from '@/lib/email-service';
import { renderInvoicePdfBuffer } from '@/lib/facturx-pdf-generator';

const safeToNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 0;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

async function uploadRawAsset(dataUri: string, folder: string, publicId: string) {
  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    resource_type: 'raw',
    overwrite: true,
  });

  return uploadResult.secure_url;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      include: { client: true, items: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const readiness = evaluateInvoiceReadiness({
      clientName: invoice.clientName || invoice.client?.name,
      clientAddress: invoice.clientAddress || invoice.client?.address,
      clientSiret: invoice.clientSiret || invoice.client?.siret,
      clientSiretValidated: invoice.client?.siretValidated ?? false,
      transactionType: invoice.transactionType,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      issuerName: invoice.issuerName,
      issuerAddress: invoice.issuerAddress,
      issuerSiret: invoice.issuerSiret,
      paymentTerms: invoice.paymentTerms,
      latePenaltyRate: invoice.latePenaltyRate,
      legalMentions: invoice.legalMentions,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: safeToNumber(item.quantity),
        unitPrice: safeToNumber(item.unitPrice),
      })),
      btpInvoiceType: (invoice as any).btpInvoiceType as 'standard' | 'situation' | 'autoliquidation' | null,
      situationNumber: (invoice as any).situationNumber ?? null,
      referenceContract: (invoice as any).referenceContract ?? null,
    });

    if (readiness.status === 'blocked') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          workflowStatus: 'blocked',
          facturxStatus: 'not_started',
          facturxValidationErrors: readiness.blockingReasons as any,
        },
      });
      await logActivity({
        invoiceId: invoice.id,
        userId: session.user.id,
        action: 'blocked',
        metadata: { reasons: readiness.blockingReasons },
      });

      return NextResponse.json({
        error: "La facture n'est pas prête à être émise.",
        readiness,
      }, { status: 400 });
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        workflowStatus: 'ready_to_issue',
        facturxStatus: 'generating',
        facturxValidationErrors: [],
      },
    });

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderInvoicePdfBuffer(invoice);
    } catch (e: unknown) {
      let msg: string;
      try { msg = JSON.stringify(e); } catch { msg = String(e); }
      return NextResponse.json({ error: `PDF render failed: ${msg}`, step: 'pdf' }, { status: 500 });
    }

    const deliveryAddr = invoice.deliveryAddress
      ? (invoice.deliveryAddress as any)?.address ?? null
      : null;

    const facturx = await generateFacturxDocument({
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
        quantity: safeToNumber(item.quantity),
        unitPrice: safeToNumber(item.unitPrice),
        taxRate: safeToNumber(item.tvaRate),
      })),
      totalAmount: safeToNumber(invoice.totalAmount),
      legalMentions: invoice.legalMentions,
      transactionType: (invoice.transactionType as 'B2B' | 'B2C' | 'B2G') ?? 'B2B',
      deliveryAddress: deliveryAddr,
      paymentTerms: invoice.paymentTerms,
      latePenaltyRate: invoice.latePenaltyRate,
      recoveryIndemnity: invoice.recoveryIndemnity != null ? safeToNumber(invoice.recoveryIndemnity) : null,
      btpInvoiceType: (invoice as any).btpInvoiceType as 'standard' | 'situation' | 'autoliquidation' | null ?? null,
      retenueGarantieAmount: (invoice as any).retenueGarantieAmount != null ? safeToNumber((invoice as any).retenueGarantieAmount) : null,
      situationNumber: (invoice as any).situationNumber ?? null,
      referenceContract: (invoice as any).referenceContract ?? null,
      previousCumulativeAmount: (invoice as any).previousCumulativeAmount != null ? safeToNumber((invoice as any).previousCumulativeAmount) : null,
      previousInvoiceNumber: null,
    }, pdfBuffer);

    if (!facturx.success) {
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          workflowStatus: 'ready_for_review',
          facturxStatus: 'validation_failed',
          facturxValidationErrors: facturx.validationErrors,
        },
        include: { client: true, items: true },
      });

      await logActivity({
        invoiceId: invoice.id,
        userId: session.user.id,
        action: 'facturx_failed',
        metadata: { errors: facturx.validationErrors },
      });

      return NextResponse.json({
        error: 'La génération Factur-X a échoué.',
        invoice: updatedInvoice,
        readiness,
        facturxValidationErrors: facturx.validationErrors,
      }, { status: 422 });
    }

    let pdfUrl: string | null = invoice.pdfUrl ?? null;
    let facturxPdfUrl: string | null = invoice.facturxPdfUrl ?? null;
    let facturxXmlUrl: string | null = invoice.facturxXmlUrl ?? null;

    if (process.env.CLOUDINARY_CLOUD_NAME?.trim() && process.env.CLOUDINARY_API_KEY?.trim() && process.env.CLOUDINARY_API_SECRET?.trim()) {
      try {
        pdfUrl = await uploadRawAsset(
          `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
          'invoices',
          `invoice-${invoice.id}`
        );

        facturxPdfUrl = await uploadRawAsset(
          `data:application/pdf;base64,${facturx.pdf.toString('base64')}`,
          'facturx',
          `facturx-${invoice.id}`
        );

        facturxXmlUrl = await uploadRawAsset(
          `data:text/xml;base64,${Buffer.from(facturx.xml, 'utf8').toString('base64')}`,
          'facturx',
          `facturx-${invoice.id}-xml`
        );
      } catch (e: unknown) {
        // Non-fatal: log but don't block invoice issuance — URLs will remain null
        const detail = (() => { try { return JSON.stringify(e); } catch { return String(e); } })();
        console.error('Cloudinary upload failed (non-fatal):', detail);
      }
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'sent',
        workflowStatus: 'issued',
        issuedAt: new Date(),
        pdfUrl,
        facturxPdfUrl,
        facturxXmlUrl,
        facturxStatus: 'generated',
        facturxGeneratedAt: new Date(),
        facturxValidationErrors: [],
      },
      include: { client: true, items: true },
    });

    await logActivity({
      invoiceId: invoice.id,
      userId: session.user.id,
      action: 'issued',
      metadata: {
        facturxStatus: 'generated',
        facturxPdfUrl,
        facturxXmlUrl,
        issuedAt: new Date().toISOString(),
      },
    });

    // Send invoice email to client (best-effort — don't fail the whole request)
    const clientEmail = updatedInvoice.clientEmail ?? updatedInvoice.client?.email;
    if (clientEmail) {
      sendInvoiceEmail({
        to: clientEmail,
        clientName: updatedInvoice.clientName ?? updatedInvoice.client?.name ?? 'Client',
        issuerName: updatedInvoice.issuerName,
        invoiceNumber: updatedInvoice.invoiceNumber,
        invoiceId: updatedInvoice.id,
        totalAmount: safeToNumber(updatedInvoice.totalAmount),
        dueDate: updatedInvoice.dueDate,
        facturxPdfUrl,
        pdfUrl,
      }).catch((err) => console.error('Failed to send invoice email:', err));
    }

    return NextResponse.json({
      invoice: updatedInvoice,
      readiness,
    });
  } catch (error) {
    const msg = error instanceof Error
      ? error.message
      : (() => { try { return JSON.stringify(error); } catch { return String(error); } })();
    console.error('Error issuing invoice:', msg, error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
