/**
 * UBL 2.1 Invoice serializer — OASIS UBL 2.1 / EN 16931
 * Produces a conformant UBL XML string from an invoice record.
 * Spec: http://docs.oasis-open.org/ubl/os-UBL-2.1/UBL-2.1.html
 */

export interface UblParty {
  name: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
}

export interface UblLineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface UblInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;   // YYYY-MM-DD
  dueDate: string;       // YYYY-MM-DD
  currency: string;
  seller: UblParty;
  buyer: UblParty;
  lines: UblLineItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  buyerReference?: string | null;
  paymentTerms?: string | null;
  note?: string | null;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function partyXml(tag: string, p: UblParty): string {
  const [street, ...rest] = (p.address ?? '').split(',');
  const city = p.city ?? rest.join(',').trim() ?? '';
  return `
  <cac:${tag}>
    <cac:Party>
      ${p.vatNumber ? `<cbc:EndpointID schemeID="EM">${esc(p.vatNumber)}</cbc:EndpointID>` : ''}
      ${p.siret ? `<cac:PartyIdentification><cbc:ID schemeID="0002">${esc(p.siret)}</cbc:ID></cac:PartyIdentification>` : ''}
      <cac:PartyName><cbc:Name>${esc(p.name)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(street ?? p.address ?? '')}</cbc:StreetName>
        <cbc:CityName>${esc(city)}</cbc:CityName>
        <cbc:PostalZone>${esc(p.postalCode ?? '')}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${esc(p.countryCode ?? 'FR')}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${p.vatNumber ? `<cac:PartyTaxScheme><cbc:CompanyID>${esc(p.vatNumber)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(p.name)}</cbc:RegistrationName>
        ${p.siret ? `<cbc:CompanyID schemeID="0002">${esc(p.siret)}</cbc:CompanyID>` : ''}
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:${tag}>`;
}

function taxTotals(lines: UblLineItem[], currency: string): string {
  const buckets = new Map<number, { base: number; tax: number }>();
  for (const l of lines) {
    const base = l.quantity * l.unitPrice;
    const tax = base * (l.taxRate / 100);
    const existing = buckets.get(l.taxRate) ?? { base: 0, tax: 0 };
    buckets.set(l.taxRate, { base: existing.base + base, tax: existing.tax + tax });
  }

  const subtotals = Array.from(buckets.entries())
    .map(([rate, { base, tax }]) => `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${base.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${tax.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${rate === 0 ? 'Z' : 'S'}</cbc:ID>
        <cbc:Percent>${rate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`)
    .join('');

  const totalTax = Array.from(buckets.values()).reduce((s, b) => s + b.tax, 0);

  return `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${totalTax.toFixed(2)}</cbc:TaxAmount>
    ${subtotals}
  </cac:TaxTotal>`;
}

function lineXml(l: UblLineItem, currency: string): string {
  const lineHT = l.quantity * l.unitPrice;
  const taxAmount = lineHT * (l.taxRate / 100);
  return `
  <cac:InvoiceLine>
    <cbc:ID>${l.id}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${l.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${lineHT.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${esc(l.description)}</cbc:Description>
      <cbc:Name>${esc(l.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${l.taxRate === 0 ? 'Z' : 'S'}</cbc:ID>
        <cbc:Percent>${l.taxRate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${l.unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${taxAmount.toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>
  </cac:InvoiceLine>`;
}

export function buildUblXml(inv: UblInvoiceInput): string {
  const cur = inv.currency;

  return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice
  xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(inv.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${inv.invoiceDate}</cbc:IssueDate>
  <cbc:DueDate>${inv.dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  ${inv.note ? `<cbc:Note>${esc(inv.note)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${cur}</cbc:DocumentCurrencyCode>
  ${inv.buyerReference ? `<cbc:BuyerReference>${esc(inv.buyerReference)}</cbc:BuyerReference>` : ''}
  ${partyXml('AccountingSupplierParty', inv.seller)}
  ${partyXml('AccountingCustomerParty', inv.buyer)}
  ${inv.paymentTerms ? `<cac:PaymentTerms><cbc:Note>${esc(inv.paymentTerms)}</cbc:Note></cac:PaymentTerms>` : ''}
  ${taxTotals(inv.lines, cur)}
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${cur}">${inv.totalHT.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${cur}">${inv.totalHT.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${cur}">${inv.totalTTC.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${cur}">${inv.totalTTC.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${inv.lines.map((l) => lineXml(l, cur)).join('')}
</ubl:Invoice>`;
}
