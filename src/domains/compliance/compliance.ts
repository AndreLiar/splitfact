/**
 * Compliance scoring and penalty calculation service.
 * Penalty: €15/invoice not submitted to PPF (art. 1737 II CGI), capped at €45,000/year.
 */

import prisma from '@/lib/prisma';

const PENALTY_PER_INVOICE = 15;
const ANNUAL_CAP = 45_000;

export interface ComplianceScore {
  score: number;          // 0–100
  level: 'green' | 'warning' | 'red';
  penaltyExposure: number;
  issuedTotal: number;
  submittedToPpf: number;
  pendingSubmission: number;
  unreportedB2C: number;
}

export async function computeComplianceScore(userId: string): Promise<ComplianceScore> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  // All issued invoices this year
  const issued = await prisma.invoice.findMany({
    where: { userId, workflowStatus: 'issued', issuedAt: { gte: yearStart } },
    select: { id: true, transactionType: true, ppfStatus: true },
  });

  const b2bB2g = issued.filter((i) => i.transactionType !== 'B2C');
  const b2c = issued.filter((i) => i.transactionType === 'B2C');

  const submittedToPpf = b2bB2g.filter((i) =>
    i.ppfStatus && !['not_submitted', 'pending_retry'].includes(i.ppfStatus)
  ).length;

  const pendingSubmission = b2bB2g.length - submittedToPpf;

  // Check e-reporting for B2C
  const currentPeriod = (() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  })();

  const lastEReport = await prisma.eReportingPeriod.findUnique({
    where: { userId_period: { userId, period: currentPeriod } },
    select: { status: true },
  });

  const unreportedB2C = b2c.length > 0 && !['submitted', 'accepted'].includes(lastEReport?.status ?? '') ? b2c.length : 0;

  // Penalty exposure (capped at annual cap)
  const violatingInvoices = pendingSubmission + unreportedB2C;
  const rawPenalty = violatingInvoices * PENALTY_PER_INVOICE;
  const penaltyExposure = Math.min(rawPenalty, ANNUAL_CAP);

  // Score: start at 100, deduct per violation
  const totalIssued = issued.length || 1;
  const violationRatio = violatingInvoices / totalIssued;
  const score = Math.max(0, Math.round(100 - violationRatio * 100));

  const level: 'green' | 'warning' | 'red' =
    score >= 80 ? 'green' : score >= 50 ? 'warning' : 'red';

  return {
    score,
    level,
    penaltyExposure,
    issuedTotal: issued.length,
    submittedToPpf,
    pendingSubmission,
    unreportedB2C,
  };
}

export async function recordComplianceEvent(params: {
  userId: string;
  invoiceId?: string;
  type: 'missing_einvoice' | 'late_submission' | 'e_reporting_missing' | 'invalid_format' | 'siret_invalid';
  description: string;
  penaltyAmount?: number;
}) {
  return prisma.complianceEvent.create({
    data: {
      userId: params.userId,
      invoiceId: params.invoiceId,
      type: params.type,
      description: params.description,
      penaltyAmount: params.penaltyAmount ?? PENALTY_PER_INVOICE,
    },
  });
}
