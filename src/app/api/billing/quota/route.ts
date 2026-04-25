import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserPlan, getMonthlyInvoiceCount, FREE_INVOICE_LIMIT } from '@/lib/subscription';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  if (plan === 'pro') {
    return NextResponse.json({ plan: 'pro', limit: null, used: null, remaining: null });
  }

  const used = await getMonthlyInvoiceCount(session.user.id);
  const remaining = Math.max(0, FREE_INVOICE_LIMIT - used);

  return NextResponse.json({ plan: 'free', limit: FREE_INVOICE_LIMIT, used, remaining });
}
