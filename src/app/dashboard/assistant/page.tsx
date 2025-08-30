'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SmartSuggestions from '@/app/dashboard/components/SmartSuggestions';
import SyncStatusIndicator from '@/app/dashboard/components/SyncStatusIndicator';

interface Source {
  type: 'web' | 'notion' | 'splitfact' | 'ai';
  title: string;
  url?: string;
  reliability: number;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  multiAgent?: boolean;
  sources?: Source[];
  webSearchUsed?: boolean;
  notionDataUsed?: boolean;
  agentsUsed?: string[];
  confidence?: number;
}

export default function FiscalAssistantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRevenue, setUserRevenue] = useState<number>(0);
  const [fiscalContext, setFiscalContext] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [notionStatus, setNotionStatus] = useState<{connected: boolean, syncing: boolean, lastSync?: Date} | null>(null);
  const [syncNotification, setSyncNotification] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      content: "👋 **Bonjour !** Je suis votre Assistant Fiscal Expert spécialisé dans le régime **Micro-Entrepreneur** en France.\n\n🎯 **Je peux vous aider avec :**\n• Seuils et franchises de TVA\n• Cotisations sociales URSSAF\n• Optimisation fiscale\n• Déclarations et obligations\n• Conseil personnalisé selon vos revenus\n\n**Posez-moi votre question ou utilisez les suggestions ci-dessous !**",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchUserRevenue();
      fetchNotionStatus();
    }
  }, [status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserRevenue = async () => {
    try {
      // Fetch comprehensive fiscal context
      const contextResponse = await fetch('/api/ai/fiscal-context');
      if (contextResponse.ok) {
        const context = await contextResponse.json();
        setFiscalContext(context);
        setUserRevenue(context.revenue.totalPaid);
      } else {
        // Fallback to simple revenue calculation
        const response = await fetch('/api/invoices');
        if (response.ok) {
          const invoices = await response.json();
          
          const currentYear = new Date().getFullYear();
          const paidCurrentYearInvoices = invoices.filter((invoice: any) => {
            const invoiceYear = new Date(invoice.invoiceDate).getFullYear();
            const isPaid = invoice.paymentStatus === 'paid';
            return invoiceYear === currentYear && isPaid;
          });
          
          const yearlyRevenue = paidCurrentYearInvoices.reduce((sum: number, invoice: any) => {
            return sum + parseFloat(invoice.totalAmount || '0');
          }, 0);
          
          setUserRevenue(yearlyRevenue);
        }
      }
    } catch (error) {
      console.error('Error fetching fiscal context:', error);
    }
  };

  const fetchNotionStatus = async () => {
    try {
      const response = await fetch('/api/integrations/notion/auth?action=status');
      if (response.ok) {
        const status = await response.json();
        setNotionStatus({
          connected: status.connected,
          syncing: false,
          lastSync: status.lastSync ? new Date(status.lastSync) : undefined
        });
      }
    } catch (error) {
      console.error('Failed to fetch Notion status:', error);
      setNotionStatus({ connected: false, syncing: false });
    }
  };

  const quickActions = [
    {
      icon: 'bi-speedometer',
      title: `Seuils ${new Date().getFullYear()}`,
      question: `Quels sont les seuils de TVA et de chiffre d'affaires pour les micro-entrepreneurs en ${new Date().getFullYear()} ?`,
      color: 'primary'
    },
    {
      icon: 'bi-calculator',
      title: 'Cotisations URSSAF',
      question: 'Comment calculer mes cotisations sociales URSSAF en tant que micro-entrepreneur ?',
      color: 'success'
    },
    {
      icon: 'bi-calendar-check',
      title: 'Déclarations',
      question: 'Quelles sont mes obligations déclaratives en tant que micro-entrepreneur ?',
      color: 'info'
    },
    {
      icon: 'bi-graph-up',
      title: 'Optimisation',
      question: `Avec un CA de ${userRevenue.toLocaleString('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        maximumFractionDigits: 0 
      })}, comment optimiser ma fiscalité ?`,
      color: 'warning'
    }
  ];

  const faqItems = [
    {
      question: 'Puis-je déduire mes frais professionnels ?',
      category: 'Déductions'
    },
    {
      question: 'Comment passer du micro-entrepreneur à la SASU ?',
      category: 'Évolution'
    },
    {
      question: 'Que faire si je dépasse les seuils ?',
      category: 'Seuils'
    },
    {
      question: 'Comment facturer à l\'international ?',
      category: 'International'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);
    setShowWelcome(false);

    // Add enhanced typing indicator with agent detection
    const typingMessage: Message = { 
      role: 'ai', 
      content: '...', 
      timestamp: new Date(),
      multiAgent: true,
      webSearchUsed: true,
      notionDataUsed: notionStatus?.connected
    };
    setMessages((prevMessages) => [...prevMessages, typingMessage]);

    try {
      // Use enhanced multi-agent endpoint for better responses
      const response = await fetch('/api/ai/multi-agent-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage.content,
          context: {
            includeNotionData: notionStatus?.connected,
            userRevenue: userRevenue,
            urgency: 'medium'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI advice');
      }

      const data = await response.json();
      
      // Remove typing indicator and add enhanced response with metadata
      setMessages((prevMessages) => {
        const messagesWithoutTyping = prevMessages.slice(0, -1);
        return [...messagesWithoutTyping, { 
          role: 'ai', 
          content: data.answer || "Désolé, je n'ai pas pu générer de réponse.",
          timestamp: new Date(),
          multiAgent: data.metadata?.agentsUsed?.length > 1 || false,
          sources: data.sources || [],
          webSearchUsed: data.sources?.some((s: Source) => s.type === 'web') || false,
          notionDataUsed: data.sources?.some((s: Source) => s.type === 'notion') || false,
          agentsUsed: data.metadata?.agentsUsed || [],
          confidence: data.confidence || 0.7
        }];
      });
    } catch (err: any) {
      console.error("Error fetching AI advice:", err);
      setError(err.message);
      setMessages((prevMessages) => {
        const messagesWithoutTyping = prevMessages.slice(0, -1);
        return [...messagesWithoutTyping, { 
          role: 'ai', 
          content: `❌ **Erreur de connexion**\n\nJe ne peux pas répondre pour le moment. Veuillez réessayer dans quelques instants.\n\n*Détails techniques: ${err.message}*`,
          timestamp: new Date()
        }];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (question: string) => {
    setInput(question);
    setShowWelcome(false);
  };

  const highlightKeyFigures = (text: string) => {
    return text
      // Highlight monetary amounts
      .replace(/(\d{1,3}(?:\s?\d{3})*)\s?€/g, '<span class="fw-bold text-success">$1€</span>')
      // Highlight percentages
      .replace(/(\d+(?:,\d+)?)\s?%/g, '<span class="fw-bold text-info">$1%</span>')
      // Highlight dates
      .replace(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi, '<span class="fw-bold text-warning">$1 $2</span>')
      // Highlight specific thresholds
      .replace(/(39\s?100|91\s?900)/g, '<span class="fw-bold text-danger">$1€</span>');
  };

  const renderMessage = (content: string, message?: Message) => {
    if (content === '...') {
      return (
        <div className="py-3">
          <div className="d-flex align-items-center mb-3">
            <div className="spinner-grow spinner-grow-sm me-2 text-primary" role="status"></div>
            <div className="spinner-grow spinner-grow-sm me-2 text-success" role="status"></div>
            <div className="spinner-grow spinner-grow-sm text-warning" role="status"></div>
            <span className="ms-3 text-muted small fw-semibold">Multi-Agent en cours de traitement...</span>
          </div>
          <div className="small text-muted ps-4">
            <div className="mb-2 d-flex align-items-center">
              <i className="bi bi-search text-primary me-2"></i>
              <span className="me-3">Research Agent : Recherche web en temps réel...</span>
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
            {message?.notionDataUsed && (
              <div className="mb-2 d-flex align-items-center">
                <i className="bi bi-journal-text text-info me-2"></i>
                <span className="me-3">Notion Agent : Analyse des données workspace...</span>
                <div className="spinner-border spinner-border-sm text-info" role="status"></div>
              </div>
            )}
            <div className="mb-2 d-flex align-items-center">
              <i className="bi bi-shield-check text-success me-2"></i>
              <span className="me-3">Compliance Agent : Vérification réglementaire...</span>
              <div className="spinner-border spinner-border-sm text-success" role="status"></div>
            </div>
            <div className="d-flex align-items-center">
              <i className="bi bi-lightbulb text-warning me-2"></i>
              <span className="me-3">Orchestrator : Synthèse des conseils...</span>
              <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
            </div>
          </div>
        </div>
      );
    }

    // Render content with proper formatting
    return (
      <div className="message-content">
        {content
          .split('\n')
          .map((line, index) => {
            if (line.trim().length === 0) {
              return <div key={index} className="mb-2"></div>;
            }
            
            // Format the line with highlighting and markdown
            const formattedLine = highlightKeyFigures(
              line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^•\s*/, '<i class="bi bi-arrow-right text-primary me-2"></i>')
                .replace(/^-\s*/, '<i class="bi bi-dash text-muted me-2"></i>')
            );
            
            return (
              <div 
                key={index} 
                className="mb-1 lh-base"
                dangerouslySetInnerHTML={{ __html: formattedLine }}
              />
            );
          })}
      </div>
    );
  };

  const renderSourceCitations = (sources: Source[]) => {
    if (!sources || sources.length === 0) return null;

    const webSources = sources.filter(s => s.type === 'web');
    const notionSources = sources.filter(s => s.type === 'notion');
    const splitfactSources = sources.filter(s => s.type === 'splitfact');

    return (
      <div className="mt-3 pt-3 border-top">
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-bookmark-check text-muted me-2"></i>
          <small className="text-muted fw-semibold">Sources consultées</small>
        </div>
        
        {webSources.length > 0 && (
          <div className="mb-2">
            <div className="d-flex align-items-center mb-1">
              <i className="bi bi-globe text-primary me-2"></i>
              <small className="fw-semibold text-primary">Web ({webSources.length})</small>
            </div>
            {webSources.slice(0, 3).map((source, index) => (
              <div key={index} className="ms-3 mb-1">
                <small className="text-muted">
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                      <i className="bi bi-box-arrow-up-right me-1"></i>
                      {source.title}
                    </a>
                  ) : (
                    source.title
                  )}
                  <span className="badge bg-light text-dark ms-2 small">
                    {Math.round(source.reliability * 100)}% fiable
                  </span>
                </small>
              </div>
            ))}
          </div>
        )}

        {notionSources.length > 0 && (
          <div className="mb-2">
            <div className="d-flex align-items-center mb-1">
              <i className="bi bi-journal-text text-info me-2"></i>
              <small className="fw-semibold text-info">Notion Workspace ({notionSources.length})</small>
            </div>
            {notionSources.slice(0, 3).map((source, index) => (
              <div key={index} className="ms-3 mb-1">
                <small className="text-muted">
                  <i className="bi bi-file-earmark-text me-1"></i>
                  {source.title}
                  <span className="badge bg-light text-dark ms-2 small">
                    {Math.round(source.reliability * 100)}% fiable
                  </span>
                </small>
              </div>
            ))}
          </div>
        )}

        {splitfactSources.length > 0 && (
          <div className="mb-2">
            <div className="d-flex align-items-center mb-1">
              <i className="bi bi-database text-success me-2"></i>
              <small className="fw-semibold text-success">Données Splitfact ({splitfactSources.length})</small>
            </div>
            {splitfactSources.slice(0, 3).map((source, index) => (
              <div key={index} className="ms-3 mb-1">
                <small className="text-muted">
                  <i className="bi bi-graph-up me-1"></i>
                  {source.title}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (status === 'loading') {
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
          <h1 className="h3 mb-0 text-dark">
            <i className="bi bi-robot me-2 text-primary"></i>
            Assistant Fiscal Expert
          </h1>
          <p className="text-muted mb-0">
            Spécialisé Micro-Entrepreneur France • Conseils personnalisés
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Real-time Status Indicators */}
          <div className="d-flex align-items-center gap-3 me-3">
            <SyncStatusIndicator type="web" />
            <SyncStatusIndicator type="notion" />
            
            <div className="d-flex align-items-center">
              <div className="status-dot bg-primary me-2" style={{width: '8px', height: '8px', borderRadius: '50%'}}></div>
              <small className="text-muted">Multi-Agent</small>
              <i className="bi bi-check-circle text-primary ms-1" style={{fontSize: '12px'}}></i>
            </div>
          </div>

          {fiscalContext && (
            <div className="d-flex gap-4">
              <div className="text-end">
                <small className="text-muted">CA Encaissé {new Date().getFullYear()}</small>
                <div className="fw-bold text-success">
                  {userRevenue.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  })}
                </div>
                <small className="text-muted">
                  {fiscalContext.revenue.yearOverYear >= 0 ? '📈' : '📉'} 
                  {fiscalContext.revenue.yearOverYear >= 0 ? '+' : ''}
                  {fiscalContext.revenue.yearOverYear.toFixed(1)}% vs N-1
                </small>
              </div>
              
              <div className="text-end">
                <small className="text-muted">Seuil BNC</small>
                <div className="fw-bold" style={{ 
                  color: fiscalContext.compliance.bncThresholdProgress > 80 ? '#dc3545' : 
                         fiscalContext.compliance.bncThresholdProgress > 60 ? '#fd7e14' : '#198754'
                }}>
                  {fiscalContext.compliance.bncThresholdProgress.toFixed(1)}%
                </div>
                <small className="text-muted">39 100€ limite</small>
              </div>
              
              <div className="text-end">
                <small className="text-muted">Clients actifs</small>
                <div className="fw-bold text-info">
                  {fiscalContext.clients.total}
                </div>
                <small className="text-muted">
                  {fiscalContext.clients.averagePaymentDelay.toFixed(0)}j délai moyen
                </small>
              </div>
            </div>
          ) || (
            <div className="text-end">
              <small className="text-muted">CA Encaissé {new Date().getFullYear()}</small>
              <div className="fw-bold text-success">
                {userRevenue.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 0 
                })}
              </div>
              {userRevenue === 0 && (
                <small className="text-warning">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Aucun paiement reçu
                </small>
              )}
            </div>
          )}
          <div className="vr"></div>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setMessages([{
                role: 'ai', 
                content: "👋 **Bonjour !** Je suis votre Assistant Fiscal Expert spécialisé dans le régime **Micro-Entrepreneur** en France.\n\n🎯 **Je peux vous aider avec :**\n• Seuils et franchises de TVA\n• Cotisations sociales URSSAF\n• Optimisation fiscale\n• Déclarations et obligations\n• Conseil personnalisé selon vos revenus\n\n**Posez-moi votre question ou utilisez les suggestions ci-dessous !**",
                timestamp: new Date()
              }]);
              setShowWelcome(true);
            }}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Nouvelle conversation
          </button>
        </div>
      </div>

      {/* ChatGPT-style Chat Interface */}
      <div 
        className="bg-white rounded-3 shadow-sm d-flex flex-column" 
        style={{ 
          height: 'calc(100vh - 160px)',
          maxHeight: 'calc(100vh - 160px)'
        }}
      >
        {/* Messages Container */}
        <div 
          className="flex-grow-1 overflow-auto"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#e0e0e0 transparent'
          }}
        >
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`py-4 px-4 ${
                msg.role === 'user' ? 'bg-transparent' : 'bg-light bg-opacity-30'
              } ${index < messages.length - 1 ? 'border-bottom' : ''}`}
            >
              <div className="mx-auto" style={{ maxWidth: '900px' }}>
                <div className="d-flex align-items-start gap-3">
                  {/* Avatar */}
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                    style={{ 
                      width: '32px', 
                      height: '32px',
                      backgroundColor: msg.role === 'user' ? '#007bff' : '#6c757d'
                    }}
                  >
                    <i className={`bi ${msg.role === 'user' ? 'bi-person-fill' : 'bi-robot'} text-white`}></i>
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center mb-2">
                      <span className="fw-semibold text-dark">
                        {msg.role === 'user' ? (session?.user?.name || 'Vous') : 'Assistant Fiscal Expert'}
                      </span>
                      {msg.role === 'ai' && (
                        <div className="d-flex gap-1 ms-2">
                          {msg.multiAgent && (
                            <span className="badge bg-primary bg-opacity-10 text-primary small">
                              <i className="bi bi-people-fill me-1"></i>
                              Multi-Agent
                            </span>
                          )}
                          {msg.webSearchUsed && (
                            <span className="badge bg-success bg-opacity-10 text-success small">
                              <i className="bi bi-search me-1"></i>
                              Web
                            </span>
                          )}
                          {msg.notionDataUsed && (
                            <span className="badge bg-info bg-opacity-10 text-info small">
                              <i className="bi bi-journal-text me-1"></i>
                              Notion
                            </span>
                          )}
                          {msg.confidence && (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary small">
                              <i className="bi bi-speedometer me-1"></i>
                              {Math.round(msg.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-muted small ms-2">
                        {msg.timestamp.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    <div 
                      className="text-dark lh-base"
                      style={{ 
                        fontSize: '15px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                      }}
                    >
                      {renderMessage(msg.content, msg)}
                      {msg.role === 'ai' && msg.sources && renderSourceCitations(msg.sources)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form - Fixed at Bottom */}
        <div className="border-top p-4">
          <div className="mx-auto" style={{ maxWidth: '900px' }}>
            {/* Enhanced Capabilities Indicator */}
            <div className="d-flex align-items-center justify-content-center mb-3">
              <div className="d-flex align-items-center gap-3 bg-light bg-opacity-50 rounded-pill px-3 py-1">
                <small className="text-muted">Capacités renforcées :</small>
                <div className="d-flex align-items-center gap-1">
                  <i className="bi bi-search text-success" style={{fontSize: '12px'}}></i>
                  <small className="text-success">Web</small>
                </div>
                {notionStatus?.connected && (
                  <div className="d-flex align-items-center gap-1">
                    <i className="bi bi-journal-text text-info" style={{fontSize: '12px'}}></i>
                    <small className="text-info">Notion</small>
                  </div>
                )}
                <div className="d-flex align-items-center gap-1">
                  <i className="bi bi-people text-primary" style={{fontSize: '12px'}}></i>
                  <small className="text-primary">Multi-Agent</small>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control form-control-lg pe-5 border-2"
                  placeholder={`Assistant Fiscal Expert ${notionStatus?.connected ? '+ Notion' : ''} • Posez votre question sur la fiscalité...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  style={{ 
                    borderRadius: '12px',
                    paddingRight: '60px',
                    fontSize: '14px',
                    minHeight: '48px'
                  }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary position-absolute top-50 end-0 translate-middle-y me-2" 
                  disabled={loading || !input.trim()}
                  style={{
                    borderRadius: '8px',
                    width: '40px',
                    height: '36px',
                    padding: '0'
                  }}
                  title="Envoyer avec Multi-Agent + Web Search"
                >
                  {loading ? (
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                  ) : (
                    <i className="bi bi-send-fill"></i>
                  )}
                </button>
              </div>
            </form>
            {error && (
              <div className="alert alert-danger mt-3 mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      <div className="mt-4">
        <SmartSuggestions context="assistant" />
      </div>

      {/* Quick Actions and Resources - Below Chat */}
      {showWelcome && (
        <div className="mt-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h6 className="mb-0">
                <i className="bi bi-lightning-fill me-2 text-warning"></i>
                Actions Rapides
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {quickActions.map((action, index) => (
                  <div key={index} className="col-lg-3 col-md-6">
                    <button
                      className={`btn btn-outline-${action.color} w-100 text-center h-100 py-3`}
                      onClick={() => handleQuickAction(action.question)}
                    >
                      <i className={`bi ${action.icon} d-block mb-2`} style={{ fontSize: '1.5rem' }}></i>
                      <div className="fw-semibold">{action.title}</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-transparent border-0">
                  <h6 className="mb-0">
                    <i className="bi bi-question-circle me-2 text-info"></i>
                    Questions Fréquentes
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    {faqItems.map((item, index) => (
                      <div key={index} className="col-md-6 mb-3">
                        <button
                          className="btn btn-link text-start w-100 p-3 border text-decoration-none rounded"
                          onClick={() => handleQuickAction(item.question)}
                        >
                          <div className="d-flex align-items-start">
                            <i className="bi bi-arrow-right text-primary me-2 mt-1"></i>
                            <div>
                              <div className="small fw-medium">{item.question}</div>
                              <span className="badge bg-light text-dark mt-1">{item.category}</span>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-transparent border-0">
                  <h6 className="mb-0">
                    <i className="bi bi-lightbulb me-2 text-success"></i>
                    Conseil du Jour
                  </h6>
                </div>
                <div className="card-body">
                  <div className="bg-success bg-opacity-10 rounded p-3">
                    <i className="bi bi-info-circle text-success me-2"></i>
                    <small>
                      <strong>Astuce fiscale :</strong> En tant que micro-entrepreneur, 
                      vous bénéficiez d'une franchise de TVA jusqu'à 39 100€ pour les services. 
                      Surveillez votre CA pour anticiper le basculement !
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sync Notification */}
      {syncNotification?.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <div className={`toast show border-0 shadow-lg`} role="alert">
            <div className={`toast-header bg-${syncNotification.type === 'success' ? 'success' : syncNotification.type === 'error' ? 'danger' : 'info'} text-white border-0`}>
              <i className={`bi ${
                syncNotification.type === 'success' ? 'bi-check-circle-fill' : 
                syncNotification.type === 'error' ? 'bi-exclamation-triangle-fill' : 
                'bi-info-circle-fill'
              } me-2`}></i>
              <strong className="me-auto">Synchronisation</strong>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setSyncNotification(null)}
              ></button>
            </div>
            <div className="toast-body">
              {syncNotification.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}