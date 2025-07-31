
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register a font to support special characters if needed
// Font.register({ family: 'Roboto', src: '/fonts/Roboto-Regular.ttf' });

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
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
    textTransform: 'uppercase',
  },
  partyText: {
    fontSize: 10,
    marginBottom: 3,
    color: '#4b5563',
  },
  partyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  servicesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#374151',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
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
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  tableCol: {
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableColDesc: { width: '40%' },
  tableColQty: { width: '12%' },
  tableColPrice: { width: '16%' },
  tableColTva: { width: '12%' },
  tableColTotal: { width: '20%' },
  tableCellHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    fontSize: 10,
    color: '#4b5563',
  },
  tableCellRight: {
    fontSize: 10,
    color: '#4b5563',
    textAlign: 'right',
  },
  totalSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalBox: {
    width: '50%',
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
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  totalAmountFinal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  paymentTermsSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  paymentTermsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  paymentTermsText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#4b5563',
    marginBottom: 5,
  },
  legalMentionsSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  legalMentionsText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#6b7280',
  },
  footer: {
    fontSize: 8,
    marginTop: 30,
    textAlign: 'center',
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 15,
  },
});

const InvoicePdf = ({ invoice }: any) => {
  // Custom PDF-safe French currency formatter (bypasses toLocaleString issues)
  const formatCurrency = (value: any) => {
    // Handle null, undefined, empty values
    if (value === null || value === undefined || value === '') {
      return '0,00 €';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.warn('Invalid currency value for PDF:', value);
      return '0,00 €';
    }
    
    // Custom formatting to avoid toLocaleString issues
    const absoluteValue = Math.abs(numValue);
    const [integer, decimal = '00'] = absoluteValue.toFixed(2).split('.');
    
    // Add thousands separators with regular spaces (not non-breaking spaces)
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    // Handle negative numbers
    const sign = numValue < 0 ? '-' : '';
    
    // Use French decimal comma format
    const result = `${sign}${formattedInteger},${decimal} €`;
    
    console.log('InvoicePDF formatCurrency - Input:', value, 'Output:', result);
    return result;
  };

  // Helper function to safely convert any value to number
  const safeToNumber = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    let cleanValue = value;
    if (typeof value === 'string') {
      console.log('InvoicePDF safeToNumber - Original value:', value);
      
      // Handle multiple slash patterns
      // Pattern: "8/000,00" -> "8000.00"
      cleanValue = cleanValue.replace(/(\d+)\/(\d{3}),(\d{2})/g, '$1$2.$3');
      // Pattern: "8/000" -> "8000"  
      cleanValue = cleanValue.replace(/(\d+)\/(\d{3})/g, '$1$2');
      // Pattern: "1 8/000,00" -> "18000.00" (space before number)
      cleanValue = cleanValue.replace(/(\d+)\s+(\d+)\/(\d{3}),(\d{2})/g, '$1$2$3.$4');
      // Pattern: "1 8/000" -> "18000"
      cleanValue = cleanValue.replace(/(\d+)\s+(\d+)\/(\d{3})/g, '$1$2$3');
      
      // Convert French decimal comma to dot for parsing
      cleanValue = cleanValue.replace(',', '.');
      // Remove any remaining non-numeric characters except dots and minus
      cleanValue = cleanValue.replace(/[^0-9.-]/g, '');
      
      console.log('InvoicePDF safeToNumber - Cleaned value:', cleanValue);
    }
    
    const numValue = Number(cleanValue || 0);
    const result = isNaN(numValue) ? 0 : numValue;
    console.log('InvoicePDF safeToNumber - Final result:', result);
    return result;
  };

  const totalTVA = invoice.items?.reduce((acc: number, item: any) => {
    const quantity = safeToNumber(item.quantity || 1);
    const unitPrice = safeToNumber(item.unitPrice);
    const tvaRate = safeToNumber(item.tvaRate || 0);
    const itemTotal = quantity * unitPrice;
    return acc + itemTotal * tvaRate;
  }, 0) || 0;

  const totalHT = safeToNumber(invoice.totalAmount);
  const totalTTC = totalHT + totalTVA;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Invoice Title and Details */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.header}>FACTURE</Text>
            <Text style={styles.invoiceDate}>
              {invoice.collective ? 'Facture collaborative' : 'Facture professionnelle'}
            </Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceNumber}>N° {invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Date : {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={styles.invoiceDate}>
              Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
            </Text>
            {invoice.collective && (
              <Text style={styles.invoiceDate}>
                Collectif : {invoice.collective.name}
              </Text>
            )}
          </View>
        </View>

        {/* Parties Section */}
        <View style={styles.partiesSection}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Émetteur</Text>
            <Text style={styles.partyName}>{invoice.issuerName || 'Non fourni'}</Text>
            {invoice.issuerAddress && <Text style={styles.partyText}>Adresse : {invoice.issuerAddress}</Text>}
            {invoice.issuerSiret && <Text style={styles.partyText}>SIRET : {invoice.issuerSiret}</Text>}
            {invoice.issuerTva && <Text style={styles.partyText}>N° TVA : {invoice.issuerTva}</Text>}
            {invoice.issuerRcs && <Text style={styles.partyText}>RCS : {invoice.issuerRcs}</Text>}
            {invoice.issuerLegalStatus && <Text style={styles.partyText}>Statut : {invoice.issuerLegalStatus}</Text>}
            {invoice.issuerShareCapital && <Text style={styles.partyText}>Capital : {invoice.issuerShareCapital}</Text>}
            {invoice.issuerApeCode && <Text style={styles.partyText}>Code APE : {invoice.issuerApeCode}</Text>}
          </View>
          
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Client</Text>
            <Text style={styles.partyName}>
              {invoice.client?.name || invoice.clientName || 'Non fourni'}
            </Text>
            {(invoice.client?.email || invoice.clientEmail) && (
              <Text style={styles.partyText}>Email : {invoice.client?.email || invoice.clientEmail}</Text>
            )}
            {invoice.clientAddress && <Text style={styles.partyText}>Adresse : {invoice.clientAddress}</Text>}
            {invoice.clientSiret && <Text style={styles.partyText}>SIRET : {invoice.clientSiret}</Text>}
            {invoice.clientTvaNumber && <Text style={styles.partyText}>N° TVA : {invoice.clientTvaNumber}</Text>}
            {invoice.clientLegalStatus && <Text style={styles.partyText}>Statut : {invoice.clientLegalStatus}</Text>}
            {invoice.clientShareCapital && <Text style={styles.partyText}>Capital : {invoice.clientShareCapital}</Text>}
            {invoice.clientContactName && <Text style={styles.partyText}>Contact : {invoice.clientContactName}</Text>}
            {invoice.clientPhone && <Text style={styles.partyText}>Téléphone : {invoice.clientPhone}</Text>}
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Prestations et services</Text>
          
          <View style={styles.table}>
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
            
            {invoice.items?.map((item: any, index: number) => (
              <View style={styles.tableRow} key={index}>
                <View style={[styles.tableCol, styles.tableColDesc]}>
                  <Text style={styles.tableCell}>{item.description || 'Service'}</Text>
                </View>
                <View style={[styles.tableCol, styles.tableColQty]}>
                  <Text style={styles.tableCellRight}>{item.quantity || 1}</Text>
                </View>
                <View style={[styles.tableCol, styles.tableColPrice]}>
                  <Text style={styles.tableCellRight}>
                    {formatCurrency(safeToNumber(item.unitPrice))}
                  </Text>
                </View>
                <View style={[styles.tableCol, styles.tableColTva]}>
                  <Text style={styles.tableCellRight}>
                    {(safeToNumber(item.tvaRate || 0) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={[styles.tableCol, styles.tableColTotal]}>
                  <Text style={styles.tableCellRight}>
                    {formatCurrency(safeToNumber(item.quantity || 1) * safeToNumber(item.unitPrice))}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT :</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(totalHT)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total TVA :</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(totalTVA)}
              </Text>
            </View>
            <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#2563eb', paddingTop: 8 }]}>
              <Text style={styles.totalLabel}>Total TTC :</Text>
              <Text style={styles.totalAmountFinal}>
                {formatCurrency(totalTTC)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Terms Section */}
        <View style={styles.paymentTermsSection}>
          <Text style={styles.paymentTermsTitle}>Conditions de paiement</Text>
          <Text style={styles.paymentTermsText}>
            Date d'échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
          </Text>
          {invoice.paymentTerms && (
            <Text style={styles.paymentTermsText}>
              Délai de règlement : {invoice.paymentTerms}
            </Text>
          )}
          {invoice.latePenaltyRate && (
            <Text style={styles.paymentTermsText}>
              Taux de pénalité de retard : {invoice.latePenaltyRate}
            </Text>
          )}
          {invoice.recoveryIndemnity && (
            <Text style={styles.paymentTermsText}>
              Indemnité forfaitaire de recouvrement : {formatCurrency(invoice.recoveryIndemnity)}
            </Text>
          )}
        </View>

        {/* Legal Mentions Section */}
        <View style={styles.legalMentionsSection}>
          <Text style={styles.sectionTitle}>Mentions légales</Text>
          <Text style={styles.legalMentionsText}>
            {invoice.legalMentions || 
            `Paiement à réception de facture. Aucun escompte consenti pour paiement anticipé.
            
En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal ainsi qu'une indemnité forfaitaire de recouvrement de 40€ seront automatiquement appliquées.

Facture émise conformément à la réglementation française en vigueur.`}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré par Splitfact - Plateforme de facturation professionnelle
          {'\n'}
          {invoice.issuerName} - {invoice.issuerAddress || 'Adresse non fournie'}
        </Text>
      </Page>
    </Document>
  );
};

export default InvoicePdf;
