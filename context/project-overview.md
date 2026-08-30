# Project Overview: Remote Agent Harness

## 1. Product Definition & Mission

An open-source, multiplatform remote control system for local coding agents (TrueForge / 0x Alpha / DeepSeek / Claude). It allows developers to prompt their workstation agent, view real-time streaming tokens and terminal outputs, inspect visual Git diffs, and approve or reject sensitive tool actions (e.g. bash commands, file modifications) from a mobile app or web browser, controlled locally via either a **Terminal CLI** or a **VS Code Extension**.

---

## 2. Core Goals & Hackathon Objectives

1. **WeMakeDevs Hackathon — Double-O Track (TrueFoundry):**
   - Maximize utilization of TrueForge as the core agent execution harness.
   - Harness MCP (Model Context Protocol) tool servers for local filesystem and terminal interactions.
   - Implement Human-in-the-Loop (HITL) approval gates to safely intercept dangerous operations before execution.
2. **WeMakeDevs Hackathon — Q Branch Track (Qodo):**
   - Comprehensive test suite generated with Qodo Gen covering protocol contracts, ring buffer, rate limiting, and timeout state machines (>90% coverage).
   - Automated PR reviews, code descriptions, security checks, and inline improvement suggestions via Qodo Merge (`qodo-ai/pr-agent-action`).
   - Test coverage analysis and quality metrics reporting via Qodo Cover.
3. **Open-Source Universal Remote Experience:**
   - Free, multi-model (BYOK) alternative to proprietary solutions like Claude Code Remote.
   - Dual host & client interfaces: Interactive Terminal CLI (`apps/cli`) + Native VS Code Extension & Chat Webview (`apps/vscode-extension`), both wrapping `@agent-remote/bridge-core`.
   - Native mobile client (`apps/mobile`) and responsive Web landing/pairing client (`apps/web`) with zero port-forwarding, PIN-based pairing, and offline/reconnection resilience.
   - Multiplatform one-line installer scripts: PowerShell `irm https://agent-remote.dev/install.ps1 | iex` for Windows, `curl -fsSL https://agent-remote.dev/install.sh | bash` for macOS/Linux, and `npx @agent-remote/cli`.
   - External developer integrations: Slack/Discord webhook alerts and local workstation desktop notifications for approval requests.

---

## 3. High-Level Feature Scope

### In-Scope for MVP

- **Shared Protocol Contracts (`packages/protocol`):** Zod schemas and inferred TypeScript types for all WebSocket events.
- **Shared Bridge Engine (`packages/bridge-core`):** Reusable core logic for Socket.io tunnel, TrueForge SDK connector, event ring buffer (`seq_id`), approval Promise map, and external webhook notifiers.
- **Interactive Terminal CLI Host & Client (`apps/cli`):** Standalone Node.js CLI with compact chalk boxen banner, bold PIN highlight, clickable pairing URL, interactive local REPL prompt, live token streaming, and dual-surface keyboard `[y/N]` approvals.
- **VS Code Extension Host & Chat Panel (`apps/vscode-extension`):** Lightweight extension wrapping `bridge-core` with Status Bar PIN display (`$(radio-tower) Remote: 834-192`), Activity Bar Chat Webview, native side-by-side editor diffs, and modal approvals.
- **Stateless Cloud Relay (`apps/relay`):** Lightweight Node.js Socket.io server with IP-based anti-brute-force rate limiting (max 3 failed PINs -> 5-min lockout).
- **Mobile Control Client (`apps/mobile`):** Expo React Native app with PIN Pairing, Live Token Stream, Unified Git Diff Cards, and Approval Drawer.
- **Web Landing Page & Pairing Shell (`apps/web`):** Next.js / Web landing page with dark developer aesthetics (`#090d16`), interactive terminal emulator, browser-based remote control `/pair` client, and one-click copyable install commands.
- **Smooth UX & Motion Design:** `expo-haptics`, spring-physics drawer animations, smooth 180s countdown color transitions, and shimmer skeleton loaders.
- **External Integrations:** Slack/Discord webhook alerts with deep-links and workstation desktop notifications for remote approvals.
- **Dual-Surface Approvals with 180s Timeout:** Review on mobile phone or PC host with auto-deny fallback.
- **Event-Sourced Reconnection Sync:** Sequence ID buffer (`seq_id: 1..500`) on PC to recover missed tokens when mobile reconnects (The Elevator Problem).
- **BYOK (Bring Your Own Key):** Secure local key storage on device via `expo-secure-store` with dynamic routing to 0x Alpha (OpenRouter), DeepSeek R1, Claude, or local endpoints.
- **Production Deployment & One-Line Installers:** Multi-stage Docker for Relay (Fly.io/Railway), Vercel hosting for Web Landing, EAS build profiles for Mobile, `irm` / `curl` installer scripts, and `tsup` standalone binary bundling for `npx @agent-remote/cli`.
- **CI Governance & Quality Gate:** GitHub Actions CI, mechanical suppression checking (`scripts/check-suppressions.mjs`), and automated Qodo Merge reviews.

### Out-of-Scope for MVP

- Complex user authentication databases (ephemeral PIN rooms remove all cloud database overhead).
- Mandatory camera-only QR scanner requirement (streamlined 6-digit PIN input is universal across Web/Emulators/Phones).
- Raw voice model fine-tuning (reserved for V2).
- Multi-agent concurrent tabs (focus on perfecting single-session fidelity first).
