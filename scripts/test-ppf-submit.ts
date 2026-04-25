/**
 * End-to-end test: submit a minimal Factur-X XML to Chorus Pro sandbox.
 * Run with: npx tsx scripts/test-ppf-submit.ts
 */

import { buildFacturxXml } from '../src/domains/invoices/facturx/invoice-to-cii';

const PISTE_BASE = 'https://sandbox-api.piste.gouv.fr';
const AUTH_URL = 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token';

const CLIENT_ID = '4e762279-65af-419d-be09-19ec9e269b29';
const CLIENT_SECRET = 'f2950602-ca75-4a0e-8461-5a8d37489a8f';
const CPRO_LOGIN = 'TECH_1_31371109886541@cpro.fr';
const CPRO_PASSWORD = 'js6pshocoMc*l';

async function getToken(): Promise<string> {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'openid',
    }),
  });
  const json = await res.json() as any;
  console.log('Token acquired:', json.access_token?.slice(0, 20) + '...');
  return json.access_token;
}

async function main() {
  const token = await getToken();
  const cproAccount = Buffer.from(`${CPRO_LOGIN}:${CPRO_PASSWORD}`).toString('base64');

  const xml = buildFacturxXml({
    invoiceNumber: `TEST-${Date.now()}`,
    invoiceDate: '2026-04-19',
    dueDate: '2026-05-19',
    currency: 'EUR',
    seller: {
      name: 'Fournisseur Test InvoiceOps',
      address: '1 rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      countryCode: 'FR',
      siret: '31371109886541',
      vatNumber: 'FR31313711098',
    },
    buyer: {
      name: 'Destinataire 12984129688128',
      address: '1 place du Palais',
      city: 'Paris',
      postalCode: '75001',
      countryCode: 'FR',
      siret: '12984129688128',
    },
    lines: [
      { description: 'Prestation de service InvoiceOps', quantity: 1, unitPrice: 1000, taxRate: 20 },
    ],
    totalAmount: 1200,
    transactionType: 'B2G',
    paymentTerms: 'Paiement à 30 jours',
    latePenaltyRate: '3 fois le taux légal',
    recoveryIndemnity: 40,
  });

  console.log('\nXML preview (first 300 chars):');
  console.log(xml.slice(0, 300));

  // Submit XML flux to Chorus Pro (JSON + base64, syntaxeFlux = CII)
  const fichierFlux = Buffer.from(xml).toString('base64');

  console.log('\nSubmitting to Chorus Pro sandbox...');
  const res = await fetch(`${PISTE_BASE}/cpro/factures/v1/deposer/flux`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'cpro-account': cproAccount,
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify({
      fichierFlux,
      nomFichier: 'invoice.xml',
      syntaxeFlux: 'IN_DP_E1_CII_16B',
    }),
  });

  const json = await res.json() as any;
  console.log('\nResponse HTTP:', res.status);
  console.log('Response body:', JSON.stringify(json, null, 2));
}

main().catch(console.error);
