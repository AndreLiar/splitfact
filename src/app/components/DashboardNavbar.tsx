'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import NotificationCenter from "@/app/dashboard/components/NotificationCenter";

export default function DashboardNavbar() {
  const pathname = usePathname();

  return (
    <nav 
      className="navbar navbar-expand-lg navbar-light bg-white d-md-none border-bottom shadow-sm" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1030,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="container-fluid px-3">
        <button
          className="navbar-toggler border-0 p-1"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#mobileSidebar"
          aria-controls="mobileSidebar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-4"></i>
        </button>
        <Link href="/dashboard" className="navbar-brand fw-bold text-primary mb-0">
          <i className="bi bi-lightning-fill me-1"></i>
          Splitfact
        </Link>
        <div className="d-flex align-items-center">
          <NotificationCenter />
        </div>
      </div>
    </nav>
  );
}