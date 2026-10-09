<h1 align="center">
  <br />
  <img src="apps/web/public/icon.png" alt="AirLink Logo" width="80" />
  <br />
  AirLink — Remote Agent Harness
</h1>

<p align="center">
  <b>Remotely prompt, stream, and approve your local AI coding agent — from your mobile phone or browser — without opening a single port.</b>
  <br /><br />
  <a href="https://github.com/Team-Managed/AirLink/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Team-Managed/AirLink/ci.yml?branch=main&label=CI&style=flat-square" /></a>
  <a href="https://github.com/Team-Managed/AirLink/pulls"><img alt="Pull Requests" src="https://img.shields.io/github/issues-pr/Team-Managed/AirLink?label=pull%20requests&style=flat-square" /></a>
  <img alt="Tests" src="https://img.shields.io/badge/tests-234%20passing-brightgreen?style=flat-square" />
  <img alt="Expo SDK" src="https://img.shields.io/badge/Expo-SDK%2057-black?style=flat-square&logo=expo" />
  <img alt="Node Version" src="https://img.shields.io/badge/Node-v22%20LTS-green?style=flat-square&logo=node.js" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  <a href="https://www.wemakedevs.org/hackathons/trueforge"><img alt="TrueForge Hackathon" src="https://img.shields.io/badge/TrueForge%20Hackathon-2026-orange?style=flat-square" /></a>
</p>

<p align="center">
  <a href="#what-is-airlink">Overview</a> •
  <a href="#quickstart-in-60-seconds">Quickstart</a> •
  <a href="#instant-one-line-installer">One-Line Install</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#monorepo-packages">Packages</a> •
  <a href="#how-the-harness-works">How It Works</a> •
  <a href="#the-10-system-invariants">System Invariants</a> •
  <a href="#qodo-code-review-evidence">Qodo Review</a> •
  <a href="#hackathon-tracks">Hackathon Tracks</a>
</p>

---

## What is AirLink?

You build an agent workflow during the day. Then you step away from your workstation — and you instantly lose visibility and control.

**AirLink** is an open-source remote harness that bridges your local workstation environment to your mobile phone with three core pillars:

| Problem | AirLink's Solution |
| :--- | :--- |
| **Can't reach workstation tools remotely** | Local MCP tool servers (filesystem, git, terminal) run locally; a stateless cloud relay tunnels events outbound via WebSocket — **zero inbound ports** or ngrok tunnels required. |
| **Can't run untrusted code safely** | Sandboxes all execution locally on your workstation with strict boundary enforcement. |
| **Can't prevent destructive agent actions** | Every sensitive operation (bash execution, file overwrites, git commits) halts at an interactive **180s Human-in-the-Loop (HITL) gate** with automated fallback denial. |

Pair your workstation to your phone or web browser in **under 10 seconds** with an ephemeral 6-digit PIN. Stream tokens with sub-50ms latency, review line-by-line syntax-highlighted Git diffs, and approve critical operations right from your pocket.

---

## Instant One-Line Installer

Run one command in your workstation terminal to install and launch AirLink immediately:

### Windows (PowerShell)
```powershell
irm https://airlink-green.vercel.app/install.ps1 | iex
```

### macOS & Linux (Bash)
```bash
curl -fsSL https://airlink-green.vercel.app/install.sh | bash
```

### Instant Run (Zero-Config NPX)
```bash
npx @airlink/cli
```

---

## Architecture

AirLink follows a strict decoupled architecture where all execution and file management remain on your workstation:

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
│  │  │  • Multi-Provider LLM Engine (Gemini / Claude / etc) │  │ │
│  │  │  • Local MCP Tools (Filesystem, Bash, Git)           │  │ │
│  │  │  • In-Memory Ring Buffer (Monotonic seq 1..500)      │  │ │
│  │  │  • Approval Promise Map (180s timeout auto-deny)     │  │ │
│  │  │  • Slack / Discord Webhook Alert Dispatcher          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────┬─────────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ Outbound WebSocket (Zero open ports)
                                  ▼
                     ┌───────────────────────────┐
                     │   Stateless Cloud Relay   │ (`apps/relay`)
                     │   Socket.io · Ephemeral PIN │
                     │   HostSecret Verification │
                     └─────────────┬─────────────┘
                                   │ Real-Time Relay Tunnel
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
   ┌───────────────────────────┐         ┌───────────────────────────┐
   │     Native Mobile App     │         │      Web Remote Client    │
   │    React Native / Expo    │         │     Next.js App Router    │
   │       (Expo SDK 57)       │         │        (`apps/web`)       │
   │  • 6-Digit PIN Pairing    │         │  • Browser Pairing        │
   │  • Live Markdown Stream   │         │  • Live Token Feed        │
   │  • AST Git Diff Cards     │         │  • HITL Approval Modal    │
   │  • 180s Haptic Gate       │         │  • BYOK Model Routing     │
   └───────────────────────────┘         └───────────────────────────┘
