const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.SITE_URL || "http://127.0.0.1:3000/";
const output = path.resolve(__dirname, "../verification/release");
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", response => {
        if (response.url().startsWith(base) && response.status() >= 400) {
          errors.push(`${response.status()} ${response.url()}`);
        }
      });
      for (const route of ["", "projects.html", "project-detail.html?repo=Sign-language-detector-python"]) {
        await page.goto(new URL(route, base).href, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(route ? 1800 : 6500);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${route} / ${viewport.width}`);
        const name = route.startsWith("project-detail") ? "detail" : route ? "archive" : "home";
        await page.screenshot({ path: path.join(output, `${name}-${viewport.width}.png`) });
        if (!route) {
          const statement = (await page.locator("#spotlight-story-title").textContent()).replace(/\s+/g, " ").trim();
          assert.equal(statement, "I build systems that see and learn from data to make useful products.");
          assert.equal(await page.locator("#journey .practice-entry").count(), 4);
          for (const [selector, label] of [["#skills", "statement"], ["#journey", "journey"]]) {
            await page.locator(selector).scrollIntoViewIfNeeded();
            await page.waitForTimeout(400);
            await page.locator(selector).screenshot({ path: path.join(output, `${label}-${viewport.width}.png`) });
          }
        } else if (name === "archive") {
          await page.locator('[data-filter="ai-ml"]').click();
          assert.ok(await page.locator(".repo-card:visible").count() > 0, "AI filter has no results");
        } else {
          assert.ok((await page.locator("[data-project-title]").textContent()).toLowerCase().includes("sign"));
          assert.ok((await page.locator("[data-project-github]").getAttribute("href")).includes("github.com/AbdelkarimDouadjia/Sign-language-detector-python"));
          assert.ok(await page.locator("[data-project-image]").evaluate(img => img.complete && img.naturalWidth > 0));
          await page.locator(".project-brief-section").screenshot({ path: path.join(output, `brief-${viewport.width}.png`) });
        }
      }
      assert.deepEqual(errors, [], `Browser errors at ${viewport.width}`);
      console.log(`Passed home, journey, archive filters, and project detail at ${viewport.width}px`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
