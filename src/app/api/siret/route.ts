import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { lookupSiret, validateSiretFormat } from '@/lib/sirene-api';
import { prisma } from '@/lib/prisma';

// GET /api/siret?siret=12345678901234
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siret = searchParams.get('siret')?.replace(/\s/g, '') ?? '';

  if (!siret) {
    return NextResponse.json({ error: 'Paramètre siret manquant' }, { status: 400 });
  }

  if (!validateSiretFormat(siret)) {
    return NextResponse.json({ valid: false, error: 'Format SIRET invalide (14 chiffres requis)' });
  }

  const result = await lookupSiret(siret);
  return NextResponse.json(result);
}

// POST /api/siret — validate and persist on a client record
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { siret, clientId } = body;

  if (!siret) {
    return NextResponse.json({ error: 'Paramètre siret manquant' }, { status: 400 });
  }

  const result = await lookupSiret(siret.replace(/\s/g, ''));

  if (clientId && result.valid) {
    // Verify the client belongs to the session user before updating
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (user) {
      const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
      if (client) {
        await prisma.client.update({
          where: { id: clientId },
          data: {
            siretValidated: result.valid && result.active,
            siretValidatedAt: result.valid && result.active ? new Date() : null,
          },
        });
      }
    }
  }

  return NextResponse.json(result);
}