```

---

## Monorepo Packages

AirLink is structured as a pnpm monorepo with clean separation of concerns:

| Directory | Package | Description |
| :--- | :--- | :--- |
| `packages/protocol` | `@airlink/protocol` | Shared TypeScript contracts and strict Zod runtime schemas for all socket events. |
| `packages/bridge-core` | `@airlink/bridge-core` | Core harness engine: multi-provider AI streams, ring buffer, tool interception, and approvals. |
| `apps/cli` | `@airlink/cli` | Workstation CLI host with interactive REPL, session PIN generator, and local agent runner. |
| `apps/mobile` | `@airlink/mobile` | Native cross-platform mobile client built on **Expo SDK 57** (React Native 0.86). |
| `apps/relay` | `@airlink/relay` | Stateless Socket.io cloud relay routing encrypted traffic between host and clients. |
| `apps/web` | `@airlink/web` | Next.js landing page, live browser remote control (`/pair`), and API routes. |
| `apps/vscode-extension` | `@airlink/vscode-extension` | VS Code extension host bringing AirLink directly into the editor activity bar. |

---

## Quickstart in 60 Seconds

### Prerequisites

- **Node.js**: v22 LTS or newer
- **pnpm**: v9.7+
- **Model API Key**: At least one LLM provider key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or local `OLLAMA`)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Team-Managed/AirLink.git
cd AirLink
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Add your API key (e.g. GEMINI_API_KEY=your_key_here)
```

### 3. Start the Relay Server (Terminal 1)

```bash
pnpm dev:relay
```
*Listens on `http://localhost:3001`.*

### 4. Start the Workstation CLI Host (Terminal 2)

```bash
pnpm dev:cli
```

The terminal prints your clean pairing banner and ephemeral **6-digit PIN**:
```text
╔═══════════════════════════════════════════════════════════════╗
║                   AirLink Workstation Host                    ║
║   Session PIN: 849-204                                        ║
║   Relay: http://localhost:3001 (Connected)                   ║
║   Listening for mobile & remote clients...                    ║
╚═══════════════════════════════════════════════════════════════╝
```

### 5. Connect via Mobile or Web (Terminal 3)

#### Option A: Mobile App (Expo SDK 57)
```bash
pnpm dev:mobile
```
- Open **Expo Go** on your Android or iOS device and scan the terminal QR code.
- Enter the 6-digit PIN to pair instantly.
- *Alternatively, download the standalone preview `.apk` from your EAS build.*

