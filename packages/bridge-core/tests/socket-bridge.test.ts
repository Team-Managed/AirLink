import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SocketBridge } from "../src/socket-bridge.js";
import { ApprovalManager } from "../src/approval-handler.js";
import { ApprovalRequest } from "@agent-remote/protocol";

describe("SocketBridge", () => {
  let bridge: SocketBridge;
  let approvalManager: ApprovalManager;

  beforeEach(() => {
    approvalManager = new ApprovalManager();
    bridge = new SocketBridge({
      relayUrl: "http://localhost:3001",
      pin: "123456",
      hostName: "test-workstation",
      workspacePath: "/workspace/project",
      approvalManager,
      autoConnect: false, // Don't auto connect in unit test
    });
  });

  afterEach(() => {
    bridge.disconnect();
    vi.restoreAllMocks();
  });

  it("initializes with provided configuration and approval manager", () => {
    expect(bridge.pin).toBe("123456");
    expect(bridge.hostName).toBe("test-workstation");
    expect(bridge.workspacePath).toBe("/workspace/project");
    expect(bridge.relayUrl).toBe("http://localhost:3001");
    expect(bridge.approvalManager).toBe(approvalManager);
    expect(bridge.isConnected()).toBe(false);
  });

  it("triggers onHostApprovalPrompt when ApprovalManager requests an approval", async () => {
    let capturedPrompt: ApprovalRequest | null = null;

    bridge.onHostApprovalPrompt((req) => {
      capturedPrompt = req;
    });

    const promise = approvalManager.requestApproval({
      seqId: 1,
      sessionId: "sess_100",
      turnId: "turn_200",
      toolName: "execute_bash",
      commandOrDiff: "git status",
      riskLevel: "low",
    });

    expect(capturedPrompt).not.toBeNull();
    expect(capturedPrompt?.toolName).toBe("execute_bash");
    expect(capturedPrompt?.commandOrDiff).toBe("git status");

    approvalManager.resolveApproval(capturedPrompt!.approvalId, true);
    const result = await promise;
    expect(result).toBe(true);
  });

  it("registers and cleans up event handlers without errors", () => {
    const unsubPrompt = bridge.onPrompt(() => {});
    const unsubSync = bridge.onSync(() => {});
    const unsubConnected = bridge.onSessionConnected(() => {});
    const unsubError = bridge.onError(() => {});
    const unsubDisconnect = bridge.onDisconnect(() => {});

    expect(typeof unsubPrompt).toBe("function");
    expect(typeof unsubSync).toBe("function");
    expect(typeof unsubConnected).toBe("function");
    expect(typeof unsubError).toBe("function");
    expect(typeof unsubDisconnect).toBe("function");

    unsubPrompt();
    unsubSync();
    unsubConnected();
    unsubError();
    unsubDisconnect();
  });
});
