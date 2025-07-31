'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import FeedbackButton from "./FeedbackButton";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg bg-white sticky-top shadow-sm" style={{ zIndex: 1030 }}>
      <div className="main-container py-3">
        <div className="d-flex justify-content-between align-items-center w-100">
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
            className="navbar-toggler border-0 p-2 d-lg-none ms-auto"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
            style={{
              minWidth: '48px',
              minHeight: '48px',
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'} text-primary`} style={{fontSize: '24px'}}></i>
          </button>
        </div>
        
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
            <li className="nav-item d-lg-none">
              <div className="py-2">
                <FeedbackButton 
                  variant="outline" 
                  size="sm"
                  className="w-100"
                  showText={true}
                />
              </div>
            </li>
          </ul>
          
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item me-2 d-none d-lg-block">
              <FeedbackButton 
                variant="link" 
                size="sm"
                position="navbar"
                showText={true}
                className="nav-link text-darkGray fw-semibold px-lg py-md hover-text-primary"
              />
            </li>
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
      
      {/* Mobile-optimized styles */}
      <style jsx>{`
        @media (max-width: 991.98px) {
          .navbar-toggler:hover {
            background-color: #f8f9fa;
            transform: scale(1.05);
          }
          
          .navbar-toggler:active {
            background-color: #e9ecef;
            transform: scale(0.98);
          }
          
          .navbar-collapse {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e9ecef;
          }
          
          .nav-link {
            padding: 12px 0 !important;
            font-size: 16px;
            border-bottom: 1px solid #f8f9fa;
          }
          
          .nav-link:last-child {
            border-bottom: none;
          }
          
          .btn {
            margin-top: 12px;
            padding: 12px 24px;
            width: 100%;
            justify-content: center;
          }
        }
        
        @media (max-width: 575.98px) {
          .navbar-brand span {
            font-size: 20px !important;
          }
          
          .badge {
            font-size: 9px !important;
            margin-left: 6px !important;
          }
          
          .bg-primary {
            width: 36px !important;
            height: 36px !important;
          }
          
          .bg-primary i {
            font-size: 18px !important;
          }
          
          .main-container {
            padding: 12px 16px !important;
          }
        }
      `}</style>
    </nav>
  );
}
