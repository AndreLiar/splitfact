# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

All application code lives in `splitfact-app/`. Run every `npm` and `npx` command from that directory.

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

**Splitfact** is an invoicing and fiscal compliance platform for French micro-entrepreneurs (MicroBIC, BNC, SASU, EI).

### Stack
- **Next.js 15 App Router** — pages in `src/app/`, API routes as `src/app/api/**/route.ts`
- **Prisma + Neon PostgreSQL** — all DB access via `src/lib/prisma.ts` singleton; no raw SQL
- **NextAuth.js** — session auth; config in `src/lib/auth-options.ts`
- **Bootstrap 5 + Bootstrap Icons** — UI (not Tailwind/Shadcn)
- **Stripe** — invoice payment checkout + webhooks
- **Resend** — transactional email via `src/lib/email-service.ts`
- **Cloudinary** — PDF and file storage via `src/lib/cloudinary.ts`

### Domain-Based Code Structure

Business logic lives in `src/domains/`, infrastructure in `src/lib/`. The old `src/lib/` domain files are re-export shims — always import from `@/domains/*` in new code.

```
src/
├── domains/
│   ├── invoices/        # activity-log, invoice-readiness, ubl-serializer, facturx/
│   ├── compliance/      # compliance scoring, e-reporting/
│   ├── notifications/   # notification-service with retry queue
│   └── fiscal/          # fiscal-context (user business metrics)
├── lib/                 # infrastructure only: prisma, auth, email, cloudinary, piste-api, sirene-api, utils
│   └── llm-router.ts    # LLM provider routing (Groq primary → Ollama fallback)
└── types/
    ├── fiscal.ts        # UserFiscalProfile and related interfaces
    └── api.ts           # ApiResponse<T>, PaginatedResponse<T>
```

Path aliases: `@/` → `src/`, `@/domains/*` → `src/domains/*`, `@/types/*` → `src/types/*`

### E-Invoicing & PPF Submission
- `src/lib/piste-api.ts` — PISTE OAuth2 + Chorus Pro API client. Two auth layers: Bearer token (PISTE) + `cpro-account` header (base64 of compte technique login:password). Uses JSON body with base64-encoded file, not multipart.
- `src/domains/invoices/facturx/` — Factur-X CII XML generator and validator
- `src/domains/invoices/ubl-serializer.ts` — UBL 2.1 / EN 16931 XML serializer
- `src/app/api/invoices/[invoiceId]/submit-ppf/route.ts` — triggers PPF submission
- `src/app/api/cron/ppf-retry/route.ts` — retries failed submissions (daily cron)
- `syntaxeFlux` values: `IN_DP_E1_CII_16B` for CII XML, `IN_DP_E2_CII_FACTURX` for PDF

### E-Reporting (B2C)
- `src/domains/compliance/e-reporting/generate.ts` — aggregates B2C invoices by TVA rate, builds CII TypeCode 751 XML (art. 290 CGI)
- `src/app/api/e-reporting/route.ts` — GET (fetch period) / POST (generate + optional submit)
- `src/app/api/cron/e-reporting/route.ts` — auto-submits on 2nd of month

### Compliance Monitoring
- `src/domains/compliance/compliance.ts` — `computeComplianceScore()`: score 0–100, €15/invoice penalty (art. 1737 II CGI), capped €45k/year
- `src/app/api/compliance/route.ts` — returns score + recent ComplianceEvent records

### LLM Router (Invoice OCR)
`src/lib/llm-router.ts` — provider-agnostic inference with automatic fallback:
- **Primary** (`LLM_PRIMARY=groq`): vision → `llama-4-scout-17b`, text → `mistral-saba-24b`
- **Fallback** (`LLM_FALLBACK=ollama`): vision → `gemma3:27b`, text → `ministral-3:8b` on Ollama Cloud
- Fallback triggers on: 429 rate limit, 5xx errors, timeouts, network failures
- `extractFromImage()` for PNG/JPEG/WEBP uploads, `extractFromText()` for PDFs (text extracted via `pdf-parse`)
- Always call through `llm-router.ts`, never instantiate provider SDKs directly in routes

