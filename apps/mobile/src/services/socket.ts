import { io, Socket } from "socket.io-client";
import {
  parseSocketEvent,
  SOCKET_EVENTS,
  type AgentStream,
  type ApprovalRequest,
  type ApprovalResponse,
  type BYOKConfig,
  type ClientPrompt,
  type ClientSync,
  type JoinSession,
  type SessionConnected,
  type StandardError,
  type StreamBatch,
} from "@agent-remote/protocol";

export type SocketEventHandler<T> = (payload: T) => void;

export interface MobileSocketCallbacks {
  onSessionConnected?: SocketEventHandler<SessionConnected>;
  onAgentStream?: SocketEventHandler<AgentStream>;
  onApprovalRequired?: SocketEventHandler<ApprovalRequest>;
  onStreamBatch?: SocketEventHandler<StreamBatch>;
  onError?: SocketEventHandler<StandardError>;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
}

export class MobileSocketService {
  private static instance: MobileSocketService | null = null;
  private socket: Socket | null = null;
  private currentPin: string | null = null;
  private lastSeenSeq: number = 0;
  private listeners: Set<MobileSocketCallbacks> = new Set();
  private baseCallbacks: MobileSocketCallbacks = {};
  private activeSessionId: string | null = null;
  private isReconnecting: boolean = false;

  private constructor() {}

  public static getInstance(): MobileSocketService {
    if (!MobileSocketService.instance) {
      MobileSocketService.instance = new MobileSocketService();
    }
    return MobileSocketService.instance;
  }

  /**
   * Sets base callbacks (legacy support).
   */
  public setCallbacks(callbacks: MobileSocketCallbacks): void {
    this.baseCallbacks = { ...this.baseCallbacks, ...callbacks };
  }

  /**
   * Subscribes a listener set and returns an unsubscribe function.
   */
  public subscribe(callbacks: MobileSocketCallbacks): () => void {
    this.listeners.add(callbacks);
    return () => {
      this.listeners.delete(callbacks);
    };
  }

  private notify<K extends keyof MobileSocketCallbacks>(
    event: K,
    ...args: Parameters<NonNullable<MobileSocketCallbacks[K]>>
  ): void {
    // Notify base callbacks
    const baseFn = this.baseCallbacks[event];
    if (typeof baseFn === "function") {
      (baseFn as (...a: unknown[]) => void)(...args);
    }

    // Notify subscribed listeners
    for (const listener of this.listeners) {
      const fn = listener[event];
      if (typeof fn === "function") {
        (fn as (...a: unknown[]) => void)(...args);
      }
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  public getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  public getLastSeenSeq(): number {
    return this.lastSeenSeq;
  }

  public resetSequence(): void {
    this.lastSeenSeq = 0;
  }

  /**
   * Connects to the Relay server via Socket.io.
   */
  public connect(relayUrl: string = "http://localhost:3001"): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.isReconnecting = false;

    this.socket = io(relayUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.notify("onConnect");

      // On transport reconnect, always rejoin the saved PIN first to re-establish room pairing on relay
      if (this.isReconnecting && this.currentPin) {
        this.emitJoin(this.currentPin);
      }
      this.isReconnecting = false;
    });

    this.socket.on("disconnect", (reason: string) => {
      this.isReconnecting = true;
      this.notify("onDisconnect", reason);
    });

    this.socket.on("connect_error", (error: Error) => {
      this.notify("onConnectError", error);
    });

    this.socket.on(SOCKET_EVENTS.SESSION_CONNECTED, (raw: unknown) => {
      try {
        const payload = parseSocketEvent(SOCKET_EVENTS.SESSION_CONNECTED, raw);
        if (payload.status === "connected") {
          this.activeSessionId = payload.sessionId;
          // Hydrate stream events from host (works for both fresh attach seq=0 and reconnect seq>0)
          this.sync(this.lastSeenSeq);
        }
        this.notify("onSessionConnected", payload);
      } catch (err) {
        this.handleContractError("session:connected", err);
      }
    });

    this.socket.on(SOCKET_EVENTS.AGENT_STREAM, (raw: unknown) => {
      try {
        const payload = parseSocketEvent(SOCKET_EVENTS.AGENT_STREAM, raw);
        if (payload.seqId > this.lastSeenSeq) {
          this.lastSeenSeq = payload.seqId;
        }
        this.notify("onAgentStream", payload);
      } catch (err) {
        this.handleContractError("agent:stream", err);
      }
    });

    this.socket.on(SOCKET_EVENTS.APPROVAL_REQUIRED, (raw: unknown) => {
      try {
        const payload = parseSocketEvent(SOCKET_EVENTS.APPROVAL_REQUIRED, raw);
        if (payload.seqId > this.lastSeenSeq) {
          this.lastSeenSeq = payload.seqId;
        }
        this.notify("onApprovalRequired", payload);
      } catch (err) {
        this.handleContractError("agent:approval_required", err);
      }
    });

    this.socket.on(SOCKET_EVENTS.STREAM_BATCH, (raw: unknown) => {
      try {
        const payload = parseSocketEvent(SOCKET_EVENTS.STREAM_BATCH, raw);
        for (const event of payload.events) {
          if (event.seqId > this.lastSeenSeq) {
            this.lastSeenSeq = event.seqId;
          }
        }
        this.notify("onStreamBatch", payload);
      } catch (err) {
        this.handleContractError("agent:stream_batch", err);
      }
    });

    this.socket.on(SOCKET_EVENTS.ERROR, (raw: unknown) => {
      try {
        const payload = parseSocketEvent(SOCKET_EVENTS.ERROR, raw);
        this.notify("onError", payload);
      } catch (err) {
        this.handleContractError("session:error", err);
      }
    });
  }

