# 00 — Product Map: Open-Source Coding Agent Remote Control

## 1. Product Summary & The Problem

Local coding agents (Claude Code, TrueForge, Aider, OpenCode) execute file modifications, git operations, and terminal bash commands on a developer’s physical workstation. However, developers are tethered to their desks while long-running refactors, builds, or test suites execute.

**The Solution:** An open-source, multiplatform remote control system connecting a local workstation agent (TrueForge / 0x Alpha) to a mobile device (React Native Expo) or web browser via an outbound, stateless WebSocket Relay. Developers can initiate tasks, inspect live streaming thoughts, review syntax-highlighted unified Git diffs, and approve or reject sensitive tool actions (e.g. bash commands, file overwrites) from their phone with zero port-forwarding and complete offline/reconnection resilience.

---

## 2. Core User Loops & Step-by-Step Journeys

### Loop 1: Zero-Config Host Pairing (The "TV / Smart App" Model)

1. The developer opens their terminal in any project directory and runs `pnpm dev:cli` (or opens VS Code with the extension active).
2. The local daemon initiates an outbound TLS WebSocket connection to the stateless Cloud Relay (`wss://relay.yourdomain.com` or `http://localhost:3001`).
3. The daemon generates an ephemeral 6-digit PIN (e.g., `834-192`) with a 5-minute TTL and prints a bold chalk banner and an ASCII QR code in the terminal.
4. The developer opens the Expo mobile app (or Web landing client at `https://agent-remote.dev/pair`).
5. The mobile app submits the PIN -> Relay pairs the socket IDs into an isolated virtual room -> Emits `session:connected`.
6. Both devices display green live status indicators in `< 200ms`.

### Loop 2: Remote Prompting & Token Streaming

1. From anywhere on the local network or cellular data, the developer taps the mobile prompt bar and types: _"Refactor the auth middleware to support refresh tokens and write unit tests."_
2. The mobile app emits `client:prompt` with the task description and optional encrypted BYOK config (e.g. `0x-alpha`).
3. The Relay forwards the payload to the local PC host; the bridge daemon passes the prompt to TrueForge.
4. TrueForge invokes the 0x Alpha reasoning model using the 5-layer modular prompt template.
5. As tokens and thoughts stream from the LLM, the local daemon tags each chunk with a monotonic integer `seq_id: 1, 2, 3...` and appends it to the in-memory Ring Buffer.
6. The daemon emits `agent:stream` over WebSocket; the mobile app renders live streaming markdown text and collapsible thought cards in real time (<50ms latency).

### Loop 3: Human-in-the-Loop Approval & Visual Git Diff Review

1. TrueForge determines it needs to run a destructive or sensitive command: `execute_bash("npm test && git checkout -b feat/auth")` or `write_file("src/middleware/auth.ts")`.
2. TrueForge's safety interceptor pauses turn execution on an unfulfilled Promise.
3. The PC daemon captures the proposed bash command or computes the unified Git diff (`git diff`).
4. The daemon emits `agent:approval_required` with an `approvalId`, command/diff content, risk level (`low`/`medium`/`high`), and a 180s timeout limit.
5. **On Mobile:** An animated bottom-sheet modal slides up with haptic vibration, displaying an amber warning header, a color-coded unified diff card (`+` green, `-` red), and a 180s countdown timer.
6. **On PC Terminal:** A readline prompt displays simultaneously: `Approve [Tool: execute_bash] "npm test"? [y/N]: `.
7. The developer taps **`Approve`** on mobile (or types `y` on PC):
   - The Promise resolves immediately to `true`.
   - The modal dismisses with a success haptic pulse.
   - TrueForge executes the bash command locally and returns exit code 0.
   - If the 180s timer expires with no action, the tool defaults to `DENIED (Timeout)` and the turn gracefully halts without hanging.

### Loop 4: The Elevator Problem (Seamless Reconnect Recovery)

