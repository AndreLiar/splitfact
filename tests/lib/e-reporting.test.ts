import { buildEReportingXml, EReportingData } from '@/lib/e-reporting/generate';

const baseData: EReportingData = {
  period: '2026-03',
  userId: 'user_test_123',
  issuerSiret: '12345678901234',
  issuerName: 'Acme SAS',
  transactionCount: 42,
  totalHT: 10000,
  totalTVA: 2000,
  totalTTC: 12000,
  taxBreakdown: [
    { rate: 20, baseHT: 8000, tva: 1600, ttc: 9600 },
    { rate: 10, baseHT: 2000, tva: 200,  ttc: 2200 },
  ],
};

describe('buildEReportingXml', () => {
  let xml: string;

  beforeAll(() => {
    xml = buildEReportingXml(baseData);
  });

  it('produces valid XML with CII root element', () => {
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rsm:CrossIndustryInvoice');
    expect(xml).toContain('</rsm:CrossIndustryInvoice>');
  });

  it('uses TypeCode 751 for e-reporting summary', () => {
    expect(xml).toContain('<ram:TypeCode>751</ram:TypeCode>');
  });

  it('includes the period in document ID', () => {
    expect(xml).toContain('EREPORT-2026-03-12345678901234');
  });

  it('includes transaction count in note', () => {
    expect(xml).toContain('42 transactions');
  });

  it('includes issuer SIRET', () => {
    expect(xml).toContain('12345678901234');
  });

  it('includes issuer name', () => {
    expect(xml).toContain('Acme SAS');
  });

  it('includes period start and end dates', () => {
    expect(xml).toContain('20260301'); // period start
    expect(xml).toContain('20260331'); // March 31
  });

  it('includes monetary totals', () => {
    expect(xml).toContain('10000.00'); // totalHT
    expect(xml).toContain('2000.00');  // totalTVA
    expect(xml).toContain('12000.00'); // totalTTC
  });

  it('includes a tax line for each breakdown bucket', () => {
    const taxLineCount = (xml.match(/<ram:ApplicableTradeTax>/g) ?? []).length;
    expect(taxLineCount).toBe(2);
  });

  it('uses category S for non-zero rates', () => {
    expect(xml).toContain('<ram:CategoryCode>S</ram:CategoryCode>');
  });

  it('uses category Z for zero rate', () => {
    const zeroData: EReportingData = {
      ...baseData,
      taxBreakdown: [{ rate: 0, baseHT: 5000, tva: 0, ttc: 5000 }],
    };
    const out = buildEReportingXml(zeroData);
    expect(out).toContain('<ram:CategoryCode>Z</ram:CategoryCode>');
  });

  it('includes correct rate percentages', () => {
    expect(xml).toContain('<ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>');
    expect(xml).toContain('<ram:RateApplicablePercent>10.00</ram:RateApplicablePercent>');
  });

  it('escapes XML special characters in issuer name', () => {
    const data: EReportingData = { ...baseData, issuerName: 'Acme & Co <Test>' };
    const out = buildEReportingXml(data);
    expect(out).toContain('Acme &amp; Co &lt;Test&gt;');
  });

  it('handles February correctly (28 days in non-leap year)', () => {
    const febData: EReportingData = { ...baseData, period: '2026-02' };
    const out = buildEReportingXml(febData);
    expect(out).toContain('20260228');
  });

  it('handles December correctly', () => {
    const decData: EReportingData = { ...baseData, period: '2026-12' };
    const out = buildEReportingXml(decData);
    expect(out).toContain('20261231');
  });
});
