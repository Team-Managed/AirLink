import * as os from "node:os";
import type { AgentStream, ApprovalRequest, SessionConnected } from "@agent-remote/protocol";
import { TrueForgeClient, type TrueForgeSession } from "./trueforge-client.js";
import { SocketBridge } from "./socket-bridge.js";
import { saveActiveSession, loadActiveSession, clearActiveSession } from "./session-persistence.js";
import {
  getGitDiff,
  runWorkspaceTests,
  runWorkspaceLint,
  fetchGitHubIssue,
  type ToolExecutionResult,
} from "./workspace-tools.js";

export interface HostControllerOptions {
  relayUrl?: string | undefined;
  pin?: string | undefined;
  workspacePath?: string | undefined;
  model?: string | undefined;
  hostName?: string | undefined;
  autoConnect?: boolean | undefined;
}

export interface HostSessionInfo {
  pin: string;
  formattedPin: string;
  sessionId: string;
  relayUrl: string;
  model: string;
  provider: string;
  workspacePath: string;
}

export function formatPin(pin: string): string {
  const cleaned = pin.replace(/\D/g, "");
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return pin;
}

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * AgentHostController
 *
 * Centralized, presentation-independent controller orchestrating:
 * - TrueForgeSession lifecycle & LLM turn execution
 * - SocketBridge connection, room registration & message routing
 * - RingBuffer event synchronization
 * - PIN management & cross-host session persistence
 * - Dual-surface approval handling
 * - Workspace tool invocations (diff, tests, lint)
 */
export class AgentHostController {
  private _relayUrl: string;
  private _pin: string;
  private _workspacePath: string;
  private _model: string;
  private _hostName: string;
  private _autoConnect: boolean;

  private _client: TrueForgeClient | null = null;
  private _session: TrueForgeSession | null = null;
  private _bridge: SocketBridge | null = null;
  private _isExecuting: boolean = false;

  // Event listeners
  private _streamListeners: Array<(chunk: AgentStream) => void> = [];
  private _userMessageListeners: Array<
    (msg: { text: string; origin: "local" | "remote" }) => void
  > = [];
  private _systemMessageListeners: Array<(msg: string) => void> = [];
  private _sessionUpdateListeners: Array<(info: HostSessionInfo) => void> = [];
  private _approvalPromptListeners: Array<(req: ApprovalRequest) => void> = [];
  private _approvalResolvedListeners: Array<(approvalId: string, approved: boolean) => void> = [];
  private _peerConnectedListeners: Array<(conn: SessionConnected) => void> = [];
  private _errorListeners: Array<(err: Error) => void> = [];

