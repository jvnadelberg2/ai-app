"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const STATIC_DIR = path.resolve(__dirname, "static");

// Safely try to load providers (optional)
let runComplete = async () => {
  throw new Error("providers.complete is not implemented");
};
let runEmbed = async () => {
  throw new Error("providers.embed is not implemented");
};
try {
  // If your providers use CommonJS exports:
  //   module.exports = { complete, embed }
  // this require will work. If they’re ESM-only and you need import(),
  // feel free to tell me and I’ll swap it.

  const providers = require("./src/providers.js");
  if (typeof providers.complete === "function") runComplete = providers.complete;
  if (typeof providers.embed === "function") runEmbed = providers.embed;
} catch (err) {
  // Not fatal; routes will still respond with a handled 500
  console.warn("providers.js not loaded:", err?.message || err);
}

// Unified JSON responder that works with plain http.ServerResponse
function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(payload));
  res.end(payload);
}

// Read & parse JSON body with a size limit
async function readJson(req, res, limitBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  return new Promise((resolve) => {
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        json(res, 413, { error: "Payload too large" });
        req.destroy();
        resolve(undefined);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        json(res, 400, { error: "Empty request body" });
        resolve(undefined);
        return;
      }
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        const obj = JSON.parse(text);
        resolve(obj);
      } catch (err) {
        console.error("JSON parse error:", err?.stack || err?.message || err);
        json(res, 400, { error: "Invalid JSON" });
        resolve(undefined);
      }
    });
    req.on("error", (err) => {
      console.error("Request stream error:", err?.stack || err?.message || err);
      json(res, 400, { error: "Bad request" });
      resolve(undefined);
    });
  });
}

// Very small static file server
function serveStatic(req, res, url) {
  // Root -> serve index.html
  if (url.pathname === "/") {
    return sendFile(path.join(STATIC_DIR, "index.html"), "text/html; charset=utf-8", res);
  }

  // /static/* -> serve from /static directory
  if (url.pathname.startsWith("/static/")) {
    const safeRel = url.pathname.replace(/^\/static\//, "");
    const safePath = path.normalize(safeRel).replace(/^(\.\.[/\\])+/g, "");
    const filePath = path.join(STATIC_DIR, safePath);
    return sendFile(filePath, contentTypeFor(filePath), res);
  }

  // Not static
  return false;
}

function sendFile(filePath, contentType, res) {
  fs.stat(filePath, (stErr, stats) => {
    if (stErr || !stats.isFile()) {
      json(res, 404, { error: "Not found" });
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    const rs = fs.createReadStream(filePath);
    rs.on("error", (err) => {
      console.error("Read file error:", err?.stack || err?.message || err);
      json(res, 500, { error: "An internal error occurred" });
    });
    rs.pipe(res);
  });
}

function contentTypeFor(p) {
  const ext = path.extname(p).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  // Basic CORS (adjust origins as needed)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Static
  const served = serveStatic(req, res, url);
  if (served) return;

  try {
    if (req.method === "POST" && url.pathname === "/ai/complete") {
      const body = await readJson(req, res);
      if (body === undefined) return;

      try {
        const result = await runComplete(body);
        return json(res, 200, result);
      } catch (err) {
        console.error("complete() error:", err?.stack || err?.message || err);
        return json(res, 500, { error: "An internal error occurred" });
      }
    }

    if (req.method === "POST" && url.pathname === "/ai/embed") {
      const body = await readJson(req, res);
      if (body === undefined) return;

      try {
        const result = await runEmbed(body);
        return json(res, 200, result);
      } catch (err) {
        console.error("embed() error:", err?.stack || err?.message || err);
        return json(res, 500, { error: "An internal error occurred" });
      }
    }

    // Health probe
    if (req.method === "GET" && url.pathname === "/healthz") {
      return json(res, 200, { ok: true, uptime_s: process.uptime() });
    }

    // Fallback 404 for unknown routes
    json(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("Unhandled request error:", err?.stack || err?.message || err);
    if (!res.headersSent) {
      json(res, 500, { error: "An internal error occurred" });
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");
  server.close(() => process.exit(0));
});
