'use client'

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useState(() => {
    if (searchParams.get("registration") === "success") {
      setRegistrationSuccess(true);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
    }
    setIsLoading(false);
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
          <h2 className="display-5 fw-semibold mb-xl">Content de vous revoir !</h2>
          <p className="lead opacity-90">Connectez-vous pour accéder à votre tableau de bord et continuer à gérer vos finances simplement.</p>
        </motion.div>

        {/* Right Column: Sign-In Form */}
        <motion.div 
          className="col-lg-7 d-flex flex-column align-items-center justify-content-center p-xxl"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-100" style={{ maxWidth: "550px" }}>
            <h3 className="h2 mb-xl fw-bold text-center text-darkGray">Connexion</h3>
            <p className="text-center text-mediumGray mb-xxl">Accédez à votre compte Splitfact.</p>
            
            {registrationSuccess && (
              <div className="alert alert-success text-center small mb-xl">
                Inscription réussie ! Vous pouvez maintenant vous connecter.
              </div>
            )}
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
              </div>
              <button className="w-100 btn btn-primary btn-lg rounded-pill mt-xxl mb-xl" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Connexion...
                  </>
                ) : 'Se connecter'}
              </button>
            </form>

            <div className="divider-or">OU</div>

            <button className="w-100 btn btn-outline-secondary btn-lg rounded-pill d-flex align-items-center justify-content-center" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
              <i className="bi bi-google me-2"></i>
              Se connecter avec Google
            </button>

            <div className="text-center mt-xxl pt-xl border-top">
              <p className="mb-0 text-mediumGray">
                Vous n'avez pas de compte ? 
                <Link href="/auth/register" className="fw-semibold text-primary ms-1 text-decoration-none">
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}