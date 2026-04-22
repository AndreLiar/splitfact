import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { encryptCredential, decryptCredential } from '@/lib/credential-crypto';

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

  const data: Record<string, string> = {};

  if (body.pisteEnv) data.pisteEnv = body.pisteEnv === 'production' ? 'production' : 'sandbox';
  if (body.pisteClientId !== undefined) data.pisteClientId = body.pisteClientId;
  if (body.cproTechLogin !== undefined) data.cproTechLogin = body.cproTechLogin;

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

// Helper exported for other server-side code: resolve decrypted user credentials
export async function getUserPisteCredentials(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cproTechLogin: true, cproTechPassword: true, pisteClientId: true, pisteClientSecret: true, pisteEnv: true },
  });
  if (!user?.pisteClientId || !user.cproTechLogin) return null;

  try {
    return {
      pisteClientId: user.pisteClientId,
      pisteClientSecret: user.pisteClientSecret ? decryptCredential(user.pisteClientSecret) : '',
      cproTechLogin: user.cproTechLogin,
      cproTechPassword: user.cproTechPassword ? decryptCredential(user.cproTechPassword) : '',
      pisteEnv: (user.pisteEnv ?? 'sandbox') as 'sandbox' | 'production',
    };
  } catch {
    return null;
  }
}
