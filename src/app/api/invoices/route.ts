import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getLegalMentionsByFiscalRegime } from '@/lib/utils';
import { evaluateInvoiceReadiness } from '@/lib/invoice-readiness';

const invoiceSchema = z.object({
  clientId: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    tvaRate: z.number(),
  })),
  transactionType: z.enum(['B2B', 'B2C', 'B2G']).default('B2B'),
  deliveryAddress: z.string().optional(),
  paymentTerms: z.string().optional(),
  latePenaltyRate: z.string().optional(),
  recoveryIndemnity: z.number().optional(),
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  clientSiret: z.string().optional(),
  clientTvaNumber: z.string().optional(),
  clientLegalStatus: z.string().optional(),
  clientShareCapital: z.string().optional(),
  clientContactName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure no caching for this API route
  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: {
      client: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(invoices, { headers: { 'Cache-Control': 'no-store' } });
}

export const revalidate = 0; // Opt out of caching for this route

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, siret: true, tvaNumber: true, fiscalRegime: true, address: true, legalStatus: true, rcsNumber: true, shareCapital: true, apeCode: true, microEntrepreneurType: true },
  });

  // Completeness Check for Micro-Entrepreneurs
  if (!user || !user.name || !user.siret || !user.address || !user.legalStatus || !user.apeCode ||
      ((user.fiscalRegime === "MicroBIC" || user.fiscalRegime === "BNC") && !user.microEntrepreneurType)) {
    return NextResponse.json({ error: 'User profile is incomplete. Please provide your name, SIRET, address, legal status, APE Code, and Micro-Entrepreneur Type (if applicable) in your profile.' }, { status: 400 });
  }

  const legalMentions = getLegalMentionsByFiscalRegime(user);

  try {
    const body = await req.json();
    const validation = invoiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { clientId, invoiceDate, dueDate, transactionType, deliveryAddress, items, paymentTerms, latePenaltyRate, recoveryIndemnity, clientName, clientAddress, clientSiret, clientTvaNumber, clientLegalStatus, clientShareCapital, clientContactName, clientEmail, clientPhone } = validation.data;

    // Safe number parsing to prevent malformed currency values
    const safeToNumber = (value: any) => {
      if (value === null || value === undefined || value === '') return 0;
      if (typeof value === 'string') {
        const cleanValue = value.replace(/(\d+)\/(\d{3}),(\d{2})/g, '$1$2.$3')
                                .replace(/(\d+)\/(\d{3})/g, '$1$2')
                                .replace(',', '.')
                                .replace(/[^0-9.-]/g, '');
        const numValue = Number(cleanValue);
        return isNaN(numValue) ? 0 : numValue;
      }
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : numValue;
    };

    // Calculate total amount
    const totalAmount = items.reduce((acc, item) => {
      const quantity = safeToNumber(item.quantity);
      const unitPrice = safeToNumber(item.unitPrice);
      const tvaRate = safeToNumber(item.tvaRate);
      return acc + quantity * unitPrice * (1 + tvaRate / 100);
    }, 0);

    // Auto-generate invoice number
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = "INV";

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        userId: session.user.id,
        invoiceNumber: { startsWith: `${prefix}-${year}${month}` },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      select: { invoiceNumber: true },
    });

    let nextSequentialNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.slice(-4));
      nextSequentialNumber = lastNumber + 1;
    }

    const invoiceNumber = `${prefix}-${year}${month}-${nextSequentialNumber.toString().padStart(4, '0')}`;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { siretValidated: true },
    });

    const readiness = evaluateInvoiceReadiness({
      clientName,
      clientAddress,
      clientSiret,
      clientSiretValidated: client?.siretValidated ?? false,
      transactionType,
      invoiceDate,
      dueDate,
      issuerName: user.name,
      issuerAddress: user.address,
      issuerSiret: user.siret,
      paymentTerms,
      latePenaltyRate,
      legalMentions,
      items: items.map((item) => ({
        description: item.description,
        quantity: safeToNumber(item.quantity),
        unitPrice: safeToNumber(item.unitPrice),
      })),
    });

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        totalAmount,
        transactionType,
        deliveryAddress: deliveryAddress ? { address: deliveryAddress } : undefined,
        status: ‘draft’,
        workflowStatus: readiness.status === ‘ready’ ? ‘ready_for_review’ : ‘blocked’,
        userId: session.user.id,
        clientId,
        clientName,
        clientAddress,
        clientSiret,
        clientTvaNumber,
        clientLegalStatus,
        clientShareCapital,
        clientContactName,
        clientEmail,
        clientPhone,
        issuerName: user.name,
        issuerAddress: user.address,
        issuerSiret: user.siret,
        issuerTva: user.tvaNumber,
        issuerRcs: user.rcsNumber,
        issuerLegalStatus: user.legalStatus,
        issuerShareCapital: user.shareCapital,
        issuerApeCode: user.apeCode,
        paymentTerms: paymentTerms || ‘Paiement à 30 jours fin de mois’,
        latePenaltyRate: latePenaltyRate || ‘3 fois le taux d’intérêt légal’,
        recoveryIndemnity: recoveryIndemnity || 40.0,
        legalMentions,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: safeToNumber(item.quantity),
            unitPrice: safeToNumber(item.unitPrice),
            tvaRate: (user.fiscalRegime === "MicroBIC" || user.fiscalRegime === "BNC") ? 0 : safeToNumber(item.tvaRate),
          })),
        },
      },
    });

    return NextResponse.json({
      ...newInvoice,
      readiness,
    }, { status: 201 });
  } catch (error: any) {
    
    return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
  }
}
