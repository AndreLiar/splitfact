export interface Client {
  id: string;
  name: string;
  email?: string | null;
  siret?: string | null;
  siretValidated?: boolean;
  address?: string | null;
  tvaNumber?: string | null;
  legalStatus?: string | null;
  shareCapital?: string | null;
  contactName?: string | null;
  phone?: string | null;
  createdAt?: string;
}

export interface UserProfile {
  name: string | null;
  siret: string | null;
  address: string | null;
  legalStatus: string | null;
  apeCode: string | null;
  tvaNumber: string | null;
  rcsNumber: string | null;
  shareCapital: string | null;
  fiscalRegime: string | null;
  microEntrepreneurType: 'COMMERCANT' | 'PRESTATAIRE' | 'LIBERAL' | string | null;
  declarationFrequency?: string | null;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
}
