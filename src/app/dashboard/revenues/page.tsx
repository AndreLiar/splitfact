'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RevenuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [collectives, setCollectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, clientsRes, collectivesRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/clients'),
        fetch('/api/collectives')
      ]);

      if (!invoicesRes.ok || !clientsRes.ok || !collectivesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [invoicesData, clientsData, collectivesData] = await Promise.all([
        invoicesRes.json(),
        clientsRes.json(),
        collectivesRes.json()
      ]);

      setInvoices(invoicesData);
      setClients(clientsData);
      setCollectives(collectivesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate revenue metrics
  const calculateMetrics = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Filter invoices by selected period
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.invoiceDate);
      const invoiceYear = invoiceDate.getFullYear();
      
      if (selectedPeriod === 'year') {
        return invoiceYear === selectedYear;
      } else if (selectedPeriod === 'month') {
        return invoiceYear === selectedYear && invoiceDate.getMonth() === currentMonth;
      } else if (selectedPeriod === 'quarter') {
        const quarter = Math.floor(currentMonth / 3);
        const invoiceQuarter = Math.floor(invoiceDate.getMonth() / 3);
        return invoiceYear === selectedYear && invoiceQuarter === quarter;
      }
      return true;
    });

    const totalRevenue = filteredInvoices.reduce((sum, invoice) => 
      sum + parseFloat(invoice.totalAmount || '0'), 0
    );

    const paidRevenue = filteredInvoices
      .filter(invoice => invoice.paymentStatus === 'paid')
      .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount || '0'), 0);

    const pendingRevenue = filteredInvoices
      .filter(invoice => invoice.paymentStatus === 'pending')
      .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount || '0'), 0);

    const unpaidRevenue = filteredInvoices
      .filter(invoice => invoice.paymentStatus !== 'paid' && invoice.paymentStatus !== 'pending')
      .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount || '0'), 0);

    // Previous period comparison
    const previousPeriodInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.invoiceDate);
      const invoiceYear = invoiceDate.getFullYear();
      
      if (selectedPeriod === 'year') {
        return invoiceYear === selectedYear - 1;
      } else if (selectedPeriod === 'month') {
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return invoiceYear === prevYear && invoiceDate.getMonth() === prevMonth;
      }
      return false;
    });

    const previousRevenue = previousPeriodInvoices.reduce((sum, invoice) => 
      sum + parseFloat(invoice.totalAmount || '0'), 0
    );

    const growthRate = previousRevenue > 0 ? 
      ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Client analysis
    const clientRevenue = clients.map(client => {
      const clientInvoices = filteredInvoices.filter(invoice => invoice.clientId === client.id);
      const revenue = clientInvoices.reduce((sum, invoice) => 
        sum + parseFloat(invoice.totalAmount || '0'), 0
      );
      return { ...client, revenue, invoiceCount: clientInvoices.length };
    }).sort((a, b) => b.revenue - a.revenue);

    // Monthly breakdown for current year
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate.getFullYear() === selectedYear && 
               invoiceDate.getMonth() === index;
      });
      
      return {
        month: new Date(selectedYear, index).toLocaleDateString('fr-FR', { month: 'long' }),
        revenue: monthInvoices.reduce((sum, invoice) => 
          sum + parseFloat(invoice.totalAmount || '0'), 0
        ),
        invoiceCount: monthInvoices.length,
        paidRevenue: monthInvoices
          .filter(invoice => invoice.paymentStatus === 'paid')
          .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount || '0'), 0)
      };
    });

    // BIC/BNC thresholds for micro-entrepreneurs
    const BIC_THRESHOLD = 91900; // Goods
    const BNC_THRESHOLD = 39100; // Services
    const currentThreshold = BNC_THRESHOLD; // Assuming services for now

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      unpaidRevenue,
      previousRevenue,
      growthRate,
      clientRevenue: clientRevenue.slice(0, 10), // Top 10 clients
      monthlyData,
      averageInvoiceValue: filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0,
      invoiceCount: filteredInvoices.length,
      thresholdProgress: (totalRevenue / currentThreshold) * 100,
      thresholdRemaining: Math.max(0, currentThreshold - totalRevenue)
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    });
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-dark">Analyse des Revenus</h1>
          <p className="text-muted mb-0">
            Suivi détaillé de vos performances financières et analyses prédictives
          </p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <select
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ width: 'auto' }}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small mb-1">Chiffre d'Affaires Total</div>
                  <h4 className="fw-bold text-primary mb-0">
                    {formatCurrency(metrics.totalRevenue)}
                  </h4>
                  <div className={`small ${metrics.growthRate >= 0 ? 'text-success' : 'text-danger'}`}>
                    <i className={`bi ${metrics.growthRate >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`}></i>
                    {formatPercentage(metrics.growthRate)} vs période précédente
                  </div>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-graph-up text-primary display-6"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small mb-1">Revenus Encaissés</div>
                  <h4 className="fw-bold text-success mb-0">
                    {formatCurrency(metrics.paidRevenue)}
                  </h4>
                  <div className="small text-muted">
                    {metrics.totalRevenue > 0 ? 
                      Math.round((metrics.paidRevenue / metrics.totalRevenue) * 100) : 0}% du total
                  </div>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-check-circle text-success display-6"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small mb-1">En Attente</div>
                  <h4 className="fw-bold text-warning mb-0">
                    {formatCurrency(metrics.pendingRevenue)}
                  </h4>
                  <div className="small text-muted">
                    {metrics.totalRevenue > 0 ? 
                      Math.round((metrics.pendingRevenue / metrics.totalRevenue) * 100) : 0}% du total
                  </div>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-clock text-warning display-6"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small mb-1">Facture Moyenne</div>
                  <h4 className="fw-bold text-info mb-0">
                    {formatCurrency(metrics.averageInvoiceValue)}
                  </h4>
                  <div className="small text-muted">
                    Sur {metrics.invoiceCount} facture{metrics.invoiceCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-receipt text-info display-6"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Entrepreneur Threshold Alert */}
      {metrics.thresholdProgress > 70 && (
        <div className="alert alert-warning d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>
            <strong>Attention au seuil micro-entrepreneur !</strong>
            <div className="mt-1">
              Vous avez atteint {metrics.thresholdProgress.toFixed(1)}% du seuil BNC (39 100€). 
              Il vous reste {formatCurrency(metrics.thresholdRemaining)} avant dépassement.
            </div>
          </div>
        </div>
      )}

      {/* Charts and Analysis */}
      <div className="row mb-4">
        {/* Monthly Revenue Chart */}
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Évolution Mensuelle {selectedYear}
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Mois</th>
                      <th className="text-end">CA Total</th>
                      <th className="text-end">CA Encaissé</th>
                      <th className="text-end">Factures</th>
                      <th className="text-end">Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.monthlyData.map((month, index) => {
                      const prevMonth = index > 0 ? metrics.monthlyData[index - 1] : null;
                      const growth = prevMonth && prevMonth.revenue > 0 ? 
                        ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;
                      
                      return (
                        <tr key={month.month}>
                          <td className="fw-semibold">{month.month}</td>
                          <td className="text-end">{formatCurrency(month.revenue)}</td>
                          <td className="text-end text-success">{formatCurrency(month.paidRevenue)}</td>
                          <td className="text-end">{month.invoiceCount}</td>
                          <td className="text-end">
                            {index > 0 && (
                              <span className={`badge ${growth >= 0 ? 'bg-success' : 'bg-danger'}`}>
                                {formatPercentage(growth)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="bi bi-trophy me-2"></i>
                Top Clients
              </h5>
            </div>
            <div className="card-body">
              {metrics.clientRevenue.length > 0 ? (
                <div className="list-group list-group-flush">
                  {metrics.clientRevenue.slice(0, 5).map((client, index) => (
                    <div key={client.id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div 
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                            style={{ width: '24px', height: '24px', fontSize: '12px' }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="fw-semibold small">{client.name}</div>
                            <small className="text-muted">{client.invoiceCount} facture{client.invoiceCount !== 1 ? 's' : ''}</small>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold small">{formatCurrency(client.revenue)}</div>
                          <small className="text-muted">
                            {metrics.totalRevenue > 0 ? 
                              Math.round((client.revenue / metrics.totalRevenue) * 100) : 0}%
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-person-badge display-4 mb-2"></i>
                  <p>Aucune donnée client disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Entrepreneur Progress */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="bi bi-speedometer me-2"></i>
                Suivi Seuil Micro-Entrepreneur {selectedYear}
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small fw-semibold">Progression BNC (Services)</span>
                      <span className="small fw-bold">{metrics.thresholdProgress.toFixed(1)}%</span>
                    </div>
                    <div className="progress mb-2" style={{ height: '8px' }}>
                      <div 
                        className={`progress-bar ${
                          metrics.thresholdProgress > 90 ? 'bg-danger' :
                          metrics.thresholdProgress > 70 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min(100, metrics.thresholdProgress)}%` }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>0€</span>
                      <span>{formatCurrency(metrics.totalRevenue)}</span>
                      <span>39 100€</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="bg-light rounded p-3">
                        <div className="h6 mb-1">{formatCurrency(metrics.thresholdRemaining)}</div>
                        <small className="text-muted">Marge restante</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light rounded p-3">
                        <div className="h6 mb-1">
                          {Math.ceil(metrics.thresholdRemaining / (metrics.averageInvoiceValue || 1))}
                        </div>
                        <small className="text-muted">Factures possibles</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Actions Rapides
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <Link href="/dashboard/create-invoice" className="btn btn-primary w-100">
                    <i className="bi bi-plus-circle me-2"></i>
                    Nouvelle Facture
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link href="/dashboard/invoices?status=pending" className="btn btn-warning w-100">
                    <i className="bi bi-clock me-2"></i>
                    Relancer Impayés
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link href="/dashboard/reports" className="btn btn-info w-100">
                    <i className="bi bi-file-earmark-bar-graph me-2"></i>
                    Rapport URSSAF
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link href="/dashboard/clients" className="btn btn-outline-primary w-100">
                    <i className="bi bi-person-plus me-2"></i>
                    Ajouter Client
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}