const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const root = path.join(__dirname, "../..");
const click = (page, action) =>
  page.locator(`[data-action="${action}"]`).first().click();
const nav = (page, view) =>
  page.locator(`.nav-item[data-view="${view}"]`).click();
async function demo(page, language = "zh") {
  await page.goto(`/?lang=${language}`);
  await click(page, "demo");
  await expect(page.locator("#student-table tbody tr")).toHaveCount(4);
}
async function backup(page) {
  const downloaded = page.waitForEvent("download");
  await click(page, "backup");
  return JSON.parse(await fs.readFile(await (await downloaded).path(), "utf8"));
}
async function restore(page, value, valid = true) {
  if (valid) page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#backup-input").setInputFiles({
    name: "review-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(value)),
  });
  if (valid)
    await expect(page.locator("#toast")).toContainText(/已恢复|restored/i);
}

test("bilingual comment library CRUD, search, favorites, backup and safe reusable feedback", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await demo(page);
  await nav(page, "comments");
  await expect(page.locator(".comment-card")).toHaveCount(9);
  await page.locator("#comments-favorites").check();
  await expect(page.locator(".comment-card")).toHaveCount(3);
  await page.locator("#comments-favorites").uncheck();
  await page.locator("#comment-zh").fill("自定义：请补充推导步骤。");
  await page
    .locator("#comment-en")
    .fill("Custom: show the intermediate steps.");
  await page.locator("#comment-category").selectOption("nextStep");
  await page.locator("#comment-favorite").check();
  await page.locator('#comment-form button[type="submit"]').click();
  await expect(page.locator(".comment-card")).toHaveCount(10);
  await page.locator("#comment-search").fill("intermediate");
  await expect(page.locator(".comment-card")).toHaveCount(1);
  await expect(page.locator(".comment-card p")).toHaveText(
    "自定义：请补充推导步骤。",
  );
  await page.locator(".language").click();
  await expect(page.locator(".comment-card p")).toHaveText(
    "Custom: show the intermediate steps.",
  );
  await page.locator("#comment-search").fill("");
  await page.locator(".language").click();
  await expect(page.locator("#toast")).not.toHaveClass(/show/);
  await page.screenshot({
    path: path.join(root, "docs/comments-zh.png"),
    fullPage: true,
  });
  await page.reload();
  await nav(page, "comments");
  await expect(page.locator(".comment-card")).toHaveCount(10);
  await nav(page, "workspace");
  await click(page, "review");
  const note = page.locator('[data-note="0"]');
  await note.fill("已有反馈。");
  await note.press("Tab");
  await page.locator('[data-picker="0"] summary').click();
  await page.locator('[data-picker="0"] .picker-search').fill("intermediate");
  await click(page, "apply-comment");
  await expect(note).toHaveValue("已有反馈。\n自定义：请补充推导步骤。");
  await click(page, "apply-comment");
  await expect(note).toHaveValue("已有反馈。\n自定义：请补充推导步骤。");
  await expect(page.locator('[data-score="0"]')).toHaveValue("10");
  await expect(page.locator('[data-action="approve"]')).toBeVisible();
  await click(page, "close");
  const saved = await backup(page);
  expect(saved.commentBank).toHaveLength(10);
  expect(
    saved.workspace.students[0].result.items.map((q) => q.reviewed),
  ).toEqual([false, true, true, true, true, true, true]);
  const id = saved.commentBank.find((c) => c.en.includes("intermediate")).id;
  await nav(page, "comments");
  await page.locator(`[data-action="edit-comment"][data-id="${id}"]`).click();
  await page.locator("#comment-zh").fill("修订模板");
  await page.locator('#comment-form button[type="submit"]').click();
  await nav(page, "workspace");
  await click(page, "review");
  await expect(note).toHaveValue("已有反馈。\n自定义：请补充推导步骤。");
  await click(page, "close");
  await nav(page, "comments");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator(`[data-action="delete-comment"][data-id="${id}"]`).click();
  await expect(page.locator(".comment-card")).toHaveCount(9);
  await restore(page, saved);
  await nav(page, "comments");
  await expect(page.locator(".comment-card")).toHaveCount(10);
  await page.locator(".language").click();
  await nav(page, "workspace");
  await click(page, "review");
  await page.locator('[data-picker="0"] summary').click();
  await page.locator('[data-picker="0"] .picker-search').fill("intermediate");
  await click(page, "apply-comment");
  await expect(note).toHaveValue(
    "已有反馈。\n自定义：请补充推导步骤。\nCustom: show the intermediate steps.",
  );
  await click(page, "close");
  await nav(page, "comments");
  await click(page, "new-comment");
  await page
    .locator("#comment-en")
    .fill('<img src=x onerror="window.unsafeComment=1">');
  await page.locator('#comment-form button[type="submit"]').click();
  expect(await page.evaluate(() => window.unsafeComment)).toBeUndefined();
  await expect(page.locator(".comment-card img")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect(errors).toEqual([]);
});

