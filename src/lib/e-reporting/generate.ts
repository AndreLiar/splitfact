/**
 * E-reporting XML generator — DGFiP format for B2C periodic reporting.
 *
 * E-reporting covers:
 *  - B2C transactions (consumer invoices, not subject to e-invoicing)
 *  - International B2B with non-French buyers
 *
 * Submitted monthly to PPF via PISTE deposerFluxFacture
 * with syntaxeFlux = "IN_DP_E1_CII_16B" (CII summary report).
 *
 * DGFiP spec reference: art. 290 CGI, décret n°2022-1299
 */

import prisma from '@/lib/prisma';

export interface TaxBucket {
  rate: number;       // TVA rate in percent (e.g. 20, 10, 5.5, 0)
  baseHT: number;
  tva: number;
  ttc: number;
}

export interface EReportingData {
  period: string;             // "YYYY-MM"
  userId: string;
  issuerSiret: string;
  issuerName: string;
  transactionCount: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  taxBreakdown: TaxBucket[];
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildEReportingXml(data: EReportingData): string {
  const [year, month] = data.period.split('-');
  const periodStart = `${year}${month}01`;
  // Last day of month
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const periodEnd = `${year}${month}${String(lastDay).padStart(2, '0')}`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];

  const taxLines = data.taxBreakdown
    .map(
      (b) => `
    <ram:ApplicableTradeTax>
      <ram:CalculatedAmount>${b.tva.toFixed(2)}</ram:CalculatedAmount>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:BasisAmount>${b.baseHT.toFixed(2)}</ram:BasisAmount>
      <ram:CategoryCode>${b.rate === 0 ? 'Z' : 'S'}</ram:CategoryCode>
      <ram:RateApplicablePercent>${b.rate.toFixed(2)}</ram:RateApplicablePercent>
    </ram:ApplicableTradeTax>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017:compliant:urn:factur-x.eu:1p0:extended</ram:ID>
    </ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:extended</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>EREPORT-${escapeXml(data.period)}-${escapeXml(data.issuerSiret)}</ram:ID>
    <ram:TypeCode>751</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${now.slice(0, 8)}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>E-reporting mensuel B2C — période ${escapeXml(data.period)} — ${data.transactionCount} transactions</ram:Content>
    </ram:IncludedNote>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(data.issuerName)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(data.issuerSiret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:SellerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${periodEnd}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:BillingSpecifiedPeriod>
        <ram:StartDateTime>
          <udt:DateTimeString format="102">${periodStart}</udt:DateTimeString>
        </ram:StartDateTime>
        <ram:EndDateTime>
          <udt:DateTimeString format="102">${periodEnd}</udt:DateTimeString>
        </ram:EndDateTime>
      </ram:BillingSpecifiedPeriod>
      ${taxLines}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${data.totalHT.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${data.totalHT.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${data.totalTVA.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${data.totalTTC.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${data.totalTTC.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// ─── Aggregate B2C invoices for a period ─────────────────────────────────────

export async function aggregateEReportingData(
  userId: string,
  period: string // "YYYY-MM"
): Promise<EReportingData | null> {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  // Get user issuer details from first issued invoice
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, siret: true },
  });

  if (!user) return null;

  // Fetch all B2C issued invoices in the period
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      transactionType: 'B2C',
      workflowStatus: 'issued',
      invoiceDate: { gte: start, lt: end },
    },
    include: { items: true },
  });

  if (invoices.length === 0) return null;

  // Aggregate by TVA rate
  const buckets = new Map<number, TaxBucket>();

  for (const inv of invoices) {
    for (const item of inv.items) {
      const rate = Number(item.tvaRate);
      const lineHT = Number(item.unitPrice) * Number(item.quantity);
      const lineTVA = lineHT * (rate / 100);
      const lineTTC = lineHT + lineTVA;

      const existing = buckets.get(rate) ?? { rate, baseHT: 0, tva: 0, ttc: 0 };
      buckets.set(rate, {
        rate,
        baseHT: existing.baseHT + lineHT,
        tva: existing.tva + lineTVA,
        ttc: existing.ttc + lineTTC,
      });
    }
  }

  const taxBreakdown = Array.from(buckets.values());
  const totalHT = taxBreakdown.reduce((s, b) => s + b.baseHT, 0);
  const totalTVA = taxBreakdown.reduce((s, b) => s + b.tva, 0);
  const totalTTC = taxBreakdown.reduce((s, b) => s + b.ttc, 0);

  return {
    period,
    userId,
    issuerSiret: user.siret ?? invoices[0].issuerSiret ?? '',
    issuerName: user.name ?? invoices[0].issuerName,
    transactionCount: invoices.length,
    totalHT,
    totalTVA,
    totalTTC,
    taxBreakdown,
  };
}
