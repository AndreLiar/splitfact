export interface FacturxValidationResult {
  valid: boolean;
  errors: string[];
}

async function tryImportFacturxLibrary(): Promise<any | null> {
  try {
    const importer = new Function('moduleName', 'return import(moduleName)');
    return await importer('@stafyniaksacha/facturx');
  } catch {
    return null;
  }
}

export async function validateFacturxXml(xml: string): Promise<FacturxValidationResult> {
  const facturx = await tryImportFacturxLibrary();
  if (facturx?.check) {
    try {
      const result = await facturx.check({
        xml,
        flavor: 'facturx',
        level: 'en16931',
      });

      return {
        valid: Boolean(result?.valid),
        errors: Array.isArray(result?.errors)
          ? result.errors.map((error: any) => String(error?.message || error))
          : [],
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [error?.message || 'Validation Factur-X impossible.'],
      };
    }
  }

  const errors: string[] = [];

  if (!xml.includes("CrossIndustryInvoice")) {
    errors.push("Le XML Factur-X doit contenir une racine CrossIndustryInvoice.");
  }

  if (!xml.includes("<ram:ID>")) {
    errors.push("Le numéro de facture est absent du XML Factur-X.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
