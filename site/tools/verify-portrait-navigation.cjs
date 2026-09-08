const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.SITE_URL || 'http://127.0.0.1:3000/';
const output = path.resolve(__dirname, '../verification/portrait-navigation');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of (process.argv.slice(2).map(Number).length ? process.argv.slice(2).map(Number) : [1366, 390, 320])) {
      const height = width === 1366 ? 768 : 844;
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: width === 320 ? 'reduce' : 'no-preference' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.url().startsWith(new URL(base).origin) && r.status() >= 400) errors.push(r.status()+' '+r.url()); });
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#loader')).visibility === 'hidden');
      await page.evaluate(() => document.fonts.ready);
      async function settle() {
        await page.waitForFunction(() => {
          const t = getComputedStyle(document.querySelector('#t')).transform;
          return t === 'none' || Math.abs(new DOMMatrix(t).m42 + scrollY) < 1;
        });
        await page.waitForTimeout(350);
      }
      async function place(selector, top) {
        await page.locator(selector).first().evaluate((el, top) => {
          let y = 0; for (let node = el; node; node = node.offsetParent) y += node.offsetTop;
          window.scrollTo({ top: y-top, behavior: 'instant' });
        }, top);
        await settle();
      }
      for (const hash of ['#w', '#skills', '#contact', '#t']) {
        await page.locator(`#header a[href="${hash}"]`).click();
        await page.waitForTimeout(1600);
        await settle();
        assert.equal(await page.evaluate(() => location.hash), hash);
        if (hash === '#skills') {
          assert.ok(await page.locator('.spotlight-story__inner').evaluate(el => Number(getComputedStyle(el).opacity)) > .95);
        } else if (hash === '#t') assert.equal(await page.evaluate(() => scrollY), 0);
        else assert.ok(Math.abs((await page.locator(hash).boundingBox()).y - 108) < 4, hash);
      }
      assert.equal(await page.locator('#header').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      if (width !== 320) {
        await place('[data-ascii-portrait]', height * .72);
        await page.locator('[data-ascii-portrait].ascii-ready').waitFor();
        const ascii = await page.locator('[data-ascii-portrait] canvas').screenshot();
        fs.writeFileSync(path.join(output, `ascii-${width}.png`), ascii);
        const ink = await page.locator('[data-ascii-portrait] canvas').evaluate(c => {
          const data = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          let n = 0; for(let i=3;i<data.length;i+=4) if(data[i]>20) n++;
          return n;
        });
        assert.ok(ink > 500, 'ASCII portrait is blank');
        await page.screenshot({path:path.join(output,`about-ascii-${width}.png`)});
        await place('[data-ascii-portrait]', height * .1);
        const photo = await page.locator('[data-ascii-portrait] canvas').screenshot();
        fs.writeFileSync(path.join(output, `portrait-${width}.png`), photo);
        assert.ok(!ascii.equals(photo), 'Scroll must change the portrait');
        assert.ok(Number(await page.locator('[data-ascii-portrait]').getAttribute('data-ascii-progress')) > .95);
      } else {
        await place('[data-ascii-portrait]', 160);
        assert.equal(await page.locator('[data-ascii-portrait] img').evaluate(el => getComputedStyle(el).opacity), '1');
      }
      await page.locator('#header a[href="#skills"]').click();
      await page.waitForTimeout(1800); await settle();
      const spots = page.locator('.spotlight-story__spot');
      for (let i = 0; i < 4; i++) {
        await spots.nth(i).focus();
        await page.waitForTimeout(850);
        const card = spots.nth(i).locator('.spotlight-story__card');
        assert.ok(await card.locator('img').evaluate(el => el.complete && el.naturalWidth > 1000));
        const rect = await card.boundingBox();
        assert.ok(rect.width > 180 && rect.x >= 0 && rect.x + rect.width <= width + 1, `Preview ${i} clipped at ${width}`);
        assert.ok(await card.evaluate(el => getComputedStyle(el).clipPath.startsWith('polygon')));
        await page.screenshot({path:path.join(output,`preview-${i}-${width}.png`)});
      }
      await spots.last().blur();
      if (width === 1366) {
        await place('.projects .img-wrap', 150);
        await page.waitForTimeout(1600);
        const imageFrame = page.locator('.projects .img-wrap').first();
        const before = await imageFrame.boundingBox();
        await imageFrame.hover(); await page.waitForTimeout(550);
        assert.equal(await imageFrame.locator('.pixel-hover-canvas.is-visible').count(), 1);
        assert.equal(await imageFrame.evaluate(el => getComputedStyle(el).zIndex), '0');
        assert.equal(await page.locator('.projects .cta').first().evaluate(el => getComputedStyle(el).zIndex), '2');
        assert.ok(Math.abs((await imageFrame.boundingBox()).height - before.height) < 2);
        await page.screenshot({path:path.join(output,'project-hover.png')});
        await page.mouse.move(2, 500);
      }
      await place('#mats-appendix', 40);
      await page.locator('.mats-footer-nav[href="#w"]').click();
      await page.waitForTimeout(2000); await settle();
      assert.ok(Math.abs((await page.locator('#w').boundingBox()).y-108)<4, 'Footer work anchor');
      await place('#mats-appendix', 40);
      await page.locator('.mats-footer-nav').filter({hasText:'Back to top'}).click();
      await page.waitForTimeout(2000); await settle();
      assert.equal(await page.evaluate(() => scrollY), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 1366) {
        await place('.projects .img-wrap', 150);
        await page.waitForTimeout(1500);
        await page.locator('.projects .item-img:not(.item-img--full)').first().click();
        await page.waitForURL('**/project-detail.html?repo=Sign-language-detector-python');
        await page.locator('.project-main-navigation a[data-letters="skills"]').click();
        await page.waitForURL('**/index.html#skills');
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#loader')).visibility === 'hidden');
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.spotlight-story__inner')).opacity) > .95);
      }
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`Passed navigation, ASCII scroll, four art frames, hover layers, and footer at ${width}px`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
