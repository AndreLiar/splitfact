'use client';

import { useState, useEffect, useRef } from 'react';
import { FiscalHealthScore } from '@/lib/proactive-insights';

// Skeleton loader for health score
const HealthSkeleton = () => (
  <div className="text-center mb-4">
    <div className="position-relative d-inline-block">
      <div className="bg-light rounded-circle mx-auto mb-2" style={{ width: '120px', height: '120px' }}></div>
    </div>
    <div className="bg-light rounded mx-auto" style={{ width: '80%', height: '12px' }}></div>
  </div>
);

interface AsyncFiscalHealthWidgetProps {
  enableLazyLoading?: boolean;
  timeout?: number;
}

export default function AsyncFiscalHealthWidget({ 
  enableLazyLoading = true, 
  timeout = 25000 
}: AsyncFiscalHealthWidgetProps) {
  const [healthScore, setHealthScore] = useState<FiscalHealthScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(!enableLazyLoading);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStartedLoading) {
          setIsVisible(true);
          setHasStartedLoading(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [enableLazyLoading, hasStartedLoading]);

  // Fetch health score when visible
  useEffect(() => {
    if (isVisible && !hasStartedLoading) {
      fetchHealthScore();
      setHasStartedLoading(true);
    }
  }, [isVisible, hasStartedLoading]);

  const fetchHealthScore = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, timeout);

    try {
      const response = await fetch('/api/insights?type=health', {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const health = await response.json();
      setHealthScore(health);
      clearTimeout(timeoutId);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('L\'analyse de santé fiscale prend plus de temps que prévu.');
      } else {
        setError('Impossible de charger l\'analyse de santé fiscale.');
      }
      console.error('Error fetching health score:', error);
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const retry = () => {
    setError(null);
    fetchHealthScore();
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'info';
    return 'danger';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'bi-trend-up text-success';
      case 'declining': return 'bi-trend-down text-danger';
      default: return 'bi-dash-lg text-muted';
    }
  };

  return (
    <div ref={containerRef} className="card border-0 shadow-sm h-100">
      <div className="card-header bg-transparent border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0">
            <i className="bi bi-heart-pulse me-2 text-primary"></i>
            Santé Fiscale
          </h6>
          <div className="d-flex align-items-center gap-2">
            {!loading && !error && healthScore && (
              <i className={`bi ${getTrendIcon(healthScore.trend)}`}></i>
            )}
            {!loading && (
              <button 
                className="btn btn-sm btn-link text-muted p-0"
                onClick={retry}
                title="Actualiser"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="card-body pt-3">
        {!isVisible ? (
          // Placeholder when not visible
          <div className="text-center text-muted py-4">
            <i className="bi bi-eye display-6 mb-3"></i>
            <p className="mb-0 small">Analyse en attente de chargement</p>
          </div>
        ) : loading ? (
          // Loading state
          <div>
            <div className="d-flex align-items-center justify-content-center mb-3">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <small className="text-muted">Calcul de votre santé fiscale...</small>
            </div>
            <HealthSkeleton />
            <div className="row g-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="col-6">
                  <div className="bg-light rounded p-2">
                    <div className="bg-secondary rounded mb-1" style={{ width: '60%', height: '10px' }}></div>
                    <div className="bg-secondary rounded" style={{ width: '30%', height: '14px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="text-center py-4">
            <i className="bi bi-exclamation-triangle display-6 text-warning mb-3"></i>
            <p className="text-muted mb-3 small">{error}</p>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={retry}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Réessayer
            </button>
          </div>
        ) : !healthScore ? (
          // No data state
          <div className="text-center text-muted py-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Aucune donnée disponible
          </div>
        ) : (
          // Health score display
          <>
            {/* Overall Score */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                <svg width="120" height="120" className="mb-2">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e9ecef"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={`var(--bs-${getScoreColor(healthScore.overall)})`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(healthScore.overall / 100) * 314} 314`}
                    strokeDashoffset="0"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                  />
                </svg>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <div className={`h4 mb-0 text-${getScoreColor(healthScore.overall)}`}>
                    {healthScore.overall}
                  </div>
                  <small className="text-muted">/ 100</small>
                </div>
              </div>
              <div className="mt-2">
                <small className="text-muted">{healthScore.benchmarkComparison}</small>
              </div>
            </div>

            {/* Breakdown Scores */}
            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="bg-light rounded p-2 text-center">
                  <div className="small text-muted mb-1">Conformité</div>
                  <div className={`fw-bold text-${getScoreColor(healthScore.breakdown.compliance)}`}>
                    {healthScore.breakdown.compliance}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="bg-light rounded p-2 text-center">
                  <div className="small text-muted mb-1">Trésorerie</div>
                  <div className={`fw-bold text-${getScoreColor(healthScore.breakdown.cashFlow)}`}>
                    {healthScore.breakdown.cashFlow}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="bg-light rounded p-2 text-center">
                  <div className="small text-muted mb-1">Croissance</div>
                  <div className={`fw-bold text-${getScoreColor(healthScore.breakdown.growth)}`}>
                    {healthScore.breakdown.growth}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="bg-light rounded p-2 text-center">
                  <div className="small text-muted mb-1">Efficacité</div>
                  <div className={`fw-bold text-${getScoreColor(healthScore.breakdown.efficiency)}`}>
                    {healthScore.breakdown.efficiency}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="d-grid">
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => window.location.href = '/dashboard/assistant'}
              >
                <i className="bi bi-lightbulb me-1"></i>
                Conseils d'amélioration
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}