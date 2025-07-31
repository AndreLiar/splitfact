'use client';

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

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

  // Handle navigation click
  const handleNavClick = () => {
    // Close mobile offcanvas if it's open
    const offcanvas = document.getElementById('mobileSidebar');
    if (offcanvas && window.getComputedStyle(offcanvas).display !== 'none') {
      const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
  };

  // Render navigation item with active state
  const renderNavItem = (item: { name: string; href: string; icon: string }) => (
    <li className="nav-item" key={item.name}>
      <Link 
        href={item.href} 
        className={`nav-link d-flex align-items-center py-2 px-3 rounded-2 mx-2 mb-1 ${
          isActive(item.href) 
            ? 'bg-primary text-white fw-semibold' 
            : 'text-dark'
        }`}
        style={{ 
          minHeight: '44px',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center'
        }}
        onClick={handleNavClick}
      >
        <i className={`bi ${item.icon} me-2`} style={{ fontSize: '1.1em' }}></i>
        <span>{item.name}</span>
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
      <div className="p-3 border-bottom">
        <h5 className="mb-0 text-primary fw-bold">
          <i className="bi bi-lightning-fill me-2"></i>
          Splitfact
        </h5>
        <small className="text-muted">Facturation collaborative</small>
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