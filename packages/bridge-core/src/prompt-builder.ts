import { SkillRegistry } from "./skills/skill-registry.js";
import type { Skill } from "./skills/types.js";

export interface PromptLayers {
  layer1: string; // Static System Role & Safety Invariants
  layer2: string; // Static Few-Shot Examples & Dynamic Skill Workflows
  layer3: string; // Static Tool Schemas (MCP)
  layer4: string; // Dynamic Workspace Context (Branch, Diff, Path, History)
  layer5: string; // Dynamic User Directive
}

export interface BuildPromptParams {
  userPrompt: string;
  workspacePath?: string;
  gitBranch?: string;
  recentDiff?: string;
  history?: string[];
  activeSkills?: Skill[];
}

export interface BuildPromptResult {
  fullPrompt: string;
  staticPrefix: string;
  dynamicSuffix: string;
  layers: PromptLayers;
  matchedSkills?: Skill[];
}

export class PromptBuilder {
  private readonly _skillRegistry: SkillRegistry;

  constructor(skillRegistry?: SkillRegistry) {
    this._skillRegistry = skillRegistry ?? new SkillRegistry();
  }

  get skillRegistry(): SkillRegistry {
    return this._skillRegistry;
  }

  /**
   * Layer 1: Static System Role & Safety Invariants (Byte-Identical)
   */
  private readonly _layer1: string = `=== LAYER 1: REMOTE CODING AGENT HARNESS ===
You are an expert autonomous software engineer operating via the Remote Agent Harness.
You execute code modifications, terminal commands, and repository refactors on a developer workstation.

HUMAN-IN-THE-LOOP SAFETY POLICY:
1. Destructive actions (overwriting files, executing build scripts, git reset/checkout, deleting files, network requests) require explicit approval.
2. All approvals will pause turn execution with an approval request and a 180-second timeout.
3. If an approval is rejected or times out, gracefully halt the action and explain alternative strategies.
4. Output concise thoughts and streaming reasoning tokens before calling tools.`;

  /**
   * Layer 2: Static Few-Shot Examples (Byte-Identical base)
   */
  private readonly _layer2Base: string = `=== LAYER 2: FEW-SHOT PROTOCOL EXAMPLES ===
Example 1 (Inspect & Edit):
User: "Refactor the auth middleware to support refresh tokens."
Thought: "I need to inspect the current auth middleware file first."
Tool: read_file({"path": "src/middleware/auth.ts"})
Result: "export function auth() { ... }"
Thought: "Now I'll write the updated middleware with refresh token validation."
Tool: write_file({"path": "src/middleware/auth.ts", "content": "..."})

Example 2 (Test & Verification):
User: "Run the test suite."
Thought: "I should run the unit tests via execute_bash."
Tool: execute_bash({"command": "pnpm test"})
Result: "PASS tests/protocol.test.ts"`;

  /**
   * Layer 3: Static Tool Schemas (MCP Tools) (Byte-Identical)
   */
  private readonly _layer3: string = `=== LAYER 3: MCP TOOL DEFINITIONS & SCHEMAS ===
The following Model Context Protocol (MCP) tools are available on the workstation:
- execute_bash(command: string): Executes a bash shell command in the workspace directory.
- read_file(path: string): Reads the verbatim content of a local file.
- write_file(path: string, content: string): Overwrites or creates a file with the provided content.
- list_directory(path: string): Lists directory contents and file sizes.
- get_git_diff(): Retrieves current uncommitted git changes.
- run_tests(filter?: string): Runs the test suite via pnpm test.
- run_typecheck(): Runs TypeScript compiler check.`;

  /**
   * Returns the concatenated byte-identical static prefix (Layers 1 + 2 + 3).
   */
  getStaticPrefix(): string {
    return `${this._layer1}\n\n${this._layer2Base}\n\n${this._layer3}`;
  }

  /**
   * Builds Layer 4 (Dynamic Workspace Context) from current environment state and matched skills.
   */
  private buildLayer4(params: BuildPromptParams, matchedSkills: Skill[]): string {
    const lines: string[] = ["=== LAYER 4: DYNAMIC WORKSPACE CONTEXT ==="];

    lines.push(`- Workspace Path: ${params.workspacePath || "Default Workspace"}`);
    lines.push(`- Active Git Branch: ${params.gitBranch || "main"}`);

    if (params.recentDiff && params.recentDiff.trim().length > 0) {
      lines.push("\nRecent Git Diff Checkpoint:");
      lines.push("```diff");
      lines.push(params.recentDiff.trim());
      lines.push("```");
    }

    if (matchedSkills.length > 0) {
      lines.push(`\n${this._skillRegistry.formatSkillsForPrompt(matchedSkills)}`);
    }

    if (params.history && params.history.length > 0) {
      lines.push("\nRecent Conversation History:");
      for (const h of params.history) {
        lines.push(`- ${h}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Builds Layer 5 (Dynamic User Directive) from the active user prompt.
   */
  private buildLayer5(userPrompt: string): string {
    return `=== LAYER 5: DYNAMIC USER DIRECTIVE ===\nUser Request: ${userPrompt.trim()}`;
  }

  /**
   * Constructs the complete 5-layer prompt with matched skill recipes.
   */
  buildPrompt(params: BuildPromptParams): BuildPromptResult {
    const matched =
      params.activeSkills || this._skillRegistry.matchSkills(params.userPrompt).map((m) => m.skill);

    const layer1 = this._layer1;
    const layer2 = this._layer2Base;
    const layer3 = this._layer3;
    const layer4 = this.buildLayer4(params, matched);
    const layer5 = this.buildLayer5(params.userPrompt);

    const staticPrefix = this.getStaticPrefix();
    const dynamicSuffix = `${layer4}\n\n${layer5}`;
    const fullPrompt = `${staticPrefix}\n\n${dynamicSuffix}`;

    return {
      fullPrompt,
      staticPrefix,
      dynamicSuffix,
      layers: {
        layer1,
        layer2,
        layer3,
        layer4,
        layer5,
      },
      matchedSkills: matched,
    };
  }
}
