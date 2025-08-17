const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { languageOptions: { globals: { ...globals.node } } },
  js.configs.recommended,
  { ignores: ["node_modules/**","dist/**","data/**"] }
];
