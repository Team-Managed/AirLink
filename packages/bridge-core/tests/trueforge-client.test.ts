import { describe, it, expect } from "vitest";
import { TrueForgeClient } from "../src/trueforge-client.js";

describe("TrueForgeClient (Agent Harness SDK Connector & Stream Lifecycle)", () => {
  it("initializes with default and custom endpoints", () => {
    const defaultClient = new TrueForgeClient();
    expect(defaultClient.endpoint).toBe("http://localhost:8000");

    const customClient = new TrueForgeClient({
      endpoint: "http://127.0.0.1:9000",
      defaultModel: "deepseek-r1",
    });
    expect(customClient.endpoint).toBe("http://127.0.0.1:9000");
    expect(customClient.defaultModel).toBe("deepseek-r1");
  });

  it("creates session handle and preserves BYOK configurations", () => {
    const client = new TrueForgeClient();
    const session = client.createSession({
      sessionId: "sess_123456",
      workspacePath: "/test/workspace",
      byokConfig: {
        provider: "openrouter",
        model: "0x-alpha",
        apiKey: "sk-test-key",
      },
    });

    expect(session.sessionId).toBe("sess_123456");
    expect(session.workspacePath).toBe("/test/workspace");
    expect(session.endpoint).toBe("http://localhost:8000");
    expect(session.defaultModel).toBe("0x-alpha");
    expect(session.sdk).toBeDefined();
    expect(client.sdk).toBeDefined();
    expect(session.byokConfig?.provider).toBe("openrouter");
    expect(session.byokConfig?.model).toBe("0x-alpha");
  });

  it("executes turn and streams typed events asynchronously", async () => {
    const client = new TrueForgeClient();
    const session = client.createSession({ sessionId: "sess_stream_test" });

    const chunks: Array<{ type: string; content: string }> = [];

    for await (const event of session.executeTurn({
      prompt: "Explain the ring buffer algorithm",
      turnId: "turn_test_1",
    })) {
      chunks.push({ type: event.type, content: event.content });
    }

    expect(chunks.length).toBeGreaterThan(0);
    // Verifies stream event types
    const types = chunks.map((c) => c.type);
    expect(types).toContain("thought");
    expect(types).toContain("token");
    expect(types).toContain("done");
  });

  it("propagates tool execution events during turn execution", async () => {
    const client = new TrueForgeClient();
    const session = client.createSession({ sessionId: "sess_tool_test" });

    const toolEvents: Array<{ type: string; name?: string }> = [];

    for await (const event of session.executeTurn({
      prompt: "Run bash command to test repo",
      mockToolAction: {
        toolName: "execute_bash",
        args: { command: "pnpm test" },
        result: "PASS 44 tests",
      },
    })) {
      if (event.type === "tool_call" || event.type === "tool_result") {
        toolEvents.push({ type: event.type, name: event.metadata?.name });
      }
    }

    expect(toolEvents.length).toBe(2);
    expect(toolEvents[0]?.type).toBe("tool_call");
    expect(toolEvents[0]?.name).toBe("execute_bash");
    expect(toolEvents[1]?.type).toBe("tool_result");
    expect(toolEvents[1]?.name).toBe("execute_bash");
  });
});
