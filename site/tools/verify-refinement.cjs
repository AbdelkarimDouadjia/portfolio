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
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: width === 320 ? "reduce" : "no-preference" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", response => {
        if (response.url().startsWith(base) && response.status() >= 400) errors.push(response.status() + " " + response.url());
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => getComputedStyle(document.querySelector("#loader")).visibility === "hidden");
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(output, "hero-" + width + ".png") });
      await page.locator(".hero-note a").click();
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
      }
      assert.equal(await page.locator("#journey .practice-entry").count(), 1);
      assert.ok(!(await page.locator("#journey").textContent()).includes("internship"));
      await scrollSection("[data-tool-scene]");
      await page.waitForSelector("[data-tool-scene].is-ready");
      const canvas = page.locator("[data-tool-scene] canvas");
      const pixels = await canvas.evaluate(canvas => {
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        const rgba = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
        let count = 0;
        for (let i = 3; i < rgba.length; i += 4) if (rgba[i]) count++;
        return count;
      });
      assert.ok(pixels > 200, "Blank data sculpture");
      const before = await canvas.evaluate(canvas => canvas.toDataURL());
      await page.locator('[data-tool-mode="2"]').click();
      await page.waitForTimeout(1100);
      assert.equal(await page.locator('[data-tool-mode="2"]').getAttribute("aria-pressed"), "true");
      assert.notEqual(await canvas.evaluate(canvas => canvas.toDataURL()), before, "Sculpture did not change");
      await page.screenshot({ path: path.join(output, "sculpture-" + width + ".png") });
      await page.goto(new URL("project-detail.html?repo=Sign-language-detector-python", base).href, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      const header = page.locator(".project-home-header");
      assert.equal(await header.evaluate(el => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)");
      assert.ok((await header.evaluate(el => getComputedStyle(el, "::before").backgroundImage)).includes("linear-gradient"));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, "detail-" + width + ".png") });
      await page.locator('.project-main-navigation a[data-letters="works"]').click();
      await page.waitForURL("**/index.html#w");
      assert.deepEqual(errors, []);
      console.log("Passed hero, about, education, 3D pixels/morph, and navbar at " + width + "px");
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
