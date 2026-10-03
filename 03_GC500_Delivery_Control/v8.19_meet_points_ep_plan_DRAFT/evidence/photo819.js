// v8.19 - the driver sheet's photographs keep their room. Author: Andrew Fisher.
// READ ONLY: opens the live base and the build in turn through the GET-only harness (every write is aborted), prints every
// driver sheet (GC500-DRV-01) of every programme day from 5 to 9 Oct 2026 (and 28 Sep, for comparison) on screen as the
// Drivers button does, and measures the photo strip (.dp-pics) on each. FAILS if any build sheet's photo strip is lower
// than the same sheet on the live base (0.5 px tolerance for sub-pixel layout), if a sheet has no meet point QR for a
// reference, or if the rules line takes more lines than on the base on a sheet that does not go to the island parkland.
//   cd 03_GC500_Delivery_Control && PAGE=<build> BASE=<base> node v8.19_meet_points_ep_plan_DRAFT/evidence/photo819.js
const path = require('path');
const {open} = require('../../toolchain/harness/open_page');
const ROOT = path.join(__dirname, '..', '..');
const BUILD = process.env.PAGE || path.join(ROOT, 'build/GC500_v8.19/GC500_Delivery_Control_hosted.html');
const BASE = process.env.BASE || path.join(ROOT, 'build/GC500_v8.19/base_live.html');
const wait = ms => new Promise(r => setTimeout(r, ms));
let passes = 0, fails = 0; const ok = (c, what, d = '') => { c ? passes++ : fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d !== '' ? '  - ' + JSON.stringify(d).slice(0, 600) : '')); };
async function measure(file, label) {
  const s = await open({pageFile: file, hash: '#timeline', W: 1440, H: 900}); const p = s.page; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  await wait(2500); await p.evaluate(() => { window.print = () => {}; });
  const days = await p.evaluate(() => programmeDays().map(d => d.iso).filter(x => (x >= '2026-10-05' && x <= '2026-10-09') || x === '2026-09-28'));
  const out = {};
  for (const iso of days) {
    await p.evaluate(iso => { window.__dpLast = null; dpPrint(iso, 'drv', {link: true}); }, iso);
    await p.waitForFunction(() => window.__dpLast, null, {timeout: 40000}).catch(() => {}); await wait(1200);
    out[iso] = await p.evaluate(() => [...document.querySelectorAll('#dayprint .dp-page.dp-drv')].map(pg => {
      const pics = pg.querySelector('.dp-pics'), rl = pg.querySelector('.dp-rline');
      return {load: pg.dataset.load, k: pg.style.getPropertyValue('--k'), pics: pics ? pics.getBoundingClientRect().height : 0, rline: rl ? Math.round(rl.getBoundingClientRect().height) : 0,
        over: pg.scrollHeight > pg.clientHeight + 1, qrs: pg.querySelectorAll('.mp819d-q').length, mps: [...pg.querySelectorAll('[data-mp819]')].map(e => e.dataset.mp819),
        refs: pg.querySelectorAll('.dp-wtbl tbody tr').length || 1, park: !!pg.querySelector('.mp819l-park')};
    }));
    await p.evaluate(() => { try { dpBarClose(); } catch (e) {} }); await wait(800);
  }
  const res = {out, errors: s.errors, cons, counts: s.counts}; await s.browser.close(); console.log(`   ${label}: ${Object.values(out).flat().length} driver sheets on ${days.length} days`); return res;
}
(async () => {
  const B = await measure(BASE, 'live base'), N = await measure(BUILD, 'build');
  console.log('\n   day          load   base px   build px   change   meet points');
  let rows = 0;
  for (const iso of Object.keys(B.out)) {
    const b = B.out[iso], n = N.out[iso] || [];
    ok(b.length === n.length, `${iso}: the same ${b.length} driver sheets on the base and the build`, {base: b.length, build: n.length});
    for (let i = 0; i < Math.min(b.length, n.length); i++) {
      const x = b[i], y = n[i]; rows++;
      console.log(`   ${iso}   ${String(y.load).padStart(4)}   ${x.pics.toFixed(1).padStart(7)}   ${y.pics.toFixed(1).padStart(8)}   ${(y.pics - x.pics >= 0 ? '+' : '') + (y.pics - x.pics).toFixed(1).padStart(6)}   ${[...new Set(y.mps)].join(', ')}`);
      const judged = iso !== '2026-09-28';
      if (judged) ok(y.pics >= x.pics - 0.5, `${iso} load ${y.load}: the photo strip is at least the live base's (${x.pics.toFixed(1)} -> ${y.pics.toFixed(1)} px)`);
      ok(y.qrs >= 1 && y.mps.length >= y.refs && !y.over, `${iso} load ${y.load}: a meet point and its directions QR for every reference, on one page`, {qrs: y.qrs, mps: y.mps, refs: y.refs, over: y.over});
      if (judged && !y.park) ok(y.rline <= x.rline, `${iso} load ${y.load}: the site rules fit on the sheet's own rules line (${x.rline} -> ${y.rline} px)`);
    }
  }
  ok(rows > 0, `${rows} driver sheets compared`);
  /* the sheet the review found at 0 px: 7 Oct, the WC86 + T0258 shared truck */
  { const i = (N.out['2026-10-07'] || []).findIndex(x => x.load === '4'), x = (B.out['2026-10-07'] || [])[i], y = (N.out['2026-10-07'] || [])[i];
    ok(!!(x && y) && y.refs === 2 && y.mps.length === 2 && y.pics >= x.pics - 0.5 && y.pics > 100, `2026-10-07 load 4 (WC86 + T0258, two meet points): photos ${x && x.pics.toFixed(1)} -> ${y && y.pics.toFixed(1)} px, not crushed`, y); }
  ok(!N.errors.length && !N.cons.length && !N.counts.blocked, 'build: no page errors, no console errors, no write attempted', {errors: N.errors, cons: N.cons, counts: N.counts});
  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
