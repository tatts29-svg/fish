const {chromium} = require('playwright'); const fs = require('fs');
(async () => {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + fs.readFileSync('../spki.txt', 'utf8').trim()]});
  const ctx = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2, ignoreHTTPSErrors: true, extraHTTPHeaders: {Referer: 'https://gc500-production.up.railway.app/'}});
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await page.goto('https://localhost:8796/', {waitUntil: 'load', timeout: 120000}); await page.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000});
  await page.evaluate(() => { GC500Explorer.setMode('hybrid'); GC500Explorer.goto([590, 525, 1320, 985], 'Pit lane and paddock'); }); await page.waitForTimeout(5000);
  const before = await page.evaluate(() => ({rot: document.getElementById('rotOut').textContent, compass: document.getElementById('compass').style.transform}));
  await page.click('#northBtn'); await page.waitForTimeout(4500); await page.screenshot({path: 'rot_northup.png'});
  const north = await page.evaluate(() => ({rot: document.getElementById('rotOut').textContent, compass: document.getElementById('compass').style.transform, qual: document.getElementById('qualText').textContent}));
  // a point under the cursor stays put through a wheel zoom at this angle
  const off = await page.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return {x: r.left, y: r.top}; }); const probe = await page.evaluate(o => screenToSource(700 - o.x, 450 - o.y), off);
  await page.mouse.move(700, 450); await page.mouse.wheel(0, -240); await page.waitForTimeout(600);
  const probe2 = await page.evaluate(o => screenToSource(700 - o.x, 450 - o.y), off);
  await page.click('#rotR'); await page.click('#rotR'); await page.click('#rotR'); await page.waitForTimeout(3500); await page.screenshot({path: 'rot_45.png'});
  const after = await page.evaluate(() => ({rot: document.getElementById('rotOut').textContent, qual: document.getElementById('qualText').textContent}));
  // drag follows the screen: drag right 200px, the sheet point under the cursor should move with it
  const p0 = await page.evaluate(() => screenToSource(600, 400)); await page.mouse.move(600, 400); await page.mouse.down(); await page.mouse.move(700, 400, {steps: 8}); await page.mouse.move(800, 400, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(400);
  const p1 = await page.evaluate(() => screenToSource(800, 400));
  console.log(JSON.stringify({before, north, probeDrift: Math.hypot(probe.x - probe2.x, probe.y - probe2.y).toFixed(2) + ' pt', after, dragDrift: Math.hypot(p0.x - p1.x, p0.y - p1.y).toFixed(2) + ' pt', errs: errs.slice(0, 5)}, null, 1)); await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
