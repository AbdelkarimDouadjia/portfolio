/**
 * Requires: npm i -D playwright && npx playwright install chromium
 * Run: npm run start (serve on 3000) in another terminal, then: node tools/verify-screenshots.cjs
 */
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "doc", "verify");
const baseUrl = process.env.VERIFY_URL || "http://127.0.0.1:3000/";

async function main() {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.error("Install Playwright: npm i -D playwright && npx playwright install chromium");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, "01-initial.png") });

  await page.evaluate(() => {
    const l = document.getElementById("loader");
    if (l) l.classList.add("loading--end");
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "02-after-loader-dismiss.png") });

  const ok = await page.evaluate(() => {
    const bg = document.querySelector("#movie-bg");
    const mw = document.querySelector("#main-wrap");
    const hero = document.querySelector(".abdelkarim-clone-hero");
    const nav = document.querySelector("#site-header");
    const hStyle = nav ? getComputedStyle(nav) : null;
    return {
      movieBgOpacity: bg ? getComputedStyle(bg).opacity : null,
      mainWrapZ: mw ? getComputedStyle(mw).zIndex : null,
      heroRect: hero ? hero.getBoundingClientRect() : null,
      siteHeaderTransform: hStyle ? hStyle.transform : null,
      siteHeaderTextSample: nav && nav.innerText ? nav.innerText.replace(/\s+/g, " ").trim().slice(0, 120) : null
    };
  });
  fs.writeFileSync(path.join(outDir, "computed-styles.json"), JSON.stringify(ok, null, 2));

  await page.screenshot({
    path: path.join(outDir, "03-viewport-hero.png"),
    clip: { x: 0, y: 0, width: 1280, height: 800 }
  });

  await browser.close();
  console.log("Wrote screenshots to", outDir);
  console.log("Sample computed:", ok);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
