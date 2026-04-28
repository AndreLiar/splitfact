
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#666',
  },
  invoiceDetails: {
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 10,
    color: '#666',
  },
  // BTP situation banner
  situationBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderStyle: 'solid',
    padding: 12,
    marginBottom: 20,
  },
  situationBannerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 6,
  },
  situationBannerRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  situationBannerLabel: {
    fontSize: 9,
    color: '#374151',
    width: '40%',
  },
  situationBannerValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    width: '60%',
  },
  // Autoliquidation banner
  autoliqBanner: {
    backgroundColor: '#fef9c3',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ca8a04',
    borderStyle: 'solid',
    padding: 10,
    marginBottom: 20,
  },
  autoliqBannerText: {
    fontSize: 9,
    color: '#713f12',
    lineHeight: 1.5,
  },
  partiesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  partyBox: {
    width: '45%',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
  },
  partyTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
    textTransform: 'uppercase',
  },
  partyText: {
    fontSize: 9,
    marginBottom: 3,
    color: '#4b5563',
  },
  partyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  servicesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#374151',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
    paddingBottom: 4,
  },
  table: {
    width: 'auto',
    marginBottom: 20,
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f3f4f6',
    padding: 7,
  },
  tableCol: {
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 7,
  },
  tableColDesc:  { width: '40%' },
  tableColQty:   { width: '12%' },
  tableColPrice: { width: '16%' },
  tableColTva:   { width: '12%' },
  tableColTotal: { width: '20%' },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    fontSize: 9,
    color: '#4b5563',
  },
  tableCellRight: {
    fontSize: 9,
    color: '#4b5563',
    textAlign: 'right',
  },
  tableCellMuted: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'right',
  },
  totalSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalBox: {
    width: '52%',
    padding: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderStyle: 'solid',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  totalLabel: {
    fontSize: 10,
    color: '#374151',
  },
  totalLabelBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  totalAmountFinal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  totalAmountDeduction: {
    fontSize: 10,
    color: '#b45309',
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
    borderTopStyle: 'solid',
    marginBottom: 7,
    marginTop: 2,
  },
  bankSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  paymentTermsSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  sectionSubTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  paymentTermsText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#4b5563',
    marginBottom: 4,
  },
  legalMentionsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  legalMentionsText: {
    fontSize: 7.5,
    lineHeight: 1.5,
    color: '#6b7280',
  },
  footer: {
    fontSize: 7.5,
    marginTop: 20,
    textAlign: 'center',
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 12,
  },
});

