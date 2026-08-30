<h1 align="center">
  <br />
  <img src="apps/web/public/icon.png" alt="AirLink" width="80" />
  <br />
  AirLink — Remote Agent Harness
</h1>

<p align="center">
  <b>Remotely prompt, stream, and approve your local AI coding agent — from your mobile phone — without opening a single port.</b>
  <br /><br />
  <a href="https://github.com/Team-Managed/AirLink/pulls"><img alt="Pull Requests" src="https://img.shields.io/github/issues-pr/Team-Managed/AirLink?label=pull%20requests&style=flat-square" /></a>
  <a href="https://github.com/Team-Managed/AirLink/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Team-Managed/AirLink/ci.yml?branch=main&label=CI&style=flat-square" /></a>
  <img alt="Tests" src="https://img.shields.io/badge/tests-234%20passing-brightgreen?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  <a href="https://www.wemakedevs.org/hackathons/trueforge"><img alt="TrueForge Hackathon" src="https://img.shields.io/badge/TrueForge%20Hackathon-2026-orange?style=flat-square" /></a>
</p>

---

## What is AirLink?

You get an agent working in an afternoon. Then you walk away from your desk — and now you can't reach it.

**AirLink** is an open-source remote harness that wraps TrueForge and gives you three things the chat window never had:

| Problem | AirLink's Answer |
| :--- | :--- |
| Can't reach your tools remotely | MCP tool servers run locally; a stateless cloud relay tunnels events outbound via WebSocket — no inbound ports needed |
| Can't run generated code safely | TrueForge sandboxes all execution locally on your workstation |
| Can't stop the agent before it does damage | Every destructive operation (bash, file writes, deploys) pauses for your approval with a 180s timeout and auto-deny fallback |

Pair your workstation to your phone in under 10 seconds with a 6-digit PIN. Stream tokens, inspect Git diffs, approve or reject tool calls — all from your mobile phone.

---

## Demo

