'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { z } from "zod";

const companyLegalStatuses = ["SASU", "EURL", "SARL", "SAS"];

const userProfileSchema = z.object({
  name: z.string().min(1, "Name / Company Name is required."),
  fiscalRegime: z.enum(["MicroBIC", "BNC"], { required_error: "Fiscal Regime is required." }),
  microEntrepreneurType: z.enum(["COMMERCANT", "PRESTATAIRE", "LIBERAL"]).optional(), // New field
  declarationFrequency: z.enum(["monthly", "quarterly"]).optional(), // New field for URSSAF declarations
  siret: z.string().length(14, "SIRET must be 14 digits.").regex(/^\d+$/, "SIRET must contain only digits."),
  address: z.string().min(1, "Address is required."),
  legalStatus: z.string().min(1, "Legal Status is required."),
  rcsNumber: z.string().optional(),
  shareCapital: z.string().optional(),
  apeCode: z.string().length(5, "APE Code must be 5 characters.").regex(/^\d{4}[A-Z]$/, "APE Code must be 4 digits followed by 1 uppercase letter."),
  tvaNumber: z.string().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation for microEntrepreneurType
  if (data.fiscalRegime === "MicroBIC" || data.fiscalRegime === "BNC") {
    if (!data.microEntrepreneurType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Micro-Entrepreneur Type is required for Micro-BIC/BNC regimes.",
        path: ["microEntrepreneurType"],
      });
    }
    // Declaration frequency is required for micro-entrepreneurs
    if (!data.declarationFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Declaration Frequency is required for Micro-BIC/BNC regimes.",
        path: ["declarationFrequency"],
      });
    }
  }
  // Conditional validation for tvaNumber
  if (data.fiscalRegime !== "MicroBIC" && data.fiscalRegime !== "BNC") {
    if (!data.tvaNumber || !data.tvaNumber.startsWith("FR") || data.tvaNumber.length !== 13 || !/^FR\d{11}$/.test(data.tvaNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TVA Number is required and must be in 'FR12345678901' format for this fiscal regime.",
        path: ["tvaNumber"],
      });
    }
  } else if (data.tvaNumber && (!data.tvaNumber.startsWith("FR") || data.tvaNumber.length !== 13 || !/^FR\d{11}$/.test(data.tvaNumber))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "TVA Number must be in 'FR12345678901' format if provided.",
      path: ["tvaNumber"],
    });
  }

  // Conditional validation for rcsNumber and shareCapital
  if (companyLegalStatuses.includes(data.legalStatus)) {
    if (!data.rcsNumber || data.rcsNumber.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "RCS Number is required for this legal status.",
        path: ["rcsNumber"],
      });
    }
    if (!data.shareCapital || data.shareCapital.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Share Capital is required for this legal status.",
        path: ["shareCapital"],
      });
    }
  }
});

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  fiscalRegime: string | null;
  microEntrepreneurType: "COMMERCANT" | "PRESTATAIRE" | "LIBERAL" | null; // New field
  declarationFrequency: "monthly" | "quarterly" | null; // New field
  siret: string | null;
  tvaNumber: string | null;
  address: string | null;
  legalStatus: string | null;
  rcsNumber: string | null;
  shareCapital: string | null;
  apeCode: string | null;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [stripeConnecting, setStripeConnecting] = useState(false); // New state for Stripe connection

  console.log("ProfilePage: Render - session:", session);
  console.log("ProfilePage: Render - session.user.stripeAccountId:", session?.user?.stripeAccountId);

  console.log("ProfilePage: Render - session:", session);
  console.log("ProfilePage: Render - session.user.stripeAccountId:", session?.user?.stripeAccountId);

  

  const [name, setName] = useState<string>("")
  const [fiscalRegime, setFiscalRegime] = useState<string>("")
  const [microEntrepreneurType, setMicroEntrepreneurType] = useState<string>("") // New state
  const [declarationFrequency, setDeclarationFrequency] = useState<string>("") // New state
  const [siret, setSiret] = useState<string>("")
  const [tvaNumber, setTvaNumber] = useState<string>("")
  const [address, setAddress] = useState<string>("")
  const [legalStatus, setLegalStatus] = useState<string>("")
  const [rcsNumber, setRcsNumber] = useState<string>("")
  const [shareCapital, setShareCapital] = useState<string>("")
  const [apeCode, setApeCode] = useState<string>("")

  const [formErrors, setFormErrors] = useState<any>({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const handleShowPopup = useCallback((message: string) => {
    setPopupMessage(message);
    setShowPopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setPopupMessage('');
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users/me")
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }
      const data = await response.json()
      setUserProfile(data)
      console.log("fetchUserProfile: UserProfile state updated with data:", data);
    } catch (err: any) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }, []); // Empty dependency array means this function is memoized once

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchUserProfile()
    }
  }, [status, router])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_onboard') === 'success') {
      const handleStripeRedirect = async () => {
        await update(); // Await the session update

        if (urlParams.get('stripe_status') === 'connected') {
          handleShowPopup("Votre compte Stripe a été connecté avec succès!");
        } else {
          handleShowPopup("La connexion à Stripe a été annulée ou a échoué.");
        }
        // Clear the query parameters after processing
        router.replace(window.location.pathname);
      };
      handleStripeRedirect();
    }
  }, [update, router, handleShowPopup]);

  const handleConnectStripe = async () => {
    setStripeConnecting(true);
    try {
      const response = await fetch("/api/stripe/onboard", {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate Stripe onboarding.");
      }
      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe for onboarding
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setStripeConnecting(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "")
      setFiscalRegime(userProfile.fiscalRegime || "")
      setMicroEntrepreneurType(userProfile.microEntrepreneurType || "") // Set new state
      setDeclarationFrequency(userProfile.declarationFrequency || "") // Set new state
      setSiret(userProfile.siret || "")
      setTvaNumber(userProfile.tvaNumber || "")
      setAddress(userProfile.address || "")
      setLegalStatus(userProfile.legalStatus || "")
      setRcsNumber(userProfile.rcsNumber || "")
      setShareCapital(userProfile.shareCapital || "")
      setApeCode(userProfile.apeCode || "")
    }
  }, [userProfile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({}); // Clear previous errors
    setApiError(null);

    const formData = {
      name,
      fiscalRegime,
      microEntrepreneurType: (fiscalRegime === "MicroBIC" || fiscalRegime === "BNC") ? microEntrepreneurType : undefined, // Conditionally include
      declarationFrequency: (fiscalRegime === "MicroBIC" || fiscalRegime === "BNC") ? declarationFrequency : undefined, // Conditionally include
      siret,
      tvaNumber,
      address,
      legalStatus,
      rcsNumber,
      shareCapital,
      apeCode,
    };

    const result = userProfileSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      })

      if (!response.ok) {
        const errorData = await response.json();
        setApiError(errorData.error || "Failed to update profile.");
        return;
      }

      const updatedUser = await response.json()
      setUserProfile(updatedUser)
      update({ fiscalRegime: updatedUser.fiscalRegime }); // Update session
      handleShowPopup("Profile updated successfully!")
    } catch (err: any) {
      setApiError(err.message)
    }
  }

  if (status === "loading" || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>
  }

  if (apiError) {
    return <div className="alert alert-danger">Erreur: {apiError}</div>
  }

  if (!userProfile) {
    return <div className="alert alert-warning">Profil utilisateur introuvable.</div>
  }

  // Calculate profile completion
  const getProfileCompletion = () => {
    const requiredFields = [name, fiscalRegime, siret, address, legalStatus, apeCode];
    if (fiscalRegime === "MicroBIC" || fiscalRegime === "BNC") {
      requiredFields.push(microEntrepreneurType, declarationFrequency);
    }
    if (fiscalRegime !== "MicroBIC" && fiscalRegime !== "BNC") {
      requiredFields.push(tvaNumber);
    }
    if (companyLegalStatuses.includes(legalStatus)) {
      requiredFields.push(rcsNumber, shareCapital);
    }
    
    const completedFields = requiredFields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const completionPercentage = getProfileCompletion();

  return (
    <>
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
              <div>
                <h1 className="h2 mb-2 text-dark fw-bold">
                  <i className="bi bi-person-circle text-primary me-3"></i>
                  Mon Profil
                </h1>
                <p className="text-muted mb-0">Gérez vos informations professionnelles et fiscales</p>
              </div>
              <div className="mt-3 mt-md-0">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <small className="text-muted d-block">Profil complété</small>
                    <div className="progress" style={{ width: '120px', height: '8px' }}>
                      <div 
                        className={`progress-bar ${completionPercentage === 100 ? 'bg-success' : completionPercentage >= 70 ? 'bg-info' : 'bg-warning'}`}
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <small className={`${completionPercentage === 100 ? 'text-success' : 'text-muted'} fw-semibold`}>
                      {completionPercentage}%
                    </small>
                  </div>
                  {completionPercentage === 100 && (
                    <div className="text-success">
                      <i className="bi bi-check-circle-fill fs-4"></i>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8">
            {/* Main Profile Form */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <form onSubmit={handleUpdateProfile}>
                  {/* Personal Information Section */}
                  <div className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-primary bg-opacity-10 rounded-3 p-2 me-3">
                        <i className="bi bi-person text-primary fs-5"></i>
                      </div>
                      <div>
                        <h3 className="h5 mb-0 text-dark fw-semibold">Informations personnelles</h3>
                        <small className="text-muted">Vos coordonnées principales</small>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="name" className="form-label fw-semibold text-dark">
                          <i className="bi bi-building me-2 text-muted"></i>
                          Nom / Raison Sociale *
                        </label>
                        <input
                          type="text"
                          id="name"
                          className={`form-control form-control-lg border-0 bg-light rounded-3 ${formErrors.name ? 'is-invalid' : ''}`}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nom de votre entreprise ou votre nom"
                        />
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Pour les Micro-entrepreneurs/BNC, utilisez votre nom personnel. Pour les SASU/EI etc., utilisez le nom enregistré de votre entreprise.
                        </div>
                        {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                      </div>

                      <div className="col-12">
                        <label htmlFor="email" className="form-label fw-semibold text-dark">
                          <i className="bi bi-envelope me-2 text-muted"></i>
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          className="form-control form-control-lg border-0 bg-light rounded-3"
                          value={userProfile.email || ""}
                          disabled
                        />
                        <div className="form-text">
                          <i className="bi bi-lock me-1"></i>
                          L'email ne peut pas être modifié ici.
                        </div>
                      </div>

                      <div className="col-12">
                        <label htmlFor="address" className="form-label fw-semibold text-dark">
                          <i className="bi bi-geo-alt me-2 text-muted"></i>
                          Adresse professionnelle *
                        </label>
                        <input
                          type="text"
                          id="address"
                          className={`form-control form-control-lg border-0 bg-light rounded-3 ${formErrors.address ? 'is-invalid' : ''}`}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="123 Rue de la République, 75001 Paris"
                        />
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Votre adresse professionnelle officielle.
                        </div>
                        {formErrors.address && <div className="invalid-feedback">{formErrors.address}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Fiscal Information Section */}
                  <div className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-info bg-opacity-10 rounded-3 p-2 me-3">
                        <i className="bi bi-calculator text-info fs-5"></i>
                      </div>
                      <div>
                        <h3 className="h5 mb-0 text-dark fw-semibold">Informations fiscales</h3>
                        <small className="text-muted">Votre régime fiscal et détails légaux</small>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="fiscalRegime" className="form-label fw-semibold text-dark">
                          <i className="bi bi-bank me-2 text-muted"></i>
                          Régime Fiscal *
                        </label>
                        <select
                          id="fiscalRegime"
                          className={`form-select form-select-lg border-0 bg-light rounded-3 ${formErrors.fiscalRegime ? 'is-invalid' : ''}`}
                          value={fiscalRegime}
                          onChange={(e) => setFiscalRegime(e.target.value)}
                        >
                          <option value="">Sélectionner un régime</option>
                          <option value="MicroBIC">🏪 Micro-BIC (Auto-Entrepreneur Commercial)</option>
                          <option value="BNC">💼 BNC (Auto-Entrepreneur Prestations/Libéral)</option>
                        </select>
                        {formErrors.fiscalRegime && <div className="invalid-feedback">{formErrors.fiscalRegime}</div>}
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="legalStatus" className="form-label fw-semibold text-dark">
                          <i className="bi bi-shield-check me-2 text-muted"></i>
                          Statut Légal *
                        </label>
                        <input
                          type="text"
                          id="legalStatus"
                          className={`form-control form-control-lg border-0 bg-light rounded-3 ${formErrors.legalStatus ? 'is-invalid' : ''}`}
                          value={legalStatus}
                          onChange={(e) => setLegalStatus(e.target.value)}
                          placeholder="Ex: EI, SASU, EURL, SARL"
                        />
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Ex: EI, SASU, EURL, SARL.
                        </div>
                        {formErrors.legalStatus && <div className="invalid-feedback">{formErrors.legalStatus}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Micro-Entrepreneur Specific Section */}
                  {(fiscalRegime === "MicroBIC" || fiscalRegime === "BNC") && (
                    <div className="mb-5">
                      <div className="alert alert-info border-0 rounded-3 mb-4">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-info-circle text-info me-2 fs-5"></i>
                          <div>
                            <strong>Régime Micro-Entrepreneur détecté</strong>
                            <div className="small">Veuillez compléter les informations spécifiques à votre statut.</div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="microEntrepreneurType" className="form-label fw-semibold text-dark">
                            <i className="bi bi-briefcase me-2 text-muted"></i>
                            Type d'activité *
                          </label>
                          <select
                            id="microEntrepreneurType"
                            className={`form-select form-select-lg border-0 bg-light rounded-3 ${formErrors.microEntrepreneurType ? 'is-invalid' : ''}`}
                            value={microEntrepreneurType}
                            onChange={(e) => setMicroEntrepreneurType(e.target.value)}
                          >
                            <option value="">Sélectionner un type</option>
                            <option value="COMMERCANT">🛒 Commerçant</option>
                            <option value="PRESTATAIRE">⚙️ Prestation de Services (BIC)</option>
                            <option value="LIBERAL">💼 Activité Libérale (BNC)</option>
                          </select>
                          {formErrors.microEntrepreneurType && <div className="invalid-feedback">{formErrors.microEntrepreneurType}</div>}
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="declarationFrequency" className="form-label fw-semibold text-dark">
                            <i className="bi bi-calendar3 me-2 text-muted"></i>
                            Fréquence URSSAF *
                          </label>
                          <select
                            id="declarationFrequency"
                            className={`form-select form-select-lg border-0 bg-light rounded-3 ${formErrors.declarationFrequency ? 'is-invalid' : ''}`}
                            value={declarationFrequency}
                            onChange={(e) => setDeclarationFrequency(e.target.value)}
                          >
                            <option value="">Sélectionner une fréquence</option>
                            <option value="monthly">📅 Mensuelle</option>
                            <option value="quarterly">📊 Trimestrielle</option>
                          </select>
                          <div className="form-text">
                            <i className="bi bi-info-circle me-1"></i>
                            Ceci permettra à Splitfact de générer automatiquement vos rapports URSSAF.
                          </div>
                          {formErrors.declarationFrequency && <div className="invalid-feedback">{formErrors.declarationFrequency}</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Business Identification Section */}
                  <div className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-success bg-opacity-10 rounded-3 p-2 me-3">
                        <i className="bi bi-card-text text-success fs-5"></i>
                      </div>
                      <div>
                        <h3 className="h5 mb-0 text-dark fw-semibold">Identification d'entreprise</h3>
                        <small className="text-muted">Numéros officiels et codes d'activité</small>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="siret" className="form-label fw-semibold text-dark">
                          <i className="bi bi-hash me-2 text-muted"></i>
                          SIRET *
                        </label>
                        <input
                          type="text"
                          id="siret"
                          className={`form-control form-control-lg border-0 bg-light rounded-3 ${formErrors.siret ? 'is-invalid' : ''}`}
                          value={siret}
                          onChange={(e) => setSiret(e.target.value)}
                          placeholder="12345678901234"
                          maxLength={14}
                        />
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Votre numéro d'identification d'entreprise à 14 chiffres.
                        </div>
                        {formErrors.siret && <div className="invalid-feedback">{formErrors.siret}</div>}
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="apeCode" className="form-label fw-semibold text-dark">
                          <i className="bi bi-diagram-3 me-2 text-muted"></i>
                          Code APE *
                        </label>
                        <input
                          type="text"
                          id="apeCode"
                          className={`form-control form-control-lg border-0 bg-light rounded-3 ${formErrors.apeCode ? 'is-invalid' : ''}`}
                          value={apeCode}
                          onChange={(e) => setApeCode(e.target.value)}
                          placeholder="6201Z"
                          maxLength={5}
                        />
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Votre code de classification d'activité (ex: 6201Z).
                        </div>
                        {formErrors.apeCode && <div className="invalid-feedback">{formErrors.apeCode}</div>}
                      </div>

                      <div className="col-12">
                        <label htmlFor="tvaNumber" className="form-label fw-semibold text-dark">
                          <i className="bi bi-receipt me-2 text-muted"></i>
                          Numéro de TVA
                          {(fiscalRegime === "MicroBIC" || fiscalRegime === "BNC") && (
                            <span className="badge bg-info ms-2">Optionnel</span>
                          )}
                          {fiscalRegime && fiscalRegime !== "MicroBIC" && fiscalRegime !== "BNC" && (
                            <span className="badge bg-danger ms-2">Requis</span>
                          )}
                        </label>
                        <input
                          type="text"
                          id="tvaNumber"
                          className={`form-control form-control-lg border-0 bg-light rounded-3 ${formErrors.tvaNumber ? 'is-invalid' : ''}`}
                          value={tvaNumber}
                          onChange={(e) => setTvaNumber(e.target.value)}
                          placeholder="FR12345678901"
                          maxLength={13}
                        />
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Commence par 'FR' suivi de 11 chiffres. 
                          {(fiscalRegime === "MicroBIC" || fiscalRegime === "BNC") && (
                            <span className="text-success"> Non requis en Micro-BIC/BNC (franchise de base).</span>
                          )}
                        </div>
                        {formErrors.tvaNumber && <div className="invalid-feedback">{formErrors.tvaNumber}</div>}
                      </div>
                    </div>
                  </div>
                  {/* Company-Specific Section */}
                  {companyLegalStatuses.includes(legalStatus) && (
                    <div className="mb-5">
                      <div className="alert alert-warning border-0 rounded-3 mb-4">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-exclamation-triangle text-warning me-2 fs-5"></i>
                          <div>
                            <strong>Informations d'entreprise requises</strong>
                            <div className="small">Statut {legalStatus} détecté - RCS et capital social obligatoires.</div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="rcsNumber" className="form-label fw-semibold text-dark">
                            <i className="bi bi-building-gear me-2 text-muted"></i>
                            Numéro RCS *
                          </label>
                          <input
                            type="text"
                            id="rcsNumber"
                            className={`form-control form-control-lg border-0 bg-light rounded-3 ${formErrors.rcsNumber ? 'is-invalid' : ''}`}
                            value={rcsNumber}
                            onChange={(e) => setRcsNumber(e.target.value)}
                            placeholder="RCS Paris 123 456 789"
                          />
                          <div className="form-text">
                            <i className="bi bi-info-circle me-1"></i>
                            Ex: RCS Paris 123 456 789. Requis pour les entreprises.
                          </div>
                          {formErrors.rcsNumber && <div className="invalid-feedback">{formErrors.rcsNumber}</div>}
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="shareCapital" className="form-label fw-semibold text-dark">
                            <i className="bi bi-currency-euro me-2 text-muted"></i>
                            Capital Social *
                          </label>
                          <input
                            type="text"
                            id="shareCapital"
                            className={`form-control form-control-lg border-0 bg-light rounded-3 ${formErrors.shareCapital ? 'is-invalid' : ''}`}
                            value={shareCapital}
                            onChange={(e) => setShareCapital(e.target.value)}
                            placeholder="1 000 €"
                          />
                          <div className="form-text">
                            <i className="bi bi-info-circle me-1"></i>
                            Ex: 1 000 €. Requis pour les entreprises.
                          </div>
                          {formErrors.shareCapital && <div className="invalid-feedback">{formErrors.shareCapital}</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="d-flex flex-column flex-sm-row gap-3 pt-4 border-top">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg rounded-3 flex-fill"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Enregistrer les modifications
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary btn-lg rounded-3" 
                      onClick={() => window.location.reload()}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Profile Completion Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 rounded-3 p-2 me-3">
                    <i className="bi bi-speedometer2 text-primary fs-5"></i>
                  </div>
                  <div>
                    <h4 className="h6 mb-0 text-dark fw-semibold">Progression du profil</h4>
                    <small className="text-muted">Complétez votre profil</small>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Progression</span>
                    <span className={`small fw-bold ${completionPercentage === 100 ? 'text-success' : 'text-primary'}`}>
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div 
                      className={`progress-bar ${completionPercentage === 100 ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {completionPercentage === 100 ? (
                  <div className="alert alert-success border-0 rounded-3 py-2 px-3 mb-0">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <small className="mb-0 fw-semibold">Profil complet !</small>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info border-0 rounded-3 py-2 px-3 mb-0">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-info-circle text-info me-2"></i>
                      <small className="mb-0">
                        Complétez votre profil pour utiliser toutes les fonctionnalités.
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stripe Connection Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-info bg-opacity-10 rounded-3 p-2 me-3">
                    <i className="bi bi-credit-card text-info fs-5"></i>
                  </div>
                  <div>
                    <h4 className="h6 mb-0 text-dark fw-semibold">Paiements Stripe</h4>
                    <small className="text-muted">Gestion des paiements</small>
                  </div>
                </div>

                {!session?.user?.stripeAccountId ? (
                  <>
                    <div className="alert alert-warning border-0 rounded-3 py-2 px-3 mb-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                        <small className="mb-0">Compte non connecté</small>
                      </div>
                    </div>
                    <p className="text-muted small mb-3">
                      Connectez votre compte Stripe pour recevoir les paiements de vos factures.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="alert alert-success border-0 rounded-3 py-2 px-3 mb-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        <small className="mb-0 fw-semibold">Compte connecté</small>
                      </div>
                    </div>
                    <p className="text-success small mb-3">
                      Votre compte Stripe est actif et prêt à recevoir des paiements.
                    </p>
                  </>
                )}

                <button
                  onClick={handleConnectStripe}
                  className={`btn btn-lg rounded-3 w-100 ${
                    session?.user?.stripeAccountId 
                      ? 'btn-outline-success' 
                      : 'btn-primary'
                  }`}
                  disabled={stripeConnecting || !!session?.user?.stripeAccountId}
                >
                  {stripeConnecting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Connexion...
                    </>
                  ) : session?.user?.stripeAccountId ? (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Connecté
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      Connecter Stripe
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Help Card */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-success bg-opacity-10 rounded-3 p-2 me-3">
                    <i className="bi bi-question-circle text-success fs-5"></i>
                  </div>
                  <div>
                    <h4 className="h6 mb-0 text-dark fw-semibold">Aide rapide</h4>
                    <small className="text-muted">Conseils et astuces</small>
                  </div>
                </div>

                <div className="small text-muted">
                  <div className="d-flex align-items-start mb-2">
                    <i className="bi bi-lightbulb text-warning me-2 mt-1"></i>
                    <div>
                      <strong>Micro-entrepreneurs :</strong> La TVA n'est pas applicable en franchise de base.
                    </div>
                  </div>
                  <div className="d-flex align-items-start mb-2">
                    <i className="bi bi-lightbulb text-warning me-2 mt-1"></i>
                    <div>
                      <strong>SIRET :</strong> Numéro à 14 chiffres trouvable sur vos documents officiels.
                    </div>
                  </div>
                  <div className="d-flex align-items-start">
                    <i className="bi bi-lightbulb text-warning me-2 mt-1"></i>
                    <div>
                      <strong>Code APE :</strong> Détermine votre secteur d'activité principal.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Enhanced Success/Error Modal */}
      {showPopup && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 rounded-3 p-2 me-3">
                    <i className="bi bi-check-circle text-success fs-4"></i>
                  </div>
                  <h5 className="modal-title fw-bold text-dark mb-0">Succès !</h5>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleClosePopup}
                  aria-label="Fermer"
                ></button>
              </div>
              <div className="modal-body px-4 py-3">
                <p className="mb-0 text-muted">{popupMessage}</p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-primary rounded-3 px-4" 
                  onClick={handleClosePopup}
                >
                  <i className="bi bi-check me-2"></i>
                  Parfait !
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>

  );
}