import { describe, it, expect } from "vitest";
import { PromptBuilder } from "../src/prompt-builder.js";

describe("PromptBuilder (5-Layer Prompt Construction & LLM Prompt Caching)", () => {
  it("generates a structured prompt containing all 5 distinct layers", () => {
    const builder = new PromptBuilder();
    const result = builder.buildPrompt({
      workspacePath: "/home/tyra/projects/agent-harness",
      gitBranch: "feat/auth-middleware",
      recentDiff: "+ export function authenticate() { return true; }",
      history: ["User: Hello agent", "Assistant: Ready to assist."],
      userPrompt: "Refactor auth middleware to support refresh tokens",
    });

    expect(result.layers.layer1).toContain("REMOTE CODING AGENT HARNESS");
    expect(result.layers.layer1).toContain("HUMAN-IN-THE-LOOP SAFETY POLICY");
    expect(result.layers.layer2).toContain("FEW-SHOT PROTOCOL EXAMPLES");
    expect(result.layers.layer3).toContain("MCP TOOL DEFINITIONS & SCHEMAS");
    expect(result.layers.layer3).toContain("execute_bash");
    expect(result.layers.layer3).toContain("read_file");
    expect(result.layers.layer3).toContain("write_file");

    expect(result.layers.layer4).toContain("/home/tyra/projects/agent-harness");
    expect(result.layers.layer4).toContain("feat/auth-middleware");
    expect(result.layers.layer4).toContain("+ export function authenticate()");
    expect(result.layers.layer4).toContain("User: Hello agent");

    expect(result.layers.layer5).toContain("Refactor auth middleware to support refresh tokens");

    expect(result.fullPrompt).toContain(result.staticPrefix);
    expect(result.fullPrompt).toContain(result.dynamicSuffix);
  });

  it("guarantees that Layers 1-3 (staticPrefix) remain 100% byte-identical across disparate user turns", () => {
    const builder = new PromptBuilder();

    const turn1 = builder.buildPrompt({
      workspacePath: "/project/a",
      gitBranch: "main",
      userPrompt: "Fix typo in README",
    });

    const turn2 = builder.buildPrompt({
      workspacePath: "/project/b",
      gitBranch: "feat/complex-refactor",
      recentDiff: "- old code\n+ new code",
      history: ["Turn 1", "Turn 2", "Turn 3"],
      userPrompt: "Run database migration and seed data",
    });

    const turn3 = builder.buildPrompt({
      userPrompt: "Hello",
    });

    // Verify staticPrefix equality for provider prefix prompt caching
    expect(turn1.staticPrefix).toBe(turn2.staticPrefix);
    expect(turn2.staticPrefix).toBe(turn3.staticPrefix);
    expect(turn1.layers.layer1).toBe(turn2.layers.layer1);
    expect(turn1.layers.layer2).toBe(turn2.layers.layer2);
    expect(turn1.layers.layer3).toBe(turn2.layers.layer3);

    // Verify dynamic suffixes differ
    expect(turn1.dynamicSuffix).not.toBe(turn2.dynamicSuffix);
  });

  it("handles optional workspace metadata gracefully with defaults", () => {
    const builder = new PromptBuilder();
    const result = builder.buildPrompt({
      userPrompt: "Show status",
    });

    expect(result.layers.layer4).toContain("DYNAMIC WORKSPACE CONTEXT");
    expect(result.layers.layer5).toContain("Show status");
    expect(result.fullPrompt.length).toBeGreaterThan(100);
  });
});
