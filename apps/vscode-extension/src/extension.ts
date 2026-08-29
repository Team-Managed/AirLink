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
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
} from "@airlink/bridge-core";
import { AgentChatViewProvider } from "./chat-webview.js";

// ── Module-level bridge state ────────────────────────────────────────────────
let activeBridge: SocketBridge | null = null;
let activeSession: TrueForgeSession | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;
let currentPin: string = "";

// ── Workspace path helpers ───────────────────────────────────────────────────

/**
 * Walk up from `startDir` to find the nearest directory that contains a
 * recognised project root marker (`pnpm-workspace.yaml` for monorepos, or
 * `package.json` for single-package projects).
 *
 * Returns the resolved root path, or `null` if none is found before reaching
 * the filesystem root.
 */
function resolveWorkspacePath(startDir: string): string | null {
  let current = startDir;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current; // monorepo root
    }
    if (fs.existsSync(path.join(current, "package.json"))) {
      return current; // single-package root
    }
    const parent = path.dirname(current);
    if (parent === current) break; // reached filesystem root
    current = parent;
  }
  return null;
}

/**
 * Detect the active project root from the VS Code workspace folders.
 *
 * Never falls back to `process.cwd()`: inside the VS Code extension host that
 * resolves to the VS Code *install* directory, not any user project.
 */
function detectWorkspacePath(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0 || !folders[0]) return null;
  const openFolder = folders[0].uri.fsPath;
  return resolveWorkspacePath(openFolder) ?? openFolder;
}

// ── Environment helpers ──────────────────────────────────────────────────────

/**
 * Load a `.env` file, searching in priority order:
 *   1. Resolved workspace root (the monorepo root the user has open)
 *   2. The user's `~/.agent-remote/.env` (global fallback)
 *
 * We deliberately skip `process.cwd()` because it is unreliable in the
 * extension host.
 */
function loadEnvironment(workspacePath: string | null): void {
  const candidates: string[] = [];

  if (workspacePath) {
    candidates.push(path.join(workspacePath, ".env"), path.join(workspacePath, "..", ".env"));
  }

  candidates.push(path.join(os.homedir(), ".agent-remote", ".env"));

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
}

// ── PIN helpers ──────────────────────────────────────────────────────────────

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

// ── Activation ───────────────────────────────────────────────────────────────

/**
 * Activates the VS Code extension host and initialises the remote harness bridge.
 */
