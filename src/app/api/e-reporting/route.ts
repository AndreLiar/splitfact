import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { aggregateEReportingData, buildEReportingXml } from '@/lib/e-reporting/generate';
import { submitInvoiceToPpf } from '@/lib/piste-api';
import { isPro } from '@/lib/subscription';

// GET /api/e-reporting?period=YYYY-MM  — fetch or generate period summary
// POST /api/e-reporting                 — generate + optionally submit a period
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period');
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: 'period param required (YYYY-MM)' }, { status: 400 });
  }

  // Return existing record if present
  const existing = await prisma.eReportingPeriod.findUnique({
    where: { userId_period: { userId: session.user.id, period } },
  });

  if (existing) return NextResponse.json(existing);

  // Otherwise aggregate on-the-fly
  const data = await aggregateEReportingData(session.user.id, period);
  if (!data) return NextResponse.json({ period, transactionCount: 0, status: 'draft' });

  return NextResponse.json({ ...data, status: 'draft' });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await isPro(session.user.id))) {
    return NextResponse.json(
      { error: 'E-reporting requires an InvoiceOps Pro plan.', upgrade: true },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { period, submit = false } = body as { period: string; submit?: boolean };

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: 'period required (YYYY-MM)' }, { status: 400 });
  }

  const data = await aggregateEReportingData(session.user.id, period);

  if (!data || data.transactionCount === 0) {
    return NextResponse.json({ error: 'No B2C invoices found for this period' }, { status: 404 });
  }

  const xml = buildEReportingXml(data);

  // Upsert the EReportingPeriod record
  const record = await prisma.eReportingPeriod.upsert({
    where: { userId_period: { userId: session.user.id, period } },
    create: {
      userId: session.user.id,
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
      status: 'ready',
      transactionCount: data.transactionCount,
      totalHT: data.totalHT,
      totalTVA: data.totalTVA,
      totalTTC: data.totalTTC,
      taxBreakdown: data.taxBreakdown as any,
      xmlPayload: xml,
    },
  });

  if (!submit) {
    return NextResponse.json({ ...record, xml });
  }

  // Submit to Chorus Pro
  const result = await submitInvoiceToPpf({
    invoiceNumber: `EREPORT-${period}-${data.issuerSiret}`,
    facturxXml: xml,
    sellerSiret: data.issuerSiret,
    buyerSiret: '',
    invoiceDate: `${period}-01`,
    totalAmount: data.totalTTC,
  });

  if (!result.success) {
    await prisma.eReportingPeriod.update({
      where: { id: record.id },
      data: { status: 'rejected', errorMessage: result.error },
    });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const updated = await prisma.eReportingPeriod.update({
    where: { id: record.id },
    data: {
      status: 'submitted',
      numeroFluxDepot: result.trackingId,
      submittedAt: new Date(),
      errorMessage: null,
    },
  });

  return NextResponse.json(updated);
}
