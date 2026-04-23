import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const RECEIVE_DEADLINE = new Date('2026-09-01T00:00:00Z');
const EMIT_DEADLINE = new Date('2027-09-01T00:00:00Z');

function daysUntil(target: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86_400_000));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { siret: true, cproTechLogin: true, cproTechPassword: true, pisteClientId: true, pisteClientSecret: true },
  });

  const hasCproCredentials =
    !!(process.env.CPRO_TECH_LOGIN && process.env.CPRO_TECH_PASSWORD) ||
    !!(user?.cproTechLogin && user.cproTechPassword);
  const hasPisteCredentials =
    !!(process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET) ||
    !!(user?.pisteClientId && user.pisteClientSecret);
  const hasSiret = !!user?.siret;

  return NextResponse.json({
    receive: {
      ready: hasCproCredentials,
      checks: {
        cproCredentials: hasCproCredentials,
      },
      deadlineDate: RECEIVE_DEADLINE.toISOString(),
      daysRemaining: daysUntil(RECEIVE_DEADLINE),
    },
    emit: {
      ready: hasPisteCredentials && hasSiret,
      checks: {
        pisteCredentials: hasPisteCredentials,
        siretValidated: hasSiret,
      },
      deadlineDate: EMIT_DEADLINE.toISOString(),
      daysRemaining: daysUntil(EMIT_DEADLINE),
    },
  });
}
