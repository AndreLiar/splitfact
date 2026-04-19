# S7 — Production Cutover Checklist

## 1. Database

- [ ] Run `nvm use 20 && npx prisma db push` to apply `ComplianceEvent` and `EReportingPeriod` tables
- [ ] Verify via Neon dashboard: tables `ComplianceEvent`, `EReportingPeriod` exist with correct columns

## 2. PISTE Production Credentials

Register on the **production** PISTE portal (same process as sandbox):

| Step | Action |
|------|--------|
| 1 | Login at https://piste.gouv.fr — switch environment to **Production** |
| 2 | Create a new application (or promote sandbox app) — subscribe to **Factures** API |
| 3 | Note `client_id` and `client_secret` for production |
| 4 | In Chorus Pro **production** (https://chorus-pro.gouv.fr), login as GEST_PRIVE account for SIRET 131371109886541 |
| 5 | Create a **Compte Technique** under Gestion > Comptes techniques |
| 6 | Note login (`TECH_xxx@cpro.fr`) and set password |

## 3. Vercel Environment Variables

Set these in Vercel dashboard → Project Settings → Environment Variables for **Production** environment:

```
PISTE_ENV=production
PISTE_CLIENT_ID=<production client_id from step 2.3>
PISTE_CLIENT_SECRET=<production client_secret from step 2.3>
CPRO_TECH_LOGIN=<compte technique login from step 2.6>
CPRO_TECH_PASSWORD=<compte technique password from step 2.6>
PISTE_WEBHOOK_SECRET=<generate a strong random secret>
SIRENE_API_KEY=<INSEE SIRENE API key — register at api.insee.fr>
```

All other variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_*`, `OPENAI_API_KEY`, etc.) should already be set.

## 4. Cron Jobs

`vercel.json` already declares four crons:

| Cron | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/generate-urssaf-reports` | 1st of month, 09:00 | Auto URSSAF reports |
| `/api/cron/recurring-billing` | Daily 08:00 | Recurring invoice generation |
| `/api/cron/ppf-retry` | Every 30 min | Retry failed PPF submissions |
| `/api/cron/e-reporting` | 2nd of month, 06:00 | Auto e-reporting submission |

Verify `CRON_SECRET` is set in Vercel — each cron handler validates `Authorization: Bearer $CRON_SECRET`.

## 5. Smoke Tests After Deploy

```bash
# 1. Create a B2B invoice, issue it — confirm ppfStatus goes from not_submitted → deposee
# 2. Check /dashboard/compliance — score should reflect the invoice
# 3. Generate e-reporting for last month → confirm flux number returned
# 4. Check /dashboard/e-reporting — period shows 'submitted' status
```

## 6. Node.js Version Fix (Local Dev)

The node_modules were partially installed under Node 22. Fix by:

```bash
nvm use 20
rm -rf node_modules .next
npm install
npm run dev
```

Run QA tests after reinstall:

```bash
npx jest tests/lib/ubl-serializer.test.ts tests/lib/e-reporting.test.ts tests/lib/compliance.test.ts --no-coverage
```

## 7. Mandatory First Month

For the first month in production:
- Monitor Chorus Pro portal for rejection reasons on any `rejetee` invoices
- Check `/dashboard/compliance` weekly to catch any new compliance events
- SIRENE validation will work only once `SIRENE_API_KEY` is set
