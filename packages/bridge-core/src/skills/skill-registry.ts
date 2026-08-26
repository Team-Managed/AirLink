import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Skill, SkillMatchResult } from "./types.js";
import { parseSkillMarkdown } from "./skill-parser.js";
import { BUILTIN_SKILLS } from "./builtins.js";

export interface SkillRegistryOptions {
  workspacePath?: string | undefined;
  extraSkillDirs?: string[] | undefined;
  loadBuiltins?: boolean | undefined;
}

/**
 * SkillRegistry
 * Manages discovery, registration, and prompt-matching for modular SKILL.md plugins.
 */
export class SkillRegistry {
  private readonly _skills = new Map<string, Skill>();
  private readonly _workspacePath: string;

  constructor(options: SkillRegistryOptions = {}) {
    this._workspacePath = options.workspacePath || process.cwd();

    // 1. Load Builtin Skills
    if (options.loadBuiltins !== false) {
      for (const skill of BUILTIN_SKILLS) {
        this._skills.set(skill.manifest.name, skill);
      }
    }

    // 2. Discover workspace skills and user plugins
    this.discoverSkills(options.extraSkillDirs);
  }

  /**
   * Discovers and loads all SKILL.md files from filesystem locations.
   */
  public discoverSkills(extraDirs?: string[]): void {
    const candidateDirs = [
      path.resolve(this._workspacePath, "skills"),
      path.resolve(this._workspacePath, ".agent", "skills"),
      path.resolve(os.homedir(), ".agent-remote", "skills"),
      ...(extraDirs || []),
    ];

    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillFilePath = path.join(dir, entry.name, "SKILL.md");
            if (fs.existsSync(skillFilePath)) {
              try {
                const content = fs.readFileSync(skillFilePath, "utf-8");
                const skill = parseSkillMarkdown(content, skillFilePath, false);
                this._skills.set(skill.manifest.name, skill);
              } catch {
                // Ignore corrupt individual skill files
              }
            }
          }
        }
      } catch {
        // Safe directory discovery
      }
    }
  }

  /**
   * Registers a custom skill directly.
   */
  public registerSkill(skill: Skill): void {
    this._skills.set(skill.manifest.name, skill);
  }

  /**
   * Retrieves a skill by name.
   */
  public getSkill(name: string): Skill | undefined {
    return this._skills.get(name);
  }

  /**
   * Returns all currently registered skills.
   */
  public listSkills(): Skill[] {
    return Array.from(this._skills.values());
  }

  /**
   * Matches the active user prompt against triggers and keywords of registered skills.
   */
  public matchSkills(prompt: string, maxMatches: number = 2): SkillMatchResult[] {
    const lowerPrompt = prompt.toLowerCase();
    const promptWords = new Set(lowerPrompt.split(/\W+/).filter(Boolean));
    const results: SkillMatchResult[] = [];

    for (const skill of this._skills.values()) {
      let confidence = 0;
      const matchedKeywords: string[] = [];

      // 1. Check explicit triggers
      if (skill.manifest.triggers) {
        for (const trigger of skill.manifest.triggers) {
          const triggerLower = trigger.toLowerCase();
          if (lowerPrompt.includes(triggerLower)) {
            confidence += 0.5;
            matchedKeywords.push(trigger);
          }
        }
      }

      // 2. Check skill name
      const nameParts = skill.manifest.name.toLowerCase().split("-");
      for (const part of nameParts) {
        if (promptWords.has(part)) {
          confidence += 0.3;
          matchedKeywords.push(part);
        }
      }

      // 3. Check description words
      if (skill.manifest.description) {
        const descWords = skill.manifest.description.toLowerCase().split(/\W+/);
        for (const word of descWords) {
          if (word.length > 3 && promptWords.has(word)) {
            confidence += 0.1;
          }
        }
      }

      if (confidence > 0) {
        results.push({
          skill,
          confidence: Math.min(confidence, 1.0),
          matchedKeywords: Array.from(new Set(matchedKeywords)),
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, maxMatches);
  }

  /**
   * Formats active matched skills as Layer 2 instructions for the prompt.
   */
  public formatSkillsForPrompt(matchedSkills: Skill[]): string {
    if (matchedSkills.length === 0) return "";

    const lines = ["=== ACTIVE AGENT SKILLS & WORKFLOWS ==="];
    for (const skill of matchedSkills) {
      lines.push(`\n### Skill: ${skill.manifest.name}`);
      if (skill.manifest.description) {
        lines.push(`Description: ${skill.manifest.description}`);
      }
      lines.push(skill.instructions);
    }
    return lines.join("\n");
  }
}
