import { describe, it, expect } from "vitest";
import type { StreamFeedItem } from "../src/types.js";

describe("Terminal Feed Stream State & Item Management", () => {
  it("creates valid stream feed items with sequence ordering", () => {
    const items: StreamFeedItem[] = [
      {
        id: "item_1",
        seqId: 1,
        type: "thought",
        content: "Inspecting directory layout...",
        timestamp: 1000,
      },
      {
        id: "item_2",
        seqId: 2,
        type: "tool_call",
        content: "ls -la",
        metadata: { name: "execute_bash" },
        timestamp: 1050,
      },
      {
        id: "item_3",
        seqId: 3,
        type: "tool_result",
        content: "package.json src/",
        metadata: { name: "execute_bash", durationMs: 45, exitCode: 0 },
        timestamp: 1100,
      },
      {
        id: "item_4",
        seqId: 4,
        type: "token",
        content: "The directory contains package.json and src/.",
        timestamp: 1150,
      },
    ];

    expect(items).toHaveLength(4);
    expect(items[0]?.type).toBe("thought");
    expect(items[1]?.type).toBe("tool_call");
    expect(items[2]?.metadata?.durationMs).toBe(45);
    expect(items[3]?.content).toContain("package.json");
  });

  it("aggregates consecutive token chunks correctly", () => {
    const feed: StreamFeedItem[] = [];
    const chunks = ["Hello ", "world, ", "how are ", "you?"];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      const last = feed[feed.length - 1];
      if (last && last.type === "token") {
        last.content += chunk;
      } else {
        feed.push({
          id: `token_${i}`,
          seqId: i + 1,
          type: "token",
          content: chunk,
          timestamp: Date.now(),
        });
      }
    }

    expect(feed).toHaveLength(1);
    expect(feed[0]?.content).toBe("Hello world, how are you?");
  });
});
