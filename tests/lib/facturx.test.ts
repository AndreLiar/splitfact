import { generateFacturxDocument } from '@/domains/invoices/facturx/facturx-generator'
import { validateFacturxXml } from '@/domains/invoices/facturx/facturx-validator'

const buildInvoiceInput = () => ({
  invoiceNumber: 'INV-202604-0001',
  invoiceDate: '2026-04-19',
  dueDate: '2026-05-19',
  currency: 'EUR',
  seller: {
    name: 'Splitfact',
    address: '20 avenue de Lyon, Paris',
    siret: '12345678901234',
    vatNumber: 'FR00123456789',
  },
  buyer: {
    name: 'Client Test',
    address: '10 rue de Paris',
    siret: '98765432100010',
    vatNumber: 'FR00987654321',
  },
  lines: [
    {
      description: 'Mission de conseil',
      quantity: 1,
      unitPrice: 1200,
      taxRate: 0,
    },
  ],
  totalAmount: 1200,
  legalMentions: 'TVA non applicable, art. 293 B du CGI',
})

describe('factur-x fallback generation', () => {
  it('validates generated XML with the local fallback when the library is unavailable', async () => {
    const generation = await generateFacturxDocument(
      buildInvoiceInput(),
      Buffer.from('fake-pdf-buffer')
    )

    expect(generation.success).toBe(true)
    if (generation.success) {
      expect(generation.xmlFilename).toBe('factur-x.xml')
      expect(generation.xml).toContain('CrossIndustryInvoice')
      expect(generation.pdf.equals(Buffer.from('fake-pdf-buffer'))).toBe(true)
      expect(generation.validationErrors).toHaveLength(0)
    }
  })

  it('returns validation errors for malformed xml', async () => {
    const validation = await validateFacturxXml('<Invoice></Invoice>')

    expect(validation.valid).toBe(false)
    expect(validation.errors.length).toBeGreaterThan(0)
  })
})