> **[▶ Watch the 3-minute demo](#)** ← *(demo video link)*

A single CLI + Mobile session shows:
1. **Host Boot:** Developer runs `npx @airlink/cli` on their workstation and receives a 6-digit PIN (`834-192`).
2. **Mobile Pairing:** Developer opens the AirLink Mobile App on iOS/Android, enters the PIN, and pairs instantly.
3. **Prompt & Stream:** User prompts from phone → TrueForge dispatches local MCP tools (filesystem read, git diff, bash) on the workstation.
4. **Human-in-the-Loop Safety:** Agent proposes a destructive action → **180s Approval Drawer slides up on phone** with haptic feedback.
5. **Reconnection Catch-Up:** Phone disconnects (e.g. elevator) and reconnects → missed tokens replay instantly from host's 500-event ring buffer.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Workstation (PC / Mac)                  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Terminal CLI Host                       │ │
│  │                      (`apps/cli`)                          │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │                  bridge-core engine                  │  │ │
│  │  │  • TrueForge SDK ─► Local MCP Tools                  │  │ │
│  │  │  • In-Memory Ring Buffer (seq_id 1..500)             │  │ │
│  │  │  • Approval Promise Map (180s timeout auto-deny)     │  │ │
│  │  │  • Slack / Discord Webhook Notifiers                 │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────┬─────────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ Outbound WebSocket (No inbound ports)
                                  ▼
                     ┌───────────────────────────┐
                     │   Stateless Cloud Relay   │ (Render)
                     │   Socket.io · PIN rooms   │
                     │   IP Rate-Limit (3 fails) │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │     Native Mobile App     │
                     │   React Native / Expo     │
                     │   • 6-Digit PIN Pairing   │
                     │   • Live Token Stream     │
                     │   • Visual Git Diff Cards │
                     │   • 180s Approval Drawer  │
                     └───────────────────────────┘
```

<!--
Note: AirLink also includes a web client (`apps/web`) and VS Code extension (`apps/vscode-extension`), but the primary demo highlights the standalone Terminal CLI + Native Mobile App experience.
-->

**Core Repository Layout:**
```
apps/
  cli/                  # Workstation Terminal Host & REPL (Node.js)
  mobile/               # Native Control Client (React Native / Expo)
  relay/                # Stateless Socket.io Cloud Relay (Docker / Render)
  # web/                # (Optional) Next.js Web Landing & Browser Pairing
  # vscode-extension/   # (Optional) VS Code Activity Bar Extension

packages/
  protocol/             # Shared Zod schemas + TypeScript contracts
  bridge-core/          # Core engine: tunnel, TrueForge SDK, ring buffer, approvals
```

---

## Quickstart (CLI & Mobile in 60 Seconds)

### Prerequisites

- Node.js 22 LTS
- pnpm 9+
- A TrueForge-compatible model API key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.)

### 1 — Clone and install

```bash
git clone https://github.com/Team-Managed/AirLink.git
cd AirLink
pnpm install
```

### 2 — Configure your environment

```bash
cp .env.example .env
# Set your model API key (e.g. GEMINI_API_KEY=...)
```

### 3 — Start the Workstation CLI Host

```bash
pnpm --filter @airlink/cli dev
```

The terminal prints your clean pairing banner and **6-digit PIN**:
```text
╔═══════════════════════════════════════════════╗
║   AirLink — Workstation Harness               ║
║   PIN: 834-192                                ║
║   Relay: https://airlink-relay.onrender.com   ║
╚═══════════════════════════════════════════════╝
```

### 4 — Open the Mobile App on Your Phone

In a second terminal:
```bash
pnpm --filter @airlink/mobile start
```
1. Scan the QR code with **Expo Go** on your iPhone or Android phone.
2. Enter the **6-digit PIN** (`834-192`).
3. Tap **Connect & Control** — you are now paired!

---

## How the Harness Works

### Real tools via MCP

AirLink connects TrueForge to local MCP tool servers. The agent can read files, execute bash commands, run test suites, and inspect git history — all executing **on your local workstation**, never in the cloud.

### Human-in-the-Loop approval gate

Before any destructive command executes, `bridge-core` intercepts the tool call and emits an `approval:request` event to your mobile phone. You have **180 seconds** to approve or reject with haptic feedback. No response = **automatic deny**.

```text
Agent proposes:  rm -rf dist/ && git reset --hard HEAD~1

[ Mobile Approval Drawer ]
 ┌────────────────────────────────────────┐
 │ ⚠ Action Approval Required             │
 │                                        │
 │ Tool: bash_command                     │
 │ Command: rm -rf dist/                  │
 │                                        │
 │ [ ✓ APPROVE ]          [ ✕ REJECT ]    │
 │                                        │
 │          ⏳ 178s remaining             │
 └────────────────────────────────────────┘
```

### Reconnection replay

Every stream chunk carries a strictly monotonic `seq_id`. An in-memory ring buffer holding the last 500 events on your PC replays all missed chunks the moment your phone reconnects.

---

## The 10 System Invariants

1. **Decoupled Bridge Core** — all logic lives in `packages/bridge-core`; CLI and mobile app are clean presentation clients.
2. **Outbound only** — the PC never opens inbound ports; all traffic flows through an outbound WebSocket tunnel.
3. **Local execution** — TrueForge and all MCP tools run exclusively on your workstation.
4. **Dual memory separation** — verbatim logs on disk; pruned context fed to the LLM window.
5. **Zero disk bloat** — ring buffer capped at 500 events (~500 KB RAM); sessions pruned on 14-day LRU (lifetime < 30 MB).
6. **Monotonic sequencing** — every `bridge-core` event carries an incrementing `seq_id`; missed sequences replay on reconnect.
7. **Dual-surface approvals** — approvals fire on mobile drawer and local terminal simultaneously.
8. **Bounded timeout** — approvals auto-deny after **180 seconds** with reason `Timed out`.
9. **Strict Zod contracts** — every socket payload validated against `packages/protocol` schemas before processing.
10. **Automated quality gate** — every PR reviewed by Qodo, checked for suppressions, and tested with Vitest before merge.

---

## Development & Testing

### Run all tests

```bash
pnpm test
```

```
Test Files  35 passed (35)
Tests       234 passed (234)
```

### Run the CLI + Mobile stack locally

```bash
# Terminal 1 — Workstation CLI Host
pnpm --filter @airlink/cli dev

# Terminal 2 — Mobile App (Expo)
pnpm --filter @airlink/mobile start
```

### Docker (Cloud Relay)

```bash
docker build -t airlink-relay .
docker run -p 3001:3001 airlink-relay
```

---

## Qodo Code Review Evidence

Every substantive change to this repository was shipped through a reviewed pull request using [Qodo](https://qodo.ai).

### Representative PRs

| PR | What Qodo surfaced | Outcome |
| :--- | :--- | :--- |
| [PR #24 — Security & Production Hardening](https://github.com/Team-Managed/AirLink/pull/24) | 14 findings across 7 packages: weak PIN randomness, silent error swallowing, secretless room takeover, Anthropic tool schema mismatch, missing base tsconfig in Docker, and more | **All 14 resolved.** Findings remediated before merge: `crypto.randomInt` for PINs, mandatory `hostSecret` in protocol, full SSE tool stream accumulation, explicit error logging in all catch blocks. |

### What changed based on Qodo

- **Critical (resolved):** `hostSecret` missing from `RegisterHostSchema` allowing any client to hijack a PIN room → made mandatory with `z.string().min(8)` and server-side verification.
- **Critical (resolved):** `Math.random()` used for 6-digit PINs (predictable) → replaced with `crypto.randomInt(100000, 1000000)` everywhere.
- **High (resolved):** Anthropic tool calls silently never executed because tool schema translation was missing → full `input_schema` mapping and SSE `content_block_start` / `input_json_delta` accumulation implemented.
- **High (resolved):** Support tickets and newsletter subscriptions dropped on receipt (no persistence) → durable in-memory + disk stores created before HTTP 200 returned.
- **Medium (resolved):** Empty catch blocks swallowing errors silently across storage modules → replaced with structured error logging and typed 500 error responses.
- **Low (resolved):** `new Function` dynamic import of `expo-secure-store` (bypasses bundler) → converted to native static import.

---

## Hackathon Tracks

This project was built for the [TrueForge Agent Harness Hackathon](https://www.wemakedevs.org/hackathons/trueforge) (August 24–30, 2026).

### 🎯 Double-O Track — Best Use of TrueForge

- **Real MCP tools:** Local filesystem, git, bash, GitHub issues — all executed on-device through `@modelcontextprotocol/server-filesystem` and custom MCP servers.
- **Sandboxed execution:** All code runs locally on the developer's workstation via TrueForge's execution harness.
- **Human-in-the-Loop gates:** Destructive tools intercepted by `ApprovalManager` before execution. Approval prompts fire on mobile and terminal simultaneously.
- **Subagent task handling:** `TrueForgeSession` manages multi-turn context lifecycle, tool dispatch, and stream routing.
- **Reconnection resilience:** 500-event ring buffer with monotonic `seq_id` replays missed tokens on reconnect.

### 🧪 Q Branch Track — Best Code Quality

- **234 tests across 35 test suites** — all green, zero skipped, zero hardcoded outputs.
- **All 14 Qodo findings addressed** — security issues, logic bugs, and silent errors fixed before merge.
- **Strict Zod protocol contracts** — every WebSocket payload schema-validated at runtime.
- **Zero unapproved suppressions** — enforced mechanically via `scripts/check-suppressions.mjs` pre-commit.
- **Full `typescript-eslint` integration** — type-safe lint rules across all workspace packages.
- **Consistent PR discipline** — conventional commit messages, per-feature branches, Qodo review before every merge.

### 🎨 Savile Row Track — Best UI

- **Live token stream** on mobile with virtualized `FlatList` for smooth rendering at high throughput.
- **Visual Git diff cards** — color-coded unified diffs with syntax highlighting.
- **Approval drawer** — bottom sheet with action details, 180s animated countdown, approve/reject buttons, and haptic feedback.
- **Clean terminal aesthetics** — compact CLI boxen banner, bold PIN highlight, and structured tool execution feeds.

---

## Security

- **No inbound ports** — the workstation never exposes a public listener; all traffic is outbound WebSocket to the relay.
- **PIN rooms are ephemeral** — the relay holds zero session data; rooms are destroyed when the host disconnects.
- **Host secrets** — every PIN room is locked to a cryptographic `hostSecret` (`crypto.randomUUID()`); mismatched secrets are rejected to prevent room takeover.
- **BYOK (Bring Your Own Key)** — API keys stored in hardware-backed Keychain/Keystore via `expo-secure-store`; never sent to the relay.
- **Gitleaks CI scan** — `secret_scan.yml` runs on every push and PR; no credentials may be committed.

---

## License

MIT © 2026 AirLink Contributors
