import { describe, it, expect } from "vitest";
import { EventRingBuffer } from "../src/ring-buffer.js";
import type { AgentStream, StreamBatch } from "@agent-remote/protocol";

describe("Reconnect Resilience & Stream Hydration (The Elevator Problem)", () => {
  it("replays strictly missed sequence IDs upon client:sync after disconnection", () => {
    const ringBuffer = new EventRingBuffer(500);

    // 1. Emit 10 sequential events during an active turn
    for (let i = 1; i <= 10; i++) {
      ringBuffer.push({
        sessionId: "sess_reconnect_test",
        turnId: "turn_1",
        type: "token",
        content: `Token chunk #${i}`,
        timestamp: 1000 + i,
      });
    }

    expect(ringBuffer.size).toBe(10);
    expect(ringBuffer.latestSeq).toBe(10);

    // 2. Simulate client disconnecting after receiving event with seqId: 4
    const clientLastSeenSeq = 4;

    // 3. Query events since seqId 4 (reconnect sync)
    const missedEvents: AgentStream[] = ringBuffer.getEventsSince(clientLastSeenSeq);

    // 4. Verify batch contains exactly seqId 5 through 10
    expect(missedEvents).toHaveLength(6);
    expect(missedEvents.map((e) => e.seqId)).toEqual([5, 6, 7, 8, 9, 10]);

    // 5. Construct typed StreamBatch payload
    const batchPayload: StreamBatch = {
      sessionId: "sess_reconnect_test",
      events: missedEvents,
      fromSeq: missedEvents[0]?.seqId,
      toSeq: missedEvents[missedEvents.length - 1]?.seqId,
    };

    expect(batchPayload.fromSeq).toBe(5);
    expect(batchPayload.toSeq).toBe(10);
    expect(batchPayload.events[0]?.content).toBe("Token chunk #5");
    expect(batchPayload.events[5]?.content).toBe("Token chunk #10");
  });

  it("returns an empty array when client is already fully synchronized (lastSeenSeq === latestSeq)", () => {
    const ringBuffer = new EventRingBuffer(500);

    for (let i = 1; i <= 5; i++) {
      ringBuffer.push({
        sessionId: "sess_synced",
        turnId: "turn_1",
        type: "token",
        content: `Chunk ${i}`,
        timestamp: Date.now(),
      });
    }

    const missed = ringBuffer.getEventsSince(5);
    expect(missed).toHaveLength(0);
  });

  it("returns all available events when client reconnects with lastSeenSeq: 0 (cold start / fresh tab)", () => {
    const ringBuffer = new EventRingBuffer(500);

    for (let i = 1; i <= 8; i++) {
      ringBuffer.push({
        sessionId: "sess_fresh",
        turnId: "turn_1",
        type: "token",
        content: `Chunk ${i}`,
        timestamp: Date.now(),
      });
    }

    const allEvents = ringBuffer.getEventsSince(0);
    expect(allEvents).toHaveLength(8);
    expect(allEvents.map((e) => e.seqId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
