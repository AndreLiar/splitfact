interface UserProfileForLegalMentions {
  name: string | null;
  fiscalRegime: string | null;
  microEntrepreneurType: "COMMERCANT" | "PRESTATAIRE" | "LIBERAL" | null;
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
    console.log('formatCurrencyRobust - Original value:', value);
    
    // Handle multiple slash patterns
    // Pattern: "8/000,00" -> "8000.00"
    cleanValue = cleanValue.replace(/(\d+)\/(\d{3}),(\d{2})/g, '$1$2.$3');
    // Pattern: "8/000" -> "8000"  
    cleanValue = cleanValue.replace(/(\d+)\/(\d{3})/g, '$1$2');
    // Pattern: "1 8/000,00" -> "18000.00" (space before number with slash)
    cleanValue = cleanValue.replace(/(\d+)\s+(\d+)\/(\d{3}),(\d{2})/g, '$1$2$3.$4');
    // Pattern: "1 8/000" -> "18000"
    cleanValue = cleanValue.replace(/(\d+)\s+(\d+)\/(\d{3})/g, '$1$2$3');
    
    // Convert French decimal comma to dot for parsing
    cleanValue = cleanValue.replace(',', '.');
    // Remove any remaining non-numeric characters except dots and minus
    cleanValue = cleanValue.replace(/[^0-9.-]/g, '');
    
    console.log('formatCurrencyRobust - Cleaned value:', cleanValue);
  }
  
  const numValue = Number(cleanValue || 0);
  if (isNaN(numValue)) {
    console.warn('Invalid currency value:', value, 'cleaned to:', cleanValue);
    return '0,00 €';
  }
  
  const result = formatCurrency(numValue);
  console.log('formatCurrencyRobust - Final result:', result);
  return result;
}
