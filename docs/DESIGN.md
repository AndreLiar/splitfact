# DESIGN.md — InvoiceOps Design System

Inspired by: **Linear** (dark precision) · **Stripe** (fintech luxury)

## 1. Visual Theme & Atmosphere

InvoiceOps uses a **dark-first, precision-engineered** aesthetic built for French fintech professionals. The canvas is near-black (`#08090a`) with content emerging from luminance steps — surfaces are never solid colors, always translucent overlays. The single chromatic accent is **Amber Gold** (`#D4921A`), which replaces the generic blue found in most SaaS dashboards and signals premium, invoicing-grade authority.

Typography is Inter (variable) with OpenType features `"cv01", "ss03"` enabled globally — the same treatment Linear uses to give Inter a geometric, purposeful character. Financial data uses JetBrains Mono with tabular numerals (`"tnum"`).

**Key characteristics:**
- Canvas: `#08090a` (near-black, marketing); `#0f1011` (sidebar); `#131415` (card base)
- Surfaces: translucent white overlays (`rgba(255,255,255,0.02–0.05)`) — never solid
- Borders: semi-transparent white (`rgba(255,255,255,0.05–0.12)`) — never solid dark
- Accent: Amber Gold `#D4921A` / `#F0AE38` — the **only** chromatic UI color
- Typography: Inter Variable `"cv01","ss03"` · JetBrains Mono `"tnum"`
- Shadows: Linear's multi-layer dialog stack, luminance-stepping for elevation

## 2. Color Palette

### Backgrounds (Linear luminance-stepping)
| Token | Hex | Role |
|---|---|---|
| `--canvas` | `#08090a` | Page background |
| `--surface-0` | `#0f1011` | Sidebar, panel |
| `--surface-1` | `#131415` | Card base |
| `--surface-2` | `#191a1b` | Elevated — dropdowns, modals |
| `--surface-3` | `#28282c` | Hover states |

### Text
| Token | Hex | Role |
|---|---|---|
| `--text-primary` | `#f7f8f8` | Headings, emphasis (not pure white) |
| `--text-secondary` | `#d0d6e0` | Body text, default |
| `--text-tertiary` | `#8a8f98` | Labels, placeholders |
| `--text-muted` | `#62666d` | Timestamps, disabled |

### Brand accent
| Token | Hex | Role |
|---|---|---|
| `--gold` | `#D4921A` | Solid CTA buttons, active indicators |
| `--gold-bright` | `#F0AE38` | Hover, links, text accents |
| `--gold-surface` | `rgba(212,146,26,0.08)` | Badge/chip backgrounds |
| `--gold-border` | `rgba(212,146,26,0.20)` | Active card borders |
| `--gold-glow` | `rgba(212,146,26,0.15)` | Focus ring, glow |

### Borders (semi-transparent white — never solid on dark)
| Token | Value | Role |
|---|---|---|
| `--border-subtle` | `rgba(255,255,255,0.05)` | Default, cards |
| `--border-default` | `rgba(255,255,255,0.08)` | Inputs, modals |
| `--border-medium` | `rgba(255,255,255,0.12)` | Hover, active |
| `--border-solid` | `#23252a` | Prominent dividers |

### Status
| Token | Hex | Role |
|---|---|---|
| `--emerald` | `#10b981` | Success, paid, active |
| `--rose` | `#e05252` | Error, overdue, danger |
| `--amber` | `#e0943a` | Warning, pending |
| `--blue` | `#5e6ad2` | Info, neutral action |

## 3. Typography

### Fonts
- **UI**: `Inter`, `font-feature-settings: "cv01", "ss03"` — applied to ALL elements globally
- **Mono**: `JetBrains Mono`, `font-feature-settings: "tnum"` — numbers, IDs, amounts

### Hierarchy
| Role | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | 2rem | 590 | -0.704px | Page titles |
| Section head | 1.5rem | 510 | -0.288px | Card headers |
| Feature title | 1.25rem | 590 | -0.24px | h3 |
| UI body | 0.9375rem | 400 | normal | Default text |
| Label | 0.75rem | 590 | +0.06em | Form labels (uppercase) |
| Caption/meta | 0.6875rem | 590 | +0.07em | Table headers, section labels (uppercase) |
| Metric | 1.625rem | 500 | -0.02em | JetBrains Mono, KPI numbers |

