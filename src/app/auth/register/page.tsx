'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/auth/signin?registration=success");
      } else {
        const data = await response.json();
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please check your connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid bg-softWhite">
      <div className="row min-vh-100 align-items-stretch">
        {/* Left Column: Branding & Value Prop */}
        <motion.div 
          className="col-lg-5 d-none d-lg-flex flex-column justify-content-center align-items-start p-xxxxl text-white"
          style={{ background: 'linear-gradient(135deg, var(--primary-blue), var(--optional-accent))' }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="d-flex align-items-center mb-lg">
            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{width: '60px', height: '60px'}}>
              <i className="bi bi-lightning-charge-fill text-primary" style={{fontSize: '30px'}}></i>
            </div>
            <h1 className="h2 text-white mb-0 fw-bold">Splitfact</h1>
          </div>
          <h2 className="display-5 fw-semibold mb-xl">Rejoignez la révolution de la facturation collaborative.</h2>
          <ul className="list-unstyled fs-5">
            <li className="mb-lg d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-3 text-validationGreen"></i>
              <span>Facturation <strong>100% conforme URSSAF</strong></span>
            </li>
            <li className="mb-lg d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-3 text-validationGreen"></i>
              <span>Déclarations <strong>automatisées</strong></span>
            </li>
            <li className="mb-lg d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-3 text-validationGreen"></i>
              <span>Assistant fiscal <strong>intelligent (IA)</strong></span>
            </li>
          </ul>
        </motion.div>

        {/* Right Column: Registration Form */}
        <motion.div 
          className="col-lg-7 d-flex flex-column align-items-center justify-content-center p-xxl"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-100" style={{ maxWidth: "550px" }}>
            <h3 className="h2 mb-xl fw-bold text-center text-darkGray">Créer votre compte</h3>
            <p className="text-center text-mediumGray mb-xxl">Commencez à simplifier votre facturation dès aujourd'hui.</p>
            
            {error && <div className="alert alert-danger text-center small mb-xl">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-floating mb-xl">
                <input
                  type="email"
                  className="form-control form-control-lg rounded-input"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="email">Adresse e-mail</label>
              </div>
              <div className="form-floating mb-xl password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-lg rounded-input"
                  id="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="password">Mot de passe</label>
                <i 
                  className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
                <small className="form-text text-mediumGray mt-sm">Doit contenir au moins 8 caractères.</small>
              </div>
              <button className="w-100 btn btn-primary btn-lg rounded-pill mt-xxl mb-xl" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Création...
                  </>
                ) : 'Créer mon compte'}
              </button>
            </form>

            <div className="divider-or">OU</div>

            <button className="w-100 btn btn-outline-secondary btn-lg rounded-pill d-flex align-items-center justify-content-center" onClick={() => alert('Google Sign-In coming soon!')}>
              <i className="bi bi-google me-2"></i>
              S'inscrire avec Google
            </button>

            <div className="text-center mt-xxl pt-xl border-top">
              <p className="mb-0 text-mediumGray">
                Vous avez déjà un compte ? 
                <Link href="/auth/signin" className="fw-semibold text-primary ms-1 text-decoration-none">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}