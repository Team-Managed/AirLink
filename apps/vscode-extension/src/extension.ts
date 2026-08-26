import * as vscode from "vscode";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";
import {
  SocketBridge,
  TrueForgeClient,
  TrueForgeSession,
  getGitDiff,
  runWorkspaceTests,
  runWorkspaceLint,
} from "@agent-remote/bridge-core";
import { AgentChatViewProvider } from "./chat-webview.js";

let activeBridge: SocketBridge | null = null;
let activeSession: TrueForgeSession | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;
let currentPin: string = "";

function loadEnvironment(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(process.cwd(), "..", "..", ".env"),
    path.resolve(os.homedir(), ".agent-remote", ".env"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
}

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
  loadEnvironment();

  const workspaceFolders = vscode.workspace.workspaceFolders;
  const workspacePath = workspaceFolders && workspaceFolders.length > 0 && workspaceFolders[0]
    ? workspaceFolders[0].uri.fsPath
    : process.cwd();

  const config = vscode.workspace.getConfiguration("agentRemote");
  const relayUrl = config.get<string>("relayUrl") || process.env["RELAY_URL"] || "http://localhost:3001";
  const model = config.get<string>("model") || process.env["AGENT_MODEL"] || "gemini-2.0-flash";
  currentPin = generateSessionPin();

  const chatProvider = new AgentChatViewProvider(context.extensionUri);

  function initializeBridge(pin: string): void {
    const rawPin = pin.replace(/\D/g, "");
    currentPin = rawPin;

    if (activeBridge) {
      activeBridge.disconnect();
    }

    const trueForgeClient = new TrueForgeClient({ defaultModel: model });
    activeSession = trueForgeClient.createSession({
      sessionId: rawPin,
      workspacePath,
    });

    activeBridge = new SocketBridge({
      relayUrl,
      pin: rawPin,
      hostName: os.hostname(),
      workspacePath,
      autoConnect: true,
    });

    chatProvider.setSessionInfo(
      formatPin(rawPin),
      relayUrl,
      activeSession.defaultModel,
      activeSession.providerConfig.provider,
    );

    if (statusBarItem) {
      statusBarItem.text = `$(radio-tower) Remote: ${formatPin(rawPin)}`;
      statusBarItem.tooltip = `Agent Remote active (PIN: ${formatPin(rawPin)}). Click to copy pairing link.`;
    }

    // Attach Socket Bridge listeners
    activeBridge.onPrompt((clientPrompt) => {
      void dispatchTurn(clientPrompt.prompt, "remote");
    });

    activeBridge.onSync((sync) => {
      if (activeSession && activeBridge) {
        const missedEvents = activeSession.ringBuffer.getEventsSince(sync.lastSeenSeq);
        activeBridge.sendStreamBatch({
          sessionId: rawPin,
          events: missedEvents,
        });
      }
    });

    activeBridge.onSessionConnected((sessionConn) => {
      void vscode.window.showInformationMessage(
        `📱 Mobile remote paired to session ${formatPin(sessionConn.sessionId)}`,
      );
    });

    activeBridge.onHostApprovalPrompt((req) => {
      chatProvider.handleApprovalRequest(req);

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
  }

  // 1. Initialize with initial PIN
  initializeBridge(currentPin);

  // 2. Register Webview Provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(AgentChatViewProvider.viewType, chatProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  // 3. Create Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "agentRemote.copyPIN";
  statusBarItem.text = `$(radio-tower) Remote: ${formatPin(currentPin)}`;
  statusBarItem.tooltip = `Agent Remote active (PIN: ${formatPin(currentPin)}). Click to copy pairing link.`;
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  let isExecuting = false;

  // 4. Helper to execute turn
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

  // 5. Connect Webview actions
  chatProvider.onPrompt((text) => {
    void dispatchTurn(text, "local");
  });

  chatProvider.onAction(async (action, arg) => {
    if (action === "diff") {
      const diff = await getGitDiff(workspacePath);
      chatProvider.addSystemMessage(`🔍 Current Git Diff:\n\n${diff}`);
    } else if (action === "test") {
      chatProvider.addSystemMessage(`🧪 Running workspace tests${arg ? ` (filter: ${arg})` : ""}...`);
      const result = await runWorkspaceTests(workspacePath, arg);
      chatProvider.addSystemMessage(
        `${result.success ? "✔ Tests Passed" : "❌ Tests Failed"} (${result.durationMs}ms):\n\n${result.output}`,
      );
    } else if (action === "lint") {
      chatProvider.addSystemMessage("🧹 Running workspace typecheck...");
      const result = await runWorkspaceLint(workspacePath);
      chatProvider.addSystemMessage(
        `${result.success ? "✔ Typecheck Passed" : "❌ Typecheck Failed"} (${result.durationMs}ms):\n\n${result.output}`,
      );
    } else if (action === "stats") {
      if (activeSession) {
        const stats = activeSession.getStats();
        chatProvider.addSystemMessage(
          `📊 Session Metrics:\n- PIN: ${formatPin(stats.sessionId)}\n- Turns: ${stats.turnCount}\n- Buffered Events: ${stats.bufferedEvents}\n- Latest Sequence: #${stats.latestSeq}\n- Provider: ${stats.provider} (Free)\n- Model: ${stats.activeModel}`,
        );
      }
    } else if (action === "setPin") {
      const input = await vscode.window.showInputBox({
        prompt: "Enter 6-digit PIN to host or pair with (e.g. 560-994)",
        value: formatPin(currentPin),
      });
      if (input) {
        const cleaned = input.replace(/\D/g, "");
        if (cleaned.length === 6) {
          initializeBridge(cleaned);
          chatProvider.addSystemMessage(`✔ Session PIN updated to ${formatPin(cleaned)}. Relay room active.`);
          void vscode.window.showInformationMessage(`Agent Remote PIN set to ${formatPin(cleaned)}`);
        } else {
          void vscode.window.showErrorMessage("PIN must be exactly 6 digits.");
        }
      }
    } else if (action === "copyPin") {
      const pairUrl = `https://agent-remote.dev/pair?pin=${currentPin}`;
      await vscode.env.clipboard.writeText(pairUrl);
      chatProvider.addSystemMessage(`✔ Copied pairing URL to clipboard: ${pairUrl}`);
      void vscode.window.showInformationMessage(`Copied pairing URL: ${pairUrl}`);
    } else if (action === "clear") {
      if (activeSession) {
        activeSession.clearHistory();
        chatProvider.clearMessages();
        chatProvider.addSystemMessage("✔ Conversation history and in-memory ring buffer reset.");
      }
    }
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

  // 6. Register VS Code Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("agentRemote.copyPIN", async () => {
      const pairUrl = `https://agent-remote.dev/pair?pin=${currentPin}`;
      await vscode.env.clipboard.writeText(pairUrl);
      void vscode.window.showInformationMessage(
        `✔ Copied pairing URL to clipboard: ${pairUrl} (PIN: ${formatPin(currentPin)})`,
      );
    }),

    vscode.commands.registerCommand("agentRemote.setPIN", async () => {
      const input = await vscode.window.showInputBox({
        prompt: "Enter 6-digit PIN to host or pair with (e.g. 560-994)",
        value: formatPin(currentPin),
      });
      if (input) {
        const cleaned = input.replace(/\D/g, "");
        if (cleaned.length === 6) {
          initializeBridge(cleaned);
          void vscode.window.showInformationMessage(`Agent Remote PIN set to ${formatPin(cleaned)}`);
        } else {
          void vscode.window.showErrorMessage("PIN must be exactly 6 digits.");
        }
      }
    }),

    vscode.commands.registerCommand("agentRemote.createPR", () => {
      void dispatchTurn("Create a pull request with all session changes and test results.", "local");
    }),

    vscode.commands.registerCommand("agentRemote.showDiff", async () => {
      const diff = await getGitDiff(workspacePath);
      chatProvider.addSystemMessage(`🔍 Current Git Diff:\n\n${diff}`);
    }),

    vscode.commands.registerCommand("agentRemote.clearSession", () => {
      if (activeSession) {
        activeSession.clearHistory();
        chatProvider.clearMessages();
        chatProvider.addSystemMessage("✔ Conversation history and in-memory ring buffer reset.");
      }
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
