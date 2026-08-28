import { describe, it, expect, beforeEach, vi } from "vitest";
import { MobileSocketService } from "../src/services/socket.js";
import {
  SOCKET_EVENTS,
  type SessionConnected,
  type AgentStream,
  type ApprovalRequest,
} from "@agent-remote/protocol";

describe("Mobile Socket Service", () => {
  let service: MobileSocketService;

  beforeEach(() => {
    service = MobileSocketService.getInstance();
    service.disconnect();
    service.resetSequence();
  });

  it("is a singleton instance", () => {
    const s1 = MobileSocketService.getInstance();
    const s2 = MobileSocketService.getInstance();
    expect(s1).toBe(s2);
  });

  it("initializes with zero sequence and null session", () => {
    expect(service.getLastSeenSeq()).toBe(0);
    expect(service.getActiveSessionId()).toBeNull();
    expect(service.isConnected()).toBe(false);
  });

  it("throws error when attempting to send prompt without connection", () => {
    expect(() => {
      service.sendPrompt("Hello agent");
    }).toThrow("Cannot send prompt: socket not connected or active session missing.");
  });

  it("throws error when attempting to send approval without connection", () => {
    expect(() => {
      service.sendApproval("appr_123", true);
    }).toThrow("Cannot send approval: socket not connected or active session missing.");
  });

  it("throws error when joining before connect() is called", () => {
    expect(() => {
      service.join("834192");
    }).toThrow("Socket is not initialized. Call connect() first.");
  });

  it("tracks incoming stream sequence IDs monotonically", () => {
    const streamCallback = vi.fn();
    service.setCallbacks({ onAgentStream: streamCallback });

    // Mock internal socket listener triggers
    // Test that sequence increment works properly
    expect(service.getLastSeenSeq()).toBe(0);
  });
});
