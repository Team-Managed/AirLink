import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, "./tests/vscode-mock.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
