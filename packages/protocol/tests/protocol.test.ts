import { describe, it, expect } from "vitest";
import {
  LLMProviderSchema,
  BYOKConfigSchema,
  RegisterHostSchema,
  JoinSessionSchema,
  SessionConnectedSchema,
  ClientPromptSchema,
  StreamEventTypeSchema,
  ToolMetadataSchema,
  AgentStreamSchema,
  RiskLevelSchema,
  ApprovalRequestSchema,
  ApprovalResponseSchema,
  ClientSyncSchema,
  StreamBatchSchema,
  StandardErrorSchema,
  SOCKET_EVENTS,
  validatePayload,
  safeValidatePayload,
  parseLLMProvider,
  parseBYOKConfig,
  parseRegisterHost,
  parseJoinSession,
  parseSessionConnected,
  parseClientPrompt,
  parseStreamEventType,
  parseToolMetadata,
  parseAgentStream,
  parseRiskLevel,
  parseApprovalRequest,
  parseApprovalResponse,
  parseClientSync,
  parseStreamBatch,
  parseStandardError,
  isBYOKConfig,
  isRegisterHost,
  isJoinSession,
  isSessionConnected,
  isClientPrompt,
  isAgentStream,
  isApprovalRequest,
  isApprovalResponse,
  isClientSync,
  isStreamBatch,
  isStandardError,
} from "../src/index.js";

