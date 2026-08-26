Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` and `07-mobile-app-shell-and-pairing.md`.

Implement the responsive Web Landing Page and browser-based remote control shell in `apps/web` (or Expo Web export) with dark aesthetics, hero showcase, live interactive terminal emulator, and instant web pairing.

## Implementation

1. Create `apps/web` application shell:
   - Configure Next.js App Router (or Expo Web target) with React 19, TypeScript, and modern dark styling tokens matching `context/ui-context.md` (`#090d16` background, `#0f172a` surfaces, `#38bdf8` electric blue accents).
   - Configure responsive layout supporting mobile viewports (375px), tablets (768px), and wide desktop screens (1440px).
2. Implement Landing Page Hero & Feature Showcase:
   - Header with wordmark _"Agent Remote"_, GitHub repository badge, and `Launch Web Client` primary action button.
   - Hero headline: _"Control Your Local Coding Agent From Anywhere"_, with subtitle explaining zero-port-forwarding pairing with TrueForge and 0x Alpha.
   - One-Click Install Command Bar: Tabbed interactive copy snippet with options:
     - **Windows:** `irm https://agent-remote.dev/install.ps1 | iex`
     - **macOS / Linux:** `curl -fsSL https://agent-remote.dev/install.sh | bash`
     - **npm / npx:** `npx @agent-remote/cli`
   - Host static installer scripts in `apps/web/public/install.ps1` and `apps/web/public/install.sh` for direct browser and terminal script fetching.
   - Interactive Live Demo Simulator: An interactive terminal simulation card showing real-time streaming tokens, a synthetic unified Git diff, and an interactive "Approve" button that triggers simulated execution.
   - Feature Grid: 4 cards highlighting Zero-Config Pairing, Live Token Streaming, Visual Diff Approvals, and Reconnection Resilience (The Elevator Solution).
   - Architecture Diagram Section: Clean, interactive SVG/Mermaid visualization of Mobile Client Relay Workstation Bridge TrueForge.
3. Implement Web Pairing & Client Shell:
   - Clean browser URL route `/pair` (or modal) supporting 6-digit PIN entry and URL query auto-fill (`/pair?pin=834192`).
   - Embedded web version of `SessionScreen` enabling developers on tablets or second laptops to monitor and approve agent turns without installing an app.
4. Implement SEO metadata, OpenGraph preview cards, favicon assets, and fast initial load optimization.

## Scope Limits

- Do not require user authentication or cloud account logins for web pairing.
- Do not run the TrueForge agent engine inside the browser client (web is a remote presentation client).
- Do not connect to analytics trackers that collect user prompts or code diffs.

## Notes

- Web client provides zero-install accessibility for developers who prefer browser tabs or iPads over mobile phones.
- Interactive hero simulator gives hackathon judges an instant interactive understanding of the product in <10 seconds.
- Depends on: 00, 01, 04, 07, 08, 09. Required before: 16.

## Check When Done

- Landing page renders with 100/100 Lighthouse performance and responsive layout across desktop and mobile.
- Interactive hero simulator allows clicking "Approve" and observing animated terminal progress.
- Web pairing client connects to the Relay server via 6-digit PIN and streams real-time session logs.
