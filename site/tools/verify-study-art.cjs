const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SITE_URL || "http://127.0.0.1:3000/dist/index.html";
const out = path.resolve(__dirname, "../verification/study-art");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1366, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 1366 ? 900 : 844 } });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", r => { if (r.url().startsWith(new URL(base).origin) && r.status() >= 400) errors.push(r.status() + " " + r.url()); });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => getComputedStyle(document.querySelector("#loader")).visibility === "hidden");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      assert.equal(await page.locator('a[data-mats-force="x"]').getAttribute("href"), "https://x.com/adckerX");
      assert.equal(await page.locator('a[data-mats-force="x"] .mats-row-value').textContent(), "@adckerX");
      assert.equal(await page.locator('meta[name="twitter:creator"]').getAttribute("content"), "@adckerX");
      assert.ok(!(await page.content()).includes("Abdelkarim_dev"));
      const track = page.locator(".hero-ticker__track");
      assert.ok(!(await track.textContent()).includes("+"));
      assert.equal(await track.locator("i").count(), 8);
      assert.ok(await track.locator("span").first().evaluate(el => getComputedStyle(el).fontFamily.includes("AdckerOldEnglish")));
      assert.ok(await track.locator("i").first().evaluate(el => getComputedStyle(el).backgroundImage.includes("adcker-logo-exact-transparent.png")));
      const groups = await track.locator("span").evaluateAll(els => els.map(e => e.getBoundingClientRect().width));
      assert.ok(Math.abs(groups[0] - groups[1]) < 1);
      await page.screenshot({ path: path.join(out, `hero-${width}.png`) });
      async function scrollTo(selector) {
        await page.locator(selector).first().evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 85));
        await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector("#t")).transform).m42 + scrollY) < 2);
        await page.waitForTimeout(700);
      }
      await scrollTo("#working-notes");
      await page.locator(".process-study__media img").evaluateAll(images => Promise.all(images.map(img => img.decode())));
      const images = await page.locator(".process-study__media img").evaluateAll(els => els.map(e => ({ src:e.getAttribute("src"), width:e.naturalWidth, height:e.naturalHeight })));
      assert.equal(new Set(images.map(i => i.src)).size, 3);
      assert.ok(images.every(i => i.src.startsWith("assets/img/studies/") && i.width === 1254 && i.height === 1254));
      await page.screenshot({ path: path.join(out, `studies-${width}.png`) });
      if (width === 390) for (const index of [2,3]) {
        await scrollTo(`.process-study__item:nth-child(${index})`);
        await page.screenshot({ path: path.join(out, `study-${index}-${width}.png`) });
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.ok((await page.locator(".projects .item-img").first().getAttribute("src")).includes("sign-language-detector.png"));
      assert.deepEqual(errors, []);
      console.log(`Passed new generated artwork, branded separator and X account at ${width}px`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
