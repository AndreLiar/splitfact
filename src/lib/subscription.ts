import { prisma } from '@/lib/prisma';

export type PlanId = 'free' | 'pro';

export const FREE_INVOICE_LIMIT = 5;

export async function getUserPlan(userId: string): Promise<PlanId> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planId: true, subscriptionStatus: true },
  });
  if (!user) return 'free';
  const active = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
  return active && user.planId === 'pro' ? 'pro' : 'free';
}

export async function isPro(userId: string): Promise<boolean> {
  return (await getUserPlan(userId)) === 'pro';
}

export async function getMonthlyInvoiceCount(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return prisma.invoice.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });
}
