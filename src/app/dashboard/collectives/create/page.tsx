'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateCollectivePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (status === 'loading') {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/collectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create collective');
      }

      setSuccess('Collectif créé avec succès!');
      setName(''); // Clear form
      router.push('/dashboard/collectives'); // Redirect to collectives list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Créer un nouveau Collectif</h1>
      <div className="card shadow-sm p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="collectiveName" className="form-label">Nom du Collectif</label>
            <input
              type="text"
              className="form-control"
              id="collectiveName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Création...' : 'Créer le Collectif'}
          </button>
          <Link href="/dashboard/collectives" className="btn btn-secondary ms-2">Annuler</Link>
        </form>
      </div>
    </div>
  );
}
