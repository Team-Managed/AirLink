import { describe, it, expect } from "vitest";
import { QUICK_ACTIONS } from "../src/components/PromptInputBar.js";

describe("Prompt Input Bar Quick Actions", () => {
  it("defines clean developer quick actions without emojis", () => {
    expect(QUICK_ACTIONS.length).toBeGreaterThanOrEqual(6);

    const labels = QUICK_ACTIONS.map((a) => a.label);
    expect(labels).toContain("Create PR");
    expect(labels).toContain("Import Issue");
    expect(labels).toContain("Run Tests");
    expect(labels).toContain("Git Status");
    expect(labels).toContain("Fix Lint");
    expect(labels).toContain("Rollback");

    // Verify no emoji characters in labels
    for (const action of QUICK_ACTIONS) {
      expect(action.label).toMatch(/^[a-zA-Z0-9\s]+$/);
    }
  });

  it("contains descriptive prompt templates for each action", () => {
    const createPr = QUICK_ACTIONS.find((a) => a.id === "create-pr");
    expect(createPr?.promptText).toContain("Pull Request");

    const runTests = QUICK_ACTIONS.find((a) => a.id === "run-tests");
    expect(runTests?.promptText).toContain("failing tests");
  });
});
