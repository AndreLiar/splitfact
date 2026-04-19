import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aggregateEReportingData, buildEReportingXml } from '@/lib/e-reporting/generate';
import { submitInvoiceToPpf } from '@/lib/piste-api';

// POST /api/cron/e-reporting
// Runs on the 1st of each month — auto-submits e-reporting for the previous month.
// Protected by CRON_SECRET.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Previous month
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  // Find all users who have B2C invoices in the period that haven't been reported yet
  const users = await prisma.user.findMany({
    where: {
      invoices: {
        some: {
          transactionType: 'B2C',
          workflowStatus: 'issued',
          invoiceDate: {
            gte: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1),
            lt: new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1),
          },
        },
      },
      eReportingPeriods: {
        none: {
          period,
          status: { in: ['submitted', 'accepted'] },
        },
      },
    },
    select: { id: true },
  });

  const results: { userId: string; status: string; trackingId?: string; error?: string }[] = [];

  for (const user of users) {
    try {
      const data = await aggregateEReportingData(user.id, period);
      if (!data || data.transactionCount === 0) continue;

      const xml = buildEReportingXml(data);

      const record = await prisma.eReportingPeriod.upsert({
        where: { userId_period: { userId: user.id, period } },
        create: {
          userId: user.id,
          period,
          status: 'ready',
          transactionCount: data.transactionCount,
          totalHT: data.totalHT,
          totalTVA: data.totalTVA,
          totalTTC: data.totalTTC,
          taxBreakdown: data.taxBreakdown as any,
          xmlPayload: xml,
        },
        update: {
          xmlPayload: xml,
          transactionCount: data.transactionCount,
          totalHT: data.totalHT,
          totalTVA: data.totalTVA,
          totalTTC: data.totalTTC,
          taxBreakdown: data.taxBreakdown as any,
        },
      });

      const result = await submitInvoiceToPpf({
        invoiceNumber: `EREPORT-${period}-${data.issuerSiret}`,
        facturxXml: xml,
        sellerSiret: data.issuerSiret,
        buyerSiret: '',
        invoiceDate: `${period}-01`,
        totalAmount: data.totalTTC,
      });

      if (result.success) {
        await prisma.eReportingPeriod.update({
          where: { id: record.id },
          data: {
            status: 'submitted',
            numeroFluxDepot: result.trackingId,
            submittedAt: new Date(),
            errorMessage: null,
          },
        });
        results.push({ userId: user.id, status: 'submitted', trackingId: result.trackingId });
      } else {
        await prisma.eReportingPeriod.update({
          where: { id: record.id },
          data: { status: 'rejected', errorMessage: result.error },
        });
        results.push({ userId: user.id, status: 'failed', error: result.error });
      }
    } catch (err: any) {
      results.push({ userId: user.id, status: 'error', error: err?.message });
    }
  }

  return NextResponse.json({ period, processed: results.length, results });
}
