Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` through `04-cloud-relay-server.md`.

Implement the standalone Node.js Terminal CLI host daemon in `apps/cli`, wrapping `@agent-remote/bridge-core` with terminal banners, ASCII QR codes, and interactive keyboard approvals.

## Implementation

1. Create `apps/cli/package.json` declaring the executable binary entry (`bin: { "agent-remote": "./dist/bin.js" }`), depending on `@agent-remote/bridge-core`, `@agent-remote/protocol`, `chalk`, `boxen`, `qrcode-terminal`, and `dotenv`.
2. Create `apps/cli/src/terminal-ui.ts`:
   - Implement `renderBootBanner()`:
     - Clear the console and render a double-bordered boxen container.
     - Format the 6-digit PIN in bold highlighted text with green background.
     - Render a compact ASCII QR code via `qrcode-terminal` encoding `agent-remote://pair?pin=<PIN>`.
     - Print relay URL, active workspace directory, model engine identifier, and connection status.
   - Implement `promptTerminalApproval()`:
     - Use Node.js `readline` interface to display a highlighted approval prompt in the terminal.
     - Format tool name, command or diff content, and risk level with color coding.
     - Prompt the user with `Approve on PC [y/N]?` and return `true` on affirmative response (`y`/`yes`), `false` otherwise.
3. Create `apps/cli/src/index.ts` and `apps/cli/src/bin.ts`:
   - Parse command-line flags for custom relay URLs (`--relay`), engine ports (`--port`), and workspace paths (`--dir`).
   - Instantiate `SocketBridge` from `@agent-remote/bridge-core`.
   - Call `renderBootBanner()` on startup.
   - Register `promptTerminalApproval()` with the bridge's `onHostApprovalPrompt()` hook to enable keyboard approval fallback.
   - Handle `SIGINT` and `SIGTERM` signals: cancel pending approval timers, emit clean disconnect notices, and exit process gracefully.

## Scope Limits

- Do not duplicate bridge logic, prompt builders, or ring buffers in the CLI; consume `@agent-remote/bridge-core`.
- Do not block terminal stdout during non-approval streaming.
- Do not require root or administrative privileges to launch the CLI daemon.
- Do not write temporary session credentials to world-readable filesystem locations.

## Notes

- The CLI is the primary headless host interface for terminal-first developers and remote SSH sessions.
- Readline prompt enables dual-surface approval without requiring the developer to reach for their phone if already at the keyboard.
- Depends on: 00, 01, 02, 03, 04. Required before: 11.

## Check When Done

- Running `pnpm --filter @agent-remote/cli dev` outputs a formatted banner, 6-digit PIN, and ASCII QR code.
- Terminal prompts `[y/N]` when an approval is requested and resolves cleanly.
- `Ctrl+C` terminates the process cleanly and notifies the paired mobile client.
