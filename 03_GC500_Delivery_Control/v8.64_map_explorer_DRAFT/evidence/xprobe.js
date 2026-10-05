// Map explorer audit inside the dashboard: open time, idle long tasks, Fencing open/idle, zoom frame times, closing.
const {open} = require('./xembed'); const fs = require('fs');
const stats = a => { const s = [...a].sort((x, y) => x - y); const q = f => s.length ? s[Math.min(s.length - 1, Math.floor(f * s.length))] : 0; return {n: s.length, p50: Math.round(q(.5)), p95: Math.round(q(.95)), max: Math.round(s.length ? s[s.length - 1] : 0), over50: s.filter(x => x > 50).length, over100: s.filter(x => x > 100).length}; };
(async () => { const MOB = !!process.env.MOB, R = {};
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900, gl: !!process.env.GL}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  const t0 = Date.now(); await p.evaluate(() => go('map'));
  const fh = await p.waitForSelector('#pane-map iframe', {timeout: 30000}); const f = await fh.contentFrame();
  await f.waitForFunction(() => window.GC500Explorer && window.GC500Explorer.state && window.GC500Explorer.state.ready, null, {timeout: 90000}); R.readyMs = Date.now() - t0;
  // instruments in the frame
  await f.evaluate(() => { window.__lt864 = []; window.__fr = null; try { new PerformanceObserver(l => { for (const e of l.getEntries()) __lt864.push({t: Math.round(e.startTime), d: Math.round(e.duration)}); }).observe({type: 'longtask'}); } catch (e) {}
    window.__fr864 = ms => new Promise(res => { const out = []; let last = performance.now(); const end = last + ms; const tick = now => { out.push(now - last); last = now; if (now < end) requestAnimationFrame(tick); else res(out); }; requestAnimationFrame(tick); });
    window.__lts864 = t => __lt864.filter(x => x.t >= t); });
  const ltWindow = async (fn, ms) => { const t = await f.evaluate(() => performance.now()); const fr = f.evaluate(ms => __fr864(ms), ms); if (fn) await fn(); const frames = await fr; const lt = await f.evaluate(t => __lts864(t), t); return {frames: stats(frames), longTasks: lt.length, longMs: lt.reduce((a, x) => a + x.d, 0), worstTask: lt.reduce((a, x) => Math.max(a, x.d), 0)}; };
  await p.waitForTimeout(3000);
  R.idleNormal = await ltWindow(null, 8000);
  const box = await f.evaluate(() => { const b = document.getElementById('stage').getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; });
  const frameBox = await fh.boundingBox();
  const wheel = async (dir, n) => { for (let i = 0; i < n; i++) { await p.mouse.move(frameBox.x + box.x, frameBox.y + box.y); await p.mouse.wheel(0, dir * 120); await p.waitForTimeout(90); } };
  const pinchZoom = async () => { if (!MOB) return wheel(-1, 10).then(() => wheel(1, 10)); for (let i = 0; i < 6; i++) { await f.evaluate(() => document.getElementById('zoomIn').click()); await p.waitForTimeout(150); } for (let i = 0; i < 6; i++) { await f.evaluate(() => document.getElementById('zoomOut').click()); await p.waitForTimeout(150); } };
  R.zoomNormal = await ltWindow(pinchZoom, 4500);
  // Fencing on
  const tf = Date.now(); const fOpen = ltWindow(() => f.evaluate(() => document.getElementById('fenceMode').click()), 2500);
  await f.waitForFunction(() => document.body.classList.contains('fencing-map'), null, {timeout: 10000}); R.fencingOnMs = Date.now() - tf; R.fencingOpen = await fOpen;
  R.fencingState = await f.evaluate(() => { const st = window.GC500FencingMap.state; return {active: st.active, geometry: st.geometryVisible, rows: document.querySelectorAll('#fmList [data-fmrow]').length, nav: document.getElementById('navBtn').textContent, panelVisible: !!document.getElementById('fencePanel').offsetParent, closeControls: [...document.querySelectorAll('#fencePanel button')].filter(b => /close|done|exit|×/i.test(b.textContent + (b.getAttribute('aria-label') || ''))).length}; });
  R.idleFencing = await ltWindow(null, 13000);
  R.zoomFencing = await ltWindow(pinchZoom, 4500);
  // choose a fencing item, then try to clear it
  R.pick = await f.evaluate(() => { const b = document.querySelector('#fmList [data-fmrow]'); if (!b) return {none: true}; b.click(); return {selected: window.GC500FencingMap.state.selected}; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  R.afterEscape = await f.evaluate(() => ({selected: window.GC500FencingMap.state.selected, fencing: window.GC500FencingMap.state.active, nav: document.body.classList.contains('nav')}));
  // Fencing off
  const toff = Date.now(); await f.evaluate(() => document.getElementById('fenceMode').click()); await f.waitForFunction(() => !document.body.classList.contains('fencing-map'), null, {timeout: 10000}); R.fencingOffMs = Date.now() - toff;
  // Find chip pick, then try to clear
  R.chip = await f.evaluate(() => { const c = document.querySelector('#chips button, #chips [data-cat], .chips button'); if (!c) return {none: true}; c.click(); return {label: c.textContent.trim().slice(0, 30), on: c.getAttribute('aria-pressed') || c.className}; });
  await p.waitForTimeout(600); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  R.chipAfterEscape = await f.evaluate(() => { const c = document.querySelector('#chips button, .chips button'); return {on: c && (c.getAttribute('aria-pressed') || c.className), sel: window.GC500Explorer.state && window.GC500Explorer.state.view}; });
  R.errors = s.errors; R.counts = s.counts;
  await p.screenshot({path: process.env.OUT + '/probe_' + (MOB ? 'phone' : 'desk') + '.png'});
  console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
