const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.SITE_URL || "http://127.0.0.1:3000/";
const output = path.resolve(__dirname, "../verification/release");
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => getComputedStyle(document.querySelector("#loader")).visibility === "hidden", { timeout: 20000 });
      const sections = await page.evaluate(() => Object.fromEntries(
        ["#profile-signal", "#skills", ".phase-shift", ".stack-lab"].map(selector => {
          const e = document.querySelector(selector);
          return [selector, { top: e.getBoundingClientRect().top + scrollY, height: e.offsetHeight }];
        })
      ));
      async function scrollTo(y) {
        await page.evaluate(y => window.scrollTo(0, y), y);
        await page.waitForFunction(() => {
          const transform = getComputedStyle(document.querySelector("#t")).transform;
          return transform === "none" || Math.abs(new DOMMatrix(transform).m42 + scrollY) < 2;
        }, { timeout: 25000 });
        await page.waitForTimeout(500);
      }
      const signal = sections["#profile-signal"];
      await scrollTo(signal.top + (signal.height - 800) * .5);
      assert.ok(await page.locator("[data-ascii-portrait] canvas").count());
      await page.screenshot({ path: path.join(output, `signal-motion-${width}.png`) });
      const statement = sections["#skills"];
      await scrollTo(statement.top + (statement.height - 800) * .98);
      assert.ok(await page.locator("#skills").evaluate(e => Number(e.style.getPropertyValue("--spotlight-paper-progress"))) > .9);
      await page.locator(".spotlight-story__spot").first().focus();
      await page.waitForTimeout(850);
      assert.ok(await page.locator(".spotlight-story__card").first().evaluate(e => e.getBoundingClientRect().width) > 150);
      await page.screenshot({ path: path.join(output, `statement-hover-${width}.png`) });
      const phase = sections[".phase-shift"];
      await scrollTo(phase.top + phase.height - 820);
      assert.equal((await page.locator("[data-phase-word].is-active").textContent()).trim(), "Prove.");
      const glyphs = await page.locator("[data-phase-glyphs]").evaluate(canvas => {
        const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let ink = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i]) ink++;
        return ink;
      });
      assert.ok(glyphs > 20, "PROVE glyph field is blank");
      await page.screenshot({ path: path.join(output, `prove-motion-${width}.png`) });
      await page.goto(new URL("projects.html", base).href, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const card = page.locator(".repo-card").first();
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      if (width > 1000) {
        await card.locator("img").hover();
        await page.waitForTimeout(800);
        assert.ok(await page.locator(".pixel-hover-canvas[data-active]").count(), "Pixel hover did not attach");
      }
      await card.click();
      await page.waitForURL("**/project-detail.html?repo=Sign-language-detector-python");
      assert.deepEqual(errors, []);
      console.log(`Passed signal canvas, image preview, PROVE pixels, and animated project navigation at ${width}px`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
