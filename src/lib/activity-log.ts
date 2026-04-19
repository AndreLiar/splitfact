import prisma from '@/lib/prisma';


export type ActivityAction =
  | 'issued'
  | 'blocked'
  | 'exception_resolved'
  | 'reminder_sent'
  | 'readiness_changed'
  | 'facturx_generated'
  | 'facturx_failed'
  | 'workflow_updated'
  | 'ppf_submitted'
  | 'ppf_submission_failed'
  | 'ppf_status_updated'
  | 'ppf_retry_succeeded';

export async function logActivity(params: {
  invoiceId: string;
  userId: string;
  action: ActivityAction;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activityLog.create({
    data: {
      invoiceId: params.invoiceId,
      userId: params.userId,
      action: params.action,
      metadata: (params.metadata ?? {}) as any,
    },
  });
}

export async function getActivityLogs(invoiceId: string) {
  return prisma.activityLog.findMany({
    where: { invoiceId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
