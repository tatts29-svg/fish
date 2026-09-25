// category rings and the pulsing search glow: counts, screenshots, no errors, frame cost while pulsing
const {chromium} = require('playwright'); const fs = require('fs');
(async () => {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + fs.readFileSync('../spki.txt', 'utf8').trim()]});
  const ctx = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2, ignoreHTTPSErrors: true, extraHTTPHeaders: {Referer: 'https://gc500-production.up.railway.app/'}});
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto('https://localhost:8796/', {waitUntil: 'load', timeout: 120000}); await page.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000});
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => /rendered|Satellite only|overview/i.test(document.getElementById('qualText').textContent), null, {timeout: 60000}).catch(() => {}); await page.waitForTimeout(200); };
  await page.evaluate(() => GC500Explorer.setMode('hybrid')); await settle();
  const chips = await page.$$eval('#chips .chip', b => b.map(x => x.textContent.trim())); console.log('chips', chips);
  const out = {};
  for (const [id, name] of [['buildings', 'buildings'], ['toilets', 'toilets'], ['stands', 'stands'], ['generators', 'generators'], ['barriers', 'barriers']]) {
    await page.click(`#chips [data-cat="${id}"]`); await settle(); await page.screenshot({path: `find_${name}.png`});
    out[name] = await page.evaluate(() => ({rows: document.querySelectorAll('#findList button').length, head: document.querySelector('#findList .rh')?.textContent, label: document.getElementById('viewName')?.textContent}));
  }
  // search a number: WC69, S08, P12 and an asset number
  await page.click('#chips [data-cat="toilets"]'); // toggles off
  for (const q of ['WC69', 'S08', 'P12', '142514', 'GN01']) {
    await page.fill('#q', q); await page.waitForTimeout(150); const first = await page.$eval('#results', r => r.querySelector('button')?.textContent.trim().slice(0, 80)); await page.press('#q', 'Enter'); await settle();
    const pulse = await page.evaluate(() => new Promise(r => { const t = performance.now(); let n = 0, ms = 0; (function f() { const a = performance.now(); if (window.__marksCount().pulsing) { n++; } if (performance.now() - t < 1000) requestAnimationFrame(f); else r({rafSeen: n, state: window.__marksCount()}); })(); }));
    await page.screenshot({path: `find_search_${q}.png`});
    out['search ' + q] = {first, label: await page.evaluate(() => document.getElementById('viewName')?.textContent), zoom: await page.evaluate(() => +GC500Explorer.state.zoom.toFixed(0)), pulse, toast: await page.evaluate(() => document.getElementById('toast')?.textContent)};
  }
  // tap on a ring picks it; a drag does not
  await page.fill('#q', 'S08'); await page.press('#q', 'Enter'); await settle(); await page.evaluate(() => GC500Explorer.zoom(0.5)); await settle();
  await page.click('#chips [data-cat="stands"]'); await settle(); await page.screenshot({path: 'find_stands_rings.png'});
  out.rings = await page.evaluate(() => window.__marksCount ? window.__marksCount() : null);
  out.errs = errs.slice(0, 8); console.log(JSON.stringify(out, null, 1)); await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
