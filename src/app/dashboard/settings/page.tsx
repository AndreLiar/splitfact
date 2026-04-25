'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UserProfile {
  name: string;
  siret: string;
  address: string;
  fiscalRegime: string;
  microEntrepreneurType: string;
  declarationFrequency: string;
  tvaNumber: string;
  legalStatus: string;
  apeCode: string;
  rcsNumber: string;
  shareCapital: string;
}

const COMPANY_STATUSES = ['SASU', 'EURL', 'SARL', 'SAS', 'EI', 'Micro-entreprise', 'Autre'];

function SettingsPageInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<UserProfile>({
    name: '', siret: '', address: '', fiscalRegime: '', microEntrepreneurType: '',
    declarationFrequency: '', tvaNumber: '', legalStatus: '', apeCode: '',
    rcsNumber: '', shareCapital: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [siretLookup, setSiretLookup] = useState<{ loading: boolean; result: string | null; error: string | null }>({ loading: false, result: null, error: null });

  const [subscription, setSubscription] = useState<{ planId: string; subscriptionStatus: string; subscriptionPeriodEnd: string | null } | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  // Chorus Pro / PISTE credentials
  const [pisteForm, setPisteForm] = useState({
    pisteEnv: 'sandbox',
    pisteClientId: '',
    pisteClientSecret: '',
    cproTechLogin: '',
    cproTechPassword: '',
  });
  const [pisteStatus, setPisteStatus] = useState({ pisteClientSecretSet: false, cproTechPasswordSet: false });
  const [pisteSaving, setPisteSaving] = useState(false);
  const [pisteTesting, setPisteTesting] = useState(false);
  const [pisteMessage, setPisteMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchProfile();
      fetchPisteCredentials();
      fetchSubscription();
    }
  }, [status, router]);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/billing/subscription');
      if (res.ok) setSubscription(await res.json());
    } catch { /* ignore */ }
  };

  const handleUpgrade = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchPisteCredentials = async () => {
    try {
      const res = await fetch('/api/settings/piste-credentials');
      if (res.ok) {
        const data = await res.json();
        setPisteForm((f) => ({ ...f, pisteEnv: data.pisteEnv ?? 'sandbox', pisteClientId: data.pisteClientId ?? '', cproTechLogin: data.cproTechLogin ?? '' }));
        setPisteStatus({ pisteClientSecretSet: data.pisteClientSecretSet, cproTechPasswordSet: data.cproTechPasswordSet });
      }
    } catch { /* ignore */ }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name ?? '',
          siret: data.siret ?? '',
          address: data.address ?? '',
          fiscalRegime: data.fiscalRegime ?? '',
          microEntrepreneurType: data.microEntrepreneurType ?? '',
          declarationFrequency: data.declarationFrequency ?? '',
          tvaNumber: data.tvaNumber ?? '',
          legalStatus: data.legalStatus ?? '',
          apeCode: data.apeCode ?? '',
          rcsNumber: data.rcsNumber ?? '',
          shareCapital: data.shareCapital ?? '',
        });
        setStripeAccountId(data.stripeAccountId ?? null);
      }
    } catch {
      // silently ignore fetch error — form will be empty
    } finally {
      setProfileLoading(false);
    }
  };

  const handleStripeConnect = async () => {
    setStripeConnecting(true);
    try {
      const res = await fetch('/api/stripe/onboard', { method: 'POST' });
      if (!res.ok) throw new Error('Impossible de démarrer la connexion Stripe.');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
      setStripeConnecting(false);
    }
  };

  const stripeReturnSuccess = searchParams.get('stripe_onboard') === 'success';

  const handleVerifySiret = useCallback(async () => {
    if (!profile.siret || profile.siret.length !== 14) return;
    setSiretLookup({ loading: true, result: null, error: null });
    try {
      const res = await fetch(`/api/siret?siret=${profile.siret}`);
      const data = await res.json();
      if (data.valid && data.companyName) {
        setSiretLookup({ loading: false, result: data.companyName, error: null });
        setProfile((p) => ({ ...p, name: p.name || data.companyName, address: p.address || data.address || '' }));
      } else {
        setSiretLookup({ loading: false, result: null, error: data.error ?? 'SIRET introuvable dans SIRENE' });
      }
    } catch {
      setSiretLookup({ loading: false, result: null, error: 'Erreur de vérification SIRENE' });
    }
  }, [profile.siret]);

  const handlePisteSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPisteSaving(true);
    setPisteMessage(null);
    try {
      const res = await fetch('/api/settings/piste-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pisteForm),
      });
      if (res.ok) {
        setPisteMessage({ type: 'success', text: 'Credentials sauvegardés.' });
        await fetchPisteCredentials();
        setPisteForm((f) => ({ ...f, pisteClientSecret: '', cproTechPassword: '' }));
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setPisteMessage({ type: 'error', text: body.error ?? 'Erreur lors de la sauvegarde.' });
      }
    } catch {
      setPisteMessage({ type: 'error', text: 'Erreur réseau — vérifiez votre connexion.' });
    } finally {
      setPisteSaving(false);
    }
  };

  const handlePisteTest = async () => {
    setPisteTesting(true);
    setPisteMessage({ type: 'info', text: 'Test en cours…' });
    try {
      const body = pisteForm.pisteClientSecret || pisteForm.cproTechPassword
        ? pisteForm
        : { useSaved: true };
      const res = await fetch('/api/settings/test-piste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({ ok: false, error: 'Réponse invalide du serveur.' })) as { ok: boolean; error?: string };
      setPisteMessage(data.ok
        ? { type: 'success', text: 'Connexion PISTE réussie — credentials valides.' }
        : { type: 'error', text: data.error ?? 'Connexion échouée.' });
    } catch {
      setPisteMessage({ type: 'error', text: 'Erreur réseau — vérifiez votre connexion.' });
    } finally {
      setPisteTesting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileErrors({});
    setProfileMessage(null);

    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      setProfileMessage({ type: 'success', text: 'Profil enregistré.' });
    } else {
      const body = await res.json().catch(() => ({}));
      if (body.errors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(body.errors as any)) {
          if (k !== '_errors' && (v as any)._errors?.length) {
            flat[k] = (v as any)._errors[0];
          }
        }
        setProfileErrors(flat);
        setProfileMessage({ type: 'error', text: 'Veuillez corriger les erreurs ci-dessous.' });
      } else {
        setProfileMessage({ type: 'error', text: body.error ?? 'Erreur lors de la sauvegarde.' });
      }
    }
    setProfileSaving(false);
  };

  const field = (key: keyof UserProfile) => ({
    value: profile[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setProfile((p) => ({ ...p, [key]: e.target.value })),
  });

  const isCompany = ['SASU', 'EURL', 'SARL', 'SAS'].includes(profile.legalStatus);

  if (status === 'loading' || profileLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <h1 className="h3 mb-4">
            <i className="bi bi-gear-fill me-2 text-primary"></i>
            Paramètres
          </h1>

          {/* ── Issuer Profile ────────────────────────────────── */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-building me-2 text-primary"></i>
                Profil émetteur
              </h5>
              <small className="text-muted">Ces informations apparaissent automatiquement sur vos factures.</small>
            </div>
            <div className="card-body">
              {profileMessage && (
                <div className={`alert alert-${profileMessage.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
                  {profileMessage.text}
                  <button type="button" className="btn-close" onClick={() => setProfileMessage(null)}></button>
                </div>
              )}

              <form onSubmit={handleProfileSave}>
                <div className="row g-3">
                  {/* Name */}
                  <div className="col-12">
                    <label className="form-label fw-medium">Nom / Raison sociale <span className="text-danger">*</span></label>
                    <input className={`form-control ${profileErrors.name ? 'is-invalid' : ''}`} {...field('name')} placeholder="Jean Dupont ou Dupont Conseil" />
                    {profileErrors.name && <div className="invalid-feedback">{profileErrors.name}</div>}
                  </div>

                  {/* SIRET */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">SIRET <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input className={`form-control font-monospace ${profileErrors.siret ? 'is-invalid' : ''}`} {...field('siret')} placeholder="12345678900012" maxLength={14} />
                      <button type="button" className="btn btn-outline-secondary" onClick={handleVerifySiret} disabled={siretLookup.loading || profile.siret.length !== 14} title="Vérifier dans SIRENE">
                        {siretLookup.loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search" />}
                      </button>
                      {profileErrors.siret && <div className="invalid-feedback">{profileErrors.siret}</div>}
                    </div>
                    {siretLookup.result && <small className="text-success"><i className="bi bi-check-circle me-1" />{siretLookup.result}</small>}
                    {siretLookup.error && <small className="text-danger"><i className="bi bi-x-circle me-1" />{siretLookup.error}</small>}
                  </div>

                  {/* APE Code */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Code APE <span className="text-danger">*</span></label>
                    <input className={`form-control font-monospace ${profileErrors.apeCode ? 'is-invalid' : ''}`} {...field('apeCode')} placeholder="6202A" maxLength={5} />
                    {profileErrors.apeCode && <div className="invalid-feedback">{profileErrors.apeCode}</div>}
                  </div>

                  {/* Address */}
                  <div className="col-12">
                    <label className="form-label fw-medium">Adresse professionnelle <span className="text-danger">*</span></label>
                    <textarea className={`form-control ${profileErrors.address ? 'is-invalid' : ''}`} rows={2} {...field('address')} placeholder="12 rue de la Paix, 75001 Paris" />
                    {profileErrors.address && <div className="invalid-feedback">{profileErrors.address}</div>}
                  </div>

                  {/* Fiscal regime */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Régime fiscal <span className="text-danger">*</span></label>
                    <select className={`form-select ${profileErrors.fiscalRegime ? 'is-invalid' : ''}`} {...field('fiscalRegime')}>
                      <option value="">-- Choisir --</option>
                      <option value="EI">EI (entreprise individuelle)</option>
                      <option value="SASU">SASU / SAS</option>
                      <option value="Other">Autre</option>
                    </select>
                    {profileErrors.fiscalRegime && <div className="invalid-feedback">{profileErrors.fiscalRegime}</div>}
                  </div>

                  {/* Legal status */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Statut juridique <span className="text-danger">*</span></label>
                    <select className={`form-select ${profileErrors.legalStatus ? 'is-invalid' : ''}`} {...field('legalStatus')}>
                      <option value="">-- Choisir --</option>
                      {COMPANY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {profileErrors.legalStatus && <div className="invalid-feedback">{profileErrors.legalStatus}</div>}
                  </div>


                  {/* Nature de l'activité — determines URSSAF rate */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Nature de l&apos;activité <span className="text-danger">*</span></label>
                    <select className="form-select" {...field('microEntrepreneurType')}>
                      <option value="">-- Choisir --</option>
                      <option value="COMMERCANT">Achat / revente (commerçant, artisan)</option>
                      <option value="PRESTATAIRE">Prestataire de services</option>
                      <option value="LIBERAL">Profession libérale (BNC)</option>
                    </select>
                    <small className="text-muted">Détermine votre taux URSSAF et le régime fiscal applicable</small>
                  </div>

                  {/* TVA number — optional */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Numéro TVA intracommunautaire</label>
                    <input className={`form-control font-monospace ${profileErrors.tvaNumber ? 'is-invalid' : ''}`} {...field('tvaNumber')} placeholder="FR12345678901" />
                    {profileErrors.tvaNumber
                      ? <div className="invalid-feedback">{profileErrors.tvaNumber}</div>
                      : <small className="text-muted">Optionnel — requis si vous facturez en TVA</small>}
                  </div>

                  {/* RCS + Share capital — conditional on company status */}
                  {isCompany && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Numéro RCS <span className="text-danger">*</span></label>
                        <input className={`form-control ${profileErrors.rcsNumber ? 'is-invalid' : ''}`} {...field('rcsNumber')} placeholder="Paris 123 456 789" />
                        {profileErrors.rcsNumber && <div className="invalid-feedback">{profileErrors.rcsNumber}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Capital social <span className="text-danger">*</span></label>
                        <input className={`form-control ${profileErrors.shareCapital ? 'is-invalid' : ''}`} {...field('shareCapital')} placeholder="10 000 €" />
                        {profileErrors.shareCapital && <div className="invalid-feedback">{profileErrors.shareCapital}</div>}
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 d-flex align-items-center gap-3">
                  <button type="submit" className="btn btn-primary px-4" disabled={profileSaving}>
                    {profileSaving
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Enregistrement…</>
                      : <><i className="bi bi-check-lg me-2"></i>Enregistrer le profil</>}
                  </button>
                  {profileMessage?.type === 'success' && (
                    <span className="text-success small"><i className="bi bi-check-circle me-1"></i>{profileMessage.text}</span>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ── Chorus Pro / PISTE ───────────────────────────── */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-shield-lock me-2 text-primary"></i>
                Chorus Pro / PISTE
              </h5>
              <small className="text-muted">
                Credentials requis pour soumettre et recevoir des factures via le Portail Public de Facturation.
              </small>
            </div>
            <div className="card-body">
              {pisteMessage && (
                <div className={`alert alert-${pisteMessage.type === 'success' ? 'success' : pisteMessage.type === 'info' ? 'info' : 'danger'} alert-dismissible`}>
                  {pisteMessage.type === 'success' && <i className="bi bi-check-circle me-2" />}
                  {pisteMessage.type === 'error' && <i className="bi bi-x-circle me-2" />}
                  {pisteMessage.text}
                  <button type="button" className="btn-close" onClick={() => setPisteMessage(null)} />
                </div>
              )}

              {/* How-to guide */}
              <div className="alert alert-light border mb-4" style={{ fontSize: '0.875rem' }}>
                <p className="fw-semibold mb-2">
                  <i className="bi bi-info-circle me-2 text-primary" />Comment obtenir vos credentials ?
                </p>
                <p className="text-muted mb-2" style={{ fontSize: '0.8125rem' }}>
                  Ces credentials sont <strong>propres à votre structure</strong> (votre SIRET). Chaque entreprise configure les siennes — InvoiceOps ne partage pas de credentials entre clients.
                </p>
                <ol className="mb-3 ps-3" style={{ lineHeight: '2' }}>
                  <li>
                    <strong>Créez une application PISTE</strong> sur{' '}
                    <a href="https://piste.gouv.fr" target="_blank" rel="noreferrer">piste.gouv.fr</a>
                    {' '}→ inscrivez-vous → <em>API Catalog</em> → recherchez <strong>Factures</strong> → <em>S'abonner</em>.
                    Récupérez le <strong>Client ID</strong> et <strong>Client Secret</strong> OAuth2 (pas la clé API).
                  </li>
                  <li>
                    <strong>Créez un compte technique Chorus Pro</strong> sur{' '}
                    <a href="https://portail.chorus-pro.gouv.fr" target="_blank" rel="noreferrer">portail.chorus-pro.gouv.fr</a>
                    {' '}→ connectez-vous → <em>Raccordements</em> → <em>Compte technique</em> → créez un compte avec le rôle <strong>Dépôt de factures</strong>.
                    Le login et mot de passe générés correspondent aux champs ci-dessous.{' '}
                    <span className="text-muted">(Seul le Gestionnaire de la structure peut créer un compte technique.)</span>
                  </li>
                  <li>
                    Testez d'abord en <strong>Sandbox</strong> avec l'environnement de qualification :{' '}
                    <a href="https://chorus-pro.gouv.fr/qualif" target="_blank" rel="noreferrer">chorus-pro.gouv.fr/qualif</a>.
                    Passez en <strong>Production</strong> une fois la connexion validée.
                  </li>
                </ol>
                <p className="mb-0 text-muted" style={{ fontSize: '0.8125rem' }}>
                  <i className="bi bi-shield-check me-1" />Les credentials sont chiffrés AES-256 et ne sont jamais exposés côté client.
                </p>
              </div>

              <form onSubmit={handlePisteSave}>
                <div className="row g-3">
                  {/* Environment */}
                  <div className="col-12">
                    <label className="form-label fw-medium">Environnement</label>
                    <select
                      className="form-select"
                      value={pisteForm.pisteEnv}
                      onChange={(e) => setPisteForm((f) => ({ ...f, pisteEnv: e.target.value }))}
                    >
                      <option value="sandbox">Sandbox (tests)</option>
                      <option value="production">Production</option>
                    </select>
                    <small className="text-muted">Utilisez sandbox pour les tests, production pour les vraies factures.</small>
                  </div>

                  {/* PISTE OAuth2 */}
                  <div className="col-12">
                    <div className="fw-medium text-muted mb-2" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Credentials PISTE (OAuth2)
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Client ID</label>
                    <input
                      className="form-control font-monospace"
                      placeholder="votre-client-id"
                      value={pisteForm.pisteClientId}
                      onChange={(e) => setPisteForm((f) => ({ ...f, pisteClientId: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">
                      Client Secret
                      {pisteStatus.pisteClientSecretSet && <span className="badge bg-success ms-2 fw-normal">Configuré</span>}
                    </label>
                    <input
                      type="password"
                      className="form-control font-monospace"
                      placeholder={pisteStatus.pisteClientSecretSet ? '••••••••• (laisser vide pour conserver)' : 'votre-client-secret'}
                      value={pisteForm.pisteClientSecret}
                      onChange={(e) => setPisteForm((f) => ({ ...f, pisteClientSecret: e.target.value }))}
                      autoComplete="new-password"
                    />
                  </div>

                  {/* Chorus Pro compte technique */}
                  <div className="col-12">
                    <div className="fw-medium text-muted mb-2 mt-1" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Compte Technique Chorus Pro
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Login</label>
                    <input
                      className="form-control"
                      placeholder="login-compte-technique"
                      value={pisteForm.cproTechLogin}
                      onChange={(e) => setPisteForm((f) => ({ ...f, cproTechLogin: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">
                      Mot de passe
                      {pisteStatus.cproTechPasswordSet && <span className="badge bg-success ms-2 fw-normal">Configuré</span>}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder={pisteStatus.cproTechPasswordSet ? '••••••••• (laisser vide pour conserver)' : 'mot-de-passe'}
                      value={pisteForm.cproTechPassword}
                      onChange={(e) => setPisteForm((f) => ({ ...f, cproTechPassword: e.target.value }))}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="mt-4 d-flex flex-wrap align-items-center gap-2">
                  <button type="submit" className="btn btn-primary px-4" disabled={pisteSaving}>
                    {pisteSaving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement…</>
                      : <><i className="bi bi-check-lg me-2" />Enregistrer</>}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handlePisteTest}
                    disabled={pisteTesting}
                  >
                    {pisteTesting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Test…</>
                      : <><i className="bi bi-wifi me-2" />Tester la connexion</>}
                  </button>
                  <small className="text-muted">
                    <i className="bi bi-lock me-1" />Les mots de passe sont chiffrés AES-256 avant stockage.
                  </small>
                </div>
              </form>
            </div>
          </div>

          {/* ── Stripe Connect ────────────────────────────────── */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-credit-card me-2 text-primary"></i>
                Paiements en ligne
              </h5>
              <small className="text-muted">Permettez à vos clients de payer directement via un lien sécurisé.</small>
            </div>
            <div className="card-body">
              {stripeReturnSuccess && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-check-circle-fill"></i>
                  Votre compte Stripe est connecté. Les liens de paiement sont maintenant actifs.
                </div>
              )}
              <div className="d-flex align-items-center justify-content-between py-2">
                <div>
                  <div className="fw-medium d-flex align-items-center gap-2">
                    Stripe Connect
                    {stripeAccountId
                      ? <span className="badge bg-success"><i className="bi bi-check-lg me-1"></i>Connecté</span>
                      : <span className="badge bg-secondary">Non connecté</span>}
                  </div>
                  <small className="text-muted">
                    {stripeAccountId
                      ? `Compte Stripe actif — les liens de paiement sur vos factures sont opérationnels.`
                      : 'Connectez votre compte Stripe pour activer les liens de paiement sur vos factures émises.'}
                  </small>
                </div>
                <button
                  className={`btn btn-sm ${stripeAccountId ? 'btn-outline-secondary' : 'btn-primary'}`}
                  onClick={handleStripeConnect}
                  disabled={stripeConnecting}
                >
                  {stripeConnecting
                    ? <><span className="spinner-border spinner-border-sm me-1"></span>Redirection…</>
                    : stripeAccountId
                      ? <><i className="bi bi-arrow-repeat me-1"></i>Reconfigurer</>
                      : <><i className="bi bi-box-arrow-up-right me-1"></i>Connecter Stripe</>}
                </button>
              </div>
            </div>
          </div>

          {/* ── Subscription & Billing ────────────────────────── */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-credit-card me-2 text-primary"></i>
                Abonnement InvoiceOps
              </h5>
              <small className="text-muted">PPF, e-reporting et fonctionnalités avancées requièrent le plan Pro.</small>
            </div>
            <div className="card-body">
              {searchParams.get('billing') === 'success' && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-check-circle-fill"></i>
                  Votre abonnement Pro est actif — bienvenue !
                </div>
              )}
              {searchParams.get('billing') === 'cancelled' && (
                <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-x-circle"></i>
                  Paiement annulé. Vous pouvez réessayer à tout moment.
                </div>
              )}

              {subscription ? (
                <div className="d-flex align-items-center justify-content-between py-2">
                  <div>
                    <div className="fw-medium d-flex align-items-center gap-2">
                      Plan actuel
                      {subscription.planId === 'pro' ? (
                        <span className="badge bg-primary"><i className="bi bi-lightning-fill me-1"></i>Pro</span>
                      ) : (
                        <span className="badge bg-secondary">Gratuit</span>
                      )}
                      {subscription.subscriptionStatus === 'trialing' && (
                        <span className="badge bg-info text-dark">Période d'essai</span>
                      )}
                      {subscription.subscriptionStatus === 'past_due' && (
                        <span className="badge bg-danger">Paiement en retard</span>
                      )}
                    </div>
                    {subscription.subscriptionPeriodEnd && (
                      <small className="text-muted">
                        {subscription.subscriptionStatus === 'trialing'
                          ? `Essai gratuit jusqu'au`
                          : 'Renouvellement le'}{' '}
                        {new Date(subscription.subscriptionPeriodEnd).toLocaleDateString('fr-FR')}
                      </small>
                    )}
                  </div>
                  {subscription.planId === 'pro' ? (
                    <button className="btn btn-sm btn-outline-secondary" onClick={handleManageBilling} disabled={billingLoading}>
                      {billingLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-gear me-1"></i>}
                      Gérer l'abonnement
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={handleUpgrade} disabled={billingLoading}>
                      {billingLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-lightning-fill me-1"></i>}
                      Passer au Pro — 14 jours gratuits
                    </button>
                  )}
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-between py-2">
                  <div>
                    <div className="fw-medium">Plan Gratuit</div>
                    <small className="text-muted">Créez des factures et gérez vos clients sans limite.</small>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={handleUpgrade} disabled={billingLoading}>
                    {billingLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-lightning-fill me-1"></i>}
                    Passer au Pro
                  </button>
                </div>
              )}

              <hr className="my-3" />
              <div className="row g-2 text-center">
                <div className="col-4">
                  <small className="text-muted d-block">Factures illimitées</small>
                  <i className="bi bi-check-circle-fill text-success"></i>
                </div>
                <div className="col-4">
                  <small className="text-muted d-block">Dépôt PPF / Chorus Pro</small>
                  {subscription?.planId === 'pro'
                    ? <i className="bi bi-check-circle-fill text-success"></i>
                    : <i className="bi bi-lock-fill text-warning"></i>}
                </div>
                <div className="col-4">
                  <small className="text-muted d-block">E-reporting B2C</small>
                  {subscription?.planId === 'pro'
                    ? <i className="bi bi-check-circle-fill text-success"></i>
                    : <i className="bi bi-lock-fill text-warning"></i>}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>}>
      <SettingsPageInner />
    </Suspense>
  );
}
