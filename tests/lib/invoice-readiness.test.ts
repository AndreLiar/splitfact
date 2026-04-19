import { evaluateInvoiceReadiness } from '@/lib/invoice-readiness'

describe('invoice readiness', () => {
  it('marks an invoice as blocked when required fields are missing', () => {
    const result = evaluateInvoiceReadiness({
      clientName: '',
      clientAddress: null,
      invoiceDate: null,
      dueDate: null,
      issuerName: 'Splitfact',
      issuerAddress: '',
      legalMentions: null,
      items: [],
    })

    expect(result.status).toBe('blocked')
    expect(result.blockingReasons.map((reason) => reason.code)).toEqual(
      expect.arrayContaining([
        'missing_client_name',
        'missing_client_address',
        'missing_invoice_date',
        'missing_due_date',
        'missing_issuer_address',
        'missing_line_items',
        'missing_legal_mentions',
      ])
    )
  })

  it('marks an invoice as ready when minimum emission data is present', () => {
    const result = evaluateInvoiceReadiness({
      clientName: 'Client Test',
      clientAddress: '10 rue de Paris',
      invoiceDate: '2026-04-19',
      dueDate: '2026-05-19',
      issuerName: 'Splitfact',
      issuerAddress: '20 avenue de Lyon',
      legalMentions: 'TVA non applicable, art. 293 B du CGI',
      items: [
        {
          description: 'Mission de conseil',
          quantity: 1,
          unitPrice: 1200,
        },
      ],
    })

    expect(result.status).toBe('ready')
    expect(result.blockingReasons).toHaveLength(0)
  })
})