### Invoice Readiness & Workflow
- `src/domains/invoices/invoice-readiness.ts` — `evaluateInvoiceReadiness()`: validates all EN 16931 mandatory fields before issue. Returns blocking reasons + warnings.
- `src/domains/invoices/activity-log.ts` — audit trail for all invoice lifecycle events
- Workflow statuses: `draft` → `issued`. PPF statuses tracked separately on `invoice.ppfStatus`.

### Notifications
- `src/domains/notifications/notification-service.ts` — `NotificationService` class with queue, exponential backoff retry (1min → 5min → 15min → 1h → 2h), and duplicate prevention within the same day.

### Key Patterns
- Sidebar nav: `src/app/components/Sidebar.tsx` — add new routes to the `NAV` object at the top
- All financial penalty/threshold logic must cite the relevant CGI article in a comment
- Cron routes all validate `Authorization: Bearer $CRON_SECRET` — Vercel Hobby plan only supports daily schedules (`0 X * * *`), not sub-hourly
- `src/lib/utils.ts` — `getLegalMentionsByFiscalRegime()` generates regime-specific legal text for invoices

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth session config |
| `LLM_PRIMARY` | `groq` (default) or `ollama` |
| `LLM_FALLBACK` | `ollama` (default) or `groq` |
| `GROQ_API_KEY` | Groq API key (`gsk_...`) |
| `GROQ_MODEL` | Text model, default `mistral-saba-24b` |
| `GROQ_VISION_MODEL` | Vision model, default `meta-llama/llama-4-scout-17b-16e-instruct` |
| `OLLAMA_API_KEY` | Ollama Cloud API key |
| `OLLAMA_BASE_URL` | Ollama Cloud endpoint, default `https://ollama.com/v1` |
| `OLLAMA_MODEL` | Ollama text model, default `ministral-3:8b` |
| `OLLAMA_VISION_MODEL` | Ollama vision model, default `gemma3:27b` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe payments |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email via Resend |
| `CLOUDINARY_*` / `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | File/image storage |
| `CRON_SECRET` | Vercel cron auth header |
| `PISTE_CLIENT_ID` / `PISTE_CLIENT_SECRET` | PISTE OAuth2 app credentials |
| `PISTE_ENV` | `sandbox` or `production` — switches all PISTE/Chorus Pro URLs |
| `CPRO_TECH_LOGIN` / `CPRO_TECH_PASSWORD` | Chorus Pro compte technique for `cpro-account` header |
| `PISTE_WEBHOOK_SECRET` | Shared secret for `/api/webhooks/ppf` |
| `SIRENE_API_KEY` | INSEE SIRENE v3 API key for SIRET validation |

## Branch Strategy
- `main` → production (auto-deploy Vercel project `splitfact-6xo8`)
- `staging` → pre-production
- `dev` → active development
- `refactor/domain-structure` — current working branch (pending merge to main)

Schema changes: run `nvm use 20 && npx prisma db push` after editing `prisma/schema.prisma`.

## Node Version Gotchas
- **App / Jest / Next.js**: Node 22 required (`libxmljs` native module won't build on Node 20 on macOS arm64)
- **Prisma CLI** (`db push`, `db seed`): Node 20 required (`@prisma/engines` crashes on Node 22 with `ERR_INVALID_PACKAGE_CONFIG`)
- Use `nvm use 22` for day-to-day dev; only switch to 20 for Prisma CLI commands

## Git Workflow Note
The local git repo is corrupted. All git operations (commit, push, branch) must be performed from `/tmp/splitfact-fresh` (a clean clone). Sync local changes first:
```bash
rsync -a --checksum --delete \
  --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='coverage' \
  /Users/andreyvanlaurelkanmegnetabouguie/Desktop/Business/Splitfact/splitfact-app/ \
  /tmp/splitfact-fresh/
cd /tmp/splitfact-fresh && git add -A && git commit -m "..." && git push
```
