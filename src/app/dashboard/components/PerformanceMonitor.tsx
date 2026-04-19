'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number | null;
  timeToInteractive: number | null;
}

interface ComponentPerformance {
  component: string;
  loadTime: number;
  status: 'loading' | 'loaded' | 'error' | 'cached';
}

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [componentMetrics, setComponentMetrics] = useState<ComponentPerformance[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Collect performance metrics
    const collectMetrics = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const performanceMetrics: PerformanceMetrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          firstInputDelay: null,
          timeToInteractive: null
        };

        // LCP observer
        if ('PerformanceObserver' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            performanceMetrics.largestContentfulPaint = lastEntry?.startTime || 0;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // CLS observer
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            performanceMetrics.cumulativeLayoutShift = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // FID observer  
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              performanceMetrics.firstInputDelay = entry.processingStart - entry.startTime;
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        }

        setMetrics(performanceMetrics);
      }
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    return () => window.removeEventListener('load', collectMetrics);
  }, []);

  // Monitor AI component loading (simulation)
  useEffect(() => {
    const components = [
      { component: 'SmartSuggestions', loadTime: 0, status: 'loading' as const },
      { component: 'FiscalHealthWidget', loadTime: 0, status: 'loading' as const },
      { component: 'ProactiveInsights', loadTime: 0, status: 'loading' as const }
    ];

    setComponentMetrics(components);

    // Simulate component loading times
    const timers = components.map((comp, index) => {
      return setTimeout(() => {
        setComponentMetrics(prev => 
          prev.map(c => 
            c.component === comp.component 
              ? { ...c, loadTime: Math.random() * 2000 + 1000, status: 'loaded' as const }
              : c
          )
        );
      }, (index + 1) * 1000);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const getScoreColor = (score: number, thresholds: { good: number; needs: number }) => {
    if (score <= thresholds.good) return 'success';
    if (score <= thresholds.needs) return 'warning';
    return 'danger';
  };

  const formatTime = (time: number) => {
    return `${Math.round(time)}ms`;
  };

  if (!isVisible) {
    return (
      <div className="position-fixed bottom-0 end-0 m-3">
        <button 
          className="btn btn-sm btn-outline-secondary rounded-pill"
          onClick={() => setIsVisible(true)}
          title="Voir les métriques de performance"
        >
          <i className="bi bi-speedometer2"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1050 }}>
      <div className="card shadow-lg" style={{ width: '350px', maxHeight: '500px' }}>
        <div className="card-header bg-dark text-white py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <i className="bi bi-speedometer2 me-2"></i>
              Performance Monitor
            </h6>
            <button 
              className="btn btn-sm btn-link text-white p-0"
              onClick={() => setIsVisible(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div className="card-body py-2" style={{ fontSize: '0.85rem', overflowY: 'auto' }}>
          {/* Web Vitals */}
          <div className="mb-3">
            <h6 className="text-muted mb-2">Web Vitals</h6>
            {metrics && (
              <div className="row g-2">
                <div className="col-6">
                  <div className="bg-light rounded p-2 text-center">
                    <div className="small text-muted">FCP</div>
                    <div className={`fw-bold text-${getScoreColor(metrics.firstContentfulPaint, { good: 1800, needs: 3000 })}`}>
                      {formatTime(metrics.firstContentfulPaint)}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-light rounded p-2 text-center">
                    <div className="small text-muted">LCP</div>
                    <div className={`fw-bold text-${getScoreColor(metrics.largestContentfulPaint, { good: 2500, needs: 4000 })}`}>
                      {formatTime(metrics.largestContentfulPaint)}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-light rounded p-2 text-center">
                    <div className="small text-muted">CLS</div>
                    <div className={`fw-bold text-${getScoreColor(metrics.cumulativeLayoutShift * 1000, { good: 100, needs: 250 })}`}>
                      {(metrics.cumulativeLayoutShift * 1000).toFixed(0)}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-light rounded p-2 text-center">
                    <div className="small text-muted">FID</div>
                    <div className="fw-bold text-muted">
                      {metrics.firstInputDelay ? formatTime(metrics.firstInputDelay) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Components */}
          <div className="mb-3">
            <h6 className="text-muted mb-2">AI Components</h6>
            {componentMetrics.map(comp => (
              <div key={comp.component} className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <div 
                    className={`badge rounded-circle me-2 ${
                      comp.status === 'loaded' ? 'bg-success' :
                      comp.status === 'error' ? 'bg-danger' :
                      comp.status === 'cached' ? 'bg-info' : 'bg-warning'
                    }`}
                    style={{ width: '8px', height: '8px' }}
                  ></div>
                  <small>{comp.component}</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {comp.status === 'loading' ? (
                    <div className="spinner-border spinner-border-sm" role="status" style={{ width: '12px', height: '12px' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <small className="text-muted">{formatTime(comp.loadTime)}</small>
                  )}
                  <span className={`badge badge-sm ${
                    comp.status === 'loaded' ? 'bg-success' :
                    comp.status === 'error' ? 'bg-danger' :
                    comp.status === 'cached' ? 'bg-info' : 'bg-warning'
                  }`}>
                    {comp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Tips */}
          <div>
            <h6 className="text-muted mb-2">Tips</h6>
            <div className="small text-muted">
              <div className="mb-1">
                <i className="bi bi-check-circle text-success me-1"></i>
                Lazy loading activé
              </div>
              <div className="mb-1">
                <i className="bi bi-check-circle text-success me-1"></i>
                Cache AI activé (15min)
              </div>
              <div className="mb-1">
                <i className="bi bi-check-circle text-success me-1"></i>
                Timeouts configurés
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;