// probe the Coates Way machine: load, errors, views, controls
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']});
  const vp = process.argv[3] === 'phone' ? {width: 390, height: 844} : {width: 1280, height: 800};
  const page = await (await browser.newContext({viewport: vp, deviceScaleFactor: 1})).newPage(); const logs = [];
  page.on('pageerror', e => logs.push('PAGEERROR ' + String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ' ' + m.text().slice(0, 300)); });
  page.on('requestfailed', r => logs.push('REQFAIL ' + r.url().slice(-80) + ' ' + (r.failure() && r.failure().errorText)));
  page.on('response', r => { if (r.status() >= 400) logs.push('HTTP ' + r.status() + ' ' + r.url().slice(-90)); });
  const t0 = Date.now();
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 180000});
  await page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 400000, polling: 2000}).catch(e => logs.push('NOT READY ' + e.message.slice(0, 80)));
  console.log('ready in', ((Date.now() - t0) / 1000).toFixed(0), 's');
  const info = await page.evaluate(() => { const c = window.__cw; if (!c) return null; const r = c.renderer; return {view: c.view, quality: c.quality && (c.quality.name || c.quality), fps: c.fps, pr: c.pixelRatio, calls: r && r.info.render.calls, tris: r && r.info.render.triangles, geos: r && r.info.memory.geometries, tex: r && r.info.memory.textures,
    views: [...document.querySelectorAll('[data-view]')].map(b => b.dataset.view), buttons: [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => (b.id || '') + ':' + b.textContent.trim().slice(0, 18))}; });
  console.log('info', JSON.stringify(info));
  await page.waitForTimeout(3000); await page.screenshot({path: `machine_qa/probe_${process.argv[3] || 'desk'}_start.png`, timeout: 180000});
  for (const v of (info && info.views) || []) {
    await page.evaluate(v => { const b = document.querySelector(`[data-view="${v}"]`); if (b) b.click(); }, v); await page.waitForTimeout(6000);
    await page.screenshot({path: `machine_qa/probe_${process.argv[3] || 'desk'}_${v}.png`, timeout: 180000}); console.log('view', v, JSON.stringify(await page.evaluate(() => ({view: __cw.view, calls: __cw.renderer.info.render.calls, tris: __cw.renderer.info.render.triangles}))));
  }
  console.log('logs', JSON.stringify(logs.slice(0, 40), null, 1));
  await browser.close(); })();
