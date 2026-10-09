// every view starts north-up: boot, Fit, a jump, a category, the overview map; the As-drawn button turns to the sheet
const {chromium} = require('playwright'); const fs = require('fs');
(async () => {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + fs.readFileSync('../spki.txt', 'utf8').trim()]});
  for (const phone of [false, true]) {
    const ctx = await browser.newContext({viewport: phone ? {width: 390, height: 780} : {width: 1440, height: 900}, deviceScaleFactor: phone ? 3 : 2, isMobile: phone, hasTouch: phone, ignoreHTTPSErrors: true, extraHTTPHeaders: {Referer: 'https://gc500-production.up.railway.app/'}});
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
    await page.goto('https://localhost:8796/', {waitUntil: 'load', timeout: 120000}); await page.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000});
    const st = async () => page.evaluate(() => { const s = GC500Explorer.state, v = s.view; return {rot: +document.getElementById('rotOut').textContent.replace('°', ''), zoom: +s.zoom.toFixed(2), label: document.getElementById('viewName').textContent, mini: document.getElementById('mini').style.width + ' x ' + document.getElementById('mini').style.height, inner: document.getElementById('miniInner').style.transform, corners: v.corners.map(c => [Math.round(c.x), Math.round(c.y)])}; });
    const out = {phone, boot: await st()};
    await page.evaluate(() => GC500Explorer.setMode('hybrid')); await page.waitForTimeout(2500); await page.screenshot({path: (phone ? 'phone' : 'laptop') + '_start_northup.png'});
    await page.keyboard.press('d'); await page.waitForTimeout(700); out.asDrawn = await st();
    await page.keyboard.press('0'); await page.waitForTimeout(700); out.fit = await st();
    await page.evaluate(() => GC500Explorer.goto([590, 525, 1320, 985], 'Pit lane and paddock')); await page.waitForTimeout(500); out.jump = await st();
    await page.evaluate(() => document.querySelector('#chips [data-cat="stands"]').click()); await page.waitForTimeout(600); out.stands = await st();
    // overview map click lands where it points: click the centre of the overview and read the camera centre
    const mr = await page.$eval('#mini', m => { const r = m.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
    await page.mouse.click(mr.x, mr.y); await page.waitForTimeout(300); out.miniCentreClick = await page.evaluate(() => { const v = GC500Explorer.state.view; const c = v.corners; return [Math.round((c[0].x + c[3].x) / 2), Math.round((c[0].y + c[3].y) / 2)]; });
    out.errs = errs.slice(0, 5); console.log(JSON.stringify(out)); await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
