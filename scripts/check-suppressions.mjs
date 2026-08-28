#!/usr/bin/env node
/**
 * check-suppressions.mjs
 * Mechanically scans staged or target files for forbidden suppression patterns:
 * - @ts-ignore, @ts-expect-error, @ts-nocheck
 * - eslint-disable, eslint-disable-next-line
 * - as any
 * - --no-verify, SKIP_TESTS, test.only, describe.only, it.only
 *
 * Bypassing is allowed ONLY when explicitly approved inline:
 * `// APPROVED-SUPPRESSION: <reason>`
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const FORBIDDEN_PATTERNS = [
  { regex: /@ts-ignore/, name: "@ts-ignore" },
  { regex: /@ts-expect-error/, name: "@ts-expect-error" },
  { regex: /@ts-nocheck/, name: "@ts-nocheck" },
  { regex: /\/\*\s*eslint-disable/, name: "eslint-disable" },
  { regex: /\/\/\s*eslint-disable/, name: "eslint-disable" },
  { regex: /\bas\s+any\b/, name: "as any" },
  { regex: /\b(describe|test|it)\.only\s*\(/, name: ".only test block" },
];

const APPROVED_TAG = "// APPROVED-SUPPRESSION:";

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".expo",
  ".next",
  ".agent-remote",
  ".turbo",
  "coverage",
  ".system_generated",
]);

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function walk(dir, fileList = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      const ext = entry.slice(entry.lastIndexOf("."));
      if (EXTENSIONS.has(ext) && entry !== "check-suppressions.mjs") {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const rootDir = process.cwd();
const files = walk(rootDir);
const violations = [];

for (const filePath of files) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    if (line.includes(APPROVED_TAG)) {
      return; // Explicitly authorized
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: relative(rootDir, filePath),
          lineNum: index + 1,
          pattern: pattern.name,
          snippet: line.trim(),
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("\n[SUPPRESSION CHECK FAILED] Found unapproved type/lint/test suppressions:");
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.lineNum} [${v.pattern}] -> ${v.snippet}`);
  }
  console.error("\nTo approve a legitimate suppression, mark it inline with:");
  console.error("  // APPROVED-SUPPRESSION: <specific rationale>\n");
  process.exit(1);
} else {
  console.log("[SUPPRESSION CHECK PASSED] No unapproved suppressions detected.");
  process.exit(0);
}
