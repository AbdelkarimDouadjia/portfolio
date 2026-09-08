const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SITE_URL || "http://127.0.0.1:3000/";
const output = path.resolve(__dirname, "../verification/refinement");
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    const widths = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [1366, 1920, 390, 320];
    for (const width of widths) {
      const height = width === 1366 ? 768 : width === 1920 ? 1080 : 844;
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: width === 320 ? "reduce" : "no-preference" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", response => {
        if (response.url().startsWith(new URL(base).origin) && response.status() >= 400) errors.push(response.status() + " " + response.url());
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => getComputedStyle(document.querySelector("#loader")).visibility === "hidden");
      await page.evaluate(() => document.fonts.ready);
      if (width < 720) {
        const coverage = await page.locator("#ascii-canvas").evaluate(canvas => {
          const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
          const counts = [0, 0, 0];
          for (let y = Math.floor(canvas.height * .42); y < canvas.height * .56; y++) {
            for (let x = 22; x < canvas.width - 22; x++) {
              const i = (y * canvas.width + x) * 4;
              if (data[i + 3] > 100) counts[Math.min(2, Math.floor(x / (canvas.width / 3)))]++;
            }
          }
          return counts;
        });
        assert.ok(coverage.every(count => count > 100), "Mobile ASCII name must span the central canvas");
      }
      await page.screenshot({ path: path.join(output, "hero-" + width + ".png") });
      assert.equal(await page.locator("#header").evaluate(el => getComputedStyle(el, "::before").content), "none");
      assert.ok((await page.locator(".hero-ticker").boundingBox()).y < height);
      const heroFoot = await page.locator("#hero-bottom").boundingBox();
      const ticker = await page.locator(".hero-ticker").boundingBox();
      assert.ok(heroFoot.y + heroFoot.height <= ticker.y, "Hero footer is clipped by the separator");
      const tickerBefore = await page.locator(".hero-ticker__track").evaluate(el => getComputedStyle(el).transform);
      await page.waitForTimeout(300);
      if (width !== 320) assert.notEqual(await page.locator(".hero-ticker__track").evaluate(el => getComputedStyle(el).transform), tickerBefore);
      await page.locator(".hero-work-link").click();
      await page.waitForFunction(() => Math.abs(document.querySelector("#w").getBoundingClientRect().top - 108) < 5, { timeout: 30000 });
      async function scrollSection(selector) {
        await page.locator(selector).evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 80));
        await page.waitForFunction(() => {
          const t = getComputedStyle(document.querySelector("#t")).transform;
          return t === "none" || Math.abs(new DOMMatrix(t).m42 + scrollY) < 2;
        }, { timeout: 30000 });
        await page.waitForTimeout(500);
      }
      for (const [selector, name] of [["#profile-signal", "about"], ["#journey", "education"], ["#working-set", "tools"]]) {
        await scrollSection(selector);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name + " overflow " + width);
        await page.screenshot({ path: path.join(output, name + "-" + width + ".png") });
        if (name === "about" && width === 390) {
          const coloredPixels = await page.locator("[data-ascii-portrait] canvas").evaluate(canvas => {
            const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
            let count = 0;
            for (let i = 0; i < data.length; i += 4) if (data[i] > 50 && data[i + 1] > 40) count++;
            return count;
          });
          assert.ok(coloredPixels > 2000, "Mobile portrait reveal is blank");
        }
      }
      assert.equal(await page.locator("#journey .practice-entry").count(), 2);
      assert.ok(!(await page.locator("#journey").textContent()).includes("internship"));
      await scrollSection("[data-tool-scene]");
      await page.locator('[data-tool-mode="1"]').click();
      assert.equal(await page.locator('[data-tool-mode="1"]').getAttribute("aria-pressed"), "true");
      assert.deepEqual(await page.locator(".workflow__steps strong").allTextContents(), ["Documents", "Chunks", "Retrieval", "Answer"]);
      await scrollSection("[data-tool-scene]");
      const active = await page.locator(".workflow__steps .is-current strong").textContent();
      if (width !== 320) await page.waitForFunction(previous => document.querySelector(".workflow__steps .is-current strong").textContent !== previous, active);
      await page.screenshot({ path: path.join(output, "workflow-" + width + ".png") });
      await page.goto(new URL("project-detail.html?repo=Sign-language-detector-python", base).href, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      const header = page.locator(".project-home-header");
      assert.equal(await header.evaluate(el => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)");
      assert.equal(await header.evaluate(el => getComputedStyle(el, "::before").content), "none");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, "detail-" + width + ".png") });
      await page.locator('.project-main-navigation a[data-letters="works"]').click();
      await page.waitForURL("**/index.html#w");
      assert.deepEqual(errors, []);
      console.log("Passed hero/ticker, personal intro, education, meaningful workflow, and transparent navbar at " + width + "px");
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
