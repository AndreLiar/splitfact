import Link from 'next/link';
import Script from 'next/script';
import type { BlogPost } from '@/lib/blog/posts';

const SITE_URL = 'https://invoiceops.fr';

interface Props {
  post: BlogPost;
  children: React.ReactNode;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogArticleLayout({ post, children }: Props) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: 'fr-FR',
    keywords: post.tags.join(', '),
    author: {
      '@type': 'Organization',
      name: post.author.name,
      url: post.author.url ?? SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'InvoiceOps',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512x512.png` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <>
      <Script id={`ld-article-${post.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleSchema)}
      </Script>

      <article className="container py-5" style={{ maxWidth: 760 }}>
        <nav aria-label="Fil d'Ariane" className="mb-4">
          <Link href="/blog" className="text-decoration-none small text-muted">
            ← Tous les articles
          </Link>
        </nav>

        <header className="mb-5">
          <div className="d-flex flex-wrap gap-2 mb-3">
            {post.tags.map((t) => (
              <span key={t} className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.7rem' }}>
                {t}
              </span>
            ))}
          </div>
          <h1 className="display-6 fw-bold mb-3" style={{ lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <p className="lead text-muted mb-3" style={{ fontSize: '1.125rem' }}>
            {post.description}
          </p>
          <div className="text-muted small">
            <time dateTime={post.publishedAt}>Publié le {formatDate(post.publishedAt)}</time>
            {' · '}
            {post.readingMinutes} min de lecture
            {post.updatedAt && (
              <>
                {' · '}
                <time dateTime={post.updatedAt}>Mis à jour le {formatDate(post.updatedAt)}</time>
              </>
            )}
          </div>
        </header>

        <div className="blog-prose" style={{ fontSize: '1.0625rem', lineHeight: 1.75, color: '#1a1a1a' }}>
          {children}
        </div>

        <aside className="card border-0 shadow-sm mt-5 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #fef3e2 0%, #fff 100%)' }}>
          <h3 className="h5 fw-bold mb-2">
            <i className="bi bi-lightning-fill text-primary me-2"></i>
            Automatisez tout cela avec InvoiceOps
          </h3>
          <p className="mb-3 text-muted">
            InvoiceOps détecte automatiquement les cas d'autoliquidation, encode correctement le code EN 16931, et dépose votre Factur-X sur Chorus Pro sans rejet. Plan gratuit jusqu'à 10 factures/mois.
          </p>
          <Link href="/auth/register" className="btn btn-primary">
            Créer un compte gratuit →
          </Link>
        </aside>
      </article>
    </>
  );
}
