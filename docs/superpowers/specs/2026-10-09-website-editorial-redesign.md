# Design Specification: AirLink Editorial Website Revamp

## 1. Overview & Context

Revamp the AirLink web application (`apps/web`) to transition from the high-contrast pure white/sky-photo canvas to a warm, human-centered, editorial design system inspired directly by the 4 visual reference slides.

This design blends technical developer rigor with editorial beauty: warm cream and bisque surfaces, deep marine ink typography, cobalt blue hardware vector art, soft coral blur status dots, lime green geometric underlines, and luminous ambient glows.

---

## 2. Visual Identity & Design Tokens

### 2.1 Color Palette (`apps/web/src/app/globals.css` & `context/ui-context.md`)
- **Canvas & Primary Surfaces:**
  - `--bg-canvas`: `#FAF7F2` (warm cream canvas)
  - `--bg-subtle`: `#F3ECE2` (warm bisque / almond tint for alternating containers)
  - `--bg-cerulean`: `#DBE9F6` (soft powder sky wash for Problem and Pairing sections)
  - `--surface-card`: `#FFFFFF` (crisp white card surface with soft warm tint)
  - `--surface-warm`: `#FDFBF7` (warm inset card surface)
  - `--surface-terminal`: `#0C182B` (deep midnight indigo terminal slate)
- **Borders & Dividers:**
  - `--border-hairline`: `#E8E0D5` (warm hairline separator)
  - `--border-cerulean`: `#C7DCF0` (soft sky border for cerulean cards)
  - `--border-card`: `rgba(18, 43, 73, 0.08)`
- **Typography Inks:**
  - `--ink-deep`: `#122B49` (deep marine ink blue for primary headlines and display text)
  - `--ink-body`: `#2E4767` (balanced slate navy for body prose)
  - `--ink-muted`: `#5D7898` (medium blue-gray for labels, captions, and secondary text)
  - `--ink-dim`: `#8BA2BC` (subtle captions and metadata)
- **Artistic & Signal Accents:**
  - `--accent-cobalt`: `#2563EB` (vibrant royal/cobalt blue for laptop and phone illustrations)
  - `--accent-coral`: `#FB7185` (soft coral / rose with subtle ambient blur for tension dots)
  - `--accent-lime`: `#84CC16` (lime green for step underlines and success highlights)
  - `--accent-gold`: `#F59E0B` (warm sunset amber for 180s safety gate and illuminated clock)
  - `--accent-peach`: `#FCA5A5` (soft organic botanical accents)
  - `--accent-leaf`: `#65A30D` (organic leaf green accents)

### 2.2 Typography Hierarchy
- **Display Font:** `Manrope` / `Outfit` / `Inter` (`wght: 700..900`) in `--ink-deep` (`#122B49`), loose tracking on headlines (`-0.02em` to `-0.03em`), line-height `1.1`.
- **Eyebrow Category Labels:** Uppercase tracking (`letter-spacing: 0.12em`, `font-size: 11px`, `font-weight: 800`, e.g. `AIRLINK · CODEX EVENT`, `PAIRING`, `MOBILE APPROVALS`).
- **Body Font:** `Inter` (`wght: 400..500`) in `--ink-body` (`#2E4767`).
- **Mono Font:** `Fira Code` / `JetBrains Mono` for commands, PINs, and code blocks.

---

## 3. Structural Page Architecture (`apps/web/src/app/page.tsx`)

