# AI Pivot: Product Direction and Brief

## Product Direction

### Category
Vertical SaaS for French SMB finance operations

### Positioning
An AI workflow system that makes French businesses e-invoicing compliant and executes the invoice workflow end-to-end.

### Why Now
The regulatory deadline creates urgency:
- **September 1, 2026**: all VAT-liable businesses in France must be able to **receive** e-invoices
- **September 1, 2027**: SMEs and micro-businesses must be able to **issue** them

That is a strong forcing function, but the winning product is not "compliance software." It is "software that gets the admin work done."

### Best Wedge
My strongest recommendation is:

**French agencies and service SMEs**
Examples: creative agencies, consulting firms, dev shops, marketing agencies, staffing firms.

Why this wedge works:
- invoice data is often fragmented across email, proposals, timesheets, CRM, and PDFs
- billing is frequent and high-friction
- many small teams are operationally weak on finance admin
- they care about cash flow, not just compliance

### Core Problem
Today the work is manual:
- collect missing client and invoice data
- verify required fields
- classify service vs mixed operation
- prepare compliant structured invoice
- route through the right platform/PDP
- track rejection, delivery, and payment status
- reconcile with accounting/admin tools

The real pain is not creating the invoice.
The real pain is **finishing the process without back-and-forth**.

### Product Vision
**"From deal won to compliant paid invoice, with humans only handling exceptions."**

### MVP
**Product name placeholder:** `InvoiceOps AI`

**Input**
- signed quote / contract
- CRM deal
- client record
- line items / timesheets
- uploaded PDF or email thread

**Agent workflow**
- extract invoice data
- detect missing fields
- enrich company info where possible
- validate French mandatory invoice fields
- flag e-invoicing readiness issues
- generate structured compliant invoice
- route to the selected PDP-compatible flow
- track statuses and notify on failure or payment delay

**Human checkpoint**
- approve only when risk is high:
- missing legal data
- ambiguous VAT treatment
- rejection by platform
- unusual invoice amount

**Output**
- compliant invoice issued
- audit trail stored
- status synced to finance/accounting stack

### What Makes It Vertical
Build around one niche's actual workflow:
- retainer billing
- project milestone invoices
- time-based billing
- subcontractor split billing
- client PO chasing

That is more valuable than a generic invoice engine.

### Pricing Hypothesis
Start simple:
- base platform fee: `EUR 149-EUR 399/month`
- usage tier by invoice volume or workflows completed
- optional setup / migration fee
- accountant / agency partner plan later

### Moat
Not AI alone. The moat is:
- compliance workflow knowledge
- structured exception handling
- integrations with the tools the niche already uses
- historical invoice memory
- rejection/payout/payment optimization data

### Sharp GTM Message
Not:
- "AI invoicing assistant"

Better:
- **"The AI back office for French e-invoicing compliance."**
- **"Issue compliant invoices and handle exceptions automatically."**
- **"From client data to PDP-ready invoice, without admin chaos."**

## Product Brief

### Working Title
`InvoiceOps AI`

### One-Line Summary
The AI back office for French service SMEs to become e-invoicing compliant and run invoice workflows end-to-end.

### ICP
**Primary customer**
French service SMEs with 5-50 employees:
- agencies
- consulting firms
- software/dev shops
- staffing and recruiting firms
- expert-service boutiques

**Economic buyer**
- founder
- COO
- head of finance
- office/admin manager

**Why them**
They invoice often, operate with fragmented tools, and feel regulatory pressure without having strong internal finance ops.

### Problem
These companies do not fail because invoice creation is impossible. They fail because the workflow is messy:
- client legal data is incomplete
- billing data lives across email, CRM, proposals, and spreadsheets
- invoices need compliance checks
- sending through the right e-invoicing flow is new and confusing
- rejections, missing fields, and payment follow-up create operational drag

Current tools help draft invoices. They do not reliably **finish the job**.

### Solution
An agentic workflow system that takes a billing event and completes the invoice operation.

**Trigger examples**
- deal marked won
- project milestone reached
- monthly retainer due
- timesheet approved
- quote signed

