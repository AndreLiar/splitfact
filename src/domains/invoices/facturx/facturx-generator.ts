import { buildFacturxXml, type FacturxInvoiceInput } from "./invoice-to-cii";
import { validateFacturxXml } from "./facturx-validator";

export interface FacturxGenerationSuccess {
  success: true;
  xmlFilename: "factur-x.xml";
  xml: string;
  pdf: Buffer;
  validationErrors: string[];
}

export interface FacturxGenerationFailure {
  success: false;
  xmlFilename: "factur-x.xml";
  xml: string;
  pdf: Buffer | null;
  validationErrors: string[];
}

export type FacturxGenerationResult = FacturxGenerationSuccess | FacturxGenerationFailure;

async function tryImportFacturxLibrary(): Promise<any | null> {
  try {
    const importer = new Function('moduleName', 'return import(moduleName)');
    return await importer('@stafyniaksacha/facturx');
  } catch {
    return null;
  }
}

export async function generateFacturxDocument(
  invoice: FacturxInvoiceInput,
  pdf: Buffer
): Promise<FacturxGenerationResult> {
  const xml = buildFacturxXml(invoice);
  const validation = await validateFacturxXml(xml);

  if (!validation.valid) {
    return {
      success: false,
      xmlFilename: "factur-x.xml",
      xml,
      pdf: null,
      validationErrors: validation.errors,
    };
  }

  const facturx = await tryImportFacturxLibrary();
  if (facturx?.generate) {
    try {
      const generatedPdf = await facturx.generate({
        pdf,
        xml,
        check: true,
        flavor: 'facturx',
        level: 'en16931',
        language: 'fr-FR',
        meta: {
          author: invoice.seller.name,
          title: invoice.invoiceNumber,
          subject: `Facture ${invoice.invoiceNumber}`,
          keywords: ['Factur-X', 'EN16931', invoice.invoiceNumber],
          date: new Date(invoice.invoiceDate),
        },
      });

      return {
        success: true,
        xmlFilename: "factur-x.xml",
        xml,
        pdf: Buffer.isBuffer(generatedPdf) ? generatedPdf : Buffer.from(generatedPdf),
        validationErrors: [],
      };
    } catch (error: any) {
      return {
        success: false,
        xmlFilename: "factur-x.xml",
        xml,
        pdf: null,
        validationErrors: [error?.message || 'La génération Factur-X a échoué.'],
      };
    }
  }

  return {
    success: true,
    xmlFilename: "factur-x.xml",
    xml,
    pdf,
    validationErrors: [],
  };
}
