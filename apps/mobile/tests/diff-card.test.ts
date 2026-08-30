import { describe, it, expect } from "vitest";
import { parseUnifiedDiff } from "../src/components/DiffCard.js";

describe("Unified Diff Parser (DiffCard)", () => {
  const sampleDiff = `diff --git a/src/auth/middleware.ts b/src/auth/middleware.ts
index 834192..938210 100644
--- a/src/auth/middleware.ts
+++ b/src/auth/middleware.ts
@@ -1,5 +1,7 @@
 import { Request, Response } from "express";
+import { verifyToken } from "./jwt.js";
-const secret = "insecure";
+const secret = process.env.JWT_SECRET;
+const maxAge = 3600;
 
 export function auth() {
`;

  it("extracts the target file path correctly", () => {
    const parsed = parseUnifiedDiff(sampleDiff);
    expect(parsed.filePath).toBe("src/auth/middleware.ts");
    expect(parsed.oldFile).toBe("src/auth/middleware.ts");
    expect(parsed.newFile).toBe("src/auth/middleware.ts");
  });

  it("calculates accurate addition and deletion counts", () => {
    const parsed = parseUnifiedDiff(sampleDiff);
    expect(parsed.additions).toBe(3);
    expect(parsed.deletions).toBe(1);
  });

  it("parses hunks and tags line types accurately", () => {
    const parsed = parseUnifiedDiff(sampleDiff);
    expect(parsed.hunks).toHaveLength(1);

    const hunk = parsed.hunks[0]!;
    expect(hunk.header).toBe("@@ -1,5 +1,7 @@");

    const addLines = hunk.lines.filter((l) => l.type === "add");
    const delLines = hunk.lines.filter((l) => l.type === "delete");
    const contextLines = hunk.lines.filter((l) => l.type === "context");

    expect(addLines).toHaveLength(3);
    expect(delLines).toHaveLength(1);
    expect(contextLines.length).toBeGreaterThan(0);

    expect(addLines[0]?.content).toBe('import { verifyToken } from "./jwt.js";');
    expect(delLines[0]?.content).toBe('const secret = "insecure";');
  });

  it("handles multi-hunk unified diffs correctly", () => {
    const multiHunkDiff = `--- a/config.json
+++ b/config.json
@@ -10,3 +10,4 @@
   "port": 3000,
+  "host": "0.0.0.0",
   "enabled": true
@@ -25,2 +26,3 @@
-  "mode": "dev"
+  "mode": "prod"
+  "debug": false
`;
    const parsed = parseUnifiedDiff(multiHunkDiff, "config.json");
    expect(parsed.hunks).toHaveLength(2);
    expect(parsed.additions).toBe(3);
    expect(parsed.deletions).toBe(1);
  });

  it("falls back gracefully when parsing unstructured patch strings", () => {
    const rawPatch = `+console.log("hello world");\n-console.log("old");`;
    const parsed = parseUnifiedDiff(rawPatch, "fallback.js");
    expect(parsed.filePath).toBe("fallback.js");
    expect(parsed.additions).toBe(1);
    expect(parsed.deletions).toBe(1);
    expect(parsed.hunks).toHaveLength(1);
  });
});
