const fs = require("fs");
const path = require("path");
const CONFIG_PATH = path.join(__dirname, "config.json");
const defaults = {
  OLLAMA_BASE: "http://localhost:11434",
  OLLAMA_CHAT_MODEL: "phi3:mini",
  OLLAMA_EMB_MODEL: "nomic-embed-text",
  RAG_DB: path.join(process.cwd(), "data", "rag.json"),
  PORT: 3002,
  TEMPERATURE: 0,
  TOP_P: 1,
  TOP_K: 1,
  SEED: 42,
};
function load() {
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) };
  } catch {
    return defaults;
  }
}
module.exports = load();