test("fixed-question review navigates students, persists progress and requires all questions for approval", async ({
  page,
}) => {
  await demo(page);
  const saved = await backup(page);
  // Simulate a fresh set of AI drafts, before any teacher confirmations.
  saved.workspace.students.forEach((s) => {
    s.approved = false;
    s.result?.items.forEach((q) => {
      q.reviewed = false;
      q.reviewedAt = "";
    });
  });
  await restore(page, saved);
  await click(page, "review-by-question");
  await expect(page.locator(".question-roster button")).toHaveCount(3);
  await expect(page.locator(".question-result")).toHaveCount(1);
  await page.locator("#review-question").selectOption("6");
  const first = await page.locator("#student-name").inputValue();
  await click(page, "confirm-next");
  await expect(page.locator("#student-name")).not.toHaveValue(first);
  await expect(page.locator("#review-question")).toHaveValue("6");
  await expect(page.locator(".question-progress")).toContainText("1 / 3");
  await expect(
    page.locator('.question-result[data-question-no="6"]'),
  ).toHaveCount(1);
  await page.locator('.review-modebar [data-mode="question"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#student-name")).toHaveValue(
    saved.workspace.students[2].name,
  );
  await expect(page.locator("#review-question")).toHaveValue("6");
  await page.locator("#review-question").selectOption("7");
  await expect(page.locator('[data-action="confirm-question"]')).toBeDisabled();
  await page.locator('[data-score="6"]').fill("20");
  await page.locator('[data-score="6"]').press("Tab");
  await click(page, "confirm-question");
  await expect(page.locator('[data-action="undo-question"]')).toBeVisible();
  await expect(page.locator("#dialog .dialog-header .badge")).not.toHaveClass(
    /approved/,
  );
  await click(page, "close");
  const partial = await backup(page);
  expect(partial.workspace.students[2].approved).toBe(false);
  expect(partial.workspace.students[2].result.items[6].reviewed).toBe(true);
  await page.reload();
  await click(page, "review-by-question");
  await page.locator("#review-question").selectOption("7");
  await expect(page.locator(".question-progress")).toContainText("1 / 3");
  await page.locator(".question-roster button").nth(2).click();
  for (const no of ["1", "2", "3", "4", "5", "6"]) {
    await page.locator("#review-question").selectOption(no);
    await click(page, "confirm-question");
  }
  await expect(page.locator("#dialog .dialog-header .badge")).toHaveClass(
    /approved/,
  );
  await page.locator('[data-score="5"]').fill("19");
  // A blur caused by clicking the next action must not lose that click to a rerender.
  await click(page, "confirm-next");
  await expect(page.locator("#student-name")).not.toHaveValue(
    saved.workspace.students[2].name,
  );
  await expect(page.locator(".review-actions")).toBeInViewport();
  await expect(page.locator("#toast")).not.toHaveClass(/show/);
  await page.screenshot({
    path: path.join(root, "docs/question-review-zh.png"),
  });
  await click(page, "close");
  await page.locator(".language").click();
  page.once("dialog", (dialog) => dialog.accept());
  await click(page, "demo");
  await click(page, "review-by-question");
  await expect(
    page.locator('.review-modebar [data-mode="question"]'),
  ).toHaveText("By question");
  await expect(page.locator("#toast")).not.toHaveClass(/show/);
  await page.screenshot({
    path: path.join(root, "docs/question-review-en.png"),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect(
    await page
      .locator("#dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: path.join(root, ".local/question-review-mobile.png"),
  });
});

test("pending and flagged queues, older backups, and invalid banks never erase work", async ({
  page,
}) => {
  await demo(page, "en");
  await click(page, "review-by-question");
  await page.locator("#question-filter").selectOption("pending");
  await expect(page.locator(".question-roster button")).toHaveCount(1);
  await click(page, "confirm-next");
  await expect(page.locator(".question-empty")).toBeVisible();
  await expect(page.locator(".question-progress")).toContainText("3 / 3");
  await page.locator("#question-filter").selectOption("flagged");
  await page.locator("#review-question").selectOption("7");
  await expect(page.locator(".question-roster button")).toHaveCount(1);
  await expect(page.locator('[data-score="6"]')).toHaveValue("");
  await click(page, "close");
  const saved = await backup(page);
  await nav(page, "comments");
  await page.locator("#comment-en").fill("Local custom feedback");
  await page.locator('#comment-form button[type="submit"]').click();
  const legacy = structuredClone(saved);
  delete legacy.commentBank;
  legacy.workspace.students.forEach((s) =>
    s.result?.items.forEach((q) => {
      delete q.reviewed;
      delete q.reviewedAt;
    }),
  );
  await restore(page, legacy);
  await nav(page, "comments");
  await expect(page.locator(".comment-card")).toHaveCount(10);
  await nav(page, "workspace");
  const invalid = structuredClone(saved);
  invalid.commentBank = [{ id: "invalid", category: "bad", zh: "", en: "" }];
  await restore(page, invalid, false);
  await expect(page.locator("#toast")).toContainText(
    "Invalid or oversized backup",
  );
  await expect(page.locator("#student-table tbody tr")).toHaveCount(4);
  await nav(page, "comments");
  await expect(page.locator(".comment-card")).toHaveCount(10);
  // Restoring can remove the template currently being edited.
  // The editor must become a new-entry form instead of updating a missing ID.
  await page
    .locator(".comment-card")
    .filter({ hasText: "Local custom feedback" })
    .locator('[data-action="edit-comment"]')
    .click();
  await restore(page, saved);
  await nav(page, "comments");
  await expect(page.locator(".comment-card")).toHaveCount(9);
  await page
    .locator("#comment-en")
    .fill("Feedback after restoring the library");
  await page.locator('#comment-form button[type="submit"]').click();
  await expect(page.locator(".comment-card")).toHaveCount(10);
  await nav(page, "rubrics");
  await page.locator("#qcriteria-0").fill("Revised criterion");
  await nav(page, "workspace");
  await expect(
    page.locator('[data-action="review-by-question"]'),
  ).toBeDisabled();
  await click(page, "review");
  await page.locator('.review-modebar [data-mode="question"]').click();
  await expect(page.locator("#toast")).toContainText("No eligible results");
  await click(page, "close");
  await expect(page.locator("#dialog")).not.toBeVisible();
});
