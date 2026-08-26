Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` through `04-cloud-relay-server.md`.

Implement the VS Code Extension host & interactive client in `apps/vscode-extension`, wrapping `@agent-remote/bridge-core` to provide an interactive Chat/Session sidebar Webview, synchronized editor diff views, Status Bar PIN pairing indicators, and native window modal approvals.

## Implementation

1. Create `apps/vscode-extension/package.json` with extension manifest:
   - Extension name `vscode-agent-remote`, displayName _"Agent Remote"_, and activation events on startup / view container focus.
   - Contributes views container and Webview view: `agentRemote.chatView` in the Activity Bar with icon and title _"Agent Remote Chat"_.
   - Contributes commands: `agentRemote.start`, `agentRemote.stop`, `agentRemote.copyPIN`, `agentRemote.submitPrompt`, `agentRemote.openDiff`, `agentRemote.createPR`, `agentRemote.importIssue`.
   - Declare dependencies on `@agent-remote/bridge-core` and `@agent-remote/protocol`.
2. Create `apps/vscode-extension/src/chat-webview.ts`:
   - Implement `AgentChatViewProvider` implementing `vscode.WebviewViewProvider`:
     - Render clean dark-themed chat interface adhering to VS Code CSS variables (`var(--vscode-editor-background)`, `var(--vscode-foreground)`).
     - Provide interactive prompt input box enabling the developer to prompt TrueForge directly from VS Code.
     - Include quick actions for GitHub PR creation and Issue loading.
     - Stream live tokens, thoughts, tool executions, and diff previews in real time.
     - Mirror prompts submitted remotely from the mobile app (`📱 Mobile: <prompt>`).
     - Display interactive "Approve" / "Deny" buttons directly inside the chat stream when tool approvals occur.
3. Create `apps/vscode-extension/src/extension.ts`:
   - Implement `activate(context)`:
     - Detect the active workspace folder path.
     - Generate a random 6-digit pairing PIN.
     - Initialize `SocketBridge` and `TrueForgeClient` from `@agent-remote/bridge-core`.
     - Register `AgentChatViewProvider` for `agentRemote.chatView`.
     - Create a VS Code Status Bar item positioned on the right: `$(radio-tower) Remote: <PIN>`, configured with click-to-copy PIN/URL and tooltip.
     - Register `onHostApprovalPrompt()` callback: trigger `vscode.window.showWarningMessage` with modal options `Approve` and `Deny`, and forward the event to the chat webview.
     - Implement Diff Viewer Handler: When tool action involves file modifications with a Git diff, execute `vscode.commands.executeCommand('vscode.diff', ...)` to open native side-by-side diff in the editor.
     - Register command `agentRemote.copyPIN` to copy the pairing PIN and URL (`https://agent-remote.dev/pair?pin=<PIN>`) to the clipboard with an informative toast.
     - Register subscriptions for clean disposal on extension deactivation.
   - Implement `deactivate()`: Stop active socket bridge and dispose of Status Bar items.
4. Configure `apps/vscode-extension/tsconfig.json` and build scripts.

## Scope Limits

- Do not re-implement Socket.io or TrueForge logic inside the extension; use `@agent-remote/bridge-core`.
- Do not block the VS Code UI thread during network operations or long model turns.
- Do not open unsolicited modal dialogs unless an explicit `approval_required` event occurs.

## Notes

- Seamlessly integrates with the developer's everyday editor workflow with zero context switching.
- Allows prompting from VS Code while away on mobile, or prompting from mobile while seeing live diffs open in VS Code.
- Status Bar item provides continuous visibility of remote connection state.
- Depends on: 00, 01, 02, 03, 04. Required before: 11.

## Check When Done

- Extension compiles cleanly with `pnpm --filter @agent-remote/vscode-extension build`.
- Status Bar item, chat Webview provider, and notification hooks typecheck without errors.
- Activating the extension establishes socket connection, renders the Chat Webview, and displays pairing PIN in the Status Bar.
- Directives typed in the VS Code chat view stream live to both the editor view and the paired mobile app.
