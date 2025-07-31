'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils'; // Assuming you have a currency formatter

interface UserProfile {
  id: string;
  fiscalRegime: string | null;
  microEntrepreneurType: "COMMERCANT" | "PRESTATAIRE" | "LIBERAL" | null;
}

interface Invoice {
  id: string;
  totalAmount: number;
  invoiceDate: string;
}

interface SimulateurAutoEntrepreneurProps {
  onTvaStatusChange: (status: string) => void;
}

export default function SimulateurAutoEntrepreneur({ onTvaStatusChange }: SimulateurAutoEntrepreneurProps) {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [simulatedTurnover, setSimulatedTurnover] = useState<number>(0);
  const [urssafContribution, setUrssafContribution] = useState<number>(0);
  const [incomeTax, setIncomeTax] = useState<number>(0);
  const [netIncome, setNetIncome] = useState<number>(0);
  const [tvaStatus, setTvaStatus] = useState<string>("Sous les seuils");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const fetchUserData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const userResponse = await fetch('/api/users/me');
      if (!userResponse.ok) throw new Error('Failed to fetch user profile');
      const userData = await userResponse.json();
      setUserProfile(userData);

      const invoicesResponse = await fetch('/api/users/me/invoices?limit=9999'); // Fetch all invoices for calculation
      if (!invoicesResponse.ok) throw new Error('Failed to fetch invoices');
      const invoicesData = await invoicesResponse.json();
      setInvoices(invoicesData.invoices);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (userProfile && invoices.length > 0) {
      // Calculate current cumulative turnover for the year
      const cumulativeTurnover = invoices.reduce((sum, invoice) => {
        const invoiceYear = new Date(invoice.invoiceDate).getFullYear();
        if (invoiceYear === currentYear) {
          return sum + parseFloat(invoice.totalAmount.toString());
        }
        return sum;
      }, 0);
      setSimulatedTurnover(cumulativeTurnover);
    }
  }, [userProfile, invoices, currentYear]);

  useEffect(() => {
    if (userProfile && simulatedTurnover !== null) {
      const { fiscalRegime, microEntrepreneurType } = userProfile;
      let urssafRate = 0;
      let incomeTaxRate = 0; // Assuming versement libératoire
      let tvaThreshold = 0;

      // Determine URSSAF rates and TVA thresholds based on microEntrepreneurType
      if (fiscalRegime === "MicroBIC") {
        if (microEntrepreneurType === "COMMERCANT") {
          urssafRate = 0.128; // 12.8% for commercial activities
          tvaThreshold = 91900;
        } else if (microEntrepreneurType === "PRESTATAIRE") {
          urssafRate = 0.22; // 22% for service activities (BIC)
          tvaThreshold = 36800; // Or 39100 for 2025, need to confirm current year
        }
      } else if (fiscalRegime === "BNC") {
        if (microEntrepreneurType === "LIBERAL") {
          urssafRate = 0.22; // 22% for liberal activities (BNC)
          tvaThreshold = 36800; // Or 39100 for 2025, need to confirm current year
        }
      }

      // Calculate URSSAF contribution
      const calculatedUrssaf = simulatedTurnover * urssafRate;
      setUrssafContribution(calculatedUrssaf);

      // Calculate Income Tax (assuming versement libératoire for simplicity for now)
      // This is a simplified example, actual rates vary.
      if (fiscalRegime === "MicroBIC") {
        if (microEntrepreneurType === "COMMERCANT") {
          incomeTaxRate = 0.01; // 1% for commercial activities
        } else if (microEntrepreneurType === "PRESTATAIRE") {
          incomeTaxRate = 0.017; // 1.7% for service activities (BIC)
        }
      } else if (fiscalRegime === "BNC") {
        if (microEntrepreneurType === "LIBERAL") {
          incomeTaxRate = 0.022; // 2.2% for liberal activities (BNC)
        }
      }
      const calculatedIncomeTax = simulatedTurnover * incomeTaxRate;
      setIncomeTax(calculatedIncomeTax);

      // Calculate Net Income
      const calculatedNetIncome = simulatedTurnover - calculatedUrssaf - calculatedIncomeTax;
      setNetIncome(calculatedNetIncome);

      // Determine TVA Status and pass to parent
      let currentTvaStatus = "Sous les seuils";
      if (simulatedTurnover >= tvaThreshold) {
        currentTvaStatus = "Seuil TVA dépassé";
      } else if (simulatedTurnover >= tvaThreshold * 0.8) { // Example: 80% of threshold
        currentTvaStatus = "Proche du seuil TVA";
      }
      setTvaStatus(currentTvaStatus);
      onTvaStatusChange(currentTvaStatus);
    }
  }, [userProfile, simulatedTurnover, onTvaStatusChange]);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement du simulateur...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">Erreur lors du chargement du simulateur: {error}</div>;
  }

  if (!userProfile || (userProfile.fiscalRegime !== "MicroBIC" && userProfile.fiscalRegime !== "BNC")) {
    return (
      <div className="alert alert-info">
        Le simulateur est disponible uniquement pour les Micro-Entrepreneurs (Micro-BIC ou BNC).
        Veuillez mettre à jour votre <Link href="/dashboard/profile">profil</Link>.
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 rounded-xl p-3 mb-3">
      <h3 className="h5 text-darkGray mb-3">Simulateur Auto-Entrepreneur</h3>
      <div className="mb-3">
        <label htmlFor="simulatedTurnover" className="form-label">Chiffre d'affaires simulé (Annuel Cumulé):</label>
        <input
          type="number"
          id="simulatedTurnover"
          className="form-control"
          value={simulatedTurnover}
          onChange={(e) => setSimulatedTurnover(parseFloat(e.target.value) || 0)}
          placeholder="Entrez votre chiffre d'affaires"
        />
        <small className="form-text text-muted">Ce chiffre est pré-rempli avec votre CA cumulé actuel. Vous pouvez le modifier pour simuler.</small>
      </div>

      <div className="row">
        <div className="col-md-6">
          <p><strong>Cotisations URSSAF ({userProfile.microEntrepreneurType === "COMMERCANT" ? "12.8%" : "22%"}):</strong> {formatCurrency(urssafContribution)}</p>
          <p><strong>Impôt sur le revenu (estimation):</strong> {formatCurrency(incomeTax)}</p>
        </div>
        <div className="col-md-6">
          <p><strong>Revenu Net Estimé:</strong> {formatCurrency(netIncome)}</p>
          <p><strong>Statut TVA:</strong> {tvaStatus}</p>
        </div>
      </div>

      <p className="text-muted small mt-3">
        *Ces calculs sont des estimations basées sur les taux forfaitaires actuels pour les Micro-Entrepreneurs et ne remplacent pas l'avis d'un professionnel.
      </p>
    </div>
  );
}
