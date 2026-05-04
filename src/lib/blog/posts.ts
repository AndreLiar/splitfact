export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  updatedAt?: string;
  readingMinutes: number;
  tags: string[];
  author: { name: string; url?: string };
}

/**
 * Registry of published blog posts.
 * Add a new entry here AND create `src/app/blog/<slug>/page.tsx` to publish.
 * Order: newest first.
 */
export const posts: BlogPost[] = [
  {
    slug: 'retenue-de-garantie-btp-facturx',
    title: 'Retenue de garantie 5% en BTP : comment l\'encoder dans Factur-X sans rejet Chorus Pro',
    description:
      "La retenue de garantie 5% sur les marchés BTP doit apparaître sur la facture ET dans le XML Factur-X. Guide pratique : règles légales, exemple chiffré, codes EN 16931, libération de la RG et erreurs Chorus Pro à éviter.",
    publishedAt: '2026-05-04',
    readingMinutes: 8,
    tags: ['BTP', 'retenue de garantie', 'Factur-X', 'Chorus Pro', 'EN 16931'],
    author: { name: 'InvoiceOps', url: 'https://invoiceops.fr' },
  },
  {
    slug: 'tva-autoliquidation-btp',
    title: 'TVA autoliquidation BTP : guide complet 2026 (avec exemple Factur-X)',
    description:
      "Comment encoder correctement la TVA autoliquidation sur une facture BTP : règles légales, exemple concret, erreurs Chorus Pro à éviter, code EN 16931 à utiliser dans le XML Factur-X.",
    publishedAt: '2026-04-30',
    readingMinutes: 9,
    tags: ['TVA', 'BTP', 'autoliquidation', 'Factur-X', 'Chorus Pro'],
    author: { name: 'InvoiceOps', url: 'https://invoiceops.fr' },
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
