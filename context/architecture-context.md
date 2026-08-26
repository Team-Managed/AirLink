# Architecture Context: Remote Agent Harness

## 1. Stack & Deployables

| Layer                       | Technology                                                              | Role                                                                                                                                                                                                                                                           |
| :-------------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile Client**           | **React Native (Expo SDK 51+) + TypeScript**                            | Cross-platform control UI (Android, iOS), pairing screens, virtualized feeds, diff viewers, and bottom-sheet drawers.                                                                                                                                          |
| **Web Landing & Client**    | **Next.js (App Router) / React 19 + TypeScript (`apps/web`)**           | Dark developer landing page (`#090d16`), interactive terminal emulator, architecture showcase, and browser-based remote `/pair` client.                                                                                                                        |
| **Relay Server**            | **Node.js 22+ (LTS) / TypeScript + Socket.io (`apps/relay`)**           | Cloud message bridge; manages ephemeral PIN-paired rooms, IP rate limiting (max 3 failed PINs), and zero-retention event routing. Deployed via Docker on Fly.io / Railway.                                                                                     |
| **Bridge Engine Core**      | **Shared TypeScript Package (`packages/bridge-core`)**                  | Decoupled core engine: Socket.io tunnel, TrueForge SDK connector, event ring buffer (`seq_id`), approval Promise map, and Slack/Discord webhook notifiers.                                                                                                     |
| **Terminal Host & Client**  | **Node.js CLI (`apps/cli`)**                                            | Interactive CLI client & host; compact boxen banner, PIN display, pairing link, local REPL prompt, live terminal token/tool streaming, and dual-surface `[y/N]` approvals. Distributed via `irm` (Windows), `curl` (macOS/Linux), and `npx @agent-remote/cli`. |
| **IDE Host & Chat Panel**   | **VS Code Extension (`apps/vscode-extension`)**                         | IDE client & host; Activity Bar Chat Webview for in-editor prompting/streaming, Status Bar PIN display (`$(radio-tower)`), native modal approvals, and side-by-side diffs.                                                                                     |
| **Agent Execution Harness** | **TrueForge (`@truefoundry/trueforge` / `@truefoundry/trueforge-sdk`)** | Core execution harness; manages LLM turns, context lifecycle, MCP tool dispatching, and sandboxed execution.                                                                                                                                                   |
| **Reasoning Engine (LLM)**  | **0x Alpha / DeepSeek R1 (via OpenRouter)**                             | Frontier coding model with 1M context window; provider-agnostic via OpenAI-compatible endpoint with 5-layer cached prompt structure.                                                                                                                           |
| **Tool Execution Protocol** | **Model Context Protocol (MCP)**                                        | Real local filesystem reads/writes (`@modelcontextprotocol/server-filesystem`) and terminal runners (`node-pty` / bash).                                                                                                                                       |
| **Local Device Vault**      | **`expo-secure-store`**                                                 | Hardware-backed encrypted keychain for BYOK API keys on the mobile device.                                                                                                                                                                                     |
| **Code Quality & CI**       | **Qodo Gen + Qodo Merge (`pr-agent-action`) + Vitest**                  | Automated unit test generation, protocol verification, and automated GitHub PR code quality gatekeeping (>90% coverage target).                                                                                                                                |
| **Monorepo**                | **`pnpm` Workspaces**                                                   | `apps/mobile`, `apps/web`, `apps/relay`, `apps/cli`, `apps/vscode-extension`, `packages/protocol`, `packages/bridge-core`.                                                                                                                                     |

---

## 2. Dual-Memory & Context Window Model

The system enforces a strict separation between **Ephemeral Working Memory** (in-context LLM window) and **Persistent Storage Memory** (local disk):

### Tier 1: Ephemeral Working Memory (In-Context Window)

1. **Static Prefix Prompt Caching (Layers 1-3):**
   - Layer 1 (System Role), Layer 2 (Few-Shot Examples), and Layer 3 (MCP Tool Zod Schemas) remain static and byte-identical across all turns to leverage LLM provider prompt caching.
2. **Tool Output Windowing:**
   - Large terminal outputs are truncated before entering the LLM prompt (keeping the head 20 lines + tail 50 lines + exit code) while preserving the full log on disk.
3. **Hierarchical Compaction (Sliding Window):**
   - Maintains the last 10 turns in full fidelity; older turns are compacted into a structured session summary.

### Tier 2: Persistent Storage Memory (Developer PC Disk)

1. **Active Session Synchronization (`<workspace>/.agent-remote/session.json`):**
   - Lightweight atomic JSON document recording the workspace's active 6-digit PIN, session ID, relay endpoint, active LLM model, and creation/update timestamps.
   - **Participating Hosts:** Shared across CLI (`apps/cli`), VS Code Extension (`apps/vscode-extension`), Web pairing (`/pair`), and Mobile clients.
   - **Lifecycle & Discovery:** When a developer boots the CLI, it generates a PIN and persists `session.json`. When VS Code opens the same project workspace, it discovers `session.json`, inherits the active PIN, and registers to the same Relay room without generating a conflicting PIN or evicting the CLI host.
   - **Expiry & Cleanup:** Records have a 24-hour default TTL (`maxAgeMs: 86_400_000`). Cleared on `/clear`, session reset, or workspace switch.
