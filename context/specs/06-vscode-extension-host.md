Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` through `04-cloud-relay-server.md`.

Implement the VS Code Extension host in `apps/vscode-extension`, wrapping `@agent-remote/bridge-core` to display the pairing PIN in the Status Bar and trigger native window modal approvals.

## Implementation

1. Create `apps/vscode-extension/package.json` with extension manifest:
   - Extension name `vscode-agent-remote`, displayName _"Agent Remote"_, and activation events on startup.
   - Contributes commands: `agentRemote.start`, `agentRemote.stop`, `agentRemote.showQR`.
   - Declare dependencies on `@agent-remote/bridge-core` and `@agent-remote/protocol`.
2. Create `apps/vscode-extension/src/extension.ts`:
   - Implement `activate(context)`:
     - Detect the active workspace folder path.
     - Generate a random 6-digit pairing PIN.
     - Initialize `SocketBridge` from `@agent-remote/bridge-core`.
     - Create a VS Code Status Bar item positioned on the right: `$(radio-tower) Remote: <PIN>`, configured with click-to-copy and tooltip.
     - Register `onHostApprovalPrompt()` callback: trigger `vscode.window.showWarningMessage` with modal options `Approve` and `Deny`.
     - Register command `agentRemote.showQR` to display the pairing PIN and QR code in an informative popup or webview panel.
     - Register subscriptions for clean disposal on extension deactivation.
   - Implement `deactivate()`: Stop active socket bridge and dispose of Status Bar items.
3. Configure `apps/vscode-extension/tsconfig.json` and build scripts.

## Scope Limits

- Do not re-implement Socket.io or TrueForge logic inside the extension; use `@agent-remote/bridge-core`.
- Do not block the VS Code UI thread during network operations or long model turns.
- Do not open unsolicited modal dialogs unless an explicit `approval_required` event occurs.

## Notes

- Seamlessly integrates with the developer's everyday editor workflow with zero context switching.
- Status Bar item provides continuous visibility of remote connection state.
- Depends on: 00, 01, 02, 03, 04. Required before: 11.

## Check When Done

- Extension compiles cleanly with `pnpm --filter @agent-remote/vscode-extension build`.
- Status Bar item and notification hooks typecheck without errors.
- Activating the extension establishes socket connection and displays pairing PIN in the Status Bar.
