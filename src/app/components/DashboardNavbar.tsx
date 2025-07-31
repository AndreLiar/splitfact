'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import NotificationCenter from "@/app/dashboard/components/NotificationCenter";
import FeedbackButton from "./FeedbackButton";

export default function DashboardNavbar() {
  const pathname = usePathname();

  return (
    <nav 
      className="navbar navbar-expand-lg navbar-light bg-white d-lg-none border-bottom shadow-sm mobile-navbar" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1030,
        backdropFilter: 'blur(10px)',
        minHeight: '60px'
      }}
    >
      <div className="container-fluid px-3 py-2">
        <button
          className="navbar-toggler border-0 p-2 mobile-menu-btn"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#mobileSidebar"
          aria-controls="mobileSidebar"
          aria-expanded="false"
          aria-label="Ouvrir le menu de navigation"
          style={{
            minWidth: '48px',
            minHeight: '48px',
            borderRadius: '12px',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <i className="bi bi-list fs-3" style={{ lineHeight: 1 }}></i>
        </button>
        <Link 
          href="/dashboard" 
          className="navbar-brand fw-bold text-primary mb-0 mobile-brand"
          style={{
            fontSize: '1.2rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <i className="bi bi-lightning-fill me-2" style={{ fontSize: '1.3rem' }}></i>
          <span className="brand-text">Splitfact</span>
        </Link>
        <div className="d-flex align-items-center gap-2 mobile-nav-actions">
          <FeedbackButton 
            variant="link" 
            size="sm" 
            position="navbar" 
            showText={false}
            className="p-2"
          />
          <NotificationCenter />
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn:hover {
            background-color: #f8f9fa;
            transform: scale(1.05);
          }
          
          .mobile-menu-btn:active {
            background-color: #e9ecef;
            transform: scale(0.98);
          }
          
          .mobile-brand {
            flex: 1;
            justify-content: center;
            margin: 0 16px;
          }
          
          .mobile-nav-actions {
            min-width: 48px;
            justify-content: flex-end;
          }
        }
        
        @media (max-width: 375px) {
          .brand-text {
            font-size: 1.1rem;
          }
          
          .mobile-navbar {
            min-height: 56px;
          }
          
          .container-fluid {
            padding: 8px 16px;
          }
        }
      `}</style>
    </nav>
  );
}