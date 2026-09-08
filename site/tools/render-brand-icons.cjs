const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    for (const size of [32, 180, 192, 512]) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent('<style>html,body{margin:0;background:transparent}img{display:block;width:100vw;height:100vh}</style><img src="http://127.0.0.1:3000/assets/img/adcker-favicon.svg">');
      await page.locator('img').evaluate(img => img.decode());
      await page.screenshot({path:path.resolve(__dirname, `../assets/img/adcker-icon-${size}.png`), omitBackground:true});
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
