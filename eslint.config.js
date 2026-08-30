import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs}"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "off",
      "no-undef": "off",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "prefer-const": "error",
    },
  },
  {
    files: ["**/*.js", "**/*.cjs", "**/metro.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
