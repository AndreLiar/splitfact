import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ invoiceId: string  }> }) {
  const { invoiceId } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        dueDate: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        clientName: true,
        clientAddress: true,
        clientSiret: true,
        clientTvaNumber: true,
        clientLegalStatus: true,
        clientShareCapital: true,
        clientContactName: true,
        clientEmail: true,
        clientPhone: true,
        issuerName: true,
        issuerAddress: true,
        issuerSiret: true,
        issuerTva: true,
        issuerRcs: true,
        issuerLegalStatus: true,
        issuerShareCapital: true,
        issuerApeCode: true,
        paymentTerms: true,
        latePenaltyRate: true,
        recoveryIndemnity: true,
        legalMentions: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only return essential details for public view
    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      clientName: invoice.clientName,
      clientAddress: invoice.clientAddress,
      clientSiret: invoice.clientSiret,
      clientTvaNumber: invoice.clientTvaNumber,
      clientLegalStatus: invoice.clientLegalStatus,
      clientShareCapital: invoice.clientShareCapital,
      clientContactName: invoice.clientContactName,
      clientEmail: invoice.clientEmail,
      clientPhone: invoice.clientPhone,
      issuerName: invoice.issuerName,
      issuerAddress: invoice.issuerAddress,
      issuerSiret: invoice.issuerSiret,
      issuerTva: invoice.issuerTva,
      issuerRcs: invoice.issuerRcs,
      issuerLegalStatus: invoice.issuerLegalStatus,
      issuerShareCapital: invoice.issuerShareCapital,
      issuerApeCode: invoice.issuerApeCode,
      paymentTerms: invoice.paymentTerms,
      latePenaltyRate: invoice.latePenaltyRate,
      recoveryIndemnity: invoice.recoveryIndemnity,
      legalMentions: invoice.legalMentions,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tvaRate: item.tvaRate,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching public invoice details:', error);
    return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 });
  }
}
