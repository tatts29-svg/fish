// Author: Andrew Fisher. Screenshots of the P&L mock-up, desktop and phone, for Andrew's yes. Read-only: a local file, no network.
//   node shoot.cjs   -> pl_mock_desktop.png, pl_mock_phone.png beside this file
const path = require('path'), fs = require('fs');
const {chromium} = require('playwright');
(async () => {
  const file = 'file://' + path.join(__dirname, 'pl_mock_v1266.html');
  const b = await chromium.launch();
  for (const mobile of [false, true]) {
    const ctx = await b.newContext(mobile ? {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true} : {viewport: {width: 1280, height: 900}, deviceScaleFactor: 1});
    const p = await ctx.newPage(); await p.goto(file); await p.waitForTimeout(400);
    const out = path.join(__dirname, mobile ? 'pl_mock_phone.png' : 'pl_mock_desktop.png');
    await p.screenshot({path: out, fullPage: true});
    const h = await p.evaluate(() => document.documentElement.scrollHeight), w = await p.evaluate(() => document.documentElement.scrollWidth);
    console.log(path.basename(out), 'page', w + 'x' + h, fs.statSync(out).size, 'bytes');
    await ctx.close();
  }
  await b.close();
})();
