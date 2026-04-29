import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fonctionnalités : Factur-X, Chorus Pro, e-reporting BTP",
  description:
    "Toutes les fonctionnalités d'InvoiceOps pour artisans BTP : génération Factur-X (PDF/A-3 + XML EN 16931), dépôt Chorus Pro/PPF, e-reporting B2C, validation SIRET, autoliquidation TVA, retenue de garantie, factures de situation.",
  alternates: { canonical: "/fonctionnalites" },
  openGraph: {
    title: "Fonctionnalités InvoiceOps — Factur-X, Chorus Pro, e-reporting",
    description:
      "Liste complète des fonctionnalités pour la facturation électronique BTP conforme à la réforme française 2026.",
    url: "/fonctionnalites",
    type: "article",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