export function activate(context: vscode.ExtensionContext): void {
  const workspacePath = detectWorkspacePath();
  loadEnvironment(workspacePath);

  const config = vscode.workspace.getConfiguration("agentRemote");
  const relayUrl =
    config.get<string>("relayUrl") || process.env["RELAY_URL"] || "http://localhost:3001";
  const model = config.get<string>("model") || process.env["AGENT_MODEL"] || undefined;

  // 1. Check for active session in the workspace (e.g. started via CLI) or generate fresh PIN
  const activeRecord = loadActiveSession(workspacePath ?? undefined);
  currentPin = activeRecord?.pin || generateSessionPin();

  const chatProvider = new AgentChatViewProvider(context.extensionUri);

  // ── Workspace guard ──────────────────────────────────────────────────────
  function requireWorkspace(): string | null {
    if (!workspacePath) {
      chatProvider.addSystemMessage(
        "[WARN] No workspace folder open.\n\n" +
          "Agent Remote needs an open project folder to run workspace commands.\n" +
          "Go to File → Open Folder, select your project root, then try again.",
      );
      void vscode.window.showWarningMessage(
        "Agent Remote: Open a project folder first (File → Open Folder).",
      );
      return null;
    }
    return workspacePath;
  }

  // ── Bridge initialisation ────────────────────────────────────────────────

  function initializeBridge(pin: string): void {
    const rawPin = pin.replace(/\D/g, "");
    currentPin = rawPin;

    if (activeBridge) {
      activeBridge.disconnect();
    }

    const resolvedPath = workspacePath ?? "";

    activeBridge = new SocketBridge({
      relayUrl,
      pin: rawPin,
      hostName: os.hostname(),
      workspacePath: resolvedPath,
      autoConnect: true,
    });

    const trueForgeClient = new TrueForgeClient(model ? { defaultModel: model } : undefined);
    activeSession = trueForgeClient.createSession({
      sessionId: rawPin,
      workspacePath: resolvedPath,
      approvalManager: activeBridge.approvalManager,
    });

    saveActiveSession({
      pin: rawPin,
      sessionId: rawPin,
      relayUrl,
      model: activeSession.defaultModel,
      workspacePath: resolvedPath,
      createdAt: activeRecord?.createdAt || Date.now(),
      updatedAt: Date.now(),
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

    activeBridge.onPrompt((clientPrompt) => {
      void dispatchTurn(clientPrompt.prompt, "remote", clientPrompt.byokConfig);
    });

    activeBridge.onSync((sync) => {
      if (activeSession && activeBridge) {
        const missed = activeSession.ringBuffer.getEventsSince(sync.lastSeenSeq);
        activeBridge.sendStreamBatch({ sessionId: rawPin, events: missed });
      }
    });

    activeBridge.onSessionConnected((conn) => {
      chatProvider.addSystemMessage(
        `[Remote] Client paired (${conn.deviceName || "Remote"}). PIN: ${formatPin(rawPin)}`,
      );
    });

    activeBridge.onHostApprovalPrompt(async (request) => {
      const toolLabel = request.toolName;
      const details = request.commandOrDiff || request.description || "";

      const choice = await vscode.window.showWarningMessage(
        `Agent Remote — Tool Approval Required\n\nTool: ${toolLabel}\nDetails: ${details}`,
        { modal: true },
        "Approve",
        "Deny",
      );

      const approved = choice === "Approve";
      activeBridge?.approvalManager.resolveApproval(
        request.approvalId,
        approved,
        approved ? "Approved via VS Code host modal" : "Denied by developer",
      );
    });
  }

  // ── Startup ──────────────────────────────────────────────────────────────

  initializeBridge(currentPin);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(AgentChatViewProvider.viewType, chatProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "agentRemote.copyPIN";
  statusBarItem.text = `$(radio-tower) Remote: ${formatPin(currentPin)}`;
  statusBarItem.tooltip = `Agent Remote active (PIN: ${formatPin(currentPin)}). Click to copy pairing link.`;
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // ── Turn dispatcher ──────────────────────────────────────────────────────

  let isExecuting = false;

  async function dispatchTurn(
    promptText: string,
    origin: "local" | "remote",
    byokConfig?: import("@airlink/protocol").BYOKConfig,
  ): Promise<void> {
    if (!activeSession || !activeBridge) {
      initializeBridge(currentPin);
    }
    if (!activeSession || !activeBridge) return;

    if (isExecuting) {
      const msg = "Agent turn is already running. Please wait for it to finish.";
      void vscode.window.showWarningMessage(msg);
      chatProvider.addSystemMessage(`[WARN] ${msg}`);
      return;
    }

    isExecuting = true;
    try {
      if (origin === "local") {
        chatProvider.addLocalUserMessage(promptText);
      } else {
        chatProvider.addRemoteUserMessage(promptText);
      }

      for await (const chunk of activeSession.executeTurn({ prompt: promptText, byokConfig })) {
        chatProvider.handleStreamChunk(chunk);
        activeBridge.sendStream(chunk);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown execution failure";
      void vscode.window.showErrorMessage(`Agent Remote turn failed: ${msg}`);
      chatProvider.addSystemMessage(`[ERROR] Turn failed: ${msg}`);
    } finally {
      isExecuting = false;
    }
  }

  chatProvider.onPrompt((text) => {
    void dispatchTurn(text, "local");
  });

  chatProvider.onAction(async (action, arg) => {
    if (action === "diff") {
      const wp = requireWorkspace();
      if (!wp) return;
      chatProvider.addSystemMessage("Reading git diff...");
      const diff = await getGitDiff(wp);
      chatProvider.addSystemMessage(`Current Git Diff:\n\n${diff || "(no changes)"}`);
    } else if (action === "test") {
      const wp = requireWorkspace();
      if (!wp) return;
      chatProvider.addSystemMessage(`Running workspace tests${arg ? ` (filter: ${arg})` : ""}...`);
      const result = await runWorkspaceTests(wp, arg);
      chatProvider.addSystemMessage(
        `${result.success ? "[OK] Tests Passed" : "[ERROR] Tests Failed"} (${result.durationMs}ms):\n\n${result.output}`,
      );
    } else if (action === "lint") {
      const wp = requireWorkspace();
      if (!wp) return;
      chatProvider.addSystemMessage("Running workspace typecheck...");
      const result = await runWorkspaceLint(wp);
      chatProvider.addSystemMessage(
        `${result.success ? "[OK] Typecheck Passed" : "[ERROR] Typecheck Failed"} (${result.durationMs}ms):\n\n${result.output}`,
      );
    } else if (action === "stats") {
      if (activeSession) {
        const stats = activeSession.getStats();
        const wpDisplay = workspacePath ?? "(no workspace)";
        chatProvider.addSystemMessage(
          `Session Metrics:\n` +
            `- PIN:              ${formatPin(stats.sessionId)}\n` +
            `- Turns:            ${stats.turnCount}\n` +
            `- Buffered Events:  ${stats.bufferedEvents}\n` +
            `- Latest Sequence:  #${stats.latestSeq}\n` +
            `- Provider:         ${stats.provider}\n` +
            `- Model:            ${stats.activeModel}\n` +
            `- Workspace:        ${wpDisplay}\n` +
            `- Relay:            ${relayUrl}`,
        );
      }
    } else if (action === "setPin") {
      const input = await vscode.window.showInputBox({
        prompt: "Enter 6-digit PIN to host or pair with (e.g. 560-994)",
        value: formatPin(currentPin),
        validateInput: (v) => {
          const d = v.replace(/\D/g, "");
          return d.length === 6 ? null : "PIN must be exactly 6 digits";
        },
      });
      if (input) {
        const cleaned = input.replace(/\D/g, "");
        initializeBridge(cleaned);
        chatProvider.addSystemMessage(
          `[OK] Session PIN updated to ${formatPin(cleaned)}. Relay room active.`,
        );
        void vscode.window.showInformationMessage(`Agent Remote PIN set to ${formatPin(cleaned)}`);
      }
    } else if (action === "copyPin") {
      const pairUrl = `https://agent-remote.dev/pair?pin=${currentPin}`;
      await vscode.env.clipboard.writeText(pairUrl);
      chatProvider.addSystemMessage(`[OK] Copied pairing URL to clipboard:\n${pairUrl}`);
      void vscode.window.showInformationMessage(`Copied pairing URL: ${pairUrl}`);
    } else if (action === "clear") {
      if (activeSession) {
        activeSession.clearHistory();
        chatProvider.clearMessages();
        clearActiveSession(workspacePath ?? undefined);
        chatProvider.addSystemMessage("[OK] Conversation history and in-memory ring buffer reset.");
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

  context.subscriptions.push(
    vscode.commands.registerCommand("agentRemote.copyPIN", async () => {
      const pairUrl = `https://agent-remote.dev/pair?pin=${currentPin}`;
      await vscode.env.clipboard.writeText(pairUrl);
      void vscode.window.showInformationMessage(
        `[OK] Copied pairing URL: ${pairUrl} (PIN: ${formatPin(currentPin)})`,
      );
    }),

    vscode.commands.registerCommand("agentRemote.setPIN", async () => {
      const input = await vscode.window.showInputBox({
        prompt: "Enter 6-digit PIN to host or pair with (e.g. 560-994)",
        value: formatPin(currentPin),
        validateInput: (v) => {
          const d = v.replace(/\D/g, "");
          return d.length === 6 ? null : "PIN must be exactly 6 digits";
        },
      });
      if (input) {
        const cleaned = input.replace(/\D/g, "");
        initializeBridge(cleaned);
        void vscode.window.showInformationMessage(`Agent Remote PIN set to ${formatPin(cleaned)}`);
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

    vscode.commands.registerCommand("agentRemote.showDiff", async () => {
      const wp = requireWorkspace();
      if (!wp) return;
      chatProvider.addSystemMessage("Reading git diff...");
      const diff = await getGitDiff(wp);
      chatProvider.addSystemMessage(`Current Git Diff:\n\n${diff || "(no changes)"}`);
    }),

    vscode.commands.registerCommand("agentRemote.clearSession", () => {
      if (activeSession) {
        activeSession.clearHistory();
        chatProvider.clearMessages();
        clearActiveSession(workspacePath ?? undefined);
        chatProvider.addSystemMessage("[OK] Conversation history and in-memory ring buffer reset.");
      }
    }),

    // AI prompt commands (relay-only safe; workspace guard inside the agent turn if needed)
    vscode.commands.registerCommand("agentRemote.createPR", () => {
      void dispatchTurn(
        "Create a pull request with all session changes and test results.",
        "local",
      );
    }),

    vscode.commands.registerCommand("agentRemote.importIssue", async () => {
      const issueNum = await vscode.window.showInputBox({
        prompt: "Enter GitHub Issue Number to load context (e.g. 42)",
        placeHolder: "42",
        validateInput: (v) => (/^\d+$/.test(v.trim()) ? null : "Enter a numeric issue number"),
      });
      if (issueNum) {
        const cleaned = issueNum.replace(/\D/g, "");
        if (cleaned) {
          void dispatchTurn(`Fix GitHub Issue #${cleaned} and verify tests pass.`, "local");
        }
      }
    }),
  );
}

// ── Deactivation ─────────────────────────────────────────────────────────────

/**
 * Deactivates the extension and releases all socket resources.
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
