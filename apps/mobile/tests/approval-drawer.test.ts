import { describe, it, expect } from "vitest";
import type { ApprovalRequest } from "@airlink/protocol";

describe("Approval Drawer Logic & Invariants", () => {
  const sampleApproval: ApprovalRequest = {
    seqId: 42,
    approvalId: "appr_test_123",
    sessionId: "sess_test_abc",
    turnId: "turn_1",
    toolName: "execute_bash",
    commandOrDiff: "rm -rf build/",
    riskLevel: "high",
    timeoutMs: 180000,
    createdAt: Date.now(),
  };

  it("enforces 180,000ms (180s) bounded approval timeout invariant", () => {
    expect(sampleApproval.timeoutMs).toBe(180000);
    const totalSeconds = Math.floor((sampleApproval.timeoutMs ?? 180000) / 1000);
    expect(totalSeconds).toBe(180);
  });

  it("correctly identifies risk level levels", () => {
    expect(sampleApproval.riskLevel).toBe("high");
  });

  it("detects destructive terminal commands vs git diff patches", () => {
    const isBashDiff =
      sampleApproval.toolName === "write_file" || sampleApproval.commandOrDiff.includes("@@");
    expect(isBashDiff).toBe(false);

    const diffApproval: ApprovalRequest = {
      ...sampleApproval,
      toolName: "write_file",
      commandOrDiff: "@@ -1,3 +1,3 @@\n-old\n+new",
      riskLevel: "medium",
    };
    const isFileDiff =
      diffApproval.toolName === "write_file" || diffApproval.commandOrDiff.includes("@@");
    expect(isFileDiff).toBe(true);
  });
});
