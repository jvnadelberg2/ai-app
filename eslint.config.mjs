import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "dist/**", "data/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: { "no-unused-vars": ["error", { "varsIgnorePattern": "^(?:_|e)$", "argsIgnorePattern": "^_", "caughtErrors": "all", "caughtErrorsIgnorePattern": "^_" }] },
  },
];
