import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { encryptCredential } from '@/lib/credential-crypto';

// GET — return whether credentials are configured (never returns plaintext secrets)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cproTechLogin: true, cproTechPassword: true, pisteClientId: true, pisteClientSecret: true, pisteEnv: true },
  });

  return NextResponse.json({
    pisteEnv: user?.pisteEnv ?? 'sandbox',
    pisteClientId: user?.pisteClientId ?? '',
    pisteClientSecretSet: !!user?.pisteClientSecret,
    cproTechLogin: user?.cproTechLogin ?? '',
    cproTechPasswordSet: !!user?.cproTechPassword,
  });
}

const SENSITIVE = ['pisteClientSecret', 'cproTechPassword'] as const;

// PUT — save credentials (passwords encrypted at rest)
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json() as {
    pisteEnv?: string;
    pisteClientId?: string;
    pisteClientSecret?: string;
    cproTechLogin?: string;
    cproTechPassword?: string;
  };

  const data: Record<string, string | null> = {};

  if (body.pisteEnv) data.pisteEnv = body.pisteEnv === 'production' ? 'production' : 'sandbox';
  if (body.pisteClientId !== undefined) data.pisteClientId = body.pisteClientId.trim() || null;
  if (body.cproTechLogin !== undefined) data.cproTechLogin = body.cproTechLogin.trim() || null;

  // Encrypt secrets — only update if a non-empty value was sent
  for (const field of SENSITIVE) {
    const value = body[field];
    if (value && value.trim()) {
      try {
        data[field] = encryptCredential(value.trim());
      } catch {
        return NextResponse.json({ error: 'Encryption not configured (CREDENTIAL_ENCRYPTION_KEY missing)' }, { status: 500 });
      }
    }
  }

  // Ensure credentials are saved as complete pairs or not at all
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pisteClientId: true, pisteClientSecret: true, cproTechLogin: true, cproTechPassword: true },
  });
  const merged = { ...current, ...data };
  const pisteComplete = !!(merged.pisteClientId && merged.pisteClientSecret);
  const cproComplete = !!(merged.cproTechLogin && merged.cproTechPassword);
  // If one side of a pair is being set, the other must already exist or be included in this request
  if ((merged.pisteClientId || merged.pisteClientSecret) && !pisteComplete) {
    return NextResponse.json({ error: 'PISTE Client ID et Client Secret doivent être fournis ensemble.' }, { status: 400 });
  }
  if ((merged.cproTechLogin || merged.cproTechPassword) && !cproComplete) {
    return NextResponse.json({ error: 'Login et mot de passe Chorus Pro doivent être fournis ensemble.' }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data });

  return NextResponse.json({ ok: true });
}

// DELETE — clear all PISTE credentials for this user
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { cproTechLogin: null, cproTechPassword: null, pisteClientId: null, pisteClientSecret: null, pisteEnv: 'sandbox' },
  });

  return NextResponse.json({ ok: true });
}
