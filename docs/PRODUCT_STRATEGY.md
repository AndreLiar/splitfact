# InvoiceOps AI — Product Strategy

> Single source of truth for product direction, market research, domain knowledge, technical landscape, MVP scope, and PRFAQ.
> Supersedes `AI_PIVOT_PRODUCT_DIRECTION.md`.
> For e-invoicing compliance implementation epics and sprints, see `EINVOICING_COMPLIANCE_PLAN.md`.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Why Now](#2-why-now)
3. [Market Research](#3-market-research)
4. [Domain Research](#4-domain-research)
5. [Technical Research](#5-technical-research)
6. [ICP & Positioning](#6-icp--positioning)
7. [Product Brief](#7-product-brief)
8. [MVP Epic Backlog](#8-mvp-epic-backlog)
9. [MVP Feature Spec](#9-mvp-feature-spec)
10. [PRFAQ](#10-prfaq)
11. [Risks](#11-risks)
12. [Related Documents](#12-related-documents)

---

## 1. Product Overview

**InvoiceOps AI** is a billing workflow engine for French service SMEs that takes an invoice from triggered to compliant, issued, and tracked — with AI handling data gaps and humans only approving exceptions.

| | |
|---|---|
| **Category** | Vertical SaaS — French SMB finance operations |
| **Positioning** | "The AI back office for French e-invoicing compliance" |
| **Vision** | From deal won to compliant paid invoice, with humans only handling exceptions |
| **Model** | SaaS — flat monthly + volume tier |

---

## 2. Why Now

The French e-invoicing mandate is the most disruptive regulatory change to hit French SMEs in 20 years. Every VAT-liable business must comply.

| Deadline | Obligation |
|---|---|
| **September 1, 2026** | ALL VAT-liable businesses must be able to **receive** e-invoices via PPF |
| **September 1, 2027** | SMEs and micro-entrepreneurs must be able to **issue** e-invoices via PPF |

The window to become the compliance default for this segment is 18–24 months. The mandate creates urgency; the workflow pain creates retention.

---

## 3. Market Research

### Market Size

| Metric | Figure |
|---|---|
| VAT-liable businesses in France | ~4.1M |
| Service SMEs 5–50 employees | ~280,000 |
| Agencies + consulting firms | ~60,000 |
| Average invoices/month (service SME) | 15–80 |
| Compliance software ARPU (France, SME) | €150–400/month |

**TAM** (all VAT-liable): €4.1M × €150/yr = ~€615M/yr
**SAM** (service SMEs 5–50): 280K × €250/yr = ~€70M/yr
**SOM** (Year 3, agencies + consulting): 3,000 customers × €350/yr = ~€12.5M ARR

### Competitive Landscape

| Player | Strength | Weakness | Threat |
|---|---|---|---|
| **Pennylane** | Strong SME accounting + invoicing | Generic, not workflow-focused | High — well funded, fast moving |
| **Axonaut** | Agency-first CRM + invoicing | No e-invoicing compliance yet | Medium — same ICP |
| **Sellsy** | Full suite (CRM, billing, accounting) | Complex, expensive, bloated | Low — different positioning |
| **Chorus Pro (PPF)** | Free government platform | Zero UX, no automation | Low — we route through it |
| **Sage / Cegid** | Deep accounting, large customers | No AI, enterprise-only pricing | Low |
| **Indy / Georges** | Micro-entrepreneur accounting | AE-focused, low ARPU | Low — different ICP |
| **Libeo** | B2B payment + invoice routing | AP-focused, not issuing side | Medium — partial overlap |

**White space:** No player is purpose-built for the *issuing workflow* of a service agency — from trigger to Factur-X delivery via PPF — with AI filling compliance gaps. Pennylane is the closest threat but competes on breadth; InvoiceOps competes on depth of workflow execution.

### Demand Signals

- DGFiP estimates 2.2M businesses will need new tooling by Sept 2026
- Google Trends FR: "facture électronique obligatoire" +340% YoY since 2024
- IFAC 2024 survey: 68% of SME accountants say clients are "not prepared"
- Chorus Pro processes 250M+ invoices/year for public sector — private sector volume will dwarf this

### Pricing Benchmarks

| Tool | Price | What's included |
|---|---|---|
| Pennylane Pro | €199/mo | Accounting + invoicing |
| Axonaut | €69–159/mo | CRM + invoicing |
| Libeo | €149/mo | AP automation |
| Qonto + invoicing | €29–99/mo | Banking + basic invoicing |

**InvoiceOps sweet spot:** €199–399/mo for workflow-complete plan, volume-tiered above 100 invoices/month.

### Moat Sequence

1. **Now:** Workflow depth + compliance knowledge
2. **12 months:** Rejection/exception data flywheel (AI gets better per customer)
3. **18+ months:** PDP certification (licensed platform, routing fee revenue, regulatory barrier to entry)
4. **Optionally:** White-label for accounting firms with large SME client bases

---

## 4. Domain Research

### The Mandate — Y-Model Architecture

```
Issuer → OD (Operator of Dematerialization) → PPF (Portail Public de Facturation)
                                              ↕
                                         PDP (certified private platform)
                                              ↓
                                          Recipient
```

- **PPF** (Chorus Pro): free, operated by AIFE. All invoices must flow through or be notifiable here.
- **PDP**: privately certified platforms (Sage, Cegid, others). Can substitute PPF for routing but must notify PPF.
- **OD**: tools like InvoiceOps that prepare and transmit to PPF/PDP on behalf of the issuer. InvoiceOps is currently positioned here.

### Invoice Lifecycle States (DGFiP official)

| State | Meaning |
|---|---|
| `DEPOSEE` | Received by PPF |
| `EN_COURS_DE_ROUTAGE` | Being routed to recipient |
| `RECUE` | Delivered to recipient |
| `REJETEE` | Rejected (format error or recipient refusal) |
| `REFUSEE` | Buyer explicitly refused |
| `APPROUVEE` | Buyer approved |
| `PAYEE` | Payment registered |

### Mandatory Invoice Fields (EN 16931 / French transposition)

**Seller:** SIRET, legal name, address, VAT number (or franchise mention), professional liability insurance (regulated professions)

**Buyer:** SIRET, legal name, delivery address

**Invoice:** unique number, issue date, due date, payment terms, line items (description, quantity, unit price, VAT rate), late payment penalty rate, recovery indemnity (€40 fixed), `transactionType` (B2B/B2C/B2G), buyer purchase order reference

### Supported Formats

| Format | Description | Status |
|---|---|---|
| **Factur-X** | PDF/A-3 + embedded CII XML — French-German standard | Partially integrated (MINIMUM profile) |
| **UBL 2.1** | European interoperability standard | Not yet built |
| **CII D16B** | Pure XML — less common in France | Not planned |

### URSSAF & Tax Context for Micro-Entrepreneurs

- Social contributions: 12.3% (BIC services), 21.2% (BNC), 22% (commercial BIC) — declared quarterly or monthly
- TVA franchise thresholds: **€91,900** (commercial), **€36,800** (services) — above = TVA liability begins
- CFE: annual local business tax
- Impôt sur le revenu: progressive scale OR versement libératoire (flat %)

### E-Reporting Rules

Required when the transaction is **not** covered by B2B e-invoicing:
- B2C sales (all)
- International B2B (exports, intra-EU)
- Transactions with non-taxable entities

Reported monthly (if monthly URSSAF) or quarterly to PPF via dedicated API endpoint.

### Key Institutions

| Body | Role |
|---|---|
| DGFiP | Tax authority, sets mandate rules |
| AIFE | Operates Chorus Pro / PPF |
| DGCCRF | Enforces invoicing compliance, can fine |
| ACOSS / URSSAF | Social contribution collection |
| INSEE | SIRENE directory (SIRET validation) |

### Penalty Exposure

- **€15 per non-compliant invoice** (Art. 1737 II CGI)
- **Cap: €45,000/year** per legal entity
- Inspectors can audit 3 years retroactively

---

## 5. Technical Research

### API Ecosystem

| API | Purpose | Auth | Status |
|---|---|---|---|
| **PISTE (api.gouv.fr)** | PPF invoice submission + lifecycle | OAuth2 client_credentials | Not integrated |
| **INSEE SIRENE v3** | SIRET/SIREN lookup + validation | API key (free) | Not integrated |
| **Chorus Pro** | Public sector AP receiving | PISTE layer | Same as PISTE |
| **OpenAI GPT-4o-mini** | Data extraction, compliance assistant | API key | Integrated |
| **Stripe Connect** | Collective revenue splits | Secret key | Integrated |
| **Resend** | Transactional email | API key | Integrated |
| **Cloudinary** | Document/PDF storage | Cloud credentials | Integrated |

### Format Libraries

| Library | Purpose | Status |
|---|---|---|
| `@stafyniaksacha/facturx` | Factur-X PDF/A-3 generation + validation | Installed, partially integrated |
| No UBL library (Node.js) | UBL 2.1 XML generation | Must build serializer |
| `xml2js` / `fast-xml-parser` | XML parsing for validation | Available |
| Schematron validator | EN 16931 rule validation | Must integrate (XSLT-based CI step) |

### Technical Risks

| Risk | Severity | Mitigation |
|---|---|---|
| PISTE sandbox instability / breaking changes | High | Pin API version, build retry + circuit breaker |
| Factur-X EXTENDED profile compliance | Medium | Integrate Schematron CI step before shipping |
| UBL 2.1 serializer correctness | Medium | Validate against OASIS test suite |
| SIRENE API rate limiting (1,000 req/day free) | Medium | 24h Prisma cache layer |
| PDF/A-3 spec compliance under Node 22 | Low | Already confirmed working |
| Vercel cold start for AI routes | Low | Keep AI routes under 10s timeout |

### Architecture Assessment

**Strengths:**
- Next.js App Router is correct — streaming Server Components work well for async fiscal data
- Prisma + Neon scales to ~100K invoices without architectural changes
- `ai-service.ts` abstraction is clean — supports OpenAI and local Ollama

**Gaps:**
- No job queue — Vercel cron is sufficient now, but consider Trigger.dev or Inngest at 500+ customers
- No event bus — PISTE webhook lifecycle events need reliable propagation
- Cloudinary needs a structured folder schema `/{userId}/{year}/{invoiceId}/` for audit trail retrieval

### Build vs. Buy

| Component | Decision | Reason |
|---|---|---|
| PPF transmission | Build thin client over PISTE REST | Simple REST API |
| SIRET validation | Build with SIRENE API | Free, straightforward |
| Factur-X generation | Extend existing library | Already installed and working |
| UBL 2.1 | Build serializer | No mature Node.js library exists |
| E-reporting XML | Build | DGFiP spec is well-documented |
| Job queue (future) | Buy (Trigger.dev) | Not worth building at current scale |
| PDP certification | Deferred 18+ months | Requires AIFE audit + €200K+ investment |

---

## 6. ICP & Positioning

### Primary Customer

**French service SMEs with 5–50 employees:**
- Creative agencies
- Consulting firms
- Software / dev shops
- Staffing and recruiting firms
- Expert-service boutiques

**Economic buyer:** founder, COO, head of finance, office/admin manager

**Why them:** Invoice often, fragmented tools (email, CRM, proposals, spreadsheets, PDFs), no strong internal finance ops, regulatory pressure.

### Positioning Options (evaluated)

| Option | Message | Verdict |
|---|---|---|
| Compliance tool | "Be e-invoicing ready by 2026" | Becomes irrelevant post-mandate |
| Finance co-pilot | "AI CFO for your agency" | Too broad, no urgency |
| Billing workflow engine | "From deal won to paid — zero back-and-forth" | **Chosen** — enduring problem, mandate is wedge |

### GTM Wedge

French agencies and service firms already billing clients monthly.
Entry message: **"Be ready for French e-invoicing without adding finance headcount."**

---

## 7. Product Brief

### Problem Statement

French service agencies issue 15–80 invoices per month across fragmented tools. Starting September 2026, every invoice must comply with the French e-invoicing mandate: specific mandatory fields, Factur-X or UBL format, routed through PPF. The penalty is €15 per non-compliant invoice. Most have no system ready.

The problem is not invoice creation — tools exist for that. The problem is **completing the invoicing process without back-and-forth**: missing client SIRET, incomplete delivery address, wrong format, rejected by PPF, no one following up on payment.

### Solution

An agentic workflow system that takes a billing event and completes the invoice operation:
1. Gather data from source systems
2. Detect and request missing client/invoice fields
3. Validate French invoice compliance
4. Prepare structured e-invoice-ready output (Factur-X / UBL)
5. Route to PPF via PISTE API
6. Track delivery, rejection, and payment states
7. Escalate only exceptions to a human

### Core Value Proposition

**Turn a billing trigger into a compliant, routed, tracked invoice — without adding finance headcount.**

### Jobs To Be Done

1. "Get this invoice out the door without chasing the client for their legal details"
2. "Know which invoices are blocked and why, right now"
3. "Be ready for the e-invoicing mandate without hiring someone"
4. "Know which invoices haven't been paid and what to do about it"

### Success Metrics (MVP)

| Metric | Target |
|---|---|
| Time from billing trigger to issued invoice | < 10 minutes (vs. 45–90 min manual) |
| Invoices blocked due to missing data | < 5% (auto-resolved by AI) |
| PPF submission success rate | > 97% on first attempt |
| Customer invoice compliance score | > 90% within 30 days |
| Time to first issued invoice (onboarding) | < 20 minutes |

### Product Principles

1. **Done beats advised** — Surface what needs action, not dashboards to interpret
2. **Mandate as wedge, workflow as product** — The regulation creates urgency; workflow pain creates retention
3. **Exceptions only** — The product handles everything it can; humans only see what it cannot resolve
4. **Audit-first** — Every action is logged. Compliance means being able to prove what happened

### MVP Completion Standard

The pivot MVP is complete when the product can answer, for every invoice:
- Is it blocked or ready?
- If blocked, why?
- Who needs to act?
- What is the next workflow step?
- Has it been issued?
- Has it been paid?

---

## 8. MVP Epic Backlog

### Wave 1 — Core MVP

#### Epic 1: Invoice Readiness Engine (P0)
Decide clearly whether an invoice is ready to issue or blocked.

**Acceptance criteria:**
- Each invoice has a visible readiness state: `ready` or `blocked`
- Missing client or invoice fields are listed explicitly
- Readiness checks run before issue actions
- Legal/compliance blockers are distinguishable from optional warnings

#### Epic 2: Billing Workflow State Machine (P0)
Track invoice work as an operational workflow, not only as a document.

**States:** `triggered` → `collecting_data` → `blocked` → `ready_for_review` → `ready_to_issue` → `issued`

**Acceptance criteria:**
- State transitions are timestamped
- Current state is visible in dashboard and invoice views
- Invalid transitions are prevented

#### Epic 3: Exception Inbox (P0)
Centralize blocked work in one place.

**Acceptance criteria:**
- Blocked invoice jobs appear in a dedicated queue
- Each blocked item shows reason codes
- Users can open, resolve, and move the invoice forward
- Queue can be filtered by reason and urgency

#### Epic 4: Client Data Quality Layer (P0)
Make the client module support invoice readiness directly.

**Acceptance criteria:**
- Client completeness score is shown
- Missing billing-critical fields are flagged
- A "blocking billing" segment exists
- Client edits immediately affect readiness on linked invoices

#### Epic 5: Review and Issue Flow (P0)
Create a final controlled step before issuance.

**Acceptance criteria:**
- Ready invoices have a dedicated review screen
- Issue action is separate from draft save
- Issued invoices become immutable
- PDF generation is tied to the issue step

#### Epic 6: Factur-X Generation and Compliance Output (P0)
Generate French-standard hybrid invoices as compliant output.

**Acceptance criteria:**
- Issued invoice generates a `factur-x.xml` file using UN/CEFACT CII
- Generated PDF is `PDF/A-3` with embedded `factur-x.xml`
- Factur-X only runs on invoices marked ready to issue
- Validation status and errors are visible when generation fails
- Implementation supports versioned validation (Factur-X 1.08 / ZUGFeRD 2.4, valid from Jan 15, 2026)

### Wave 2 — Operational Completion

#### Epic 7: Payment Follow-up Basics (P1)
Cover the minimum invoice-to-cash loop.

**Acceptance criteria:**
- Due-soon and overdue states are visible
- Payment status is editable
- Dashboard highlights unpaid risk
- Reminder action exists (manual at first)

#### Epic 8: Audit Trail and Operational Logging (P1)
Make workflow actions traceable.

**Acceptance criteria:**
- Key actions are logged with timestamp and actor
- Status transitions are recorded
- Audit data is visible on invoice detail pages

#### Epic 9: Guided Onboarding to First Value (P1)
Get a new account to its first usable billing workflow fast.

**Acceptance criteria:**
- Issuer legal profile setup is guided
- First client setup is prompted
- First invoice flow is explained step by step
- Empty states push toward first value
- Time to first issued invoice < 20 minutes

### Wave 3 — Product Hardening

#### Epic 10: Trigger Intake (P1)
Create invoice jobs from a simple operational trigger.

**Acceptance criteria:**
- Manual "new billing job" entry exists
- Trigger types supported: manual, recurring, uploaded document
- Trigger source is recorded in audit trail

#### Epic 11: Product Surface Cleanup (P0)
Remove off-pivot product areas.

**Acceptance criteria:**
- Off-pivot routes are removed or redirected
- Navigation only exposes MVP modules
- Dashboard widgets reflect only MVP behavior

#### Epic 12: MVP QA and Hardening (P0)
Make the MVP reliable enough for production use.

**Acceptance criteria:**
- Core flows covered by tests
- Permission checks enforced
- Validation errors handled cleanly
- PDF and status actions fail safely

---

## 9. MVP Feature Spec

### Data Model

Minimum entities:
- `Client` — with SIRET, completeness score, billing-critical fields
- `BillingTrigger` — source event type, timestamp, linked client
- `InvoiceJob` — workflow state machine, linked trigger + client
- `InvoiceDraft` — structured field store, compliance check results
- `ComplianceCheck` — per-field status, blockers vs. warnings
- `Exception` — reason code, resolution log, assignee
- `ActivityLog` — actor, action, timestamp, entity reference

### Key Screens

- Billing jobs list (pipeline view by state)
- Invoice job detail (state + compliance + exceptions)
- Exception inbox (blocked queue)
- Invoice draft review (pre-issue approval)
- Client data panel (completeness score + field gaps)
- Activity/audit timeline

### User Roles

| Role | Needs |
|---|---|
| Admin / Founder | Pipeline visibility, compliance confidence, low overhead |
| Billing Operator / Office Manager | Exception queue, fast approval/edit flow, fewer emails |

### What NOT to Build at MVP

- Direct PDP connection (route through PPF)
- Full legal/tax advisory engine
- Deep CRM integrations
- Multi-entity / multi-brand support
- Full ERP reconciliation
- Payment automation
- Accountant dashboard

---

## 10. PRFAQ

### Press Release

**FOR IMMEDIATE RELEASE**

**InvoiceOps AI Launches to Make French E-Invoicing Mandate Effortless for Service Agencies**

*Automated billing workflow engine routes compliant Factur-X invoices to Chorus Pro in one click — months before the September 2026 deadline*

**Paris, France** — InvoiceOps AI today launched its billing workflow engine designed specifically for French service agencies and consulting firms facing the most significant invoicing regulatory change in two decades. Starting September 2026, all VAT-liable businesses in France must send and receive electronic invoices via the government's Portail Public de Facturation (PPF). Most small firms have no system ready.

InvoiceOps AI solves this without requiring businesses to hire finance staff or learn complex government platforms. The product automatically validates client SIRET numbers against the INSEE SIRENE directory, checks every invoice for the mandatory fields required by EN 16931, generates a compliant Factur-X PDF, and deposits it to Chorus Pro via the PISTE API — all in one workflow.

"Our clients were asking us every week what they needed to do for the e-invoicing mandate," said the head of operations at a 12-person Paris consulting firm. "InvoiceOps gave us the answer and then did the work for us. Our first compliant invoice took 8 minutes."

The product includes an Exception Inbox that surfaces only the invoices requiring human attention — missing delivery addresses, ambiguous client data, buyer rejections — so operators spend time on decisions, not data entry. Payment tracking and overdue follow-up close the loop from issue to collection.

InvoiceOps AI is available today at invoiceops.fr. Pricing starts at €199/month.

---

### FAQ

**Q: What exactly does InvoiceOps AI do?**
It runs your billing workflow. You trigger an invoice (manually, from a recurring schedule, or by uploading a document). InvoiceOps validates the client's SIRET, checks all mandatory fields, generates a Factur-X or UBL 2.1 file, and deposits it to Chorus Pro. You approve and send — or it handles exceptions for you.

**Q: Do I need to understand the e-invoicing mandate to use this?**
No. The compliance rules are embedded in the product. If something is missing or wrong, you'll see a plain-language explanation of what needs to be fixed.

**Q: What happens if my invoice gets rejected by Chorus Pro?**
InvoiceOps receives the rejection event via PISTE webhook, surfaces it in your Exception Inbox with the rejection reason, and guides you to the fix. Corrected invoices are resubmitted automatically once approved.

**Q: Can I use this if I already have accounting software?**
Yes. InvoiceOps focuses on the issuing and routing workflow — the part most accounting tools handle poorly or not at all for the French mandate.

**Q: What about B2C invoices?**
B2C invoices don't flow through PPF. They are covered by e-reporting: a monthly summary of B2C and international transaction totals submitted to DGFiP. InvoiceOps handles this automatically.

**Q: What's the penalty for non-compliance?**
€15 per non-compliant invoice, capped at €45,000 per year per legal entity. InvoiceOps tracks your compliance score and penalty exposure in real time.

**Q: When do I actually need to comply?**
- **September 1, 2026**: your customers who are large companies or ETIs must be able to send you e-invoices — you must be able to receive them
- **September 1, 2027**: you must issue e-invoices if you are an SME or micro-entrepreneur

**Q: What formats does InvoiceOps support?**
Factur-X (PDF/A-3 + CII XML, EN 16931 EXTENDED profile) and UBL 2.1. Both are accepted by PPF and major PDPs.

**Q: Can InvoiceOps become our PDP?**
Not today. PDP certification requires an AIFE audit, dedicated legal entity, and significant infrastructure investment. This is on the 18-month roadmap. Today InvoiceOps operates as an OD (Operator of Dematerialization) routing through PPF.

**Q: What does it cost?**
- **Starter** — €199/mo — up to 50 invoices/month
- **Growth** — €349/mo — up to 200 invoices/month
- **Scale** — €499/mo — unlimited + dedicated onboarding

**Q: Why not use Pennylane or Axonaut?**
Those tools help you create invoices. InvoiceOps completes the workflow: it validates the data before sending, routes through PPF, tracks lifecycle statuses, and surfaces only exceptions. No other tool today is purpose-built for that issuing workflow.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Becoming a thin layer over accounting tools | Build workflow depth that accounting tools cannot replicate |
| Overbuilding regulation features vs. workflow pain | Every feature must serve the ICP's daily ops, not just mandate compliance |
| Too many integrations too early | No CRM integrations at MVP; manual trigger only |
| Trying to serve all French businesses at once | Stay in agencies + consulting until 1,000 customers |
| Pennylane adds strong workflow features | Differentiate on depth of exception handling and PPF integration |
| PISTE API instability pre-mandate | Build retry logic + circuit breaker; sandbox-test continuously |

---

## 12. Related Documents

| Document | Purpose |
|---|---|
| `EINVOICING_COMPLIANCE_PLAN.md` | 7 compliance epics + 7-sprint implementation plan (Apr–Jul 2026) |
| `FACTURX_IMPLEMENTATION_PLAN.md` | Early Factur-X technical research (superseded by Epic 3 in compliance plan) |
| `CLAUDE.md` | Engineering commands, architecture, environment variables |
| `AGENTS.md` | Repository coding guidelines and PR conventions |
| `DESIGN.md` | Design system — canvas, typography, color tokens |
