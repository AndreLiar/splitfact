/**
 * PISTE API client — Portail de l'Impôt, de la Statistique et de l'Échange
 * OAuth2 client_credentials + Chorus Pro compte technique for PPF invoice submission.
 *
 * Supports both platform-level env var credentials (OD mode) and per-tenant credentials
 * stored encrypted in the DB. Per-tenant credentials take precedence when provided.
 *
 * Required env vars (platform / OD fallback):
 *   PISTE_CLIENT_ID        — OAuth2 client ID
 *   PISTE_CLIENT_SECRET    — OAuth2 client secret
 *   PISTE_ENV              — "sandbox" | "production"  (default: "sandbox")
 *   CPRO_TECH_LOGIN        — Chorus Pro compte technique login
 *   CPRO_TECH_PASSWORD     — Chorus Pro compte technique password
 */

export interface PisteCredentials {
  pisteClientId: string;
  pisteClientSecret: string;
  cproTechLogin: string;
  cproTechPassword: string;
  pisteEnv: 'sandbox' | 'production';
}

const VALID_ENVS = new Set(['sandbox', 'production']);

function normalizePisteEnv(value: string | undefined): 'sandbox' | 'production' {
  return value && VALID_ENVS.has(value) ? (value as 'sandbox' | 'production') : 'sandbox';
}

function getPlatformCredentials(): PisteCredentials | null {
  const pisteClientId = process.env.PISTE_CLIENT_ID;
  const pisteClientSecret = process.env.PISTE_CLIENT_SECRET;
  const cproTechLogin = process.env.CPRO_TECH_LOGIN;
  const cproTechPassword = process.env.CPRO_TECH_PASSWORD;
  if (!pisteClientId || !pisteClientSecret || !cproTechLogin || !cproTechPassword) {
    return null;
  }
  return {
    pisteClientId,
    pisteClientSecret,
    cproTechLogin,
    cproTechPassword,
    pisteEnv: normalizePisteEnv(process.env.PISTE_ENV),
  };
}

function resolveCredentials(override?: Partial<PisteCredentials>): PisteCredentials {
  const platform = getPlatformCredentials();
  const merged = { ...platform, ...override } as Partial<PisteCredentials>;
  if (!merged.pisteClientId || !merged.pisteClientSecret || !merged.cproTechLogin || !merged.cproTechPassword) {
    throw new Error('PISTE credentials not configured. Set env vars or configure credentials in Settings.');
  }
  return merged as PisteCredentials;
}

function getPisteBase(env: string) {
  return env === 'production'
    ? 'https://api.piste.gouv.fr'
    : 'https://sandbox-api.piste.gouv.fr';
}

function getAuthUrl(env: string) {
  return env === 'production'
    ? 'https://oauth.piste.gouv.fr/api/oauth/token'
    : 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token';
}

// ─── Token cache keyed by "env:clientId" to prevent cross-env token reuse ────

const tokenCache = new Map<string, { value: string; expiresAt: number }>();

function tokenCacheKey(creds: PisteCredentials) {
  return `${creds.pisteEnv}:${creds.pisteClientId}`;
}

function evictExpiredTokens() {
  const now = Date.now();
  for (const [key, entry] of tokenCache) {
    if (now >= entry.expiresAt) tokenCache.delete(key);
  }
}

