import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".wasm": "application/wasm",
  ".bcmap": "application/octet-stream",
  ".ttf": "font/ttf",
  ".pfb": "application/octet-stream",
};
const relayBase = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const limit = 30 * 1024 * 1024;
function json(res, status, value) {
  if (!res.destroyed) {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(value));
  }
}
const server = http.createServer(async (req, res) => {
  // Loopback-only server. Reject DNS-rebinding hosts and cross-site relay requests.
  const authority = req.headers.host;
  if (![`localhost:${port}`, `127.0.0.1:${port}`].includes(authority))
    return json(res, 403, { error: "Invalid host" });
  const origin = `http://${authority}`;
  const url = new URL(req.url, origin);
  if (url.pathname === "/api/chat") {
    if (req.method !== "POST")
      return json(res, 405, { error: "POST required" });
    if (
      req.headers.origin !== origin ||
      (req.headers["sec-fetch-site"] &&
        !["same-origin", "none"].includes(req.headers["sec-fetch-site"]))
    )
      return json(res, 403, { error: "Same-origin requests only" });
    if (!req.headers["content-type"]?.startsWith("application/json"))
      return json(res, 415, { error: "JSON required" });
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL)
      return json(res, 503, {
        error:
          "Configure OPENAI_API_KEY and OPENAI_MODEL in .env, then restart npm start.",
      });
    let target;
    try {
      target = new URL(relayBase);
      if (
        target.username ||
        target.password ||
        target.search ||
        target.hash ||
        !(
          target.protocol === "https:" ||
          (target.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname))
        )
      )
        throw new Error();
    } catch {
      return json(res, 500, { error: "Invalid server OPENAI_BASE_URL" });
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 145000);
    res.on("close", () => {
      if (!res.writableEnded) ctrl.abort();
    });
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > limit) {
          json(res, 413, { error: "Request exceeds 30 MB" });
          return;
        }
        chunks.push(chunk);
      }
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        return json(res, 400, { error: "Invalid JSON" });
      }
      if (
        !Array.isArray(body.messages) ||
        body.messages.length > 20 ||
        !body.messages.length
      )
        return json(res, 400, { error: "Invalid messages" });
      const upstream = await fetch(
        target.href.replace(/\/+$/, "") + "/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL,
            messages: body.messages,
            temperature: 0.1,
            max_tokens: Math.min(
              8192,
              Math.max(1, Number(body.max_tokens) || 8192),
            ),
          }),
          signal: ctrl.signal,
          redirect: "error",
        },
      );
      const text = await upstream.text();
      if (!res.destroyed) {
        res.writeHead(upstream.status, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(text);
      }
    } catch (error) {
      json(res, 502, {
        error: ctrl.signal.aborted
          ? "Provider request timed out or was cancelled."
          : "Could not reach the configured provider.",
      });
    } finally {
      clearTimeout(timer);
    }
    return;
  }
  if (!["GET", "HEAD"].includes(req.method))
    return json(res, 405, { error: "Method not allowed" });
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return json(res, 400, { error: "Bad path" });
  }
  if (pathname.endsWith("/")) pathname += "index.html";
  if (!(
    pathname === "/index.html" ||
    /^\/(en|zh)\/index\.html$/.test(pathname) ||
    /^\/(assets|vendor)\//.test(pathname)
  ))
    return json(res, 404, { error: "Not found" });
  const target = path.resolve(root, "." + pathname);
  if (!target.startsWith(root + path.sep) || pathname.includes("\\"))
    return json(res, 403, { error: "Invalid path" });
  try {
    const bytes = await readFile(target);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(target)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    json(res, 404, {
      error:
        "Not found. Run npm run build to prepare PDF assets and language entry points.",
    });
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`GradeFlow: http://localhost:${port} — local-only server`),
);
