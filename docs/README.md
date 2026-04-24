# InvoiceOps — Documentation

AI-powered e-invoicing and fiscal compliance platform for French micro-entrepreneurs (MicroBIC, BNC, SASU, EI).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [E-Invoicing & PPF Submission](#3-e-invoicing--ppf-submission)
4. [PPF Strategy — Product Owner Position](#4-ppf-strategy--product-owner-position)
5. [Fiscal Compliance](#5-fiscal-compliance)
6. [AI Invoice Extraction](#6-ai-invoice-extraction)
7. [Billing & Subscriptions](#7-billing--subscriptions)
8. [Environment Variables](#8-environment-variables)
9. [Branch & Deployment Strategy](#9-branch--deployment-strategy)

---

## 1. Product Overview

InvoiceOps is a SaaS platform that automates the full invoicing lifecycle for French self-employed professionals:

- **Invoice creation** with EN 16931 / Factur-X compliance validation
- **AI extraction** from scanned images and PDFs (OCR via Groq / Ollama)
- **Factur-X generation** — PDF/A-3 with embedded CII XML
- **PPF submission** — direct deposit to Chorus Pro via PISTE OAuth2
- **E-reporting B2C** — automated CII TypeCode 751 XML (art. 290 CGI)
- **Compliance scoring** — 0–100 score with €15/invoice penalty simulation (art. 1737 II CGI)
- **Stripe billing** — Free tier (5 invoices/month) and Pro at €49/month

### Plans

| Feature | Free | Pro (€49/month) |
|---|---|---|
| Invoices | 5/month | Unlimited |
| AI extraction (OCR) | — | ✅ |
| Factur-X generation | — | ✅ |
| PPF / Chorus Pro submission | — | ✅ |
| E-reporting B2C | — | ✅ |
| Compliance score | Basic | Full |
| Recurring billing | — | ✅ |
| SIRET validation | — | ✅ |
| Audit log | — | ✅ |

---

## 2. Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Database | Prisma + Neon PostgreSQL |
| Auth | NextAuth.js |
| UI | Bootstrap 5 + Bootstrap Icons |
| Payments | Stripe |
| Email | Resend |
| Storage | Cloudinary |
| AI | Groq (primary) / Ollama (fallback) |

### Code Structure

```
src/
├── app/
│   ├── api/              # API routes (route.ts files)
│   └── dashboard/        # App pages
├── domains/
│   ├── invoices/         # activity-log, invoice-readiness, ubl-serializer, facturx/
│   ├── compliance/       # compliance scoring, e-reporting/
│   ├── notifications/    # notification-service with retry queue
│   └── fiscal/           # fiscal-context (user business metrics)
├── lib/                  # Infrastructure: prisma, auth, email, cloudinary, piste-api, sirene-api
│   └── llm-router.ts     # LLM provider routing
└── types/
    ├── fiscal.ts          # UserFiscalProfile and related interfaces
    └── api.ts             # ApiResponse<T>, PaginatedResponse<T>
```

Always import from `@/domains/*` in new code. Files in `src/lib/` are infrastructure-only or re-export shims.

### Invoice Status Model

Two separate status fields on `Invoice`:

- `status` — `draft | sent | paid`
- `workflowStatus` — `triggered → collecting_data → blocked → ready_for_review → ready_to_issue → issued`
- `ppfStatus` — tracks PPF lifecycle: `DEPOSEE → EN_COURS_DE_ROUTAGE → RECUE → APPROUVEE | REJETEE`

---

## 3. E-Invoicing & PPF Submission

### How it works (per user)

Each InvoiceOps user connects their own Chorus Pro account via their PISTE credentials stored encrypted in the database. The platform submits invoices on their behalf using their credentials.

**Credential flow:**
1. User creates a PISTE app at [piste.gouv.fr](https://piste.gouv.fr) → subscribes to the **Factures** API → gets Client ID + Secret
2. User creates a Chorus Pro compte technique at [portail.chorus-pro.gouv.fr](https://portail.chorus-pro.gouv.fr) → Raccordements → Compte technique (requires Gestionnaire role)
3. User enters all four values in **Settings → Chorus Pro**
4. Credentials are AES-256 encrypted before storage

### Submission flow

```
Invoice → evaluateInvoiceReadiness() → generateFacturX() → submitInvoiceToPpf() → ppfStatus: DEPOSEE
                                                                        ↓
                                              ppf-status-poll cron (daily) → getPpfInvoiceStatus()
```

### Key files

| File | Purpose |
|---|---|
| `src/lib/piste-api.ts` | PISTE OAuth2 client — token cache, submit, poll, receive, download |
| `src/domains/invoices/facturx/` | Factur-X CII XML generator + validator |
| `src/domains/invoices/ubl-serializer.ts` | UBL 2.1 / EN 16931 XML serializer |
| `src/app/api/invoices/[invoiceId]/submit-ppf/route.ts` | Triggers PPF submission |
| `src/app/api/cron/ppf-retry/route.ts` | Daily retry for failed submissions |
| `src/app/api/cron/ppf-status-poll/route.ts` | Daily status polling |

### PISTE API endpoints used

| Operation | Endpoint |
|---|---|
| Submit invoice | `POST /cpro/factures/v1/deposer/flux` |
| Poll status | `POST /cpro/factures/v1/consulter/historique` |
| Search received | `POST /cpro/factures/v1/rechercher/recipiendaire` |
| Download XML | `POST /cpro/factures/v1/telecharger/groupe` |

---

## 4. PPF Strategy — Product Owner Position

### Current model (Phase 1): Per-tenant credentials

Each user manages their own PISTE + Chorus Pro credentials. This is the current implementation. It is intentional — it gets InvoiceOps to market quickly with zero legal liability as a transmitter.

**Target users for Phase 1:** Accountants and tech-forward micro-entrepreneurs who can follow the setup guide.

### Why we are NOT pursuing TDT/PDP certification (yet)

Becoming a certified Plateforme de Dématérialisation Partenaire (PDP) requires:
- 12–18 months of AIFE certification process
- Hundreds of thousands of euros in security audits and infrastructure
- A dedicated compliance team

That is Pennylane territory (€50M+ raised). InvoiceOps does not have that runway at this stage.

### The roadmap

**Phase 1 — Now (live)**
Ship with per-tenant credentials. Get the first 50 paying users. Prove the tech works.

**Phase 2 — After 50 paying users**
Integrate a white-label PDP API. The user experience becomes seamless ("just submit") while InvoiceOps acts as a reseller of the PPF pipe on a per-transaction or revenue-share basis.

PDP candidates to evaluate:

| PDP | Notes |
|---|---|
| Docaposte | La Poste subsidiary, has white-label API program |
| Chorus Pro partenaires | For B2G specifically |
| Yooz / Oxalys | Mid-market, may have partner programs |

**Code impact of Phase 2:** Replace `piste-api.ts` transport layer with the PDP's API. Remove the credential form from Settings. Everything else — Factur-X generation, compliance scoring, e-reporting, AI extraction — stays identical. The architecture was designed for this swap.

**Phase 3 — 5,000+ users**
Evaluate full PDP certification. At that scale the economics justify the audit cost and the certification becomes a competitive moat.

### The real moat

PDP certification is not the moat. The moat is:
- AI invoice extraction (no competitor matches quality + speed)
- Factur-X generation with full EN 16931 validation
- Compliance scoring with penalty simulation
- The combined workflow: scan → validate → submit → poll → report

Odoo and Pennylane are PDPs, but they do not have this AI-first extraction pipeline for micro-entrepreneurs. That is the differentiation.

---

## 5. Fiscal Compliance

### Compliance scoring

`src/domains/compliance/compliance.ts` — `computeComplianceScore()`:
- Score 0–100 based on EN 16931 mandatory fields
- €15/invoice penalty simulation (art. 1737 II CGI)
- Capped at €45,000/year
- Returns score + blocking reasons + recent ComplianceEvent records

### E-reporting B2C

Required for invoices to non-assujetti clients (art. 290 CGI):
- Aggregates B2C invoices by TVA rate
- Generates CII TypeCode 751 XML
- Auto-submitted on the 2nd of each month via cron
- Route: `src/app/api/cron/e-reporting/route.ts`

### URSSAF rates (validated in CI)

| Régime | URSSAF | Income Tax |
|---|---|---|
| MicroBIC (COMMERCANT) | 12.8% | 1.0% |
| Prestataire de services | 22.0% | 1.7% |
| Libéral (BNC) | 22.0% | 2.2% |

---

## 6. AI Invoice Extraction

`src/lib/llm-router.ts` — provider-agnostic with automatic fallback:

| Provider | Role | Vision model | Text model |
|---|---|---|---|
| Groq | Primary | `llama-4-scout-17b` | `mistral-saba-24b` |
| Ollama Cloud | Fallback | `gemma3:27b` | `ministral-3:8b` |

Fallback triggers on: 429 rate limit, 5xx errors, timeouts, network failures.

- `extractFromImage()` — for PNG/JPEG/WEBP uploads
- `extractFromText()` — for PDFs (text extracted via `pdf-parse`)

**Rule:** Always call through `llm-router.ts`. Never instantiate provider SDKs directly in routes.

---

## 7. Billing & Subscriptions

| Item | Value |
|---|---|
| Free tier | 5 invoices/month, no PPF, no AI |
| Pro plan | €49/month, all features, 14-day trial |
| Payment processor | Stripe |
| Checkout | `POST /api/billing/checkout` |
| Webhook | `POST /api/webhooks/stripe-subscriptions` |
| Customer portal | Stripe Customer Portal (activate in Stripe dashboard) |

Plan gate: `user.planId === 'pro'` checked in API routes and UI components before Pro features.

### Going live checklist

- [ ] Create live Stripe Product + Price
- [ ] Register live webhook for `/api/webhooks/stripe-subscriptions`
- [ ] Update `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PLATFORM_WEBHOOK_SECRET` in Vercel
- [ ] Activate Stripe Customer Portal in Stripe dashboard

---

## 8. Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth session config |
| `LLM_PRIMARY` | `groq` (default) or `ollama` |
| `LLM_FALLBACK` | `ollama` (default) or `groq` |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | Text model, default `mistral-saba-24b` |
| `GROQ_VISION_MODEL` | Vision model, default `meta-llama/llama-4-scout-17b-16e-instruct` |
| `OLLAMA_API_KEY` | Ollama Cloud API key |
| `OLLAMA_BASE_URL` | Ollama Cloud endpoint |
| `OLLAMA_MODEL` | Ollama text model |
| `OLLAMA_VISION_MODEL` | Ollama vision model |
| `STRIPE_SECRET_KEY` | Stripe secret key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Stripe invoice webhook secret |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan |
| `STRIPE_PLATFORM_WEBHOOK_SECRET` | Webhook secret for subscription events |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| `CLOUDINARY_*` / `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | File/image storage |
| `CRON_SECRET` | Vercel cron auth header |
| `PISTE_CLIENT_ID` / `PISTE_CLIENT_SECRET` | Platform-level PISTE OAuth2 fallback |
| `PISTE_ENV` | `sandbox` or `production` |
| `CPRO_TECH_LOGIN` / `CPRO_TECH_PASSWORD` | Platform-level Chorus Pro compte technique fallback |
| `PISTE_WEBHOOK_SECRET` | Shared secret for `/api/webhooks/ppf` |
| `SIRENE_API_KEY` | INSEE SIRENE v3 API key for SIRET validation |

---

## 9. Branch & Deployment Strategy

| Branch | Environment | Auto-deploy |
|---|---|---|
| `main` | Production | Vercel (project `splitfact-6xo8`) |
| `staging` | Pre-production | Vercel preview |
| `dev` | Development | Vercel preview |

### Workflow

1. Branch off `dev`: `git checkout dev && git pull && git checkout -b feat/my-feature`
2. Open PR → `dev`
3. Wait for required CI checks: **Validate Pull Request**, **CodeQL Security Analysis**, **NPM Security Audit**
4. Merge → `dev`, then promote: `dev → staging → main` (separate PRs each)
5. Delete feature branch after merge

### Cron jobs (Vercel)

| Cron | Schedule | Purpose |
|---|---|---|
| `/api/cron/generate-urssaf-reports` | 1st of month, 9h | URSSAF declaration reports |
| `/api/cron/recurring-billing` | Daily 8h | Recurring invoice generation |
| `/api/cron/ppf-retry` | Daily midnight | Retry failed PPF submissions |
| `/api/cron/e-reporting` | 2nd of month, 6h | B2C e-reporting auto-submit |
| `/api/cron/ppf-receive` | Daily 7h | Fetch received invoices from PPF |
| `/api/cron/ppf-status-poll` | Daily noon | Poll PPF status for submitted invoices |

All cron routes validate `Authorization: Bearer $CRON_SECRET`.
