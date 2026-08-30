<h1 align="center">
  <br />
  <img src="apps/web/public/icon.png" alt="AirLink" width="80" />
  <br />
  AirLink — Remote Agent Harness
</h1>

<p align="center">
  <b>Remotely prompt, stream, and approve your local AI coding agent — from your phone, browser, or any device — without opening a single port.</b>
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
| Can't stop the agent before it does damage | Every destructive operation (bash, file writes, deploys) pauses for your approval with a 180 s timeout and auto-deny fallback |

Pair your workstation to your phone in under 10 seconds with a 6-digit PIN. Stream tokens, inspect Git diffs, approve or reject tool calls — all from wherever you are.

---

## Demo

> **[▶ Watch the 3-minute demo](#)** ← *(demo video link goes here)*

A single session shows:
1. User prompts from the mobile app
2. TrueForge dispatches tools via MCP (filesystem read, git diff, bash)
3. Agent proposes a destructive rollback → **approval drawer appears on phone**
4. User approves → command runs → stream resumes
5. User disconnects, reconnects → missed tokens replay instantly from the ring buffer

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Workstation (PC)                   │
│                                                                 │
│  ┌────────────────┐    ┌──────────────────────────────────────┐ │
│  │ VS Code Ext    │    │         bridge-core engine           │ │
│  │ (Chat Webview) │◄──►│  TrueForge SDK ─► MCP Tools         │ │
│  └────────────────┘    │  Ring Buffer (seq_id 1..500)         │ │
│  ┌────────────────┐    │  Approval Promise Map (180s timeout) │ │
│  │  Terminal CLI  │◄──►│  Slack / Discord Webhook notifiers   │ │
│  └────────────────┘    └──────────────┬───────────────────────┘ │
└─────────────────────────────────────┬┘                          │
              Outbound WebSocket only  │                           │
                                       ▼                           │
                          ┌─────────────────────┐                 │
                          │  Stateless Relay     │ (Fly.io)       │
                          │  Socket.io · PIN rooms│                │
                          │  IP rate-limit 3/5min│                │
                          └──────────┬──────────┘                 │
                                     │                             │
              ┌──────────────────────┤                             │
              ▼                      ▼                             │
   ┌──────────────────┐   ┌──────────────────┐                    │
   │  Mobile App      │   │  Web /pair       │                    │
   │  React Native    │   │  Next.js 15      │                    │
   │  PIN · Stream    │   │  Browser pairing │                    │
   │  Diff · Approve  │   │                  │                    │
   └──────────────────┘   └──────────────────┘                    │
```

**Full monorepo layout:**
```
apps/
  cli/                  # Terminal host & client (Node.js)
  vscode-extension/     # VS Code Extension + Chat Webview
  relay/                # Stateless Socket.io cloud relay
  mobile/               # React Native (Expo) control client
  web/                  # Next.js landing page + /pair client

packages/
  protocol/             # Shared Zod schemas + TypeScript types
  bridge-core/          # Core engine: tunnel, TrueForge SDK, buffer, approvals
```

---

## Quickstart

### Prerequisites

- Node.js 22 LTS
- pnpm 9+
- A TrueForge-compatible model API key (OpenAI, Anthropic, OpenRouter, etc.)

### 1 — Clone and install

```bash
git clone https://github.com/Team-Managed/AirLink.git
cd AirLink
pnpm install
```

### 2 — Configure your environment

```bash
cp .env.example .env
# Edit .env and set your API keys
```

Key variables in `.env.example`:

```env
TRUEFORGE_API_KEY=          # Your TrueForge / OpenRouter API key
RELAY_URL=                  # Cloud relay (default: wss://relay.airlink.dev)
SLACK_WEBHOOK_URL=          # Optional: approval alerts to Slack
DISCORD_WEBHOOK_URL=        # Optional: approval alerts to Discord
```

### 3 — Start the relay (local dev)

```bash
pnpm --filter @airlink/relay dev
# Relay running at http://localhost:3001
```

### 4 — Start the host

**Terminal CLI:**
```bash
pnpm --filter @airlink/cli dev
```
```
╔═══════════════════════════════════════╗
║   AirLink Remote Agent                ║
║   PIN: 834-192                        ║
║   Pair: https://airlink.dev/pair      ║
╚═══════════════════════════════════════╝
```

**VS Code Extension:**

Press `F5` in the `apps/vscode-extension` workspace to launch the Extension Development Host. Click the `$(radio-tower) AirLink` status bar item to start a session.

### 5 — Pair from your phone or browser

- **Mobile:** Download the app → Enter the 6-digit PIN → Connected
- **Browser:** Visit `https://airlink.dev/pair` → Enter PIN → Connected

---

## How the Harness Works

### Real tools via MCP

AirLink connects TrueForge to local MCP tool servers. The agent can read files, run bash commands, inspect git history, and write diffs — all executing **on your workstation**, never on a remote machine.

### Human-in-the-Loop approval gate

Before any destructive operation executes, `bridge-core` intercepts the tool call and emits an `approval:request` event to every paired surface (mobile drawer + terminal/VS Code notification simultaneously). You have **180 seconds** to approve or reject. No response = **automatic deny**.

```
Agent wants to run:  rm -rf dist/

[Mobile approval drawer]         [VS Code modal]
 ┌────────────────────────┐       ┌─────────────────────┐
 │ ⚠ Approval Required    │       │ AirLink: Approval   │
 │                        │       │                     │
 │ rm -rf dist/           │       │ rm -rf dist/        │
 │                        │       │                     │
 │ [APPROVE]   [REJECT]   │       │ [Yes]      [No]     │
 │         2:58 remaining  │       └─────────────────────┘
 └────────────────────────┘
```

### Reconnection replay

Every stream event carries a monotonic `seq_id`. A 500-event in-memory ring buffer on the host replays missed chunks the moment a mobile client reconnects — no tokens lost even when you switch networks.

---

## The 10 System Invariants

1. **Decoupled Bridge Core** — all logic lives in `packages/bridge-core`; CLI, VS Code, and web are thin wrappers.
2. **Outbound only** — the PC never opens inbound ports; all traffic flows through an outbound WebSocket tunnel.
3. **Local execution** — TrueForge and all MCP tools run exclusively on your workstation.
4. **Dual memory separation** — verbatim logs on disk; pruned context fed to the LLM window.
5. **Zero disk bloat** — ring buffer capped at 500 events (~500 KB RAM); sessions pruned on 14-day LRU (lifetime < 30 MB).
6. **Monotonic sequencing** — every `bridge-core` event carries an incrementing `seq_id`; missed sequences replay on reconnect.
7. **Dual-surface approvals** — every approval fires on mobile drawer **and** local host simultaneously.
8. **Bounded timeout** — approvals auto-deny after **180 seconds** with reason `Timed out`.
9. **Strict Zod contracts** — every socket payload validated against `packages/protocol` schemas before processing.
10. **Automated quality gate** — every PR reviewed by Qodo, checked for suppressions, and tested with Vitest before merge.

---

## Development

### Run all tests

```bash
pnpm test
```

```
Test Files  35 passed (35)
Tests       234 passed (234)
```

### Lint

```bash
pnpm lint
```

### Type-check all packages

```bash
pnpm build
```

### Run the full stack locally

```bash
# Terminal 1 — relay
pnpm --filter @airlink/relay dev

# Terminal 2 — CLI host
pnpm --filter @airlink/cli dev

# Terminal 3 — mobile (Expo)
pnpm --filter @airlink/mobile start

# Terminal 4 — web (Next.js)
pnpm --filter @airlink/web dev
```

### Docker (relay only)

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

- **Critical (resolved):** `hostSecret` missing from `RegisterHostSchema` allowing any client to hijack a PIN room → made mandatory with `z.string().min(8)` and server-side enforcement.
- **Critical (resolved):** `Math.random()` used for 6-digit PINs (predictable) → replaced with `crypto.randomInt(100000, 1000000)` everywhere.
- **High (resolved):** Anthropic tool calls silently never executed because tool schema translation was missing → full `input_schema` mapping and SSE `content_block_start` / `input_json_delta` accumulation implemented.
- **High (resolved):** Support tickets and newsletter subscriptions dropped on receipt (no persistence) → durable in-memory + disk stores created before HTTP 200 returned.
- **Medium (resolved):** Empty catch blocks swallowing errors silently across storage modules → replaced with structured error logging and typed 500 error responses.
- **Low (resolved):** `new Function` dynamic import of `expo-secure-store` (bypasses bundler) → converted to native static import.

Every finding was addressed, a follow-up review was triggered, and the final state of the PR records the review, decisions, and resolution.

---

## Hackathon Tracks

This project was built for the [TrueForge Agent Harness Hackathon](https://www.wemakedevs.org/hackathons/trueforge) (August 24–30, 2026).

### 🎯 Double-O Track — Best Use of TrueForge

- **Real MCP tools:** Local filesystem, git, bash, GitHub issues — all executed on-device through `@modelcontextprotocol/server-filesystem` and custom MCP servers.
- **Sandboxed execution:** All code runs locally on the developer's workstation via TrueForge's execution harness.
- **Human-in-the-Loop gates:** Destructive tools intercepted by `ApprovalManager` before execution. Approval prompts fire on mobile and desktop simultaneously.
- **Subagent task handling:** `TrueForgeSession` manages multi-turn context lifecycle, tool dispatch, and stream routing.
- **Reconnection resilience:** 500-event ring buffer with monotonic `seq_id` replays missed tokens on reconnect.

### 🧪 Q Branch Track — Best Code Quality

- **234 tests across 35 test suites** — all green, zero skipped, zero hardcoded outputs.
- **All 14 Qodo findings addressed** — security issues, logic bugs, and silent errors fixed before merge.
- **Strict Zod protocol contracts** — every WebSocket payload schema-validated at runtime.
- **Zero unapproved suppressions** — enforced mechanically via `scripts/check-suppressions.mjs` pre-commit.
- **Full `typescript-eslint` integration** — type-safe lint rules across all 7 workspace packages.
- **Consistent PR discipline** — conventional commit messages, per-feature branches, Qodo review before every merge.

### 🎨 Savile Row Track — Best UI

- **Live token stream** on mobile with virtualized `FlatList` for smooth rendering at high throughput.
- **Visual Git diff cards** — color-coded unified diffs with expand/collapse per file.
- **Approval drawer** — bottom sheet with action details, 180 s animated countdown, approve/reject buttons, and haptic feedback.
- **Status indicators** — VS Code status bar PIN, connection state ring, streaming pulse animations.
- **Web landing & pairing** — animated hero with GSAP cloud motion, instant 6-digit PIN pairing from any browser.

---

## Security

- **No inbound ports** — the workstation never exposes a public listener; all traffic is outbound WebSocket to the relay.
- **PIN rooms are ephemeral** — the relay holds zero session data; rooms are destroyed when the host disconnects.
- **Host secrets** — every PIN room is locked to a cryptographic `hostSecret` (`crypto.randomUUID()`); mismatched secrets are rejected to prevent room takeover.
- **BYOK (Bring Your Own Key)** — API keys stored in hardware-backed Keychain/Keystore via `expo-secure-store`; never sent to the relay.
- **Gitleaks CI scan** — `secret_scan.yml` runs on every push and PR; no credentials may be committed.

Report vulnerabilities privately via GitHub's [Security Advisories](https://github.com/Team-Managed/AirLink/security/advisories).

---

## Contributing

1. Fork the repo and create a branch from `dev`.
2. Make your changes with conventional commits (`feat:`, `fix:`, `docs:`, etc.).
3. Open a pull request against `dev` — Qodo will review it automatically.
4. Address any High-severity findings before requesting a merge.

See [AGENTS.md](./AGENTS.md) for the agent context rules that govern all development on this repo.

---

## License

MIT © 2026 AirLink Contributors