const safeNum = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (v: number): string => {
  const abs = Math.abs(v);
  const [int, dec = '00'] = abs.toFixed(2).split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${v < 0 ? '-' : ''}${intFmt},${dec} €`;
};

const fmtDate = (d: string | Date | undefined): string => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
};

const InvoicePdf = ({ invoice }: { invoice: any }) => {
  const btpType: 'standard' | 'situation' | 'autoliquidation' | null =
    invoice.btpInvoiceType ?? null;
  const isAutoliq  = btpType === 'autoliquidation';
  const isSituation = btpType === 'situation';
  const retenueAmount = safeNum(invoice.retenueGarantieAmount);
  const retenueRate   = safeNum(invoice.retenueGarantieRate);

  const lineHT = (invoice.items ?? []).reduce((acc: number, item: any) => {
    return acc + safeNum(item.quantity || 1) * safeNum(item.unitPrice);
  }, 0);

  // For autoliquidation invoices TVA is always 0
  const totalTVA = isAutoliq
    ? 0
    : (invoice.items ?? []).reduce((acc: number, item: any) => {
        const qty  = safeNum(item.quantity || 1);
        const pu   = safeNum(item.unitPrice);
        const rate = safeNum(item.tvaRate || 0);
        return acc + qty * pu * rate;
      }, 0);

  const totalTTC    = lineHT + totalTVA;
  const netAPayer   = totalTTC - retenueAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ────────────────────────────────────────── */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.header}>FACTURE</Text>
            <Text style={styles.headerSubtitle}>
              {isAutoliq   ? 'Autoliquidation TVA — art. 283, 2 nonies CGI'
                : isSituation ? `Facture de situation n° ${invoice.situationNumber ?? '—'}`
                : 'Facture professionnelle'}
            </Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceNumber}>N° {invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Date : {fmtDate(invoice.invoiceDate)}</Text>
            <Text style={styles.invoiceDate}>Échéance : {fmtDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* ── Situation banner ──────────────────────────────── */}
        {isSituation && (
          <View style={styles.situationBanner}>
            <Text style={styles.situationBannerTitle}>Détails de la situation de travaux</Text>
            {invoice.referenceContract && (
              <View style={styles.situationBannerRow}>
                <Text style={styles.situationBannerLabel}>Référence contrat :</Text>
                <Text style={styles.situationBannerValue}>{invoice.referenceContract}</Text>
              </View>
            )}
            <View style={styles.situationBannerRow}>
              <Text style={styles.situationBannerLabel}>N° de situation :</Text>
              <Text style={styles.situationBannerValue}>{invoice.situationNumber ?? '—'}</Text>
            </View>
            {safeNum(invoice.previousCumulativeAmount) > 0 && (
              <View style={styles.situationBannerRow}>
                <Text style={styles.situationBannerLabel}>Cumul précédent :</Text>
                <Text style={styles.situationBannerValue}>
                  {fmt(safeNum(invoice.previousCumulativeAmount))}
                </Text>
              </View>
            )}
            <View style={styles.situationBannerRow}>
              <Text style={styles.situationBannerLabel}>Montant de cette situation :</Text>
              <Text style={styles.situationBannerValue}>{fmt(lineHT)}</Text>
            </View>
          </View>
        )}

        {/* ── Autoliquidation banner ────────────────────────── */}
        {isAutoliq && (
          <View style={styles.autoliqBanner}>
            <Text style={styles.autoliqBannerText}>
              {'TVA autoliquidée par le preneur assujetti — Article 283, 2 nonies du CGI\n'}
              {'(Sous-traitance dans le cadre de travaux de construction pour le compte d\'un donneur d\'ordre assujetti)'}
            </Text>
          </View>
        )}

        {/* ── Parties ───────────────────────────────────────── */}
        <View style={styles.partiesSection}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Émetteur</Text>
            <Text style={styles.partyName}>{invoice.issuerName || '—'}</Text>
            {invoice.issuerAddress     && <Text style={styles.partyText}>Adresse : {invoice.issuerAddress}</Text>}
            {invoice.issuerSiret       && <Text style={styles.partyText}>SIRET : {invoice.issuerSiret}</Text>}
            {invoice.issuerTva         && <Text style={styles.partyText}>N° TVA : {invoice.issuerTva}</Text>}
            {invoice.issuerRcs         && <Text style={styles.partyText}>RCS : {invoice.issuerRcs}</Text>}
            {invoice.issuerLegalStatus && <Text style={styles.partyText}>Statut : {invoice.issuerLegalStatus}</Text>}
            {invoice.issuerShareCapital && <Text style={styles.partyText}>Capital : {invoice.issuerShareCapital}</Text>}
            {invoice.issuerApeCode     && <Text style={styles.partyText}>Code APE : {invoice.issuerApeCode}</Text>}
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Client</Text>
            <Text style={styles.partyName}>
              {invoice.client?.name || invoice.clientName || '—'}
            </Text>
            {(invoice.client?.email || invoice.clientEmail) && (
              <Text style={styles.partyText}>Email : {invoice.client?.email || invoice.clientEmail}</Text>
            )}
            {(invoice.clientAddress || invoice.client?.address) && (
              <Text style={styles.partyText}>Adresse : {invoice.clientAddress || invoice.client?.address}</Text>
            )}
            {(invoice.clientSiret || invoice.client?.siret) && (
              <Text style={styles.partyText}>SIRET : {invoice.clientSiret || invoice.client?.siret}</Text>
            )}
            {(invoice.clientTvaNumber || invoice.client?.tvaNumber) && (
              <Text style={styles.partyText}>N° TVA : {invoice.clientTvaNumber || invoice.client?.tvaNumber}</Text>
            )}
          </View>
        </View>

        {/* ── Line items ────────────────────────────────────── */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Prestations et services</Text>

          <View style={styles.table}>
            {/* Header row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableColHeader, styles.tableColDesc]}>
                <Text style={styles.tableCellHeader}>Description</Text>
              </View>
              <View style={[styles.tableColHeader, styles.tableColQty]}>
                <Text style={styles.tableCellHeader}>Qté</Text>
              </View>
              <View style={[styles.tableColHeader, styles.tableColPrice]}>
                <Text style={styles.tableCellHeader}>PU HT</Text>
              </View>
              <View style={[styles.tableColHeader, styles.tableColTva]}>
                <Text style={styles.tableCellHeader}>TVA</Text>
              </View>
              <View style={[styles.tableColHeader, styles.tableColTotal]}>
                <Text style={styles.tableCellHeader}>Total HT</Text>
              </View>
            </View>

            {/* Data rows */}
            {(invoice.items ?? []).map((item: any, idx: number) => {
              const qty   = safeNum(item.quantity || 1);
              const pu    = safeNum(item.unitPrice);
              const rate  = safeNum(item.tvaRate || 0);
              const total = qty * pu;
              return (
                <View style={styles.tableRow} key={idx}>
                  <View style={[styles.tableCol, styles.tableColDesc]}>
                    <Text style={styles.tableCell}>{item.description || 'Prestation'}</Text>
                  </View>
                  <View style={[styles.tableCol, styles.tableColQty]}>
                    <Text style={styles.tableCellRight}>{item.quantity ?? 1}</Text>
                  </View>
                  <View style={[styles.tableCol, styles.tableColPrice]}>
                    <Text style={styles.tableCellRight}>{fmt(pu)}</Text>
                  </View>
                  <View style={[styles.tableCol, styles.tableColTva]}>
                    {isAutoliq
                      ? <Text style={styles.tableCellMuted}>Autoliq.</Text>
                      : <Text style={styles.tableCellRight}>{(rate * 100).toFixed(0)} %</Text>}
                  </View>
                  <View style={[styles.tableCol, styles.tableColTotal]}>
                    <Text style={styles.tableCellRight}>{fmt(total)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Totals ────────────────────────────────────────── */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT :</Text>
              <Text style={styles.totalAmount}>{fmt(lineHT)}</Text>
            </View>

            {isAutoliq ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA (autoliquidée) :</Text>
                <Text style={[styles.totalAmount, { color: '#b45309' }]}>0,00 €</Text>
              </View>
            ) : (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total TVA :</Text>
                <Text style={styles.totalAmount}>{fmt(totalTVA)}</Text>
              </View>
            )}

            <View style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabelBold}>Total TTC :</Text>
              <Text style={retenueAmount > 0 ? styles.totalAmount : styles.totalAmountFinal}>
                {fmt(totalTTC)}
              </Text>
            </View>

            {retenueAmount > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Retenue de garantie ({retenueRate > 0 ? `${(retenueRate * 100).toFixed(0)} %` : 'forfait'}) :
                  </Text>
                  <Text style={styles.totalAmountDeduction}>- {fmt(retenueAmount)}</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabelBold}>Net à payer :</Text>
                  <Text style={styles.totalAmountFinal}>{fmt(netAPayer)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Bank details ──────────────────────────────────── */}
        {(invoice.issuerIban || invoice.issuerBic) && (
          <View style={styles.bankSection}>
            <Text style={styles.sectionSubTitle}>Coordonnées bancaires</Text>
            {invoice.issuerIban     && <Text style={styles.paymentTermsText}>IBAN : {invoice.issuerIban}</Text>}
            {invoice.issuerBic      && <Text style={styles.paymentTermsText}>BIC : {invoice.issuerBic}</Text>}
            {invoice.issuerBankName && <Text style={styles.paymentTermsText}>Banque : {invoice.issuerBankName}</Text>}
          </View>
        )}

        {/* ── Payment conditions ────────────────────────────── */}
        <View style={styles.paymentTermsSection}>
          <Text style={styles.sectionSubTitle}>Conditions de paiement</Text>
          <Text style={styles.paymentTermsText}>Date d'échéance : {fmtDate(invoice.dueDate)}</Text>
          {invoice.paymentTerms && (
            <Text style={styles.paymentTermsText}>Délai de règlement : {invoice.paymentTerms}</Text>
          )}
          {invoice.latePenaltyRate && (
            <Text style={styles.paymentTermsText}>
              Taux de pénalité de retard : {invoice.latePenaltyRate}
            </Text>
          )}
          {invoice.recoveryIndemnity && safeNum(invoice.recoveryIndemnity) > 0 && (
            <Text style={styles.paymentTermsText}>
              Indemnité forfaitaire de recouvrement : {fmt(safeNum(invoice.recoveryIndemnity))}
            </Text>
          )}
          {retenueAmount > 0 && (
            <Text style={styles.paymentTermsText}>
              Retenue de garantie libérable dans les conditions de l'article 2318 du Code civil.
            </Text>
          )}
        </View>

        {/* ── Legal mentions ────────────────────────────────── */}
        <View style={styles.legalMentionsSection}>
          <Text style={styles.sectionTitle}>Mentions légales</Text>
          <Text style={styles.legalMentionsText}>
            {invoice.legalMentions || [
              'Paiement à réception de facture. Aucun escompte consenti pour paiement anticipé.',
              '',
              "En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal ainsi qu'une indemnité forfaitaire de recouvrement de 40 € seront automatiquement appliquées (art. L441-10 du Code de commerce).",
              '',
              isAutoliq
                ? "Opération soumise à l'autoliquidation de la TVA — le preneur est redevable de la TVA en lieu et place du prestataire (art. 283, 2 nonies du CGI). Facture établie hors TVA."
                : totalTVA === 0
                  ? 'TVA non applicable, art. 293 B du CGI.'
                  : null,
              '',
              'Facture émise en conformité avec la réglementation française de facturation électronique (EN 16931 — Factur-X).',
            ].filter(Boolean).join('\n')}
          </Text>
        </View>

        {/* ── Footer ────────────────────────────────────────── */}
        <Text style={styles.footer}>
          {`Document généré par InvoiceOps — ${invoice.issuerName || ''}${invoice.issuerAddress ? ` — ${invoice.issuerAddress}` : ''}`}
        </Text>

      </Page>
    </Document>
  );
};

export default InvoicePdf;
