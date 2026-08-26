/**
 * esbuild bundle script for the Agent Remote VS Code extension.
 *
 * VS Code extensions must be CommonJS bundles — they cannot run as native ESM.
 * This script bundles all source + workspace dependencies into a single CJS file
 * that the VS Code extension host can load directly.
 */
import { build } from "esbuild";

const isWatch = process.argv.includes("--watch");

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  format: "cjs",          // Extension host requires CommonJS
  target: "node18",
  external: [
    "vscode",             // Provided by the extension host at runtime
  ],
  sourcemap: true,
  minify: false,          // Keep readable for debugging in development
  logLevel: "info",
};

if (isWatch) {
  const ctx = await build({ ...options, incremental: true });
  console.log("[esbuild] Watching for changes...");
  // esbuild v0.17+ watch API
  await ctx.watch?.();
} else {
  await build(options);
}
