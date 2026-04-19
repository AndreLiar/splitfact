'use client';

import { useState, useEffect } from 'react';
import { SmartSuggestion } from '@/lib/proactive-insights';

interface SmartSuggestionsProps {
  context: string; // 'dashboard', 'create-invoice', 'clients', etc.
  className?: string;
}

export default function SmartSuggestions({ context, className = '' }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [context]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/insights?type=suggestions&context=${context}`);
      if (response.ok) {
        const suggestionsData = await response.json();
        setSuggestions(suggestionsData);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'tip': return 'bi-lightbulb text-success';
      case 'warning': return 'bi-exclamation-triangle text-warning';
      case 'opportunity': return 'bi-star text-primary';
      default: return 'bi-info-circle text-info';
    }
  };

  const getConfidenceBar = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    let color = 'success';
    if (confidence < 0.7) color = 'warning';
    if (confidence < 0.5) color = 'danger';
    
    return (
      <div className="d-flex align-items-center gap-2">
        <small className="text-muted">Pertinence:</small>
        <div className="progress flex-grow-1" style={{ height: '4px', width: '60px' }}>
          <div 
            className={`progress-bar bg-${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <small className="text-muted">{percentage}%</small>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="d-flex align-items-center gap-2 text-muted">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          <small>Génération de suggestions intelligentes...</small>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`card border-0 bg-light bg-opacity-50 ${className}`}>
      <div className="card-header bg-transparent border-0 py-2">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className="bi bi-magic text-primary me-2"></i>
            <small className="fw-semibold text-dark">Suggestions IA</small>
          </div>
          <button
            className="btn btn-sm btn-link text-muted p-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            <i className={`bi bi-chevron-${collapsed ? 'down' : 'up'}`}></i>
          </button>
        </div>
      </div>
      
      {!collapsed && (
        <div className="card-body py-2">
          {suggestions.map((suggestion, index) => (
            <div key={suggestion.id} className={`${index > 0 ? 'mt-3 pt-3 border-top' : ''}`}>
              <div className="d-flex align-items-start gap-3">
                <div className="mt-1">
                  <i className={`bi ${getSuggestionIcon(suggestion.type)}`}></i>
                </div>
                
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="mb-1 fw-semibold text-dark small">
                      {suggestion.title}
                    </h6>
                  </div>
                  
                  <p className="mb-2 text-muted small lh-sm">
                    {suggestion.description}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    {suggestion.actionable && (
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          if (suggestion.learnMoreUrl) {
                            window.location.href = suggestion.learnMoreUrl;
                          }
                        }}
                      >
                        <i className="bi bi-arrow-right me-1"></i>
                        En savoir plus
                      </button>
                    )}
                    
                    <div className="ms-auto">
                      {getConfidenceBar(suggestion.confidence)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}