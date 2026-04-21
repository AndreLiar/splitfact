# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

All application code lives in `splitfact-app/`. Run every `npm` and `npx` command from that directory. The root contains only `revolut/` and this app directory.

## Commands (run from `splitfact-app/`)

```bash
# Development — use Node 22 (libxmljs requires it on macOS arm64)
nvm use 22 && npm run dev      # Next.js dev server on :3000
npm run build                   # prisma generate + next build
npm run lint                    # ESLint

# Testing — Node 22 works fine for Jest
npx jest tests/lib/ubl-serializer.test.ts   # single test file
npx jest --testNamePattern "score"           # single test by name
npm test                                     # all unit tests
npm run test:api                             # API tests in tests/api/
npm run test:integration                     # DB integration tests
npm run test:e2e                             # Playwright

# Database — must use Node 20 for Prisma CLI (Node 22 crashes prisma binary)
nvm use 20 && npx prisma db push     # apply schema changes
nvm use 20 && npx prisma db seed     # seed initial data
npx prisma generate                  # regenerate client (Node 22 ok)
```

## Architecture

**InvoiceOps** (branded as Splitfact internally) is an AI-powered invoicing platform for French micro-entrepreneurs under regimes MicroBIC, BNC, SASU, EI.

### Stack
- **Next.js 15 App Router** — pages in `src/app/`, API routes as `src/app/api/**/route.ts`
- **Prisma + Neon PostgreSQL** — all DB access via `src/lib/prisma.ts` singleton; no raw SQL
- **NextAuth.js** — session auth; config in `src/lib/auth-options.ts`
- **Stripe Connect** — multi-party payouts for collective revenue sharing
- **OpenAI GPT-4o-mini** (production) / **Ollama DeepSeek Coder v2** (local, `AI_MODE=local`)
- **Bootstrap 5 + Bootstrap Icons** — UI (not Tailwind/Shadcn despite what old docs say)

### E-Invoicing & PPF Submission
The full e-invoicing stack is implemented and live in sandbox:
- `src/lib/piste-api.ts` — PISTE OAuth2 + Chorus Pro API client. Two auth layers: Bearer token (PISTE) + `cpro-account` header (base64 of compte technique login:password). Uses JSON body with base64-encoded file, not multipart.
- `src/lib/facturx/` — Factur-X CII XML generator (`facturx-generator.ts`) and validator
- `src/lib/ubl-serializer.ts` — UBL 2.1 / EN 16931 XML serializer
- `src/app/api/invoices/[invoiceId]/submit-ppf/route.ts` — triggers PPF submission
- `src/app/api/cron/ppf-retry/route.ts` — retries failed submissions every 30 min
- `syntaxeFlux` values: `IN_DP_E1_CII_16B` for CII XML, `IN_DP_E2_CII_FACTURX` for PDF

### E-Reporting (B2C)
- `src/lib/e-reporting/generate.ts` — aggregates B2C invoices by TVA rate, builds CII TypeCode 751 XML
- `src/app/api/e-reporting/route.ts` — GET (fetch period) / POST (generate + optional submit)
- `src/app/api/cron/e-reporting/route.ts` — auto-submits on 2nd of month
- `src/app/dashboard/e-reporting/page.tsx` — management UI

### Compliance Monitoring
- `src/lib/compliance.ts` — `computeComplianceScore()`: score 0–100, €15/invoice penalty (art. 1737 II CGI), capped €45k/year
- `src/app/api/compliance/route.ts` — returns score + recent ComplianceEvent records
- `src/app/dashboard/compliance/page.tsx` — score gauge + events log

### AI System
`src/lib/ai-service.ts` is the universal entry point — respects `AI_MODE`, enforces per-user budget limits (€0.50/day, €5/month) via `src/lib/cost-monitor.ts`. Complex fiscal queries route through `src/lib/smart-query-router.ts` → `src/lib/fiscal-agents.ts` + `src/lib/multi-agent-orchestrator.ts`. Always go through `ai-service.ts`, not provider SDKs directly.

### Collective Revenue Sharing
`CollectiveMember` holds role + share. `src/lib/subInvoiceGenerator.ts` creates sub-invoices. `CollectivePayout` records track Stripe Connect payouts with retry logic.

### Key Patterns
- Import path alias `@/` maps to `src/`
- Sidebar nav: `src/app/components/Sidebar.tsx` — add new routes to the `NAV` object at the top
- All financial penalty/threshold logic must cite the relevant CGI article in a comment

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth session config |
| `AI_MODE` | `local` (Ollama) or `openai` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI — default model `gpt-4o-mini` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe payments |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email via Resend |
| `CLOUDINARY_*` / `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | File/image storage |
| `CRON_SECRET` | Vercel cron auth — all cron handlers validate `Authorization: Bearer $CRON_SECRET` |
| `PISTE_CLIENT_ID` / `PISTE_CLIENT_SECRET` | PISTE OAuth2 app credentials |
| `PISTE_ENV` | `sandbox` or `production` — switches all PISTE/Chorus Pro URLs automatically |
| `CPRO_TECH_LOGIN` / `CPRO_TECH_PASSWORD` | Chorus Pro compte technique for `cpro-account` header |
| `PISTE_WEBHOOK_SECRET` | Shared secret for `/api/webhooks/ppf` |
| `SIRENE_API_KEY` | INSEE SIRENE v3 API key for SIRET validation |

## Branch Strategy
- `main` → production (auto-deploy Vercel project `splitfact-6xo8`)
- `staging` → pre-production
- `dev` → active development

Schema changes: run `nvm use 20 && npx prisma db push` after editing `prisma/schema.prisma`.

## Node Version Gotchas
- **App / Jest / Next.js**: Node 22 required (`libxmljs` native module won't build on Node 20 on macOS arm64)
- **Prisma CLI** (`db push`, `db seed`): Node 20 required (`@prisma/engines` crashes on Node 22 with `ERR_INVALID_PACKAGE_CONFIG`)
- Use `nvm use 22` for day-to-day dev; only switch to 20 for Prisma CLI commands
