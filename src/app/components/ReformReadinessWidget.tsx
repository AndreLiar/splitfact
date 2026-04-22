'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReadinessCheck {
  ready: boolean;
  checks: Record<string, boolean>;
  deadlineDate: string;
  daysRemaining: number;
}

interface ReformReadiness {
  receive: ReadinessCheck;
  emit: ReadinessCheck;
}

function urgencyColor(days: number, ready: boolean): string {
  if (ready) return '#16a34a';
  if (days < 90) return '#dc2626';
  if (days < 180) return '#d97706';
  return '#6b7280';
}

function urgencyBg(days: number, ready: boolean): string {
  if (ready) return 'rgba(22,163,74,0.08)';
  if (days < 90) return 'rgba(220,38,38,0.06)';
  if (days < 180) return 'rgba(217,119,6,0.06)';
  return 'rgba(107,114,128,0.06)';
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: ok ? '#d0d6e0' : '#8a8f98' }}>
      <i
        className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}
        style={{ color: ok ? '#16a34a' : '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}
      />
      {label}
    </div>
  );
}

function DeadlineBlock({ label, data }: { label: string; data: ReadinessCheck }) {
  const color = urgencyColor(data.daysRemaining, data.ready);
  const bg = urgencyBg(data.daysRemaining, data.ready);
  const deadline = new Date(data.deadlineDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div style={{
      flex: 1,
      borderRadius: '8px',
      border: `1px solid ${color}30`,
      backgroundColor: bg,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 590, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#62666d' }}>
            {label}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#8a8f98', marginTop: '2px' }}>
            Obligatoire · {deadline}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: '6px',
          padding: '4px 8px',
        }}>
          <i
            className={`bi ${data.ready ? 'bi-shield-check' : 'bi-shield-exclamation'}`}
            style={{ color, fontSize: '0.875rem' }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 590, color }}>
            {data.ready ? 'Configuré' : 'Non configuré'}
          </span>
        </div>
      </div>

      {/* Countdown */}
      {!data.ready && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1 }}>
            {data.daysRemaining}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#8a8f98' }}>jours restants</span>
        </div>
      )}

      {/* Checks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {Object.entries(data.checks).map(([key, ok]) => {
          const labels: Record<string, string> = {
            cproCredentials: 'Compte technique Chorus Pro',
            pisteCredentials: 'Credentials PISTE API',
            siretValidated: 'SIRET renseigné',
          };
          return <CheckRow key={key} label={labels[key] ?? key} ok={ok} />;
        })}
      </div>
    </div>
  );
}

export default function ReformReadinessWidget() {
  const [data, setData] = useState<ReformReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reform-readiness')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data) return null;

  const allReady = data.receive.ready && data.emit.ready;
  const urgentIssue = !data.receive.ready && data.receive.daysRemaining < 180;

  return (
    <div style={{
      borderRadius: '10px',
      border: `1px solid ${urgentIssue ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.07)'}`,
      backgroundColor: '#141517',
      padding: '16px',
      marginBottom: '24px',
    }}>
      {/* Widget header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-patch-check" style={{ color: '#D4921A', fontSize: '1rem' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 590, color: '#d0d6e0' }}>
            Conformité Réforme E-Invoicing
          </span>
          {urgentIssue && (
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 590,
              backgroundColor: 'rgba(220,38,38,0.12)',
              color: '#dc2626',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: '4px',
              padding: '1px 6px',
              letterSpacing: '0.04em',
            }}>
              URGENT
            </span>
          )}
        </div>
        {allReady ? (
          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>
            <i className="bi bi-check-all me-1" />
            Prêt
          </span>
        ) : (
          <Link href="/dashboard/settings" style={{ fontSize: '0.75rem', color: '#D4921A', textDecoration: 'none' }}>
            Configurer <i className="bi bi-arrow-right ms-1" />
          </Link>
        )}
      </div>

      {/* Two deadline blocks side by side */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <DeadlineBlock label="Réception (Sep 2026)" data={data.receive} />
        <DeadlineBlock label="Émission (Sep 2027)" data={data.emit} />
      </div>

      {/* Footer note */}
      {!allReady && (
        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#62666d', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="bi bi-info-circle" />
          Configurez vos credentials dans{' '}
          <Link href="/dashboard/settings" style={{ color: '#D4921A', textDecoration: 'none' }}>
            Paramètres
          </Link>{' '}
          et votre SIRET pour atteindre la conformité totale.
        </div>
      )}
    </div>
  );
}
