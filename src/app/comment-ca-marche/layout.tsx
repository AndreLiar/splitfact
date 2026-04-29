import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comment ça marche : facturation électronique BTP en 4 étapes",
  description:
    "Découvrez comment InvoiceOps automatise la facturation Factur-X, le dépôt Chorus Pro et la conformité BTP en 4 étapes simples : création, validation, génération PDF/A-3, dépôt PPF.",
  alternates: { canonical: "/comment-ca-marche" },
  openGraph: {
    title: "Comment ça marche — InvoiceOps",
    description:
      "4 étapes pour émettre une facture conforme Factur-X et la déposer sur Chorus Pro sans rejet.",
    url: "/comment-ca-marche",
    type: "article",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
