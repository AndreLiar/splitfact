'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AdvancedInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: any;
  confidence: number;
  createdAt: string;
}

interface SmartAlert {
  id: string;
  type: string;
  title: string;
  severity: string;
  actionItems: string[];
  createdAt: string;
}

interface EnhancedReport {
  id: string;
  type: string;
  title: string;
  summary: string;
  generatedAt: string;
}

export default function AdvancedInsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [insights, setInsights] = useState<AdvancedInsight[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [reports, setReports] = useState<EnhancedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchAdvancedData();
    }
  }, [status, router]);

  const fetchAdvancedData = async () => {
    setLoading(true);
    try {
      // This would fetch real data from your APIs
      // For now, using mock data to demonstrate the interface
      
      setInsights([
        {
          id: '1',
          category: 'PERFORMANCE',
          title: 'Croissance du chiffre d\'affaires',
          description: 'Votre CA a augmenté de 15% ce mois-ci par rapport au mois précédent. Cette croissance est supérieure à la moyenne sectorielle.',
          impact: { financial: 2500, probability: 0.9 },
          confidence: 0.92,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          category: 'OPTIMIZATION',
          title: 'Opportunité d\'optimisation fiscale',
          description: 'Avec votre progression vers les seuils TVA, une restructuration pourrait vous faire économiser 800€ par an.',
          impact: { financial: 800, probability: 0.7 },
          confidence: 0.85,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          category: 'RISK',
          title: 'Risque de délais de paiement',
          description: 'Un client représente 40% de votre CA avec des délais de paiement de 60 jours. Diversification recommandée.',
          impact: { financial: -1200, probability: 0.6 },
          confidence: 0.78,
          createdAt: new Date().toISOString()
        }
      ]);

      setAlerts([
        {
          id: '1',
          type: 'PROJECT_DEADLINE',
          title: 'Projet Client A - Deadline approchante',
          severity: 'WARNING',
          actionItems: [
            'Vérifier l\'avancement du projet',
            'Communiquer avec le client',
            'Planifier la livraison'
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'COMPLIANCE',
          title: 'Seuil BNC à surveiller',
          severity: 'INFO',
          actionItems: [
            'Calculer la projection trimestrielle',
            'Prévoir la transition TVA si nécessaire'
          ],
          createdAt: new Date().toISOString()
        }
      ]);

      setReports([
        {
          id: '1',
          type: 'fiscal-health',
          title: 'Rapport de Santé Fiscale',
          summary: 'Analyse complète de votre situation fiscale avec recommandations personnalisées.',
          generatedAt: new Date().toISOString()
        }
      ]);

    } catch (error) {
      console.error('Error fetching advanced data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEnhancedReport = async (type: string) => {
    setGeneratingReport(true);
    try {
      const response = await fetch(`/api/reports/enhanced?type=${type}`);
      if (response.ok) {
        const report = await response.json();
        setReports(prev => [report, ...prev]);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'URGENT': return 'text-danger';
      case 'WARNING': return 'text-warning';
      case 'INFO': return 'text-info';
      default: return 'text-muted';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PERFORMANCE': return 'bi-graph-up';
      case 'OPTIMIZATION': return 'bi-lightbulb';
      case 'RISK': return 'bi-exclamation-triangle';
      case 'COMPLIANCE': return 'bi-shield-check';
      default: return 'bi-info-circle';
    }
  };

  if (status === 'loading' || loading) {
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">
            <i className="bi bi-brain me-2 text-primary"></i>
            Insights Avancés
          </h1>
          <p className="text-muted mb-0">
            Intelligence artificielle • Données cross-platform • Analyse prédictive
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={() => fetchAdvancedData()}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualiser
          </button>
          <div className="dropdown">
            <button 
              className="btn btn-primary dropdown-toggle" 
              type="button" 
              data-bs-toggle="dropdown"
              disabled={generatingReport}
            >
              {generatingReport ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Génération...
                </>
              ) : (
                <>
                  <i className="bi bi-file-earmark-text me-1"></i>
                  Nouveau Rapport
                </>
              )}
            </button>
            <ul className="dropdown-menu">
              <li>
                <button 
                  className="dropdown-item" 
                  onClick={() => generateEnhancedReport('fiscal-health')}
                >
                  <i className="bi bi-heart-pulse me-2"></i>
                  Santé Fiscale
                </button>
              </li>
              <li>
                <button 
                  className="dropdown-item" 
                  onClick={() => generateEnhancedReport('business-performance')}
                >
                  <i className="bi bi-graph-up me-2"></i>
                  Performance Business
                </button>
              </li>
              <li>
                <button 
                  className="dropdown-item" 
                  onClick={() => generateEnhancedReport('market-analysis')}
                >
                  <i className="bi bi-pie-chart me-2"></i>
                  Analyse de Marché
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <i className="bi bi-lightbulb me-2"></i>
            Insights Cross-Platform
            <span className="badge bg-primary ms-2">{insights.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <i className="bi bi-bell me-2"></i>
            Alertes Intelligentes
            <span className="badge bg-warning ms-2">{alerts.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="bi bi-file-earmark-text me-2"></i>
            Rapports Enrichis
            <span className="badge bg-info ms-2">{reports.length}</span>
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Cross-Platform Insights Tab */}
        {activeTab === 'insights' && (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-gradient text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                  <h5 className="mb-0">
                    <i className="bi bi-cpu me-2"></i>
                    Insights Générés par IA
                  </h5>
                  <small>Analyse prédictive basée sur vos données Splitfact, Notion et sources externes</small>
                </div>
                <div className="card-body">
                  {insights.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-lightbulb display-1 mb-3"></i>
                      <h5>Aucun insight disponible</h5>
                      <p>Les insights seront générés automatiquement lors de votre prochaine synchronisation.</p>
                    </div>
                  ) : (
                    <div className="row">
                      {insights.map((insight) => (
                        <div key={insight.id} className="col-md-6 col-lg-4 mb-3">
                          <div className="card h-100 border-0 bg-light">
                            <div className="card-body">
                              <div className="d-flex align-items-start mb-3">
                                <div className={`rounded-circle p-2 me-3 bg-primary bg-opacity-10`}>
                                  <i className={`bi ${getCategoryIcon(insight.category)} text-primary`}></i>
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center mb-1">
                                    <span className="badge bg-primary bg-opacity-10 text-primary small me-2">
                                      {insight.category}
                                    </span>
                                    <span className="badge bg-success bg-opacity-10 text-success small">
                                      {Math.round(insight.confidence * 100)}% confiance
                                    </span>
                                  </div>
                                  <h6 className="card-title mb-2">{insight.title}</h6>
                                </div>
                              </div>
                              
                              <p className="card-text text-muted small mb-3">
                                {insight.description}
                              </p>
                              
                              {insight.impact?.financial && (
                                <div className="d-flex align-items-center">
                                  <i className={`bi ${insight.impact.financial > 0 ? 'bi-arrow-up text-success' : 'bi-arrow-down text-danger'} me-2`}></i>
                                  <span className={`fw-bold ${insight.impact.financial > 0 ? 'text-success' : 'text-danger'}`}>
                                    {insight.impact.financial > 0 ? '+' : ''}{insight.impact.financial.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                  </span>
                                  <small className="text-muted ms-2">
                                    ({Math.round(insight.impact.probability * 100)}% prob.)
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-bell me-2 text-warning"></i>
                    Alertes Intelligentes depuis Notion
                  </h5>
                </div>
                <div className="card-body">
                  {alerts.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-bell-slash display-1 mb-3"></i>
                      <h5>Aucune alerte active</h5>
                      <p>Les alertes apparaîtront ici basées sur l'analyse de vos données Notion.</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="border rounded p-3 mb-3">
                        <div className="d-flex align-items-start">
                          <div className="me-3">
                            <i className={`bi bi-exclamation-triangle ${getSeverityColor(alert.severity)}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <h6 className="mb-0 me-2">{alert.title}</h6>
                              <span className={`badge ${alert.severity === 'WARNING' ? 'bg-warning' : alert.severity === 'URGENT' ? 'bg-danger' : 'bg-info'}`}>
                                {alert.severity}
                              </span>
                              <span className="badge bg-light text-dark ms-2 small">
                                {alert.type.replace('_', ' ')}
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <strong className="small">Actions suggérées :</strong>
                              <ul className="small mb-0 mt-1">
                                {alert.actionItems.map((action, index) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <small className="text-muted">
                              Créée le {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                            </small>
                          </div>
                          <div>
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-check2"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Reports Tab */}
        {activeTab === 'reports' && (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-file-earmark-text me-2 text-info"></i>
                    Rapports Enrichis avec Données Externes
                  </h5>
                </div>
                <div className="card-body">
                  {reports.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-file-earmark display-1 mb-3"></i>
                      <h5>Aucun rapport généré</h5>
                      <p>Générez votre premier rapport enrichi avec le bouton ci-dessus.</p>
                    </div>
                  ) : (
                    <div className="row">
                      {reports.map((report) => (
                        <div key={report.id} className="col-md-6 col-lg-4 mb-3">
                          <div className="card h-100 border-0 bg-light">
                            <div className="card-body">
                              <div className="d-flex align-items-center mb-3">
                                <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                                  <i className="bi bi-file-earmark-text text-info"></i>
                                </div>
                                <div>
                                  <h6 className="mb-1">{report.title}</h6>
                                  <small className="text-muted">
                                    {new Date(report.generatedAt).toLocaleDateString('fr-FR')}
                                  </small>
                                </div>
                              </div>
                              
                              <p className="text-muted small mb-3">
                                {report.summary}
                              </p>
                              
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-primary flex-grow-1">
                                  <i className="bi bi-eye me-1"></i>
                                  Voir
                                </button>
                                <button className="btn btn-sm btn-outline-secondary">
                                  <i className="bi bi-download me-1"></i>
                                  PDF
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}