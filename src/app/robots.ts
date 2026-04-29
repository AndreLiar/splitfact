import type { MetadataRoute } from "next";

const SITE_URL = "https://invoiceops.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/auth/reset-password",
          "/auth/forgot-password",
          "/invoices/",
          "/payment-success",
          "/offline",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
