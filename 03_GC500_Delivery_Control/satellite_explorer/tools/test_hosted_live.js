// the explorer and the 3D proof served by the service itself (local copy, v5.79) under /w/<token>/…: CSP, key route with the
// link's token, packed tiles by range, no console errors
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + require('fs').readFileSync('../spki.txt', 'utf8').trim()]});
  const ctx = await browser.newContext({ignoreHTTPSErrors: true, viewport: {width: 1440, height: 900}, deviceScaleFactor: 2, args: []});
  const page = await ctx.newPage(); const errs = [], net = {sat: 0, vt206: 0, bad: [], csp: 0};
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') { errs.push(m.text().slice(0, 160)); if (/Content Security Policy/.test(m.text())) net.csp++; } });
  page.on('response', r => { const u = r.url(); if (/api\.mapbox\.com\/v4/.test(u)) net.sat++; if (/vt\/L.*\.bin/.test(u) && r.status() === 206) net.vt206++; if (r.status() >= 400) net.bad.push(r.status() + ' ' + u.slice(0, 90)); });
  const base = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/';
  for (let k = 0; k < 4; k++) { try { await page.goto(base + 'explorer/index.html', {waitUntil: 'load', timeout: 120000}); break; } catch (e) { if (k === 3) throw e; await page.waitForTimeout(3000); } } await page.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000});
  const boot = await page.evaluate(() => window.__bootError || 'ready');
  await page.evaluate(() => GC500Explorer.setMode('hybrid')); await page.waitForTimeout(400); await page.waitForFunction(() => /rendered|Satellite only/i.test(document.getElementById('qualText').textContent), null, {timeout: 60000}).catch(() => {});
  await page.fill('#q', 'WC69'); await page.press('#q', 'Enter'); await page.waitForTimeout(2500); await page.screenshot({path: 'hosted_live_explorer.png'});
  const out = {explorer: {boot, net: {...net, bad: net.bad.slice(0, 6)}, errs: errs.slice(0, 6), keyState: await page.evaluate(() => document.getElementById('qualText').textContent)}};
  console.log('EXPLORER ' + JSON.stringify(out.explorer)); errs.length = 0; net.sat = 0; net.vt206 = 0; net.bad = []; net.csp = 0;
  const p2 = await ctx.newPage(); const e2 = [], n2 = {tiles: 0, bad: [], csp: 0};
  p2.on('pageerror', e => e2.push('pageerror: ' + e.message)); p2.on('console', m => { if (m.type() === 'error') { e2.push(m.text().slice(0, 160)); if (/Content Security Policy/.test(m.text())) n2.csp++; } });
  p2.on('response', r => { const u = r.url(); if (/tile\.googleapis\.com/.test(u)) n2.tiles++; if (r.status() >= 400) n2.bad.push(r.status() + ' ' + u.slice(0, 90)); });
  for (let k = 0; k < 4; k++) { try { await p2.goto(base + 'poc3d/index.html', {waitUntil: 'load', timeout: 120000}); break; } catch (e) { if (k === 3) throw e; await p2.waitForTimeout(3000); } } await p2.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000});
  await p2.waitForTimeout(15000); await p2.screenshot({path: 'hosted_live_3d.png', timeout: 150000}).catch(e => console.log('3d screenshot skipped: ' + e.message.slice(0, 60)));
  out.poc3d = {boot: await p2.evaluate(() => window.__bootError || 'ready'), perf: await p2.evaluate(() => document.getElementById('perf').textContent), net: {...n2, bad: n2.bad.slice(0, 6)}, errs: e2.slice(0, 6)};
  console.log(JSON.stringify(out, null, 1)); await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