**What the system does**
- gathers data from source systems
- detects and requests missing client/invoice fields
- validates French invoice compliance
- prepares structured e-invoice-ready output
- routes to the chosen PDP-compatible flow
- tracks delivery, rejection, and payment states
- escalates only exceptions to a human

### Core Value Proposition
**From deal won to compliant paid invoice, with humans only handling exceptions.**

### MVP Scope
**Must have**
- client and invoice data ingestion
- compliance validation for French mandatory fields
- missing-data detection and follow-up workflow
- invoice generation and status tracking
- exception inbox for human review
- audit trail

**Nice to have later**
- automatic payment chasing
- accounting sync
- cash collection analytics
- accountant dashboard
- multi-entity / multi-brand support

### Differentiation
This is not:
- a generic invoicing app
- a chatbot on top of accounting software
- a compliance dashboard only

This is:
- a vertical workflow product
- optimized for French e-invoicing transition
- focused on execution, not advice

### Pricing Hypothesis
Start with:
- `EUR 199-EUR 499/month` platform fee
- usage-based tier by invoice volume or workflow runs
- onboarding/setup fee for integrations and workflow mapping

### GTM Wedge
**Initial niche**
French agencies and service firms already billing clients monthly.

**Entry message**
"Be ready for French e-invoicing without adding finance headcount."

**Land motion**
- compliance readiness + workflow automation
- sell on admin time saved and fewer billing delays

### Risks
- becoming a thin layer over existing accounting tools
- overbuilding around regulation instead of workflow pain
- too many integrations too early
- trying to serve all French businesses at once

## Recommendation

Start with one narrow promise:

**For French agencies, automate the path from approved work to compliant issued invoice.**

The right next step is to pressure-test this concept with a PRFAQ.

## MVP Epic Backlog

### Epic 1: Invoice Readiness Engine
**Goal**  
Decide clearly whether an invoice is ready to issue or blocked.

**User story**  
As an operator, I need the product to tell me if a draft can be issued and what is missing if it cannot.

**Acceptance criteria**
- Each invoice has a visible readiness state: `ready` or `blocked`
- Missing client or invoice fields are listed explicitly
- Readiness checks run before issue actions
- Legal/compliance blockers are distinguishable from optional warnings

**Priority**  
P0

### Epic 2: Billing Workflow State Machine
**Goal**  
Track invoice work as an operational workflow, not only as a document.

**User story**  
As a team lead, I need each invoice job to move through explicit workflow states so I know what is happening.

**Acceptance criteria**
- Workflow states exist, e.g. `triggered`, `collecting_data`, `blocked`, `ready_for_review`, `ready_to_issue`, `issued`
- State transitions are timestamped
- Current state is visible in dashboard and invoice views
- Invalid transitions are prevented

**Priority**  
P0

### Epic 3: Trigger Intake
**Goal**  
Create invoice jobs from a simple operational trigger.

**User story**  
As a user, I need to create a billing job from approved work instead of starting from a blank invoice every time.

**Acceptance criteria**
- Manual “new billing job” entry exists
- Minimal trigger types are supported: manual, recurring, uploaded document
- Trigger creation feeds the workflow state machine
- Trigger source is recorded in the audit trail

**Priority**  
P1

### Epic 4: Exception Inbox
**Goal**  
Centralize blocked work in one place.

**User story**  
As an operator, I need one inbox of blocked invoices so I only handle exceptions, not every invoice manually.

**Acceptance criteria**
- Blocked invoice jobs appear in a dedicated queue
- Each blocked item shows reason codes
- Users can open, resolve, and move the invoice forward
- Queue can be filtered by reason and urgency

**Priority**  
P0

### Epic 5: Client Data Quality Layer
**Goal**  
Make the client module support invoice readiness directly.

**User story**  
As an operator, I need to know which clients are missing data that will block future invoices.

**Acceptance criteria**
- Client completeness score is shown
- Missing billing-critical fields are flagged
- A “blocking billing” segment exists
- Client edits immediately affect readiness status on linked invoices

**Priority**  
P0

### Epic 6: Review and Issue Flow
**Goal**  
Create a final controlled step before issuance.

