import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all recurring invoice templates due today
  const recurringInvoices = await prisma.invoice.findMany({
    where: {
      isRecurring: true,
      nextRecurringDate: { lte: today },
      workflowStatus: { not: 'issued' },
    },
    include: { items: true },
  });

  const created: string[] = [];
  const errors: string[] = [];

  for (const template of recurringInvoices) {
    try {
      // Compute the next recurring date based on frequency
      const nextDate = new Date(template.nextRecurringDate ?? today);
      switch (template.recurringFrequency) {
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          nextDate.setMonth(nextDate.getMonth() + 1);
      }

      // Generate new invoice number with timestamp suffix
      const newInvoiceNumber = `${template.invoiceNumber}-R${Date.now().toString(36).toUpperCase()}`;
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const newInvoice = await prisma.invoice.create({
        data: {
          userId: template.userId,
          clientId: template.clientId,
          collectiveId: template.collectiveId,
          invoiceNumber: newInvoiceNumber,
          invoiceDate,
          dueDate,
          status: 'draft',
          workflowStatus: 'triggered',
          paymentStatus: 'pending',
          totalAmount: template.totalAmount,
          issuerName: template.issuerName,
          issuerAddress: template.issuerAddress,
          issuerSiret: template.issuerSiret,
          issuerTva: template.issuerTva,
          issuerLegalStatus: template.issuerLegalStatus,
          issuerShareCapital: template.issuerShareCapital,
          issuerApeCode: template.issuerApeCode,
          issuerRcs: template.issuerRcs,
          clientName: template.clientName,
          clientAddress: template.clientAddress,
          clientEmail: template.clientEmail,
          clientSiret: template.clientSiret,
          clientTvaNumber: template.clientTvaNumber,
          legalMentions: template.legalMentions,
          paymentTerms: template.paymentTerms,
          latePenaltyRate: template.latePenaltyRate,
          recoveryIndemnity: template.recoveryIndemnity,
          isRecurring: false,
          items: {
            create: template.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              tvaRate: item.tvaRate,
            })),
          },
        },
      });

      // Update template's next recurring date
      await prisma.invoice.update({
        where: { id: template.id },
        data: { nextRecurringDate: nextDate },
      });

      created.push(newInvoice.id);
    } catch (err: any) {
      errors.push(`${template.id}: ${err.message}`);
    }
  }

  return NextResponse.json({
    processed: recurringInvoices.length,
    created: created.length,
    errors,
    createdIds: created,
  });
}
