import { prisma } from '@/lib/prisma';

export type PlanId = 'free' | 'pro';

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
