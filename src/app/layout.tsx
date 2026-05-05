import type { Metadata, Viewport } from "next";
import Script from "next/script";
import ClientShell from "./ClientShell";

const SITE_URL = "https://invoiceops.fr";
const SITE_NAME = "InvoiceOps";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "InvoiceOps — Facturation électronique BTP & Chorus Pro pour micro-entrepreneurs",
    template: "%s — InvoiceOps",
  },
  description:
    "Logiciel de facturation électronique conforme Factur-X pour artisans BTP et micro-entrepreneurs : autoliquidation TVA, retenue de garantie, factures de situation, dépôt Chorus Pro/PPF, e-reporting DGFiP. Préparez la réforme 2026.",
  keywords: [
    "facturation électronique",
    "Factur-X",
    "Chorus Pro",
    "PPF",
    "Portail Public de Facturation",
    "facturation BTP",
    "autoliquidation TVA",
    "retenue de garantie",
    "facture de situation",
    "micro-entrepreneur",
    "artisan BTP",
    "sous-traitance BTP",
    "e-invoicing France",
    "réforme 2026",
    "EN 16931",
    "URSSAF auto-entrepreneur",
    "logiciel facture artisan",
    "PDF/A-3",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
    languages: { "fr-FR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "InvoiceOps — Facturation électronique BTP & Chorus Pro",
    description:
      "Factur-X, dépôt Chorus Pro/PPF et conformité fiscale en un clic pour les artisans BTP sous-traitants. Préparez la réforme française du e-invoicing 2026.",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "InvoiceOps — Facturation électronique conforme",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoiceOps — Facturation électronique BTP & Chorus Pro",
    description:
      "Factur-X, Chorus Pro et e-reporting pour artisans BTP. Conforme à la réforme française 2026.",
    images: ["/icons/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/icons/icon-72x72.png", sizes: "72x72" },
      { url: "/icons/icon-96x96.png", sizes: "96x96" },
      { url: "/icons/icon-128x128.png", sizes: "128x128" },
      { url: "/icons/icon-144x144.png", sizes: "144x144" },
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  other: {
    "msapplication-TileColor": "#D4921A",
    "msapplication-TileImage": "/icons/icon-144x144.png",
    "msapplication-starturl": "/dashboard",
    "msapplication-navbutton-color": "#D4921A",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D4921A",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  description:
    "Logiciel SaaS de facturation électronique conforme Factur-X pour artisans BTP et micro-entrepreneurs en France.",
  areaServed: { "@type": "Country", name: "France" },
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@invoiceops.fr",
    contactType: "customer support",
    availableLanguage: ["French"],
  },
};

const digitalShippingDetails = {
  "@type": "OfferShippingDetails",
  shippingRate: {
    "@type": "MonetaryAmount",
    value: "0",
    currency: "EUR",
  },
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: "FR",
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
  },
};

const noReturnsPolicy = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "FR",
  returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  image: `${SITE_URL}/icons/icon-512x512.png`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "fr-FR",
  description:
    "Plateforme de facturation électronique pour artisans BTP : Factur-X, Chorus Pro, autoliquidation TVA, retenue de garantie, factures de situation, e-reporting DGFiP.",
  offers: [
    {
      "@type": "Offer",
      name: "Plan Gratuit",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
      description: "Jusqu'à 10 factures par mois, clients illimités, lien de paiement Stripe.",
      shippingDetails: digitalShippingDetails,
      hasMerchantReturnPolicy: noReturnsPolicy,
    },
    {
      "@type": "Offer",
      name: "Plan Pro",
      price: "49.00",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
      description:
        "Factures illimitées, Factur-X, dépôt Chorus Pro, e-reporting B2C, extraction IA, validation SIRET INSEE.",
      shippingDetails: digitalShippingDetails,
      hasMerchantReturnPolicy: noReturnsPolicy,
    },
  ],
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <Script id="ld-organization" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(organizationSchema)}
        </Script>
        <Script id="ld-software" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(softwareSchema)}
        </Script>
      </head>
      <body className="antialiased" suppressHydrationWarning={true}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
