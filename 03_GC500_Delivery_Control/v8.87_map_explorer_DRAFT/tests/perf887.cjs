// Author: Andrew Fisher. Before/after measurements for the v8.87 Map explorer, read-only against the live record.
//   PAGE=<dashboard build> LOCAL=<explorer folder: the live files, or the prepared ones> [MOB=1] [TAG=live|v887] node tests/perf887.cjs
// Measures, inside the explorer frame: requestAnimationFrame deltas and draw() times during a wheel zoom and a drag pan, Fencing off
// and on; main-thread task time (CDP Performance.TaskDuration) and dashboard polls over 10 s while another tab is shown; whether a tap
// on a fence line leaves the map following the mouse; how many Escape presses close Fencing with a pick. One line of JSON per measure.
const L = require('./lib887.cjs');
const stats = a => { if (!a.length) return {n: 0}; const s = a.slice().sort((x, y) => x - y), q = k => s[Math.min(s.length - 1, Math.floor(k * s.length))]; return {n: a.length, mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), p50: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), max: +s[s.length - 1].toFixed(1), over50: a.filter(x => x > 50).length, over33: a.filter(x => x > 33).length}; };
(async () => { const MOB = L.MOB, TAG = process.env.TAG || 'run', out = []; const say = (m, v) => { const row = Object.assign({tag: TAG, device: MOB ? 'phone' : 'laptop', measure: m}, v); out.push(row); console.log(JSON.stringify(row)); };
  const s = await L.openMap({settle: 4000}); const p = s.page, f = s.f;
  const cdp = await p.context().newCDPSession(p); await cdp.send('Performance.enable');
  const task = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'TaskDuration').value;
  await f.evaluate(() => { window.__raf887 = null; window.__rafStart = () => { const r = {t: [], on: true}; window.__raf887 = r; let last = performance.now(); const step = t => { if (!r.on) return; r.t.push(t - last); last = t; requestAnimationFrame(step); }; requestAnimationFrame(step); }; window.__rafStop = () => { const r = window.__raf887; if (!r) return []; r.on = false; return r.t.slice(1); }; });
  const box = await L.stageBox(s);
  async function gesture(name) {
    await f.evaluate(() => GC500Explorer.fit()); await p.waitForTimeout(1500);
    const n0 = await f.evaluate(() => __frames.length), t0 = await task();
    await f.evaluate(() => __rafStart());
    if (name === 'zoom') { for (let i = 0; i < 10; i++) { await p.mouse.move(box.cx, box.cy); await p.mouse.wheel(0, -120); await p.waitForTimeout(90); } for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(90); } await p.waitForTimeout(700); }
    else { await p.mouse.move(box.cx + 150, box.cy + 80); await p.mouse.down(); for (let i = 1; i <= 40; i++) { await p.mouse.move(box.cx + 150 - i * 7, box.cy + 80 - i * 3); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(700); }
    const raf = await f.evaluate(() => __rafStop()); const t1 = await task();
    const draws = await f.evaluate(n0 => __frames.slice(n0).filter(F => F.inter).map(F => F.ms), n0);
    return {raf: stats(raf), draw: stats(draws), taskMs: Math.round((t1 - t0) * 1000)};
  }
  const fencingOn = async on => { const is = await f.evaluate(() => document.body.classList.contains('fencing-map')); if (is !== on) { await f.click('#fenceMode'); await p.waitForTimeout(2500); if (on && MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false)); } };
  for (const fence of [false, true]) { await fencingOn(fence); if (fence) { await f.evaluate(() => { const sel = document.getElementById('fmSource'); sel.value = 'all'; sel.onchange(); }); await p.waitForTimeout(600); }
    for (const g of ['zoom', 'pan']) { const r = await gesture(g); say(g + (fence ? '_fencingOn' : '_fencingOff'), r); } }
  // the stuck pointer: a tap on a fence line, then the mouse moves with no button down
  await fencingOn(true); await f.evaluate(() => GC500Explorer.fit()); await p.waitForTimeout(1500);
  let hit = await L.fenceHit(s).catch(() => null); if (!hit) hit = await L.fenceHitByPixels(s);
  if (hit) { await p.mouse.click(hit.x, hit.y); await p.waitForTimeout(700); const c0 = await L.cameraOf(s); await p.mouse.move(hit.x + 60, hit.y + 40); await p.waitForTimeout(100); await p.mouse.move(hit.x + 140, hit.y + 100); await p.waitForTimeout(400); const c1 = await L.cameraOf(s);
    say('stuckPointer', {tapped: true, selected: await f.evaluate(() => GC500FencingMap.state.selected), mapFollowedMouse: c0.cx !== c1.cx || c0.cy !== c1.cy, pointersLeft: c1.pointers, gestureLeft: c1.gesture}); }
  else say('stuckPointer', {tapped: false});
  await f.evaluate(() => { const st = document.getElementById('stage'); for (const id of [1, 2, 3]) { try { st.dispatchEvent(new PointerEvent('pointercancel', {pointerId: id, bubbles: true})); } catch (e) {} } });
  // Escape presses to leave Fencing with a pick
  await fencingOn(true); const pick = await f.evaluate(async () => { const sel = document.getElementById('fmSource'); const opt = [...sel.options].find(o => o.value !== 'all'); if (!opt) return null; sel.value = opt.value; sel.onchange(); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('#fmList [data-fmrow]'); if (!b) return null; b.click(); await new Promise(r => setTimeout(r, 200)); return GC500FencingMap.state.selected; });
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  let presses = 0; await f.focus('#stage'); while (presses < 4 && await f.evaluate(() => document.body.classList.contains('fencing-map'))) { await p.keyboard.press('Escape'); presses++; await p.waitForTimeout(300); }
  say('escapePressesToCloseFencing', {pick: pick != null, presses, closed: !(await f.evaluate(() => document.body.classList.contains('fencing-map')))});
  // hidden: 10 s on another tab
  await p.evaluate(() => { window.__c887 = {done: 0, snap: 0}; const d0 = window.gc500DoneKeys, s0 = window.gc500FencingMapSnapshot; window.gc500DoneKeys = function () { __c887.done++; return d0.apply(this, arguments); }; window.gc500FencingMapSnapshot = function () { __c887.snap++; return s0.apply(this, arguments); }; });
  const fr0 = await f.evaluate(() => __frames.length).catch(() => -1); await p.evaluate(() => go('today')); await p.waitForTimeout(1500); const h0 = await task(); const fr1 = await f.evaluate(() => __frames.length).catch(() => -1); await p.waitForTimeout(10000); const h1 = await task(); const fr2 = await f.evaluate(() => __frames.length).catch(() => -1);
  const calls = await p.evaluate(() => window.__c887);
  say('hidden10s', {taskMs: Math.round((h1 - h0) * 1000), doneCalls: calls.done, snapCalls: calls.snap, framesDrawn: fr2 >= 0 && fr1 >= 0 ? fr2 - fr1 : null, parked: await p.evaluate(() => !!document.querySelector('#expPark iframe')), frameLogLen: fr2});
  // fencing idle on the map: 10 s with Fencing open and the map still
  await p.evaluate(() => go('map')); await p.waitForTimeout(2500); await fencingOn(true); await p.waitForTimeout(1500); const snap0 = await p.evaluate(() => __c887.snap); const i0 = await task(); await p.waitForTimeout(10000); const i1 = await task(); const snap1 = await p.evaluate(() => __c887.snap);
  say('fencingIdle10s', {taskMs: Math.round((i1 - i0) * 1000), snapCalls: snap1 - snap0});
  say('errors', {pageErrors: s.errors.length, blocked: s.counts.blocked, local: s.counts.local || 0});
  if (process.env.OUT) require('fs').writeFileSync(process.env.OUT + '/perf887_' + TAG + '_' + (MOB ? 'phone' : 'laptop') + '.json', JSON.stringify(out, null, 1));
  await s.browser.close(); process.exit(0);
})().catch(e => { console.error('FAIL', e.stack); process.exit(2); });
