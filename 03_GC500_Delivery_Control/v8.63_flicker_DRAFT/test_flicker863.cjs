// Author: Andrew Fisher. v8.63 flicker checks, read-only against the live record (every write is aborted by open_page).
//   PAGE=build/GC500_v8.63/GC500_Delivery_Control_hosted.html [MOB=1] node v8.63_flicker_DRAFT/test_flicker863.cjs
// Each check samples every animation frame. "Faded" means a block on the open pane is drawn below 90 % opacity.
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const MOB = !!process.env.MOB, R = [];
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page, ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(3500);
  await p.evaluate(() => {
    window.__faded = (k, ms) => new Promise(res => { const t0 = performance.now(); let worst = 1, at = -1, n = 0;
      const tick = () => { const pane = document.getElementById('pane-' + k);
        if (pane && !pane.hidden) for (const el of [pane, ...pane.children]) { if (!el.getClientRects().length) continue;
          let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) o *= +getComputedStyle(e).opacity;
          if (o < worst) { worst = o; at = Math.round(performance.now() - t0); } }
        n++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res({worst: +worst.toFixed(3), at, frames: n}); };
      requestAnimationFrame(tick); });
  });
  // 1-3: every primary tab opens without fading out, and still settles with its arrival
  const tabs = ['today', 'timeline', 'plant', 'demob', 'docs', 'coatesway'];
  for (const k of tabs) {
    await p.evaluate(k => go(k === 'today' ? 'timeline' : 'today'), k); await p.waitForTimeout(1600);
    const f = p.evaluate(k => __faded(k, 1300), k);
    const arrived = await p.evaluate(k => { go(k); window.__goEnd = performance.now(); return document.getElementById('pane-' + k).classList.contains('arrive'); }, k);
    const r = await f;
    ok('open ' + k + ': never faded', r.worst >= 0.9, r);
    ok('open ' + k + ': arrival still marked', arrived, {arrived});
    await p.waitForFunction(() => performance.now() - window.__goEnd > 1150, null, {timeout: 5000});
    ok('open ' + k + ': arrival cleared after it plays', await p.evaluate(k => !document.getElementById('pane-' + k).classList.contains('arrive'), k), {});
  }
  // 4-5: a refresh of the same page (what a record change does) neither fades it nor rebuilds the banner picture
  await p.evaluate(() => go('today')); await p.waitForTimeout(2500);
  const before = await p.evaluate(() => { window.__img863 = document.querySelector('#pane-today .bhero .bmedia > img'); return !!__img863 && __img863.complete; });
  const fr = p.evaluate(() => __faded('today', 1300));
  await p.evaluate(() => render());
  const rr = await fr;
  ok('Today refresh: never faded', rr.worst >= 0.9, rr);
  const after = await p.evaluate(() => { const i = document.querySelector('#pane-today .bhero .bmedia > img'); return {same: i === window.__img863, complete: !!i && i.complete, w: i ? i.naturalWidth : 0}; });
  ok('Today refresh: banner picture kept, still decoded', before && after.same && after.complete && after.w > 0, after);
  // 6: a refresh inside the arrival window also stops the arrival instead of replaying it
  await p.evaluate(() => go('timeline')); await p.waitForTimeout(1500);
  const quick = await p.evaluate(() => new Promise(res => { go('today'); setTimeout(() => { render(); requestAnimationFrame(() => res(document.getElementById('pane-today').classList.contains('arrive'))); }, 150); }));
  ok('refresh during arrival: arrival stopped', quick === false, {arriveAfterRefresh: quick});
  // 7: Motion: Off still means no arrival motion at all
  const off = await p.evaluate(async () => { document.documentElement.dataset.motion = 'off'; go('timeline'); await new Promise(r => setTimeout(r, 800)); go('today');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const pane = document.getElementById('pane-today'); const a = document.getAnimations().filter(x => /v610rise|paneIn/.test(x.animationName || '') && pane.contains(x.effect.target)).length;
    delete document.documentElement.dataset.motion; return a; });
  ok('Motion: Off: no arrival animations', off === 0, {running: off});
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 5));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  const fails = R.filter(r => !r.pass);
  for (const r of R) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + ' ' + JSON.stringify(r.detail));
  console.log(`${MOB ? 'phone' : 'desktop'}: ${R.length - fails.length}/${R.length} pass`);
  await s.browser.close(); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e.stack); process.exit(2); });
