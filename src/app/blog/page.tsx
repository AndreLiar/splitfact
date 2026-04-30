import type { Metadata } from 'next';
import Link from 'next/link';
import { posts } from '@/lib/blog/posts';

export const metadata: Metadata = {
  title: 'Blog — Guides facturation BTP & Chorus Pro',
  description:
    "Articles pratiques sur la facturation électronique BTP : Factur-X, autoliquidation TVA, retenue de garantie, factures de situation, dépôt Chorus Pro et conformité réforme 2026.",
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog InvoiceOps — Guides facturation BTP & Chorus Pro',
    description:
      "Tout ce qu'il faut savoir pour facturer en BTP sans rejets Chorus Pro.",
    url: '/blog',
    type: 'website',
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogIndex() {
  return (
    <div className="container py-5" style={{ maxWidth: 880 }}>
      <header className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-3">Blog InvoiceOps</h1>
        <p className="lead text-muted">
          Guides pratiques sur la facturation électronique BTP, Chorus Pro, et la réforme française 2026.
        </p>
      </header>

      <div className="d-grid gap-4">
        {posts.map((post) => (
          <article key={post.slug} className="card border-0 shadow-sm rounded-xl p-4">
            <div className="d-flex flex-wrap gap-2 mb-2">
              {post.tags.slice(0, 3).map((t) => (
                <span key={t} className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.7rem' }}>
                  {t}
                </span>
              ))}
            </div>
            <h2 className="h4 mb-2">
              <Link href={`/blog/${post.slug}`} className="text-decoration-none text-dark">
                {post.title}
              </Link>
            </h2>
            <p className="text-muted mb-3">{post.description}</p>
            <div className="d-flex align-items-center justify-content-between">
              <small className="text-muted">
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                {' · '}
                {post.readingMinutes} min de lecture
              </small>
              <Link href={`/blog/${post.slug}`} className="btn btn-sm btn-outline-primary">
                Lire l'article →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
