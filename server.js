const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");
const cfg = require("./src/config");
const { complete, embed } = require("./src/providers");
const { indexPaths, queryRag } = require("./src/rag");

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((r) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => r(b));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true });

  if (req.method === "GET" && url.pathname === "/") {
    try {
      const html = fs.readFileSync(path.join(__dirname, "static", "index.html"), "utf8");
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(html);
    } catch (e) {
      res.statusCode = 404;
      return res.end("missing static/index.html");
    }
  }

  if (req.method === "POST" && url.pathname === "/ai/complete") {
    try {
      const body = JSON.parse((await readBody(req)) || "{}");
      const system = String(body.system || "");
      const input = String(body.input || "");
      const out = await complete({ system, user: input });
      return json(res, 200, { output: out });
    } catch (e) {
console.error(e instanceof Error ? e.stack || e.message : e); return json(res, 500, { error: "An internal error occurred" });
    }
  }

  if (req.method === "POST" && url.pathname === "/ai/embed") {
    try {
      const body = JSON.parse((await readBody(req)) || "{}");
      const texts = Array.isArray(body.text) ? body.text.map(String) : [String(body.text || "")];
      if (!texts[0]) return json(res, 400, { error: "text required" });
      const vecs = await embed({ input: texts });
      return json(res, 200, { embeddings: vecs });
    } catch (e) {
console.error(e instanceof Error ? e.stack || e.message : e); return json(res, 500, { error: "An internal error occurred" });
    }
  }

  if (req.method === "POST" && url.pathname === "/rag/index") {
    try {
      const body = JSON.parse((await readBody(req)) || "{}");
      const paths = Array.isArray(body.paths) ? body.paths : [];
      if (!paths.length) return json(res, 400, { error: "paths required" });
      const out = await indexPaths(paths);
      return json(res, 200, out);
    } catch (e) {
console.error(e instanceof Error ? e.stack || e.message : e); return json(res, 500, { error: "An internal error occurred" });
    }
  }

  if (req.method === "POST" && url.pathname === "/rag/query") {
    try {
      const body = JSON.parse((await readBody(req)) || "{}");
      const q = String(body.q || "");
      const k = body.k ? Number(body.k) : 5;
      if (!q) return json(res, 400, { error: "q required" });
      const out = await queryRag(q, k);
      return json(res, 200, out);
    } catch (e) {
console.error(e instanceof Error ? e.stack || e.message : e); return json(res, 500, { error: "An internal error occurred" });
    }
  }

  if (req.method === "POST" && url.pathname === "/rag/answer") {
    try {
      const body = JSON.parse((await readBody(req)) || "{}");
      const q = String(body.q || "");
      const k = body.k ? Number(body.k) : 5;
      if (!q) return json(res, 400, { error: "q required" });

      const found = await queryRag(q, k);
      const best = found.results && found.results[0];
      let answer,
        citations = [];

      if (best && typeof best.score === "number" && best.score >= 0.5) {
        const size = 800,
          overlap = 200;
        const docs = found.results.map((r) => {
          const content = fs.readFileSync(r.path, "utf8");
          const start = r.idx * (size - overlap);
          return content.slice(start, start + size);
        });
        const system = "Answer briefly using only the provided context.";
        const user = `Question:\n${q}\n\nContext:\n${docs.join("\n---\n")}\n\nAnswer:`;
        answer = await complete({ system, user });
        citations = found.results.map(({ path: p, idx, score }) => ({ path: p, idx, score }));
      } else {
        const system = "Answer briefly and clearly.";
        answer = await complete({ system, user: q });
        citations = [];
      }

      return json(res, 200, { answer, citations });
    } catch (e) {
console.error(e instanceof Error ? e.stack || e.message : e); return json(res, 500, { error: "An internal error occurred" });
    }
  }

  res.statusCode = 404;
  res.end("Not found");
});

const PORT = process.env.PORT || cfg.PORT || 3002;
server.listen(PORT, () => process.stdout.write(`ai-app listening on http://localhost:${PORT}\n`));
