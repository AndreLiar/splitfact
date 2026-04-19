import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { computeComplianceScore } from '@/lib/compliance';
import prisma from '@/lib/prisma';

// GET /api/compliance — return compliance score + recent events
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [score, events] = await Promise.all([
    computeComplianceScore(session.user.id),
    prisma.complianceEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, type: true, description: true, penaltyAmount: true,
        resolvedAt: true, createdAt: true, invoiceId: true,
      },
    }),
  ]);

  return NextResponse.json({ score, events });
}
