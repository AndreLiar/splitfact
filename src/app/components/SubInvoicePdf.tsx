import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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
    display: 'table' as any,
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
    width: '50%',
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  tableCol: {
    width: '50%',
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    fontSize: 10,
    color: '#4b5563',
  },
  totalSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalBox: {
    width: '40%',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 3,
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

const SubInvoicePdf = ({ subInvoice }: any) => {
  // Generate a professional sub-invoice number
  const subInvoiceNumber = `SF-${new Date(subInvoice.createdAt).getFullYear()}-${subInvoice.id.substring(0, 8).toUpperCase()}`;
  
  // Custom PDF-safe French currency formatter (bypasses toLocaleString issues)
  const formatCurrency = (value: any) => {
    // Handle null, undefined, empty values
    if (value === null || value === undefined || value === '') {
      return '0,00 €';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.warn('Invalid currency value for SubInvoice PDF:', value);
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
    
    console.log('SubInvoicePDF formatCurrency - Input:', value, 'Output:', result);
    return result;
  };

  // Helper function to safely convert any value to number
  const safeToNumber = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    let cleanValue = value;
    if (typeof value === 'string') {
      console.log('SubInvoicePDF safeToNumber - Original value:', value);
      
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
      
      console.log('SubInvoicePDF safeToNumber - Cleaned value:', cleanValue);
    }
    
    const numValue = Number(cleanValue || 0);
    const result = isNaN(numValue) ? 0 : numValue;
    console.log('SubInvoicePDF safeToNumber - Final result:', result);
    return result;
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Invoice Title and Details */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.header}>FACTURE</Text>
            <Text style={styles.invoiceDate}>Sous-facture collaborative</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceNumber}>N° {subInvoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Date : {new Date(subInvoice.createdAt).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={styles.invoiceDate}>
              Projet : {subInvoice.parentInvoice?.collective?.name || 'Collectif'}
            </Text>
          </View>
        </View>

        {/* Parties Section */}
        <View style={styles.partiesSection}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Prestataire</Text>
            <Text style={styles.partyName}>{subInvoice.issuer?.name || 'Non fourni'}</Text>
            <Text style={styles.partyText}>Email : {subInvoice.issuer?.email || 'Non fourni'}</Text>
            <Text style={styles.partyText}>Statut : Micro-entrepreneur</Text>
          </View>
          
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Client</Text>
            <Text style={styles.partyName}>{subInvoice.receiver?.name || 'Non fourni'}</Text>
            <Text style={styles.partyText}>Email : {subInvoice.receiver?.email || 'Non fourni'}</Text>
            <Text style={styles.partyText}>Type : Collaborateur</Text>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Prestations réalisées</Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Description</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Montant HT</Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {subInvoice.description || 'Prestation dans le cadre du projet collaboratif'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {formatCurrency(safeToNumber(subInvoice.amount))}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT :</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(safeToNumber(subInvoice.amount))}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA (franchise) :</Text>
              <Text style={styles.totalAmount}>0,00 €</Text>
            </View>
            <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#2563eb', paddingTop: 8 }]}>
              <Text style={styles.totalLabel}>Total TTC :</Text>
              <Text style={[styles.totalAmount, { fontSize: 18 }]}>
                {formatCurrency(safeToNumber(subInvoice.amount))}
              </Text>
            </View>
          </View>
        </View>

        {/* Legal Mentions Section */}
        <View style={styles.legalMentionsSection}>
          <Text style={styles.sectionTitle}>Mentions légales</Text>
          <Text style={styles.legalMentionsText}>
            En qualité de micro-entrepreneur, et conformément à l'article 293 B du CGI, cette facture n'est pas soumise à la TVA. 
            {'\n\n'}
            Paiement à réception de facture. Aucun escompte consenti pour paiement anticipé.
            {'\n\n'}
            En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal ainsi qu'une indemnité forfaitaire de recouvrement de 40€ seront automatiquement appliquées.
            {'\n\n'}
            Référence projet : {subInvoice.parentInvoice?.invoiceNumber || 'N/A'}
            {'\n'}
            Facture parent : {subInvoice.parentInvoice?.collective?.name || 'Projet collaboratif'}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré par Splitfact - Plateforme de facturation collaborative
          {'\n'}
          Sous-facture émise dans le cadre d'un projet collaboratif
        </Text>
      </Page>
    </Document>
  );
};

export default SubInvoicePdf;
