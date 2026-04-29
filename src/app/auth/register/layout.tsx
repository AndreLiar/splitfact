import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte gratuit",
  description:
    "Inscrivez-vous gratuitement sur InvoiceOps. 10 factures par mois offertes, conformité Factur-X et Chorus Pro incluses.",
  alternates: { canonical: "/auth/register" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