  private handleContractError(event: string, err: unknown): void {
    const errorMsg = err instanceof Error ? err.message : String(err);
    this.notify("onError", {
      code: "INVALID_CONTRACT_PAYLOAD",
      message: `Failed to validate event '${event}': ${errorMsg}`,
    });
  }

  private emitJoin(pin: string, clientName: string = "Mobile App"): void {
    if (!this.socket) return;
    const payload: JoinSession = {
      pin,
      clientName,
    };
    this.socket.emit(SOCKET_EVENTS.JOIN_SESSION, payload);
  }

  /**
   * Joins a pairing session with the 6-digit PIN.
   */
  public join(pin: string, clientName: string = "Mobile App"): void {
    if (!this.socket) {
      throw new Error("Socket is not initialized. Call connect() first.");
    }
    this.currentPin = pin;
    this.emitJoin(pin, clientName);
  }

  /**
   * Sends a user prompt from mobile to workstation.
   */
  public sendPrompt(prompt: string, byokConfig?: BYOKConfig): void {
    if (!this.socket || !this.activeSessionId) {
      throw new Error("Cannot send prompt: socket not connected or active session missing.");
    }
    const payload: ClientPrompt = {
      sessionId: this.activeSessionId,
      prompt,
      turnId: `turn_${Date.now()}`,
      ...(byokConfig ? { byokConfig } : {}),
    };
    this.socket.emit(SOCKET_EVENTS.CLIENT_PROMPT, payload);
  }

  /**
   * Sends an approval response from mobile to workstation.
   */
  public sendApproval(approvalId: string, approved: boolean, reason?: string): void {
    if (!this.socket || !this.activeSessionId) {
      throw new Error("Cannot send approval: socket not connected or active session missing.");
    }
    const payload: ApprovalResponse = {
      approvalId,
      sessionId: this.activeSessionId,
      approved,
      ...(reason ? { reason } : {}),
      resolvedAt: Date.now(),
    };
    this.socket.emit(SOCKET_EVENTS.APPROVAL_RESPONSE, payload);
  }

  /**
   * Emits client:sync upon reconnection to retrieve missed sequence events from ring buffer.
   */
  public sync(lastSeenSeq: number): void {
    if (!this.socket || !this.activeSessionId) return;
    const payload: ClientSync = {
      sessionId: this.activeSessionId,
      lastSeenSeq,
    };
    this.socket.emit(SOCKET_EVENTS.CLIENT_SYNC, payload);
  }

  /**
   * Disconnects and resets socket state.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentPin = null;
    this.activeSessionId = null;
    this.lastSeenSeq = 0;
    this.isReconnecting = false;
  }
}

export const mobileSocketService = MobileSocketService.getInstance();
