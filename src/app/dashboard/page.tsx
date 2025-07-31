'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import SimulateurAutoEntrepreneur from '@/app/dashboard/components/SimulateurAutoEntrepreneur';
import AsyncFiscalHealthWidget from '@/app/dashboard/components/AsyncFiscalHealthWidget';
import AsyncProactiveInsightsWidget from '@/app/dashboard/components/AsyncProactiveInsightsWidget';
import AsyncSmartSuggestions from '@/app/dashboard/components/AsyncSmartSuggestions';
import { formatCurrency, formatCurrencyRobust } from '@/lib/utils';
import PerformanceMonitor from '@/app/dashboard/components/PerformanceMonitor';
import FeedbackButton from '@/app/components/FeedbackButton';

interface Collective {
  id: string;
  name: string;
  createdAt: string;
}

interface UserInvoice {
  id: string;
  totalAmount: number;
  dueDate: string;
  paymentStatus: string;
  client: { name: string };
  collective: { name: string };
  shares: { calculatedAmount: number; userId: string }[];
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [collectives, setCollectives] = useState<Collective[]>([])
  const [userInvoices, setUserInvoices] = useState<UserInvoice[]>([])
  const [allUserInvoices, setAllUserInvoices] = useState<UserInvoice[]>([]); // For revenue calculation (all invoices)
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage] = useState(5); // You can make this configurable if needed
  const [loading, setLoading] = useState(true)
  const [revenueLoading, setRevenueLoading] = useState(true) // Separate loading for revenue calculation
  const [error, setError] = useState<string | null>(null)

  // AI Assistant state
  const [aiQuery, setAiQuery] = useState("")
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [tvaAlertMessage, setTvaAlertMessage] = useState<string | null>(null); // New state for TVA alert

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchCollectives();
      fetchUserInvoices(currentPage, invoicesPerPage);
      // Fetch ALL invoices for revenue calculation (only once)
      if (allUserInvoices.length === 0) {
        fetchAllUserInvoices();
      }
      fetchReceivedSubInvoices().then(data => {
        setReceivedSubInvoices(data);
      });
    }
  }, [status, router, currentPage, invoicesPerPage]);

  const [receivedSubInvoices, setReceivedSubInvoices] = useState<any[]>([]);

  const fetchCollectives = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/collectives")
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }
      const data = await response.json()
      setCollectives(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInvoices = async (page: number, limit: number) => {
    try {
      const response = await fetch(`/api/users/me/invoices?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setUserInvoices(data.invoices);
      setTotalInvoices(data.totalCount);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch ALL user invoices for accurate revenue calculation
  const fetchAllUserInvoices = async () => {
    try {
      setRevenueLoading(true);
      const response = await fetch(`/api/users/me/invoices?all=true`); // New parameter to get all invoices
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setAllUserInvoices(data.invoices);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchReceivedSubInvoices = async () => {
    try {
      const response = await fetch("/api/sub-invoices"); // Assuming this endpoint fetches sub-invoices where the user is the receiver
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      // You might want to store these in a separate state or combine them with userInvoices
      // For now, let's just use them for totalRevenue calculation
      return data;
    } catch (err: any) {
      console.error("Error fetching received sub-invoices:", err);
      return [];
    }
  };

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setAiError(null)
    setAiResponse(null)
    try {
      const response = await fetch("/api/ai/fiscal-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: aiQuery }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const data = await response.json()
      setAiResponse(data.advice)
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>
  }

  if (error) {
    return <div className="alert alert-danger">Erreur: {error}</div>
  }

  // Calculate revenue breakdown by payment status using ALL invoices
  const revenueBreakdown = allUserInvoices.reduce((acc, invoice) => {
    let invoiceAmount = 0;
    if (invoice.collective && invoice.shares && invoice.shares.length > 0) {
      const userShare = invoice.shares.find((share: any) => share.userId === session?.user?.id);
      invoiceAmount = userShare ? Number(userShare.calculatedAmount) : 0;
    } else {
      invoiceAmount = Number(invoice.totalAmount);
    }

    if (invoice.paymentStatus === 'paid') {
      acc.received += invoiceAmount;
    } else {
      acc.unpaid += invoiceAmount;
    }
    acc.total += invoiceAmount;
    return acc;
  }, { received: 0, unpaid: 0, total: 0 });

  // Add received sub-invoices to received amount
  const subInvoicesAmount = receivedSubInvoices.reduce((sum, subInvoice) => sum + Number(subInvoice.amount), 0);
  revenueBreakdown.received += subInvoicesAmount;
  revenueBreakdown.total += subInvoicesAmount;

  const totalRevenue = revenueBreakdown.total;
  const activeCollectivesCount = collectives.length;
  const pendingInvoicesCount = userInvoices.filter(invoice => invoice.dueDate && new Date(invoice.dueDate) > new Date()).length;

  

  return (
    <div className="container-fluid py-3 py-lg-4">
      <h1 className="mb-3 text-darkGray">Tableau de bord</h1>

      {/* Summary Cards */}
      <div className="row mb-4 g-3">
        {/* Total Revenue Card */}
        <div className="col-lg-4 col-md-6 col-12">
          <div className="card dashboard-stat-card shadow-sm border-0 h-100">
            <div className="dashboard-stat-icon bg-primary bg-opacity-10">
              <i className="bi bi-graph-up text-primary fs-4"></i>
            </div>
            <div className="dashboard-stat-label">Revenus totaux</div>
            {revenueLoading ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="fs-6 text-mediumGray mb-0">Calcul en cours...</p>
              </div>
            ) : (
              <div className="dashboard-stat-value text-primary">{formatCurrency(totalRevenue)}</div>
            )}
          </div>
        </div>

        {/* Received Money Card */}
        <div className="col-lg-4 col-md-6 col-12">
          <div className="card dashboard-stat-card shadow-sm border-0 h-100">
            <div className="dashboard-stat-icon bg-success bg-opacity-10">
              <i className="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div className="dashboard-stat-label">Montants reçus</div>
            {revenueLoading ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm text-success me-2" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="fs-6 text-mediumGray mb-0">Calcul en cours...</p>
              </div>
            ) : (
              <>
                <div className="dashboard-stat-value text-success">{formatCurrency(revenueBreakdown.received)}</div>
                <small className="text-muted">
                  {totalRevenue > 0 ? Math.round((revenueBreakdown.received / totalRevenue) * 100) : 0}% du total
                </small>
              </>
            )}
          </div>
        </div>

        {/* Unpaid Money Card */}
        <div className="col-lg-4 col-md-12 col-12">
          <div className="card dashboard-stat-card shadow-sm border-0 h-100">
            <div className="dashboard-stat-icon bg-warning bg-opacity-10">
              <i className="bi bi-clock-history text-warning fs-4"></i>
            </div>
            <div className="dashboard-stat-label">En attente de paiement</div>
            {revenueLoading ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm text-warning me-2" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="fs-6 text-mediumGray mb-0">Calcul en cours...</p>
              </div>
            ) : (
              <>
                <p className="fs-3 fw-semibold text-warning mb-1">{formatCurrency(revenueBreakdown.unpaid)}</p>
                <small className="text-mediumGray">
                  {totalRevenue > 0 ? Math.round((revenueBreakdown.unpaid / totalRevenue) * 100) : 0}% du total
                </small>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Smart Suggestions - Async loaded */}
      <div className="row mb-3">
        <div className="col-12">
          <AsyncSmartSuggestions 
            context="dashboard" 
            enableLazyLoading={true}
            debounceMs={1000}
            timeout={15000}
          />
        </div>
      </div>

      {/* AI-Powered Insights Row - Async loaded with lazy loading */}
      <div className="row mb-3 g-3">
        <div className="col-lg-6">
          <AsyncFiscalHealthWidget 
            enableLazyLoading={true}
            timeout={25000}
          />
        </div>
        <div className="col-lg-6">
          <AsyncProactiveInsightsWidget 
            enableLazyLoading={true}
            timeout={30000}
          />
        </div>
      </div>

      {/* Payment Status Overview */}
      <div className="row mb-3 g-3">
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-xl p-4">
            <h3 className="h5 text-darkGray mb-3 d-flex align-items-center">
              <i className="bi bi-pie-chart me-2 text-primary"></i>
              Répartition des paiements
            </h3>
            {revenueLoading ? (
              <div className="d-flex align-items-center justify-content-center py-3">
                <div className="spinner-border text-primary me-2" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <span className="text-mediumGray">Calcul en cours...</span>
              </div>
            ) : (
              <div>
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="progress" style={{ height: '20px', borderRadius: '10px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{ 
                        width: totalRevenue > 0 ? `${(revenueBreakdown.received / totalRevenue) * 100}%` : '0%',
                        borderRadius: '10px 0 0 10px'
                      }}
                      aria-valuenow={totalRevenue > 0 ? Math.round((revenueBreakdown.received / totalRevenue) * 100) : 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                    <div 
                      className="progress-bar bg-warning" 
                      role="progressbar" 
                      style={{ 
                        width: totalRevenue > 0 ? `${(revenueBreakdown.unpaid / totalRevenue) * 100}%` : '0%',
                        borderRadius: '0 10px 10px 0'
                      }}
                      aria-valuenow={totalRevenue > 0 ? Math.round((revenueBreakdown.unpaid / totalRevenue) * 100) : 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>

                {/* Legend */}
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                      <span className="text-mediumGray small me-2">Reçu:</span>
                      <span className="fw-semibold text-success">
                        {formatCurrency(revenueBreakdown.received)}
                        {totalRevenue > 0 && (
                          <span className="text-mediumGray ms-1">
                            ({Math.round((revenueBreakdown.received / totalRevenue) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center">
                      <div className="bg-warning rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                      <span className="text-mediumGray small me-2">En attente:</span>
                      <span className="fw-semibold text-warning">
                        {formatCurrency(revenueBreakdown.unpaid)}
                        {totalRevenue > 0 && (
                          <span className="text-mediumGray ms-1">
                            ({Math.round((revenueBreakdown.unpaid / totalRevenue) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Row */}
      <div className="row mb-3 g-3">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100 hover-lift position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 mt-2 me-2">
              <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                <i className="bi bi-people text-primary fs-4"></i>
              </div>
            </div>
            <div className="d-flex flex-column h-100">
              <h3 className="h6 text-muted mb-2 fw-normal">Collectifs actifs</h3>
              <div className="d-flex align-items-end justify-content-between">
                <span className="display-6 fw-bold text-dark">{activeCollectivesCount}</span>
                <div className="text-end">
                  <small className="text-success d-block">
                    <i className="bi bi-arrow-up me-1"></i>
                    +12% ce mois
                  </small>
                  <Link href="/dashboard/collectives" className="btn btn-sm btn-outline-primary mt-2">
                    <i className="bi bi-eye me-1"></i>
                    Voir tout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100 hover-lift position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 mt-2 me-2">
              <div className="bg-danger bg-opacity-10 rounded-circle p-2">
                <i className="bi bi-exclamation-triangle text-danger fs-4"></i>
              </div>
            </div>
            <div className="d-flex flex-column h-100">
              <h3 className="h6 text-muted mb-2 fw-normal">Factures en retard</h3>
              <div className="d-flex align-items-end justify-content-between">
                <span className="display-6 fw-bold text-danger">{pendingInvoicesCount}</span>
                <div className="text-end">
                  <small className="text-muted d-block">
                    <i className="bi bi-clock me-1"></i>
                    Action requise
                  </small>
                  <Link href="/dashboard/invoices?filter=overdue" className="btn btn-sm btn-outline-danger mt-2">
                    <i className="bi bi-arrow-right me-1"></i>
                    Relancer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100 hover-lift position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 mt-2 me-2">
              <div className="bg-info bg-opacity-10 rounded-circle p-2">
                <i className="bi bi-graph-up text-info fs-4"></i>
              </div>
            </div>
            <div className="d-flex flex-column h-100">
              <h3 className="h6 text-muted mb-2 fw-normal">Croissance mensuelle</h3>
              <div className="d-flex align-items-end justify-content-between">
                <span className="display-6 fw-bold text-info">+18%</span>
                <div className="text-end">
                  <small className="text-success d-block">
                    <i className="bi bi-trending-up me-1"></i>
                    Très bon
                  </small>
                  <Link href="/dashboard/revenues" className="btn btn-sm btn-outline-info mt-2">
                    <i className="bi bi-bar-chart me-1"></i>
                    Analyser
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics + AI Assistant */}
      <div className="row mb-4 g-3">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="h5 text-dark mb-1 fw-semibold">Évolution des revenus</h3>
                <p className="text-muted small mb-0">6 derniers mois • Progression mensuelle</p>
              </div>
              <div className="dropdown">
                <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  <i className="bi bi-calendar3 me-1"></i>
                  6 mois
                </button>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#">3 mois</a></li>
                  <li><a className="dropdown-item active" href="#">6 mois</a></li>
                  <li><a className="dropdown-item" href="#">12 mois</a></li>
                </ul>
              </div>
            </div>
            
            {/* Enhanced Revenue Chart Placeholder */}
            <div className="position-relative" style={{ minHeight: '280px' }}>
              <div className="bg-gradient-light rounded-3 p-4 h-100 d-flex flex-column justify-content-center align-items-center">
                <div className="text-center mb-3">
                  <i className="bi bi-graph-up display-4 text-primary mb-3"></i>
                  <h6 className="text-dark mb-2">Graphique des revenus</h6>
                  <p className="text-muted small mb-0">Visualisation interactive des performances</p>
                </div>
                
                {/* Mock data preview */}
                <div className="row w-100 text-center">
                  <div className="col-2">
                    <div className="bg-primary bg-opacity-10 rounded p-2 mb-1">
                      <small className="text-muted d-block">Jan</small>
                      <strong className="text-primary">4.2K€</strong>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="bg-success bg-opacity-10 rounded p-2 mb-1">
                      <small className="text-muted d-block">Fév</small>
                      <strong className="text-success">6.8K€</strong>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="bg-info bg-opacity-10 rounded p-2 mb-1">
                      <small className="text-muted d-block">Mar</small>
                      <strong className="text-info">5.1K€</strong>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="bg-warning bg-opacity-10 rounded p-2 mb-1">
                      <small className="text-muted d-block">Avr</small>
                      <strong className="text-warning">7.9K€</strong>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="bg-purple bg-opacity-10 rounded p-2 mb-1">
                      <small className="text-muted d-block">Mai</small>
                      <strong className="text-purple">9.2K€</strong>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="bg-danger bg-opacity-10 rounded p-2 mb-1">
                      <small className="text-muted d-block">Juin</small>
                      <strong className="text-danger">12.1K€</strong>
                    </div>
                  </div>
                </div>
                
                <Link href="/dashboard/revenues" className="btn btn-outline-primary btn-sm mt-3">
                  <i className="bi bi-bar-chart me-1"></i>
                  Voir l'analyse complète
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100">
            <div className="text-center mb-4">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-robot text-primary fs-3"></i>
              </div>
              <h3 className="h5 fw-semibold text-dark mb-2">Assistant IA Fiscal</h3>
              <p className="text-muted small mb-0">Conseils personnalisés pour micro-entrepreneurs</p>
            </div>
            
            <form onSubmit={handleAiQuery} className="mb-3">
              <div className="mb-3">
                <textarea
                  className="form-control border-2 rounded-3" 
                  style={{ minHeight: '100px', resize: 'none' }}
                  rows={4}
                  placeholder="💡 Ex: Comment optimiser mes cotisations URSSAF ?"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 rounded-3 py-2"
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Obtenir des conseils
                  </>
                )}
              </button>
            </form>
            
            {aiError && (
              <div className="alert alert-danger rounded-3 py-2">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <small>{aiError}</small>
              </div>
            )}
            
            {aiResponse && (
              <div className="bg-success bg-opacity-10 rounded-3 p-3">
                <div className="d-flex align-items-start mb-2">
                  <i className="bi bi-lightbulb-fill text-success me-2 mt-1"></i>
                  <h6 className="fw-semibold text-dark mb-0">Conseil personnalisé</h6>
                </div>
                <p className="text-dark small mb-2 lh-base">{aiResponse}</p>
                <Link href="/dashboard/assistant" className="btn btn-sm btn-outline-success">
                  <i className="bi bi-chat-dots me-1"></i>
                  Conversation complète
                </Link>
              </div>
            )}
            
            {!aiResponse && !aiError && (
              <div className="text-center">
                <div className="bg-light rounded-3 p-3">
                  <i className="bi bi-chat-square-dots text-muted fs-4 mb-2"></i>
                  <p className="text-muted small mb-0">Posez votre première question pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Entrepreneur Simulator */}
      <SimulateurAutoEntrepreneur onTvaStatusChange={setTvaAlertMessage} />

      {/* TVA Alert Display */}
      {tvaAlertMessage && tvaAlertMessage !== "Sous les seuils" && (
        <div className={`alert ${tvaAlertMessage.includes("dépassé") ? 'alert-danger' : 'alert-warning'} mt-3`}>
          <strong>Alerte TVA:</strong> {tvaAlertMessage}
        </div>
      )}

      {/* Enhanced Invoice Tables */}
      <div className="row mb-4 g-3">
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-xl p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="h5 text-dark mb-1 fw-semibold">
                  <i className="bi bi-receipt me-2 text-primary"></i>
                  Factures Émises
                </h3>
                <p className="text-muted small mb-0">{userInvoices.length} facture{userInvoices.length > 1 ? 's' : ''} • Dernière mise à jour il y a 5 min</p>
              </div>
              <div className="d-flex gap-2">
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i className="bi bi-funnel me-1"></i>
                    Filtrer
                  </button>
                  <ul className="dropdown-menu">
                    <li><a className="dropdown-item" href="#">Toutes</a></li>
                    <li><a className="dropdown-item" href="#">Payées</a></li>
                    <li><a className="dropdown-item" href="#">En attente</a></li>
                    <li><a className="dropdown-item" href="#">En retard</a></li>
                  </ul>
                </div>
                <Link href="/dashboard/create-invoice" className="btn btn-sm btn-primary">
                  <i className="bi bi-plus-circle me-1"></i>
                  Nouvelle facture
                </Link>
              </div>
            </div>
            {userInvoices.length === 0 ? (
              <div className="text-center py-5">
                <div className="bg-light rounded-3 p-4 d-inline-block mb-3">
                  <i className="bi bi-receipt display-4 text-muted"></i>
                </div>
                <h6 className="text-dark mb-2">Aucune facture émise</h6>
                <p className="text-muted small mb-3">Créez votre première facture pour commencer à suivre vos revenus</p>
                <Link href="/dashboard/create-invoice" className="btn btn-primary rounded-3">
                  <i className="bi bi-plus-circle me-2"></i>
                  Créer une facture maintenant
                </Link>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light">
                          <i className="bi bi-hash me-1"></i>ID
                        </th>
                        <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light">
                          <i className="bi bi-person me-1"></i>Client
                        </th>
                        <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light">
                          <i className="bi bi-people me-1"></i>Collectif
                        </th>
                        <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light text-end">
                          <i className="bi bi-currency-euro me-1"></i>Montant
                        </th>
                        <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light text-end">
                          <i className="bi bi-check-circle me-1"></i>Statut
                        </th>
                        <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userInvoices.map((invoice, index) => (
                        <tr key={invoice.id} className="border-0">
                          <td className="py-3 border-0">
                            <code className="text-primary small">{invoice.id.substring(0, 8)}...</code>
                          </td>
                          <td className="py-3 border-0">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                                <i className="bi bi-building text-primary small"></i>
                              </div>
                              <div>
                                <div className="fw-semibold text-dark small">{invoice.client?.name}</div>
                                <div className="text-muted small">{(invoice.client as any)?.email || 'Email non fourni'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 border-0">
                            {invoice.collective?.name ? (
                              <span className="badge bg-info bg-opacity-10 text-info rounded-3 px-2 py-1">
                                <i className="bi bi-people me-1"></i>
                                {invoice.collective.name}
                              </span>
                            ) : (
                              <span className="text-muted small">
                                <i className="bi bi-dash"></i> Individuel
                              </span>
                            )}
                          </td>
                          <td className="py-3 border-0 text-end">
                            <span className="fw-bold text-dark">
                              {invoice.collective && invoice.shares && invoice.shares.length > 0
                                ? formatCurrencyRobust(invoice.shares.find((share: any) => share.userId === session?.user?.id)?.calculatedAmount || 0)
                                : formatCurrencyRobust(invoice.totalAmount)
                              }
                            </span>
                          </td>
                          <td className="py-3 border-0 text-end">
                            <span className={`badge rounded-3 px-3 py-2 ${
                              invoice.paymentStatus === 'paid'
                                ? 'bg-success bg-opacity-10 text-success'
                                : (new Date(invoice.dueDate) < new Date() ? 'bg-danger bg-opacity-10 text-danger' : 'bg-warning bg-opacity-10 text-warning')
                            }`}>
                              <i className={`bi ${
                                invoice.paymentStatus === 'paid' 
                                  ? 'bi-check-circle-fill' 
                                  : (new Date(invoice.dueDate) < new Date() ? 'bi-exclamation-triangle-fill' : 'bi-clock-fill')
                              } me-1`}></i>
                              {invoice.paymentStatus === 'paid'
                                ? "Payée"
                                : (new Date(invoice.dueDate) < new Date() ? "En retard" : "En attente")
                              }
                            </span>
                          </td>
                          <td className="py-3 border-0 text-end">
                            <div className="dropdown">
                              <button className="btn btn-sm btn-outline-secondary rounded-3" type="button" data-bs-toggle="dropdown">
                                <i className="bi bi-three-dots"></i>
                              </button>
                              <ul className="dropdown-menu">
                                <li>
                                  <Link href={`/dashboard/invoices/${invoice.id}`} className="dropdown-item">
                                    <i className="bi bi-eye me-2"></i>Voir détails
                                  </Link>
                                </li>
                                <li>
                                  <a className="dropdown-item" href="#">
                                    <i className="bi bi-download me-2"></i>Télécharger PDF
                                  </a>
                                </li>
                                {invoice.paymentStatus !== 'paid' && (
                                  <li>
                                    <a className="dropdown-item text-primary" href="#">
                                      <i className="bi bi-envelope me-2"></i>Relancer client
                                    </a>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {totalInvoices > invoicesPerPage && (
              <div className="d-flex justify-content-center mt-4 pt-3 border-top">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link rounded-start-3" onClick={() => setCurrentPage(currentPage - 1)}>
                        <i className="bi bi-chevron-left"></i>
                        Précédent
                      </button>
                    </li>
                    {[...Array(Math.ceil(totalInvoices / invoicesPerPage))].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === Math.ceil(totalInvoices / invoicesPerPage) ? 'disabled' : ''}`}>
                      <button className="page-link rounded-end-3" onClick={() => setCurrentPage(currentPage + 1)}>
                        Suivant
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="row mb-4 g-3">
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-xl p-4 bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="d-flex justify-content-between align-items-center text-white">
              <div>
                <h3 className="h5 mb-2 fw-semibold d-flex align-items-center">
                  <i className="bi bi-heart me-2"></i>
                  Votre avis nous intéresse !
                </h3>
                <p className="mb-0 opacity-90">
                  Aidez-nous à améliorer Splitfact en partageant votre expérience. 
                  Vos commentaires sont précieux pour notre équipe.
                </p>
              </div>
              <div className="text-end">
                <FeedbackButton 
                  variant="primary" 
                  size="md"
                  className="bg-white text-primary border-0 shadow-sm"
                  showText={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Sub-Invoices Table */}
      <div className="card shadow-sm border-0 rounded-xl p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="h5 text-dark mb-1 fw-semibold">
              <i className="bi bi-files me-2 text-success"></i>
              Sous-Factures Reçues
            </h3>
            <p className="text-muted small mb-0">{receivedSubInvoices.length} sous-facture{receivedSubInvoices.length > 1 ? 's' : ''} reçue{receivedSubInvoices.length > 1 ? 's' : ''}</p>
          </div>
          <Link href="/dashboard/sub-invoices" className="btn btn-sm btn-outline-success">
            <i className="bi bi-eye me-1"></i>
            Voir toutes
          </Link>
        </div>
        {receivedSubInvoices.length === 0 ? (
          <div className="text-center py-5">
            <div className="bg-light rounded-3 p-4 d-inline-block mb-3">
              <i className="bi bi-files display-4 text-muted"></i>
            </div>
            <h6 className="text-dark mb-2">Aucune sous-facture reçue</h6>
            <p className="text-muted small mb-3">Les sous-factures reçues des projets collaboratifs apparaîtront ici</p>
            <Link href="/dashboard/collectives" className="btn btn-outline-primary rounded-3">
              <i className="bi bi-people me-2"></i>
              Rejoindre un collectif
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light">
                    <i className="bi bi-hash me-1"></i>ID
                  </th>
                  <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light">
                    <i className="bi bi-person-check me-1"></i>Émetteur
                  </th>
                  <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light">
                    <i className="bi bi-link-45deg me-1"></i>Facture Parent
                  </th>
                  <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light text-end">
                    <i className="bi bi-currency-euro me-1"></i>Montant
                  </th>
                  <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light text-end">
                    <i className="bi bi-check-square me-1"></i>Statut
                  </th>
                  <th scope="col" className="text-muted text-uppercase small fw-semibold border-0 bg-light text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivedSubInvoices.map((subInvoice) => (
                  <tr key={subInvoice.id} className="border-0">
                    <td className="py-3 border-0">
                      <code className="text-success small">{subInvoice.id.substring(0, 8)}...</code>
                    </td>
                    <td className="py-3 border-0">
                      <div className="d-flex align-items-center">
                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-2">
                          <i className="bi bi-person text-success small"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark small">{subInvoice.issuer?.name || 'Nom non fourni'}</div>
                          <div className="text-muted small">{subInvoice.issuer?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 border-0">
                      <div>
                        <span className="fw-semibold text-dark small d-block">{subInvoice.parentInvoice?.invoiceNumber}</span>
                        <span className="badge bg-info bg-opacity-10 text-info rounded-3 px-2 py-1 small">
                          <i className="bi bi-people me-1"></i>
                          {subInvoice.parentInvoice?.collective?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 border-0 text-end">
                      <span className="fw-bold text-dark">
                        {formatCurrencyRobust(subInvoice.amount)}
                      </span>
                    </td>
                    <td className="py-3 border-0 text-end">
                      <span className={`badge rounded-3 px-3 py-2 ${
                        subInvoice.status === 'paid' 
                          ? 'bg-success bg-opacity-10 text-success' 
                          : 'bg-secondary bg-opacity-10 text-secondary'
                      }`}>
                        <i className={`bi ${
                          subInvoice.status === 'paid' ? 'bi-check-circle-fill' : 'bi-pencil-fill'
                        } me-1`}></i>
                        {subInvoice.status === 'paid' ? 'Payée' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="py-3 border-0 text-end">
                      <Link 
                        href={`/dashboard/sub-invoices/${subInvoice.id}`} 
                        className="btn btn-sm btn-outline-secondary rounded-3"
                      >
                        <i className="bi bi-eye"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Monitor - Only in development */}
      {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
    </div>
  )
}