  constructor(options: HostControllerOptions = {}) {
    this._workspacePath = options.workspacePath || "";
    this._relayUrl = options.relayUrl || process.env["RELAY_URL"] || "http://localhost:3001";
    this._model = options.model || process.env["AGENT_MODEL"] || "gemini-2.0-flash";
    this._hostName = options.hostName || os.hostname();
    this._autoConnect = options.autoConnect ?? true;

    // Resolve PIN from options -> active session file -> newly generated
    if (options.pin && options.pin.replace(/\D/g, "").length === 6) {
      this._pin = options.pin.replace(/\D/g, "");
    } else {
      const existing = loadActiveSession(this._workspacePath);
      if (existing && existing.pin && existing.pin.length === 6) {
        this._pin = existing.pin;
      } else {
        this._pin = generatePin();
      }
    }
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get pin(): string {
    return this._pin;
  }

  get formattedPin(): string {
    return formatPin(this._pin);
  }

  get sessionId(): string {
    return this._pin;
  }

  get relayUrl(): string {
    return this._relayUrl;
  }

  get workspacePath(): string {
    return this._workspacePath;
  }

  get isExecuting(): boolean {
    return this._isExecuting;
  }

  get session(): TrueForgeSession | null {
    return this._session;
  }

  get bridge(): SocketBridge | null {
    return this._bridge;
  }

  get isConnected(): boolean {
    return this._bridge?.isConnected() ?? false;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Initializes or re-initializes the session and socket bridge with the specified or current PIN.
   */
  public start(newPin?: string): HostSessionInfo {
    if (newPin) {
      this._pin = newPin.replace(/\D/g, "");
    }

    if (this._bridge) {
      this._bridge.disconnect();
      this._bridge = null;
    }

    this._client = new TrueForgeClient({ defaultModel: this._model });
    this._session = this._client.createSession({
      sessionId: this._pin,
      workspacePath: this._workspacePath,
    });

    this._bridge = new SocketBridge({
      relayUrl: this._relayUrl,
      pin: this._pin,
      hostName: this._hostName,
      workspacePath: this._workspacePath,
      autoConnect: this._autoConnect,
    });

    // Persist active session for cross-host discovery (CLI, VS Code, Mobile)
    saveActiveSession({
      pin: this._pin,
      sessionId: this._pin,
      relayUrl: this._relayUrl,
      model: this._session.defaultModel,
      workspacePath: this._workspacePath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Wire bridge listeners
    this._bridge.onPrompt((clientPrompt) => {
      void this.dispatchTurn(clientPrompt.prompt, "remote");
    });

    this._bridge.onSync((sync) => {
      if (this._session && this._bridge) {
        const missedEvents = this._session.ringBuffer.getEventsSince(sync.lastSeenSeq);
        this._bridge.sendStreamBatch({
          sessionId: this._pin,
          events: missedEvents,
        });
      }
    });

    this._bridge.onSessionConnected((conn) => {
      for (const listener of this._peerConnectedListeners) {
        listener(conn);
      }
    });

    this._bridge.onHostApprovalPrompt((req) => {
      for (const listener of this._approvalPromptListeners) {
        listener(req);
      }
    });

    const info = this.getSessionInfo();
    for (const listener of this._sessionUpdateListeners) {
      listener(info);
    }
    return info;
  }

  /**
   * Stops the active socket bridge and releases resources.
   */
  public stop(): void {
    if (this._bridge) {
      this._bridge.disconnect();
      this._bridge = null;
    }
    this._session = null;
  }

  /**
   * Updates the active PIN, persists it, and reinitializes the bridge.
   */
  public setPin(pin: string): HostSessionInfo {
    return this.start(pin);
  }

  /**
   * Switches the active LLM engine model.
   */
  public setModel(model: string): void {
    this._model = model;
    if (this._session) {
      this._session.setModel(model);
      const info = this.getSessionInfo();
      for (const listener of this._sessionUpdateListeners) {
        listener(info);
      }
    }
  }

  /**
   * Clears in-memory conversation history and session persistence.
   */
  public clearSession(): void {
    if (this._session) {
      this._session.clearHistory();
    }
    clearActiveSession(this._workspacePath);
    for (const listener of this._systemMessageListeners) {
      listener("✔ Conversation history and in-memory ring buffer reset.");
    }
  }

  /**
   * Returns current active session metadata.
   */
  public getSessionInfo(): HostSessionInfo {
    return {
      pin: this._pin,
      formattedPin: this.formattedPin,
      sessionId: this._pin,
      relayUrl: this._relayUrl,
      model: this._session?.defaultModel || this._model,
      provider: this._session?.providerConfig.provider || "Free Tier",
      workspacePath: this._workspacePath,
    };
  }

  // ── Turn Dispatcher ────────────────────────────────────────────────────────

  /**
   * Dispatches an agent turn, streaming chunks across listeners and socket bridge.
   */
  public async dispatchTurn(promptText: string, origin: "local" | "remote"): Promise<void> {
    if (!this._session || !this._bridge) {
      this.start();
    }

    if (this._isExecuting) {
      const warnMsg = "⚠️ Agent turn is already running. Please wait...";
      for (const listener of this._systemMessageListeners) {
        listener(warnMsg);
      }
      return;
    }

    this._isExecuting = true;

    // Notify user message listeners
    for (const listener of this._userMessageListeners) {
      listener({ text: promptText, origin });
    }

    try {
      if (!this._session || !this._bridge) return;

      for await (const chunk of this._session.executeTurn({ prompt: promptText })) {
        // Forward to socket bridge for mobile/web remotes
        this._bridge.sendStream(chunk);

        // Forward to local UI presentation listeners
        for (const listener of this._streamListeners) {
          listener(chunk);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      for (const listener of this._errorListeners) {
        listener(error);
      }
      for (const listener of this._systemMessageListeners) {
        listener(`❌ Turn execution error: ${error.message}`);
      }
    } finally {
      this._isExecuting = false;
    }
  }

  // ── Approvals ──────────────────────────────────────────────────────────────

  /**
   * Resolves a pending tool approval from UI presentation.
   */
  public resolveApproval(approvalId: string, approved: boolean, reason?: string): void {
    if (this._bridge) {
      this._bridge.approvalManager.resolveApproval(
        approvalId,
        approved,
        reason || (approved ? "Approved by developer" : "Denied by developer"),
      );
    }
    for (const listener of this._approvalResolvedListeners) {
      listener(approvalId, approved);
    }
  }

  // ── Workspace Operations ───────────────────────────────────────────────────

  public async getGitDiff(): Promise<string> {
    return await getGitDiff(this._workspacePath);
  }

  public async runTests(filter?: string): Promise<ToolExecutionResult> {
    return await runWorkspaceTests(this._workspacePath, filter);
  }

  public async runLint(): Promise<ToolExecutionResult> {
    return await runWorkspaceLint(this._workspacePath);
  }

  public async fetchIssue(issueNumber: number) {
    return await fetchGitHubIssue(issueNumber, this._workspacePath);
  }

  public getStats() {
    if (this._session) {
      return this._session.getStats();
    }
    return {
      sessionId: this._pin,
      turnCount: 0,
      bufferedEvents: 0,
      latestSeq: 0,
      provider: "simulated",
      activeModel: this._model,
      workspacePath: this._workspacePath,
    };
  }

  // ── Event Subscription API ─────────────────────────────────────────────────

  public onStreamChunk(listener: (chunk: AgentStream) => void): () => void {
    this._streamListeners.push(listener);
    return () => {
      this._streamListeners = this._streamListeners.filter((l) => l !== listener);
    };
  }

  public onUserMessage(
    listener: (msg: { text: string; origin: "local" | "remote" }) => void,
  ): () => void {
    this._userMessageListeners.push(listener);
    return () => {
      this._userMessageListeners = this._userMessageListeners.filter((l) => l !== listener);
    };
  }

  public onSystemMessage(listener: (msg: string) => void): () => void {
    this._systemMessageListeners.push(listener);
    return () => {
      this._systemMessageListeners = this._systemMessageListeners.filter((l) => l !== listener);
    };
  }

  public onSessionUpdate(listener: (info: HostSessionInfo) => void): () => void {
    this._sessionUpdateListeners.push(listener);
    return () => {
      this._sessionUpdateListeners = this._sessionUpdateListeners.filter((l) => l !== listener);
    };
  }

  public onApprovalPrompt(listener: (req: ApprovalRequest) => void): () => void {
    this._approvalPromptListeners.push(listener);
    return () => {
      this._approvalPromptListeners = this._approvalPromptListeners.filter((l) => l !== listener);
    };
  }

  public onApprovalResolved(listener: (approvalId: string, approved: boolean) => void): () => void {
    this._approvalResolvedListeners.push(listener);
    return () => {
      this._approvalResolvedListeners = this._approvalResolvedListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  public onPeerConnected(listener: (conn: SessionConnected) => void): () => void {
    this._peerConnectedListeners.push(listener);
    return () => {
      this._peerConnectedListeners = this._peerConnectedListeners.filter((l) => l !== listener);
    };
  }

  public onError(listener: (err: Error) => void): () => void {
    this._errorListeners.push(listener);
    return () => {
      this._errorListeners = this._errorListeners.filter((l) => l !== listener);
    };
  }
}
