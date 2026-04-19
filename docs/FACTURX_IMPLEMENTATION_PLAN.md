# Factur-X Implementation Plan

## Objective
Add Factur-X generation to the current Splitfact invoice workflow without changing the core stack.

The product should remain a workflow SaaS first. Factur-X is the compliant output layer that runs when an invoice is ready to issue.

## Recommended Technical Choice

Use `@stafyniaksacha/facturx`.

Why:
- best fit for the existing Node.js / Next.js stack
- purpose-built for Factur-X generation and extraction
- supports PDF + XML merge workflows
- avoids introducing a second service or non-JavaScript runtime for MVP

## Regulatory Context

Factur-X is a hybrid invoice format:
- readable invoice in `PDF/A-3`
- embedded machine-readable XML file named `factur-x.xml`
- based on UN/CEFACT Cross Industry Invoice (CII)

Important implementation note:
- the current FNFE-MPE publication is Factur-X `1.08` / ZUGFeRD `2.4`
- applicability date: `January 15, 2026`
- validation must be version-aware

## Product Positioning Fit

This should be implemented as part of the current MVP path:
1. invoice readiness
2. review and issue
3. Factur-X generation

Do not treat Factur-X generation as the first milestone. Generating compliant files from incomplete invoices adds technical complexity without solving the workflow problem.

## Repo-Level Architecture

### Suggested modules

Create:
- `splitfact-app/src/lib/facturx/invoice-to-cii.ts`
- `splitfact-app/src/lib/facturx/facturx-generator.ts`
- `splitfact-app/src/lib/facturx/facturx-validator.ts`

### Responsibilities

`invoice-to-cii.ts`
- map internal invoice data to a CII-compatible structure
- normalize seller, buyer, tax, line, and total fields
- produce the XML payload for `factur-x.xml`

`facturx-generator.ts`
- take existing invoice PDF output
- take generated XML
- call `@stafyniaksacha/facturx`
- return a Factur-X compliant `PDF/A-3` file

`facturx-validator.ts`
- run generation-time checks
- capture errors and validation metadata
- expose a clear result object for UI and logging

## Integration Point in Current Workflow

Recommended flow:
1. user creates or edits invoice draft
2. readiness engine marks invoice `ready_to_issue`
3. user clicks issue
4. system generates standard PDF
5. system generates CII XML
6. system embeds `factur-x.xml` into PDF/A-3
7. system stores files and updates status

## Data Model Additions

Add fields to the invoice model or a related output model:
- `facturxPdfUrl`
- `facturxXmlUrl`
- `facturxStatus`
- `facturxGeneratedAt`
- `facturxValidationErrors`
- `issuedAt`
- `workflowStatus`

Suggested status examples:
- `not_started`
- `generating`
- `generated`
- `validation_failed`

## MVP Acceptance Scope

For MVP, Factur-X is complete when:
- at least one invoice can be generated as Factur-X end-to-end
- the XML file is embedded as `factur-x.xml`
- the generated file is usable as a product output
- generation failures are visible and recoverable

For MVP, do not include:
- PDP certification
- full PPF annuary integration
- end-to-end invoice exchange network
- 10-year legal archive implementation

## Implementation Checklist

## Current Blocker

`@stafyniaksacha/facturx` is the preferred library and the app is now coded to use it via dynamic import.

However, installation currently fails on the local environment:
- current local Node version: `23.11.0`
- failure point: native dependency `libxmljs`
- symptom: no compatible prebuilt binary for `node-v131`, then source build fails

Practical implication:
- the code path is ready
- the dependency is not installed
- the app still runs on the fallback generator until the runtime/toolchain issue is resolved

Recommended resolution order:
1. try install under Node `20.x` or `22.x` LTS
2. if still blocked, evaluate a second compatible Factur-X package
3. only if both fail, switch to a dedicated conversion service

### Phase 1
- add dependency `@stafyniaksacha/facturx`
- create CII mapping module
- create Factur-X generator wrapper
- generate XML from an existing invoice

### Phase 2
- hook generation into invoice issue action
- store generated XML and PDF outputs
- show generation result in invoice detail page

### Phase 3
- add validation feedback to readiness/review screens
- add tests for valid and invalid invoice payloads
- add sample fixture invoices for regression coverage

## Validation and Testing

Minimum validation path:
- unit tests for invoice-to-CII mapping
- generation test with a fixture PDF and fixture XML
- manual verification on sample invoices
- validation against official FNFE-MPE / EN16931 artifacts when possible

## Best Strategic Path

Recommended sequence:
1. finish workflow MVP
2. add Factur-X generation
3. connect later to a certified downstream platform

That keeps the product aligned with the accessible OD / workflow-SaaS path instead of prematurely taking on PDP complexity.

## Repo Implementation Backlog

### Ticket 1: Add invoice workflow and Factur-X persistence fields
**Files**
- `splitfact-app/prisma/schema.prisma`
- new Prisma migration under `splitfact-app/prisma/migrations/`

**Changes**
- add workflow status to invoices
- add issue timestamp
- add Factur-X output metadata fields

**Suggested fields**
- `workflowStatus String?`
- `issuedAt DateTime?`
- `facturxPdfUrl String?`
- `facturxXmlUrl String?`
- `facturxStatus String?`
- `facturxGeneratedAt DateTime?`
- `facturxValidationErrors Json?`

**Acceptance criteria**
- schema compiles
- migration is generated
- existing invoice flows still load

### Ticket 2: Add Factur-X library dependency
**Files**
- `splitfact-app/package.json`
- `splitfact-app/package-lock.json`

