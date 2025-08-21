'use client';

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FeedbackMenuItem } from "./FeedbackButton";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const navigation = {
    dashboard: [{ name: "Tableau de bord", href: "/dashboard", icon: "bi-grid" }],
    invoicing: [
      { name: "Créer une facture", href: "/dashboard/create-invoice", icon: "bi-file-earmark-plus" },
      { name: "Factures", href: "/dashboard/invoices", icon: "bi-receipt" },
      { name: "Sous-factures", href: "/dashboard/sub-invoices", icon: "bi-files" },
    ],
    management: [
      { name: "Collectifs", href: "/dashboard/collectives", icon: "bi-people" },
      { name: "Clients", href: "/dashboard/clients", icon: "bi-person-vcard" },
    ],
    analysis: [
      { name: "Revenus", href: "/dashboard/revenues", icon: "bi-graph-up" },
      { name: "Assistant AI Fiscal", href: "/dashboard/assistant", icon: "bi-robot" },
    ],
    reports: [
      { name: "Rapports URSSAF", href: "/dashboard/reports", icon: "bi-file-earmark-bar-graph" },
    ],
    settings: [{ name: "Paramètres", href: "/dashboard/settings", icon: "bi-gear" }],
  };

  // Check if current path matches item href
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Handle navigation click - simplified to not interfere with navigation
  const handleNavClick = (e?: React.MouseEvent) => {
    console.log('Navigation clicked - will close sidebar after navigation'); // Debug log
    
    // Use setTimeout to close sidebar AFTER navigation has started
    setTimeout(() => {
      const offcanvas = document.getElementById('mobileSidebar');
      if (offcanvas) {
        // Check if we're on mobile (offcanvas is visible)
        const isShown = offcanvas.classList.contains('show');
        
        if (isShown) {
          console.log('Closing sidebar after navigation...'); // Debug log
          
          // Try Bootstrap instance method first
          try {
            let bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
            
            if (!bsOffcanvas && (window as any).bootstrap?.Offcanvas) {
              bsOffcanvas = new (window as any).bootstrap.Offcanvas(offcanvas);
            }
            
            if (bsOffcanvas) {
              bsOffcanvas.hide();
              console.log('Sidebar closed successfully'); // Debug log
              return;
            }
          } catch (error) {
            console.log('Bootstrap method failed:', error); // Debug log
          }
          
          // Fallback: click the close button
          const closeButton = document.querySelector('#mobileSidebar [data-bs-dismiss="offcanvas"]');
          if (closeButton) {
            (closeButton as HTMLElement).click();
            console.log('Closed via close button'); // Debug log
          }
        }
      }
    }, 100); // Small delay to allow navigation to start
  };

  // Handle manual close
  const handleManualClose = () => {
    const offcanvas = document.getElementById('mobileSidebar');
    if (offcanvas) {
      // Try to get existing instance
      let bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
      
      // If no instance exists, create one
      if (!bsOffcanvas && (window as any).bootstrap?.Offcanvas) {
        bsOffcanvas = new (window as any).bootstrap.Offcanvas(offcanvas);
      }
      
      // Hide the offcanvas
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
  };

  // Render navigation item with active state
  const renderNavItem = (item: { name: string; href: string; icon: string }) => (
    <li className="nav-item mobile-nav-item" key={item.name}>
      <Link 
        href={item.href} 
        className={`nav-link d-flex align-items-center py-3 px-4 rounded-3 mx-2 mb-2 mobile-nav-link ${
          isActive(item.href) 
            ? 'bg-primary text-white fw-semibold active-nav-link shadow-sm' 
            : 'text-dark hover-bg-light'
        }`}
        style={{ 
          minHeight: '56px',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => {
          console.log(`Navigating to: ${item.name} (${item.href})`); // Debug log
          handleNavClick(e);
        }}
        role="menuitem"
        tabIndex={0}
      >
        <i className={`bi ${item.icon} me-3 mobile-nav-icon`} style={{ fontSize: '1.3em', minWidth: '24px' }}></i>
        <span className="mobile-nav-text fw-medium">{item.name}</span>
        {isActive(item.href) && (
          <div 
            className="position-absolute"
            style={{
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '4px',
              height: '24px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '2px'
            }}
          />
        )}
      </Link>
    </li>
  );

  return (
    <nav 
      className="bg-white border-end d-flex flex-column shadow-sm" 
      style={{ 
        minWidth: '260px', 
        maxWidth: '260px', 
        height: '100vh',
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: 1020,
        overflowY: 'auto'
      }}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-bottom mobile-sidebar-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 text-primary fw-bold d-flex align-items-center">
              <i className="bi bi-lightning-fill me-2" style={{ fontSize: '1.3rem' }}></i>
              <span className="sidebar-brand-text">Splitfact</span>
            </h5>
            <small className="text-muted sidebar-tagline">Facturation collaborative</small>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary d-lg-none mobile-close-sidebar"
            onClick={handleManualClose}
            data-bs-dismiss="offcanvas"
            data-bs-target="#mobileSidebar"
            aria-label="Fermer le menu"
            style={{
              minWidth: '36px',
              minHeight: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f8f9fa',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <i className="bi bi-x" style={{ fontSize: '1.2rem' }}></i>
          </button>
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column pt-3">
        <ul className="nav flex-column">
          {navigation.dashboard.map(renderNavItem)}
        </ul>

        <h6 className="sidebar-heading px-3 mt-4 mb-2 text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
          <i className="bi bi-file-earmark me-1"></i>
          Facturation
        </h6>
        <ul className="nav flex-column mb-3">
          {navigation.invoicing.map(renderNavItem)}
        </ul>

        <h6 className="sidebar-heading px-3 mt-3 mb-2 text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
          <i className="bi bi-gear me-1"></i>
          Gestion
        </h6>
        <ul className="nav flex-column mb-3">
          {navigation.management.map(renderNavItem)}
        </ul>

        <h6 className="sidebar-heading px-3 mt-3 mb-2 text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
          <i className="bi bi-graph-up me-1"></i>
          Analyse
        </h6>
        <ul className="nav flex-column mb-3">
          {navigation.analysis.map(renderNavItem)}
        </ul>

        <h6 className="sidebar-heading px-3 mt-3 mb-2 text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
          <i className="bi bi-file-bar-graph me-1"></i>
          Rapports
        </h6>
        <ul className="nav flex-column mb-3">
          {navigation.reports.map(renderNavItem)}
        </ul>

        {/* Settings section */}
        <ul className="nav flex-column mt-auto mb-3">
          {navigation.settings.map(renderNavItem)}
        </ul>
      </div>

      {/* Sidebar Footer */}
      <div className="border-top bg-light p-3">
        {/* User Dropdown */}
        <div className="dropdown">
          <button 
            className="btn btn-light w-100 d-flex align-items-center text-start border-0 dropdown-toggle" 
            id="dropdownUser1" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-person-fill text-white"></i>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="fw-semibold text-truncate">{session?.user?.name || 'Utilisateur'}</div>
              <small className="text-muted text-truncate d-block">{session?.user?.email}</small>
            </div>
          </button>
          <ul className="dropdown-menu dropdown-menu-end w-100 shadow-lg border-0" aria-labelledby="dropdownUser1">
            <li>
              <Link className="dropdown-item d-flex align-items-center py-2" href="/dashboard/profile">
                <i className="bi bi-person me-2"></i>
                Profil
              </Link>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <FeedbackMenuItem />
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button 
                className="dropdown-item d-flex align-items-center py-2 text-danger" 
                onClick={() => signOut()}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Déconnexion
              </button>
            </li>
          </ul>
        </div>

        {/* Quick Tips */}
        <div className="mt-3 p-2 bg-primary bg-opacity-10 rounded-2">
          <small className="text-muted d-block">
            <i className="bi bi-lightbulb me-1 text-primary"></i>
            <strong>Astuce:</strong> Utilisez <kbd>Ctrl+N</kbd> pour ouvrir les notifications rapidement.
          </small>
        </div>
      </div>
    </nav>
  );
}

// Add mobile-specific styles
const mobileStyles = `
  @media (max-width: 768px) {
    .mobile-nav-link:hover:not(.active-nav-link) {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
      transform: translateX(6px) scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .mobile-nav-link:active {
      transform: translateX(3px) scale(0.98);
      transition: all 0.1s ease;
    }
    
    .active-nav-link {
      background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%) !important;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
      transform: translateX(4px);
    }
    
    .mobile-nav-text {
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.3px;
    }
    
    .mobile-nav-icon {
      transition: transform 0.2s ease;
    }
    
    .mobile-nav-link:hover .mobile-nav-icon {
      transform: scale(1.1);
    }
    
    .mobile-section-header {
      padding: 8px 0;
      border-radius: 8px;
    }
    
    .mobile-section-text {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
    }
    
    .mobile-user-btn:hover {
      background-color: #e9ecef !important;
      transform: scale(1.02);
    }
    
    .mobile-user-name {
      font-size: 14px;
      line-height: 1.3;
    }
    
    .mobile-user-email {
      font-size: 12px;
      line-height: 1.2;
    }
    
    .mobile-quick-tips {
      margin-top: 16px;
    }
    
    .mobile-tip-text {
      font-size: 12px;
      line-height: 1.4;
    }
    
    .mobile-kbd {
      font-size: 10px;
      padding: 2px 4px;
    }
    
    .mobile-close-sidebar:hover {
      background-color: #e9ecef !important;
      transform: scale(1.1);
    }
    
    .mobile-close-sidebar:active {
      background-color: #dee2e6 !important;
      transform: scale(0.95);
    }
  }
  
  @media (max-width: 375px) {
    .sidebar-brand-text {
      font-size: 1.1rem;
    }
    
    .sidebar-tagline {
      font-size: 11px;
    }
    
    .mobile-nav-text {
      font-size: 14px;
    }
    
    .mobile-user-name {
      font-size: 13px;
    }
    
    .mobile-user-email {
      font-size: 11px;
    }
    
    .mobile-sidebar-header {
      padding: 16px;
    }
    
    .mobile-sidebar-footer {
      padding: 16px;
    }
  }
`;

// Inject styles if we're in a browser environment
if (typeof document !== 'undefined') {
  const styleId = 'mobile-sidebar-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = mobileStyles;
    document.head.appendChild(style);
  }
}