1. The developer steps into an elevator or drops Wi-Fi signal while TrueForge is executing step 3 of a 5-step refactor.
2. The mobile WebSocket connection drops.
3. **On the PC:** TrueForge never halts or crashes. The bridge daemon continues capturing emitted stream chunks and tool outputs into its 500-event in-memory Ring Buffer (`seq_id: 45, 46, 47...`).
4. When the developer exits the elevator and cellular data reconnects, the mobile socket reconnects and immediately emits:
   ```json
   { "event": "client:sync", "payload": { "sessionId": "834192", "lastSeenSeq": 44 } }
   ```
5. The PC daemon queries `ringBuffer.getEventsSince(44)` and bursts `agent:stream_batch` containing chunks 45, 46, and 47.
6. The mobile terminal feed seamlessly catches up to the current state with zero lost text or duplicated entries.

---

## 3. Screens & Presentation Surfaces

### S1 — Web Landing Page & Hero Simulator (`apps/web`)

- Dark `#090d16` hero with interactive code emulator, feature showcases, architecture diagram, and `Launch Web Client` button.

### S2 — Pairing Screen (Mobile & Web Client)

- Centered 6-digit PIN input with spaced letter tracking, connection state badge, and BYOK shortcut.

### S3 — Live Terminal Feed & Session View (Mobile & Web)

- Virtualized list rendering real-time token chunks, collapsible thoughts, tool execution logs, and quick action pills.

### S4 — Interactive Approval Drawer (Mobile Bottom Sheet)

- Bottom-sheet modal with amber alert header, syntax-highlighted unified Git diff card, 180s countdown timer bar, and large touch targets.

### S5 — BYOK Settings Modal (Mobile & Web)

- Provider selection (OpenRouter / Anthropic / OpenAI / Custom), model input (`0x-alpha`), and hardware-encrypted API key storage.

### S6 — Terminal CLI Host Presentation (PC)

- Boxen border banner, bold green PIN highlight, compact ASCII QR code, and readline approval prompts (`[y/N]`).

### S7 — VS Code Extension Host Presentation (PC)

- Status Bar item: `$(radio-tower) Remote PIN: 834-192` with click-to-copy, webview QR modal, and native window warning notifications.

---

## 4. Complete Numbered Spec Index

**Foundation & Core Contracts**

- **01** Monorepo Workspace & Protocol Contracts (`packages/protocol`)
- **02** Bridge Core Engine & Ring Buffer (`packages/bridge-core`)
- **03** Approval State Machine & Timeouts (`packages/bridge-core`)

**Relay & Host Surfaces**

- **04** Cloud Relay Server (`apps/relay`)
- **05** Terminal CLI Host (`apps/cli`)
- **06** VS Code Extension Host (`apps/vscode-extension`)

**Mobile & Web Experience**

- **07** Mobile App Shell & Pairing Screen (`apps/mobile`)
- **08** Mobile Streaming & Terminal Feed (`apps/mobile`)
- **09** Mobile Unified Diff Card & Approval Drawer (`apps/mobile`)
- **10** BYOK Encrypted Vault & Model Routing (`apps/mobile` + `bridge-core`)
- **11** Reconnect Resilience & Hydration Protocol (`apps/mobile` + `bridge-core`)

**Web Shell, Smooth UX & Integrations**

- **12** Web Landing Page & Demo Shell (`apps/web`)
- **13** Smooth UX, Motion Design & Haptics (`apps/mobile` + `apps/web`)
- **14** External Integrations & Webhook Alerts (`packages/bridge-core`)

**Deployment, Governance & Deep Qodo Integration**

- **15** Production Deployment & Release Workflows (`infra/` + `apps/*`)
- **16** CI Workflows, Governance & Secret Scanning (`.github/workflows` + `scripts/`)
- **17** Deep Qodo Integration, Test Harness & PR Automation (.pr_agent.toml + ests/qodo)\n- **18** Qodo PR Playbook & Track Alignment Playbook (`context/specs/18-qodo-pr-playbook-and-track-alignment.md`)\n- **19** Observability, Telemetry & Metrics (packages/bridge-core/src/telemetry)\n- **20** Security Threat Model & Hardening (packages/bridge-core/src/security)\n- **21** Performance Budgets & Benchmarks (context/specs/21-performance-budgets-and-benchmarks.md)\n- **22** Shipping, Launch & Release Playbook (context/specs/22-shipping-launch-and-release-playbook.md)
