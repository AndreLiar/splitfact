import { renderToStream } from '@react-pdf/renderer';
import InvoicePdf from '@/app/components/InvoicePdf';
import { generateFacturxDocument } from '@/domains/invoices/facturx';

const safeToNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 0;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

export async function renderInvoicePdfBuffer(invoice: any): Promise<Buffer> {
  const doc = <InvoicePdf invoice={invoice} />;
  const stream = await renderToStream(doc);
  return new Promise<Buffer>((resolve, reject) => {
    const buffers: Uint8Array[] = [];
    stream.on('data', (chunk) => buffers.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
    stream.on('error', (error) => reject(error));
  });
}

export async function generateFacturxInMemory(invoice: any): Promise<Buffer> {
  const pdfBuffer = await renderInvoicePdfBuffer(invoice);

  const deliveryAddr = invoice.deliveryAddress
    ? (invoice.deliveryAddress as any)?.address ?? null
    : null;

  const result = await generateFacturxDocument(
    {
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
      lines: invoice.items.map((item: any) => ({
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
    },
    pdfBuffer
  );

  if (!result.success || !result.pdf) {
    throw new Error(`Factur-X generation failed: ${result.validationErrors.join(', ')}`);
  }

  return result.pdf;
}
