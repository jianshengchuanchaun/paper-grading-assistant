const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const root = path.join(__dirname, "../..");
const click = (page, action) =>
  page.locator(`[data-action="${action}"]`).first().click();
const nav = (page, view) =>
  page.locator(`.nav-item[data-view="${view}"]`).click();
async function demo(page, lang = "zh") {
  await page.goto("/?lang=" + lang);
  await click(page, "demo");
  await expect(page.locator("#student-table tbody tr")).toHaveCount(4);
  await expect(page.locator("#save-state")).toContainText(
    /已保存|Saved locally/,
  );
}
async function createBatch(page, title, cls, date = "2026-11-13", copy = true) {
  await click(page, "new-batch");
  await page.locator("#batch-title").fill(title);
  await page.locator("#batch-class").fill(cls);
  await page.locator("#batch-date").fill(date);
  await page.locator("#batch-copy-rubric").setChecked(copy);
  await page.locator('#new-batch-form button[type="submit"]').click();
  await expect(page.locator("#dialog")).not.toBeVisible();
  await expect(page.locator(".batch-context strong")).toHaveText(title);
  return page.locator("#batch-switch").inputValue();
}
async function getBackup(page, action = "backup-all") {
  const downloaded = page.waitForEvent("download");
  await click(page, action);
  return JSON.parse(await fs.readFile(await (await downloaded).path(), "utf8"));
}
async function restore(page, value, valid = true) {
  if (valid) page.once("dialog", (d) => d.accept());
  await page.locator("#backup-input").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(value)),
  });
  if (valid)
    await expect(page.locator("#toast")).toContainText(/已恢复|restored/);
}