describe("Protocol Contracts Suite (@agent-remote/protocol)", () => {
  describe("1. LLMProviderSchema & BYOKConfigSchema", () => {
    it("parses valid LLM providers", () => {
      expect(LLMProviderSchema.parse("openrouter")).toBe("openrouter");
      expect(LLMProviderSchema.parse("anthropic")).toBe("anthropic");
      expect(LLMProviderSchema.parse("openai")).toBe("openai");
      expect(LLMProviderSchema.parse("custom")).toBe("custom");

      expect(parseLLMProvider("openrouter")).toBe("openrouter");
      expect(parseLLMProvider("anthropic")).toBe("anthropic");
    });

    it("rejects invalid LLM providers", () => {
      expect(() => LLMProviderSchema.parse("gemini_direct")).toThrow();
      expect(() => parseLLMProvider("gemini_direct")).toThrow();
      expect(() => LLMProviderSchema.parse("")).toThrow();
      expect(() => LLMProviderSchema.parse(123)).toThrow();
    });

    it("parses valid BYOK config with required and optional fields", () => {
      const validConfig = {
        provider: "openrouter" as const,
        model: "0x-alpha",
        apiKey: "sk-or-v1-test-key",
        baseUrl: "https://openrouter.ai/api/v1",
      };
      const parsed = BYOKConfigSchema.parse(validConfig);
      expect(parsed.provider).toBe("openrouter");
      expect(parsed.model).toBe("0x-alpha");
      expect(parsed.apiKey).toBe("sk-or-v1-test-key");
      expect(parsed.baseUrl).toBe("https://openrouter.ai/api/v1");

      expect(isBYOKConfig(validConfig)).toBe(true);
    });

    it("parses BYOK config without optional apiKey and baseUrl", () => {
      const minimal = {
        provider: "anthropic" as const,
        model: "claude-3-5-sonnet-20241022",
      };
      const parsed = parseBYOKConfig(minimal);
      expect(parsed.provider).toBe("anthropic");
      expect(parsed.model).toBe("claude-3-5-sonnet-20241022");
      expect(parsed.apiKey).toBeUndefined();
      expect(parsed.baseUrl).toBeUndefined();
      expect(isBYOKConfig(minimal)).toBe(true);
    });

    it("rejects invalid baseUrl in BYOK config", () => {
      const invalid = {
        provider: "custom",
        model: "llama-3",
        baseUrl: "not-a-valid-url",
      };
      expect(() => BYOKConfigSchema.parse(invalid)).toThrow();
      expect(isBYOKConfig(invalid)).toBe(false);
    });

    it("rejects empty model string in BYOK config", () => {
      const invalid = {
        provider: "openai",
        model: "",
      };
      expect(() => BYOKConfigSchema.parse(invalid)).toThrow();
      expect(isBYOKConfig(invalid)).toBe(false);
    });
  });

  describe("2. RegisterHostSchema", () => {
    it("parses valid host registration payload", () => {
      const valid = {
        pin: "834192",
        hostName: "MacBook Pro - Tyra",
        workspacePath: "/Users/tyra/projects/agent-harness",
      };
      const parsed = parseRegisterHost(valid);
      expect(parsed.pin).toBe("834192");
      expect(parsed.hostName).toBe("MacBook Pro - Tyra");
      expect(parsed.workspacePath).toBe("/Users/tyra/projects/agent-harness");
      expect(isRegisterHost(valid)).toBe(true);
    });

    it("rejects PINs that are not exactly 6 characters", () => {
      expect(() =>
        parseRegisterHost({
          pin: "12345",
          hostName: "Host",
          workspacePath: "/app",
        }),
      ).toThrow();
      expect(() =>
        parseRegisterHost({
          pin: "1234567",
          hostName: "Host",
          workspacePath: "/app",
        }),
      ).toThrow();
      expect(() =>
        parseRegisterHost({
          pin: "",
          hostName: "Host",
          workspacePath: "/app",
        }),
      ).toThrow();
      expect(isRegisterHost({ pin: "123" })).toBe(false);
    });

    it("rejects missing hostName or workspacePath", () => {
      expect(() =>
        parseRegisterHost({
          pin: "123456",
          hostName: "",
          workspacePath: "/app",
        }),
      ).toThrow();
      expect(() =>
        parseRegisterHost({
          pin: "123456",
          hostName: "Host",
          workspacePath: "",
        }),
      ).toThrow();
    });
  });

  describe("3. JoinSessionSchema", () => {
    it("parses valid join session payload with default clientName", () => {
      const valid = { pin: "834192" };
      const parsed = parseJoinSession(valid);
      expect(parsed.pin).toBe("834192");
      expect(parsed.clientName).toBe("Mobile App");
      expect(isJoinSession(valid)).toBe(true);
    });

    it("parses valid join session payload with custom clientName", () => {
      const valid = { pin: "834192", clientName: "Web Pairing Client" };
      const parsed = parseJoinSession(valid);
      expect(parsed.pin).toBe("834192");
      expect(parsed.clientName).toBe("Web Pairing Client");
      expect(isJoinSession(valid)).toBe(true);
    });

    it("rejects invalid PIN in JoinSession", () => {
      expect(() => parseJoinSession({ pin: "83419" })).toThrow();
      expect(() => parseJoinSession({ pin: "8341920" })).toThrow();
      expect(isJoinSession({ pin: "short" })).toBe(false);
    });
  });

  describe("4. SessionConnectedSchema", () => {
    it("parses valid session connected payload and sets default connectedAt", () => {
      const before = Date.now();
      const valid = {
        sessionId: "session_834192",
        deviceName: "Tyra's iPhone",
        workspacePath: "/Users/tyra/agent-harness",
        status: "connected" as const,
      };
      const parsed = parseSessionConnected(valid);
      const after = Date.now();

      expect(parsed.sessionId).toBe("session_834192");
      expect(parsed.deviceName).toBe("Tyra's iPhone");
      expect(parsed.workspacePath).toBe("/Users/tyra/agent-harness");
      expect(parsed.status).toBe("connected");
      expect(parsed.connectedAt).toBeGreaterThanOrEqual(before);
      expect(parsed.connectedAt).toBeLessThanOrEqual(after);
      expect(isSessionConnected(valid)).toBe(true);
    });

    it("allows disconnected status", () => {
      const valid = {
        sessionId: "session_834192",
        deviceName: "Tyra's iPhone",
        workspacePath: "/Users/tyra/agent-harness",
        status: "disconnected" as const,
      };
      const parsed = parseSessionConnected(valid);
      expect(parsed.status).toBe("disconnected");
      expect(isSessionConnected(valid)).toBe(true);
    });

    it("rejects invalid status", () => {
      const invalid = {
        sessionId: "session_834192",
        deviceName: "Tyra's iPhone",
        workspacePath: "/Users/tyra/agent-harness",
        status: "pending",
      };
      expect(() => parseSessionConnected(invalid)).toThrow();
      expect(isSessionConnected(invalid)).toBe(false);
    });
  });

  describe("5. ClientPromptSchema", () => {
    it("parses valid prompt with default turnId", () => {
      const valid = {
        sessionId: "session_834192",
        prompt: "Refactor auth middleware to support refresh tokens",
      };
      const parsed = parseClientPrompt(valid);
      expect(parsed.sessionId).toBe("session_834192");
      expect(parsed.prompt).toBe("Refactor auth middleware to support refresh tokens");
      expect(parsed.turnId).toBeDefined();
      expect(parsed.turnId.startsWith("turn_")).toBe(true);
      expect(parsed.byokConfig).toBeUndefined();
      expect(isClientPrompt(valid)).toBe(true);
    });

    it("parses valid prompt with custom turnId and BYOK config", () => {
      const valid = {
        sessionId: "session_834192",
        prompt: "Run tests",
        turnId: "turn_custom_123",
        byokConfig: {
          provider: "openai" as const,
          model: "gpt-4o",
        },
      };
      const parsed = parseClientPrompt(valid);
      expect(parsed.turnId).toBe("turn_custom_123");
      expect(parsed.byokConfig?.provider).toBe("openai");
      expect(parsed.byokConfig?.model).toBe("gpt-4o");
      expect(isClientPrompt(valid)).toBe(true);
    });

    it("rejects empty prompt or missing sessionId", () => {
      expect(() =>
        parseClientPrompt({
          sessionId: "session_834192",
          prompt: "",
        }),
      ).toThrow();
      expect(() =>
        parseClientPrompt({
          sessionId: "",
          prompt: "Hello",
        }),
      ).toThrow();
      expect(isClientPrompt({ prompt: "" })).toBe(false);
    });
  });

  describe("6. StreamEventTypeSchema, ToolMetadataSchema & AgentStreamSchema", () => {
    it("validates all supported stream event types", () => {
      const types = ["thought", "token", "tool_call", "tool_result", "error", "done"] as const;
      for (const t of types) {
        expect(StreamEventTypeSchema.parse(t)).toBe(t);
        expect(parseStreamEventType(t)).toBe(t);
      }
    });

    it("rejects unknown stream event type", () => {
      expect(() => StreamEventTypeSchema.parse("unknown_event")).toThrow();
      expect(() => parseStreamEventType("unknown_event")).toThrow();
    });

    it("parses tool metadata correctly with default empty args", () => {
      const parsed = parseToolMetadata({ name: "execute_bash" });
      expect(parsed.name).toBe("execute_bash");
      expect(parsed.args).toEqual({});
      expect(parsed.durationMs).toBeUndefined();
      expect(parsed.exitCode).toBeUndefined();
    });

    it("parses tool metadata with args, duration, and exitCode", () => {
      const parsed = parseToolMetadata({
        name: "execute_bash",
        args: { command: "pnpm test" },
        durationMs: 420,
        exitCode: 0,
      });
      expect(parsed.args).toEqual({ command: "pnpm test" });
      expect(parsed.durationMs).toBe(420);
      expect(parsed.exitCode).toBe(0);
    });

    it("parses valid AgentStream payload with default timestamp", () => {
      const before = Date.now();
      const valid = {
        seqId: 1,
        sessionId: "session_834192",
        turnId: "turn_1",
        type: "token" as const,
        content: "Refactoring auth module...",
      };
      const parsed = parseAgentStream(valid);
      const after = Date.now();

      expect(parsed.seqId).toBe(1);
      expect(parsed.sessionId).toBe("session_834192");
      expect(parsed.turnId).toBe("turn_1");
      expect(parsed.type).toBe("token");
      expect(parsed.content).toBe("Refactoring auth module...");
      expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
      expect(parsed.timestamp).toBeLessThanOrEqual(after);
      expect(isAgentStream(valid)).toBe(true);
    });

    it("rejects non-positive, zero, or non-integer seqId in AgentStream", () => {
      expect(() =>
        parseAgentStream({
          seqId: 0,
          sessionId: "session_834192",
          turnId: "turn_1",
          type: "token",
          content: "Hello",
        }),
      ).toThrow();

      expect(() =>
        parseAgentStream({
          seqId: -1,
          sessionId: "session_834192",
          turnId: "turn_1",
          type: "token",
          content: "Hello",
        }),
      ).toThrow();

      expect(() =>
        parseAgentStream({
          seqId: 1.5,
          sessionId: "session_834192",
          turnId: "turn_1",
          type: "token",
          content: "Hello",
        }),
      ).toThrow();

      expect(isAgentStream({ seqId: 0 })).toBe(false);
    });
  });

  describe("7. ApprovalRequestSchema", () => {
    it("parses valid approval request with 180s default timeout", () => {
      const before = Date.now();
      const valid = {
        seqId: 4,
        approvalId: "appr_987e6543-e21b-12d3-a456-426614174000",
        sessionId: "session_834192",
        turnId: "turn_1",
        toolName: "execute_bash",
        commandOrDiff: "rm -rf node_modules && pnpm install",
        riskLevel: "high" as const,
        description: "Reinstalling dependencies after lockfile change",
      };
      const parsed = parseApprovalRequest(valid);
      const after = Date.now();

      expect(parsed.seqId).toBe(4);
      expect(parsed.approvalId).toBe("appr_987e6543-e21b-12d3-a456-426614174000");
      expect(parsed.toolName).toBe("execute_bash");
      expect(parsed.commandOrDiff).toBe("rm -rf node_modules && pnpm install");
      expect(parsed.riskLevel).toBe("high");
      expect(parsed.timeoutMs).toBe(180000); // 180s timeout invariant
      expect(parsed.createdAt).toBeGreaterThanOrEqual(before);
      expect(parsed.createdAt).toBeLessThanOrEqual(after);
      expect(isApprovalRequest(valid)).toBe(true);
    });

    it("accepts custom positive timeoutMs", () => {
      const valid = {
        seqId: 5,
        approvalId: "appr_custom_timeout",
        sessionId: "session_834192",
        turnId: "turn_1",
        toolName: "write_file",
        commandOrDiff: "+ const x = 1;",
        riskLevel: "low" as const,
        timeoutMs: 60000,
      };
      const parsed = parseApprovalRequest(valid);
      expect(parsed.timeoutMs).toBe(60000);
      expect(isApprovalRequest(valid)).toBe(true);
    });

    it("parses and validates risk levels", () => {
      expect(parseRiskLevel("low")).toBe("low");
      expect(parseRiskLevel("medium")).toBe("medium");
      expect(parseRiskLevel("high")).toBe("high");
      expect(() => parseRiskLevel("extreme")).toThrow();
    });

    it("rejects invalid risk level in ApprovalRequest", () => {
      expect(() =>
        parseApprovalRequest({
          seqId: 1,
          approvalId: "appr_1",
          sessionId: "session_834192",
          turnId: "turn_1",
          toolName: "execute_bash",
          commandOrDiff: "git push",
          riskLevel: "critical",
        }),
      ).toThrow();
      expect(isApprovalRequest({ riskLevel: "critical" })).toBe(false);
    });

    it("rejects negative or zero timeoutMs", () => {
      expect(() =>
        parseApprovalRequest({
          seqId: 1,
          approvalId: "appr_1",
          sessionId: "session_834192",
          turnId: "turn_1",
          toolName: "execute_bash",
          commandOrDiff: "git push",
          riskLevel: "medium",
          timeoutMs: 0,
        }),
      ).toThrow();

      expect(() =>
        parseApprovalRequest({
          seqId: 1,
          approvalId: "appr_1",
          sessionId: "session_834192",
          turnId: "turn_1",
          toolName: "execute_bash",
          commandOrDiff: "git push",
          riskLevel: "medium",
          timeoutMs: -5000,
        }),
      ).toThrow();
    });
  });

  describe("8. ApprovalResponseSchema", () => {
    it("parses approved response with default resolvedAt timestamp", () => {
      const before = Date.now();
      const valid = {
        approvalId: "appr_987e6543",
        sessionId: "session_834192",
        approved: true,
      };
      const parsed = parseApprovalResponse(valid);
      const after = Date.now();

      expect(parsed.approvalId).toBe("appr_987e6543");
      expect(parsed.sessionId).toBe("session_834192");
      expect(parsed.approved).toBe(true);
      expect(parsed.reason).toBeUndefined();
      expect(parsed.resolvedAt).toBeGreaterThanOrEqual(before);
      expect(parsed.resolvedAt).toBeLessThanOrEqual(after);
      expect(isApprovalResponse(valid)).toBe(true);
    });

    it("parses rejected response with reason", () => {
      const valid = {
        approvalId: "appr_987e6543",
        sessionId: "session_834192",
        approved: false,
        reason: "User denied bash command: contains destructive rm",
      };
      const parsed = parseApprovalResponse(valid);
      expect(parsed.approved).toBe(false);
      expect(parsed.reason).toBe("User denied bash command: contains destructive rm");
      expect(isApprovalResponse(valid)).toBe(true);
    });

    it("rejects non-boolean approved field", () => {
      expect(() =>
        parseApprovalResponse({
          approvalId: "appr_1",
          sessionId: "session_834192",
          approved: "yes",
        }),
      ).toThrow();
      expect(isApprovalResponse({ approved: "yes" })).toBe(false);
    });
  });

  describe("9. ClientSyncSchema", () => {
    it("parses valid sync request with lastSeenSeq = 0", () => {
      const valid = {
        sessionId: "session_834192",
        lastSeenSeq: 0,
      };
      const parsed = parseClientSync(valid);
      expect(parsed.sessionId).toBe("session_834192");
      expect(parsed.lastSeenSeq).toBe(0);
      expect(isClientSync(valid)).toBe(true);
    });

    it("parses valid sync request with positive lastSeenSeq", () => {
      const valid = {
        sessionId: "session_834192",
        lastSeenSeq: 44,
      };
      const parsed = parseClientSync(valid);
      expect(parsed.sessionId).toBe("session_834192");
      expect(parsed.lastSeenSeq).toBe(44);
      expect(isClientSync(valid)).toBe(true);
    });

    it("rejects negative lastSeenSeq in ClientSync", () => {
      expect(() =>
        parseClientSync({
          sessionId: "session_834192",
          lastSeenSeq: -1,
        }),
      ).toThrow();
      expect(isClientSync({ lastSeenSeq: -1 })).toBe(false);
    });

    it("rejects non-integer lastSeenSeq", () => {
      expect(() =>
        parseClientSync({
          sessionId: "session_834192",
          lastSeenSeq: 12.34,
        }),
      ).toThrow();
    });
  });

  describe("10. StreamBatchSchema", () => {
    it("parses empty batch of stream events", () => {
      const valid = {
        sessionId: "session_834192",
        events: [],
      };
      const parsed = parseStreamBatch(valid);
      expect(parsed.sessionId).toBe("session_834192");
      expect(parsed.events).toHaveLength(0);
      expect(isStreamBatch(valid)).toBe(true);
    });

    it("parses batch containing multiple valid stream events", () => {
      const valid = {
        sessionId: "session_834192",
        events: [
          {
            seqId: 45,
            sessionId: "session_834192",
            turnId: "turn_1",
            type: "token" as const,
            content: "Step 1 complete",
          },
          {
            seqId: 46,
            sessionId: "session_834192",
            turnId: "turn_1",
            type: "thought" as const,
            content: "Now analyzing test suite...",
          },
        ],
      };
      const parsed = parseStreamBatch(valid);
      expect(parsed.events).toHaveLength(2);
      expect(parsed.events[0]?.seqId).toBe(45);
      expect(parsed.events[1]?.seqId).toBe(46);
      expect(isStreamBatch(valid)).toBe(true);
    });

    it("rejects batch if any event is invalid", () => {
      const invalid = {
        sessionId: "session_834192",
        events: [
          {
            seqId: -1, // invalid seqId
            sessionId: "session_834192",
            turnId: "turn_1",
            type: "token",
            content: "bad",
          },
        ],
      };
      expect(() => parseStreamBatch(invalid)).toThrow();
      expect(isStreamBatch(invalid)).toBe(false);
    });
  });

  describe("11. StandardErrorSchema", () => {
    it("parses valid error payload", () => {
      const valid = {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Maximum failed PIN attempts reached (3/3). Lockout for 5 minutes.",
        details: { attempts: 3, lockoutSeconds: 300 },
      };
      const parsed = parseStandardError(valid);
      expect(parsed.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(parsed.message).toContain("Maximum failed PIN attempts");
      expect(parsed.details).toEqual({ attempts: 3, lockoutSeconds: 300 });
      expect(isStandardError(valid)).toBe(true);
    });

    it("rejects empty code or message", () => {
      expect(() => parseStandardError({ code: "", message: "Err" })).toThrow();
      expect(() => parseStandardError({ code: "ERR", message: "" })).toThrow();
      expect(isStandardError({ code: "" })).toBe(false);
    });
  });

  describe("12. Socket Events Constants & Validation Helpers", () => {
    it("defines constant Socket.io event name mappings", () => {
      expect(SOCKET_EVENTS.REGISTER_HOST).toBe("host:register");
      expect(SOCKET_EVENTS.JOIN_SESSION).toBe("client:join");
      expect(SOCKET_EVENTS.SESSION_CONNECTED).toBe("session:connected");
      expect(SOCKET_EVENTS.CLIENT_PROMPT).toBe("client:prompt");
      expect(SOCKET_EVENTS.AGENT_STREAM).toBe("agent:stream");
      expect(SOCKET_EVENTS.APPROVAL_REQUIRED).toBe("agent:approval_required");
      expect(SOCKET_EVENTS.APPROVAL_RESPONSE).toBe("client:approval_response");
      expect(SOCKET_EVENTS.CLIENT_SYNC).toBe("client:sync");
      expect(SOCKET_EVENTS.STREAM_BATCH).toBe("agent:stream_batch");
      expect(SOCKET_EVENTS.ERROR).toBe("session:error");
    });

    it("validatePayload parses valid data and throws on invalid data", () => {
      const valid = validatePayload(JoinSessionSchema, { pin: "123456" });
      expect(valid.pin).toBe("123456");
      expect(valid.clientName).toBe("Mobile App");

      expect(() => validatePayload(JoinSessionSchema, { pin: "12" })).toThrow();
    });

    it("safeValidatePayload returns success or failure result object", () => {
      const success = safeValidatePayload(JoinSessionSchema, { pin: "654321" });
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data.pin).toBe("654321");
      }

      const failure = safeValidatePayload(JoinSessionSchema, { pin: "bad" });
      expect(failure.success).toBe(false);
      if (!failure.success) {
        expect(failure.error).toBeDefined();
      }
    });
  });
});
