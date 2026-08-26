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
    expect(session.ringBuffer).toBeDefined();
    expect(session.byokConfig?.provider).toBe("openrouter");
    expect(session.byokConfig?.model).toBe("0x-alpha");
  });

  it("executes turn and streams typed events asynchronously", async () => {
    const client = new TrueForgeClient();
    const session = client.createSession({ sessionId: "sess_stream_test" });

    const chunks: Array<{ type: string; content: string; seqId: number }> = [];

    for await (const event of session.executeTurn({
      prompt: "Explain the ring buffer algorithm",
      turnId: "turn_test_1",
    })) {
      chunks.push({ type: event.type, content: event.content, seqId: event.seqId });
    }

    expect(chunks.length).toBeGreaterThan(0);
    // Verifies stream event types
    const types = chunks.map((c) => c.type);
    expect(types).toContain("thought");
    expect(types).toContain("token");
    expect(types).toContain("done");
  });

  it("maintains strictly monotonic sequence numbering across multiple turns in a session", async () => {
    const client = new TrueForgeClient();
    const session = client.createSession({ sessionId: "sess_monotonic_test" });

    const turn1Events = [];
    for await (const event of session.executeTurn({
      prompt: "Turn 1 directive",
      turnId: "turn_1",
    })) {
      turn1Events.push(event);
    }

    const turn2Events = [];
    for await (const event of session.executeTurn({
      prompt: "Turn 2 directive",
      turnId: "turn_2",
    })) {
      turn2Events.push(event);
    }

    expect(turn1Events.length).toBeGreaterThan(0);
    expect(turn2Events.length).toBeGreaterThan(0);

    const turn1Seqs = turn1Events.map((e) => e.seqId);
    const turn2Seqs = turn2Events.map((e) => e.seqId);

    // Turn 1 starts at sequence 1
    expect(turn1Seqs[0]).toBe(1);
    // Turn 2 continues monotonically where Turn 1 left off
    const lastTurn1Seq = turn1Seqs[turn1Seqs.length - 1]!;
    expect(turn2Seqs[0]).toBe(lastTurn1Seq + 1);

    // Ring buffer size should equal sum of events
    expect(session.ringBuffer.size).toBe(turn1Events.length + turn2Events.length);
    expect(session.ringBuffer.latestSeq).toBe(turn2Seqs[turn2Seqs.length - 1]);
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
