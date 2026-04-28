export interface FacturxParty {
  name: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
}

export interface FacturxLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface FacturxInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;   // YYYY-MM-DD
  dueDate: string;       // YYYY-MM-DD
  currency: string;
  seller: FacturxParty;
  buyer: FacturxParty;
  lines: FacturxLineItem[];
  totalAmount: number;
  legalMentions?: string | null;
  // EN 16931 EXTENDED fields
  transactionType?: 'B2B' | 'B2C' | 'B2G' | null;
  buyerReference?: string | null;        // numéro de bon de commande acheteur
  deliveryAddress?: string | null;       // adresse de livraison / prestation
  paymentTerms?: string | null;          // conditions de paiement texte libre
  latePenaltyRate?: string | null;       // taux de pénalités de retard
  recoveryIndemnity?: number | null;     // indemnité forfaitaire de recouvrement (€40)
  // BTP sub-contractor fields
  btpInvoiceType?: 'standard' | 'situation' | 'autoliquidation' | null;
  retenueGarantieAmount?: number | null; // retenue de garantie deduction in EUR
  situationNumber?: number | null;       // numéro de situation (e.g. 3)
  referenceContract?: string | null;     // référence du marché / contrat
  previousCumulativeAmount?: number | null; // montant HT cumulé précédent
  previousInvoiceNumber?: string | null; // n° facture précédente (situation)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const XML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => XML_ESCAPE_MAP[ch]);
}

/** Any ISO date string → YYYYMMDD (CII format 102). Handles both "YYYY-MM-DD" and full ISO timestamps. */
function ciiDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

/** Parse a flat French address string "12 rue de la Paix, 75001 Paris" */
function parseAddress(party: FacturxParty): {
  lineOne: string;
  postalCode: string;
  city: string;
  countryCode: string;
} {
  if (party.city && party.postalCode) {
    return {
      lineOne: party.address ?? "",
      postalCode: party.postalCode,
      city: party.city,
      countryCode: party.countryCode ?? "FR",
    };
  }
  const raw = party.address ?? "";
  const commaIdx = raw.lastIndexOf(",");
  const lineOne = commaIdx >= 0 ? raw.slice(0, commaIdx).trim() : raw.trim();
  const cityPart = commaIdx >= 0 ? raw.slice(commaIdx + 1).trim() : "";
  const postalMatch = cityPart.match(/\b(\d{5})\b/);
  const postalCode = postalMatch?.[1] ?? "";
  const city = cityPart.replace(postalCode, "").trim();
  return { lineOne, postalCode, city, countryCode: party.countryCode ?? "FR" };
}

interface TaxGroup {
  typeCode: string;
  categoryCode: string;
  rate: number;
  basisAmount: number;
  calculatedAmount: number;
}

function aggregateTaxes(lines: FacturxLineItem[], isAutoliquidation: boolean): TaxGroup[] {
  const groups = new Map<string, TaxGroup>();
  for (const line of lines) {
    const lineTotal = line.quantity * line.unitPrice;
    const taxAmt = parseFloat((lineTotal * line.taxRate / 100).toFixed(2));
    const key = `${line.taxRate}`;
    const categoryCode = isAutoliquidation ? "AE" : (line.taxRate === 0 ? "E" : "S");
    const existing = groups.get(key);
    if (existing) {
      existing.basisAmount = parseFloat((existing.basisAmount + lineTotal).toFixed(2));
      existing.calculatedAmount = parseFloat((existing.calculatedAmount + taxAmt).toFixed(2));
    } else {
      groups.set(key, {
        typeCode: "VAT",
        categoryCode,
        rate: line.taxRate,
        basisAmount: parseFloat(lineTotal.toFixed(2)),
        calculatedAmount: taxAmt,
      });
    }
  }
  return Array.from(groups.values());
}

