import NextAuth from "next-auth";
import { FiscalRegime, MicroEntrepreneurType, DeclarationFrequency } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      fiscalRegime?: FiscalRegime | null;
      siret?: string | null;
      tvaNumber?: string | null;
      address?: string | null;
      legalStatus?: string | null;
      rcsNumber?: string | null;
      shareCapital?: string | null;
      apeCode?: string | null;
      stripeAccountId?: string | null;
      microEntrepreneurType?: MicroEntrepreneurType | null;
      declarationFrequency?: DeclarationFrequency | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    fiscalRegime?: FiscalRegime | null;
    siret?: string | null;
    tvaNumber?: string | null;
    address?: string | null;
    legalStatus?: string | null;
    rcsNumber?: string | null;
    shareCapital?: string | null;
    apeCode?: string | null;
    stripeAccountId?: string | null;
    microEntrepreneurType?: MicroEntrepreneurType | null;
    declarationFrequency?: DeclarationFrequency | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    fiscalRegime?: FiscalRegime | null;
    siret?: string | null;
    tvaNumber?: string | null;
    address?: string | null;
    legalStatus?: string | null;
    rcsNumber?: string | null;
    shareCapital?: string | null;
    apeCode?: string | null;
    stripeAccountId?: string | null;
    microEntrepreneurType?: MicroEntrepreneurType | null;
    declarationFrequency?: DeclarationFrequency | null;
  }
}
