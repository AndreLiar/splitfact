'use client';

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FeedbackMenuItem } from "./FeedbackButton";

const NAV = {
  main:       [{ name: "Tableau de bord", href: "/dashboard", icon: "bi-grid" }],
  invoicing:  [
    { name: "Factures",         href: "/dashboard/invoices",       icon: "bi-receipt" },
    { name: "Exceptions",       href: "/dashboard/exceptions",     icon: "bi-exclamation-diamond" },
    { name: "Nouvelle facture", href: "/dashboard/create-invoice", icon: "bi-file-earmark-plus" },
  ],
  operations: [
    { name: "Clients",       href: "/dashboard/clients",       icon: "bi-person-vcard" },
    { name: "Notifications", href: "/dashboard/notifications", icon: "bi-bell" },
  ],
  compliance: [
    { name: "E-Reporting B2C", href: "/dashboard/e-reporting", icon: "bi-file-earmark-bar-graph" },
    { name: "Conformité",      href: "/dashboard/compliance",  icon: "bi-shield-check" },
  ],
  settings: [{ name: "Paramètres", href: "/dashboard/settings", icon: "bi-gear" }],
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const closeMobileSidebar = () => {
    setTimeout(() => {
      const el = document.getElementById("mobileSidebar");
      if (!el?.classList.contains("show")) return;
      try {
        const bs = (window as any).bootstrap?.Offcanvas?.getInstance(el)
          ?? new (window as any).bootstrap.Offcanvas(el);
        bs?.hide();
      } catch {
        (document.querySelector("#mobileSidebar [data-bs-dismiss='offcanvas']") as HTMLElement)?.click();
      }
    }, 100);
  };

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const NavItem = ({ item }: { item: { name: string; href: string; icon: string } }) => {
    const active = isActive(item.href);
    return (
      <li style={{ listStyle: "none", margin: "1px 0" }}>
        <Link
          href={item.href}
          onClick={closeMobileSidebar}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 10px",
            margin: "0 8px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: active ? 510 : 400,
            color: active ? "#f7f8f8" : "#8a8f98",
            backgroundColor: active ? "rgba(255,255,255,0.05)" : "transparent",
            border: active ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
            transition: "all 120ms cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            fontFeatureSettings: '"cv01", "ss03"',
          }}
          onMouseEnter={e => {
            if (!active) {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.color = "#d0d6e0";
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#8a8f98";
            }
          }}
        >
          {/* Gold indicator for active */}
          {active && (
            <span style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: "2px",
              height: "14px",
              backgroundColor: "#D4921A",
              borderRadius: "0 2px 2px 0",
              marginLeft: "-8px",
            }} />
          )}
          <i
            className={`bi ${item.icon}`}
            style={{
              fontSize: "0.875rem",
              minWidth: "16px",
              color: active ? "#D4921A" : "#62666d",
              transition: "color 120ms ease",
            }}
          />
          <span>{item.name}</span>
        </Link>
      </li>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <div style={{
      padding: "16px 18px 4px",
      fontSize: "0.625rem",
      fontWeight: 590,
      letterSpacing: "0.09em",
      textTransform: "uppercase",
      color: "#62666d",
      fontFeatureSettings: '"cv01", "ss03"',
    }}>
      {label}
    </div>
  );

  return (
    <nav
      style={{
        minWidth: "240px",
        maxWidth: "240px",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1020,
        overflowY: "auto",
        overflowX: "hidden",
        backgroundColor: "#0f1011",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Brand ─────────────────────────────────────── */}
      <div style={{
        padding: "20px 16px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Icon mark */}
          <div style={{
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            backgroundColor: "#D4921A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <i className="bi bi-lightning-fill" style={{ color: "#08090a", fontSize: "0.75rem" }} />
          </div>
          <div>
            <div style={{
              fontSize: "0.9375rem",
              fontWeight: 590,
              color: "#f7f8f8",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              fontFeatureSettings: '"cv01", "ss03"',
            }}>
              InvoiceOps
            </div>
            <div style={{
              fontSize: "0.5625rem",
              fontWeight: 590,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "#62666d",
              marginTop: "1px",
              fontFeatureSettings: '"cv01", "ss03"',
            }}>
              E-facturation
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          className="d-lg-none"
          onClick={closeMobileSidebar}
          data-bs-dismiss="offcanvas"
          data-bs-target="#mobileSidebar"
          aria-label="Fermer"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
            color: "#8a8f98",
            width: "28px",
            height: "28px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i className="bi bi-x" style={{ fontSize: "0.875rem" }} />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <div style={{ flex: 1, paddingTop: "8px", paddingBottom: "8px", overflowY: "auto" }}>
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {NAV.main.map(item => <NavItem key={item.href} item={item} />)}
        </ul>

        <SectionLabel label="Facturation" />
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {NAV.invoicing.map(item => <NavItem key={item.href} item={item} />)}
        </ul>

        <SectionLabel label="Opérations" />
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {NAV.operations.map(item => <NavItem key={item.href} item={item} />)}
        </ul>

        <SectionLabel label="Conformité" />
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {NAV.compliance.map(item => <NavItem key={item.href} item={item} />)}
        </ul>

        <div style={{ marginTop: "8px" }}>
          <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
            {NAV.settings.map(item => <NavItem key={item.href} item={item} />)}
          </ul>
        </div>
      </div>

      {/* ── User footer ───────────────────────────────── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "12px",
        flexShrink: 0,
      }}>
        <div className="dropdown">
          <button
            id="sidebarUserMenu"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            style={{
              background: "none",
              border: "1px solid transparent",
              borderRadius: "6px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px",
              cursor: "pointer",
              transition: "all 120ms ease",
              textAlign: "left",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            }}
          >
            {/* Avatar */}
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "rgba(212,146,26,0.12)",
              border: "1px solid rgba(212,146,26,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6875rem",
              fontWeight: 590,
              color: "#D4921A",
              flexShrink: 0,
              fontFeatureSettings: '"cv01", "ss03"',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "0.8125rem",
                fontWeight: 510,
                color: "#d0d6e0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFeatureSettings: '"cv01", "ss03"',
              }}>
                {session?.user?.name || "Utilisateur"}
              </div>
              <div style={{
                fontSize: "0.6875rem",
                color: "#62666d",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFeatureSettings: '"cv01", "ss03"',
              }}>
                {session?.user?.email}
              </div>
            </div>
            <i className="bi bi-chevron-expand" style={{ color: "#62666d", fontSize: "0.75rem", flexShrink: 0 }} />
          </button>

          <ul className="dropdown-menu" aria-labelledby="sidebarUserMenu" style={{ minWidth: "200px" }}>
            <li>
              <Link className="dropdown-item d-flex align-items-center gap-2" href="/dashboard/settings">
                <i className="bi bi-person" style={{ fontSize: "0.875rem" }} />
                Profil &amp; paramètres
              </Link>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li><FeedbackMenuItem /></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button
                className="dropdown-item d-flex align-items-center gap-2 text-danger"
                onClick={() => signOut()}
              >
                <i className="bi bi-box-arrow-right" style={{ fontSize: "0.875rem" }} />
                Déconnexion
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
