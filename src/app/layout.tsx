'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
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
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
    
    // Add sidebar event listeners for mobile close button
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
    
    // Set up event listeners when component mounts
    const setupSidebarListeners = () => {
      const sidebar = document.getElementById('mobileSidebar');
      if (sidebar) {
        sidebar.addEventListener('show.bs.offcanvas', handleSidebarShow);
        sidebar.addEventListener('hide.bs.offcanvas', handleSidebarHide);
      }
    };
    
    // Delay setup to ensure DOM is ready
    setTimeout(setupSidebarListeners, 500);
    
    // Cleanup
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
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <title>Splitfact – La facturation collaborative</title>
        <meta name="description" content="Générez des factures collectives conformes avec vos freelances." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Favicon configuration - Override Vercel default */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        
        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="application-name" content="Splitfact" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Splitfact" />
        <meta name="msapplication-TileColor" content="#2563EB" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* Microsoft Edge/Windows */}
        <meta name="msapplication-starturl" content="/dashboard" />
        <meta name="msapplication-navbutton-color" content="#2563EB" />
        
        {/* Google Analytics integrated - Force deployment */}
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning={true}>
        <SessionProvider>
          {isDashboardRoute ? (
            <ToastProvider>
              <DashboardNavbar />
              
              {/* PWA Components */}
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
                    style={{
                      minWidth: '32px',
                      minHeight: '32px',
                      borderRadius: '8px'
                    }}
                  ></button>
                </div>
                <div className="offcanvas-body p-0" role="navigation" aria-label="Menu principal">
                  <Sidebar />
                </div>
              </div>
              {/* Desktop Layout with Fixed Sidebar */}
              <div className="d-none d-lg-block">
                <Sidebar />
                <FixedNotificationCenter />
                
                {/* Floating Feedback Button for Desktop */}
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1050 }}>
                  <FeedbackButton 
                    variant="primary" 
                    size="md"
                    className="shadow-lg"
                    showText={true}
                  />
                </div>
                
                <main 
                  style={{ 
                    marginLeft: '260px', 
                    padding: '2rem',
                    minHeight: '100vh',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <div className="container-fluid" style={{ maxWidth: '1200px' }}>
                    {children}
                  </div>
                </main>
              </div>
              
              {/* Mobile and Tablet Layout */}
              <div className="d-lg-none">
                <FixedNotificationCenter />
                
                {/* Floating Close Sidebar Button */}
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
                    transition: 'all 0.3s ease-in-out'
                  }}
                  onClick={() => {
                    const offcanvas = document.getElementById('mobileSidebar');
                    if (offcanvas) {
                      const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
                      if (bsOffcanvas) {
                        bsOffcanvas.hide();
                      }
                    }
                  }}
                  aria-label="Fermer le menu"
                >
                  <i className="bi bi-x" style={{ fontSize: '1.5rem' }}></i>
                </button>

                {/* Floating Feedback Button for Mobile */}
                <FeedbackButton variant="floating" />
                
                <main 
                  className="container-fluid px-3 py-3" 
                  style={{ 
                    paddingTop: '80px', 
                    paddingBottom: '20px',
                    minHeight: '100vh',
                    backgroundColor: '#f8f9fa'
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
        </SessionProvider>
        <GoogleAnalytics gaId="G-VNPY0RYV2B" />
      </body>
    </html>
  );
}