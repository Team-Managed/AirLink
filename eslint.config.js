import js from "@eslint/js";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**", "**/.next/**", "**/.turbo/**"],
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-undef": "off",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "prefer-const": "error",
    },
  },
];
