'use client';

import { useState, useEffect } from 'react';
import { FiscalHealthScore } from '@/lib/proactive-insights';

export default function FiscalHealthWidget() {
  const [healthScore, setHealthScore] = useState<FiscalHealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthScore();
  }, []);

  const fetchHealthScore = async () => {
    try {
      const response = await fetch('/api/insights?type=health');
      if (response.ok) {
        const health = await response.json();
        setHealthScore(health);
      }
    } catch (error) {
      console.error('Error fetching health score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'info';
    return 'danger';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return 'bi-heart-fill';
    if (score >= 70) return 'bi-heart';
    if (score >= 50) return 'bi-heart-half';
    return 'bi-heart-pulse';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'bi-trend-up text-success';
      case 'declining': return 'bi-trend-down text-danger';
      default: return 'bi-dash-lg text-muted';
    }
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!healthScore) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex justify-content-center align-items-center text-muted">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Impossible de charger le score de santé
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-transparent border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0">
            <i className="bi bi-heart-pulse me-2 text-primary"></i>
            Santé Fiscale
          </h6>
          <i className={`bi ${getTrendIcon(healthScore.trend)}`}></i>
        </div>
      </div>
      
      <div className="card-body pt-3">
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
      </div>
    </div>
  );
}