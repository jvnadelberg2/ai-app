const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: { globals: { ...globals.node } },
  },
  js.configs.recommended,
  { ignores: ["node_modules/**","dist/**","data/**",".github/**"] }
];
