export type InvoiceReadinessReasonCode =
  | "missing_client_name"
  | "missing_client_address"
  | "missing_client_siret"
  | "client_siret_unvalidated"
  | "missing_transaction_type"
  | "missing_invoice_date"
  | "missing_due_date"
  | "missing_line_items"
  | "missing_issuer_name"
  | "missing_issuer_address"
  | "missing_issuer_siret"
  | "missing_payment_terms"
  | "missing_late_penalty_rate"
  | "missing_legal_mentions";

export interface InvoiceReadinessReason {
  code: InvoiceReadinessReasonCode;
  message: string;
  severity: "blocking" | "warning";
}

export interface InvoiceReadinessInput {
  clientName?: string | null;
  clientAddress?: string | null;
  clientSiret?: string | null;
  clientSiretValidated?: boolean | null;
  transactionType?: string | null;
  invoiceDate?: string | Date | null;
  dueDate?: string | Date | null;
  issuerName?: string | null;
  issuerAddress?: string | null;
  issuerSiret?: string | null;
  paymentTerms?: string | null;
  latePenaltyRate?: string | null;
  legalMentions?: string | null;
  items?: Array<{
    description?: string | null;
    quantity?: number | null;
    unitPrice?: number | null;
  }> | null;
}

export interface InvoiceReadinessResult {
  status: "ready" | "blocked";
  blockingReasons: InvoiceReadinessReason[];
  warnings: InvoiceReadinessReason[];
}

const blocking = (code: InvoiceReadinessReasonCode, message: string): InvoiceReadinessReason => ({
  code, message, severity: "blocking",
});

const warning = (code: InvoiceReadinessReasonCode, message: string): InvoiceReadinessReason => ({
  code, message, severity: "warning",
});

export function evaluateInvoiceReadiness(input: InvoiceReadinessInput): InvoiceReadinessResult {
  const blockingReasons: InvoiceReadinessReason[] = [];
  const warnings: InvoiceReadinessReason[] = [];

  // Issuer fields
  if (!input.issuerName) {
    blockingReasons.push(blocking("missing_issuer_name", "Le nom de l'émetteur est requis."));
  }
  if (!input.issuerAddress) {
    blockingReasons.push(blocking("missing_issuer_address", "L'adresse de l'émetteur est requise."));
  }
  if (!input.issuerSiret) {
    blockingReasons.push(blocking("missing_issuer_siret", "Le SIRET de l'émetteur est requis pour la facturation électronique."));
  }

  // Client fields
  if (!input.clientName) {
    blockingReasons.push(blocking("missing_client_name", "Le nom du client est requis."));
  }
  if (!input.clientAddress) {
    blockingReasons.push(blocking("missing_client_address", "L'adresse du client est requise."));
  }
  if (!input.clientSiret) {
    blockingReasons.push(blocking("missing_client_siret", "Le SIRET du client est requis pour la facturation électronique B2B."));
  } else if (!input.clientSiretValidated) {
    warnings.push(warning("client_siret_unvalidated", "Le SIRET du client n'a pas été vérifié dans le répertoire SIRENE. La facture ne pourra pas être déposée sur Chorus Pro."));
  }

  // Transaction type (EN 16931 mandatory)
  if (!input.transactionType) {
    blockingReasons.push(blocking("missing_transaction_type", "Le type de transaction (B2B / B2C / B2G) est requis."));
  }

  // Invoice dates
  if (!input.invoiceDate) {
    blockingReasons.push(blocking("missing_invoice_date", "La date de facture est requise."));
  }
  if (!input.dueDate) {
    blockingReasons.push(blocking("missing_due_date", "La date d'échéance est requise."));
  }

  // Line items
  if (!input.items || input.items.length === 0) {
    blockingReasons.push(blocking("missing_line_items", "Au moins une ligne de facture est requise."));
  }

  // Payment terms & late penalty (EN 16931 mandatory for B2B)
  if (!input.paymentTerms) {
    warnings.push(warning("missing_payment_terms", "Les conditions de paiement sont recommandées (Article L441-9 du Code de commerce)."));
  }
  if (!input.latePenaltyRate) {
    warnings.push(warning("missing_late_penalty_rate", "Le taux de pénalités de retard est obligatoire sur les factures B2B (Article L441-10)."));
  }

  // Legal mentions
  if (!input.legalMentions) {
    blockingReasons.push(blocking("missing_legal_mentions", "Les mentions légales sont requises."));
  }

  return {
    status: blockingReasons.length > 0 ? "blocked" : "ready",
    blockingReasons,
    warnings,
  };
}