**Changes**
- install `@stafyniaksacha/facturx`

**Acceptance criteria**
- dependency is added cleanly
- import works from local library wrappers

### Ticket 3: Create Factur-X domain module
**Files**
- `splitfact-app/src/lib/facturx/invoice-to-cii.ts`
- `splitfact-app/src/lib/facturx/facturx-generator.ts`
- `splitfact-app/src/lib/facturx/facturx-validator.ts`
- optional barrel: `splitfact-app/src/lib/facturx/index.ts`

**Changes**
- map invoice records to CII payload
- generate XML string or buffer
- merge XML + PDF into Factur-X PDF/A-3
- return structured success/error result

**Acceptance criteria**
- module can take a known invoice payload and produce XML
- module exposes one high-level generator function for app use

### Ticket 4: Build an invoice data loader for issuance
**Files**
- new helper, for example: `splitfact-app/src/lib/invoice-issuance.ts`
- existing API routes under `splitfact-app/src/app/api/invoices/`

**Changes**
- centralize invoice fetch for issue/generation
- include client, issuer, items, shares, collective, legal mentions
- normalize data before PDF/XML generation

**Acceptance criteria**
- one function returns all data needed to issue an invoice
- no duplication across API routes for issue-time payload assembly

### Ticket 5: Introduce explicit issue action
**Files**
- `splitfact-app/src/app/api/invoices/[invoiceId]/route.ts`
- possibly add a dedicated route such as `splitfact-app/src/app/api/invoices/[invoiceId]/issue/route.ts`
- `splitfact-app/src/app/dashboard/invoices/[invoiceId]/page.tsx`

**Changes**
- separate “issue invoice” from generic draft editing
- require readiness before issue
- set `workflowStatus` and `issuedAt`

**Acceptance criteria**
- invoice cannot be issued if blocked
- successful issue updates workflow fields
- issue action is visible in the UI

### Ticket 6: Hook Factur-X generation into issue flow
**Files**
- issue route in `src/app/api/invoices/...`
- `splitfact-app/src/lib/facturx/*`
- invoice PDF generator path already used in the app

**Changes**
- on successful issue:
  - generate standard PDF
  - generate `factur-x.xml`
  - build PDF/A-3 Factur-X output
  - persist resulting file locations and status

**Acceptance criteria**
- issuing an invoice triggers Factur-X generation
- invoice record stores generation result
- failures do not silently pass

### Ticket 7: Store generated outputs
**Files**
- likely existing storage integration in `splitfact-app/src/lib/cloudinary.ts`
- issuance route and generator modules

**Changes**
- upload XML and PDF outputs to the existing storage path
- store URLs on the invoice record

**Acceptance criteria**
- generated XML and PDF are accessible from the invoice detail screen
- no new storage stack is introduced

### Ticket 8: Add readiness checks tied to issuing
**Files**
- new module, for example: `splitfact-app/src/lib/invoice-readiness.ts`
- `splitfact-app/src/app/dashboard/create-invoice/page.tsx`
- `splitfact-app/src/app/dashboard/invoices/[invoiceId]/page.tsx`
- issue route

**Changes**
- define minimum required fields for issue
- show blocked reasons in UI
- enforce checks in backend

**Acceptance criteria**
- readiness logic is shared between UI and backend
- invoice detail screen shows blocked reasons clearly
- issue action is disabled or rejected when blocked

### Ticket 9: Expose Factur-X state in invoice detail UI
**Files**
- `splitfact-app/src/app/dashboard/invoices/[invoiceId]/page.tsx`

**Changes**
- show:
  - workflow status
  - issue timestamp
  - Factur-X generation status
  - XML and PDF output links
  - validation errors if generation failed

**Acceptance criteria**
- an operator can see whether the invoice has a compliant output
- failures are understandable without opening logs

### Ticket 10: Tighten clients for readiness
**Files**
- `splitfact-app/src/app/dashboard/clients/page.tsx`
- `splitfact-app/src/app/api/clients/route.ts`
- `splitfact-app/src/app/api/clients/[clientId]/route.ts`

**Changes**
- flag billing-critical fields
- show which clients are likely to block invoice issuance
- surface completion score more clearly

**Acceptance criteria**
- client page directly helps unblock invoice issuance
- missing legal/billing fields are obvious

### Ticket 11: Add fixture-driven tests
**Files**
- `splitfact-app/tests/`
- new fixtures directory if needed

**Changes**
- add tests for:
  - readiness logic
  - CII mapping
  - issue action
  - Factur-X generation success/failure handling

**Acceptance criteria**
- core issue path has automated coverage
- at least one valid sample invoice produces expected XML structure

## Delivery Dependencies

### Must happen first
1. Ticket 1: persistence fields
2. Ticket 2: dependency
3. Ticket 3: Factur-X module
4. Ticket 8: readiness logic

### Then
5. Ticket 4: issuance loader
6. Ticket 5: issue action
7. Ticket 6: Factur-X generation
8. Ticket 7: output storage
9. Ticket 9: invoice detail UI

### Then hardening
10. Ticket 10: client readiness support
11. Ticket 11: tests

## Definition of Done for Factur-X MVP

Factur-X is done for MVP when:
- a ready invoice can be issued
- issuing generates `factur-x.xml`
- a PDF/A-3 output is produced from the current stack
- output links are visible in the product
- failures are visible and recoverable

## Sources

- https://fnfe-mpe.org/factur-x/
- https://fnfe-mpe.org/factur-x/implementer-factur-x/
- https://www.npmjs.com/package/@stafyniaksacha/facturx
