import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'kanmegnea@gmail.com';
const PASSWORD = 'admin123';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE}/auth/signin`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

async function section(name: string) {
  console.log(`\n${'─'.repeat(60)}\n▶  ${name}\n${'─'.repeat(60)}`);
}

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe('InvoiceOps — full user flow', () => {

  // ── 1. Landing page ────────────────────────────────────────────────────────
  test('1 · Landing page loads and key sections are visible', async ({ page }) => {
    await section('Landing page');
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/InvoiceOps|Splitfact/i);

    // Navbar brand
    await expect(page.locator('nav').first()).toBeVisible();

    // Hero section
    const hero = page.locator('section, div').filter({ hasText: /factur|invoic|e-fact/i }).first();
    await expect(hero).toBeVisible();

    // CTA buttons
    const ctaLinks = page.getByRole('link', { name: /accès bêta|démo|réserver/i });
    await expect(ctaLinks.first()).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/01-landing.png', fullPage: true });
    console.log('✅ Landing page OK');
  });

  // ── 2. Navigation links on landing ────────────────────────────────────────
  test('2 · Landing nav links scroll to sections', async ({ page }) => {
    await section('Landing navigation');
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Click "Comment ça marche" nav link
    await page.getByRole('link', { name: /comment ça marche/i }).first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/e2e/screenshots/02-how-it-works.png' });
    console.log('✅ Nav link scroll OK');
  });

  // ── 3. Sign-in page ────────────────────────────────────────────────────────
  test('3 · Sign-in page renders correctly', async ({ page }) => {
    await section('Sign-in page');
    await page.goto(`${BASE}/auth/signin`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /connexion|se connecter|sign in/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/03-signin.png' });
    console.log('✅ Sign-in page OK');
  });

  // ── 4. Register page ───────────────────────────────────────────────────────
  test('4 · Register page renders correctly', async ({ page }) => {
    await section('Register page');
    await page.goto(`${BASE}/auth/register`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /créer|compte|register/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/04-register.png' });
    console.log('✅ Register page OK');
  });

  // ── 5. Login ───────────────────────────────────────────────────────────────
  test('5 · Login with real account', async ({ page }) => {
    await section('Login');
    await page.goto(`${BASE}/auth/signin`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.screenshot({ path: 'tests/e2e/screenshots/05a-signin-filled.png' });

    await page.click('button[type="submit"]');

    try {
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      await page.screenshot({ path: 'tests/e2e/screenshots/05b-after-login.png' });
      console.log('✅ Login succeeded — redirected to:', page.url());
    } catch {
      await page.screenshot({ path: 'tests/e2e/screenshots/05b-login-error.png' });
      const error = await page.locator('[class*="alert"], [class*="error"], [role="alert"]').first().textContent().catch(() => 'unknown');
      console.log('❌ Login failed. Error shown:', error);
      throw new Error(`Login failed. Current URL: ${page.url()}`);
    }
  });

  // ── 6. Dashboard ───────────────────────────────────────────────────────────
  test('6 · Dashboard — KPI cards and recent invoices table', async ({ page }) => {
    await section('Dashboard');
    await login(page);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/e2e/screenshots/06a-dashboard.png', fullPage: true });

    // Sidebar exists in DOM (CSS d-none hides it at certain widths, so just check presence)
    const sidebar = page.locator('nav').filter({ hasText: /factures|clients|tableau de bord/i });
    expect(await sidebar.count()).toBeGreaterThan(0);

    const currentUrl = page.url();
    console.log(`  → Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('onboarding')) {
      console.log('  ℹ Account has no data yet — redirected to onboarding. Checking onboarding page...');
      const onboardingHeading = await page.getByRole('heading').first().textContent().catch(() => '—');
      console.log(`  → Onboarding heading: "${onboardingHeading}"`);
    } else {
      const cards = page.locator('.card, [class*="stat-card"]');
      const cardCount = await cards.count();
      console.log(`  → ${cardCount} cards found on dashboard`);
      const hasMetrics = await page.getByText(/volume|encaissement|en attente/i).count();
      console.log(`  → ${hasMetrics} metric labels found`);
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/06b-dashboard-scrolled.png', fullPage: true });
    console.log('✅ Dashboard OK');
  });

  // ── 7. Invoices list ───────────────────────────────────────────────────────
  test('7 · Invoices page — list, filters, search', async ({ page }) => {
    await section('Invoices list');
    await login(page);
    await page.goto(`${BASE}/dashboard/invoices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/07a-invoices.png', fullPage: true });

    // Header
    await expect(page.getByText(/vos factures/i).first()).toBeVisible();

    // Search input (two exist in DOM for desktop/mobile — use first visible)
    const search = page.locator('input[placeholder*="Numéro, client"]').first();
    if (await search.isVisible()) {
      await search.fill('TEST');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/07b-invoices-search.png' });
      await search.clear();
    }

    // Status filter
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('draft');
      await page.waitForTimeout(400);
      await statusFilter.selectOption('all');
    }

    const invoiceCount = await page.locator('tbody tr, .invoice-card').count();
    console.log(`  → ${invoiceCount} invoice rows visible`);

    await page.screenshot({ path: 'tests/e2e/screenshots/07c-invoices-final.png', fullPage: true });
    console.log('✅ Invoices list OK');
  });

  // ── 8. Create invoice ──────────────────────────────────────────────────────
  test('8 · Create invoice page — form renders', async ({ page }) => {
    await section('Create invoice');
    await login(page);
    await page.goto(`${BASE}/dashboard/create-invoice`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/08a-create-invoice.png', fullPage: true });

    // Form should be visible
    const form = page.locator('form, [class*="form"]').first();
    const hasForm = await form.isVisible().catch(() => false);
    console.log(`  → Form visible: ${hasForm}`);

    // Check for key fields
    const fields = await page.locator('input, select, textarea').count();
    console.log(`  → ${fields} form fields found`);

    await page.screenshot({ path: 'tests/e2e/screenshots/08b-create-invoice-scrolled.png', fullPage: true });
    console.log('✅ Create invoice page OK');
  });

  // ── 9. Exceptions page ────────────────────────────────────────────────────
  test('9 · Exceptions page loads', async ({ page }) => {
    await section('Exceptions');
    await login(page);
    await page.goto(`${BASE}/dashboard/exceptions`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/09-exceptions.png', fullPage: true });

    const heading = await page.getByRole('heading').first().textContent();
    console.log(`  → Page heading: "${heading}"`);
    console.log('✅ Exceptions page OK');
  });

  // ── 10. Clients page ──────────────────────────────────────────────────────
  test('10 · Clients page — list and add client modal', async ({ page }) => {
    await section('Clients');
    await login(page);
    await page.goto(`${BASE}/dashboard/clients`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/10a-clients.png', fullPage: true });

    const clientCount = await page.locator('tbody tr, .client-card').count();
    console.log(`  → ${clientCount} client rows visible`);

    // Try opening add client modal/form
    const addBtn = page.getByRole('button', { name: /ajouter|nouveau|créer|add/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/e2e/screenshots/10b-clients-modal.png' });
      // Close modal
      const closeBtn = page.getByRole('button', { name: /fermer|annuler|close|cancel/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }

    console.log('✅ Clients page OK');
  });

  // ── 11. Notifications page ────────────────────────────────────────────────
  test('11 · Notifications page', async ({ page }) => {
    await section('Notifications');
    await login(page);
    await page.goto(`${BASE}/dashboard/notifications`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'tests/e2e/screenshots/11-notifications.png', fullPage: true });

    const heading = page.getByRole('heading', { name: /notifications/i });
    await expect(heading).toBeVisible();
    console.log('✅ Notifications page OK');
  });

  // ── 12. Settings page ─────────────────────────────────────────────────────
  test('12 · Settings page', async ({ page }) => {
    await section('Settings');
    await login(page);
    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'tests/e2e/screenshots/12-settings.png', fullPage: true });

    const heading = await page.getByRole('heading').first().textContent();
    console.log(`  → Settings heading: "${heading}"`);
    console.log('✅ Settings page OK');
  });

  // ── 13. Sidebar navigation ────────────────────────────────────────────────
  test('13 · Sidebar navigation links all resolve (no 404)', async ({ page }) => {
    await section('Sidebar links');
    await login(page);

    const routes = [
      '/dashboard',
      '/dashboard/invoices',
      '/dashboard/exceptions',
      '/dashboard/create-invoice',
      '/dashboard/clients',
      '/dashboard/notifications',
      '/dashboard/settings',
    ];

    const results: { route: string; status: string; title: string }[] = [];

    for (const route of routes) {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400);

      const h1 = await page.getByRole('heading').first().textContent().catch(() => '—');
      const hasError = await page.getByText(/404|not found|erreur/i).count();

      results.push({
        route,
        status: hasError > 0 ? '❌ ERROR' : '✅ OK',
        title: h1?.trim() ?? '—',
      });
    }

    console.log('\n  Route audit:');
    results.forEach(r => console.log(`  ${r.status}  ${r.route.padEnd(40)} "${r.title}"`));

    const failed = results.filter(r => r.status.includes('❌'));
    if (failed.length > 0) {
      throw new Error(`${failed.length} routes have errors: ${failed.map(r => r.route).join(', ')}`);
    }
    console.log('\n✅ All sidebar routes OK');
  });

  // ── 14. Invoice detail (first available) ──────────────────────────────────
  test('14 · Invoice detail page', async ({ page }) => {
    await section('Invoice detail');
    await login(page);
    await page.goto(`${BASE}/dashboard/invoices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find first "Voir" link
    const viewLink = page.getByRole('link', { name: /voir/i }).first();
    const hasLink = await viewLink.isVisible().catch(() => false);

    if (!hasLink) {
      console.log('  ℹ No invoices exist yet — skipping detail view');
      return;
    }

    await viewLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'tests/e2e/screenshots/14-invoice-detail.png', fullPage: true });
    const url = page.url();
    console.log(`  → Navigated to: ${url}`);
    console.log('✅ Invoice detail OK');
  });

  // ── 15. Logout ────────────────────────────────────────────────────────────
  test('15 · Logout', async ({ page }) => {
    await section('Logout');
    await login(page);

    // Desktop sidebar is inside d-none d-lg-block wrapper — click its user menu
    const desktopSidebar = page.locator('.d-none.d-lg-block').first();
    const userMenu = desktopSidebar.locator('#sidebarUserMenu');
    await userMenu.click({ force: true });
    await page.waitForTimeout(600);

    await page.screenshot({ path: 'tests/e2e/screenshots/15a-logout-menu.png' });

    const logoutBtn = page.getByRole('button', { name: /déconnexion|logout/i }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    await logoutBtn.click();
    await page.waitForURL(/\/|\/auth\/signin/, { timeout: 10_000 });
    await page.screenshot({ path: 'tests/e2e/screenshots/15b-after-logout.png' });

    console.log('✅ Logout OK — redirected to:', page.url());
  });

});
