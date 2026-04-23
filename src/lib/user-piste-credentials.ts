import { prisma } from '@/lib/prisma';
import { decryptCredential } from '@/lib/credential-crypto';
import type { PisteCredentials } from '@/lib/piste-api';

/** Resolve and decrypt per-user PISTE credentials from the DB. Returns null if not configured. */
export async function getUserPisteCredentials(userId: string): Promise<PisteCredentials | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cproTechLogin: true, cproTechPassword: true, pisteClientId: true, pisteClientSecret: true, pisteEnv: true },
  });

  // All 4 required fields must be present — partial credentials cause mismatched auth
  if (!user?.pisteClientId || !user.pisteClientSecret || !user.cproTechLogin || !user.cproTechPassword) return null;

  try {
    return {
      pisteClientId: user.pisteClientId,
      pisteClientSecret: decryptCredential(user.pisteClientSecret),
      cproTechLogin: user.cproTechLogin,
      cproTechPassword: decryptCredential(user.cproTechPassword),
      pisteEnv: (user.pisteEnv === 'production' ? 'production' : 'sandbox'),
    };
  } catch {
    return null;
  }
}
