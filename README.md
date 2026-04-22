# InvoiceOps

**The AI back office for French e-invoicing compliance.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

InvoiceOps automates the path from approved work to compliant issued invoice — for French agencies and service SMEs navigating the 2026–2027 e-invoicing reform.

Most invoicing tools stop at document creation. InvoiceOps completes the workflow: it collects the data, validates compliance, routes the invoice, tracks status, and surfaces only exceptions for human review.

---

## Why Now

French e-invoicing reform creates a hard deadline:
- **1 September 2026** — all VAT-liable businesses must be able to *receive* e-invoices
- **1 September 2027** — SMEs and micro-businesses must also *issue* them

The winning product is not compliance software. It is software that **gets the admin work done**.

---

## Who It's For

French agencies and service SMEs with 5–50 employees:
- creative agencies, consulting firms, dev shops
- staffing and recruiting firms
- expert-service boutiques

These businesses invoice frequently, manage billing across email, CRM, proposals, and PDFs, and feel the regulatory pressure without having strong internal finance ops.

---

## Core Value

**From deal won to compliant paid invoice, with humans only handling exceptions.**

---

## What the Product Does

### Invoice Readiness Engine
- Validates every EN 16931 mandatory field before issuance
- Distinguishes blocking compliance errors from optional warnings
- Readiness state (`ready` / `blocked`) is visible on every invoice

### Billing Workflow State Machine
- Tracks invoices through explicit states: `triggered → collecting_data → blocked → ready_for_review → ready_to_issue → issued`
- Timestamped transitions with full audit trail
- Invalid transitions are prevented

### AI-Powered OCR & Data Extraction
- Upload a PDF or image → structured invoice data extracted automatically
- **Groq** (primary): vision `llama-4-scout-17b`, text `mistral-saba-24b`
- **Ollama Cloud** (fallback): vision `gemma3:27b`, text `ministral-3:8b`
- Automatic failover on rate limits, 5xx, and timeouts

### E-Invoicing Output (Factur-X / PPF)
- **Factur-X CII XML** generation compliant with EN 16931
- **UBL 2.1** serializer
- **PPF / Chorus Pro** submission via PISTE API with automatic daily retry
- Webhook endpoint for PPF delivery status updates

### E-Reporting (B2C — art. 290 CGI)
- Aggregates B2C invoices by TVA rate into CII TypeCode 751 XML
- Auto-submits on the 2nd of each month

### Compliance Monitoring
- Compliance score 0–100 with penalty simulation (art. 1737 II CGI — €15/invoice, capped €45k/year)
- URSSAF reminders (monthly/quarterly) with TVA threshold alerts
- SIRET validation via INSEE SIRENE v3

### Payments
- Stripe Connect — clients pay online, funds go directly to the service provider's account

### Notifications
- In-app queue with exponential backoff retry (1min → 5min → 15min → 1h → 2h)
- Duplicate prevention within the same day

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.14 (App Router) |
| Language | TypeScript |
| UI | Bootstrap 5 + Bootstrap Icons |
| Database | Prisma ORM + Neon PostgreSQL |
| Auth | NextAuth.js |
| Payments | Stripe Connect |
| AI / OCR | Groq (primary) → Ollama Cloud (fallback) |
| Email | Resend |
| File Storage | Cloudinary |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites
- Node.js 22 (required for `libxmljs`)
- Node.js 20 for Prisma CLI only
- PostgreSQL (Neon recommended)

### 1. Clone and install
```bash
git clone https://github.com/AndreLiar/splitfact.git
cd splitfact
nvm use 22 && npm install
```

### 2. Environment setup
Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://user:password@host/splitfact"

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# LLM Router
LLM_PRIMARY=groq
LLM_FALLBACK=ollama
GROQ_API_KEY=gsk_...
GROQ_MODEL=mistral-saba-24b
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
OLLAMA_API_KEY=your-ollama-cloud-key
OLLAMA_BASE_URL=https://ollama.com/v1
OLLAMA_MODEL=ministral-3:8b
OLLAMA_VISION_MODEL=gemma3:27b

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=no-reply@yourdomain.com

# File Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...

# Cron
CRON_SECRET=your-cron-secret

# E-Invoicing — PISTE / Chorus Pro
PISTE_CLIENT_ID=...
PISTE_CLIENT_SECRET=...
PISTE_ENV=sandbox
CPRO_TECH_LOGIN=...
CPRO_TECH_PASSWORD=...
PISTE_WEBHOOK_SECRET=...

# SIRET validation
SIRENE_API_KEY=...
```

### 3. Database
```bash
nvm use 20 && npx prisma db push && nvm use 22
```

### 4. Run
```bash
npm run dev   # http://localhost:3000
```

---

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # ESLint

npm test                 # Unit tests
npm run test:api         # API integration tests
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright

npm run db:health        # DB connectivity check
npm run db:backup        # Dump DB
npm run pwa:validate     # Validate PWA setup
```

---

## Project Structure

```
src/
├── domains/
│   ├── invoices/        # invoice-readiness, ubl-serializer, facturx/, activity-log
│   ├── compliance/      # compliance scoring, e-reporting/
│   ├── notifications/   # NotificationService with retry queue
│   └── fiscal/          # fiscal-context (user business metrics)
├── lib/                 # Infrastructure: prisma, auth, email, cloudinary, piste-api, sirene-api
│   └── llm-router.ts    # Groq → Ollama Cloud failover
├── app/
│   ├── api/             # API routes
│   │   ├── invoices/    # CRUD, PDF, PPF submission
│   │   ├── cron/        # PPF retry, e-reporting, URSSAF reminders
│   │   ├── stripe/      # Onboarding, webhooks
│   │   └── compliance/  # Compliance score
│   └── dashboard/       # App pages
└── types/
    ├── fiscal.ts         # UserFiscalProfile
    └── api.ts            # ApiResponse<T>, PaginatedResponse<T>
```

---

## Branch Workflow

```
main      ← Production (auto-deploy to Vercel)
staging   ← Pre-production
dev       ← Active development
```

1. Branch from `dev`: `git checkout -b feat/my-feature`
2. PR → `dev`, wait for Copilot review, merge
3. Promote: `dev → staging → main` (separate PRs)
4. Delete feature branch after merge

---

## Node Version Notes

- **Dev / Jest / builds**: Node 22 (`nvm use 22`)
- **Prisma CLI only**: Node 20 (`nvm use 20`)

---

## License

MIT — see [LICENSE](LICENSE).

---

*InvoiceOps — Issue compliant invoices and handle exceptions automatically.*
