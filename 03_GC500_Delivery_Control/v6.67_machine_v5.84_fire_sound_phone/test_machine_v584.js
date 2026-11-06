// machine v5.84: exhaust flames and glow, the sound pack loads, the phone layout keeps the car clear of the dock
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']});
  const phone = process.argv[3] === 'phone', vp = phone ? {width: 390, height: 844} : {width: 1280, height: 800};
  const page = await (await browser.newContext({ignoreHTTPSErrors: true, viewport: vp, deviceScaleFactor: 1, userAgent: phone ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148' : undefined})).newPage(); const logs = [], audio = [];
  page.on('pageerror', e => logs.push('PAGEERROR ' + String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ' ' + m.text().slice(0, 200)); });
  page.on('response', r => { if (/assets\/audio\//.test(r.url())) audio.push(r.status()); else if (r.status() >= 400) logs.push('HTTP ' + r.status() + ' ' + r.url().slice(-80)); });
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 180000});
  await page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 400000, polling: 2000});
  const tag = phone ? 'phone' : 'desk';
  if (phone) { await page.waitForTimeout(2500); await page.screenshot({path: `machine_qa/v584_${tag}_car.png`, timeout: 180000});
    console.log('layout', JSON.stringify(await page.evaluate(() => { const r = e => { const b = document.querySelector(e); if (!b) return null; const x = b.getBoundingClientRect(); return [Math.round(x.top), Math.round(x.bottom)]; }; return {viewport: r('#viewport'), dock: r('.dock'), telemetry: r('.telemetry'), studio: r('.studio')}; }))); }
  // sound on (a user gesture), then the V8
  await page.click('#sound'); await page.waitForTimeout(4000);
  await page.evaluate(() => { const b = [...document.querySelectorAll('[data-view]')].find(x => x.dataset.view === 'engine'); b && b.click(); }); await page.waitForTimeout(4000);
  await page.click('#start'); await page.evaluate(() => __cw.advance(3, 1 / 30, () => __cw.drive.running));
  const setT = v => page.evaluate(v => { const t = document.querySelector('#throttle'); t.value = v; t.dispatchEvent(new Event('input', {bubbles: true})); }, v);
  await setT(100); await page.evaluate(() => __cw.advance(6, 1 / 30));
  const hot = await page.evaluate(() => ({running: __cw.drive.running, heat: +__cw.exhaust.heat.toFixed(2)}));
  await setT(0); await page.evaluate(() => __cw.advance(.12, 1 / 60));
  const fl = await page.evaluate(() => ({flaming: __cw.exhaust.flaming}));
  await page.waitForTimeout(3500); await page.screenshot({path: `machine_qa/v584_${tag}_flames.png`, timeout: 180000});
  console.log('fx', JSON.stringify({hot, fl}), 'audio responses', audio.length, 'ok', audio.filter(s => s === 200).length);
  if (!phone) { await page.evaluate(() => { const b = [...document.querySelectorAll('[data-view]')].find(x => x.dataset.view === 'cog'); b && b.click(); }); await page.waitForTimeout(5000);
    await page.screenshot({path: `machine_qa/v584_${tag}_cockpit.png`, timeout: 180000}); console.log('telemetry in cockpit', await page.evaluate(() => getComputedStyle(document.querySelector('.telemetry')).display)); }
  console.log('logs', JSON.stringify(logs.slice(0, 20), null, 1));
  await browser.close(); })();
