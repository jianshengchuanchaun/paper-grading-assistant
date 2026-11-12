const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const http = require("node:http");
const base = "http://127.0.0.1:4184";
let child, upstream, seen;
before(async () => {
  upstream = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    seen = { headers: req.headers, body: JSON.parse(body) };
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ choices: [{ message: { content: "OK" } }] }));
  });
  await new Promise((r) => upstream.listen(4185, "127.0.0.1", r));
  child = spawn(process.execPath, ["scripts/server.mjs"], {
    cwd: require("node:path").join(__dirname, ".."),
    env: {
      ...process.env,
      PORT: "4184",
      OPENAI_BASE_URL: "http://127.0.0.1:4185/v1",
      OPENAI_MODEL: "test-vision",
      OPENAI_API_KEY: "test-only-placeholder",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    child.stdout.once("data", resolve);
    child.once("error", reject);
    child.once("exit", (c) => reject(new Error("server exit " + c)));
  });
});
after(async () => {
  child?.kill();
  await new Promise((r) => upstream?.close(r));
});
test("server serves app but denies environment, source and traversal paths", async () => {
  assert.equal((await fetch(base + "/")).status, 200);
  for (const route of [
    "/.env",
    "/scripts/server.mjs",
    "/package.json",
    "/assets/%2e%2e%2f.env",
  ])
    assert.notEqual((await fetch(base + route)).status, 200);
});
test("relay rejects missing origin and cross-site requests", async () => {
  const send = (origin) =>
    fetch(base + "/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(origin ? { Origin: origin } : {}),
      },
      body: "{}",
    });
  assert.equal((await send()).status, 403);
  assert.equal((await send("https://untrusted.example")).status, 403);
});
test("relay keeps server-selected model and credentials, ignores client destinations", async () => {
  const r = await fetch(base + "/api/chat", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "wrong",
      baseUrl: "https://untrusted.example",
      messages: [{ role: "user", content: "OK" }],
      max_tokens: 16,
    }),
  });
  assert.equal(r.status, 200);
  assert.equal(seen.body.model, "test-vision");
  assert.equal(seen.headers.authorization, "Bearer test-only-placeholder");
  assert.equal(seen.body.baseUrl, undefined);
  assert.equal((await r.json()).choices[0].message.content, "OK");
});
test("relay rejects malformed body", async () => {
  const r = await fetch(base + "/api/chat", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(r.status, 400);
});
