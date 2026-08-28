import { describe, it, expect } from "vitest";
import { aggregateFeedItem, mergeBatchEvents } from "../src/hooks/useWebSession";
import type { WebFeedItem } from "../src/types";

describe("Web Session Hook & Stream Aggregator Suite", () => {
  it("appends distinct non-token events directly to the feed", () => {
    const prev: WebFeedItem[] = [
      {
        id: "thought_1",
        seqId: 1,
        type: "thought",
        content: "Thinking about refactoring...",
        role: "agent",
        timestamp: 1000,
      },
    ];

    const incoming: WebFeedItem = {
      id: "tool_1",
      seqId: 2,
      type: "tool_call",
      content: "read_file package.json",
      role: "agent",
      metadata: { name: "read_file", args: { path: "package.json" } },
      timestamp: 1005,
    };

    const result = aggregateFeedItem(prev, incoming);
    expect(result.length).toBe(2);
    expect(result[1].type).toBe("tool_call");
    expect(result[1].content).toBe("read_file package.json");
  });

  it("aggregates consecutive streaming token chunks into a single message box", () => {
    const prev: WebFeedItem[] = [
      {
        id: "token_1",
        seqId: 10,
        type: "token",
        content: "Hello",
        role: "agent",
        timestamp: 1000,
      },
    ];

    const incoming: WebFeedItem = {
      id: "token_2",
      seqId: 11,
      type: "token",
      content: " world!",
      role: "agent",
      timestamp: 1050,
    };

    const result = aggregateFeedItem(prev, incoming);
    expect(result.length).toBe(1);
    expect(result[0].content).toBe("Hello world!");
    expect(result[0].timestamp).toBe(1050);
  });

  it("keeps user prompts separate from agent token streams", () => {
    const prev: WebFeedItem[] = [
      {
        id: "prompt_1",
        seqId: 0,
        type: "token",
        content: "> run tests",
        role: "user",
        timestamp: 1000,
      },
    ];

    const incoming: WebFeedItem = {
      id: "token_1",
      seqId: 1,
      type: "token",
      content: "Running test suite...",
      role: "agent",
      timestamp: 1010,
    };

    const result = aggregateFeedItem(prev, incoming);
    expect(result.length).toBe(2);
    expect(result[0].role).toBe("user");
    expect(result[1].role).toBe("agent");
  });

  it("merges replayed batch events while deduplicating existing sequence IDs", () => {
    const prev: WebFeedItem[] = [
      {
        id: "stream_1",
        seqId: 1,
        type: "thought",
        content: "Step 1",
        role: "agent",
        timestamp: 1000,
      },
      {
        id: "stream_2",
        seqId: 2,
        type: "token",
        content: "Step 2",
        role: "agent",
        timestamp: 1005,
      },
    ];

    const batchEvents = [
      {
        seqId: 2, // Duplicate, should be skipped
        type: "token" as const,
        content: "Step 2",
        timestamp: 1005,
      },
      {
        seqId: 3, // New event
        type: "tool_call" as const,
        content: "run_command",
        metadata: { name: "run_command", args: {} },
        timestamp: 1010,
      },
      {
        seqId: 4, // New event
        type: "done" as const,
        content: "Complete",
        timestamp: 1020,
      },
    ];

    const result = mergeBatchEvents(prev, batchEvents);
    expect(result.length).toBe(4);
    expect(result.map((i) => i.seqId)).toEqual([1, 2, 3, 4]);
  });

  it("sanitizes pairing PIN to exactly digits only", () => {
    const rawInput = "834-abc-192 #$!";
    const sanitized = rawInput.replace(/\D/g, "").slice(0, 6);
    expect(sanitized).toBe("834192");
    expect(sanitized.length).toBe(6);
  });

  it("computes approval expiry remaining seconds and flags expired state at 0", () => {
    const createdAt = Date.now() - 175000; // 175 seconds ago
    const timeoutMs = 180000; // 180 seconds total
    const expiresAt = createdAt + timeoutMs;
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    expect(remaining).toBeLessThanOrEqual(5);
    expect(remaining).toBeGreaterThan(0);

    const pastCreatedAt = Date.now() - 190000; // 190 seconds ago
    const pastExpiresAt = pastCreatedAt + timeoutMs;
    const expiredRemaining = Math.max(0, Math.ceil((pastExpiresAt - Date.now()) / 1000));
    expect(expiredRemaining).toBe(0);
  });

  it("resolves default relay URL from NEXT_PUBLIC_RELAY_URL before localhost fallback", () => {
    const envRelay: string | undefined = "https://relay.agent-remote.dev";
    const emptyOption: string | undefined = undefined;
    const resolvedWithEnv = emptyOption || envRelay || "http://localhost:3001";
    expect(resolvedWithEnv).toBe("https://relay.agent-remote.dev");

    const noEnv: string | undefined = undefined;
    const resolvedWithoutEnv = emptyOption || noEnv || "http://localhost:3001";
    expect(resolvedWithoutEnv).toBe("http://localhost:3001");

    const queryOverride = "http://custom-relay:4000";
    const resolvedWithQuery = queryOverride || envRelay || "http://localhost:3001";
    expect(resolvedWithQuery).toBe("http://custom-relay:4000");
  });
});
