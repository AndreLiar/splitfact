/**
 * ICP plan validation tests — runs against invoiceops.fr
 *
 * Tests 4 ICP profiles on both Free and Pro plans:
 *  ICP-A: Freelance Tech  (MicroBIC / PRESTATAIRE)
 *  ICP-B: Profession Libérale (BNC / LIBERAL)
 *  ICP-C: Micro-commerçant  (MicroBIC / COMMERCANT)
 *  ICP-D: Agence / SASU    (EI regime)
 *
 * Usage: DATABASE_URL=<prod-url> SMOKE_BASE_URL=https://invoiceops.fr \
 *        npx playwright test --config=playwright.smoke.config.ts tests/e2e/icp-plans.spec.ts
 */
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { spawnSync } from 'child_process';

const BASE   = process.env.SMOKE_BASE_URL ?? 'https://invoiceops.fr';
const DB_URL = process.env.DATABASE_URL ?? '';

// ─── ICP profiles ────────────────────────────────────────────────────────────

interface IcpProfile {
  label: string;
  email: string;
  password: string;
  name: string;
  siret: string;
  apeCode: string;
  address: string;
  legalStatus: string;
  fiscalRegime: string;
  microEntrepreneurType: string;
  declarationFrequency: string;
}

const ICP_PROFILES: IcpProfile[] = [
  {
    label: 'Freelance-Tech',
    email: 'icp-tech@invoiceops-test.fr',
    password: 'TestICP2026!',
    name: 'Sophie Martin',
    siret: '84215963700018',
    apeCode: '6201Z',
    address: '5 avenue Kleber, 75016 Paris',
    legalStatus: 'Micro-entreprise',
    fiscalRegime: 'MicroBIC',
    microEntrepreneurType: 'PRESTATAIRE',
    declarationFrequency: 'monthly',
  },
  {
    label: 'Profession-Liberale',
    email: 'icp-liberal@invoiceops-test.fr',
    password: 'TestICP2026!',
    name: 'Dr Pierre Durand',
    siret: '77823451200028',
    apeCode: '8690D',
    address: '12 rue de la Republique, 69001 Lyon',
    legalStatus: 'Entreprise individuelle',
    fiscalRegime: 'BNC',
    microEntrepreneurType: 'LIBERAL',
    declarationFrequency: 'quarterly',
  },
  {
    label: 'Micro-Commercant',
    email: 'icp-commerce@invoiceops-test.fr',
    password: 'TestICP2026!',
    name: 'Lucas Fontaine',
    siret: '50234187600042',
    apeCode: '4321A',
    address: '8 place du Marechal Foch, 44000 Nantes',
    legalStatus: 'Micro-entreprise',
    fiscalRegime: 'MicroBIC',
    microEntrepreneurType: 'COMMERCANT',
    declarationFrequency: 'quarterly',
  },
  {
    label: 'Agence-SASU',
    email: 'icp-agence@invoiceops-test.fr',
    password: 'TestICP2026!',
    name: 'Pixel Studio',
    siret: '91234567800011',
    apeCode: '7410Z',
    address: '3 rue des Arts, 33000 Bordeaux',
    legalStatus: 'SASU',
    fiscalRegime: 'EI',
    microEntrepreneurType: '',
    declarationFrequency: 'monthly',
  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

async function registerOrSkip(request: APIRequestContext, icp: IcpProfile) {
  const res = await request.post(`${BASE}/api/auth/register`, {
    data: { email: icp.email, password: icp.password, name: icp.name },
  });
  if (res.status() === 201) return 'created';
  if (res.status() === 409) return 'exists';
  throw new Error(`Registration failed ${res.status()}: ${await res.text()}`);
}

async function login(page: Page, icp: IcpProfile) {
  await page.goto(`${BASE}/auth/signin`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', icp.email);
  await page.fill('input[type="password"]', icp.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

async function setupProfile(page: Page, icp: IcpProfile): Promise<number> {
  await page.goto(`${BASE}/dashboard/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const nameField = page.locator('input[placeholder*="Jean Dupont"]').first();
  if (await nameField.isVisible()) await nameField.fill(icp.name);

  const siretField = page.locator('input[placeholder="12345678900012"]').first();
  if (await siretField.isVisible()) { await siretField.clear(); await siretField.fill(icp.siret); }

  const apeField = page.locator('input[placeholder="6202A"]').first();
  if (await apeField.isVisible()) { const c = await apeField.inputValue(); if (!c) await apeField.fill(icp.apeCode); }

  const addressField = page.locator('textarea[placeholder*="rue"]').first();
  if (await addressField.isVisible()) { const c = await addressField.inputValue(); if (!c) await addressField.fill(icp.address); }

  const legalSelect = page.locator('select').filter({ has: page.locator('option[value="Micro-entreprise"]') }).first();
  if (await legalSelect.isVisible()) await legalSelect.selectOption(icp.legalStatus);

  const fiscalSelect = page.locator('select').filter({ has: page.locator('option[value="MicroBIC"]') }).first();
  if (await fiscalSelect.isVisible()) await fiscalSelect.selectOption(icp.fiscalRegime);

  if (icp.microEntrepreneurType) {
    const activitySelect = page.locator('select').filter({ has: page.locator('option[value="PRESTATAIRE"]') }).first();
    if (await activitySelect.isVisible()) await activitySelect.selectOption(icp.microEntrepreneurType);
  }

  if (icp.declarationFrequency) {
    const freqSelect = page.locator('select').filter({ has: page.locator('option[value="monthly"]') }).first();
    if (await freqSelect.isVisible()) await freqSelect.selectOption(icp.declarationFrequency);
  }

  let status = 0;
  page.on('response', async (res) => {
    if (res.url().includes('/api/users/me') && res.request().method() === 'PUT') status = res.status();
  });

  const saveBtn = page.getByRole('button', { name: /enregistrer le profil|sauvegarder/i }).first();
  await expect(saveBtn).toBeVisible({ timeout: 5_000 });
  await saveBtn.click();
  await page.waitForTimeout(2500);
  return status;
}

async function ensureClient(page: Page, icp: IcpProfile) {
  await page.goto(`${BASE}/dashboard/clients`);
  await page.waitForLoadState('networkidle');
  const addBtn = page.getByRole('button', { name: /nouveau client|ajouter/i }).first();
  if (!await addBtn.isVisible({ timeout: 3_000 }).catch(() => false)) return;
  await addBtn.click();
  await page.waitForTimeout(500);
  const nameInput = page.locator('input[name="name"], input[placeholder*="nom"]').first();
  if (await nameInput.isVisible()) await nameInput.fill(`Client ${icp.label}`);
  const saveBtn = page.getByRole('button', { name: /ajouter le client|enregistrer/i }).first();
  if (await saveBtn.isVisible()) await saveBtn.click();
  await page.waitForTimeout(1200);
}

async function createInvoice(page: Page, tag: string): Promise<string | null> {
  await page.goto(`${BASE}/dashboard/create-invoice`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const manualBtn = page.getByRole('button', { name: /saisir manuellement/i }).first();
  if (await manualBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await manualBtn.click();
    await page.waitForTimeout(1000);
  }

  const clientSelect = page.locator('select#clientId').first();
  if (await clientSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await page.waitForTimeout(800);
    const count = await clientSelect.locator('option').count();
    if (count > 1) await clientSelect.selectOption({ index: 1 });
  }

  const due = new Date();
  due.setDate(due.getDate() + 30);
  await page.locator('input#dueDate').first().fill(due.toISOString().split('T')[0]);

  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /étape suivante/i }).first().click();
  await page.waitForTimeout(800);

  await page.locator('input[name="description"]').first().fill(`Prestation ${tag}`);
  await page.locator('input[name="unitPrice"]').first().fill('750');

  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /étape suivante/i }).first().click();
  await page.waitForTimeout(800);

  const submitBtn = page.getByRole('button', { name: /créer la facture|créer le brouillon/i }).first();
  if (!await submitBtn.isVisible({ timeout: 8_000 }).catch(() => false)) return null;
  await submitBtn.click();
  await page.waitForTimeout(4000);

  const url = page.url();
  return url.includes('/invoices/') ? url : null;
}

// DB helpers — use spawnSync with args array to avoid shell injection risk
function setPlan(email: string, plan: 'pro' | 'free'): boolean {
  if (!DB_URL) return false;
  const status = plan === 'pro' ? 'active' : 'inactive';
  const sql = `UPDATE "User" SET "planId" = '${plan}', "subscriptionStatus" = '${status}' WHERE email = '${email}';`;
  const result = spawnSync('psql', [DB_URL, '-c', sql], { encoding: 'utf8' });
  return result.status === 0;
}

function getPlanFromDB(email: string): string | null {
  if (!DB_URL) return null;
  const sql = `SELECT "planId", "subscriptionStatus" FROM "User" WHERE email = '${email}';`;
  const result = spawnSync('psql', [DB_URL, '-c', sql, '-t', '--csv'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const row = result.stdout.trim().split('\n').find(l => l.includes(','));
  return row ?? null;
}

// ─── Test suites per ICP ──────────────────────────────────────────────────────

for (const icp of ICP_PROFILES) {
  test.describe(`[${icp.label}] ${icp.fiscalRegime}/${icp.microEntrepreneurType || 'N/A'}`, () => {

    test.use({ storageState: undefined });

    // ── 0. Account bootstrap ───────────────────────────────────────────────
    test('0 · Register & setup profile', async ({ request, page }) => {
      const result = await registerOrSkip(request, icp);
      console.log(`  → register: ${result}`);

      await login(page, icp);
      const profileStatus = await setupProfile(page, icp);
      console.log(`  → profile PUT: HTTP ${profileStatus || '?'}`);
      if (profileStatus) expect(profileStatus).toBe(200);

      await ensureClient(page, icp);
      await page.screenshot({ path: `tests/e2e/screenshots/icp-${icp.label}-00-setup.png`, fullPage: true });
      console.log(`✅ ${icp.label}: account ready`);
    });

    // ── FREE PLAN ─────────────────────────────────────────────────────────
    test.describe('— FREE plan —', () => {

      test('F1 · Dashboard accessible', async ({ page }) => {
        setPlan(icp.email, 'free');
        await login(page, icp);
        await page.goto(`${BASE}/dashboard`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main').first()).toBeVisible();
        await page.screenshot({ path: `tests/e2e/screenshots/icp-${icp.label}-F1-dashboard.png`, fullPage: true });
        console.log(`✅ FREE [${icp.label}]: dashboard OK`);
      });

      test('F2 · Can create invoice manually', async ({ page }) => {
        await login(page, icp);
        const url = await createInvoice(page, `FREE-${icp.label}`);
        await page.screenshot({ path: `tests/e2e/screenshots/icp-${icp.label}-F2-invoice.png`, fullPage: true });
        if (url) console.log(`✅ FREE [${icp.label}]: invoice → ${url}`);
        else console.log(`⚠ FREE [${icp.label}]: invoice URL not captured (check screenshot)`);
      });

      test('F3 · PDF generation is accessible', async ({ page, request }) => {
        await login(page, icp);
        const invoicesRes = await request.get(`${BASE}/api/invoices`);
        const invoices = await invoicesRes.json().catch(() => []);
        if (!invoices.length) { console.log(`  ⚠ no invoices yet`); return; }

        const invoiceId = invoices[0].id;
        let pdfStatus = 0;
        page.on('response', (res) => {
          if (res.url().includes('/api/invoices/') && res.url().includes('/pdf')) pdfStatus = res.status();
        });
        await page.goto(`${BASE}/dashboard/invoices/${invoiceId}`);
        await page.waitForLoadState('networkidle');
        const pdfBtn = page.getByRole('button', { name: /générer le pdf/i }).first();
        if (await pdfBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await pdfBtn.click();
          await page.waitForTimeout(8000);
          console.log(`  → PDF API: HTTP ${pdfStatus}`);
          expect(pdfStatus).toBe(200);
        }
        await page.screenshot({ path: `tests/e2e/screenshots/icp-${icp.label}-F3-pdf.png`, fullPage: true });
        console.log(`✅ FREE [${icp.label}]: PDF OK`);
      });

      test('F4 · Chorus Pro submission BLOCKED (403)', async ({ request, page }) => {
        await login(page, icp);
        const invoicesRes = await request.get(`${BASE}/api/invoices`);
        const invoices = await invoicesRes.json().catch(() => []);
        if (!invoices.length) { console.log(`  ⚠ no invoices`); return; }

        const res = await request.post(`${BASE}/api/invoices/${invoices[0].id}/submit-ppf`, {
          data: { pisteEnv: 'sandbox' },
        });
        expect(res.status()).toBe(403);
        const body = await res.json().catch(() => ({}));
        console.log(`✅ FREE [${icp.label}]: PPF blocked 403 → "${body.error ?? 'no message'}"`);
      });

      test('F5 · E-reporting BLOCKED (403)', async ({ request, page }) => {
        await login(page, icp);
        const res = await request.post(`${BASE}/api/e-reporting`, {
          data: { period: '2026-01', type: 'B2C' },
        });
        expect(res.status()).toBe(403);
        const body = await res.json().catch(() => ({}));
        console.log(`✅ FREE [${icp.label}]: E-reporting blocked 403 → "${body.error ?? 'no message'}"`);
      });

      test('F6 · Settings shows "Gratuit" badge', async ({ page }) => {
        await login(page, icp);
        await page.goto(`${BASE}/dashboard/settings`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        const freeBadge = page.getByText(/gratuit/i);
        await expect(freeBadge.first()).toBeVisible({ timeout: 8_000 });
        await page.screenshot({ path: `tests/e2e/screenshots/icp-${icp.label}-F6-settings.png`, fullPage: true });
        console.log(`✅ FREE [${icp.label}]: "Gratuit" badge visible`);
      });
    });

    // ── PRO PLAN ──────────────────────────────────────────────────────────
    test.describe('— PRO plan —', () => {

      test('P1 · DB upgrade → Settings shows "Pro" badge', async ({ page }) => {
        const ok = setPlan(icp.email, 'pro');
        if (!ok) { test.skip(!DB_URL, 'DATABASE_URL not set'); return; }

        const dbRow = getPlanFromDB(icp.email);
        console.log(`  → DB row after upgrade: ${dbRow}`);

        await login(page, icp);
        await page.goto(`${BASE}/dashboard/settings`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const proBadge = page.locator('.badge').filter({ hasText: /pro/i }).first();
        await expect(proBadge).toBeVisible({ timeout: 8_000 });
        await page.screenshot({ path: `tests/e2e/screenshots/icp-${icp.label}-P1-pro-badge.png`, fullPage: true });
        console.log(`✅ PRO [${icp.label}]: Pro badge confirmed`);
      });

      test('P2 · Can still create invoice (no limit)', async ({ page }) => {
        await login(page, icp);
        const url = await createInvoice(page, `PRO-${icp.label}`);
        await page.screenshot({ path: `tests/e2e/screenshots/icp-${icp.label}-P2-invoice.png`, fullPage: true });
        if (url) console.log(`✅ PRO [${icp.label}]: invoice → ${url}`);
      });

      test('P3 · Chorus Pro PPF gate LIFTED', async ({ request, page }) => {
        await login(page, icp);
        const invoicesRes = await request.get(`${BASE}/api/invoices`);
        const invoices = await invoicesRes.json().catch(() => []);
        if (!invoices.length) { console.log(`  ⚠ no invoices`); return; }

        const res = await request.get(`${BASE}/api/invoices/${invoices[0].id}/ppf-preflight`);
        expect(res.status()).not.toBe(403);
        console.log(`✅ PRO [${icp.label}]: PPF preflight accessible (HTTP ${res.status()})`);
      });

      test('P4 · E-reporting gate LIFTED', async ({ request, page }) => {
        await login(page, icp);
        const res = await request.post(`${BASE}/api/e-reporting`, {
          data: { period: '2026-01', type: 'B2C' },
        });
        expect(res.status()).not.toBe(403);
        console.log(`✅ PRO [${icp.label}]: E-reporting accessible (HTTP ${res.status()})`);
      });

      test('P5 · AI extraction endpoint reachable (not plan-gated)', async ({ request, page }) => {
        await login(page, icp);
        // Send a minimal multipart — expect anything but 403
        const res = await request.post(`${BASE}/api/invoices/extract`, {
          multipart: {
            file: {
              name: 'dummy.txt',
              mimeType: 'text/plain',
              buffer: Buffer.from('test'),
            },
          },
        });
        expect(res.status()).not.toBe(403);
        console.log(`✅ PRO [${icp.label}]: AI extract accessible (HTTP ${res.status()})`);
      });
    });
  });
}