#### Option B: Browser Web Client
Navigate to [http://localhost:3000/pair](http://localhost:3000/pair), enter the 6-digit PIN, and control your workstation from any web browser.

---

## How the Harness Works

### 1. Local Tool Execution via MCP
AirLink connects local tool servers to the agent. The LLM can read workspace files, execute shell commands, run test suites, and inspect git history — **all executing on your local workstation**, never on a third-party server.

### 2. 180s Human-in-the-Loop Approval Gate
Before any potentially destructive operation executes, `bridge-core` intercepts the call and dispatches an `approval:request` event to paired devices.

```text
Agent proposes:  git reset --hard HEAD~1 && npm run build

[ Mobile & Web Approval Drawer ]
 ┌────────────────────────────────────────────────────────┐
 │ ⚠️ Destructive Action Approval Required                │
 │                                                        │
 │ Tool: bash_command                                     │
 │ Risk: High                                             │
 │ Command: git reset --hard HEAD~1 && npm run build      │
 │                                                        │
 │ [  APPROVE (1-Tap)  ]              [  REJECT / REVERT  ] │
 │                                                        │
 │                   ⏳ 176s remaining                    │
 └────────────────────────────────────────────────────────┘
```

- **Dual-Surface Dispatch**: Approval alerts pop up simultaneously on your mobile screen and local workstation terminal.
- **Fail-Safe Timeout**: If unanswered within **180 seconds**, the action is automatically rejected with `Timed out`.

### 3. Reconnection Replay (500-Event Ring Buffer)
Mobile connections frequently drop when walking through elevators or switching networks. Every stream chunk carries a monotonic sequence ID (`seq_id`). 

When reconnecting, the client sends `client:sync` with its `lastSeenSeq`. The host's in-memory ring buffer instantly replays all missed events without loss.

---

## The 10 System Invariants

1. **Decoupled Bridge Core**: All state machine logic lives in `packages/bridge-core`; CLI, web, and mobile are strictly presentation clients.
2. **Outbound Only**: The workstation never exposes a public inbound listener; all traffic routes through outbound WebSocket connections.
3. **Local Execution**: All MCP tool executions occur exclusively on your workstation inside your project directory.
4. **Dual Memory Separation**: Full execution logs are preserved on disk, while compact pruned context is fed to the LLM token window.
5. **Zero Disk Bloat**: In-memory ring buffer is capped at 500 events (~500 KB RAM); stale sessions are pruned on a 14-day LRU schedule.
6. **Monotonic Sequencing**: Every stream event carries a strict monotonically incrementing `seq_id` to guarantee ordered replay.
7. **Dual-Surface Approvals**: Approval prompts fire concurrently on local CLI and remote mobile/web clients.
8. **180s Bounded Timeout**: Unattended approval requests auto-deny after exactly 180 seconds with explicit failure logging.
9. **Strict Zod Runtime Validation**: Every incoming and outgoing socket message is validated against `@airlink/protocol` Zod schemas.
10. **Mechanically Enforced Quality Gate**: Commits and PRs are gated by pre-commit suppression hooks (`check-suppressions.mjs`), Qodo automated reviews, and 100% passing tests.

---

## Testing & Code Quality

AirLink maintains a zero-compromise standard for code quality and test discipline:

```bash
# Run unit & integration tests across all monorepo packages
pnpm test

# Run TypeScript typechecks across all packages
pnpm typecheck

# Check for unapproved lint/type suppressions
pnpm check:suppressions
```

- **100% Test Pass Rate**: 234 unit and integration tests across 35 test suites.
- **No Hardcoded Outputs**: Every assertion exercises real runtime calculations, schemas, and state transitions.
- **Zero Suppression Policy**: The mechanical pre-commit script `scripts/check-suppressions.mjs` blocks `@ts-ignore`, `@ts-expect-error`, and `eslint-disable` without explicit authorization.

---

## Qodo Code Review Evidence

Every substantive change in AirLink is verified through automated pull request analysis with [Qodo](https://qodo.ai).

### Representative Review Resolution (PR #24)

| Finding | Severity | Resolution Implemented |
| :--- | :---: | :--- |
| **Room Hijack Risk** | Critical | Enforced mandatory cryptographic `hostSecret` generated via `crypto.randomUUID()` to prevent unauthorized room takeover. |
| **Predictable PINs** | Critical | Replaced pseudo-random `Math.random()` with cryptographically secure `crypto.randomInt(100000, 1000000)`. |
| **Silent Tool Drops** | High | Implemented full SSE tool chunk buffering (`content_block_start`, `input_json_delta`) for Anthropic models. |
| **Data Loss on Ingestion**| High | Replaced dropped HTTP support tickets with durable disk and in-memory persistent records before returning HTTP 200. |
| **Silent Error Swallowing** | Medium | Eliminated empty catch blocks; replaced with typed error logging and user-facing status alerts. |

---

## Hackathon Tracks

AirLink was created for the [TrueForge Agent Harness Hackathon](https://www.wemakedevs.org/hackathons/trueforge).

### 🎯 Double-O Track — Best Use of TrueForge
- **Native MCP Tool Suite**: Filesystem reads/writes, bash command execution, and git operations run through local MCP tool harnesses.
- **Sandboxed Execution**: Code runs securely on the developer workstation with strict path traversal boundary checks.
- **Human-in-the-Loop Interception**: Destructive operations are captured by `ApprovalManager` before reaching the execution layer.
- **Multi-Turn Context Lifecycle**: `TrueForgeSession` coordinates prompt caching, subagent dispatch, and token streaming.

### 🧪 Q Branch Track — Best Code Quality
- **234 Tests Across 35 Suites**: Zero skipped tests, zero mocks for core application logic, and full edge-case coverage.
- **Strict Protocol Contracts**: Zod schemas validate payloads across every device boundary.
- **Mechanical Suppression Gating**: Hard pre-commit verification blocks unapproved suppressions.
- **Automated Qodo Reviews**: Every PR reviewed and hardened against security and architectural edge cases.

### 🎨 Savile Row Track — Best UI
- **Dark Obsidian Developer Palette**: Styled around curated tokens (`#090d16`, `#000000`, `#38bdf8`) with crisp hairline borders.
- **Smooth Real-Time Mobile Feed**: Virtualized stream feed rendering markdown, tool snippets, and collapsible thoughts.
- **Line-by-Line Git Diff Cards**: Visual diff cards with unified syntax highlighting and 1-tap action buttons.
- **Dynamic 180s Countdown Drawer**: Bottom drawer with color-morphing countdown timer (green &rarr; amber &rarr; red) and haptic feedback.

---

## Security & Privacy

- **Outbound-Only Connections**: No public IP, DNS record, or open router ports are required on your workstation.
- **Zero Cloud Storage**: The cloud relay is completely stateless; session tokens and code diffs never persist on relay disks.
- **Hardware-Backed Key Vault**: API keys stored in device Keystore/Keychain via `expo-secure-store`; never broadcast to the relay.
- **Automated Secret Scanning**: `secret_scan.yml` runs Gitleaks checks on every commit to block credential leakage.

---

## License

AirLink is open-source software licensed under the [MIT License](https://github.com/Team-Managed/AirLink/blob/main/LICENSE).

&copy; 2026 AirLink Contributors.
