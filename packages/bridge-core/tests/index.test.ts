import { describe, it, expect } from "vitest";
import { RingBuffer, PromptBuilder, TrueForgeClient } from "../src/index.js";

describe("packages/bridge-core index module", () => {
  it("exports RingBuffer, PromptBuilder, and TrueForgeClient", () => {
    expect(RingBuffer).toBeDefined();
    expect(PromptBuilder).toBeDefined();
    expect(TrueForgeClient).toBeDefined();
  });
});
