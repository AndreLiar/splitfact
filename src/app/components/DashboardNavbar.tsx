'use client';

import Link from "next/link";
import NotificationCenter from "@/app/dashboard/components/NotificationCenter";
import FeedbackButton from "./FeedbackButton";

export default function DashboardNavbar() {
  return (
    <nav
      className="d-lg-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1030,
        backgroundColor: 'rgba(8,9,10,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
      }}
    >
      {/* Hamburger */}
      <button
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#mobileSidebar"
        aria-controls="mobileSidebar"
        aria-label="Ouvrir le menu"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '8px',
          color: '#d0d6e0',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <i className="bi bi-list" style={{ fontSize: '1.25rem', lineHeight: 1 }} />
      </button>

      {/* Brand — centered */}
      <Link
        href="/dashboard"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textDecoration: 'none',
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          backgroundColor: '#D4921A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className="bi bi-lightning-fill" style={{ color: '#08090a', fontSize: '0.75rem' }} />
        </div>
        <span style={{
          fontSize: '0.9375rem',
          fontWeight: 590,
          color: '#f7f8f8',
          letterSpacing: '-0.01em',
          fontFeatureSettings: '"cv01","ss03"',
        }}>
          InvoiceOps
        </span>
      </Link>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <FeedbackButton
          variant="link"
          size="sm"
          position="navbar"
          showText={false}
          className="p-2"
        />
        <NotificationCenter />
      </div>
    </nav>
  );
}