The landing page is organized into an intuitive editorial narrative:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Floating Warm Island Navigation                         │
│    Brand + Story + Pairing + Approvals + APK Download CTA   │
├─────────────────────────────────────────────────────────────┤
│ 2. Hero Section (Slide 1)                                   │
│    - Eyebrow: AIRLINK · CODEX EVENT                         │
│    - Title: AirLink: remote control for local coding agents │
│    - Founder Credential: Tyra KJ (@tyraakj)                 │
│    - Actions: Download .APK | Pair in Browser | npx CLI     │
│    - Vector Art: Cobalt laptop with ribbon wave to phone    │
├─────────────────────────────────────────────────────────────┤
│ 3. Problem Section: "Tied to the Desk" (Slide 2)            │
│    - Title: Long-running agents keep developers tied to...  │
│    - 3 Tension Points with Coral Glow Blur Dots             │
│    - Illuminated Sun/Clock (15–45m) & Botanical Flowers     │
├─────────────────────────────────────────────────────────────┤
│ 4. Pairing Flow & Zero-Retention (Slide 3)                  │
│    - Eyebrow: PAIRING                                       │
│    - Title: Pair with one command and a six-digit PIN       │
│    - 3 Step Cards (01 Run CLI, 02 Enter PIN, 03 Outbound)   │
│    - Lime-Green Underline Accents & Illustrated Hardware    │
│    - Privacy Banner: The room retains no tokens...          │
├─────────────────────────────────────────────────────────────┤
│ 5. Mobile Approvals & Safety Gate (Slide 4)                 │
│    - Eyebrow: MOBILE APPROVALS                              │
│    - Title: Mobile approvals feel native and fail safe      │
│    - Bullets: Terminal stream, color-coded diffs, haptics,  │
│      180s auto-deny timeout                                 │
│    - Illustrated Cobalt Phone with Diff Card & Paper Flower │
├─────────────────────────────────────────────────────────────┤
│ 6. Technical Foundations & Multiplatform Support            │
│    - Install Command Bar (Windows / macOS / Linux / npx)    │
│    - Interactive Live Pair Simulator & Quick Tester         │
├─────────────────────────────────────────────────────────────┤
│ 7. FAQs, Support & Editorial Footer                         │
│    - Clean Warm Accordion FAQs                              │
│    - Support Ticket Form                                    │
│    - Editorial Footer with Hackathon Alignment & Credits    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Component Details & Visual Implementations

### 4.1 `EditorialNavbar.tsx` (or updated `LandingNavbar.tsx`)
- Floating pill navbar on `--bg-canvas` with frosted warm glass (`background: rgba(250, 247, 242, 0.85); backdrop-filter: blur(16px)`).
- Origami paper airplane logo + deep navy `AirLink` wordmark.
- Navigation links: `Overview`, `Problem`, `Pairing`, `Approvals`, `Docs`.
- Actions:
  - Primary button: Cobalt blue capsule `Download Android App (.APK)` (`#2563EB`).
  - Secondary link: `Pair in Browser (/pair)`.

### 4.2 `EditorialHeroSection.tsx` (Replaces `PanoramicLandscapeHero.tsx`)
- Left column (Content):
  - Eyebrow: `AIRLINK · CODEX EVENT` in `--ink-muted` uppercase.
  - Headline: `AirLink: remote control for local coding agents` in `--ink-deep` (`#122B49`).
  - Founder Credential Tag: `Tyra KJ · @tyraakj · Full-stack & AI Dev · 4× hackathon winner`.
  - Action Row: Primary `Download Android App (.APK)`, secondary `Pair in Browser`, and copyable quick CLI badge `npx @airlink/cli`.
- Right column (Hero Artwork):
  - Handcrafted SVG/CSS composition featuring:
    - Warm organic desk blob in soft wheat `#F3ECE2`.
    - Cobalt blue laptop with deep navy display showing code lines and wireless relay status.
    - Floating mechanical keyboard in cobalt/slate.
    - Ethereal cerulean wave/ribbon (`#60A5FA` / `#3B82F6`) streaming smoothly from laptop touchpad into a floating smartphone.
    - Smartphone displaying interactive UI cards with translucent pastel accents.

### 4.3 `TiedToTheDeskSection.tsx` (Slide 2 Feature)
- Background: Soft cerulean wash (`#DBE9F6`) with organic rounded container.
- Left column:
  - Headline: `Long-running agents keep developers tied to the desk` (`#122B49`).
  - 3 Tension Points:
    - `15–45 minutes`: Refactors, migrations, and test generation can run 15–45 minutes.
    - `Stay close or step away`: Leave the terminal unattended, or stay close to approve tools and protect the repository.
    - `Mobility with oversight`: AirLink aims to restore mobility without giving up human oversight.
  - Each item features a soft coral glowing circular blur indicator (`#FB7185`).
