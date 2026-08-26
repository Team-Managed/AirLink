import { describe, it, expect } from "vitest";
import { getGitDiff, fetchGitHubIssue } from "../src/workspace-tools.js";

describe("Workspace Tools Suite", () => {
  it("retrieves git diff or clean working tree message", async () => {
    const diff = await getGitDiff(process.cwd());
    expect(typeof diff).toBe("string");
    expect(diff.length).toBeGreaterThan(0);
  });

  it("handles GitHub issue resolution gracefully", async () => {
    const issue = await fetchGitHubIssue(42, process.cwd());
    expect(issue).toHaveProperty("title");
    expect(issue).toHaveProperty("body");
    expect(issue.title).toContain("42");
  });
});