for (const language of ["zh", "en"])
  test(`${language}: classes and exams remain independent, editable and resumable`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await demo(page, language);
    const original = await page.locator("#batch-switch").inputValue();
    const originalClass =
      language === "zh" ? "三年级（2）班" : "Grade 3 · Class B";
    await click(page, "review");
    await page.locator('[data-note="0"]').fill("Feedback to preserve");
    await page.locator('[data-note="0"]').press("Tab");
    await click(page, "close");
    const second = await createBatch(
      page,
      language === "zh" ? "第四单元随堂测验" : "Unit 4 · Quick check",
      originalClass,
    );
    await expect(page.locator("#student-table tbody tr")).toHaveCount(0);
    await nav(page, "rubrics");
    await page
      .locator("#qcriteria-0")
      .fill("Different criteria for this assessment");
    await nav(page, "workspace");
    await page.locator("#batch-switch").selectOption(original);
    await expect(page.locator("#student-table tbody tr")).toHaveCount(4);
    await expect(page.locator("#student-table .badge.stale")).toHaveCount(0);
    await click(page, "review");
    await expect(page.locator('[data-note="0"]')).toHaveValue(
      "Feedback to preserve",
    );
    await click(page, "close");
    await nav(page, "library");
    await click(page, "new-class");
    await page
      .locator("#class-name")
      .fill(language === "zh" ? "三年级（1）班" : "Grade 3 · Class A");
    await page
      .locator("#class-note")
      .fill(language === "zh" ? "2026 秋季学期" : "Fall 2026");
    await page.locator('#class-form button[type="submit"]').click();
    await expect(page.locator("#dialog")).not.toBeVisible();
    const third = await createBatch(
      page,
      language === "zh" ? "期中综合测评" : "Midterm assessment",
      language === "zh" ? "三年级（1）班" : "Grade 3 · Class A",
      "2026-11-10",
      false,
    );
    await nav(page, "rubrics");
    await expect(page.locator("#qcriteria-0")).toHaveCount(0);
    await nav(page, "library");
    await page.locator('[data-action="filter-class"][data-id="all"]').click();
    await expect(page.locator(".batch-card")).toHaveCount(3);
    await page.locator("#library-sort").selectOption("exam");
    await expect(page.locator(".batch-card").first()).toHaveAttribute(
      "data-batch-id",
      second,
    );
    await page.locator("#library-sort").selectOption("updated");
    await page
      .locator("#library-search")
      .fill(language === "zh" ? "第四单元" : "Quick check");
    await expect(page.locator(".batch-card")).toHaveCount(1);
    await page.locator("#library-search").fill("");
    await page
      .locator(`[data-batch-id="${second}"] [data-action="archive-batch"]`)
      .click();
    await expect(page.locator(".batch-card")).toHaveCount(2);
    await page.locator("#library-state").selectOption("archived");
    await expect(page.locator(".batch-card")).toHaveCount(1);
    await page
      .locator(`[data-batch-id="${second}"] [data-action="archive-batch"]`)
      .click();
    await expect(page.locator(".batch-card")).toHaveCount(0);
    await page.locator("#library-state").selectOption("all");
    await expect(page.locator("#toast")).not.toHaveClass(/show/);
    await page.screenshot({
      path: path.join(root, `docs/library-${language}.png`),
      fullPage: true,
    });
    // Rename a class and move an assessment without changing any grades.
    await page
      .locator(".class-row")
      .filter({ hasText: originalClass })
      .locator('[data-action="edit-class"]')
      .click();
    await expect(page.locator('[data-action="delete-class"]')).toBeDisabled();
    await page.locator("#class-name").fill(originalClass + " · 2026");
    await page.locator('#class-form button[type="submit"]').click();
    await page.locator('[data-action="filter-class"][data-id="all"]').click();
    await page
      .locator(`[data-batch-id="${second}"] [data-action="edit-batch"]`)
      .click();
    const classA = await page
      .locator("#edit-batch-class option")
      .last()
      .getAttribute("value");
    await page.locator("#edit-batch-class").selectOption(classA);
    await page.locator("#edit-batch-title").fill("Revised quiz");
    await page.locator('#edit-batch-form button[type="submit"]').click();
    await page
      .locator(`[data-batch-id="${original}"] [data-action="open-batch"]`)
      .click();
    await expect(page.locator(".batch-context")).toContainText(
      originalClass + " · 2026",
    );
    await page.reload();
    await expect(page.locator("#batch-switch")).toHaveValue(original);
    await expect(page.locator("#student-table tbody tr")).toHaveCount(4);
    await page.locator("#batch-switch").selectOption(third);
    await expect(page.locator("#student-table tbody tr")).toHaveCount(0);
    await nav(page, "library");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
    if (language === "en") {
      await expect(page.locator("#toast")).not.toHaveClass(/show/);
      await page.screenshot({
        path: path.join(root, "docs/library-mobile-en.png"),
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });

test("all-class archives round-trip atomically; deleting one exam preserves others; old backups import additively", async ({
  page,
}) => {
  await demo(page, "en");
  const original = await page.locator("#batch-switch").inputValue();
  const single = await getBackup(page, "backup");
  const second = await createBatch(page, "Next quiz", "Class Z");
  await nav(page, "library");
  const archive = await getBackup(page);
  expect(archive.version).toBe(3);
  expect(archive.library.batches).toHaveLength(2);
  expect(archive.settings).toBeUndefined();
  expect(archive.commentBank).toHaveLength(9);
  await expect(
    page.locator(`[data-batch-id="${second}"] [data-action="delete-batch"]`),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await page
    .locator(`[data-batch-id="${original}"] [data-action="delete-batch"]`)
    .click();
  await expect(page.locator(".batch-card")).toHaveCount(1);
  await restore(page, archive);
  await expect(page.locator("#batch-switch")).toHaveValue(second);
  await page.locator("#batch-switch").selectOption(original);
  await expect(page.locator("#student-table tbody tr")).toHaveCount(4);
  const broken = structuredClone(archive);
  broken.library.batches[1].workspace.students = [
    { id: "x", pages: [{ dataUrl: "data:image/svg+xml,<svg/>" }] },
  ];
  await restore(page, broken, false);
  await expect(page.locator("#toast")).toContainText("Invalid");
  await expect(page.locator("#student-table tbody tr")).toHaveCount(4);
  await restore(page, single);
  await nav(page, "library");
  await expect(page.locator(".batch-card")).toHaveCount(3);
  await page.reload();
  await nav(page, "library");
  await expect(page.locator(".batch-card")).toHaveCount(3);
  await click(page, "new-class");
  await page.locator("#class-name").fill("Temporary empty class");
  await page.locator('#class-form button[type="submit"]').click();
  await page
    .locator(".class-row")
    .filter({ hasText: "Temporary empty class" })
    .locator('[data-action="edit-class"]')
    .click();
  await expect(page.locator('[data-action="delete-class"]')).toBeEnabled();
  page.once("dialog", (d) => d.accept());
  await click(page, "delete-class");
  await expect(
    page.locator(".class-row").filter({ hasText: "Temporary empty class" }),
  ).toHaveCount(0);
  await expect(page.locator(".batch-card")).toHaveCount(3);
});

test("v2.1 local data migrates with papers, scores, feedback, templates and shared comments", async ({
  page,
}) => {
  await demo(page, "en");
  const backup = await getBackup(page, "backup");
  backup.templates = [
    {
      id: "old-template",
      name: "Saved rubric",
      rubric: backup.workspace.rubric,
    },
  ];
  await page.goto("about:blank");
  await page.goto("/");
  // Prepare an actual old database, then allow the next page load to upgrade it.
  await page.evaluate(async (data) => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase("gradeflow-v2");
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const req = indexedDB.open("gradeflow-v2", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("workspace");
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result,
          tx = db.transaction("workspace", "readwrite");
        tx.objectStore("workspace").put(
          {
            workspace: data.workspace,
            templates: data.templates,
            commentBank: data.commentBank,
            settings: {
              provider: "custom",
              baseUrl: "https://example.test/v1",
              model: "saved-model",
            },
          },
          "current",
        );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    });
  }, backup);
  await page.reload();
  await expect(page.locator("#student-table tbody tr")).toHaveCount(4);
  await nav(page, "library");
  await expect(page.locator(".batch-card")).toHaveCount(1);
  const all = await getBackup(page);
  expect(all.library.classes).toHaveLength(1);
  expect(all.templates).toHaveLength(1);
  expect(all.commentBank).toHaveLength(9);
  expect(all.library.batches[0].workspace.students[0].approved).toBe(true);
  expect(all.library.batches[0].workspace.students[0].pages[0].dataUrl).toBe(
    backup.workspace.students[0].pages[0].dataUrl,
  );
});

test("concurrent tabs cannot overwrite history and a failed save cannot switch assessments", async ({
  page,
  context,
}) => {
  await demo(page, "en");
  const original = await page.locator("#batch-switch").inputValue();
  const other = await context.newPage();
  await other.goto("/?lang=en");
  await expect(other.locator("#student-table tbody tr")).toHaveCount(4);
  await createBatch(page, "Saved in first tab", "Class A");
  await click(other, "new-batch");
  await other.locator("#batch-title").fill("Outdated tab");
  await other.locator('#new-batch-form button[type="submit"]').click();
  await expect(other.locator("#save-state")).toContainText("Another tab");
  await click(other, "close");
  await expect(other.locator("#batch-switch")).toHaveValue(original);
  await other.close();
  await page.evaluate(() => {
    window.savedLibraryWrite = GradeLibrary.write;
    GradeLibrary.write = () =>
      Promise.reject(new DOMException("Quota exceeded", "QuotaExceededError"));
  });
  await page.locator("#batch-switch").selectOption(original);
  await expect(page.locator("#save-state")).toContainText("Save failed");
  await expect(page.locator(".batch-context strong")).toHaveText(
    "Saved in first tab",
  );
  await nav(page, "library");
  const rescued = await getBackup(page);
  expect(rescued.library.batches).toHaveLength(2);
  expect(
    rescued.library.batches.find((b) => b.id === rescued.library.activeBatchId)
      .title,
  ).toBe("Saved in first tab");
  await page.evaluate(() => {
    GradeLibrary.write = window.savedLibraryWrite;
  });
  await page.reload();
  await expect(page.locator(".batch-context strong")).toHaveText(
    "Saved in first tab",
  );
  await nav(page, "library");
  await expect(page.locator(".batch-card")).toHaveCount(2);
});
