import { buildFacturxXml, type FacturxInvoiceInput } from '../../src/domains/invoices/facturx/invoice-to-cii';

const completeInvoice: FacturxInvoiceInput = {
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
    address: '99 avenue Montaigne, 75008 Paris',
    siret: '98765432100010',
  },
  lines: [
    { description: 'Prestation de conseil', quantity: 10, unitPrice: 500, taxRate: 20 },
    { description: 'Frais de déplacement', quantity: 1, unitPrice: 250, taxRate: 20 },
  ],
  totalAmount: 6300,
  legalMentions: 'Micro-entrepreneur – TVA non applicable, art. 293 B du CGI',
};

describe('buildFacturxXml', () => {
  it('produces a CrossIndustryInvoice XML root', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('<rsm:CrossIndustryInvoice');
    expect(xml).toContain('xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"');
  });

  it('includes the EN 16931 guideline ID', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931');
  });

  it('emits TypeCode 380 for a standard invoice', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('<ram:TypeCode>380</ram:TypeCode>');
  });

  it('formats invoiceDate as YYYYMMDD', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('<udt:DateTimeString format="102">20241101</udt:DateTimeString>');
  });

  it('handles full ISO timestamp for invoiceDate', () => {
    const xml = buildFacturxXml({ ...completeInvoice, invoiceDate: '2024-11-01T00:00:00.000Z' });
    expect(xml).toContain('<udt:DateTimeString format="102">20241101</udt:DateTimeString>');
  });

  it('includes seller name and SIRET', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('Dupont Conseil');
    expect(xml).toContain('12345678900012');
  });

  it('includes buyer name', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('Acme SAS');
  });

  it('puts CountryID FR by default when address has no explicit countryCode', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml.match(/<ram:CountryID>FR<\/ram:CountryID>/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('emits line items before ApplicableHeaderTradeAgreement (XSD sequence order)', () => {
    const xml = buildFacturxXml(completeInvoice);
    const lineIdx = xml.indexOf('IncludedSupplyChainTradeLineItem');
    const agreementIdx = xml.indexOf('ApplicableHeaderTradeAgreement');
    expect(lineIdx).toBeLessThan(agreementIdx);
  });

  it('aggregates taxes from multiple lines into one header block', () => {
    const xml = buildFacturxXml(completeInvoice);
    // Both lines at 20% → single ApplicableTradeTax in header
    const matches = xml.match(/<ram:ApplicableTradeTax>/g);
    // 2 line-level + 1 header-level = 3 total (both lines share the same rate)
    expect(matches?.length).toBe(3);
  });

  it('calculates tax totals correctly', () => {
    // lineTotal = 5000 + 250 = 5250, taxTotal = 5250 * 0.20 = 1050
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('<ram:LineTotalAmount>5250.00</ram:LineTotalAmount>');
    expect(xml).toContain('<ram:TaxTotalAmount>1050.00</ram:TaxTotalAmount>');
    expect(xml).toContain('<ram:GrandTotalAmount>6300.00</ram:GrandTotalAmount>');
  });

  it('includes SpecifiedTradeSettlementHeaderMonetarySummation with all required fields', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('SpecifiedTradeSettlementHeaderMonetarySummation');
    expect(xml).toContain('LineTotalAmount');
    expect(xml).toContain('TaxBasisTotalAmount');
    expect(xml).toContain('GrandTotalAmount');
    expect(xml).toContain('DuePayableAmount');
  });

  it('uses structured address fields when provided', () => {
    const xml = buildFacturxXml({
      ...completeInvoice,
      seller: { ...completeInvoice.seller, city: 'Lyon', postalCode: '69001', countryCode: 'FR' },
    });
    expect(xml).toContain('<ram:CityName>Lyon</ram:CityName>');
    expect(xml).toContain('<ram:PostcodeCode>69001</ram:PostcodeCode>');
  });

  it('escapes XML special characters in description', () => {
    const xml = buildFacturxXml({
      ...completeInvoice,
      lines: [{ description: 'Prestation <spéciale> & "haute" valeur', quantity: 1, unitPrice: 1000, taxRate: 20 }],
    });
    expect(xml).toContain('Prestation &lt;spéciale&gt; &amp; &quot;haute&quot; valeur');
    expect(xml).not.toContain('<spéciale>');
  });

  it('uses CategoryCode E for zero-rate lines', () => {
    const xml = buildFacturxXml({
      ...completeInvoice,
      lines: [{ description: 'Export hors-TVA', quantity: 1, unitPrice: 1000, taxRate: 0 }],
    });
    expect(xml).toContain('<ram:CategoryCode>E</ram:CategoryCode>');
  });

  it('renders legal mentions as IncludedNote', () => {
    const xml = buildFacturxXml(completeInvoice);
    expect(xml).toContain('<ram:IncludedNote>');
    expect(xml).toContain('art. 293 B du CGI');
  });

  it('omits IncludedNote when legalMentions is null', () => {
    const xml = buildFacturxXml({ ...completeInvoice, legalMentions: null });
    expect(xml).not.toContain('<ram:IncludedNote>');
  });
});