async function getAccessToken(creds: PisteCredentials): Promise<string> {
  evictExpiredTokens();
  const cacheKey = tokenCacheKey(creds);
  const cached = tokenCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt - 30_000) return cached.value;

  const res = await fetch(getAuthUrl(creds.pisteEnv), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.pisteClientId,
      client_secret: creds.pisteClientSecret,
      scope: 'openid',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PISTE auth failed ${res.status}: ${text}`);
  }

  const json = await res.json();
  const entry = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  tokenCache.set(cacheKey, entry);
  return entry.value;
}

function getCproAccountHeader(creds: PisteCredentials): string {
  return Buffer.from(`${creds.cproTechLogin}:${creds.cproTechPassword}`).toString('base64');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PpfLifecycleStatus =
  | 'DEPOSEE'
  | 'EN_COURS_DE_ROUTAGE'
  | 'RECUE'
  | 'REJETEE'
  | 'REFUSEE'
  | 'APPROUVEE'
  | 'PAYEE';

export interface PpfSubmitResult {
  success: boolean;
  trackingId?: string;
  status?: PpfLifecycleStatus;
  error?: string;
  rawResponse?: unknown;
}

export interface PpfStatusResult {
  success: boolean;
  trackingId: string;
  status?: PpfLifecycleStatus;
  rejectionReason?: string;
  error?: string;
}

// ─── Submit invoice to PPF via deposerFluxFacture ────────────────────────────

export async function submitInvoiceToPpf(params: {
  invoiceNumber: string;
  facturxPdfBuffer?: Buffer;
  facturxXml: string;
  sellerSiret: string;
  buyerSiret: string;
  invoiceDate: string;
  totalAmount: number;
  credentials?: Partial<PisteCredentials>;
}): Promise<PpfSubmitResult> {
  try {
    const creds = resolveCredentials(params.credentials);
    const token = await getAccessToken(creds);
    const cproAccount = getCproAccountHeader(creds);
    const PISTE_BASE = getPisteBase(creds.pisteEnv);

    let fichierFlux: string;
    let nomFichier: string;
    let syntaxeFlux: string;

    if (params.facturxPdfBuffer) {
      fichierFlux = params.facturxPdfBuffer.toString('base64');
      nomFichier = `${params.invoiceNumber}.pdf`;
      syntaxeFlux = 'IN_DP_E2_CII_FACTURX';
    } else {
      fichierFlux = Buffer.from(params.facturxXml).toString('base64');
      nomFichier = `${params.invoiceNumber}.xml`;
      syntaxeFlux = 'IN_DP_E1_CII_16B';
    }

    const res = await fetch(`${PISTE_BASE}/cpro/factures/v1/deposer/flux`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'cpro-account': cproAccount,
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({ fichierFlux, nomFichier, syntaxeFlux }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || ((json as any)?.codeRetour !== 0 && (json as any)?.codeRetour !== undefined)) {
      return {
        success: false,
        error: (json as any)?.libelle ?? `PISTE error ${res.status}`,
        rawResponse: json,
      };
    }

    return {
      success: true,
      trackingId: String((json as any)?.numeroFluxDepot ?? ''),
      status: 'DEPOSEE',
      rawResponse: json,
    };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'PISTE submission failed' };
  }
}

// ─── Poll invoice lifecycle status from PPF ───────────────────────────────────

export async function getPpfInvoiceStatus(
  trackingId: string,
  credentials?: Partial<PisteCredentials>,
): Promise<PpfStatusResult> {
  try {
    const creds = resolveCredentials(credentials);
    const token = await getAccessToken(creds);
    const cproAccount = getCproAccountHeader(creds);
    const PISTE_BASE = getPisteBase(creds.pisteEnv);

    const res = await fetch(`${PISTE_BASE}/cpro/factures/v1/consulter/historique`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'cpro-account': cproAccount,
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({ identifiantFactureCPP: Number(trackingId) }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        trackingId,
        error: (json as any)?.libelle ?? `PISTE status error ${res.status}`,
      };
    }

    return {
      success: true,
      trackingId,
      status: (json as any)?.statutCourant as PpfLifecycleStatus | undefined,
      rejectionReason: (json as any)?.commentaireEtatCourant,
    };
  } catch (err: any) {
    return { success: false, trackingId, error: err?.message ?? 'PISTE status check failed' };
  }
}

// ─── Map PPF status → InvoiceOps ppfStatus enum value ─────────────────────────

export function mapPpfStatus(ppfStatus: PpfLifecycleStatus): string {
  const map: Record<PpfLifecycleStatus, string> = {
    DEPOSEE: 'deposee',
    EN_COURS_DE_ROUTAGE: 'en_cours_de_routage',
    RECUE: 'recue',
    REJETEE: 'rejetee',
    REFUSEE: 'refusee',
    APPROUVEE: 'approuvee',
    PAYEE: 'payee',
  };
  return map[ppfStatus] ?? 'deposee';
}

// ─── Fetch invoices received via PPF (destinataire search) ───────────────────

export interface ReceivedInvoiceEntry {
  cppId: string;
  invoiceNumber: string;
  supplierName: string;
  supplierSiret: string | null;
  buyerSiret: string | null;
  totalAmountTTC: number;
  ppfStatus: string;
  depositedAt: string | null;
}

export interface FetchReceivedInvoicesResult {
  success: boolean;
  invoices: ReceivedInvoiceEntry[];
  total: number;
  error?: string;
}

export async function fetchReceivedInvoicesFromPpf(opts: {
  fromDate: string;
  toDate: string;
  page?: number;
  credentials?: Partial<PisteCredentials>;
}): Promise<FetchReceivedInvoicesResult> {
  try {
    const creds = resolveCredentials(opts.credentials);
    const token = await getAccessToken(creds);
    const cproAccount = getCproAccountHeader(creds);
    const PISTE_BASE = getPisteBase(creds.pisteEnv);

    const res = await fetch(`${PISTE_BASE}/cpro/factures/v1/rechercher/destinataire`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'cpro-account': cproAccount,
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({
        dateDepotFactureDu: opts.fromDate,
        dateDepotFactureAu: opts.toDate,
        nbResultatsParPage: 50,
        pageResultat: opts.page ?? 1,
      }),
    });

    const json = await res.json().catch(() => ({})) as any;

    if (!res.ok || (json?.codeRetour !== 0 && json?.codeRetour !== undefined)) {
      return { success: false, invoices: [], total: 0, error: json?.libelle ?? `PISTE error ${res.status}` };
    }

    const raw: any[] = json?.listeFactures ?? [];
    const invoices: ReceivedInvoiceEntry[] = raw.map((f) => ({
      cppId: String(f.identifiantFactureCPP ?? ''),
      invoiceNumber: f.numeroFacture ?? '',
      supplierName: f.nomFournisseur ?? 'Fournisseur inconnu',
      supplierSiret: f.siretFournisseur ?? null,
      buyerSiret: f.siretDestinataire ?? null,
      totalAmountTTC: Number(f.montantTTC ?? 0),
      ppfStatus: f.statut ?? 'RECUE',
      depositedAt: f.dateDepot ?? null,
    }));

    return { success: true, invoices, total: json?.nbTotalResultats ?? invoices.length };
  } catch (err: any) {
    return { success: false, invoices: [], total: 0, error: err?.message ?? 'PISTE fetch failed' };
  }
}

// ─── Download raw XML for a received invoice ──────────────────────────────────

export async function downloadReceivedInvoiceXml(
  cppId: string,
  credentials?: Partial<PisteCredentials>,
): Promise<string | null> {
  try {
    const creds = resolveCredentials(credentials);
    const token = await getAccessToken(creds);
    const cproAccount = getCproAccountHeader(creds);
    const PISTE_BASE = getPisteBase(creds.pisteEnv);

    const res = await fetch(`${PISTE_BASE}/cpro/factures/v1/telecharger`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'cpro-account': cproAccount,
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({ identifiantFactureCPP: Number(cppId), telechargerToutesVersions: false }),
    });

    const json = await res.json().catch(() => ({})) as any;
    if (!res.ok || !json?.fichierFacture) return null;

    return Buffer.from(json.fichierFacture, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

// ─── Lightweight token test — validates PISTE credentials without side effects ─

export async function testPisteConnection(creds: Partial<PisteCredentials>): Promise<{ ok: boolean; error?: string }> {
  try {
    const resolved = resolveCredentials(creds);
    await getAccessToken(resolved);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Connection test failed' };
  }
}

export { getPlatformCredentials };
// Legacy export kept for reform-readiness check
export const PISTE_ENV = normalizePisteEnv(process.env.PISTE_ENV);
