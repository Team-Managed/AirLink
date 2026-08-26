/**
 * Skill & Plugin Architecture Types
 */

export interface SkillManifest {
  name: string;
  description: string;
  triggers?: string[] | undefined;
  toolsRequired?: string[] | undefined;
  tags?: string[] | undefined;
}

export interface Skill {
  manifest: SkillManifest;
  instructions: string;
  sourcePath?: string | undefined;
  isBuiltin: boolean;
}

export interface PluginManifest {
  name: string;
  version: string;
  description?: string | undefined;
  skillsPath?: string | undefined;
}

export interface SkillMatchResult {
  skill: Skill;
  confidence: number;
  matchedKeywords: string[];
}