- Right column:
  - Warm luminous sun/clock element with soft radial halo (`#FEF08A` / `#FDE047`) and animated clock hands indicating 15–45 min duration.
  - Handcrafted organic botanical floral blooms (peach `#FCA5A5`, olive greens `#65A30D`, soft leaf patterns) framing the clock element.

### 4.4 `PairingFlowSection.tsx` (Slide 3 Feature - Replaces/Upgrades `HowItWorksSection.tsx`)
- Eyebrow: `PAIRING`
- Title: `Pair with one command and a six-digit PIN`
- Subtitle: `A temporary room connects the devices, then dissolves.`
- 3 Step Cards Grid on warm cream/cerulean backdrop:
  - **Card 01: Run the CLI**
    - Step index `01` with lime-green accent underline (`#84CC16`).
    - Title: `Run the CLI`.
    - Illustrated laptop showing terminal output with interactive cursor.
    - Monospace pill badge: `npx @airlink/cli on the workstation.` with one-click copy.
  - **Card 02: Enter the PIN**
    - Step index `02` with lime-green accent underline (`#84CC16`).
    - Title: `Enter the PIN`.
    - Illustrated phone mockup with orange pill `Temporary PIN` and interactive 6-digit keypad.
    - Subtext: `Use the temporary PIN on a phone or at pair.`
  - **Card 03: Connect outbound**
    - Step index `03` with lime-green accent underline (`#84CC16`).
    - Title: `Connect outbound`.
    - Illustrated isometric laptop and phone joined by bidirectional circulating WebSocket ribbons.
    - Subtext: `An outbound WebSocket joins both devices through a temporary in-memory relay room.`
- Footer Banner:
  - Uppercase tracked disclaimer: `THE ROOM RETAINS NO TOKENS, DIFFS, OR CODE, AND DISSOLVES AT DISCONNECT.`

### 4.5 `MobileApprovalsSection.tsx` (Slide 4 Feature)
- Eyebrow: `MOBILE APPROVALS`
- Title: `Mobile approvals feel native and fail safe`
- Feature specifications:
  - `Readable terminal stream and expandable, color-coded Git diff cards.`
  - `Approve from phone or workstation; mobile prompts include haptic feedback.`
  - `After 180 seconds without a response, the action defaults to deny.` (with bold `180 seconds` emphasis)
- Right side illustration:
  - Cobalt blue smartphone frame (`#1D4ED8`).
  - Nested expandable diff card with green additions (`+ color: "#122b49"`) and red deletions (`- color: "transparent"`).
  - Active 180s countdown status bar with Approve / Deny buttons.
  - Stylized peach paper blossom accent (`#FCA5A5`).

### 4.6 Preservation of Existing Technical Capabilities
- The live EAS Android APK download link (`APK_DOWNLOAD_URL`) is preserved across primary CTA buttons.
- The web browser client `/pair` route and live WebSocket session capabilities remain fully operational.
- The interactive terminal command bar with tab switching (Windows PowerShell, macOS/Linux bash, npx) is retained and styled to match the warm editorial theme.
- All existing tests in `@airlink/web` continue to pass.

---

## 5. Verification Plan

1. **Unit & Component Tests:** Run `pnpm --filter @airlink/web test` to verify that existing route and configuration tests pass.
2. **Type Checking:** Run `pnpm --filter @airlink/web typecheck` (or `pnpm typecheck`) to confirm 100% clean TypeScript with zero type suppressions.
3. **Lint & Mechanical Suppression Check:** Run `pnpm lint` and `node scripts/check-suppressions.mjs` to ensure zero forbidden suppressions.
4. **Visual & Responsive Verification:** Inspect mobile, tablet, and desktop viewports to ensure seamless responsive scaling, crisp SVG vector assets, and legible typography contrast.
