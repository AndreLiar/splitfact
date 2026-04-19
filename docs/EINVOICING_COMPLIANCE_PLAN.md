# E-Invoicing Compliance — Epic & Sprint Plan

**Mandate deadlines**
- **September 1, 2026** — ALL French businesses must be able to *receive* e-invoices via PPF
- **September 1, 2027** — SMEs & micro-entrepreneurs must be able to *issue* e-invoices via PPF

**SAP IS-H**: Dropped from scope. Core mandate applies universally; SAP IS-H is a hospital-ERP niche covering <0.5% of micro-entrepreneurs with disproportionate integration cost.

---

## Epic 1 — Invoice Data Completeness

*Fill mandatory field gaps so every invoice is structurally valid under EN 16931.*

| Story | Task | Effort |
|---|---|---|
| E1-S1 | Add `transactionType` enum to Invoice schema (`B2B`, `B2C`, `B2G`) | 2h |
| E1-S2 | Add `deliveryAddress` JSON field to Invoice schema + Prisma migration | 2h |
| E1-S3 | Expose both fields in Create Invoice form + validation | 3h |
| E1-S4 | Backfill existing invoices: `transactionType = B2B`, `deliveryAddress = null` | 1h |
| E1-S5 | Update `invoice-readiness.ts` to flag missing mandatory fields before send | 2h |

**Exit criterion:** Every new invoice stores `transactionType`, `buyerReference`, `deliveryAddress`.

---

## Epic 2 — SIRET/SIREN Validation

*Validate buyer identity against the official INSEE SIRENE directory.*

| Story | Task | Effort |
|---|---|---|
| E2-S1 | `src/lib/sirene-api.ts` — INSEE SIRENE v3 REST client (OAuth2 Bearer) | 3h |
| E2-S2 | SIRET format validator (14-digit Luhn check) — pure function, no API call | 1h |
| E2-S3 | Client creation flow: validate SIRET on blur → display company name from SIRENE | 3h |
| E2-S4 | `invoice-readiness.ts`: block invoice emission if client SIRET unvalidated | 1h |
| E2-S5 | Cache SIRENE responses 24h in Prisma (`SireneCache` table) to respect rate limits | 2h |

**Exit criterion:** Invoices cannot be sent to a client with an unvalidated SIRET.

---

## Epic 3 — Factur-X EXTENDED Profile

*Upgrade from MINIMUM to EXTENDED so all mandatory fields round-trip in the XML.*

| Story | Task | Effort |
|---|---|---|
| E3-S1 | Pass `latePaymentPenaltyRate` into CII XML generator (`src/lib/facturx/`) | 2h |
| E3-S2 | Pass `deliveryAddress` into XML `ram:ShipToTradeParty` element | 2h |
| E3-S3 | Pass `transactionType` into XML `ram:BusinessProcessSpecifiedDocumentContextParameter` | 1h |
| E3-S4 | Pass `buyerReference` into `ram:BuyerOrderReferencedDocument` | 1h |
| E3-S5 | Upgrade profile string: `MINIMUM` → `EN 16931` (EXTENDED compatible) | 1h |
| E3-S6 | Validate generated XML against official EN 16931 Schematron rules (CI step) | 3h |

**Exit criterion:** Generated Factur-X XML passes the DGFiP official Schematron validator.

---

## Epic 4 — PPF/Chorus Pro Transmission (PISTE API)

*The core integration: deposit invoices to the government hub, track lifecycle.*

| Story | Task | Effort |
|---|---|---|
| E4-S1 | PISTE OAuth2 client (`src/lib/piste-api.ts`) — client_credentials grant, token refresh | 4h |
| E4-S2 | `/api/invoices/[id]/submit-ppf` endpoint: upload Factur-X PDF to PISTE `/invoices` | 4h |
| E4-S3 | Add `ppfStatus` + `ppfTrackingId` to Invoice schema | 1h |
| E4-S4 | Invoice lifecycle polling: PISTE webhook receiver `/api/webhooks/ppf` | 4h |
| E4-S5 | Status mapping: PISTE statuses → InvoiceOps UI statuses (Déposée, Acceptée, Rejetée) | 2h |
| E4-S6 | "Déposer sur Chorus Pro" button in invoice detail page | 2h |
| E4-S7 | Retry queue for failed deposits (use existing cron + `ppfStatus = PENDING_RETRY`) | 3h |
| E4-S8 | Sandbox environment toggle (`PISTE_ENV=sandbox\|production`) | 1h |

**Exit criterion:** Invoice can be deposited to PISTE sandbox and status updates appear in UI.

---

## Epic 5 — UBL 2.1 Serializer

*Some recipients and PDPs require UBL rather than CII/Factur-X. Output both.*

