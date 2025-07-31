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
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
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
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning={true}>
        <SessionProvider>
          {isDashboardRoute ? (
            <ToastProvider>
              <DashboardNavbar />
              <div className="offcanvas offcanvas-start" tabIndex={-1} id="mobileSidebar">
                <div className="offcanvas-header">
                  <h5 className="offcanvas-title">Menu</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body p-0">
                  <Sidebar />
                </div>
              </div>
              {/* Desktop Layout with Fixed Sidebar */}
              <div className="d-none d-lg-block">
                <Sidebar />
                <FixedNotificationCenter />
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
      </body>
    </html>
  );
}