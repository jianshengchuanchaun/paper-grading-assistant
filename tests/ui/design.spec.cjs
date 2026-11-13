const { test, expect } = require("@playwright/test");
const path = require("node:path");
const root = path.join(__dirname, "../..");
const nav = (page, view) =>
  page.locator(`.nav-item[data-view="${view}"]`).click();

test("desktop sidebar, command navigation and shell changes preserve form drafts", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/zh/");
  await expect(page.locator('[data-slot="sidebar-container"]')).toBeVisible();
  await nav(page, "settings");
  await page.locator("#provider").selectOption("deepseek");
  await page.locator("#api-key").fill("unsaved-key-in-memory");
  await page
    .getByRole("button", { name: "展开或收起导航", exact: true })
    .click();
  await expect(
    page.locator('[data-slot="sidebar"][data-state="collapsed"]'),
  ).toBeVisible();
  await expect(page.locator("#api-key")).toHaveValue("unsaved-key-in-memory");
  await page.getByRole("button", { name: "快捷搜索", exact: true }).click();
  await page.getByRole("combobox").fill("不存在的功能");
  await expect(page.locator('[data-slot="command-empty"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "快捷搜索", exact: true }),
  ).toBeFocused();
  await expect(page.locator("#api-key")).toHaveValue("unsaved-key-in-memory");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("常用评语");
  await page.screenshot({
    path: path.join(root, "docs/quick-search-zh.png"),
    animations: "disabled",
  });
  await page.keyboard.press("Enter");
  await expect(page.locator('.nav-item[data-view="comments"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator(".command-palette")).not.toBeVisible();
  await page.reload();
  await expect(
    page.locator('[data-slot="sidebar"][data-state="collapsed"]'),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "展开或收起导航", exact: true })
    .click();
  await expect(
    page.locator('[data-slot="sidebar"][data-state="expanded"]'),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile drawer supports both languages, closes after navigation and retains class records", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/");
  await page.locator('[data-action="demo"]').first().click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click();
  await expect(page.locator('[data-mobile="true"]')).toBeVisible();
  await page.screenshot({
    path: path.join(root, "docs/mobile-navigation-en.png"),
    animations: "disabled",
  });
  await nav(page, "library");
  await expect(page.locator('[data-mobile="true"]')).not.toBeVisible();
  await expect(page.locator(".batch-card")).toHaveCount(1);
  await page.locator(".language").click();
  await page
    .getByRole("button", { name: "展开或收起导航", exact: true })
    .click();
  await nav(page, "workspace");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page
    .getByRole("button", { name: "展开或收起导航", exact: true })
    .click();
  await page.getByRole("button", { name: "关闭导航", exact: true }).click();
  await expect(page.locator('[data-mobile="true"]')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect(errors).toEqual([]);
});

test("reduced-motion dashboard stays readable and quick actions use existing dialogs", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const externalRequests = [];
  page.on("request", (request) => {
    if (!new URL(request.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/))
      externalRequests.push(request.url());
  });
  await page.goto("/en/");
  await page.locator('[data-action="demo"]').first().click();
  await expect(page.locator(".metrics .value").first()).toHaveText("4");
  await expect(
    page.locator('.workflow-step[aria-current="step"]'),
  ).toContainText("Grade & review");
  await nav(page, "insights");
  await expect(page.locator(".metrics .value").nth(1)).toHaveText("88.5%");
  await expect(page.locator(".metrics .value").nth(2)).toHaveText("100%");
  await page.screenshot({
    path: path.join(root, "docs/insights-en.png"),
    fullPage: true,
  });
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("New batch");
  await page.keyboard.press("Enter");
  await expect(page.locator("#new-batch-form")).toBeVisible();
  await page.locator("#batch-title").fill("Command-created exam");
  await page.locator('#new-batch-form button[type="submit"]').click();
  await expect(page.locator(".batch-context strong")).toHaveText(
    "Command-created exam",
  );
  await expect(page.locator(".metrics .value").first()).toHaveText("0");
  expect(externalRequests).toEqual([]);
});
