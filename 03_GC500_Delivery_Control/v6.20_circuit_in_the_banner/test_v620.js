const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const out = {};
  for (const [name, vp, mobile] of [['laptop', {width: 1366, height: 768}, false], ['tablet', {width: 1024, height: 768}, false], ['phone', {width: 390, height: 844}, true]]) {
    const page = await (await browser.newContext({viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile})).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(4000);
    // the real day: whatever is due; then a sample set of positioned references so the pins and the menu can be seen
    const real = await page.evaluate(() => ({sub: document.querySelector('#hzmapSub').textContent, pins: document.querySelectorAll('.hzpin').length, mapH: Math.round(document.querySelector('#hzmap').getBoundingClientRect().height), headerH: Math.round(document.querySelector('header.top').getBoundingClientRect().height), sw: document.documentElement.scrollWidth}));
    await page.evaluate(() => { const f = todayFigures(); f.list = allAssets().filter(a => { try { return !!aerialPointFor(a); } catch (e) { return false; } }).slice(0, 14); f.due = f.list.length; hzMapPins(f); });
    await page.waitForTimeout(600);
    const sample = await page.evaluate(() => ({pins: document.querySelectorAll('.hzpin:not([hidden])').length, sub: document.querySelector('#hzmapSub').textContent}));
    await page.screenshot({path: `tabs610/v620_${name}.png`, clip: {x: 0, y: 0, width: vp.width, height: Math.min(vp.height, real.headerH + 60)}});
    const pt = await page.evaluate(() => { const box = document.querySelector('#hzmap').getBoundingClientRect(); const ps = [...document.querySelectorAll('.hzpin:not([hidden])')].map(p => p.getBoundingClientRect()).filter(r => r.top > box.top + 40 && r.bottom < box.bottom - 10 && r.left > box.left + 10 && r.right < box.right - 10); const r = ps[0]; return r ? {x: r.left + r.width / 2, y: r.top + r.height / 2, n: ps.length} : null; });
    let menu = null; const pin = pt;
    if (pin) { await page.mouse.click(pin.x, pin.y); await page.waitForTimeout(400); menu = await page.evaluate(() => { const m = document.querySelector('#hzpinmenu'); return m ? [...m.querySelectorAll('button')].map(b => b.textContent) : null; });
      await page.screenshot({path: `tabs610/v620_${name}_menu.png`, clip: {x: 0, y: 0, width: vp.width, height: Math.min(vp.height, real.headerH + 60)}}); }
    out[name] = {real, sample, menu, errs};
    await page.context().close();
  }
  console.log(JSON.stringify(out)); await browser.close(); })();
