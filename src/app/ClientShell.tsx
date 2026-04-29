'use client';

import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import SessionProvider from "@/app/components/SessionProvider";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import DashboardNavbar from "@/app/components/DashboardNavbar";
import { ToastProvider } from "@/app/dashboard/components/ToastProvider";
import FixedNotificationCenter from "@/app/dashboard/components/FixedNotificationCenter";
import FeedbackButton from "@/app/components/FeedbackButton";
import { PWAInstallBadge } from "@/app/components/PWAInstallPrompt";
import OfflineIndicator from "@/app/components/OfflineIndicator";
import PWAUpdatePrompt from "@/app/components/PWAUpdatePrompt";
import CookieBanner, { getCookieConsent } from "@/app/components/CookieBanner";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from '@next/third-parties/google';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    setAnalyticsConsent(getCookieConsent() === 'accepted');
    const onStorage = () => setAnalyticsConsent(getCookieConsent() === 'accepted');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");

    const handleSidebarShow = () => {
      const floatingBtn = document.getElementById('floatingCloseSidebar');
      if (floatingBtn) {
        floatingBtn.classList.remove('d-none');
        setTimeout(() => {
          floatingBtn.style.opacity = '1';
          floatingBtn.style.transform = 'translateY(-50%) scale(1)';
        }, 100);
      }
    };

    const handleSidebarHide = () => {
      const floatingBtn = document.getElementById('floatingCloseSidebar');
      if (floatingBtn) {
        floatingBtn.style.opacity = '0';
        floatingBtn.style.transform = 'translateY(-50%) scale(0.8)';
        setTimeout(() => {
          floatingBtn.classList.add('d-none');
        }, 300);
      }
    };

    const setupSidebarListeners = () => {
      const sidebar = document.getElementById('mobileSidebar');
      if (sidebar) {
        sidebar.addEventListener('show.bs.offcanvas', handleSidebarShow);
        sidebar.addEventListener('hide.bs.offcanvas', handleSidebarHide);
      }
    };

    setTimeout(setupSidebarListeners, 500);

    return () => {
      const sidebar = document.getElementById('mobileSidebar');
      if (sidebar) {
        sidebar.removeEventListener('show.bs.offcanvas', handleSidebarShow);
        sidebar.removeEventListener('hide.bs.offcanvas', handleSidebarHide);
      }
    };
  }, []);

  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard");

  return (
    <>
      <SessionProvider>
        {isDashboardRoute ? (
          <ToastProvider>
            <DashboardNavbar />

            <OfflineIndicator showOnlineStatus={true} />
            <PWAUpdatePrompt />
            <PWAInstallBadge className="d-lg-none" />

            <div
              className="offcanvas offcanvas-start mobile-sidebar-offcanvas"
              tabIndex={-1}
              id="mobileSidebar"
              aria-labelledby="mobileSidebarLabel"
              style={{ width: '280px' }}
            >
              <div className="offcanvas-header border-bottom">
                <h5 className="offcanvas-title fw-bold text-primary d-flex align-items-center" id="mobileSidebarLabel">
                  <i className="bi bi-lightning-fill me-2"></i>
                  Menu Navigation
                </h5>
                <button
                  type="button"
                  className="btn-close mobile-close-btn"
                  data-bs-dismiss="offcanvas"
                  aria-label="Fermer le menu de navigation"
                  style={{ minWidth: '32px', minHeight: '32px', borderRadius: '8px' }}
                ></button>
              </div>
              <div className="offcanvas-body p-0" role="navigation" aria-label="Menu principal">
                <Sidebar />
              </div>
            </div>

            <div className="d-none d-lg-block">
              <Sidebar />
              <FixedNotificationCenter />

              <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1050 }}>
                <FeedbackButton variant="primary" size="md" className="shadow-lg" showText={true} />
              </div>

              <main
                style={{
                  marginLeft: '240px',
                  padding: '2rem',
                  minHeight: '100vh',
                  backgroundColor: '#08090a',
                }}
              >
                <div className="container-fluid" style={{ maxWidth: '1200px' }}>
                  {children}
                </div>
              </main>
            </div>

            <div className="d-lg-none">
              <FixedNotificationCenter />

              <button
                id="floatingCloseSidebar"
                className="btn btn-primary shadow-lg d-none"
                style={{
                  position: 'fixed',
                  top: '50%',
                  right: '20px',
                  zIndex: 1040,
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: 'none',
                  transform: 'translateY(-50%)',
                  transition: 'all 0.3s ease-in-out',
                }}
                onClick={() => {
                  const offcanvas = document.getElementById('mobileSidebar');
                  if (offcanvas) {
                    const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
                    if (bsOffcanvas) bsOffcanvas.hide();
                  }
                }}
                aria-label="Fermer le menu"
              >
                <i className="bi bi-x" style={{ fontSize: '1.5rem' }}></i>
              </button>

              <FeedbackButton variant="floating" />

              <main
                className="container-fluid px-3 py-3"
                style={{
                  paddingTop: '80px',
                  paddingBottom: '20px',
                  minHeight: '100vh',
                  backgroundColor: '#0D1117',
                }}
              >
                {children}
              </main>
            </div>
          </ToastProvider>
        ) : (
          <>
            <Navbar />
            <main>{children}</main>
          </>
        )}
        <CookieBanner />
      </SessionProvider>
      {analyticsConsent && <GoogleAnalytics gaId="G-VNPY0RYV2B" />}
    </>
  );
}
