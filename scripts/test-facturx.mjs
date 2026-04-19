import { generate, check } from '@stafyniaksacha/facturx'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── 1. Build a realistic invoice PDF with pdf-lib ─────────────────────────────
console.log('→ Generating sample invoice PDF with pdf-lib...')
const doc = await PDFDocument.create()
const page = doc.addPage([595, 842])
const font = await doc.embedFont(StandardFonts.Helvetica)
const bold = await doc.embedFont(StandardFonts.HelveticaBold)

page.drawText('FACTURE', { x: 50, y: 780, size: 22, font: bold, color: rgb(0.1, 0.1, 0.5) })
page.drawText('Dupont Conseil – 12 rue de la Paix, 75001 Paris', { x: 50, y: 750, size: 10, font })
page.drawText('SIRET: 12345678900012 | TVA: FR12345678900', { x: 50, y: 735, size: 10, font })
page.drawText('Facture n°: FA-2024-0042', { x: 50, y: 700, size: 11, font: bold })
page.drawText('Date: 01/11/2024  –  Échéance: 30/11/2024', { x: 50, y: 685, size: 10, font })
page.drawText('Client: Acme SAS – 99 av. des Champs-Élysées, 75008 Paris', { x: 50, y: 650, size: 10, font })
page.drawText('Prestation de conseil – oct. 2024  (10h × 500 €)', { x: 50, y: 610, size: 10, font })
page.drawText('5 000,00 €', { x: 460, y: 610, size: 10, font })
page.drawText('Frais de déplacement', { x: 50, y: 595, size: 10, font })
page.drawText('250,00 €', { x: 460, y: 595, size: 10, font })
page.drawText('TVA (20%)', { x: 50, y: 575, size: 10, font })
page.drawText('1 050,00 €', { x: 460, y: 575, size: 10, font })
page.drawText('TOTAL TTC', { x: 50, y: 555, size: 12, font: bold })
page.drawText('6 300,00 €', { x: 455, y: 555, size: 12, font: bold })
page.drawText('Micro-entrepreneur – TVA non applicable, art. 293 B du CGI', { x: 50, y: 80, size: 8, font, color: rgb(0.4,0.4,0.4) })

const pdfBytes = await doc.save()
const pdfBuffer = Buffer.from(pdfBytes)
console.log(`  ✓ Created PDF: ${pdfBuffer.length} bytes`)

