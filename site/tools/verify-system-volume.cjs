const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SITE_URL || "http://127.0.0.1:3000/dist/index.html";
const out = path.resolve(__dirname, "../verification/system-volume");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of (process.argv.length > 2 ? process.argv.slice(2).map(Number) : [1366, 390, 320])) {
      const page = await browser.newPage({ viewport: { width, height: width === 1366 ? 768 : 844 }, reducedMotion: width === 320 ? "reduce" : "no-preference" });
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("console", e => { if (e.type() === "error") errors.push(e.text()); });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => getComputedStyle(document.querySelector("#loader")).visibility === "hidden");
      await page.waitForTimeout(700);
      assert.ok(!(await page.locator("body").textContent()).includes("Selected portfolio / 2026"));
      assert.ok(!(await page.locator("body").textContent()).includes("Always a student."));
      assert.equal(await page.locator("#main-wrap").evaluate(e => getComputedStyle(e).clipPath), "none");
      await page.screenshot({ path: path.join(out, `hero-${width}.png`) });
      async function scrollTo(selector, offset = 85) {
        await page.locator(selector).first().evaluate((el, offset) => scrollTo(0, el.getBoundingClientRect().top + scrollY - offset), offset);
        await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector("#t")).transform).m42 + scrollY) < 2);
        await page.waitForTimeout(600);
      }
      if (width === 1366) {
        const frame = page.locator(".projects .img-wrap").first();
        await scrollTo(".projects .img-wrap", 130);
        await page.waitForTimeout(1200);
        const before = await frame.boundingBox();
        await frame.hover();
        await page.waitForTimeout(400);
        const after = await frame.boundingBox();
        assert.ok(Math.abs(before.height - after.height) < 2);
        const canvas = page.locator(".pixel-hover-canvas");
        assert.ok(await canvas.evaluate(el => getComputedStyle(el).clipPath.startsWith("inset(")));
        await page.screenshot({ path: path.join(out, "project-hover.png") });
        await page.mouse.move(2, 500);
      }
      await scrollTo("#working-notes");
      await page.screenshot({ path: path.join(out, `notes-${width}.png`) });
      await scrollTo("#journey");
      assert.equal(await page.locator("#journey .practice-entry").count(), 2);
      await page.screenshot({ path: path.join(out, `education-${width}.png`) });
      await scrollTo("[data-tool-scene]");
      const volume = page.locator("[data-system-volume]");
      await volume.locator("canvas").waitFor();
      await page.waitForTimeout(800);
      const canvasShot = await volume.locator("canvas").screenshot();
      const pixels = await page.evaluate(async url => {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let count = 0;
        for(let i=0;i<data.length;i+=4) if(data[i] > 70 && data[i+1] > 70) count++;
        return count;
      }, "data:image/png;base64," + canvasShot.toString("base64"));
      assert.ok(pixels > 300, `Three.js scene is blank at ${width}px: ${pixels}`);
      const first = await volume.screenshot();
      if (width !== 320) {
        await page.waitForTimeout(700);
        assert.ok(!first.equals(await volume.screenshot()), "Scene must animate");
      }
      await page.screenshot({ path: path.join(out, `learning-${width}.png`) });
      for (const mode of [1,2,3]) {
        await page.locator(`[data-tool-mode="${mode}"]`).click();
        assert.equal(await volume.getAttribute("data-mode"), String(mode));
        await scrollTo("[data-tool-scene]");
        await page.waitForTimeout(1200);
        await page.screenshot({ path: path.join(out, `mode-${mode}-${width}.png`) });
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`Passed transparent navigation, fixed crop, notes, education and 4 Three.js modes at ${width}px`);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
