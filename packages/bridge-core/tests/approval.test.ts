import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApprovalManager } from "../src/approval-handler.js";
import { APPROVAL_TIMEOUT_MS, ApprovalRequest, ApprovalResponse } from "@agent-remote/protocol";

describe("ApprovalManager", () => {
  let manager: ApprovalManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new ApprovalManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("registers an active approval and returns a pending Promise", async () => {
    const promise = manager.requestApproval({
      seqId: 1,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "execute_bash",
      commandOrDiff: "rm -rf dist",
      riskLevel: "high",
      description: "Delete dist folder",
    });

    expect(manager.getPendingCount()).toBe(1);

    const pending = Array.from(manager["_activeApprovals"].values())[0];
    expect(pending).toBeDefined();
    expect(pending?.request.toolName).toBe("execute_bash");
    expect(pending?.request.riskLevel).toBe("high");
    expect(manager.hasPending(pending!.request.approvalId)).toBe(true);

    // Resolve to prevent open timer
    manager.resolveApproval(pending!.request.approvalId, true);
    const result = await promise;
    expect(result).toBe(true);
  });

  it("resolves the pending Promise to true when approved", async () => {
    let capturedId = "";
    manager.onApprovalRequested((req) => {
      capturedId = req.approvalId;
    });

    const promise = manager.requestApproval({
      seqId: 2,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "write_file",
      commandOrDiff: "+ const x = 1;",
      riskLevel: "medium",
    });

    expect(capturedId).toBeTruthy();
    expect(manager.getPendingCount()).toBe(1);

    const resolved = manager.resolveApproval(capturedId, true, "User clicked approve");
    expect(resolved).toBe(true);

    const decision = await promise;
    expect(decision).toBe(true);
    expect(manager.getPendingCount()).toBe(0);
    expect(manager.hasPending(capturedId)).toBe(false);
  });

  it("resolves the pending Promise to false when rejected", async () => {
    let capturedId = "";
    manager.onApprovalRequested((req) => {
      capturedId = req.approvalId;
    });

    const promise = manager.requestApproval({
      seqId: 3,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "execute_bash",
      commandOrDiff: "npm publish",
      riskLevel: "high",
    });

    const resolved = manager.resolveApproval(capturedId, false, "User clicked deny");
    expect(resolved).toBe(true);

    const decision = await promise;
    expect(decision).toBe(false);
    expect(manager.getPendingCount()).toBe(0);
  });

  it("returns false on duplicate resolution attempts (idempotent)", async () => {
    let capturedId = "";
    manager.onApprovalRequested((req) => {
      capturedId = req.approvalId;
    });

    const promise = manager.requestApproval({
      seqId: 4,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "execute_bash",
      commandOrDiff: "git push origin main --force",
      riskLevel: "high",
    });

    const first = manager.resolveApproval(capturedId, true);
    const second = manager.resolveApproval(capturedId, true);
    const third = manager.resolveApproval("non_existent_id", true);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(third).toBe(false);

    const decision = await promise;
    expect(decision).toBe(true);
  });

  it("auto-denies with false when 180 seconds elapse without response", async () => {
    const requestedEvents: ApprovalRequest[] = [];
    const resolvedEvents: ApprovalResponse[] = [];

    manager.onApprovalRequested((req) => requestedEvents.push(req));
    manager.onApprovalResolved((res) => resolvedEvents.push(res));

    const promise = manager.requestApproval({
      seqId: 5,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "execute_bash",
      commandOrDiff: "drop table users",
      riskLevel: "high",
    });

    expect(requestedEvents.length).toBe(1);
    expect(manager.getPendingCount()).toBe(1);

    // Fast-forward 179 seconds -> still pending
    vi.advanceTimersByTime(179000);
    expect(manager.getPendingCount()).toBe(1);
    expect(resolvedEvents.length).toBe(0);

    // Fast-forward 1 more second (total 180s) -> auto-denies
    vi.advanceTimersByTime(1000);

    const decision = await promise;
    expect(decision).toBe(false);
    expect(manager.getPendingCount()).toBe(0);
    expect(resolvedEvents.length).toBe(1);
    expect(resolvedEvents[0]?.approved).toBe(false);
    expect(resolvedEvents[0]?.reason).toBe("Timed out");
  });

  it("cancels all pending approvals cleanly on cancelAll()", async () => {
    const promise1 = manager.requestApproval({
      seqId: 10,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "tool_1",
      commandOrDiff: "action 1",
      riskLevel: "low",
    });

    const promise2 = manager.requestApproval({
      seqId: 11,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "tool_2",
      commandOrDiff: "action 2",
      riskLevel: "high",
    });

    expect(manager.getPendingCount()).toBe(2);

    manager.cancelAll("Preempted by new user instruction");

    expect(manager.getPendingCount()).toBe(0);

    const result1 = await promise1;
    const result2 = await promise2;

    expect(result1).toBe(false);
    expect(result2).toBe(false);
  });

  it("caps timeoutMs at APPROVAL_TIMEOUT_MS (180,000 ms)", async () => {
    let capturedReq: ApprovalRequest | null = null;
    manager.onApprovalRequested((req) => {
      capturedReq = req;
    });

    const promise = manager.requestApproval({
      seqId: 12,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "execute_bash",
      commandOrDiff: "sleep 10",
      riskLevel: "low",
      timeoutMs: 999999, // Exceeds 180s
    });

    expect(capturedReq).not.toBeNull();
    expect(capturedReq?.timeoutMs).toBe(APPROVAL_TIMEOUT_MS);

    manager.resolveApproval(capturedReq!.approvalId, true);
    await promise;
  });

  it("allows unregistering listeners via returned unsubscribe functions", async () => {
    let callCount = 0;
    const unsubscribe = manager.onApprovalRequested(() => {
      callCount++;
    });

    const promise1 = manager.requestApproval({
      seqId: 20,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "t1",
      commandOrDiff: "c1",
      riskLevel: "low",
    });

    expect(callCount).toBe(1);
    unsubscribe();

    const promise2 = manager.requestApproval({
      seqId: 21,
      sessionId: "session_123",
      turnId: "turn_456",
      toolName: "t2",
      commandOrDiff: "c2",
      riskLevel: "low",
    });

    expect(callCount).toBe(1); // Not incremented

    manager.cancelAll();
    await Promise.all([promise1, promise2]);
  });
});
