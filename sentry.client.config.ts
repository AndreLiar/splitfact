import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,       // 20% of transactions for performance
  replaysOnErrorSampleRate: 1, // Full replay on every error
  replaysSessionSampleRate: 0.05,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,   // GDPR: mask all text in replays
      blockAllMedia: true,
    }),
  ],
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    /^AbortError/,
  ],
});
