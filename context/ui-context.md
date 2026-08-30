# AirLink Brand Identity & Design System (Clean Minimalist SaaS & Panoramic Sky)

## 1. Brand Identity Overview
- **Name:** AirLink
- **Tagline:** Universal Over-The-Air Teleoperation & HITL Safety Gate for Local Coding Agents
- **Aesthetic Direction:** *Clean Modern Developer SaaS with Panoramic Sky Hero & Crisp Pure White Canvas* — High-precision developer interface combining an impressionist high-altitude sky hero backdrop, clean `#ffffff` body canvas, crisp `1px` `#e2e8f0` hairline borders, deep obsidian `#0f172a` primary elements, and vibrant sky/sunset signal accents.

---

## 2. Color Palette & Design Tokens

### Core Background Shades & Surfaces
- `--bg-canvas`: `#ffffff` — Pure white base canvas for all body sections (Features, How It Works, FAQs, Support, Footer).
- `--bg-subtle`: `#f8fafc` — Ultra-light slate tint for alternate sections, status pills, and backdrop containers.
- `--surface-card`: `#ffffff` — Clean white card panels with hairline `#e2e8f0` borders and soft ambient elevation.
- `--surface-card-subtle`: `#f8fafc` — Secondary card surface for inset modules and tab bars.
- `--surface-card-glass`: `rgba(255, 255, 255, 0.92)` — 16px blurred frosted white glass for navigation and sticky headers.
- `--surface-terminal`: `#0f172a` — High-contrast deep obsidian slate terminal well for live token streams and code execution.
- `--surface-inset`: `#f1f5f9` — Clean slate inset wells for inputs, code blocks, and badge backgrounds.
- `--surface-hover`: `#f8fafc` — Subtle interactive card hover state.

### Clean Hairline Borders
- `--border-hairline`: `#e2e8f0` — Standard 1px structural separator.
- `--border-subtle`: `#f1f5f9` — Soft internal dividers and row separators.
- `--border-focus`: `#0f172a` — High-contrast active input focus ring.
- `--border-card`: `#e2e8f0` — Crisp 1px geometric border paired with `box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05)`.

### Harmonized Sky & Signal Accents
- `--powder-dust-blue`: `linear-gradient(135deg, #a3c9ee 0%, #87b2db 100%)` — Soft powder dust blue for all primary interactive buttons and action capsules.
- `--powder-blue-light`: `#e0f2fe` — Soft azure wash for active pills and secondary badges.
- `--sky-azure`: `#0284c7` — High-altitude azure sky accent (matching the hero sky backdrop).
- `--ocean-deep`: `#0f172a` — Deep obsidian slate for typography, branding, and input labels.
- `--ocean-mid`: `#1e293b` — Midnight slate for secondary framing and code headers.
- `--signal-sunset`: `#ea580c` — Sunset ember / coral for 6-digit PIN highlights and warning badges.
- `--signal-gold`: `#d97706` — Warm golden amber for HITL 180s countdown countdown gates.
- `--signal-seafoam`: `#0d9488` — Seafoam emerald for active tunnel connectivity and approved actions.
- `--signal-berry`: `#dc2626` — Sunset berry crimson for destructive command alerts and rejection.

### Typography Hierarchy
- **Display Font:** `Manrope` (wght 600..900) — Bold geometric headlines in deep obsidian `#0f172a`.
- **Body Font:** `Inter` (wght 400..600) — High-legibility UI text in crisp slate `#334155` and `#475569`.
- **Mono Font:** `Fira Code` / `JetBrains Mono` — Code blocks, AST diffs, and session PINs.
- `--text-primary`: `#0f172a` (Obsidian slate - high contrast titles)
- `--text-secondary`: `#334155` (Slate - body and descriptions)
- `--text-muted`: `#64748b` (Slate gray - metadata and subheadings)
- `--text-dim`: `#94a3b8` (Light slate - placeholders and inactive states)

---

## 3. UI Component Principles
- **Hero Landscape Transition:** Full-bleed panoramic sky artwork (`/screenshot-hero.png`) seamlessly feathering into the pure white `#ffffff` canvas via ambient linear gradient overlay.
- **Strict Geometric Elevation:** Crisp radii (`6px`, `8px`, `10px`, `12px`, `14px`, `16px`, `9999px`) with soft atmospheric box shadows (`0 4px 20px -2px rgba(15, 23, 42, 0.05)`).
- **High-Legibility Contrast:** Dark obsidian interactive typography against crisp white/slate surfaces for maximum scannability.
- **Button Standards:**
  - Primary: Powder Dust Blue (`.btn-primary`, `linear-gradient(135deg, #a3c9ee 0%, #87b2db 100%)`, text `#0f172a`, border `rgba(255, 255, 255, 0.7)`).
  - Secondary: Frosted slate (`.btn-secondary`, `#f8fafc`, border `#e2e8f0`, text `#0f172a`).
  - Capsule Pill: Centered glowing glass capsule (`rgba(255, 255, 255, 0.5)` glass blur + dark inner pill).

