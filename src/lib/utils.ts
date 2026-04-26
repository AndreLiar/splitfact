interface UserProfileForLegalMentions {
  name: string | null;
  fiscalRegime: string | null;
  microEntrepreneurType: string | null;
  siret: string | null;
  address: string | null;
  legalStatus: string | null;
  rcsNumber: string | null;
  shareCapital: string | null;
  apeCode: string | null;
}

export function getLegalMentionsByFiscalRegime(user: UserProfileForLegalMentions): string {
  let mentions = [];

  // Mandatory TVA mention for all Micro-Entrepreneurs (always applicable)
  mentions.push('TVA non applicable, article 293 B du CGI');

  // Add general legal mentions based on user profile
  if (user.name) mentions.push(`Entrepreneur Individuel: ${user.name}`);
  if (user.address) mentions.push(`Adresse: ${user.address}`);
  if (user.siret) mentions.push(`SIRET: ${user.siret}`);
  if (user.apeCode) mentions.push(`Code APE: ${user.apeCode}`);

  // Add activity type for clarity
  if (user.microEntrepreneurType) {
    let activityTypeDisplay = "";
    switch (user.microEntrepreneurType) {
      case "COMMERCANT":
        activityTypeDisplay = "Activité commerciale";
        break;
      case "PRESTATAIRE":
        activityTypeDisplay = "Prestation de services (BIC)";
        break;
      case "LIBERAL":
        activityTypeDisplay = "Activité libérale (BNC)";
        break;
    }
    if (activityTypeDisplay) mentions.push(`Type d'activité: ${activityTypeDisplay}`);
  }

  return mentions.join('\n');
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  // Replace non-breaking space (U+00A0) with regular space for better compatibility
  return formatted.replace(/\u00A0/g, ' ');
}

export function formatCurrencyRobust(value: any): string {
  // Handle null, undefined, empty values
  if (value === null || value === undefined || value === '') {
    return '0,00 €';
  }

  // Clean any potential malformed string values
  let cleanValue = value;
  if (typeof value === 'string') {
    cleanValue = cleanValue.replace(/(\d+)\/(\d{3}),(\d{2})/g, '$1$2.$3');
    cleanValue = cleanValue.replace(/(\d+)\/(\d{3})/g, '$1$2');
    cleanValue = cleanValue.replace(/(\d+)\s+(\d+)\/(\d{3}),(\d{2})/g, '$1$2$3.$4');
    cleanValue = cleanValue.replace(/(\d+)\s+(\d+)\/(\d{3})/g, '$1$2$3');
    cleanValue = cleanValue.replace(',', '.');
    cleanValue = cleanValue.replace(/[^0-9.-]/g, '');
  }

  const numValue = Number(cleanValue || 0);
  if (isNaN(numValue)) return '0,00 €';

  return formatCurrency(numValue);
}
