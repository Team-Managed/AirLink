Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` through `04-cloud-relay-server.md`.

Implement the standalone Node.js Terminal CLI host & interactive client in `apps/cli`, wrapping `@agent-remote/bridge-core` with compact terminal banners, 6-digit pairing PIN display, clickable pairing URL, interactive local REPL prompting, real-time token/tool streaming, dual-surface keyboard approvals, and multiplatform one-line installer scripts (`irm` for Windows, `curl` for macOS/Linux).

## Implementation

1. Create `apps/cli/package.json` declaring the executable binary entry (`bin: { "agent-remote": "./dist/bin.js" }`), depending on `@agent-remote/bridge-core`, `@agent-remote/protocol`, `chalk`, `boxen`, and `dotenv`.
2. Create `apps/cli/src/terminal-ui.ts`:
   - Implement `renderBootBanner()`:
     - Clear the console and render a double-bordered compact boxen container.
     - Format the 6-digit PIN in bold highlighted text with green background (`PIN: 834-192`).
     - Display clickable pairing URL: `https://agent-remote.dev/pair?pin=<PIN>`.
     - Print relay URL, active workspace directory, model engine identifier, and connection status.
   - Implement `renderStreamChunk(chunk: AgentStream)`:
     - Render thoughts in dim italicized text with subtle cyan prefix `[thought]`.
     - Stream LLM tokens to stdout continuously without line jitter.
     - Render tool calls and tool execution outputs with distinct badge formatting (e.g. `⚡ [bash] npm test`).
     - Render unified Git diff chunks with syntax coloration (`+` green, `-` red).
     - Display clear turn completion separator `✔ [Done] Turn completed`.
   - Implement `promptTerminalApproval()`:
     - Use Node.js `readline` interface to display a highlighted approval prompt in the terminal.
     - Format tool name, command or diff content, and risk level with color coding.
     - Prompt the user with `Approve on PC [y/N]?` and return `true` on affirmative response (`y`/`yes`), `false` otherwise.
   - Implement `promptLocalInput()`:
     - Provide an interactive REPL prompt line `agent-remote > ` for entering user directives directly on the workstation.
     - Display remote activity indicator when paired mobile user submits a prompt: `📱 [Remote @ Phone]: <prompt>`.
3. Create `apps/cli/src/index.ts` and `apps/cli/src/bin.ts`:
   - Parse command-line flags for custom relay URLs (`--relay`), engine ports (`--port`), workspace paths (`--dir`), GitHub issue (`--issue <number>`), auto-PR (`--pr`), and headless daemon mode (`--daemon`).
   - If `--issue <number>` is provided, use local `gh issue view` or Git context to load issue title/body as the initial session directive.
   - Instantiate `SocketBridge` and `TrueForgeClient` from `@agent-remote/bridge-core`.
   - Call `renderBootBanner()` on startup.
   - Attach listeners to stream all turns (whether initiated locally in terminal or remotely from mobile) through `renderStreamChunk()`.
   - Register `promptTerminalApproval()` with the bridge's `onHostApprovalPrompt()` hook to enable keyboard approval fallback.
   - Maintain active REPL loop for local prompting when not in headless daemon mode (supports special commands: `/pr` to generate a PR, `/diff` to view pending changes, `/status` to view connection state).
   - Handle `SIGINT` and `SIGTERM` signals: cancel pending approval timers, emit clean disconnect notices, and exit process gracefully.
4. Create Multiplatform One-Line Installer Scripts (`scripts/install.ps1` and `scripts/install.sh`):
   - **Windows (PowerShell `irm`):** `scripts/install.ps1` allowing execution via:
     ```powershell
     irm https://agent-remote.dev/install.ps1 | iex
     ```
     Checks for Node.js / npm or standalone binary, installs `@agent-remote/cli` globally or to `$HOME/.agent-remote/bin`, and adds it to user `PATH`.
   - **macOS / Linux (POSIX `curl`):** `scripts/install.sh` allowing execution via:
     ```bash
     curl -fsSL https://agent-remote.dev/install.sh | bash
     ```
     Detects OS/arch, checks Node.js/npm, installs CLI globally or to `~/.agent-remote/bin`, and updates shell rc (`.zshrc` / `.bashrc`).

## Scope Limits

- Do not duplicate bridge logic, prompt builders, or ring buffers in the CLI; consume `@agent-remote/bridge-core`.
- Do not block terminal stdout during non-approval streaming.
- Do not require root or administrative privileges to launch the CLI daemon or run the installer scripts.
- Do not write temporary session credentials to world-readable filesystem locations.

## Notes

- The CLI serves as both an interactive local coding agent client on the workstation AND a paired remote host for mobile control.
- Readline prompt enables dual-surface approval without requiring the developer to reach for their phone if already at the keyboard.
- Depends on: 00, 01, 02, 03, 04. Required before: 11.

## Check When Done

- Running `pnpm --filter @agent-remote/cli dev` outputs a clean banner, 6-digit PIN, pairing link, and interactive `agent-remote > ` prompt.
- Submitting a prompt in terminal executes TrueForge turn, streams tokens to stdout, and broadcasts live tokens to paired mobile device.
- Submitting a prompt from mobile displays `[Remote @ Phone]` in terminal and streams tokens to both terminal and phone.
- Terminal prompts `[y/N]` when an approval is requested and resolves cleanly on either surface.
- `install.ps1` and `install.sh` install the CLI binary cleanly without elevation errors.