**User story**  
As a user, I need to review and issue a ready invoice with confidence.

**Acceptance criteria**
- Ready invoices have a dedicated review screen
- Issue action is separate from draft save
- Issued invoices become immutable or protected
- PDF generation is tied to the issue step

**Priority**  
P0

### Epic 7: Payment Follow-up Basics
**Goal**  
Cover the minimum invoice-to-cash loop.

**User story**  
As a user, I need to track due, overdue, and paid invoices after issuance.

**Acceptance criteria**
- Due-soon and overdue states are visible
- Payment status is editable
- Dashboard highlights unpaid risk
- Reminder action exists, even if manual at first

**Priority**  
P1

### Epic 8: Product Surface Cleanup
**Goal**  
Remove off-pivot product areas from the MVP.

**User story**  
As a new user, I need a focused product so the app clearly matches the invoice-ops promise.

**Acceptance criteria**
- Off-pivot routes are removed, archived, or redirected
- Navigation only exposes MVP modules
- Legacy copy is removed from active flows
- Dashboard widgets reflect only MVP behavior

**Priority**  
P0

### Epic 9: Audit Trail and Operational Logging
**Goal**  
Make workflow actions traceable.

**User story**  
As an operator, I need to know what changed, when, and by whom on an invoice job.

**Acceptance criteria**
- Key actions are logged
- Status transitions are recorded
- Audit data is visible on invoice detail pages
- Errors are captured without silent failure

**Priority**  
P1

### Epic 10: Guided Onboarding to First Value
**Goal**  
Get a new account to its first usable billing workflow fast.

**User story**  
As a new user, I need guided setup so I can reach my first ready invoice quickly.

**Acceptance criteria**
- Issuer legal profile setup is guided
- Client import or first-client setup is prompted
- First invoice flow is explained step by step
- Empty states push users toward first value

**Priority**  
P1

### Epic 11: MVP QA and Hardening
**Goal**  
Make the MVP reliable enough for production use.

**User story**  
As a team using the product in real billing operations, I need the core flow to be stable and trustworthy.

**Acceptance criteria**
- Core flows are covered by tests
- Permission checks are enforced
- Validation errors are handled cleanly
- PDF and status actions fail safely
- Mobile behavior is acceptable on core screens

**Priority**  
P0

## Recommended Delivery Order

### Wave 1: Core MVP
1. Invoice Readiness Engine
2. Billing Workflow State Machine
3. Exception Inbox
4. Client Data Quality Layer
5. Review and Issue Flow
6. Factur-X Generation and Compliance Output

### Wave 2: Operational Completion
7. Payment Follow-up Basics
8. Audit Trail and Operational Logging
9. Guided Onboarding to First Value

### Wave 3: Product Hardening
10. Product Surface Cleanup
11. MVP QA and Hardening

## Factur-X Epic

### Epic 12: Factur-X Generation and Compliance Output
**Goal**  
Generate French-standard hybrid invoices as a compliant output of the invoice workflow.

**User story**  
As a user, I need the product to issue an invoice in a format aligned with French e-invoicing expectations, not just as a visual PDF.

**Acceptance criteria**
- An issued invoice can generate a `factur-x.xml` file using the UN/CEFACT CII format
- The generated PDF is converted to `PDF/A-3` and embeds `factur-x.xml`
- Factur-X generation only runs on invoices that are marked ready to issue
- The generation result is stored on the invoice record
- Validation status and errors are visible when generation fails
- The implementation supports versioned validation rather than hardcoded one-off assumptions

**Priority**  
P0

**Current blocker**
- preferred package: `@stafyniaksacha/facturx`
- local install currently fails on Node `23.11.0` because `libxmljs` does not build cleanly for this runtime
- app code is already prepared to use the package through dynamic import as soon as installation succeeds

**Position in roadmap**  
Immediately after Review and Issue Flow.  
Factur-X should be the output layer of a valid invoice workflow, not a substitute for readiness checks.

## Factur-X Implementation Direction

### Recommended library
Use `@stafyniaksacha/facturx` as the first implementation path inside the existing Node.js stack.

