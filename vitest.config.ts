import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, "apps/vscode-extension/tests/vscode-mock.ts"),
      "react-native": path.resolve(__dirname, "apps/mobile/tests/react-native-mock.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/**", "dist/**", "**/*.d.ts", "tests/**", "**/tests/**", "scripts/**"],
    },
  },
});
