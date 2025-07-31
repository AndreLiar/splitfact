import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Resend } from 'resend';
import { getLegalMentionsByFiscalRegime } from '@/lib/utils';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || 'fake-api-key-for-build');

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
  collectiveId: z.string().nullable().transform(e => e === "" ? null : e).optional(),
  paymentTerms: z.string().optional(),
  latePenaltyRate: z.string().optional(),
  recoveryIndemnity: z.number().optional(),
  shares: z.array(z.object({
    userId: z.string(),
    shareType: z.enum(['percent', 'fixed']),
    shareValue: z.number(),
    description: z.string().optional(), // Add description to share schema
  })).optional(),
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
      collective: true,
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

    const { clientId, invoiceDate, dueDate, items, collectiveId, paymentTerms, latePenaltyRate, recoveryIndemnity, shares, clientName, clientAddress, clientSiret, clientTvaNumber, clientLegalStatus, clientShareCapital, clientContactName, clientEmail, clientPhone } = validation.data;

    // Calculate total amount first for validation
    const totalAmount = items.reduce((acc, item) => {
      const quantity = safeToNumber(item.quantity);
      const unitPrice = safeToNumber(item.unitPrice);
      const tvaRate = safeToNumber(item.tvaRate);
      return acc + quantity * unitPrice * (1 + tvaRate / 100);
    }, 0);

    // CRITICAL FIX: Validate shares before creating invoice
    if (shares && shares.length > 0) {
      const validateShares = (shares: any[], totalAmount: number) => {
        console.log('Validating shares:', shares, 'Total amount:', totalAmount);
        
        const percentShares = shares.filter(s => s.shareType === 'percent');
        const fixedShares = shares.filter(s => s.shareType === 'fixed');
        
        // Validate percentage shares don't exceed 100%
        const totalPercent = percentShares.reduce((sum, s) => sum + safeToNumber(s.shareValue), 0);
        if (totalPercent > 100) {
          throw new Error(`Total percentage shares (${totalPercent}%) cannot exceed 100%`);
        }
        
        // Validate fixed amounts don't exceed total
        const totalFixed = fixedShares.reduce((sum, s) => sum + safeToNumber(s.shareValue), 0);
        if (totalFixed > totalAmount) {
          throw new Error(`Total fixed shares (${totalFixed}€) cannot exceed invoice total (${totalAmount}€)`);
        }
        
        // Validate combined shares don't exceed total
        const percentAmount = (totalPercent / 100) * totalAmount;
        const combinedTotal = totalFixed + percentAmount;
        if (combinedTotal > totalAmount) {
          throw new Error(`Combined shares (${combinedTotal.toFixed(2)}€) cannot exceed invoice total (${totalAmount}€)`);
        }
        
        // Warn if shares don't add up to 100% (unless it's intentional)
        if (totalPercent < 100 && fixedShares.length === 0) {
          console.warn(`Warning: Percentage shares only add up to ${totalPercent}%. Remaining ${100 - totalPercent}% will stay with invoice issuer.`);
        }
        
        console.log('Share validation passed:', {
          totalPercent,
          totalFixed,
          percentAmount,
          combinedTotal,
          totalAmount
        });
      };
      
      validateShares(shares, totalAmount);
    }

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

    // Safe number parsing to prevent malformed currency values
    const safeToNumber = (value: any) => {
      if (value === null || value === undefined || value === '') return 0;
      if (typeof value === 'string') {
        // Clean any potential malformed string values like "5/000,00"
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

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        totalAmount,
        status: 'draft',
        userId: session.user.id,
        collectiveId,
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
        paymentTerms: paymentTerms || 'Paiement à 30 jours fin de mois',
        latePenaltyRate: latePenaltyRate || '3 fois le taux d’intérêt légal',
        recoveryIndemnity: recoveryIndemnity || 40.0,
        legalMentions,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: safeToNumber(item.quantity),
            unitPrice: safeToNumber(item.unitPrice),
            tvaRate: (user.fiscalRegime === "MicroBIC" || user.fiscalRegime === "BNC") ? 0 : safeToNumber(item.tvaRate), // Set TVA to 0 for Micro-Entrepreneurs
          })),
        },
        shares: {
          create: shares?.map(share => ({
            userId: share.userId,
            shareType: share.shareType,
            shareValue: safeToNumber(share.shareValue),
            description: share.description, // Save share description
            calculatedAmount: share.shareType === 'percent' ? totalAmount * (safeToNumber(share.shareValue) / 100) : safeToNumber(share.shareValue),
          })) || [],
        },
      },
      include: { // Include shares to process them after creation
        shares: true,
      },
    });

    

    // If collectiveId and shares are present, generate sub-invoices
    if (newInvoice.collectiveId && newInvoice.shares && newInvoice.shares.length > 0) {
      const subInvoicesToCreateWithShareId: Array<{ subInvoiceData: any; shareId: string; receiverEmail: string }> = [];

      // Fetch the lead freelancer's (session user's) profile to get their legal mentions
      const legalMentionsForSubInvoice = getLegalMentionsByFiscalRegime(user);

      for (const share of newInvoice.shares) {
        console.log("Processing share:", share);
        // Ensure sub-invoice is only created for members other than the invoice issuer
        if (share.userId !== session.user.id) {
          console.log("Share belongs to another user, preparing sub-invoice.");
          const receiverUser = await prisma.user.findUnique({
            where: { id: share.userId },
            select: { email: true },
          });

          if (receiverUser?.email) {
            const subInvoiceData = {
              issuerId: session.user.id, // The invoice issuer issues the sub-invoice
              receiverId: share.userId, // The collaborating freelancer receives the sub-invoice
              parentInvoiceId: newInvoice.id,
              amount: safeToNumber(share.calculatedAmount),
              status: "draft",
              description: share.description, // Pass share description to sub-invoice
              legalMentions: newInvoice.legalMentions, // Pass main invoice legal mentions to sub-invoice
            };
            console.log("Sub-invoice data prepared:", subInvoiceData);
            subInvoicesToCreateWithShareId.push({
              subInvoiceData,
              shareId: share.id,
              receiverEmail: receiverUser.email,
            });
          }
        }
      }

      if (subInvoicesToCreateWithShareId.length > 0) {
        await prisma.$transaction(async (prisma) => {
          const createdSubInvoices = await Promise.all(
            subInvoicesToCreateWithShareId.map((item) =>
              prisma.subInvoice.create({ data: item.subInvoiceData })
            )
          );

          for (let i = 0; i < createdSubInvoices.length; i++) {
            const createdSubInvoice = createdSubInvoices[i];
            const originalShareId = subInvoicesToCreateWithShareId[i].shareId;
            const receiverEmail = subInvoicesToCreateWithShareId[i].receiverEmail;

            await prisma.invoiceShare.update({
              where: { id: originalShareId },
              data: { autogeneratedInvoiceId: createdSubInvoice.id },
            });

            // Send email to the receiver of the sub-invoice
            try {
              // Skip email sending during build or if no API key
              if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'fake-api-key-for-build') {
                console.log('Skipping email send (no API key configured)');
              } else {
                await resend.emails.send({
                  from: 'kanmegneandre@gmail.com',
                  to: receiverEmail,
                  subject: 'You have a new sub-invoice!',
                  html: `<p>Hello,</p><p>You have a new sub-invoice from ${user.name}. You can view it in your dashboard.</p><p>Amount: ${createdSubInvoice.amount}</p><p>Description: ${createdSubInvoice.description}</p>`,
                });
                console.log(`Email sent to ${receiverEmail} for sub-invoice ${createdSubInvoice.id}`);
              }
            } catch (emailError) {
              console.error(`Error sending email to ${receiverEmail}:`, emailError);
            }
          }
        });
      }
    }

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    
    return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
  }
}