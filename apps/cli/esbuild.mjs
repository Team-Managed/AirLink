/**
 * esbuild bundle script for AirLink standalone CLI binary.
 *
 * Bundles TypeScript source, monorepo workspace dependencies (@airlink/bridge-core,
 * @airlink/protocol), and third-party packages into a single self-contained CommonJS
 * executable binary for npm registry distribution.
 */
import { build } from "esbuild";

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/bin.ts"],
  bundle: true,
  outfile: "dist/bin.cjs",
  platform: "node",
  format: "cjs",
  target: "node18",
  sourcemap: true,
  minify: false,
  logLevel: "info",
};

await build(options);
