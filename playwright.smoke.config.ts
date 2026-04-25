import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'smoke-prod.spec.ts',
  timeout: 45_000,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-smoke-report', open: 'never' }]],
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? 'https://invoiceops.fr',
    headless: true,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