**Weight guide**: 400 (read) · 510 (emphasise/navigate) · 590 (announce). Max weight is 590 — never 700.

## 4. Components

### Buttons
- **Primary**: `background: #D4921A`, `color: #08090a`, `radius: 6px`, `font-weight: 600`
- **Ghost/Secondary**: `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, `color: #d0d6e0`
- **Outline Primary**: `background: rgba(255,255,255,0.02)`, `border: rgba(255,255,255,0.08)`, `color: #F0AE38`
- Focus: `box-shadow: 0 0 0 3px rgba(212,146,26,0.15)`

### Cards
- `background: rgba(255,255,255,0.02)` — translucent, never solid
- `border: 1px solid rgba(255,255,255,0.05)`
- `border-radius: 8px`
- Hover: `background: rgba(255,255,255,0.03)`, `border-color: rgba(255,255,255,0.08)`

### Inputs
- `background: rgba(255,255,255,0.02)`, `border: 1px solid rgba(255,255,255,0.08)`, `color: #f7f8f8`
- Focus: `border-color: #D4921A`, `box-shadow: 0 0 0 3px rgba(212,146,26,0.15)`
- Labels: uppercase, 0.75rem, weight 590, color `#8a8f98`

### Badges
- All have translucent surface + colored border
- Format: `background: rgba(color, 0.08–0.12)`, `border: 1px solid rgba(color, 0.2)`, `color: var(--status-color)`
- No opaque colored backgrounds

### Table headers
- 0.6875rem, weight 590, uppercase, letter-spacing 0.07em, color `#62666d`

### Sidebar
- Background: `#0f1011`, `border-right: 1px solid rgba(255,255,255,0.05)`
- Active item: `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.08)`, left gold indicator `2px solid #D4921A`
- Icon: gold `#D4921A` when active, muted `#62666d` when inactive
- Section labels: 0.625rem, uppercase, 0.09em tracking, `#62666d`

## 5. Shadows (Linear system)

| Level | Treatment | Use |
|---|---|---|
| Micro | `rgba(0,0,0,0.03) 0px 1.2px 0px` | Toolbar buttons |
| Ring | `rgba(0,0,0,0.2) 0px 0px 0px 1px` | Subtle containers |
| Float | `rgba(0,0,0,0.4) 0px 2px 4px` | Dropdowns |
| Dialog | Multi-layer stack (see tokens) | Modals, popovers |

On dark surfaces: elevation = higher background opacity, not darker shadows.

## 6. Spacing (8px grid)
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`

Border radius scale: `2px · 4px · 6px · 8px · 12px · 22px · 9999px`

## 7. Do's and Don'ts

**Do:**
- Apply `font-feature-settings: "cv01", "ss03"` to ALL Inter text
- Use `rgba(255,255,255,0.02–0.05)` for card/surface backgrounds — never solid
- Use `rgba(255,255,255,0.05–0.12)` for borders — never solid dark borders on dark
- Reserve `#D4921A` gold for primary CTAs, active indicators, and focus rings only
- Use `#f7f8f8` for primary text, not pure `#ffffff`
- JetBrains Mono + `"tnum"` for all financial amounts and IDs

**Don't:**
- Don't use pure `#ffffff` for text
- Don't use solid opaque backgrounds on cards — always translucent
- Don't use blue/purple as primary — gold is the only accent
- Don't exceed weight 590 — never `font-weight: 700`
- Don't use warm/light backgrounds in the chrome — the palette is cool-neutral + gold

## 8. Agent Prompt Quick Reference

```
Canvas: #08090a | Panel: #0f1011 | Surface: #191a1b
Primary text: #f7f8f8 | Body: #d0d6e0 | Muted: #8a8f98
Gold CTA: #D4921A | Gold bright: #F0AE38 | Gold glow: rgba(212,146,26,0.15)
Border default: rgba(255,255,255,0.08) | Border subtle: rgba(255,255,255,0.05)
Success: #10b981 | Danger: #e05252 | Warning: #e0943a | Info: #5e6ad2
Font: Inter, font-feature-settings: "cv01","ss03" | Mono: JetBrains Mono, "tnum"
Radius: 6px (buttons/inputs) | 8px (cards) | 12px (panels) | 22px (modals)
```
