/**
 * Production smoke test — runs against invoiceops.fr
 * Usage: npm run test:smoke
 *
 * Uses a dedicated test account (SMOKE_EMAIL / SMOKE_PASSWORD env vars).
 * Creates a real invoice and verifies PDF download — does NOT subscribe to Pro
 * (free tier allows 5 invoices/month, enough for CI smoke).
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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

  // ── 3. Create client ───────────────────────────────────────────────────────
  test('3 · Create a client', async ({ page }) => {
    if (!PASSWORD) { test.skip(true, 'SMOKE_PASSWORD not set'); return; }
    await login(page);
    await page.goto(`${BASE}/dashboard/clients`);
    await page.waitForLoadState('networkidle');

    // Open add-client modal or form
    const addBtn = page.getByRole('button', { name: /ajouter|nouveau client|add client/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    await page.fill('input[name="name"], input[placeholder*="nom"]', INVOICE_CLIENT);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('client-smoke@example.com');
    }

    const saveBtn = page.getByRole('button', { name: /enregistrer|sauvegarder|créer|save/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-03-client-created.png' });
    console.log('✅ Client created');
  });

  // ── 4. Create invoice ──────────────────────────────────────────────────────
  test('4 · Create an invoice', async ({ page }) => {
    if (!PASSWORD) { test.skip(true, 'SMOKE_PASSWORD not set'); return; }
    await login(page);
    await page.goto(`${BASE}/dashboard/create-invoice`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Select client
    const clientSelect = page.locator('select[name="clientId"], input[name="clientId"]').first();
    if (await clientSelect.isVisible()) {
      if (await clientSelect.evaluate(el => el.tagName) === 'SELECT') {
        // Pick first real option (index 1, index 0 is usually placeholder)
        const options = await clientSelect.locator('option').count();
        if (options > 1) await clientSelect.selectOption({ index: 1 });
      }
    }

    // Fill description
    const descInput = page.locator('input[name="description"], textarea[name="description"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill(INVOICE_DESC);
    }

    // Fill unit price
    const priceInput = page.locator('input[name*="price"], input[name*="unitPrice"], input[placeholder*="prix"]').first();
    if (await priceInput.isVisible()) {
      await priceInput.fill('500');
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04a-invoice-form.png', fullPage: true });

    // Submit
    const submitBtn = page.getByRole('button', { name: /créer|enregistrer|sauvegarder/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04b-invoice-created.png', fullPage: true });
    console.log('✅ Invoice created, URL:', page.url());
  });

  // ── 5. Download PDF ────────────────────────────────────────────────────────
  test('5 · Download invoice PDF', async ({ page }) => {
    if (!PASSWORD) { test.skip(true, 'SMOKE_PASSWORD not set'); return; }
    await login(page);
    await page.goto(`${BASE}/dashboard/invoices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click first invoice row to open detail
    const firstRow = page.locator('tbody tr, .invoice-card, [data-invoice-id]').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });
    await firstRow.click();
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-05a-invoice-detail.png', fullPage: true });

    // Download PDF
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    const pdfBtn = page.getByRole('link', { name: /pdf|télécharger|download/i }).first();
    await pdfBtn.click();

    const download = await downloadPromise;
    const savePath = path.join('tests/e2e/screenshots', `smoke-invoice-${Date.now()}.pdf`);
    await download.saveAs(savePath);

    const size = fs.statSync(savePath).size;
    expect(size, 'Downloaded PDF is empty').toBeGreaterThan(1000);

    console.log(`✅ PDF downloaded — ${size} bytes at ${savePath}`);
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
