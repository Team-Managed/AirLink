# UI Context: Mobile, Web, Terminal & VS Code Design System

## 1. Design Aesthetics & Visual Tone
- **Theme:** Sleek, high-contrast dark mode tailored for developers (`#090d16`).
- **Color Palette:**
  - **Background Base:** `#090d16` (Deep obsidian navy)
  - **Card / Surface:** `#0f172a` (Slate 900)
  - **Border & Dividers:** `#1e293b` (Slate 800)
  - **Primary Accent / Tokens:** `#38bdf8` (Electric Sky Blue)
  - **Success / Added Lines:** `#22c55e` (Emerald Green)
  - **Danger / Removed Lines:** `#ef4444` (Crimson Red)
  - **Warning / Approvals:** `#f59e0b` (Amber Yellow)
  - **Text Primary:** `#f8fafc` (Slate 50)
  - **Text Muted:** `#94a3b8` (Slate 400)
- **Typography:**
  - UI Labels & Headers: Inter / Outfit / Sans-serif.
  - Code, Diffs & Terminal Logs: Fira Code / JetBrains Mono / Monospace.

---

## 2. Interface Component Conventions

### A. Web Landing Page & Demo Shell (`apps/web`)
- **Hero Showcase:** Large headline, live interactive terminal emulator, and `Launch Web Client` primary action button.
- **Architecture Section:** Clean SVG/Mermaid flowcards detailing the zero-port-forwarding relay tunnel.
- **Web Pairing Client (`/pair`):** Clean 6-digit numeric input with auto-focus and instant live connection stream.

### B. Mobile Client (`apps/mobile` - Expo React Native)
- **Pairing Screen:** Centered 6-digit PIN input with wide letter spacing (`letterSpacing: 8`) and instant auto-submit on 6th digit.
- **Live Terminal Feed:** Virtualized `FlatList` with auto-scroll lock, streaming markdown chunks, and collapsible thought blocks.
- **DiffCard Component:** Syntax-highlighted unified Git diff with green (`+`) and red (`-`) line tinted backgrounds.
- **Approval Drawer:** Spring-animated bottom sheet with amber warning header, 180s countdown progress bar (smooth color morph from green $\to$ amber $\to$ red), and large thumb-friendly touch targets.

### C. Motion Design & Haptics
- **Haptics (`expo-haptics`):** Warning haptic pulse on approval drawer open; medium impact pulse on button taps.
- **Micro-Animations:** Blinking terminal cursor, shimmer skeleton loaders during hydration, and smooth accordion drawer expansions.

### D. Terminal CLI Host (`apps/cli`)
- **Boot Banner:** Boxen double-border with bold green PIN highlight.
- **ASCII QR Code:** Generated via `qrcode-terminal` encoding `agent-remote://pair?pin=<PIN>`.
- **Readline Approval:** Highlighted prompt `Approve [Tool: execute_bash] "npm test"? [y/N]: `.

### E. VS Code Extension Host (`apps/vscode-extension`)
- **Status Bar Item:** `$(radio-tower) Remote PIN: 834-192` with tooltip and click-to-copy.
- **Native Warning Modal:** `vscode.window.showWarningMessage` with actions `[Approve]` and `[Deny]`.
