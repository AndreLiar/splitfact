'use client';

import { useState, useEffect } from 'react';
import { ProactiveInsight } from '@/lib/proactive-insights';

export default function ProactiveInsightsWidget() {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights?type=insights');
      if (response.ok) {
        const insightsData = await response.json();
        setInsights(insightsData.slice(0, 5)); // Show top 5 insights
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', insightId })
      });
      
      setDismissedInsights(prev => new Set([...prev, insightId]));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
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

  const getEstimatedImpactDisplay = (impact?: ProactiveInsight['estimatedImpact']) => {
    if (!impact) return null;
    
    const color = impact.financial > 0 ? 'success' : 'danger';
    const icon = impact.financial > 0 ? 'bi-arrow-up' : 'bi-arrow-down';
    
    return (
      <div className={`small text-${color} mt-1`}>
        <i className={`bi ${icon} me-1`}></i>
        {Math.abs(impact.financial).toLocaleString('fr-FR', { 
          style: 'currency', 
          currency: 'EUR',
          maximumFractionDigits: 0 
        })}
      </div>
    );
  };

  const visibleInsights = insights.filter(insight => !dismissedInsights.has(insight.id));

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

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-transparent border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0">
            <i className="bi bi-lightbulb me-2 text-primary"></i>
            Insights Proactifs
          </h6>
          {visibleInsights.length > 0 && (
            <span className="badge bg-primary rounded-pill">
              {visibleInsights.length}
            </span>
          )}
        </div>
      </div>
      
      <div className="card-body pt-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {visibleInsights.length === 0 ? (
          <div className="text-center text-muted py-4">
            <i className="bi bi-check-circle-fill display-6 text-success mb-3"></i>
            <p className="mb-0">Aucune alerte importante</p>
            <small>Votre situation fiscale est sous contrôle</small>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {visibleInsights.map((insight) => (
              <div 
                key={insight.id} 
                className="list-group-item px-0 py-3 border-0 border-bottom"
              >
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
                      
                      {getEstimatedImpactDisplay(insight.estimatedImpact)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {visibleInsights.length > 0 && (
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