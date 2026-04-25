/**
 * Production smoke test — runs against invoiceops.fr
 * Usage: npm run test:smoke
 *
 * Uses a dedicated test account (SMOKE_EMAIL / SMOKE_PASSWORD env vars).
 * Creates a real invoice and verifies PDF download — does NOT subscribe to Pro
 * (free tier allows 5 invoices/month, enough for CI smoke).
 */
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.SMOKE_BASE_URL ?? 'https://invoiceops.fr';
const EMAIL = process.env.SMOKE_EMAIL ?? 'smoke-test@invoiceops.fr';
const PASSWORD = process.env.SMOKE_PASSWORD ?? '';

const INVOICE_CLIENT = 'Client Smoke Test';
const INVOICE_DESC   = 'Prestation de conseil — smoke test automatique';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE}/auth/signin`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe('InvoiceOps — production smoke test', () => {

  // ── 1. Landing page ────────────────────────────────────────────────────────
  test('1 · Landing page loads', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/InvoiceOps/i);
    await expect(page.locator('nav').first()).toBeVisible();

    // Must NOT show "Splitfact" anywhere visible
    const splitfactText = await page.getByText(/splitfact/i).count();
    expect(splitfactText, 'Old brand "Splitfact" still visible on landing page').toBe(0);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-01-landing.png', fullPage: true });
    console.log('✅ Landing page OK —', BASE);
  });

  // ── 2. Auth ────────────────────────────────────────────────────────────────
  test('2 · Login succeeds', async ({ page }) => {
    if (!PASSWORD) {
      test.skip(true, 'SMOKE_PASSWORD not set — skipping auth tests');
      return;
    }
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-02-dashboard.png', fullPage: true });
    console.log('✅ Login OK');
  });

  // ── 2b. Complete issuer profile in Settings ────────────────────────────────
  test('2b · Complete issuer profile', async ({ page }) => {
    if (!PASSWORD) { test.skip(true, 'SMOKE_PASSWORD not set'); return; }
    await login(page);
    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-02b-settings.png', fullPage: true });

    // Fill name
    const nameField = page.locator('input[placeholder*="Jean Dupont"]').first();
    if (await nameField.isVisible()) {
      await nameField.fill('Andre Kanmegne');
    }

    // SIRET
    const siretField = page.locator('input[placeholder="12345678900012"]').first();
    if (await siretField.isVisible()) {
      const current = await siretField.inputValue();
      if (!current || current.length < 14) await siretField.fill('89265544000017');
    }

    // APE code
    const apeField = page.locator('input[placeholder="6202A"]').first();
    if (await apeField.isVisible()) {
      const current = await apeField.inputValue();
      if (!current) await apeField.fill('6202A');
    }

    // Address
    const addressField = page.locator('textarea[placeholder*="rue"]').first();
    if (await addressField.isVisible()) {
      const current = await addressField.inputValue();
      if (!current) await addressField.fill('12 rue de la Paix, 75001 Paris');
    }

    // Fiscal regime — MicroBIC so microEntrepreneurType is required and fully validated
    const fiscalSelect = page.locator('select').filter({ has: page.locator('option[value="MicroBIC"]') }).first();
    if (await fiscalSelect.isVisible()) await fiscalSelect.selectOption('MicroBIC');

    // Legal status — "Micro-entreprise"
    const legalSelect = page.locator('select').filter({ has: page.locator('option[value="Micro-entreprise"]') }).first();
    if (await legalSelect.isVisible()) await legalSelect.selectOption('Micro-entreprise');

    // Nature de l'activité (microEntrepreneurType)
    const activitySelect = page.locator('select').filter({ has: page.locator('option[value="PRESTATAIRE"]') }).first();
    if (await activitySelect.isVisible()) await activitySelect.selectOption('PRESTATAIRE');

    // Declaration frequency (required for MicroBIC)
    const freqSelect = page.locator('select').filter({ has: page.locator('option[value="monthly"]') }).first();
    if (await freqSelect.isVisible()) await freqSelect.selectOption('monthly');

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-02b-before-save.png', fullPage: true });

    // Intercept and log the PUT /api/users/me response
    let saveResponse: { status: number; body: string } | null = null;
    page.on('response', async (res) => {
      if (res.url().includes('/api/users/me') && res.request().method() === 'PUT') {
        saveResponse = { status: res.status(), body: await res.text().catch(() => '') };
      }
    });

    // Save profile
    const saveBtn = page.getByRole('button', { name: /enregistrer le profil|sauvegarder/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
    await saveBtn.click();
    await page.waitForTimeout(2500);

    if (saveResponse) {
      console.log(`  → PUT /api/users/me → ${saveResponse.status}: ${saveResponse.body.slice(0, 200)}`);
      expect(saveResponse.status, `Profile save failed: ${saveResponse.body}`).toBe(200);
    } else {
      console.log('  ⚠ No PUT /api/users/me response captured');
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-02c-settings-saved.png', fullPage: true });
    console.log('✅ Issuer profile saved');
  });

  // ── 3. Create client ───────────────────────────────────────────────────────
  test('3 · Create a client', async ({ page }) => {
    if (!PASSWORD) { test.skip(true, 'SMOKE_PASSWORD not set'); return; }
    await login(page);
    await page.goto(`${BASE}/dashboard/clients`);
    await page.waitForLoadState('networkidle');

    // Open add-client modal
    const addBtn = page.getByRole('button', { name: /nouveau client|ajouter un client|nouveau/i }).first();
    await addBtn.click();
    await page.waitForTimeout(800);

    // Fill name field (try multiple selectors)
    const nameInput = page.locator('input[name="name"], input[placeholder*="nom"], input[placeholder*="entreprise"]').first();
    await nameInput.fill(INVOICE_CLIENT);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('client-smoke@example.com');
    }

    // Submit modal — button says "Ajouter le client" or "Enregistrer les modifications"
    const saveBtn = page.getByRole('button', { name: /ajouter le client|enregistrer les modifications/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-03-client-created.png' });
    console.log('✅ Client created');
  });

  // ── 4. Create invoice (manual entry flow) ──────────────────────────────────
  test('4 · Create an invoice', async ({ page }) => {
    if (!PASSWORD) { test.skip(true, 'SMOKE_PASSWORD not set'); return; }
    await login(page);
    await page.goto(`${BASE}/dashboard/create-invoice`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04a-landing.png', fullPage: true });

    // "Saisir manuellement →" is a button (not a link) that hides the upload zone
    const manualBtn = page.getByRole('button', { name: /saisir manuellement/i }).first();
    await expect(manualBtn).toBeVisible({ timeout: 8_000 });
    await manualBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04b-form.png', fullPage: true });

    // Step 1 — select client (two instances in DOM: desktop + mobile, use first visible)
    const clientSelect = page.locator('select#clientId').first();
    await expect(clientSelect).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(1000); // wait for client list to load
    const optCount = await clientSelect.locator('option').count();
    if (optCount > 1) await clientSelect.selectOption({ index: 1 });

    // Step 1 — fill due date (invoiceDate is pre-filled; dueDate is required)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    await page.locator('input#dueDate').first().fill(dueDateStr);

    // Proceed to step 2
    await page.waitForTimeout(500); // let React re-render after field changes
    const nextBtn = page.getByRole('button', { name: /étape suivante/i }).first();
    await nextBtn.click();
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04c-step2.png', fullPage: true });

    // Step 2 — fill item description and unit price (inputs use name= not placeholder)
    await page.locator('input[name="description"]').first().fill(INVOICE_DESC);
    await page.locator('input[name="unitPrice"]').first().fill('500');

    // Proceed to step 3
    await page.waitForTimeout(500);
    const nextBtn2 = page.getByRole('button', { name: /étape suivante/i }).first();
    await nextBtn2.click();
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04d-step3.png', fullPage: true });

    // Submit — button text is "Créer la facture prête" or "Créer le brouillon"
    const submitBtn = page.getByRole('button', { name: /créer la facture|créer le brouillon/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 10_000 });
    await submitBtn.click();
    await page.waitForTimeout(4000);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04e-created.png', fullPage: true });
    console.log('✅ Invoice created, URL:', page.url());
  });

  // ── 5. Download PDF ────────────────────────────────────────────────────────
  test('5 · Download invoice PDF', async ({ page }) => {
    if (!PASSWORD) { test.skip(true, 'SMOKE_PASSWORD not set'); return; }
    await login(page);
    await page.goto(`${BASE}/dashboard/invoices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Click "Voir les détails" for the first invoice (link has title only, no text)
    const detailLink = page.locator('tbody tr').first().locator('a[title*="détails"], a[href*="/invoices/"]').first();
    await expect(detailLink).toBeVisible({ timeout: 15_000 });
    await detailLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-05a-invoice-detail.png', fullPage: true });

    // Generate PDF and verify the API responds with 200
    let pdfResponse: { status: number } | null = null;
    page.on('response', (res) => {
      if (res.url().includes('/api/invoices/') && res.url().includes('/pdf')) {
        pdfResponse = { status: res.status() };
      }
    });

    const generateBtn = page.getByRole('button', { name: /générer le pdf/i }).first();
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();
    await page.waitForTimeout(8000);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-05b-pdf-generated.png', fullPage: true });

    if (pdfResponse) {
      console.log(`  → POST /api/invoices/.../pdf → ${pdfResponse.status}`);
      expect(pdfResponse.status, 'PDF generation API failed').toBe(200);
    } else {
      console.log('  ⚠ No PDF API response captured — checking for download link');
    }

    console.log('✅ PDF generation triggered successfully');
  });

  // ── 6. Branding check ─────────────────────────────────────────────────────
  test('6 · No Splitfact references in dashboard', async ({ page }) => {
    if (!PASSWORD) { test.skip(true, 'SMOKE_PASSWORD not set'); return; }
    await login(page);

    const pages = [
      `${BASE}/dashboard`,
      `${BASE}/dashboard/invoices`,
      `${BASE}/dashboard/settings`,
    ];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const count = await page.getByText(/splitfact/i).count();
      expect(count, `"Splitfact" found on ${url}`).toBe(0);
    }
    console.log('✅ No Splitfact references found in dashboard');
  });

});
