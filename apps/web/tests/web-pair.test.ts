import { describe, it, expect } from "vitest";
import {
  JoinSessionSchema,
  ClientPromptSchema,
  ApprovalResponseSchema,
} from "@agent-remote/protocol";

describe("Web Remote Client Protocol Validation Suite", () => {
  it("validates client:join payloads from web clients", () => {
    const pairPayload = {
      pin: "834192",
      clientName: "Agent Remote Web Client",
    };

    const parsed = JoinSessionSchema.safeParse(pairPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.pin).toBe("834192");
      expect(parsed.data.clientName).toBe("Agent Remote Web Client");
    }
  });

  it("validates client:prompt payloads with optional BYOK config", () => {
    const promptPayload = {
      sessionId: "session_123",
      prompt: "Refactor rate limiter and add unit tests",
      byokConfig: {
        provider: "openrouter" as const,
        model: "0x-alpha",
        apiKey: "sk-or-v1-testkey",
      },
    };

    const parsed = ClientPromptSchema.safeParse(promptPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.prompt).toContain("Refactor rate limiter");
      expect(parsed.data.byokConfig?.provider).toBe("openrouter");
    }
  });

  it("validates client:approval_response payloads for web approvals", () => {
    const approvalPayload = {
      approvalId: "123e4567-e89b-12d3-a456-426614174000",
      sessionId: "session_123",
      approved: true,
    };

    const parsed = ApprovalResponseSchema.safeParse(approvalPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.approved).toBe(true);
      expect(parsed.data.sessionId).toBe("session_123");
    }
  });
});