| Story | Task | Effort |
|---|---|---|
| E5-S1 | `src/lib/ubl-serializer.ts` — generate UBL 2.1 XML from Invoice model | 6h |
| E5-S2 | Validate against OASIS UBL 2.1 schema (CI step) | 2h |
| E5-S3 | Download button: "Télécharger UBL 2.1" on invoice detail | 1h |
| E5-S4 | Format selection in PPF submission: auto-select Factur-X or UBL based on recipient capability | 2h |

**Exit criterion:** UBL 2.1 export available for every invoice; passes schema validation.

---

## Epic 6 — E-Reporting (B2C & International)

*Required for all transactions NOT covered by e-invoicing — B2C, exports, non-EU.*

| Story | Task | Effort |
|---|---|---|
| E6-S1 | E-reporting data model: aggregate daily B2C totals per tax rate | 2h |
| E6-S2 | `/api/e-reporting/generate` — build DGFiP e-reporting XML payload | 4h |
| E6-S3 | Scheduler: auto-submit monthly e-reporting via existing Vercel cron (`CRON_SECRET`) | 3h |
| E6-S4 | E-reporting dashboard widget: next due date, last submitted, submission status | 3h |
| E6-S5 | Manual "Soumettre le rapport" button for corrections | 2h |

**Exit criterion:** Monthly e-reporting auto-submitted for B2C invoices; status visible in dashboard.

---

## Epic 7 — Compliance Monitoring & Penalty Tracker

*Surface compliance score, track the €15/invoice penalty exposure (Art. 1737 II CGI).*

| Story | Task | Effort |
|---|---|---|
| E7-S1 | `ComplianceEvent` Prisma table: type, invoiceId, penaltyAmount, resolvedAt | 1h |
| E7-S2 | Penalty calculation service: €15/invoice, capped at €45,000/year | 2h |
| E7-S3 | Compliance score widget on dashboard (0–100; above 80 = green) | 3h |
| E7-S4 | Notification trigger when compliance score drops below 70 | 1h |
| E7-S5 | "Rapport de conformité" PDF export (monthly audit log) | 3h |

**Exit criterion:** Compliance score visible on dashboard; penalty exposure calculated and surfaced.

---

## Sprint Plan

**Sprint velocity: ~30h / 2-week sprint**

| Sprint | Dates | Epics | Key Deliverable | Hours |
|---|---|---|---|---|
| **S1** | Apr 21 – May 2 | E1 full, E2 full | Data model complete, SIRET validation live | 25h |
| **S2** | May 5 – May 16 | E3 full, E5-S1+S2 | Factur-X EXTENDED passes Schematron, UBL skeleton | 28h |
| **S3** | May 19 – May 30 | E4-S1→S5, E5-S3+S4 | PISTE sandbox deposit works, both formats available | 30h |
| **S4** | Jun 2 – Jun 13 | E4-S6→S8, E6-S1→S3 | UI for Chorus Pro submit, e-reporting auto-scheduled | 30h |
| **S5** | Jun 16 – Jun 27 | E6-S4+S5, E7 full | Compliance dashboard complete, penalty tracker live | 29h |
| **S6** | Jun 30 – Jul 11 | Buffer + QA | End-to-end tests against PISTE sandbox, fix blockers | 20h |
| **S7** | Jul 14 – Jul 25 | Production cutover | Switch `PISTE_ENV=production`, compliance sign-off | 15h |

**August 2026**: soft launch + monitoring.
**September 1, 2026**: mandate active — 5 weeks buffer built in.

---

## Gap Summary (from audit)

| Requirement | Status | Epic |
|---|---|---|
| Factur-X hybrid PDF | Partial — MINIMUM profile only | E3 |
| UBL 2.1 format | Missing | E5 |
| PPF/PISTE transmission | Missing | E4 |
| PDP routing | Out of scope (use PPF direct) | — |
| E-reporting (B2C/international) | Missing | E6 |
| Mandatory fields complete | Partial — missing `transactionType`, `deliveryAddress` | E1 |
| SIRET validation (SIRENE API) | Missing | E2 |
| Multi-rate VAT | Done | — |
| Late payment penalty | Partial — stored but not in XML | E3 |
| Payment terms | Done | — |
| Compliance tracking | Missing | E7 |

---

## Environment Variables to Add

| Variable | Purpose |
|---|---|
| `PISTE_CLIENT_ID` | PISTE OAuth2 client ID |
| `PISTE_CLIENT_SECRET` | PISTE OAuth2 client secret |
| `PISTE_ENV` | `sandbox` or `production` |
| `SIRENE_API_KEY` | INSEE SIRENE v3 API key |
