import type { Skill, SkillManifest } from "./types.js";

/**
 * Parses frontmatter and markdown body from a SKILL.md file content string.
 */
export function parseSkillMarkdown(content: string, sourcePath?: string, isBuiltin: boolean = false): Skill {
  const trimmed = content.trim();

  // Check for YAML frontmatter delimiters (--- ... ---)
  if (trimmed.startsWith("---")) {
    const secondDelimiter = trimmed.indexOf("---", 3);
    if (secondDelimiter !== -1) {
      const frontmatterBlock = trimmed.slice(3, secondDelimiter).trim();
      const body = trimmed.slice(secondDelimiter + 3).trim();
      const manifest = parseYamlFrontmatter(frontmatterBlock);

      return {
        manifest,
        instructions: body,
        sourcePath,
        isBuiltin,
      };
    }
  }

  // Fallback if no frontmatter is found
  return {
    manifest: {
      name: sourcePath ? sourcePath.split(/[/\\]/).slice(-2, -1)[0] || "unnamed-skill" : "unnamed-skill",
      description: "Custom user workflow skill",
    },
    instructions: trimmed,
    sourcePath,
    isBuiltin,
  };
}

/**
 * Lightweight parser for YAML key-value pairs and arrays.
 */
export function parseYamlFrontmatter(yamlText: string): SkillManifest {
  const lines = yamlText.split("\n");
  const result: Record<string, unknown> = {};

  let currentArrayKey: string | null = null;
  let currentArray: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Array item
    if (trimmed.startsWith("- ") && currentArrayKey) {
      currentArray.push(trimmed.slice(2).trim());
      continue;
    }

    // Flush previous array
    if (currentArrayKey) {
      result[currentArrayKey] = currentArray;
      currentArrayKey = null;
      currentArray = [];
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx !== -1) {
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();

      if (!val) {
        // Starts a multi-line array
        currentArrayKey = key;
        currentArray = [];
      } else if (val.startsWith("[") && val.endsWith("]")) {
        // Inline array e.g. [a, b, c]
        result[key] = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else {
        // Simple scalar string
        result[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }

  if (currentArrayKey) {
    result[currentArrayKey] = currentArray;
  }

  return {
    name: String(result["name"] || "custom-skill"),
    description: String(result["description"] || ""),
    triggers: Array.isArray(result["triggers"]) ? result["triggers"].map(String) : undefined,
    toolsRequired: Array.isArray(result["toolsRequired"]) ? result["toolsRequired"].map(String) : undefined,
    tags: Array.isArray(result["tags"]) ? result["tags"].map(String) : undefined,
  };
}
