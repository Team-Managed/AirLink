import { io, Socket } from "socket.io-client";
import {
  SOCKET_EVENTS,
  RegisterHost,
  RegisterHostSchema,
  SessionConnected,
  SessionConnectedSchema,
  ClientPrompt,
  ClientPromptSchema,
  AgentStream,
  AgentStreamSchema,
  ApprovalRequest,
  ApprovalRequestSchema,
  ApprovalResponseSchema,
  ClientSync,
  ClientSyncSchema,
  StreamBatch,
  StreamBatchSchema,
  StandardError,
  StandardErrorSchema,
} from "@agent-remote/protocol";
import { ApprovalManager } from "./approval-handler.js";

export interface SocketBridgeOptions {
  relayUrl: string;
  pin: string;
  hostName: string;
  workspacePath: string;
  approvalManager?: ApprovalManager | undefined;
  autoConnect?: boolean | undefined;
  reconnectionAttempts?: number | undefined;
  reconnectionDelay?: number | undefined;
}

export type PromptHandler = (prompt: ClientPrompt) => void;
export type SyncHandler = (sync: ClientSync) => void;
export type SessionConnectedHandler = (session: SessionConnected) => void;
export type HostApprovalPromptHandler = (request: ApprovalRequest) => void;
export type ErrorHandler = (error: StandardError) => void;
export type DisconnectHandler = (reason: string) => void;

/**
 * SocketBridge
 * Manages the outbound WebSocket connection from the developer's PC to the Cloud Relay server.
 * Coordinates dual-surface approvals, live stream forwarding, and reconnection catch-up.
 */
export class SocketBridge {
  private readonly _relayUrl: string;
  private readonly _pin: string;
  private readonly _hostName: string;
  private readonly _workspacePath: string;
  private readonly _approvalManager: ApprovalManager;
  private readonly _reconnectionAttempts: number;
  private readonly _reconnectionDelay: number;
  private _socket: Socket | null = null;
  private _approvalUnsubscribe: (() => void) | null = null;

  private readonly _promptHandlers = new Set<PromptHandler>();
  private readonly _syncHandlers = new Set<SyncHandler>();
  private readonly _sessionConnectedHandlers = new Set<SessionConnectedHandler>();
  private readonly _hostApprovalHandlers = new Set<HostApprovalPromptHandler>();
  private readonly _errorHandlers = new Set<ErrorHandler>();
  private readonly _disconnectHandlers = new Set<DisconnectHandler>();

  constructor(options: SocketBridgeOptions) {
    this._relayUrl = options.relayUrl;
    this._pin = options.pin;
    this._hostName = options.hostName;
    this._workspacePath = options.workspacePath;
    this._approvalManager = options.approvalManager ?? new ApprovalManager();
    this._reconnectionAttempts = options.reconnectionAttempts ?? Infinity;
    this._reconnectionDelay = options.reconnectionDelay ?? 1000;

    this._setupApprovalHook();

    if (options.autoConnect !== false) {
      this.connect();
    }
  }

  get relayUrl(): string {
    return this._relayUrl;
  }

  get pin(): string {
    return this._pin;
  }

  get hostName(): string {
    return this._hostName;
  }

  get workspacePath(): string {
    return this._workspacePath;
  }

  get approvalManager(): ApprovalManager {
    return this._approvalManager;
  }

  get reconnectionAttempts(): number {
    return this._reconnectionAttempts;
  }

  get reconnectionDelay(): number {
    return this._reconnectionDelay;
  }

  get socket(): Socket | null {
    return this._socket;
  }

  /**
   * Checks if the WebSocket connection is actively open and connected.
   */
  isConnected(): boolean {
    return this._socket !== null && this._socket.connected;
  }

  private _setupApprovalHook(): void {
    if (this._approvalUnsubscribe) {
      this._approvalUnsubscribe();
    }

    this._approvalUnsubscribe = this._approvalManager.onApprovalRequested((req) => {
      this.sendApprovalRequest(req);
      for (const handler of this._hostApprovalHandlers) {
        try {
          handler(req);
        } catch {
          // Safe handler dispatch
        }
      }
    });
  }

  /**
   * Initializes and connects the Socket.io client to the Relay server.
   */
  connect(): Socket {
    this._setupApprovalHook();

    if (this._socket && this._socket.connected) {
      return this._socket;
    }

    if (this._socket) {
      this._socket.connect();
      return this._socket;
    }

    this._socket = io(this._relayUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this._reconnectionAttempts,
      reconnectionDelay: this._reconnectionDelay,
    });

