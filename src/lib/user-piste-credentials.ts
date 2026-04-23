import { prisma } from '@/lib/prisma';
import { decryptCredential } from '@/lib/credential-crypto';
import type { PisteCredentials } from '@/lib/piste-api';

/** Resolve and decrypt per-user PISTE credentials from the DB. Returns null if not configured. */
export async function getUserPisteCredentials(userId: string): Promise<PisteCredentials | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cproTechLogin: true, cproTechPassword: true, pisteClientId: true, pisteClientSecret: true, pisteEnv: true },
  });

  if (!user?.pisteClientId || !user.cproTechLogin) return null;

  try {
    return {
      pisteClientId: user.pisteClientId,
      cproTechLogin: user.cproTechLogin,
      pisteEnv: (user.pisteEnv ?? 'sandbox') as 'sandbox' | 'production',
      ...(user.pisteClientSecret ? { pisteClientSecret: decryptCredential(user.pisteClientSecret) } : {}),
      ...(user.cproTechPassword ? { cproTechPassword: decryptCredential(user.cproTechPassword) } : {}),
    } as PisteCredentials;
  } catch {
    return null;
  }
}