function renderParty(party: FacturxParty, tag: string): string {
  const addr = parseAddress(party);
  const legal = party.siret
    ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escapeXml(party.siret)}</ram:ID></ram:SpecifiedLegalOrganization>`
    : "";
  const vat = party.vatNumber
    ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(party.vatNumber)}</ram:ID></ram:SpecifiedTaxRegistration>`
    : "";
  const addrXml = `
      <ram:PostalTradeAddress>
        ${addr.postalCode ? `<ram:PostcodeCode>${escapeXml(addr.postalCode)}</ram:PostcodeCode>` : ""}
        ${addr.lineOne ? `<ram:LineOne>${escapeXml(addr.lineOne)}</ram:LineOne>` : ""}
        ${addr.city ? `<ram:CityName>${escapeXml(addr.city)}</ram:CityName>` : ""}
        <ram:CountryID>${escapeXml(addr.countryCode)}</ram:CountryID>
      </ram:PostalTradeAddress>`;
  return `
    <ram:${tag}>
      <ram:Name>${escapeXml(party.name)}</ram:Name>
      ${legal}
      ${addrXml}
      ${vat}
    </ram:${tag}>`;
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildFacturxXml(input: FacturxInvoiceInput): string {
  const isAutoliquidation = input.btpInvoiceType === 'autoliquidation';
  const isSituation = input.btpInvoiceType === 'situation';
  const retenueAmount = (input.retenueGarantieAmount != null && input.retenueGarantieAmount > 0)
    ? input.retenueGarantieAmount
    : 0;

  const taxes = aggregateTaxes(input.lines, isAutoliquidation);
  const lineTotal = input.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxTotal = taxes.reduce((s, t) => s + t.calculatedAmount, 0);
  const taxBasis = parseFloat((lineTotal - retenueAmount).toFixed(2));
  const grandTotal = parseFloat((taxBasis + taxTotal).toFixed(2));

  const lineTotalStr = lineTotal.toFixed(2);
  const taxTotalStr = taxTotal.toFixed(2);
  const taxBasisStr = taxBasis.toFixed(2);
  const grandTotalStr = grandTotal.toFixed(2);

  // Dominant tax category for the retenue allowance charge
  const dominantTaxCat = taxes.length > 0 ? taxes[0] : { categoryCode: isAutoliquidation ? 'AE' : 'E', rate: 0 };

  const linesXml = input.lines
    .map(
      (line, i) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(line.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${line.unitPrice.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${line.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${isAutoliquidation ? "AE" : (line.taxRate === 0 ? "E" : "S")}</ram:CategoryCode>
          <ram:RateApplicablePercent>${line.taxRate.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${(line.quantity * line.unitPrice).toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`
    )
    .join("");

  const taxesXml = taxes
    .map(
      (t) => `
    <ram:ApplicableTradeTax>
      <ram:CalculatedAmount>${t.calculatedAmount.toFixed(2)}</ram:CalculatedAmount>
      <ram:TypeCode>${t.typeCode}</ram:TypeCode>
      ${isAutoliquidation ? `<ram:ExemptionReason>Autoliquidation de TVA - Art. 283, 2 nonies CGI</ram:ExemptionReason>` : ""}
      <ram:BasisAmount>${t.basisAmount.toFixed(2)}</ram:BasisAmount>
      <ram:CategoryCode>${t.categoryCode}</ram:CategoryCode>
      ${isAutoliquidation ? `<ram:ExemptionReasonCode>VATEX-EU-AE</ram:ExemptionReasonCode>` : ""}
      <ram:RateApplicablePercent>${t.rate.toFixed(2)}</ram:RateApplicablePercent>
    </ram:ApplicableTradeTax>`
    )
    .join("");

  // Retenue de garantie — document-level allowance (ChargeIndicator=false)
  const retenueXml = retenueAmount > 0
    ? `
    <ram:SpecifiedTradeAllowanceCharge>
      <ram:ChargeIndicator>
        <udt:Indicator>false</udt:Indicator>
      </ram:ChargeIndicator>
      <ram:ActualAmount>${retenueAmount.toFixed(2)}</ram:ActualAmount>
      <ram:Reason>Retenue de garantie</ram:Reason>
      <ram:CategoryTradeTax>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:CategoryCode>${dominantTaxCat.categoryCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${dominantTaxCat.rate.toFixed(2)}</ram:RateApplicablePercent>
      </ram:CategoryTradeTax>
    </ram:SpecifiedTradeAllowanceCharge>`
    : "";

  // Preceding invoice reference for situation invoices (BT-25)
  const precedingInvoiceXml = isSituation && input.previousInvoiceNumber
    ? `
      <ram:InvoiceReferencedDocument>
        <ram:IssuerAssignedID>${escapeXml(input.previousInvoiceNumber)}</ram:IssuerAssignedID>
      </ram:InvoiceReferencedDocument>`
    : "";

  // Business process context — maps transactionType to BII profile URNs
  const bpUrn = input.transactionType === 'B2G'
    ? 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0'
    : 'urn:factur-x.eu:1p0:en16931';

  // Situation note — appended as IncludedNote in ExchangedDocument
  const situationNoteContent = isSituation && input.situationNumber != null
    ? [
        `Situation n°${input.situationNumber}`,
        input.referenceContract ? `Contrat : ${input.referenceContract}` : null,
        input.previousCumulativeAmount != null
          ? `Montant HT cumulé précédent : ${input.previousCumulativeAmount.toFixed(2)} €`
          : null,
      ].filter(Boolean).join(' — ')
    : null;

  // Delivery block
  const deliveryXml = input.deliveryAddress
    ? `
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ShipToTradeParty>
        <ram:Name>${escapeXml(input.buyer.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(input.deliveryAddress)}</ram:LineOne>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:ShipToTradeParty>
    </ram:ApplicableHeaderTradeDelivery>`
    : `<ram:ApplicableHeaderTradeDelivery/>`;

  // Payment terms
  const penaltyNote = [
    input.paymentTerms,
    input.latePenaltyRate ? `Pénalités de retard : ${input.latePenaltyRate}` : null,
    input.recoveryIndemnity != null ? `Indemnité forfaitaire de recouvrement : ${input.recoveryIndemnity.toFixed(2)} €` : null,
  ].filter(Boolean).join(' — ');

  const paymentTermsXml = `
      <ram:SpecifiedTradePaymentTerms>
        ${penaltyNote ? `<ram:Description>${escapeXml(penaltyNote)}</ram:Description>` : ''}
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${ciiDate(input.dueDate)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>`;

  // Monetary summary — AllowanceTotalAmount only present when retenue > 0
  const allowanceXml = retenueAmount > 0
    ? `<ram:AllowanceTotalAmount>${retenueAmount.toFixed(2)}</ram:AllowanceTotalAmount>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter>
      <ram:ID>${escapeXml(bpUrn)}</ram:ID>
    </ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(input.invoiceNumber)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${ciiDate(input.invoiceDate)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${input.legalMentions ? `<ram:IncludedNote><ram:Content>${escapeXml(input.legalMentions)}</ram:Content></ram:IncludedNote>` : ""}
    ${situationNoteContent ? `<ram:IncludedNote><ram:Content>${escapeXml(situationNoteContent)}</ram:Content></ram:IncludedNote>` : ""}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${linesXml}
    <ram:ApplicableHeaderTradeAgreement>
      ${input.buyerReference ? `<ram:BuyerOrderReferencedDocument><ram:IssuerAssignedID>${escapeXml(input.buyerReference)}</ram:IssuerAssignedID></ram:BuyerOrderReferencedDocument>` : ''}
      ${renderParty(input.seller, "SellerTradeParty")}
      ${renderParty(input.buyer, "BuyerTradeParty")}
    </ram:ApplicableHeaderTradeAgreement>
    ${deliveryXml}
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${escapeXml(input.currency)}</ram:InvoiceCurrencyCode>
      ${taxesXml}
      ${paymentTermsXml}
      ${retenueXml}
      ${precedingInvoiceXml}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${lineTotalStr}</ram:LineTotalAmount>
        ${allowanceXml}
        <ram:TaxBasisTotalAmount>${taxBasisStr}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount>${taxTotalStr}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${grandTotalStr}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${grandTotalStr}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
