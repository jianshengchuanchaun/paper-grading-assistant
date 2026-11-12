const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const root = path.join(__dirname, "../..");
const click = (page, action) =>
  page.locator(`[data-action="${action}"]`).first().click();
const nav = (page, view) =>
  page.locator(`.nav-item[data-view="${view}"]`).click();
async function readDownload(download) {
  return fs.readFile(await download.path(), "utf8");
}
async function demo(page) {
  await page.goto("/");
  await click(page, "demo");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.locator("#save-state")).toContainText("已保存");
}
test("Chinese and English workflow, edits, approval, persistence, safe backup and screenshots", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await demo(page);
  await page.screenshot({
    path: path.join(root, "docs/workspace-zh.png"),
    fullPage: true,
  });
  await page
    .locator("tbody tr")
    .nth(2)
    .locator('[data-action="review"]')
    .click();
  await expect(page.locator(".review-actions")).toBeInViewport();
  await expect(page.locator('[data-action="approve"]')).toBeDisabled();
  await page.screenshot({ path: path.join(root, "docs/review-zh.png") });
  await page.locator('[data-score="6"]').fill("20");
  await page.locator('[data-score="6"]').press("Tab");
  await expect(page.locator('[data-action="approve"]')).toBeEnabled();
  await click(page, "approve");
  await expect(page.locator('[data-action="unapprove"]')).toBeVisible();
  await click(page, "close");
  await nav(page, "insights");
  await expect(page.locator(".metrics .value").first()).toHaveText("3");
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page
    .locator("tbody tr")
    .nth(2)
    .locator('[data-action="review"]')
    .click();
  await expect(page.locator('[data-score="6"]')).toHaveValue("20");
  await click(page, "close");
  const backupEvent = page.waitForEvent("download");
  await click(page, "backup");
  const backup = JSON.parse(await readDownload(await backupEvent));
  expect(backup.workspace.students).toHaveLength(4);
  expect(backup.workspace.students[2].result.items[6].aiScore).toBeNull();
  expect(backup.workspace.students[2].result.items[6].score).toBe(20);
  expect(backup.settings).toBeUndefined();
  await page.locator(".language").click();
  await expect(page.locator("h1")).toHaveText("More teaching. Less marking.");
  page.once("dialog", (d) => d.accept());
  await click(page, "demo");
  await expect(page.locator("#toast")).not.toHaveClass(/show/);
  await page.screenshot({
    path: path.join(root, "docs/workspace-en.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("h1")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: path.join(root, "docs/mobile-en.png") });
  expect(errors).toEqual([]);
});
test("rubric changes invalidate grades and pending batch skips existing results", async ({
  page,
}) => {
  await demo(page);
  await nav(page, "rubrics");
  await page
    .locator("#qcriteria-0")
    .fill("Updated rule: correct answer earns 10 points.");
  await nav(page, "workspace");
  await expect(page.locator(".badge.stale")).toHaveCount(3);
  await nav(page, "insights");
  await expect(page.locator(".empty")).toBeVisible();
  await nav(page, "workspace");
  await click(page, "grade-pending");
  await expect(page.locator('[data-action="grade-pending"]')).toBeEnabled();
  await expect(page.locator(".badge.review")).toHaveCount(4);
  await click(page, "grade-pending");
  await expect(page.locator("#toast")).toContainText("没有可批改");
});
test("new batch, upload image, configure and mock real provider, CSV and secret omission", async ({
  page,
}) => {
  await page.goto("/?lang=en");
  await nav(page, "rubrics");
  await click(page, "load-rubric");
  await nav(page, "workspace");
  await click(page, "new-batch");
  await page.locator("#batch-title").fill("Quiz");
  await page.locator("#batch-class").fill("3B");
  await page.locator('#new-batch-form button[type="submit"]').click();
  await page.locator("#papers-input").setInputFiles({
    name: "=FORMULA.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKX8AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await nav(page, "settings");
  await page.locator("#provider").selectOption("custom");
  await page.locator("#base-url").fill("https://vision.example.test/v1");
  await page.locator("#model").fill("test-vision");
  await page.locator("#api-key").fill("test-secret-not-for-export");
  await click(page, "save-settings");
  let calls = 0;
  await page.route(
    "https://vision.example.test/v1/chat/completions",
    async (route) => {
      calls++;
      const body = route.request().postDataJSON();
      expect(body.messages[0].content).toContain("untrusted evidence");
      await route.fulfill({
        json: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [10, 10, 10, 10, 10, 20, 30].map((max, i) => ({
                    no: String(i + 1),
                    max,
                    score: max,
                    comment: "Correct",
                    answer: "Visible answer",
                  })),
                  overall: "Well done",
                }),
              },
            },
          ],
        },
      });
    },
  );
  await nav(page, "workspace");
  await click(page, "grade-pending");
  await expect(page.locator(".badge.review")).toHaveCount(1);
  expect(calls).toBe(1);
  await click(page, "review");
  await click(page, "approve");
  await click(page, "close");
  await click(page, "grade-pending");
  expect(calls).toBe(1);
  await click(page, "export");
  const csvEvent = page.waitForEvent("download");
  await click(page, "download-csv");
  const csv = await readDownload(await csvEvent);
  expect(csv).toContain('"\'=FORMULA"');
  expect(csv).toContain("Approved");
  const backupEvent = page.waitForEvent("download");
  await click(page, "backup");
  const content = await readDownload(await backupEvent);
  expect(content).not.toContain("test-secret-not-for-export");
  expect(content).not.toContain("vision.example.test");
  await page.reload();
  await nav(page, "settings");
  await expect(page.locator("#api-key")).toHaveValue("");
});
test("multi-page PDF renders locally and malformed backup cannot replace workspace", async ({
  page,
  browser,
}) => {
  const pdfPage = await browser.newPage();
  await pdfPage.setContent(
    '<h1>Fictional student - page 1</h1><p>23 + 58 = 81</p><div style="break-before:page"><h1>Page 2</h1><p>100 - 37 = 63</p></div>',
  );
  const pdf = await pdfPage.pdf({ format: "A4" });
  await pdfPage.close();
  await page.goto("/?lang=en");
  await page.locator("#papers-input").setInputFiles({
    name: "student.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator(".paper-cell")).toContainText("2 pages");
  await click(page, "review");
  await expect(page.locator(".page-thumb")).toHaveCount(2);
  await page.locator(".page-thumb").nth(1).click();
  await expect(page.locator(".page-thumb").nth(1)).toHaveClass(/active/);
  await click(page, "close");
  await page.locator("#backup-input").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2}'),
  });
  await expect(page.locator("#toast")).toContainText("Invalid");
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("both standalone language entries load with correct asset paths", async ({
  page,
}) => {
  await page.goto("/en/");
  await expect(page.locator("h1")).toHaveText("More teaching. Less marking.");
  await expect(page.locator(".brand img")).toHaveJSProperty("naturalWidth", 64);
  await page.goto("/zh/");
  await expect(page.locator("h1")).toHaveText("把时间，还给教学。");
});
test("valid backup restores work, and teacher comment revokes an approval", async ({
  page,
}) => {
  await demo(page);
  const downloaded = page.waitForEvent("download");
  await click(page, "backup");
  const content = await readDownload(await downloaded);
  await click(page, "new-batch");
  await page.locator("#batch-title").fill("Empty");
  await page.locator('#new-batch-form button[type="submit"]').click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.locator("#backup-input").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(content),
  });
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.locator(".badge.approved")).toHaveCount(2);
  await page
    .locator("tbody tr")
    .first()
    .locator('[data-action="review"]')
    .click();
  await page.locator('[data-note="0"]').fill("Check your working.");
  await page.locator('[data-note="0"]').press("Tab");
  await expect(page.locator('[data-action="approve"]')).toBeVisible();
  await click(page, "close");
  await expect(page.locator("#student-table .badge.approved")).toHaveCount(1);
});
