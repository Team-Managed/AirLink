import { describe, it, expect, beforeEach } from "vitest";
import { RingBuffer } from "../src/ring-buffer.js";
import type { AgentStream } from "@agent-remote/protocol";

describe("RingBuffer (In-Memory Event Queue & Reconnection Recovery)", () => {
  let ringBuffer: RingBuffer;

  beforeEach(() => {
    ringBuffer = new RingBuffer(); // default 500 capacity
  });

  it("initializes with default max capacity of 500 and empty state", () => {
    expect(ringBuffer.capacity).toBe(500);
    expect(ringBuffer.size).toBe(0);
    expect(ringBuffer.latestSeq).toBe(0);
    expect(ringBuffer.getAllEvents()).toEqual([]);
  });

  it("supports custom capacity", () => {
    const custom = new RingBuffer(10);
    expect(custom.capacity).toBe(10);
  });

  it("throws on non-positive capacity", () => {
    expect(() => new RingBuffer(0)).toThrow("RingBuffer capacity must be a positive integer");
    expect(() => new RingBuffer(-5)).toThrow("RingBuffer capacity must be a positive integer");
  });

  it("assigns strictly monotonic sequence numbers starting at 1", () => {
    const e1 = ringBuffer.push({
      sessionId: "session_1",
      turnId: "turn_1",
      type: "token",
      content: "Hello",
      timestamp: Date.now(),
    });

    const e2 = ringBuffer.push({
      sessionId: "session_1",
      turnId: "turn_1",
      type: "token",
      content: " world",
      timestamp: Date.now(),
    });

    expect(e1.seqId).toBe(1);
    expect(e2.seqId).toBe(2);
    expect(ringBuffer.latestSeq).toBe(2);
    expect(ringBuffer.size).toBe(2);
  });

  it("bounds memory strictly to 500 items and evicts oldest items when capacity is exceeded", () => {
    // Push 600 items
    for (let i = 1; i <= 600; i++) {
      ringBuffer.push({
        sessionId: "session_1",
        turnId: "turn_1",
        type: "token",
        content: `chunk_${i}`,
        timestamp: Date.now(),
      });
    }

    expect(ringBuffer.size).toBe(500);
    expect(ringBuffer.latestSeq).toBe(600);

    const all = ringBuffer.getAllEvents();
    expect(all.length).toBe(500);
    // The oldest item should be seqId 101 (first 100 evicted)
    expect(all[0]?.seqId).toBe(101);
    expect(all[0]?.content).toBe("chunk_101");
    // The latest item should be seqId 600
    expect(all[499]?.seqId).toBe(600);
    expect(all[499]?.content).toBe("chunk_600");
  });

  it("populates default timestamp when omitted or undefined", () => {
    const before = Date.now();
    const event = ringBuffer.push({
      sessionId: "session_1",
      turnId: "turn_1",
      type: "token",
      content: "Default timestamp test",
    });
    const after = Date.now();

    expect(event.timestamp).toBeGreaterThanOrEqual(before);
    expect(event.timestamp).toBeLessThanOrEqual(after);
  });

  it("getEventsSince(lastSeenSeq) returns all missing events since lastSeenSeq", () => {
    for (let i = 1; i <= 600; i++) {
      ringBuffer.push({
        sessionId: "session_1",
        turnId: "turn_1",
        type: "token",
        content: `chunk_${i}`,
        timestamp: Date.now(),
      });
    }

    // Client last saw sequence 550; should return exactly 50 events (seqId 551..600)
    const catchUp = ringBuffer.getEventsSince(550);
    expect(catchUp.length).toBe(50);
    expect(catchUp[0]?.seqId).toBe(551);
    expect(catchUp[catchUp.length - 1]?.seqId).toBe(600);
  });

  it("getEventsSince(0) returns all available buffered items when client reconnects after long drop", () => {
    for (let i = 1; i <= 600; i++) {
      ringBuffer.push({
        sessionId: "session_1",
        turnId: "turn_1",
        type: "token",
        content: `chunk_${i}`,
        timestamp: Date.now(),
      });
    }

    // Client last saw 0 (or dropped before buffer eviction); returns all 500 items currently in RAM
    const all = ringBuffer.getEventsSince(0);
    expect(all.length).toBe(500);
    expect(all[0]?.seqId).toBe(101);
  });

  it("getEventsSince(latestSeq) returns empty array when client is fully up to date", () => {
    ringBuffer.push({
      sessionId: "session_1",
      turnId: "turn_1",
      type: "token",
      content: "Hello",
      timestamp: Date.now(),
    });

    const upToDate = ringBuffer.getEventsSince(1);
    expect(upToDate).toEqual([]);

    const future = ringBuffer.getEventsSince(100);
    expect(future).toEqual([]);
  });

  it("clear() resets the buffer and sequence counters", () => {
    ringBuffer.push({
      sessionId: "session_1",
      turnId: "turn_1",
      type: "token",
      content: "Hello",
      timestamp: Date.now(),
    });
    expect(ringBuffer.size).toBe(1);

    ringBuffer.clear();
    expect(ringBuffer.size).toBe(0);
    expect(ringBuffer.latestSeq).toBe(0);
    expect(ringBuffer.getAllEvents()).toEqual([]);

    // Next push after clear starts at 1
    const next = ringBuffer.push({
      sessionId: "session_1",
      turnId: "turn_2",
      type: "token",
      content: "Fresh start",
      timestamp: Date.now(),
    });
    expect(next.seqId).toBe(1);
  });

  it("preserves tool metadata, thoughts, and error types across buffer operations", () => {
    const thoughtEvent = ringBuffer.push({
      sessionId: "session_1",
      turnId: "turn_1",
      type: "thought",
      content: "Analyzing repository layout...",
      timestamp: Date.now(),
    });

    const toolCallEvent = ringBuffer.push({
      sessionId: "session_1",
      turnId: "turn_1",
      type: "tool_call",
      content: "Running test suite",
      metadata: {
        name: "execute_bash",
        args: { command: "pnpm test" },
        durationMs: 350,
        exitCode: 0,
      },
      timestamp: Date.now(),
    });

    expect(thoughtEvent.type).toBe("thought");
    expect(toolCallEvent.type).toBe("tool_call");
    expect(toolCallEvent.metadata?.name).toBe("execute_bash");
    expect(toolCallEvent.metadata?.args).toEqual({ command: "pnpm test" });
  });
});
