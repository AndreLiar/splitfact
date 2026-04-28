import { prisma } from '@/lib/prisma';

const SIRENE_BASE = 'https://api.insee.fr/api-sirene/3.11';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SireneEtablissement {
  siret: string;
  siren: string;
  denominationUniteLegale: string | null;
  nomUsageUniteLegale: string | null;
  prenom1UniteLegale: string | null;
  nomUniteLegale: string | null;
  adresseEtablissement: {
    numeroVoieEtablissement: string | null;
    typeVoieEtablissement: string | null;
    libelleVoieEtablissement: string | null;
    codePostalEtablissement: string | null;
    libelleCommuneEtablissement: string | null;
  };
  etatAdministratifEtablissement: 'A' | 'F'; // A=active, F=closed
  uniteLegale?: {
    categorieJuridiqueUniteLegale?: string | null;
    denominationUniteLegale?: string | null;
  };
}

export interface SireneResult {
  valid: boolean;
  siret: string;
  companyName: string | null;
  address: string | null;
  active: boolean;
  isPublicEntity: boolean;  // true when categorieJuridique indicates a Chorus Pro public buyer
  categorieJuridique: string | null;
  raw: SireneEtablissement | null;
  error?: string;
}

/**
 * Returns true when the INSEE categorieJuridique code indicates a public entity
 * that uses Chorus Pro (État, collectivités, EPIC/EPA, organismes publics).
 * Codes 1xxx–3xxx are state/public-law bodies; 7xxx are public services.
 */
export function isPublicEntityByCode(code: string | null | undefined): boolean {
  if (!code) return false;
  const n = parseInt(code, 10);
  if (isNaN(n)) return false;
  // 1000–3999: État, organismes de l'État, personnes soumises au droit administratif
  // 7000–7999: Administrations et services publics
  return (n >= 1000 && n < 4000) || (n >= 7000 && n < 8000);
}

// E2-S2: Luhn-based SIRET format validator (14 digits, valid Luhn)
export function validateSiretFormat(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleaned)) return false;

  // Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[13 - i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function buildCompanyName(e: SireneEtablissement): string | null {
  if (e.denominationUniteLegale) return e.denominationUniteLegale;
  const parts = [e.prenom1UniteLegale, e.nomUsageUniteLegale || e.nomUniteLegale].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

function buildAddress(e: SireneEtablissement): string | null {
  const a = e.adresseEtablissement;
  const line = [
    a.numeroVoieEtablissement,
    a.typeVoieEtablissement,
    a.libelleVoieEtablissement,
  ].filter(Boolean).join(' ');
  const city = [a.codePostalEtablissement, a.libelleCommuneEtablissement].filter(Boolean).join(' ');
  const parts = [line, city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

async function fetchFromSirene(siret: string): Promise<SireneResult> {
  const apiKey = process.env.SIRENE_API_KEY;
  if (!apiKey) {
    return { valid: false, siret, companyName: null, address: null, active: false, isPublicEntity: false, categorieJuridique: null, raw: null, error: 'SIRENE_API_KEY not configured' };
  }

  const res = await fetch(`${SIRENE_BASE}/siret/${siret}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    next: { revalidate: 0 },
  });

  if (res.status === 404) {
    return { valid: false, siret, companyName: null, address: null, active: false, isPublicEntity: false, categorieJuridique: null, raw: null, error: 'SIRET introuvable dans le répertoire SIRENE' };
  }

  if (!res.ok) {
    return { valid: false, siret, companyName: null, address: null, active: false, isPublicEntity: false, categorieJuridique: null, raw: null, error: `Erreur SIRENE: ${res.status}` };
  }

  const json = await res.json();
  const etablissement: SireneEtablissement = json.etablissement;
  const categorieJuridique = etablissement.uniteLegale?.categorieJuridiqueUniteLegale ?? null;

  return {
    valid: true,
    siret,
    companyName: buildCompanyName(etablissement),
    address: buildAddress(etablissement),
    active: etablissement.etatAdministratifEtablissement === 'A',
    isPublicEntity: isPublicEntityByCode(categorieJuridique),
    categorieJuridique,
    raw: etablissement,
  };
}

export async function lookupSiret(siret: string): Promise<SireneResult> {
  const cleaned = siret.replace(/\s/g, '');

  if (!validateSiretFormat(cleaned)) {
    return { valid: false, siret: cleaned, companyName: null, address: null, active: false, isPublicEntity: false, categorieJuridique: null, raw: null, error: 'Format SIRET invalide (14 chiffres requis)' };
  }

  // Check cache
  const now = new Date();
  const cached = await prisma.sireneCache.findUnique({ where: { siret: cleaned } });
  if (cached && cached.expiresAt > now) {
    const data = cached.data as unknown as SireneResult;
    return data;
  }

  // Fetch from INSEE
  const result = await fetchFromSirene(cleaned);

  // Upsert cache (cache even failures to avoid hammering the API)
  await prisma.sireneCache.upsert({
    where: { siret: cleaned },
    create: {
      siret: cleaned,
      data: result as object,
      expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
    },
    update: {
      data: result as object,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
    },
  });

  return result;
}
