/**
 * PISTE API client — Portail de l'Impôt, de la Statistique et de l'Échange
 * OAuth2 client_credentials + Chorus Pro compte technique for PPF invoice submission.
 *
 * Sandbox:    https://sandbox-api.piste.gouv.fr
 * Production: https://api.piste.gouv.fr
 *
 * Required env vars:
 *   PISTE_CLIENT_ID        — OAuth2 client ID
 *   PISTE_CLIENT_SECRET    — OAuth2 client secret
 *   PISTE_ENV              — "sandbox" | "production"  (default: "sandbox")
 *   CPRO_TECH_LOGIN        — Chorus Pro compte technique login
 *   CPRO_TECH_PASSWORD     — Chorus Pro compte technique password
 */

const ENV = process.env.PISTE_ENV ?? 'sandbox';

const PISTE_BASE = ENV === 'production'
  ? 'https://api.piste.gouv.fr'
  : 'https://sandbox-api.piste.gouv.fr';

const AUTH_URL = ENV === 'production'
  ? 'https://oauth.piste.gouv.fr/api/oauth/token'
  : 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token';

// ─── Token cache (module-level, survives warm lambda invocations) ─────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }

  const clientId = process.env.PISTE_CLIENT_ID;
  const clientSecret = process.env.PISTE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PISTE_CLIENT_ID and PISTE_CLIENT_SECRET must be set');
  }

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'openid',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PISTE auth failed ${res.status}: ${text}`);
  }

  const json = await res.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };

  return cachedToken.value;
}

// Chorus Pro requires login:password base64-encoded in cpro-account header
function getCproAccountHeader(): string {
  const login = process.env.CPRO_TECH_LOGIN;
  const password = process.env.CPRO_TECH_PASSWORD;

  if (!login || !password) {
    throw new Error('CPRO_TECH_LOGIN and CPRO_TECH_PASSWORD must be set');
  }

  return Buffer.from(`${login}:${password}`).toString('base64');
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
// API accepts JSON with base64-encoded file content + syntaxeFlux field.
// For Factur-X PDF/A-3: syntaxeFlux = "IN_DP_E2_CII_FACTURX", extension .pdf
// For pure CII XML:     syntaxeFlux = "IN_DP_E1_CII_16B",      extension .xml

export async function submitInvoiceToPpf(params: {
  invoiceNumber: string;
  facturxPdfBuffer?: Buffer;   // PDF/A-3 Factur-X (preferred)
  facturxXml: string;          // CII XML (fallback when no PDF)
  sellerSiret: string;
  buyerSiret: string;
  invoiceDate: string; // YYYY-MM-DD
  totalAmount: number;
}): Promise<PpfSubmitResult> {
  try {
    const token = await getAccessToken();
    const cproAccount = getCproAccountHeader();

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

export async function getPpfInvoiceStatus(trackingId: string): Promise<PpfStatusResult> {
  try {
    const token = await getAccessToken();
    const cproAccount = getCproAccountHeader();

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

    const statut = (json as any)?.statutCourant as string | undefined;

    return {
      success: true,
      trackingId,
      status: statut as PpfLifecycleStatus | undefined,
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

export { ENV as PISTE_ENV };
