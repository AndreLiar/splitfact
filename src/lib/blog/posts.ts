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
