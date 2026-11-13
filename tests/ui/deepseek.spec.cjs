const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const nav = (page, view) =>
  page.locator(`.nav-item[data-view="${view}"]`).click();
const click = (page, action) =>
  page.locator(`[data-action="${action}"]`).first().click();

for (const lang of ["zh", "en"]) {
  test(`DeepSeek ${lang}: connection, image grading, saved preset and private key`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/`);
    await nav(page, "settings");
    await page.locator("#api-key").fill("previous-provider-key");
    await page.locator("#provider").selectOption("deepseek");
    await expect(page.locator("#base-url")).toHaveValue(
      "https://api.deepseek.com",
    );
    await expect(page.locator("#model")).toHaveValue("deepseek-flash");
    await expect(page.locator("#api-key")).toHaveValue("");
    await expect(page.locator("#deepseek-help")).toContainText(
      lang === "zh" ? "支持图片输入" : "image-capable",
    );
    await page.locator("#api-key").fill("deepseek-test-key-not-real");
    await click(page, "save-settings");

    const requests = [];
    await page.route(
      "https://api.deepseek.com/chat/completions",
      async (route) => {
        const request = route.request();
        const body = request.postDataJSON();
        requests.push(body);
        expect(request.headers().authorization).toBe(
          "Bearer deepseek-test-key-not-real",
        );
        expect(body.model).toBe("deepseek-flash");
        expect(body.thinking).toEqual({ type: "disabled" });
        const testing =
          typeof body.messages[0].content === "string" &&
          body.messages.length === 1;
        await route.fulfill({
          json: {
            choices: [
              {
                message: {
                  content: testing
                    ? "OK"
                    : JSON.stringify({
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
    await click(page, "test-connection");
    await expect(page.locator("#connection-result")).toContainText(
      lang === "zh" ? "连接成功（文本请求）" : "Connected (text request)",
    );
    expect(requests).toHaveLength(1);
    expect(requests[0].max_tokens).toBe(16);
    await nav(page, "rubrics");
    await click(page, "load-rubric");
    await nav(page, "workspace");
    await page
      .locator("#papers-input")
      .setInputFiles(
        path.join(
          __dirname,
          `../../docs/demo-materials/demo-paper-${lang}.jpg`,
        ),
      );
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await click(page, "grade-pending");
    await expect(page.locator(".badge.review")).toHaveCount(1);
    expect(requests).toHaveLength(2);
    expect(requests[1].max_tokens).toBe(8192);
    const content = requests[1].messages.find((m) => m.role === "user").content;
    expect(content.some((part) => part.type === "text")).toBe(true);
    expect(
      content.find((part) => part.type === "image_url").image_url.url,
    ).toMatch(/^data:image\/jpeg;base64,/);

    const downloadEvent = page.waitForEvent("download");
    await click(page, "backup");
    const exported = await fs.readFile(
      await (await downloadEvent).path(),
      "utf8",
    );
    expect(exported).not.toContain("deepseek-test-key-not-real");
    await page.reload();
    await nav(page, "settings");
    await expect(page.locator("#provider")).toHaveValue("deepseek");
    await expect(page.locator("#base-url")).toHaveValue(
      "https://api.deepseek.com",
    );
    await expect(page.locator("#model")).toHaveValue("deepseek-flash");
    await expect(page.locator("#api-key")).toHaveValue("");
    await page.screenshot({
      path: path.join(__dirname, `../../.local/deepseek-${lang}.png`),
      fullPage: true,
    });
    await page.locator("#api-key").fill("deepseek-test-key-not-real");
    await page.locator("#provider").selectOption("custom");
    await expect(page.locator("#api-key")).toHaveValue("");
    await expect(page.locator("#model")).toHaveValue("");
    await expect(page.locator("#deepseek-help")).toHaveCount(0);
  });
}
