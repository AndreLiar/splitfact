# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

All application code lives in `splitfact-app/`. Run every `npm` and `npx` command from that directory. The root contains only documentation (`AGENTS.md`, `AI_PIVOT_PRODUCT_DIRECTION.md`, `FACTURX_IMPLEMENTATION_PLAN.md`) and this file.

## Commands (run from `splitfact-app/`)

```bash
# Development
npm run dev                # Next.js dev server on :3000
npm run build              # prisma generate + next build
npm run lint               # ESLint

# Testing
npm test                   # Jest (all unit tests)
npm run test:api           # API tests in tests/api/
npm run test:integration   # DB integration tests
npm run test:e2e           # Playwright
npm run test:coverage      # Coverage report

# Database
npx prisma generate        # Regenerate client after schema changes
npx prisma db push         # Apply schema to DB without migration
npx prisma db seed         # Seed initial data
```

## Architecture

**Splitfact** is an AI-powered invoicing platform for French micro-entrepreneurs (MicroBIC, BNC, SASU, EI auto-entrepreneur regimes).

### Stack
- **Next.js 15 App Router** — pages in `src/app/`, API routes as `src/app/api/**/route.ts`
- **Prisma + Neon PostgreSQL** — all DB access via `src/lib/prisma.ts` singleton; no raw SQL
- **NextAuth.js** — session auth; config in `src/lib/auth-options.ts`
- **Stripe Connect** — multi-party payouts for collective revenue sharing
- **OpenAI GPT-4o-mini** (production) / **Ollama DeepSeek Coder v2** (local, `AI_MODE=local`)
- **Tailwind CSS + Shadcn/UI** — component styling

### AI System
`src/lib/ai-service.ts` is the universal entry point — it respects `AI_MODE` and enforces per-user budget limits (€0.50/day, €5/month) via `src/lib/cost-monitor.ts`. Simple queries go directly to the model; complex fiscal queries are routed by `src/lib/smart-query-router.ts` to the multi-agent system in `src/lib/fiscal-agents.ts` + `src/lib/multi-agent-orchestrator.ts`. Always go through `ai-service.ts`, not the provider SDKs directly.

### French Fiscal Compliance
- URSSAF calculations and declaration assistance live in `src/lib/fiscal-context.ts` and `src/lib/fiscal-regulation-monitor.ts`
- TVA thresholds: €91,900 (commercial) / €36,800 (services)
- Invoice validation: `src/lib/invoice-readiness.ts`
- Factur-X (EU e-invoice format): `src/lib/facturx/` — fully unblocked. `@stafyniaksacha/facturx` installed on Node 22; `generate` and `check` exports confirmed. Integration code requires no changes.

### Collective Revenue Sharing
Collectives allow multiple users to split invoice revenue. A `CollectiveMember` record holds the role (admin/member) and share percentage. `src/lib/subInvoiceGenerator.ts` creates sub-invoices; `CollectivePayout` records track Stripe Connect payouts with retry logic.

### Key Patterns
- Import path alias `@/` maps to `src/`
- PascalCase components, camelCase utilities, kebab-case route folders
- Async Server Components (`AsyncFiscalHealthWidget`, `AsyncSmartSuggestions`) for streaming fiscal data
- PWA offline support via IndexedDB (`src/lib/offline-storage.ts`) + service worker (`next-pwa`)

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth session config |
| `AI_MODE` | `local` (Ollama) or `openai` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI — default model `gpt-4o-mini` |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | Local Ollama endpoint |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe payments |
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM` | Sender address for invoice/reminder emails (default: `InvoiceOps <noreply@invoiceops.fr>`) |
| `CLOUDINARY_*` | File/image storage |
| `CRON_SECRET` | Vercel cron job auth |
| `PISTE_CLIENT_ID` / `PISTE_CLIENT_SECRET` | PISTE OAuth2 app credentials (sandbox: `APP_SANDBOX_kanmegnea@gmail.com`) |
| `PISTE_ENV` | `sandbox` or `production` |
| `PISTE_WEBHOOK_SECRET` | Shared secret for `/api/webhooks/ppf` |
| `CPRO_TECH_LOGIN` / `CPRO_TECH_PASSWORD` | Chorus Pro compte technique credentials for `cpro-account` header |
| `SIRENE_API_KEY` | INSEE SIRENE v3 API key for SIRET validation |

New variables must be documented in `splitfact-app/README.md`.

## Branch Strategy
- `main` → production (auto-deploy Vercel)
- `staging` → pre-production
- `dev` → active development

Schema changes require a Prisma migration committed alongside the application change.
