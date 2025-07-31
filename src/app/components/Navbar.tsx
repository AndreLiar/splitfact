'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg bg-white sticky-top shadow-sm" style={{ zIndex: 1030 }}>
      <div className="main-container py-3">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <div className="d-flex align-items-center">
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{width: '40px', height: '40px'}}>
              <i className="bi bi-lightning-charge-fill text-white" style={{fontSize: '20px'}}></i>
            </div>
            <div>
              <span className="fw-bold text-primary" style={{fontSize: '24px'}}>Splitfact</span>
              <div className="badge bg-optionalAccent text-white px-2 py-1 rounded-pill" style={{fontSize: '10px', marginLeft: '8px'}}>
                BETA
              </div>
            </div>
          </div>
        </Link>
        
        <button
          className="navbar-toggler border-0 p-2"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation"
        >
          <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'} text-primary`} style={{fontSize: '24px'}}></i>
        </button>
        
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <Link
                href="/fonctionnalites"
                className="nav-link text-darkGray fw-semibold px-lg py-md hover-text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Fonctionnalités
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/comment-ca-marche"
                className="nav-link text-darkGray fw-semibold px-lg py-md hover-text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Comment ça marche
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="#pricing"
                className="nav-link text-darkGray fw-semibold px-lg py-md hover-text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Tarifs
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="#support"
                className="nav-link text-darkGray fw-semibold px-lg py-md hover-text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
            </li>
          </ul>
          
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item me-2">
              <Link
                href="/auth/signin"
                className={`nav-link text-darkGray fw-semibold px-lg py-md hover-text-primary ${pathname === "/auth/signin" ? "text-primary" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Connexion
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/auth/register"
                className="btn btn-primary rounded-pill px-xl py-md shadow-subtle fw-semibold"
                style={{fontSize: '16px'}}
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="bi bi-rocket-takeoff me-2"></i>
                Essai gratuit
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
