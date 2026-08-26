import {
  ApprovalRequest,
  ApprovalResponse,
  ApprovalRequestSchema,
  RiskLevel,
  APPROVAL_TIMEOUT_MS,
} from "@agent-remote/protocol";

export interface PendingApproval {
  request: ApprovalRequest;
  timer: NodeJS.Timeout;
  resolve: (approved: boolean) => void;
  createdAt: number;
  timeoutMs: number;
}

export interface RequestApprovalParams {
  seqId: number;
  sessionId: string;
  turnId: string;
  toolName: string;
  commandOrDiff: string;
  riskLevel: RiskLevel;
  description?: string | undefined;
  timeoutMs?: number | undefined;
  approvalId?: string | undefined;
}

export type ApprovalRequestListener = (request: ApprovalRequest) => void;
export type ApprovalResponseListener = (response: ApprovalResponse) => void;

/**
 * ApprovalManager
 * State machine managing in-flight human approval requests, 180-second auto-deny timeouts,
 * and dual-surface notification coordination across mobile drawers and local PC host prompts.
 */
export class ApprovalManager {
  private readonly _activeApprovals = new Map<string, PendingApproval>();
  private readonly _requestListeners = new Set<ApprovalRequestListener>();
  private readonly _responseListeners = new Set<ApprovalResponseListener>();

  /**
   * Returns the count of currently pending approval requests.
   */
  getPendingCount(): number {
    return this._activeApprovals.size;
  }

  /**
   * Returns the pending approval descriptor by its unique ID.
   */
  getPending(approvalId: string): PendingApproval | undefined {
    return this._activeApprovals.get(approvalId);
  }

  /**
   * Returns an array of all currently active pending approvals.
   */
  getAllPending(): PendingApproval[] {
    return Array.from(this._activeApprovals.values());
  }

  /**
   * Checks if an approval request is currently active.
   */
  hasPending(approvalId: string): boolean {
    return this._activeApprovals.has(approvalId);
  }

  /**
   * Registers a listener callback invoked whenever a new approval is requested.
   * Returns an unsubscribe cleanup function.
   */
  onApprovalRequested(listener: ApprovalRequestListener): () => void {
    this._requestListeners.add(listener);
    return () => {
      this._requestListeners.delete(listener);
    };
  }

  /**
   * Registers a listener callback invoked whenever an approval is resolved or timed out.
   * Returns an unsubscribe cleanup function.
   */
  onApprovalResolved(listener: ApprovalResponseListener): () => void {
    this._responseListeners.add(listener);
    return () => {
      this._responseListeners.delete(listener);
    };
  }

  /**
   * Requests human approval for a potentially dangerous tool action.
   * Pauses turn execution until resolved or automatically denied after timeoutMs (default 180s).
   */
  requestApproval(params: RequestApprovalParams): Promise<boolean> {
    const approvalId =
      params.approvalId ||
      `appr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    if (this._activeApprovals.has(approvalId)) {
      throw new Error(`Duplicate approvalId "${approvalId}" is already active and pending.`);
    }

    const timeoutMs = Math.min(
      params.timeoutMs ?? APPROVAL_TIMEOUT_MS,
      APPROVAL_TIMEOUT_MS,
    );

    const rawPayload: ApprovalRequest = {
      seqId: params.seqId,
      approvalId,
      sessionId: params.sessionId,
      turnId: params.turnId,
      toolName: params.toolName,
      commandOrDiff: params.commandOrDiff,
      riskLevel: params.riskLevel,
      ...(params.description !== undefined ? { description: params.description } : {}),
      timeoutMs,
      createdAt: Date.now(),
    };

    const validatedRequest = ApprovalRequestSchema.parse(rawPayload);

    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        this._handleTimeout(approvalId);
      }, timeoutMs);

      const pending: PendingApproval = {
        request: validatedRequest,
        timer,
        resolve,
        createdAt: validatedRequest.createdAt,
        timeoutMs,
      };

      this._activeApprovals.set(approvalId, pending);

      // Emit to all registered listeners (e.g. SocketBridge and local CLI/IDE prompts)
      for (const listener of this._requestListeners) {
        try {
          listener(validatedRequest);
        } catch {
          // Listener error must not crash the engine
        }
      }
    });
  }

  private _handleTimeout(approvalId: string): void {
    const pending = this._activeApprovals.get(approvalId);
    if (!pending) return;

    this._activeApprovals.delete(approvalId);
    clearTimeout(pending.timer);

    const response: ApprovalResponse = {
      approvalId,
      sessionId: pending.request.sessionId,
      approved: false,
      reason: "Timed out",
      resolvedAt: Date.now(),
    };

    // Auto-deny on timeout
    pending.resolve(false);

    for (const listener of this._responseListeners) {
      try {
        listener(response);
      } catch {
        // Safe listener dispatch
      }
    }
  }

  /**
   * Resolves a pending approval with a human decision.
   * Clears the timeout timer and resolves the blocked Promise.
   * Returns true if successfully resolved, or false if already expired / non-existent.
   */
  resolveApproval(approvalId: string, approved: boolean, reason?: string): boolean {
    const pending = this._activeApprovals.get(approvalId);
    if (!pending) {
      return false;
    }

    clearTimeout(pending.timer);
    this._activeApprovals.delete(approvalId);

    const response: ApprovalResponse = {
      approvalId,
      sessionId: pending.request.sessionId,
      approved,
      ...(reason !== undefined ? { reason } : {}),
      resolvedAt: Date.now(),
    };

    pending.resolve(approved);

    for (const listener of this._responseListeners) {
      try {
        listener(response);
      } catch {
        // Safe listener dispatch
      }
    }

    return true;
  }

  /**
   * Cancels all currently in-flight pending approvals, auto-denying them.
   * Used during turn preemption or daemon shutdown.
   */
  cancelAll(reason: string = "Cancelled"): void {
    const active = Array.from(this._activeApprovals.entries());
    for (const [approvalId, pending] of active) {
      clearTimeout(pending.timer);
      this._activeApprovals.delete(approvalId);

      const response: ApprovalResponse = {
        approvalId,
        sessionId: pending.request.sessionId,
        approved: false,
        reason,
        resolvedAt: Date.now(),
      };

      pending.resolve(false);

      for (const listener of this._responseListeners) {
        try {
          listener(response);
        } catch {
          // Safe listener dispatch
        }
      }
    }
  }
}
