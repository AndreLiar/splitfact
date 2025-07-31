'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SmartSuggestion } from '@/lib/proactive-insights';

interface AsyncSmartSuggestionsProps {
  context: string;
  className?: string;
  enableLazyLoading?: boolean;
  debounceMs?: number;
  timeout?: number;
}

export default function AsyncSmartSuggestions({ 
  context, 
  className = '',
  enableLazyLoading = true,
  debounceMs = 500,
  timeout = 20000
}: AsyncSmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(!enableLazyLoading);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStartedLoading) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [enableLazyLoading, hasStartedLoading]);

  // Debounced fetch function
  const debouncedFetchSuggestions = useCallback(
    (contextParam: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(contextParam);
      }, debounceMs);
    },
    [debounceMs]
  );

  // Fetch suggestions when visible or context changes
  useEffect(() => {
    if (isVisible && !hasStartedLoading) {
      setHasStartedLoading(true);
      debouncedFetchSuggestions(context);
    } else if (hasStartedLoading && context) {
      debouncedFetchSuggestions(context);
    }
  }, [isVisible, context, hasStartedLoading, debouncedFetchSuggestions]);

  const fetchSuggestions = async (contextParam: string) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, timeout);

    try {
      const response = await fetch(`/api/insights?type=suggestions&context=${contextParam}`, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const suggestionsData = await response.json();
      setSuggestions(suggestionsData);
      clearTimeout(timeoutId);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Génération de suggestions interrompue (délai dépassé)');
      } else {
        setError('Impossible de charger les suggestions pour le moment');
      }
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const retry = () => {
    setError(null);
    fetchSuggestions(context);
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
        <small className="text-muted">Relevance:</small>
        <div className="progress flex-grow-1" style={{ height: '4px', width: '50px' }}>
          <div 
            className={`progress-bar bg-${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <small className="text-muted">{percentage}%</small>
      </div>
    );
  };

  // Don't render if not visible and lazy loading enabled
  if (!isVisible && enableLazyLoading) {
    return <div ref={containerRef} className="py-2"></div>;
  }

  // Loading state
  if (loading && suggestions.length === 0) {
    return (
      <div ref={containerRef} className={`${className}`}>
        <div className="card border-0 bg-light bg-opacity-50">
          <div className="card-body py-3">
            <div className="d-flex align-items-center gap-2 text-muted">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <small>Génération de suggestions intelligentes...</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && suggestions.length === 0) {
    return (
      <div ref={containerRef} className={`${className}`}>
        <div className="card border-0 bg-light bg-opacity-50">
          <div className="card-body py-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-muted">
                <i className="bi bi-exclamation-triangle text-warning"></i>
                <small>{error}</small>
              </div>
              <button 
                className="btn btn-sm btn-link text-muted p-0"
                onClick={retry}
                title="Réessayer"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No suggestions
  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <div ref={containerRef} className={`card border-0 bg-light bg-opacity-50 ${className}`}>
      <div className="card-header bg-transparent border-0 py-2">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className="bi bi-magic text-primary me-2"></i>
            <small className="fw-semibold text-dark">Suggestions IA</small>
            {suggestions.length > 0 && (
              <span className="badge bg-primary rounded-pill ms-2">
                {suggestions.length}
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {loading && (
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Mise à jour...</span>
              </div>
            )}
            <button
              className="btn btn-sm btn-link text-muted p-0"
              onClick={() => setCollapsed(!collapsed)}
            >
              <i className={`bi bi-chevron-${collapsed ? 'down' : 'up'}`}></i>
            </button>
          </div>
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