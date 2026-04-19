import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';


const schema = z.object({
  triggerType: z.enum(['manual', 'recurring', 'uploaded_doc']),
  sourceDescription: z.string().optional(),
  invoiceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const trigger = await prisma.billingTrigger.create({
    data: {
      userId: session.user.id,
      triggerType: parsed.data.triggerType,
      sourceDescription: parsed.data.sourceDescription,
      invoiceId: parsed.data.invoiceId,
    },
  });

  return NextResponse.json({ trigger }, { status: 201 });
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const triggers = await prisma.billingTrigger.findMany({
    where: { userId: session.user.id },
    include: { invoice: { select: { invoiceNumber: true, workflowStatus: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ triggers });
}
