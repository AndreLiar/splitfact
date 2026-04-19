'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Problème",           href: "/#problem" },
  { label: "Comment ça marche",  href: "/#how-it-works" },
  { label: "Fonctionnalités",    href: "/#features" },
  { label: "Conformité",         href: "/#regulatory" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ─── Top accent line ────────────────────────────── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 1031,
        height: "1px",
        background: "linear-gradient(90deg, transparent 0%, rgba(212,146,26,0.5) 40%, rgba(240,174,56,0.7) 55%, rgba(212,146,26,0.5) 70%, transparent 100%)",
      }} />

      {/* ─── Main nav ───────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: "1px",
          zIndex: 1030,
          backgroundColor: scrolled ? "rgba(8,9,10,0.94)" : "rgba(8,9,10,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(255,255,255,0.05)",
          transition: "background-color 200ms ease, border-color 200ms ease",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            height: "64px",
            gap: "0",
          }}>

            {/* ── Brand ─────────────────────────────────── */}
            <Link
              href="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginRight: "40px",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                backgroundColor: "#D4921A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 0 1px rgba(212,146,26,0.3), 0 2px 8px rgba(212,146,26,0.2)",
              }}>
                <i className="bi bi-lightning-fill" style={{ color: "#08090a", fontSize: "0.875rem" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span style={{
                  fontSize: "1rem",
                  fontWeight: 590,
                  color: "#f7f8f8",
                  letterSpacing: "-0.02em",
                  fontFeatureSettings: '"cv01","ss03"',
                }}>
                  InvoiceOps
                </span>
                <span style={{
                  fontSize: "0.5625rem",
                  fontWeight: 590,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "#62666d",
                  marginTop: "2px",
                  fontFeatureSettings: '"cv01","ss03"',
                }}>
                  E-Facturation IA
                </span>
              </div>
            </Link>

            {/* ── Desktop nav links ─────────────────────── */}
            <ul
              className="d-none d-lg-flex"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0",
                listStyle: "none",
                margin: 0,
                padding: 0,
                flex: 1,
              }}
            >
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      display: "block",
                      padding: "6px 14px",
                      textDecoration: "none",
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "#8a8f98",
                      letterSpacing: "0",
                      fontFeatureSettings: '"cv01","ss03"',
                      transition: "color 150ms ease",
                      whiteSpace: "nowrap" as const,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color = "#f7f8f8";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color = "#8a8f98";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* ── Desktop actions ───────────────────────── */}
            <div
              className="d-none d-lg-flex"
              style={{
                alignItems: "center",
                gap: "8px",
                marginLeft: "auto",
                paddingLeft: "24px",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Link
                href="/auth/signin"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 16px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: pathname === "/auth/signin" ? "#F0AE38" : "#d0d6e0",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontFeatureSettings: '"cv01","ss03"',
                  transition: "all 150ms ease",
                  whiteSpace: "nowrap" as const,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = "rgba(255,255,255,0.06)";
                  el.style.borderColor = "rgba(255,255,255,0.14)";
                  el.style.color = "#f7f8f8";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.08)";
                  el.style.color = pathname === "/auth/signin" ? "#F0AE38" : "#d0d6e0";
                }}
              >
                Connexion
              </Link>

              <Link
                href="/auth/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 18px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 590,
                  color: "#08090a",
                  backgroundColor: "#D4921A",
                  border: "1px solid rgba(212,146,26,0.6)",
                  fontFeatureSettings: '"cv01","ss03"',
                  transition: "all 150ms ease",
                  whiteSpace: "nowrap" as const,
                  boxShadow: "0 1px 3px rgba(212,146,26,0.25)",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = "#F0AE38";
                  el.style.boxShadow = "0 2px 8px rgba(212,146,26,0.35)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = "#D4921A";
                  el.style.boxShadow = "0 1px 3px rgba(212,146,26,0.25)";
                }}
              >
                Accès bêta
                <i className="bi bi-arrow-right" style={{ fontSize: "0.75rem" }} />
              </Link>
            </div>

            {/* ── Mobile hamburger ─────────────────────── */}
            <button
              className="d-lg-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
              style={{
                marginLeft: "auto",
                background: isMenuOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "6px",
                color: "#d0d6e0",
                width: "38px",
                height: "38px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 150ms ease",
                flexShrink: 0,
              }}
            >
              <i
                className={`bi ${isMenuOpen ? "bi-x" : "bi-list"}`}
                style={{ fontSize: "1.1875rem", lineHeight: 1 }}
              />
            </button>
          </div>
        </div>

        {/* ─── Mobile drawer ──────────────────────────── */}
        {isMenuOpen && (
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            backgroundColor: "rgba(8,9,10,0.97)",
            padding: "12px 32px 24px",
          }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {NAV_LINKS.map((link, i) => (
                <li key={link.href} style={{
                  borderBottom: i < NAV_LINKS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 0",
                      textDecoration: "none",
                      fontSize: "0.9375rem",
                      fontWeight: 400,
                      color: "#d0d6e0",
                      fontFeatureSettings: '"cv01","ss03"',
                    }}
                  >
                    {link.label}
                    <i className="bi bi-chevron-right" style={{ fontSize: "0.75rem", color: "#62666d" }} />
                  </Link>
                </li>
              ))}
            </ul>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Link
                href="/auth/signin"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  fontWeight: 400,
                  color: "#d0d6e0",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontFeatureSettings: '"cv01","ss03"',
                }}
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  fontWeight: 590,
                  color: "#08090a",
                  backgroundColor: "#D4921A",
                  border: "1px solid rgba(212,146,26,0.5)",
                  fontFeatureSettings: '"cv01","ss03"',
                }}
              >
                Accès bêta
                <i className="bi bi-arrow-right" style={{ fontSize: "0.875rem" }} />
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