// ── 2. Build the CII/Factur-X XML ─────────────────────────────────────────────
function escapeXml(v) {
  return v.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
           .replaceAll('"','&quot;').replaceAll("'","&apos;")
}
function ciiDate(iso) { return iso.replace(/-/g, '') }
function parseAddress(party) {
  if (party.city && party.postalCode) return { lineOne: party.address ?? '', postalCode: party.postalCode, city: party.city, countryCode: party.countryCode ?? 'FR' }
  const raw = party.address ?? ''
  const ci = raw.lastIndexOf(',')
  const lineOne = ci >= 0 ? raw.slice(0, ci).trim() : raw.trim()
  const cityPart = ci >= 0 ? raw.slice(ci + 1).trim() : ''
  const m = cityPart.match(/\b(\d{5})\b/)
  return { lineOne, postalCode: m?.[1] ?? '', city: cityPart.replace(m?.[1] ?? '', '').trim(), countryCode: party.countryCode ?? 'FR' }
}
function renderParty(party, tag) {
  const a = parseAddress(party)
  const legal = party.siret ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escapeXml(party.siret)}</ram:ID></ram:SpecifiedLegalOrganization>` : ''
  const vat = party.vatNumber ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(party.vatNumber)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''
  return `<ram:${tag}><ram:Name>${escapeXml(party.name)}</ram:Name>${legal}<ram:PostalTradeAddress>${a.postalCode ? `<ram:PostcodeCode>${a.postalCode}</ram:PostcodeCode>` : ''}${a.lineOne ? `<ram:LineOne>${escapeXml(a.lineOne)}</ram:LineOne>` : ''}${a.city ? `<ram:CityName>${escapeXml(a.city)}</ram:CityName>` : ''}<ram:CountryID>${a.countryCode}</ram:CountryID></ram:PostalTradeAddress>${vat}</ram:${tag}>`
}

const invoice = {
  invoiceNumber: 'FA-2024-0042',
  invoiceDate: '2024-11-01',
  dueDate: '2024-11-30',
  currency: 'EUR',
  seller: {
    name: 'Dupont Conseil',
    address: '12 rue de la Paix, 75001 Paris',
    siret: '12345678900012',
    vatNumber: 'FR12345678900',
  },
  buyer: {
    name: 'Acme SAS',
    address: '99 avenue des Champs-Élysées, 75008 Paris',
    siret: '98765432100010',
    vatNumber: 'FR98765432100',
  },
  lines: [
    { description: 'Prestation de conseil – octobre 2024', quantity: 10, unitPrice: 500, taxRate: 20 },
    { description: 'Frais de déplacement', quantity: 1, unitPrice: 250, taxRate: 20 },
  ],
  totalAmount: 6300,
  legalMentions: 'Micro-entrepreneur – TVA non applicable, art. 293 B du CGI',
}

// Build full EN 16931 compliant XML
const taxes = []
const taxMap = new Map()
for (const line of invoice.lines) {
  const lineTotal = line.quantity * line.unitPrice
  const taxAmt = parseFloat((lineTotal * line.taxRate / 100).toFixed(2))
  const key = `${line.taxRate}`
  if (taxMap.has(key)) { const t = taxMap.get(key); t.basisAmount += lineTotal; t.calculatedAmount += taxAmt }
  else taxMap.set(key, { typeCode: 'VAT', categoryCode: line.taxRate === 0 ? 'E' : 'S', rate: line.taxRate, basisAmount: lineTotal, calculatedAmount: taxAmt })
}
taxMap.forEach(t => taxes.push(t))

const lineTotal = invoice.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
const taxTotal = taxes.reduce((s, t) => s + t.calculatedAmount, 0)
const grandTotal = parseFloat((lineTotal + taxTotal).toFixed(2))

const linesXml = invoice.lines.map((line, i) => `
  <ram:IncludedSupplyChainTradeLineItem>
    <ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
    <ram:SpecifiedTradeProduct><ram:Name>${escapeXml(line.description)}</ram:Name></ram:SpecifiedTradeProduct>
    <ram:SpecifiedLineTradeAgreement>
      <ram:NetPriceProductTradePrice><ram:ChargeAmount>${line.unitPrice.toFixed(2)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
    </ram:SpecifiedLineTradeAgreement>
    <ram:SpecifiedLineTradeDelivery>
      <ram:BilledQuantity unitCode="C62">${line.quantity}</ram:BilledQuantity>
    </ram:SpecifiedLineTradeDelivery>
    <ram:SpecifiedLineTradeSettlement>
      <ram:ApplicableTradeTax>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:CategoryCode>${line.taxRate === 0 ? 'E' : 'S'}</ram:CategoryCode>
        <ram:RateApplicablePercent>${line.taxRate.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementLineMonetarySummation>
        <ram:LineTotalAmount>${(line.quantity * line.unitPrice).toFixed(2)}</ram:LineTotalAmount>
      </ram:SpecifiedTradeSettlementLineMonetarySummation>
    </ram:SpecifiedLineTradeSettlement>
  </ram:IncludedSupplyChainTradeLineItem>`).join('')

const taxesXml = taxes.map(t => `
  <ram:ApplicableTradeTax>
    <ram:CalculatedAmount>${t.calculatedAmount.toFixed(2)}</ram:CalculatedAmount>
    <ram:TypeCode>${t.typeCode}</ram:TypeCode>
    <ram:BasisAmount>${t.basisAmount.toFixed(2)}</ram:BasisAmount>
    <ram:CategoryCode>${t.categoryCode}</ram:CategoryCode>
    <ram:RateApplicablePercent>${t.rate.toFixed(2)}</ram:RateApplicablePercent>
  </ram:ApplicableTradeTax>`).join('')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(invoice.invoiceNumber)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${ciiDate(invoice.invoiceDate)}</udt:DateTimeString></ram:IssueDateTime>
    ${invoice.legalMentions ? `<ram:IncludedNote><ram:Content>${escapeXml(invoice.legalMentions)}</ram:Content></ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${linesXml}
    <ram:ApplicableHeaderTradeAgreement>
      ${renderParty(invoice.seller, 'SellerTradeParty')}
      ${renderParty(invoice.buyer, 'BuyerTradeParty')}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${invoice.currency}</ram:InvoiceCurrencyCode>
      ${taxesXml}
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime><udt:DateTimeString format="102">${ciiDate(invoice.dueDate)}</udt:DateTimeString></ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${lineTotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${lineTotal.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount>${taxTotal.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${grandTotal.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${invoice.totalAmount.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`

console.log('\n→ Generated CII XML preview (first 400 chars):')
console.log(xml.slice(0, 400) + '...')

// ── 3. Validate the XML ───────────────────────────────────────────────────────
console.log('\n→ Running check()...')
const validation = await check({ xml, flavor: 'facturx', level: 'en16931' })
console.log('  check() result:', JSON.stringify(validation, null, 2))

// ── 4. Embed XML into PDF ─────────────────────────────────────────────────────
console.log('\n→ Running generate()...')
const result = await generate({
  pdf: pdfBuffer,
  xml,
  flavor: 'facturx',
  level: 'en16931',
  language: 'fr-FR',
  meta: {
    author: invoice.seller.name,
    title: invoice.invoiceNumber,
    subject: `Facture ${invoice.invoiceNumber}`,
    keywords: ['Factur-X', 'EN16931', invoice.invoiceNumber],
    date: new Date(invoice.invoiceDate),
  },
})

const outPath = resolve(__dirname, '../facturx-output.pdf')
const outPdf = Buffer.isBuffer(result) ? result : Buffer.from(result)
writeFileSync(outPath, outPdf)
console.log(`\n✓ Factur-X PDF written to: ${outPath}`)
console.log(`  Size: ${outPdf.length} bytes (original: ${pdfBuffer.length} bytes)`)
console.log('\n✓ End-to-end Factur-X generation: SUCCESS')
