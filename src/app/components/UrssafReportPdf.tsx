import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register a font if you need custom fonts (e.g., for accents or specific styles)
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica', // Default font
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  boldText: {
    fontSize: 12,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  table: {
    display: 'table' as any,
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderColor: '#bfbfbf',
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5,
  },
});

interface UrssafReportData {
  period: string;
  user: {
    name: string;
    siret: string;
    fiscalRegime: string;
    microEntrepreneurType: string;
  };
  caTotal: number;
  tauxUrssaf: number;
  cotisations: number;
  tauxImpôt: number;
  impotRevenu: number;
  revenuNet: number;
  tvaApplicable: boolean;
  alerte: string;
  message: string;
}

interface UrssafReportPdfProps {
  data: UrssafReportData;
}

const UrssafReportPdf: React.FC<UrssafReportPdfProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Rapport URSSAF Micro-Entrepreneur</Text>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Informations Générales</Text>
        <Text style={styles.text}>Période: {data.period}</Text>
        <Text style={styles.text}>Nom: {data.user.name}</Text>
        <Text style={styles.text}>SIRET: {data.user.siret}</Text>
        <Text style={styles.text}>Type d'activité: {data.user.microEntrepreneurType}</Text>
        <Text style={styles.text}>Régime fiscal: {data.user.fiscalRegime}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Synthèse Financière</Text>
        <Text style={styles.text}>Chiffre d'affaires déclaré (HT): {data.caTotal.toFixed(2)} €</Text>
        <Text style={styles.text}>Taux URSSAF: {data.tauxUrssaf}%</Text>
        <Text style={styles.text}>Cotisations sociales: {data.cotisations.toFixed(2)} €</Text>
        <Text style={styles.text}>Taux impôt (libératoire): {data.tauxImpôt}%</Text>
        <Text style={styles.text}>Impôt sur le revenu: {data.impotRevenu.toFixed(2)} €</Text>
        <Text style={styles.boldText}>Revenu net estimé: {data.revenuNet.toFixed(2)} €</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Statut TVA</Text>
        <Text style={styles.text}>TVA applicable ? {data.tvaApplicable ? 'Oui' : 'Non'}</Text>
        <Text style={styles.text}>Alerte: {data.alerte}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Message URSSAF</Text>
        <Text style={styles.text}>{data.message}</Text>
      </View>

      <Text style={styles.text}>*Ce rapport est une estimation et ne remplace pas votre déclaration officielle sur autoentrepreneur.urssaf.fr.</Text>
    </Page>
  </Document>
);

export default UrssafReportPdf;