### Why this path
- Closest fit to the current Next.js / Node.js architecture
- Dedicated to Factur-X generation and extraction
- Supports generation from PDF + XML and XML validation flows
- Avoids adding a second language or a separate microservice for the MVP

### What not to do at MVP stage
- Do not aim to become a PDP
- Do not implement full PPF lifecycle exchange first
- Do not make legal archiving the first differentiator
- Do not broaden to all French industries before validating one niche

### Strategic product role
The product should remain an **Agent de collecte / OD-like workflow SaaS**:
- workflow and readiness first
- Factur-X output second
- certified platform connectivity later

## MVP Completion Standard

The pivot MVP is complete when the product can answer, for every invoice:

- Is it blocked or ready?
- If blocked, why?
- Who needs to act?
- What is the next workflow step?
- Has it been issued?
- Has it been paid?

## PRFAQ

### Press Release

**FOR IMMEDIATE RELEASE**

**InvoiceOps AI launches to help French agencies automate compliant e-invoicing ahead of the 2026-2027 reform**

Paris, France — InvoiceOps AI announced a new workflow platform designed for French agencies and service SMEs facing the shift to mandatory electronic invoicing. Instead of acting as another invoicing tool, InvoiceOps AI automates the path from approved work to compliant issued invoice.

Starting on **September 1, 2026**, all VAT-liable businesses in France must be able to receive electronic invoices, while large and mid-sized companies must also issue them. On **September 1, 2027**, issuance requirements extend to SMEs and micro-businesses. For many agencies, the challenge is not invoice creation itself, but collecting missing data, validating compliance, routing invoices correctly, and resolving exceptions without slowing down cash flow.

InvoiceOps AI is built specifically for that operational gap. The platform ingests billing triggers such as signed quotes, approved milestones, timesheets, or CRM events. It gathers the required information, detects missing fields, validates compliance rules, prepares a structured invoice, routes it through the appropriate flow, tracks status, and escalates only exceptions to a human.

"Most invoicing software stops at document creation," said the founding team. "We are building the AI back office that completes the workflow."

InvoiceOps AI will first focus on French agencies and service firms that bill monthly or by milestone and need to stay compliant without adding finance headcount.

### FAQ

**What problem are we solving?**  
French agencies have fragmented billing operations. Client data sits across email, CRM, proposals, PDFs, and spreadsheets. E-invoicing adds more structure and operational risk. Teams need the work done, not another dashboard.

**Who is the first customer?**  
French agencies and service SMEs with 5-50 employees: creative agencies, consulting firms, software shops, recruiting firms, and similar project-based businesses.

**What does the product actually do?**  
It automates the workflow from billing trigger to compliant issued invoice:
- collect and normalize data
- detect missing fields
- validate invoice compliance
- prepare structured output
- route through the chosen e-invoicing process
- track statuses and exceptions

**Why will customers buy this instead of using accounting software?**  
Accounting tools help record invoices. They do not reliably orchestrate the upstream admin work: data collection, compliance checks, exception handling, routing, and follow-up.

**Why is this a strong vertical SaaS wedge?**  
The workflow is high-frequency, painful, measurable, and tied to revenue collection. Agencies feel the pain immediately when invoices are delayed or rejected.

**What is the MVP?**  
The MVP should include:
- billing trigger ingestion
- client and invoice data extraction
- compliance validation
- missing-data follow-up workflow
- invoice generation
- status tracking
- exception review inbox
- audit trail

**What should we avoid?**  
- generic AI assistant positioning
- serving all French businesses at once
- overbuilding integrations too early
- focusing on regulation more than workflow execution

**What is the sharpest positioning statement?**  
**For French agencies, automate the path from approved work to compliant issued invoice.**

## MVP Feature Spec

### Product
**InvoiceOps AI**
AI workflow software for French agencies to automate the path from approved work to compliant issued invoice.

### MVP Goal
Prove that the product can reduce manual billing/admin work and make e-invoicing readiness operational, not theoretical.

Success for MVP:
- invoice creation time reduced by at least 70%
- fewer missing-field errors before issuance
- one operator can manage many more invoices
- exceptions are isolated instead of blocking the whole workflow

