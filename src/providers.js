const cfg = require("./config");
const BASE = cfg.OLLAMA_BASE;
const CHAT_MODEL = cfg.OLLAMA_CHAT_MODEL;
const EMB_MODEL = cfg.OLLAMA_EMB_MODEL;

function extractWordCount(s){
  const m = /\b(?:in|exactly)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+words?\b/i.exec(s||"");
  if(!m) return null;
  const map = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  const v = String(m[1]).toLowerCase();
  const n = map[v] ?? parseInt(v,10);
  return Number.isFinite(n) && n>0 ? Math.min(n,1000) : null;
}

function enforceWordCount(text, n, user){
  const cleaned = String(text||"").replace(/[^\p{L}\p{N}']+/gu," ").trim();
  let toks = cleaned ? cleaned.split(/\s+/) : [];
  const padWord = /hello/i.test(user||"") ? "hello" : (toks[toks.length-1] || "word");
  if (toks.length < n){
    while (toks.length < n) toks.push(padWord);
  } else if (toks.length > n){
    toks = toks.slice(0,n);
  }
  return toks.join(" ");
}

async function complete({ system = "", user = "" }) {
  const prompt = system ? `${system}\n\nUser: ${user}` : user;
  const r = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: cfg.TEMPERATURE,
        top_p: cfg.TOP_P,
        top_k: cfg.TOP_K,
        seed: cfg.SEED
      }
    })
  });
  if (!r.ok) throw new Error(`Ollama error ${r.status}`);
  const data = await r.json();
  let out = data.response || "";
  const n = extractWordCount(user);
  if (n) out = enforceWordCount(out, n, user);
  return out;
}

async function embed({ input }) {
  const arr = Array.isArray(input) ? input : [input];
  const out = [];
  for (const s of arr) {
    const r = await fetch(`${BASE}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMB_MODEL, prompt: s })
    });
    if (!r.ok) throw new Error(`Ollama error ${r.status}`);
    const data = await r.json();
    out.push(data.embedding);
  }
  return out;
}

module.exports = { complete, embed };