2. **Local Session Store (`~/.agent-remote/sessions/` or TrueForge SQLite):**
   - Full verbatim history of all user prompts, raw model reasoning, un-truncated tool logs, and diff checkpoints.
3. **In-Memory Event Ring Buffer (`packages/bridge-core`):**
   - Circular buffer holding the last 500 event chunks tagged with monotonic `seq_id: 1..N` for instant mobile catch-up hydration upon reconnect.
4. **Stateless Relay (Zero Database):**
   - Relay persists zero tokens, zero diffs, zero session data, and supports multi-host rooms mapped to the shared PIN.
5. **Mobile Stateless View:**
   - Mobile client holds only in-memory view state, hydrated on demand from the PC daemon via `session:hydrate`.

---

## 3. Local Disk Retention & Anti-Bloat Policy

To guarantee the local machine never experiences disk bloat or uncontrolled log accumulation:

1. **Fixed-Capacity In-Memory Ring Buffer:**
   - The ring buffer runs strictly in RAM and is capped at **500 events (~500 KB)**. When event #501 arrives, event #1 is discarded from RAM. It never writes unbounded event logs to disk.
2. **TrueForge Compact SQLite Storage:**
   - Sessions are indexed in a lightweight SQLite database (`.trueforge/sessions.db`). A typical 50-turn coding session with diffs takes only **~200 KB to 1.5 MB**.
3. **Per-Command Log Streaming Cap:**
   - If a script outputs a massive loop of terminal text, `bridge-core` streams up to **2 MB**, truncates the excess with a marker (`[Output capped at 2MB]`), and stops memory inflation.
4. **LRU Session Auto-Pruning:**
   - The bridge daemon applies a **14-day retention policy** (or maximum 20 sessions). Sessions older than 14 days are automatically pruned upon daemon startup.
5. **Total Footprint Guarantee:**
   - Lifetime disk footprint across 50 active coding sessions remains **under 30 MB** total.

---

## 4. System Boundaries & Ownership

| Boundary                               | Owns                                                                                                                                      |
| :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **`packages/protocol/src/contracts/`** | All shared Zod schemas and inferred TypeScript types (`AgentStreamPayload`, `ApprovalRequestPayload`, `BYOKConfig`, etc.).                |
| **`packages/bridge-core/src/`**        | Core tunnel management, TrueForge SDK binding, event ring buffer, context pruner, approval Promise resolvers, and Slack/Discord webhooks. |
| **`apps/relay/src/`**                  | Socket.io server, IP rate limiter (3-attempt lockout), ephemeral room session store, and connection lifecycle handlers.                   |
| **`apps/cli/src/`**                    | Terminal presentation & interactive REPL: compact boxen banner, pairing PIN/link display, stream rendering, and keyboard approval prompt. |
| **`apps/vscode-extension/src/`**       | VS Code presentation: Activity Bar Chat Webview, Status Bar item, command registration, native diffs, and window modal approvals.         |
| **`apps/web/src/`**                    | Next.js Landing Page, interactive terminal emulator, architecture diagrams, install script hosting, and web pairing client (`/pair`).     |
| **`apps/mobile/src/screens/`**         | React Native screen views: PairingScreen, SessionScreen, SettingsScreen (BYOK).                                                           |
| **`apps/mobile/src/components/`**      | TerminalFeed, DiffCard (color-coded unified diff), ApprovalDrawer, PromptInputBar.                                                        |
| **`apps/mobile/src/services/`**        | Socket service, SecureStore vault helper, haptic triggers (`expo-haptics`), and audio alert handlers.                                     |

---

## 5. The 10 Invariants of the Remote Agent Harness

1. **Decoupled Bridge Core:** All tunnel and TrueForge coordination logic lives in `packages/bridge-core`. CLI, VS Code extension, and web services are thin presentation wrappers.
2. **Outbound only:** The local PC never opens inbound listening ports to the public internet. All traffic flows through an outbound WebSocket tunnel.
3. **Local execution invariant:** TrueForge and all MCP tool executions (filesystem reads/writes, bash commands) run exclusively on the local PC.
4. **Dual memory separation:** Unbounded verbatim logs reside in persistent storage on disk; pruned/cached context structures are fed to the working LLM window.
5. **Zero disk bloat guarantee:** In-memory ring buffer is capped at 500 events (~500 KB RAM); local SQLite sessions are pruned on a 14-day LRU schedule keeping lifetime footprint < 30 MB.
6. **Monotonic event sequencing:** Every stream event emitted by `bridge-core` carries an incrementing integer `seq_id`. Missed sequences during mobile disconnects are replayed from the ring buffer upon `client:sync`.
7. **Dual-surface approvals:** Every approval request is presented on both the mobile app drawer and the local host (terminal or VS Code notification) simultaneously.
8. **Bounded approval timeout:** In-flight approvals timeout after **180 seconds**, defaulting to `DENIED` with reason `Timed out` rather than hanging the engine indefinitely.
9. **Strict Zod contract validation:** All incoming socket payloads are validated against Zod schemas in `packages/protocol` before processing.
10. **Automated quality gatekeeping:** All pull requests must pass automated Qodo Merge reviews, mechanical suppression checks (`check-suppressions.mjs`), and Vitest unit test suites before merging into `main`.
