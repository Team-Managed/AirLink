import * as vscode from "vscode";
import * as os from "node:os";
import { SocketBridge, TrueForgeClient, TrueForgeSession } from "@agent-remote/bridge-core";
import { AgentChatViewProvider } from "./chat-webview.js";

let activeBridge: SocketBridge | null = null;
let activeSession: TrueForgeSession | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;

export function generateSessionPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function formatPin(pin: string): string {
  const cleaned = pin.replace(/\D/g, "");
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return pin;
}

/**
 * Activates the VS Code extension host and initializes the remote harness bridge.
 */
export function activate(context: vscode.ExtensionContext): void {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const workspacePath = workspaceFolders && workspaceFolders.length > 0 && workspaceFolders[0]
    ? workspaceFolders[0].uri.fsPath
    : process.cwd();

  const config = vscode.workspace.getConfiguration("agentRemote");
  const relayUrl = config.get<string>("relayUrl") || process.env["RELAY_URL"] || "http://localhost:3001";
  const model = config.get<string>("model") || process.env["AGENT_MODEL"] || "0x-alpha";
  const pin = generateSessionPin();
  const sessionId = pin.replace(/\D/g, "");

  // 1. Initialize TrueForge Client & Active Session
  const trueForgeClient = new TrueForgeClient({ defaultModel: model });
  activeSession = trueForgeClient.createSession({
    sessionId,
    workspacePath,
  });

  // 2. Initialize SocketBridge
  activeBridge = new SocketBridge({
    relayUrl,
    pin,
    hostName: os.hostname(),
    workspacePath,
    autoConnect: true,
  });

  // 3. Register Sidebar Chat View Provider
  const chatProvider = new AgentChatViewProvider(context.extensionUri);
  chatProvider.setSessionInfo(formatPin(pin), relayUrl, model);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(AgentChatViewProvider.viewType, chatProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  // 4. Create Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "agentRemote.copyPIN";
  statusBarItem.text = `$(radio-tower) Remote: ${formatPin(pin)}`;
  statusBarItem.tooltip = `Agent Remote active (PIN: ${formatPin(pin)}). Click to copy pairing link.`;
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  let isExecuting = false;

  // 5. Helper to execute a turn and mirror tokens to both VS Code Webview and Mobile Socket
  async function dispatchTurn(promptText: string, origin: "local" | "remote"): Promise<void> {
    if (!activeSession || !activeBridge) return;
    if (isExecuting) {
      void vscode.window.showWarningMessage("Agent Remote turn is already running.");
      return;
    }

    isExecuting = true;
    try {
      if (origin === "local") {
        chatProvider.addLocalUserMessage(promptText);
      } else {
        chatProvider.addRemoteUserMessage(promptText);
      }

      for await (const chunk of activeSession.executeTurn({ prompt: promptText })) {
        chatProvider.handleStreamChunk(chunk);
        activeBridge.sendStream(chunk);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown execution failure";
      void vscode.window.showErrorMessage(`Agent Remote turn failed: ${msg}`);
    } finally {
      isExecuting = false;
    }
  }

  // 6. Connect Webview actions
  chatProvider.onPrompt((text) => {
    void dispatchTurn(text, "local");
  });

  chatProvider.onApprovalResponse((approvalId, approved) => {
    if (activeBridge) {
      activeBridge.approvalManager.resolveApproval(
        approvalId,
        approved,
        approved ? "Approved via VS Code Webview" : "Denied via VS Code Webview",
      );
      chatProvider.handleApprovalResolved(approvalId, approved);
    }
  });

  // 7. Connect Socket Bridge events
  activeBridge.onPrompt((clientPrompt) => {
    void dispatchTurn(clientPrompt.prompt, "remote");
  });

  activeBridge.onSync((sync) => {
    if (activeSession && activeBridge) {
      const missedEvents = activeSession.ringBuffer.getEventsSince(sync.lastSeenSeq);
      activeBridge.sendStreamBatch({
        sessionId,
        events: missedEvents,
      });
    }
  });

  activeBridge.onSessionConnected((sessionConn) => {
    void vscode.window.showInformationMessage(
      `📱 Mobile remote paired to session ${formatPin(sessionConn.sessionId)}`,
    );
  });

  // 8. Dual-Surface Approval Notification Hook
  activeBridge.onHostApprovalPrompt((req) => {
    chatProvider.handleApprovalRequest(req);

    // Native modal window warning
    const message = `⚠️ Action Approval: [${req.toolName}] ${req.commandOrDiff.slice(0, 100)}`;
    void vscode.window
      .showWarningMessage(message, { modal: false }, "Approve", "Deny")
      .then((selection) => {
        if (selection === "Approve" || selection === "Deny") {
          const approved = selection === "Approve";
          if (activeBridge) {
            activeBridge.approvalManager.resolveApproval(
              req.approvalId,
              approved,
              approved ? "Approved via VS Code Notification" : "Denied via VS Code Notification",
            );
            chatProvider.handleApprovalResolved(req.approvalId, approved);
          }
        }
      });
  });

  // 9. Register VS Code Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("agentRemote.copyPIN", async () => {
      const pairUrl = `https://agent-remote.dev/pair?pin=${sessionId}`;
      await vscode.env.clipboard.writeText(pairUrl);
      void vscode.window.showInformationMessage(
        `✔ Copied pairing URL to clipboard: ${pairUrl} (PIN: ${formatPin(pin)})`,
      );
    }),

    vscode.commands.registerCommand("agentRemote.createPR", () => {
      void dispatchTurn("Create a pull request with all session changes and test results.", "local");
    }),

    vscode.commands.registerCommand("agentRemote.importIssue", async () => {
      const issueNum = await vscode.window.showInputBox({
        prompt: "Enter GitHub Issue Number to load context (e.g. 42)",
        placeHolder: "42",
      });
      if (issueNum) {
        const cleaned = issueNum.replace(/\D/g, "");
        if (cleaned) {
          void dispatchTurn(`Fix GitHub Issue #${cleaned} and verify tests pass.`, "local");
        }
      }
    }),

    vscode.commands.registerCommand("agentRemote.start", () => {
      if (activeBridge && !activeBridge.isConnected()) {
        activeBridge.connect();
        void vscode.window.showInformationMessage("Agent Remote bridge connected.");
      }
    }),

    vscode.commands.registerCommand("agentRemote.stop", () => {
      if (activeBridge) {
        activeBridge.disconnect();
        void vscode.window.showInformationMessage("Agent Remote bridge disconnected.");
      }
    }),
  );
}

/**
 * Deactivates the VS Code extension host and releases socket resources.
 */
export function deactivate(): void {
  if (activeBridge) {
    activeBridge.disconnect();
    activeBridge = null;
  }
  if (statusBarItem) {
    statusBarItem.dispose();
    statusBarItem = null;
  }
  activeSession = null;
}
