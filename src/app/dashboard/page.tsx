'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import PWAInstallPrompt from "@/app/components/PWAInstallPrompt";

interface Collective {
  id: string;
  name: string;
}

interface InvoiceShare {
  calculatedAmount: number;
  userId: string;
}

interface UserInvoice {
  id: string;
  invoiceNumber?: string;
  totalAmount: number;
  invoiceDate: string;
  dueDate: string;
  status: string;
  paymentStatus: string;
  client?: { name: string | null };
  collective?: { name: string | null } | null;
  shares?: InvoiceShare[];
}

interface SubInvoice {
  id: string;
  amount: number;
  status: string;
  issuer?: { name?: string | null };
  parentInvoice?: { invoiceNumber?: string | null };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collectives, setCollectives] = useState<Collective[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<UserInvoice[]>([]);
  const [allInvoices, setAllInvoices] = useState<UserInvoice[]>([]);
  const [subInvoices, setSubInvoices] = useState<SubInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      void loadDashboard();
    }
  }, [status, router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [collectivesResponse, recentInvoicesResponse, allInvoicesResponse, subInvoicesResponse, clientsResponse] = await Promise.all([
        fetch("/api/collectives"),
        fetch("/api/users/me/invoices?page=1&limit=6"),
        fetch("/api/users/me/invoices?all=true"),
        fetch("/api/sub-invoices"),
        fetch("/api/clients"),
      ]);

      if (!collectivesResponse.ok || !recentInvoicesResponse.ok || !allInvoicesResponse.ok || !subInvoicesResponse.ok) {
        throw new Error("Impossible de charger le tableau de bord.");
      }

      const collectivesData = await collectivesResponse.json();
      const recentInvoicesData = await recentInvoicesResponse.json();
      const allInvoicesData = await allInvoicesResponse.json();
      const subInvoicesData = await subInvoicesResponse.json();
      const clientsData = clientsResponse.ok ? await clientsResponse.json() : [];

      const hasClients = Array.isArray(clientsData) ? clientsData.length > 0 : (clientsData?.clients?.length ?? 0) > 0;
      const hasInvoices = (allInvoicesData.invoices?.length ?? 0) > 0;

      if (!hasClients && !hasInvoices) {
        router.push("/dashboard/onboarding");
        return;
      }

      setCollectives(collectivesData);
      setRecentInvoices(recentInvoicesData.invoices || []);
      setAllInvoices(allInvoicesData.invoices || []);
      setSubInvoices(subInvoicesData || []);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const invoiceAmountForUser = (invoice: UserInvoice) => {
    if (invoice.collective && invoice.shares && invoice.shares.length > 0) {
      const share = invoice.shares.find((item) => item.userId === session?.user?.id);
      return Number(share?.calculatedAmount || 0);
    }

    return Number(invoice.totalAmount || 0);
  };

  const metrics = useMemo(() => {
    const today = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(today.getDate() + 7);

    const totals = allInvoices.reduce(
      (acc, invoice) => {
        const amount = invoiceAmountForUser(invoice);

        acc.total += amount;

        if (invoice.paymentStatus === "paid") {
          acc.received += amount;
        } else {
          acc.pending += amount;
        }

        if (invoice.status === "draft") {
          acc.drafts += 1;
        }

        const dueDate = new Date(invoice.dueDate);
        if (invoice.paymentStatus !== "paid" && dueDate < today) {
          acc.overdue += 1;
        }

        if (invoice.paymentStatus !== "paid" && dueDate >= today && dueDate <= inSevenDays) {
          acc.dueSoon += 1;
        }

        return acc;
      },
      { total: 0, received: 0, pending: 0, drafts: 0, overdue: 0, dueSoon: 0 }
    );

    const subInvoiceTotal = subInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      ...totals,
      received: totals.received + subInvoiceTotal,
      total: totals.total + subInvoiceTotal,
      collectives: collectives.length,
      subInvoices: subInvoices.length,
    };
  }, [allInvoices, collectives.length, subInvoices, session?.user?.id]);

  if (status === "loading" || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">Erreur: {error}</div>;
  }

  return (
    <div className="container-fluid py-3 py-lg-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h1 className="mb-2 text-darkGray">
            <i className="bi bi-grid-1x2-fill me-3 text-primary"></i>
            Cockpit de facturation
          </h1>
          <p className="text-muted mb-0">
            Suivez vos factures, vos encaissements et les points de blocage avant émission.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link href="/dashboard/create-invoice" className="btn btn-primary">
            <i className="bi bi-file-earmark-plus me-2"></i>
            Nouvelle facture
          </Link>
          <Link href="/dashboard/clients" className="btn btn-outline-primary">
            <i className="bi bi-person-vcard me-2"></i>
            Gérer les clients
          </Link>
        </div>
      </div>

      <div className="d-none d-lg-block mb-4">
        <PWAInstallPrompt />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card h-100 p-4 stat-card-primary">
            <div className="section-label mb-2">Volume facturé</div>
            <div className="metric-value text-primary">{formatCurrency(metrics.total)}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card h-100 p-4 stat-card-success">
            <div className="section-label mb-2">Encaissements</div>
            <div className="metric-value text-success">{formatCurrency(metrics.received)}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card h-100 p-4 stat-card-warning">
            <div className="section-label mb-2">En attente</div>
            <div className="metric-value text-warning">{formatCurrency(metrics.pending)}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card h-100 p-4 stat-card-secondary">
            <div className="section-label mb-2">Collectifs actifs</div>
            <div className="metric-value">{metrics.collectives}</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100">
            <h2 className="h5 mb-3">État du workflow</h2>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Brouillons à compléter</span>
              <strong>{metrics.drafts}</strong>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Factures à risque</span>
              <strong className="text-danger">{metrics.overdue}</strong>
            </div>
            <div className="d-flex justify-content-between py-2">
              <span className="text-muted">Échéance sous 7 jours</span>
              <strong className="text-warning">{metrics.dueSoon}</strong>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100">
            <h2 className="h5 mb-3">Actions prioritaires</h2>
            <div className="d-grid gap-2">
              <Link href="/dashboard/create-invoice" className="btn btn-outline-primary text-start">
                <i className="bi bi-arrow-right-circle me-2"></i>
                Créer une nouvelle facture
              </Link>
              <Link href="/dashboard/invoices" className="btn btn-outline-primary text-start">
                <i className="bi bi-arrow-right-circle me-2"></i>
                Revoir les factures en attente
              </Link>
              <Link href="/dashboard/clients" className="btn btn-outline-primary text-start">
                <i className="bi bi-arrow-right-circle me-2"></i>
                Vérifier les données client
              </Link>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100">
            <h2 className="h5 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-danger"></i>
              Relances à faire
            </h2>
            {metrics.overdue === 0 && metrics.dueSoon === 0 ? (
              <p className="text-muted small mb-0">
                <i className="bi bi-check-circle text-success me-1"></i>
                Aucune facture en retard ou à relancer.
              </p>
            ) : (
              <>
                {metrics.overdue > 0 && (
                  <div className="alert alert-danger py-2 mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span><strong>{metrics.overdue}</strong> facture{metrics.overdue > 1 ? 's' : ''} en retard</span>
                  </div>
                )}
                {metrics.dueSoon > 0 && (
                  <div className="alert alert-warning py-2 mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-hourglass-split"></i>
                    <span><strong>{metrics.dueSoon}</strong> facture{metrics.dueSoon > 1 ? 's' : ''} à échéance sous 7j</span>
                  </div>
                )}
                <Link href="/dashboard/invoices?paymentStatus=pending" className="btn btn-sm btn-outline-danger">
                  Voir les factures à relancer
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-xl p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="h5 mb-1">Factures récentes</h2>
            <p className="text-muted small mb-0">Vos dernières factures créées ou en cours de suivi.</p>
          </div>
          <Link href="/dashboard/invoices" className="btn btn-sm btn-outline-primary">
            Voir toutes les factures
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-5">
            <div className="bg-light rounded-3 p-4 d-inline-block mb-3">
              <i className="bi bi-receipt display-4 text-muted"></i>
            </div>
            <h6 className="text-dark mb-2">Aucune facture pour l'instant</h6>
            <p className="text-muted small mb-3">Créez votre première facture pour lancer votre workflow de billing.</p>
            <Link href="/dashboard/create-invoice" className="btn btn-primary rounded-3">
              <i className="bi bi-plus-circle me-2"></i>
              Créer une facture
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Facture</th>
                  <th>Client</th>
                  <th>Collectif</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => {
                  const amount = invoiceAmountForUser(invoice);
                  const overdue = invoice.paymentStatus !== "paid" && new Date(invoice.dueDate) < new Date();

                  return (
                    <tr key={invoice.id}>
                      <td>
                        <div className="fw-semibold">{invoice.invoiceNumber || invoice.id.slice(0, 8)}</div>
                        <small className="text-muted">{new Date(invoice.invoiceDate).toLocaleDateString("fr-FR")}</small>
                      </td>
                      <td>{invoice.client?.name || "Client non renseigné"}</td>
                      <td>{invoice.collective?.name || "Aucun collectif"}</td>
                      <td className="fw-semibold">{formatCurrency(amount)}</td>
                      <td>
                        <span className={`badge ${invoice.paymentStatus === "paid" ? "bg-success" : overdue ? "bg-danger" : "bg-warning text-dark"}`}>
                          {invoice.paymentStatus === "paid" ? "Payée" : overdue ? "En retard" : "En attente"}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="btn btn-sm btn-outline-secondary">
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