### Initial ICP
French agencies and service SMEs with 5-50 employees that:
- invoice monthly, by milestone, or by timesheet
- manage billing across email, spreadsheets, CRM, and PDFs
- do not have a strong finance ops function

### Core Workflow
**Trigger to output**

1. Billing trigger enters system
Examples:
- deal marked won
- milestone approved
- retainer billing date reached
- timesheet approved
- signed quote uploaded

2. System gathers source data
Sources:
- CRM record
- client profile
- quote / contract PDF
- email thread
- spreadsheet export
- manual form entry

3. Agent validates readiness
Checks:
- missing client legal info
- invoice line completeness
- VAT / service classification
- mandatory invoice fields
- e-invoicing readiness flags

4. Agent resolves what it can
Actions:
- extract structured fields from documents
- normalize company names and addresses
- prefill invoice draft
- generate compliance checklist

5. Human handles exceptions
Only if:
- required data is missing
- legal ambiguity exists
- amount is unusual
- workflow confidence is low

6. System produces output
Outputs:
- compliant invoice draft
- ready-to-send structured data
- audit log
- invoice status timeline

### MVP Modules

#### 1. Billing Intake
Purpose: capture billing events reliably.

Must have:
- create invoice job from manual form
- upload quote/contract PDF
- import basic deal/client context
- support monthly recurring billing trigger

Exclude for v1:
- deep native CRM integrations
- complex workflow builder

#### 2. Data Extraction
Purpose: turn messy inputs into structured invoice data.

Must have:
- extract client name, address, SIREN if present
- extract line items, dates, amounts
- identify missing required fields
- confidence scoring per extracted field

Exclude for v1:
- full document intelligence across all document types
- advanced multi-document reconciliation

#### 3. Compliance Validation
Purpose: catch invoice readiness issues before issuance.

Must have:
- validate French mandatory invoice fields
- detect service vs mixed operation classification gaps
- flag missing client/company identifiers
- produce a clear error and warning list

Exclude for v1:
- full legal/tax advisory engine
- support for every niche edge case

#### 4. Exception Inbox
Purpose: keep humans focused only on blockers.

Must have:
- queue of invoices needing review
- reason codes for exception
- approve / edit / reject workflow
- comment log

Exclude for v1:
- role-based approval chains
- advanced collaboration workflows

#### 5. Invoice Generation
Purpose: produce a usable compliant output.

Must have:
- generate invoice draft from structured data
- standard invoice view
- exportable PDF
- structured metadata ready for PDP-compatible routing later

Exclude for v1:
- direct connection to every PDP
- dynamic multi-format delivery network

#### 6. Status Tracking
Purpose: give finance/admin teams operational visibility.

Must have:
- statuses like `draft`, `awaiting-data`, `ready`, `approved`, `issued`
- activity timeline
- simple search and filter

Exclude for v1:
- full ERP reconciliation
- payment automation

### User Roles

#### Admin / Founder
Needs:
- visibility into invoice pipeline
- confidence that compliance checks are applied
- low operational overhead

#### Billing Operator / Office Manager
Needs:
- exception queue
- fast approval/edit flow
- fewer back-and-forth emails

### Key Screens
- billing jobs list
- invoice job detail view
- exception inbox
- invoice draft review
- client data panel
- activity/audit timeline

### Data Model
Minimum entities:
- `Client`
- `BillingTrigger`
- `InvoiceJob`
- `InvoiceDraft`
- `ComplianceCheck`
- `Exception`
- `ActivityLog`

### Metrics
Track from day one:
- invoices processed
- percent auto-completed without human intervention
- average time from trigger to ready invoice
- top exception reasons
- percent of invoices blocked by missing client data

### Risks to Control
- trying to support every French business type
- integrating too many upstream tools too early
- promising full PDP automation before core workflow is stable
- confusing document generation with workflow completion

### Sharp MVP Scope
The MVP is not "send all French e-invoices automatically."

The MVP is:
**For French agencies, turn approved work into a compliant invoice draft with exception handling and operational tracking.**
