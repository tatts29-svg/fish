const {open} = require('./lh3'); const OUT = '/tmp/claude-0/stage7/shots/'; require('fs').mkdirSync(OUT, {recursive: true});
const MOB = !!process.env.MOB, TAG = process.env.TAG || 'm699';
(async () => { const s = await open(MOB ? {pageFile: process.env.PAGE, W: 412, H: 915, dpr: 2, mobile: true} : {pageFile: process.env.PAGE}); const p = s.page; const res = {};
  await p.goto('https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html', {waitUntil: 'load', timeout: 180000});
  await p.waitForFunction(() => window.__ready && document.querySelector('.modes [data-mode="3d"]'), null, {timeout: 240000});
  res.modes = await p.evaluate(() => [...document.querySelectorAll('.modes button')].map(b => b.textContent.trim()));
  // 2D card first
  await p.evaluate(() => { const q = document.getElementById('q'); q.value = 'GN04'; q.dispatchEvent(new Event('input')); document.querySelector('#results [data-code]').click(); });
  await p.waitForTimeout(3000);
  res.card2d = await p.evaluate(() => { const c = document.getElementById('xcard'); return c && !c.hidden ? c.innerText.replace(/\s+/g, ' ').trim() : null; });
  // 3D
  const t0 = Date.now(); await p.evaluate(() => document.querySelector('.modes [data-mode="3d"]').click());
  await p.waitForFunction(() => { try { const f = document.getElementById('model3d'); return f && f.contentWindow.__ready && f.contentWindow.GC500_3D.state.pins > 0; } catch (e) { return false; } }, null, {timeout: 240000});
  res.to3dReadyMs = Date.now() - t0;
  res.in3d = await p.evaluate(() => ({quality: document.getElementById('model3d').contentWindow.GC500_3D.state.quality, pressed: [...document.getElementById('model3d').contentDocument.querySelectorAll('.q button[aria-pressed="true"]')].map(b => b.textContent.trim()), body: document.body.classList.contains('in3d'), pins: document.getElementById('model3d').contentWindow.GC500_3D.state.pins,
    ui: [...document.getElementById('model3d').contentDocument.querySelectorAll('.q button, .views button')].filter(b => b.offsetParent).map(b => b.textContent.trim()),
    hiddenDup: ['.find', '.chips'].map(sel => { const e = document.getElementById('model3d').contentDocument.querySelector(sel); return e ? getComputedStyle(e).display : 'none'; })}));
  await p.waitForTimeout(8000);
  res.after = await p.evaluate(() => { const w = document.getElementById('model3d').contentWindow; return {quality: w.GC500_3D.state.quality, loaded: w.__allLoaded}; });
  await p.waitForFunction(() => document.getElementById('model3d').contentWindow.GC500_3D.state.quality === 'crisp', null, {timeout: 240000}).catch(() => {});
  res.later = await p.evaluate(() => document.getElementById('model3d').contentWindow.GC500_3D.state.quality);
  try { await p.screenshot({path: OUT + TAG + '_3d_gn04.jpg', type: 'jpeg', quality: 80, timeout: 150000}); } catch (e) { res.shot1 = 'timeout'; }
  // chips drive the 3D
  await p.evaluate(() => { const b = [...document.querySelectorAll('#chips .chip')].find(x => /Lighting towers/.test(x.textContent)); b.click(); });
  await p.waitForTimeout(1500);
  res.lightsShown = await p.evaluate(() => { const w = document.getElementById('model3d').contentWindow; const ents = w.Cesium ? null : null; return w.GC500_3D ? 'ok' : 'no api'; });
  // pick from 3D -> card
  await p.evaluate(() => window.gc500Explorer3DPick('WC23')); await p.waitForTimeout(1000);
  res.pickCard = await p.evaluate(() => { const c = document.getElementById('xcard'); return c && !c.hidden ? c.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) : null; });
  // back to 2D
  await p.evaluate(() => document.querySelector('.modes [data-mode="hybrid"]').click()); await p.waitForTimeout(1500);
  res.back2d = await p.evaluate(() => ({in3d: document.body.classList.contains('in3d'), pressed: [...document.querySelectorAll('.modes button')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent.trim())}));
  res.errors = s.errors; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
