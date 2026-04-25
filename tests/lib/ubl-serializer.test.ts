import { buildUblXml, UblInvoiceInput } from '@/domains/invoices/ubl-serializer';

const baseInvoice: UblInvoiceInput = {
  invoiceNumber: 'FA-2026-0001',
  invoiceDate: '2026-04-01',
  dueDate: '2026-05-01',
  currency: 'EUR',
  seller: {
    name: 'Acme SAS',
    address: '10 rue de la Paix, Paris',
    siret: '12345678901234',
    vatNumber: 'FR00123456789',
    countryCode: 'FR',
  },
  buyer: {
    name: 'Client Corp',
    address: '5 avenue Foch',
    siret: '98765432100010',
    vatNumber: 'FR00987654321',
    countryCode: 'FR',
  },
  lines: [
    { id: 1, description: 'Prestation de conseil', quantity: 2, unitPrice: 500, taxRate: 20 },
    { id: 2, description: 'Rapport final',          quantity: 1, unitPrice: 200, taxRate: 20 },
  ],
  totalHT: 1200,
  totalTVA: 240,
  totalTTC: 1440,
};

describe('buildUblXml', () => {
  let xml: string;

  beforeAll(() => {
    xml = buildUblXml(baseInvoice);
  });

  it('produces well-formed XML with UBL 2.1 root element', () => {
    expect(xml).toContain('xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"');
    expect(xml).toContain('<ubl:Invoice');
    expect(xml).toContain('</ubl:Invoice>');
  });

  it('includes EN 16931 customization ID', () => {
    expect(xml).toContain('urn:cen.eu:en16931:2017#compliant');
  });

  it('embeds invoice number and dates', () => {
    expect(xml).toContain('<cbc:ID>FA-2026-0001</cbc:ID>');
    expect(xml).toContain('<cbc:IssueDate>2026-04-01</cbc:IssueDate>');
    expect(xml).toContain('<cbc:DueDate>2026-05-01</cbc:DueDate>');
  });

  it('includes seller and buyer names', () => {
    expect(xml).toContain('Acme SAS');
    expect(xml).toContain('Client Corp');
  });

  it('includes SIRET identifiers', () => {
    expect(xml).toContain('12345678901234');
    expect(xml).toContain('98765432100010');
  });

  it('includes VAT numbers', () => {
    expect(xml).toContain('FR00123456789');
    expect(xml).toContain('FR00987654321');
  });

  it('computes monetary totals correctly', () => {
    expect(xml).toContain('1200.00'); // HT
    expect(xml).toContain('1440.00'); // TTC
  });

  it('computes tax totals for 20% rate', () => {
    expect(xml).toContain('240.00'); // total TVA (1200 * 0.20)
  });

  it('includes two invoice lines', () => {
    const lineCount = (xml.match(/<cac:InvoiceLine>/g) ?? []).length;
    expect(lineCount).toBe(2);
  });

  it('escapes XML special characters in descriptions', () => {
    const inv = { ...baseInvoice, lines: [{ id: 1, description: 'R&D <test>', quantity: 1, unitPrice: 100, taxRate: 0 }], totalHT: 100, totalTVA: 0, totalTTC: 100 };
    const out = buildUblXml(inv);
    expect(out).toContain('R&amp;D &lt;test&gt;');
  });

  it('uses tax category Z for 0% lines', () => {
    const inv = { ...baseInvoice, lines: [{ id: 1, description: 'Exonéré', quantity: 1, unitPrice: 500, taxRate: 0 }], totalHT: 500, totalTVA: 0, totalTTC: 500 };
    const out = buildUblXml(inv);
    expect(out).toContain('<cbc:ID>Z</cbc:ID>');
  });

  it('uses tax category S for taxed lines', () => {
    expect(xml).toContain('<cbc:ID>S</cbc:ID>');
  });

  it('includes optional note when provided', () => {
    const inv = { ...baseInvoice, note: 'TVA non applicable art. 293B CGI' };
    const out = buildUblXml(inv);
    expect(out).toContain('TVA non applicable art. 293B CGI');
  });

  it('omits optional elements when not provided', () => {
    expect(xml).not.toContain('<cbc:Note>undefined</cbc:Note>');
    expect(xml).not.toContain('<cbc:BuyerReference>undefined</cbc:BuyerReference>');
  });

  it('groups multiple lines with same tax rate into one TaxSubtotal', () => {
    // both lines are 20% — should produce exactly one TaxSubtotal
    const subtotalCount = (xml.match(/<cac:TaxSubtotal>/g) ?? []).length;
    expect(subtotalCount).toBe(1);
  });

  it('produces separate TaxSubtotals for different rates', () => {
    const inv = {
      ...baseInvoice,
      lines: [
        { id: 1, description: 'Service A', quantity: 1, unitPrice: 100, taxRate: 20 },
        { id: 2, description: 'Service B', quantity: 1, unitPrice: 100, taxRate: 10 },
      ],
      totalHT: 200, totalTVA: 30, totalTTC: 230,
    };
    const out = buildUblXml(inv);
    const subtotalCount = (out.match(/<cac:TaxSubtotal>/g) ?? []).length;
    expect(subtotalCount).toBe(2);
  });
});
