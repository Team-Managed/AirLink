import { describe, it, expect } from "vitest";
import { SkillRegistry, parseSkillMarkdown, PromptBuilder } from "../src/index.js";

describe("Skill & Plugin Architecture Suite", () => {
  it("parses YAML frontmatter and markdown body correctly", () => {
    const rawMarkdown = `---
name: custom-db-skill
description: Optimizes PostgreSQL indexes and queries
triggers:
  - postgres
  - database
  - sql
toolsRequired:
  - execute_bash
tags:
  - database
  - performance
---
# Database Optimization Guide
1. Run EXPLAIN ANALYZE.
2. Check missing composite indexes.`;

    const skill = parseSkillMarkdown(rawMarkdown, "skills/custom-db-skill/SKILL.md", false);
    expect(skill.manifest.name).toBe("custom-db-skill");
    expect(skill.manifest.description).toBe("Optimizes PostgreSQL indexes and queries");
    expect(skill.manifest.triggers).toEqual(["postgres", "database", "sql"]);
    expect(skill.manifest.toolsRequired).toEqual(["execute_bash"]);
    expect(skill.instructions).toContain("Run EXPLAIN ANALYZE");
    expect(skill.isBuiltin).toBe(false);
  });

  it("handles fallback parsing when frontmatter is missing", () => {
    const rawMarkdown = "# Plain Skill\nDirect instruction text";
    const skill = parseSkillMarkdown(rawMarkdown, "skills/plain-skill/SKILL.md", false);
    expect(skill.manifest.name).toBe("plain-skill");
    expect(skill.instructions).toBe("# Plain Skill\nDirect instruction text");
  });

  it("loads all core builtin skills on initialization", () => {
    const registry = new SkillRegistry({ loadBuiltins: true });
    const skills = registry.listSkills();

    expect(skills.length).toBeGreaterThanOrEqual(5);
    const names = skills.map((s) => s.manifest.name);
    expect(names).toContain("git-workflow-and-versioning");
    expect(names).toContain("test-driven-development");
    expect(names).toContain("code-review-and-quality");
    expect(names).toContain("systematic-debugging");
    expect(names).toContain("issue-resolver");
  });

  it("matches user intent and triggers dynamically", () => {
    const registry = new SkillRegistry({ loadBuiltins: true });

    const gitMatches = registry.matchSkills("Please commit these changes to a new git branch");
    expect(gitMatches.length).toBeGreaterThan(0);
    expect(gitMatches[0]!.skill.manifest.name).toBe("git-workflow-and-versioning");

    const tddMatches = registry.matchSkills("We have a failing unit test in the test suite");
    expect(tddMatches.length).toBeGreaterThan(0);
    expect(tddMatches[0]!.skill.manifest.name).toBe("test-driven-development");

    const reviewMatches = registry.matchSkills(
      "Run a thorough code review and security audit on this PR",
    );
    expect(reviewMatches.length).toBeGreaterThan(0);
    expect(reviewMatches[0]!.skill.manifest.name).toBe("code-review-and-quality");
  });

  it("allows registering dynamic user plugins at runtime", () => {
    const registry = new SkillRegistry({ loadBuiltins: false });
    expect(registry.listSkills().length).toBe(0);

    registry.registerSkill({
      manifest: {
        name: "docker-optimizer",
        description: "Optimizes container Dockerfiles and multi-stage builds",
        triggers: ["docker", "container", "dockerfile"],
      },
      instructions: "Minimize layer caching and strip build dependencies.",
      isBuiltin: false,
    });

    expect(registry.listSkills().length).toBe(1);
    const match = registry.matchSkills("How can I optimize this Dockerfile?")[0];
    expect(match?.skill.manifest.name).toBe("docker-optimizer");
    expect(match?.confidence).toBeGreaterThan(0);
  });

  it("injects matched skills into Layer 4 / PromptBuilder automatically", () => {
    const registry = new SkillRegistry({ loadBuiltins: true });
    const promptBuilder = new PromptBuilder(registry);

    const promptResult = promptBuilder.buildPrompt({
      userPrompt: "Please review the security and quality of our current git diff",
      workspacePath: "/repo/test",
    });

    expect(promptResult.fullPrompt).toContain("=== LAYER 1: REMOTE CODING AGENT HARNESS ===");
    expect(promptResult.fullPrompt).toContain("=== LAYER 2: FEW-SHOT PROTOCOL EXAMPLES ===");
    expect(promptResult.fullPrompt).toContain("=== LAYER 3: MCP TOOL DEFINITIONS & SCHEMAS ===");
    expect(promptResult.fullPrompt).toContain("=== LAYER 4: DYNAMIC WORKSPACE CONTEXT ===");
    expect(promptResult.fullPrompt).toContain("=== LAYER 5: DYNAMIC USER DIRECTIVE ===");

    // Verifies matched skill injection
    expect(promptResult.matchedSkills?.length).toBeGreaterThan(0);
    expect(promptResult.fullPrompt).toContain("code-review-and-quality");
  });
});