    this._setupSocketListeners();
    return this._socket;
  }

  /**
   * Disconnects the socket and cleans up handlers and listeners.
   */
  disconnect(): void {
    if (this._approvalUnsubscribe) {
      this._approvalUnsubscribe();
      this._approvalUnsubscribe = null;
    }

    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }

  /**
   * Alias for disconnect to allow explicit resource disposal.
   */
  dispose(): void {
    this.disconnect();
  }

  private _setupSocketListeners(): void {
    if (!this._socket) return;

    this._socket.on("connect", () => {
      this._registerHost();
    });

    this._socket.on(SOCKET_EVENTS.SESSION_CONNECTED, (data: unknown) => {
      const parsed = SessionConnectedSchema.safeParse(data);
      if (parsed.success) {
        for (const handler of this._sessionConnectedHandlers) {
          try {
            handler(parsed.data);
          } catch {
            // Safe handler dispatch
          }
        }
      }
    });

    this._socket.on(SOCKET_EVENTS.CLIENT_PROMPT, (data: unknown) => {
      const parsed = ClientPromptSchema.safeParse(data);
      if (parsed.success) {
        for (const handler of this._promptHandlers) {
          try {
            handler(parsed.data);
          } catch {
            // Safe handler dispatch
          }
        }
      }
    });

    this._socket.on(SOCKET_EVENTS.APPROVAL_RESPONSE, (data: unknown) => {
      const parsed = ApprovalResponseSchema.safeParse(data);
      if (parsed.success) {
        this._approvalManager.resolveApproval(
          parsed.data.approvalId,
          parsed.data.approved,
          parsed.data.reason,
        );
      }
    });

    this._socket.on(SOCKET_EVENTS.CLIENT_SYNC, (data: unknown) => {
      const parsed = ClientSyncSchema.safeParse(data);
      if (parsed.success) {
        for (const handler of this._syncHandlers) {
          try {
            handler(parsed.data);
          } catch {
            // Safe handler dispatch
          }
        }
      }
    });

    this._socket.on(SOCKET_EVENTS.ERROR, (data: unknown) => {
      const parsed = StandardErrorSchema.safeParse(data);
      if (parsed.success) {
        for (const handler of this._errorHandlers) {
          try {
            handler(parsed.data);
          } catch {
            // Safe handler dispatch
          }
        }
      }
    });

    this._socket.on("disconnect", (reason: string) => {
      for (const handler of this._disconnectHandlers) {
        try {
          handler(reason);
        } catch {
          // Safe handler dispatch
        }
      }
    });
  }

  private _registerHost(): void {
    if (!this._socket || !this._socket.connected) return;

    const payload: RegisterHost = {
      pin: this._pin,
      hostName: this._hostName,
      workspacePath: this._workspacePath,
    };

    const validated = RegisterHostSchema.parse(payload);
    this._socket.emit(SOCKET_EVENTS.REGISTER_HOST, validated);

    // Replay active pending approvals upon reconnect so mobile client receives in-flight requests
    for (const pending of this._approvalManager.getAllPending()) {
      this.sendApprovalRequest(pending.request);
    }
  }

  /**
   * Emits an AgentStream token/thought chunk to the connected mobile/web client.
   */
  sendStream(stream: AgentStream): void {
    if (!this._socket || !this._socket.connected) return;
    const validated = AgentStreamSchema.parse(stream);
    this._socket.emit(SOCKET_EVENTS.AGENT_STREAM, validated);
  }

  /**
   * Emits an approval request to the connected mobile/web client.
   */
  sendApprovalRequest(request: ApprovalRequest): void {
    if (!this._socket || !this._socket.connected) return;
    const validated = ApprovalRequestSchema.parse(request);
    this._socket.emit(SOCKET_EVENTS.APPROVAL_REQUIRED, validated);
  }

  /**
   * Emits a batch of stream events to catch up a reconnecting client.
   */
  sendStreamBatch(batch: StreamBatch): void {
    if (!this._socket || !this._socket.connected) return;
    const validated = StreamBatchSchema.parse(batch);
    this._socket.emit(SOCKET_EVENTS.STREAM_BATCH, validated);
  }

  /**
   * Registers a callback invoked when a remote user submits a prompt from mobile or web.
   */
  onPrompt(handler: PromptHandler): () => void {
    this._promptHandlers.add(handler);
    return () => {
      this._promptHandlers.delete(handler);
    };
  }

  /**
   * Registers a callback invoked when a reconnecting client requests missed events.
   */
  onSync(handler: SyncHandler): () => void {
    this._syncHandlers.add(handler);
    return () => {
      this._syncHandlers.delete(handler);
    };
  }

  /**
   * Registers a callback invoked when a pairing session is established.
   */
  onSessionConnected(handler: SessionConnectedHandler): () => void {
    this._sessionConnectedHandlers.add(handler);
    return () => {
      this._sessionConnectedHandlers.delete(handler);
    };
  }

  /**
   * Registers a dual-surface approval hook enabling CLI or VS Code to display simultaneous local approval prompts.
   */
  onHostApprovalPrompt(handler: HostApprovalPromptHandler): () => void {
    this._hostApprovalHandlers.add(handler);
    return () => {
      this._hostApprovalHandlers.delete(handler);
    };
  }

  /**
   * Registers an error event listener.
   */
  onError(handler: ErrorHandler): () => void {
    this._errorHandlers.add(handler);
    return () => {
      this._errorHandlers.delete(handler);
    };
  }

  /**
   * Registers a disconnect event listener.
   */
  onDisconnect(handler: DisconnectHandler): () => void {
    this._disconnectHandlers.add(handler);
    return () => {
      this._disconnectHandlers.delete(handler);
    };
  }
}
