'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SmartSuggestions from '@/app/dashboard/components/SmartSuggestions';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  multiAgent?: boolean;
}

export default function FiscalAssistantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRevenue, setUserRevenue] = useState<number>(0);
  const [fiscalContext, setFiscalContext] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(true);

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

    // Add typing indicator
    const typingMessage: Message = { role: 'ai', content: '...', timestamp: new Date() };
    setMessages((prevMessages) => [...prevMessages, typingMessage]);

    try {
      const response = await fetch('/api/ai/fiscal-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage.content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI advice');
      }

      const data = await response.json();
      
      // Remove typing indicator and add real response
      setMessages((prevMessages) => {
        const messagesWithoutTyping = prevMessages.slice(0, -1);
        return [...messagesWithoutTyping, { 
          role: 'ai', 
          content: data.advice || "Désolé, je n'ai pas pu générer de réponse.",
          timestamp: new Date(),
          multiAgent: data.context?.multiAgent || false
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

  const renderMessage = (content: string) => {
    if (content === '...') {
      return (
        <div className="py-3">
          <div className="d-flex align-items-center mb-2">
            <div className="spinner-grow spinner-grow-sm me-2 text-primary" role="status"></div>
            <div className="spinner-grow spinner-grow-sm me-2 text-success" role="status"></div>
            <div className="spinner-grow spinner-grow-sm text-warning" role="status"></div>
            <span className="ms-3 text-muted small">Agents spécialisés en cours de traitement...</span>
          </div>
          <div className="small text-muted ps-4">
            <div className="mb-1">
              <i className="bi bi-search text-primary me-2"></i>
              <span>Analyste Fiscal : Analyse des données...</span>
            </div>
            <div className="mb-1">
              <i className="bi bi-shield-check text-success me-2"></i>
              <span>Évaluateur de Risques : Identification des alertes...</span>
            </div>
            <div>
              <i className="bi bi-lightbulb text-warning me-2"></i>
              <span>Expert Fiscal : Génération des conseils...</span>
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
                      {msg.multiAgent && (
                        <span className="badge bg-primary bg-opacity-10 text-primary ms-2 small">
                          <i className="bi bi-people-fill me-1"></i>
                          Multi-Agent
                        </span>
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
                      {renderMessage(msg.content)}
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
            <form onSubmit={handleSubmit}>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control form-control-lg pe-5 border-2"
                  placeholder="Posez votre question sur la fiscalité micro-entrepreneur..."
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
    </div>
  );
}