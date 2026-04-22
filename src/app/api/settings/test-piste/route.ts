import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { testPisteConnection } from '@/lib/piste-api';
import { getUserPisteCredentials } from '@/app/api/settings/piste-credentials/route';
import { decryptCredential } from '@/lib/credential-crypto';

// POST — test PISTE connection using body credentials (in-flight) or saved DB credentials
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json() as {
    pisteEnv?: string;
    pisteClientId?: string;
    pisteClientSecret?: string;   // plaintext, in-flight (not yet saved)
    cproTechLogin?: string;
    cproTechPassword?: string;    // plaintext, in-flight
    useSaved?: boolean;           // if true, use credentials from DB
  };

  let creds: { pisteClientId: string; pisteClientSecret: string; cproTechLogin: string; cproTechPassword: string; pisteEnv: 'sandbox' | 'production' } | null = null;

  if (body.useSaved) {
    creds = await getUserPisteCredentials(session.user.id);
    if (!creds) {
      return NextResponse.json({ ok: false, error: 'Aucun identifiant configuré — renseignez et sauvegardez d\'abord vos credentials.' });
    }
  } else {
    if (!body.pisteClientId || !body.pisteClientSecret || !body.cproTechLogin || !body.cproTechPassword) {
      return NextResponse.json({ ok: false, error: 'Tous les champs sont requis pour tester la connexion.' });
    }
    creds = {
      pisteClientId: body.pisteClientId,
      pisteClientSecret: body.pisteClientSecret,
      cproTechLogin: body.cproTechLogin,
      cproTechPassword: body.cproTechPassword,
      pisteEnv: body.pisteEnv === 'production' ? 'production' : 'sandbox',
    };
  }

  const result = await testPisteConnection(creds);

  return NextResponse.json(result);
}
