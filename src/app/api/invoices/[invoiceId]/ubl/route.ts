import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { buildUblXml } from '@/lib/ubl-serializer';

// GET /api/invoices/[invoiceId]/ubl — download UBL 2.1 XML for an invoice
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    include: { items: true, client: true },
  });

  if (!invoice) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });

  const totalHT = invoice.items.reduce(
    (s, i) => s + Number(i.unitPrice) * Number(i.quantity),
    0
  );
  const totalTVA = invoice.items.reduce(
    (s, i) => s + Number(i.unitPrice) * Number(i.quantity) * (Number(i.tvaRate) / 100),
    0
  );
  const totalTTC = totalHT + totalTVA;

  const xml = buildUblXml({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
    dueDate: invoice.dueDate.toISOString().split('T')[0],
    currency: 'EUR',
    seller: {
      name: invoice.issuerName,
      address: invoice.issuerAddress,
      siret: invoice.issuerSiret,
      vatNumber: invoice.issuerTva,
      countryCode: 'FR',
    },
    buyer: {
      name: invoice.clientName || invoice.client?.name || '',
      address: invoice.clientAddress || invoice.client?.address,
      siret: invoice.clientSiret || invoice.client?.siret,
      vatNumber: invoice.clientTvaNumber || invoice.client?.tvaNumber,
      countryCode: 'FR',
    },
    lines: invoice.items.map((item, i) => ({
      id: i + 1,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.tvaRate),
    })),
    totalHT,
    totalTVA,
    totalTTC,
    paymentTerms: invoice.paymentTerms,
    note: invoice.legalMentions,
  });

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}-ubl.xml"`,
    },
  });
}
