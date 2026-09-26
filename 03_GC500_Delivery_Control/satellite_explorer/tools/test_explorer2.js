// explorer test after the pyramid: laptop and phone profiles; time-to-detail per view, frame cost during a zoom
// burst, tile counts, screenshots at a ladder of zooms.  node test_explorer2.js [laptop|phone]
const {chromium} = require('playwright'); const fs = require('fs');
const PROFILE = process.argv[2] || 'laptop';
(async () => {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + fs.readFileSync('../spki.txt', 'utf8').trim()]});
  const phone = PROFILE === 'phone';
  const ctx = await browser.newContext({viewport: phone ? {width: 390, height: 780} : {width: 1440, height: 900}, deviceScaleFactor: phone ? 3 : 2, isMobile: phone, hasTouch: phone, ignoreHTTPSErrors: true, extraHTTPHeaders: {Referer: 'https://gc500-production.up.railway.app/'}});
  const page = await ctx.newPage(); const errs = [], net = {sat: 0, vt: 0, bad: 0};
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  page.on('response', r => { const u = r.url(); if (/api\.mapbox\.com\/v4/.test(u)) { net.sat++; if (r.status() >= 400) net.bad++; } else if (/assets\/vt\//.test(u)) { net.vt++; } else if (r.status() >= 400) errs.push(r.status() + ' ' + u.slice(0, 120)); });
  const t0 = Date.now(); await page.goto('https://localhost:8796/', {waitUntil: 'load', timeout: 120000});
  await page.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000}); const out = {profile: PROFILE, loadMs: Date.now() - t0, bootError: await page.evaluate(() => window.__bootError || null)};
  const settle = async (label) => { const t = Date.now(); await page.waitForTimeout(250); await page.waitForFunction(() => /rendered|Satellite only|overview/i.test(document.getElementById('qualText').textContent), null, {timeout: 60000}).catch(() => {}); return {label, ms: Date.now() - t, qual: await page.evaluate(() => document.getElementById('qualText').textContent)}; };
  const steps = [];
  await page.evaluate(() => GC500Explorer.setMode('hybrid')); steps.push(await settle('hybrid overview')); await page.screenshot({path: `${PROFILE}_01_overview.png`});
  await page.evaluate(() => GC500Explorer.goto([590, 525, 1320, 985], 'Pit lane and paddock')); steps.push(await settle('pit 316%')); await page.screenshot({path: `${PROFILE}_02_pit.png`});
  for (const z of [10, 40, 160, 640]) { await page.evaluate(z => GC500Explorer.zoom(z), z); steps.push(await settle('zoom ' + z * 100 + '%')); await page.screenshot({path: `${PROFILE}_03_zoom${z * 100}.png`}); }
  await page.evaluate(() => GC500Explorer.setMode('original')); await page.evaluate(() => GC500Explorer.goto([1455, 855, 2340, 1470], 'Inset plan')); steps.push(await settle('original inset')); await page.screenshot({path: `${PROFILE}_04_original_inset.png`});
  await page.evaluate(() => GC500Explorer.setMode('hybrid')); steps.push(await settle('hybrid inset')); await page.screenshot({path: `${PROFILE}_05_hybrid_inset.png`});
  await page.evaluate(() => GC500Explorer.setMode('satellite')); steps.push(await settle('satellite inset')); await page.screenshot({path: `${PROFILE}_06_satellite_inset.png`});
  // a zoom burst in hybrid: frame cost while the wheel is turning
  await page.evaluate(() => { GC500Explorer.setMode('hybrid'); GC500Explorer.fit(); }); await page.waitForTimeout(2500);
  const before = await page.evaluate(() => ({f: window.__perf.frames, ms: window.__perf.frameMs}));
  await page.mouse.move(phone ? 195 : 720, phone ? 390 : 450); const t1 = Date.now(); for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, -80); await page.waitForTimeout(20); } const burstMs = Date.now() - t1;
  const after = await page.evaluate(() => ({f: window.__perf.frames, ms: window.__perf.frameMs, zoom: GC500Explorer.state.zoom}));
  out.burst = {wallMs: burstMs, frames: after.f - before.f, avgFrameMs: +((after.ms - before.ms) / Math.max(1, after.f - before.f)).toFixed(1), zoomAfter: +after.zoom.toFixed(1)};
  steps.push(await settle('after burst')); await page.screenshot({path: `${PROFILE}_07_after_burst.png`});
  out.steps = steps; out.perf = await page.evaluate(() => window.__perf); out.net = net; out.errs = errs.slice(0, 8);
  console.log(JSON.stringify(out, null, 1)); await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
