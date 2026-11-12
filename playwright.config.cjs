const { defineConfig } = require("@playwright/test");
process.env.NO_PROXY = [process.env.NO_PROXY, "localhost", "127.0.0.1"]
  .filter(Boolean)
  .join(",");
module.exports = defineConfig({
  testDir: "./tests/ui",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/server.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
  },
});
