'use client';

import { useState, useEffect, useRef } from 'react';
import { ProactiveInsight } from '@/lib/proactive-insights';

// Skeleton loader component
const InsightSkeleton = () => (
  <div className="list-group-item px-0 py-3 border-0 border-bottom">
    <div className="d-flex align-items-start">
      <div className="me-3 mt-1">
        <div className="bg-light rounded-circle" style={{ width: '24px', height: '24px' }}></div>
      </div>
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="bg-light rounded" style={{ width: '70%', height: '16px' }}></div>
          <div className="bg-light rounded" style={{ width: '60px', height: '20px' }}></div>
        </div>
        <div className="bg-light rounded mb-2" style={{ width: '90%', height: '12px' }}></div>
        <div className="bg-light rounded" style={{ width: '40%', height: '12px' }}></div>
      </div>
    </div>
  </div>
);

interface AsyncProactiveInsightsWidgetProps {
  enableLazyLoading?: boolean;
  timeout?: number;
}

export default function AsyncProactiveInsightsWidget({ 
  enableLazyLoading = true, 
  timeout = 30000 
}: AsyncProactiveInsightsWidgetProps) {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
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

  // Fetch insights when visible
  useEffect(() => {
    if (isVisible && !hasStartedLoading) {
      fetchInsights();
      setHasStartedLoading(true);
    }
  }, [isVisible, hasStartedLoading]);

  const fetchInsights = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, timeout);

    try {
      const response = await fetch('/api/insights?type=insights', {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const insightsData = await response.json();
      setInsights(insightsData.slice(0, 5));
      clearTimeout(timeoutId);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('La génération d\'insights prend plus de temps que prévu. Veuillez réessayer.');
      } else {
        setError('Impossible de charger les insights pour le moment.');
      }
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', insightId })
      });
      setDismissed(prev => new Set([...prev, insightId]));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const retry = () => {
    setError(null);
    fetchInsights();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return 'bi-exclamation-triangle-fill text-danger';
      case 'opportunity': return 'bi-lightbulb-fill text-success';
      case 'recommendation': return 'bi-info-circle-fill text-info';
      case 'deadline': return 'bi-calendar-event-fill text-warning';
      case 'optimization': return 'bi-gear-fill text-primary';
      default: return 'bi-info-circle text-muted';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      'critical': 'badge bg-danger',
      'high': 'badge bg-warning text-dark',
      'medium': 'badge bg-info',
      'low': 'badge bg-secondary'
    };
    return badges[priority as keyof typeof badges] || 'badge bg-secondary';
  };

  const visibleInsights = insights.filter(insight => !dismissed.has(insight.id));

  return (
    <div ref={containerRef} className="card border-0 shadow-sm h-100">
      <div className="card-header bg-transparent border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0">
            <i className="bi bi-lightbulb me-2 text-primary"></i>
            Insights Proactifs
          </h6>
          {!loading && !error && (
            <div className="d-flex align-items-center gap-2">
              {visibleInsights.length > 0 && (
                <span className="badge bg-primary rounded-pill">
                  {visibleInsights.length}
                </span>
              )}
              <button 
                className="btn btn-sm btn-link text-muted p-0"
                onClick={retry}
                title="Actualiser"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="card-body pt-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {!isVisible ? (
          // Placeholder when not visible
          <div className="text-center text-muted py-4">
            <i className="bi bi-eye display-6 mb-3"></i>
            <p className="mb-0 small">Insights en attente de chargement</p>
          </div>
        ) : loading ? (
          // Loading skeleton
          <div>
            <div className="d-flex align-items-center mb-3">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <small className="text-muted">Génération d'insights personnalisés...</small>
            </div>
            <div className="list-group list-group-flush">
              {[1, 2, 3].map(i => <InsightSkeleton key={i} />)}
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
        ) : visibleInsights.length === 0 ? (
          // Empty state
          <div className="text-center text-muted py-4">
            <i className="bi bi-check-circle-fill display-6 text-success mb-3"></i>
            <p className="mb-0">Aucune alerte importante</p>
            <small>Votre situation fiscale est sous contrôle</small>
          </div>
        ) : (
          // Insights list
          <div className="list-group list-group-flush">
            {visibleInsights.map((insight) => (
              <div key={insight.id} className="list-group-item px-0 py-3 border-0 border-bottom">
                <div className="d-flex align-items-start">
                  <div className="me-3 mt-1">
                    <i className={`bi ${getInsightIcon(insight.type)} fs-5`}></i>
                  </div>
                  
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-1 fw-semibold text-dark lh-sm">
                        {insight.title}
                      </h6>
                      <div className="d-flex gap-1 ms-2 flex-shrink-0">
                        <span className={getPriorityBadge(insight.priority)}>
                          {insight.priority}
                        </span>
                        <button
                          className="btn btn-sm btn-link text-muted p-0"
                          onClick={() => dismissInsight(insight.id)}
                          title="Ignorer"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                    
                    <p className="mb-2 text-muted small lh-sm">
                      {insight.description}
                    </p>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-3">
                        {insight.actionable && (
                          <a 
                            href={insight.actionUrl}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-arrow-right me-1"></i>
                            {insight.actionText}
                          </a>
                        )}
                        
                        {insight.dueDate && (
                          <small className="text-warning">
                            <i className="bi bi-clock me-1"></i>
                            {new Date(insight.dueDate).toLocaleDateString('fr-FR')}
                          </small>
                        )}
                      </div>
                      
                      {insight.estimatedImpact && (
                        <div className="small text-success">
                          <i className="bi bi-arrow-up me-1"></i>
                          {Math.abs(insight.estimatedImpact.financial).toLocaleString('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR',
                            maximumFractionDigits: 0 
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {!loading && !error && visibleInsights.length > 0 && (
        <div className="card-footer bg-transparent border-0 pt-0">
          <div className="d-grid">
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => window.location.href = '/dashboard/assistant'}
            >
              <i className="bi bi-chat-dots me-1"></i>
              Discuter avec l'IA Fiscale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}