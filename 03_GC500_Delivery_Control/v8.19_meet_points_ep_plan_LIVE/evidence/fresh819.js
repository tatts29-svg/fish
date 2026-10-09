// v8.19 - the supplier card's record lines follow the record (Codex preflight, 3 Oct 2026). Author: Andrew Fisher.
// READ ONLY (GET-only harness, every write aborted). The card's "Record (still) shows ..." lines must always equal the
// native projection (programmeDays()/dpLoads()) as it is when the card is drawn:
//   1. at first drawing, before the shared record has hydrated;
//   2. after hydration, and again after 8 s (past the 4 s cache the defect had);
//   3. after a later record change: simulated in the page only, by substituting the native day projection (as if the
//      record moved WC38 off Fri 9 Oct and back onto Wed 7 Oct) and calling syncRedraw() - the page's own redraw after a record change - then
//      undoing it and redrawing again. Nothing is reloaded and nothing is written.
// Also: with the record as it is (3736 and later), WC38, WC39, WC40 and WC61 are on Fri 9 Oct, so Load 1 does not name them.
//   cd 03_GC500_Delivery_Control && PAGE=<build> node v8.19_meet_points_ep_plan_DRAFT/evidence/fresh819.js
const path = require('path');
const {open} = require('../../toolchain/harness/open_page');
const BUILD = process.env.PAGE || path.join(__dirname, '..', '..', 'build/GC500_v8.19/GC500_Delivery_Control_hosted.html');
const wait = ms => new Promise(r => setTimeout(r, ms));
let passes = 0, fails = 0; const ok = (c, what, d = '') => { c ? passes++ : fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d !== '' ? '  - ' + JSON.stringify(d).slice(0, 700) : '')); };
const SNAP = () => { const c = document.getElementById('ep819'); if (!c) return null; const rec = epRecDays819();
  return {status: typeof SYNC !== 'undefined' ? SYNC.status : null, hydrated: typeof SYNC !== 'undefined' && !!SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length,
    shown: EP819.loads.map((l, i) => ((c.querySelectorAll('.ep819-ld')[i] || document).querySelector('.ep819-rec') || {}).textContent || ''),
    fresh: EP819.loads.map(l => epRecLine819(l, rec))}; };
(async () => {
  const s = await open({pageFile: BUILD, hash: '#timeline', W: 1440, H: 900}); const p = s.page; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  // 1. the first drawing of the card
  await p.waitForFunction(() => !!document.getElementById('ep819'), null, {timeout: 240000, polling: 50});
  const A = await p.evaluate(SNAP);
  ok(!!A && JSON.stringify(A.shown) === JSON.stringify(A.fresh), `first drawing (record ${A && A.hydrated ? 'already hydrated' : 'not yet hydrated, status ' + (A && A.status)}): the card's record lines equal the native projection at that moment`, A);
  // 2. after hydration, and after the old cache's lifetime
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  await wait(2500);
  const B = await p.evaluate(SNAP);
  ok(B && B.hydrated && JSON.stringify(B.shown) === JSON.stringify(B.fresh), 'after hydration: the card shows the record as it is now', B);
  await wait(8000);
  const C = await p.evaluate(SNAP);
  ok(C && JSON.stringify(C.shown) === JSON.stringify(C.fresh), '8 s later: still the record as it is (no stale cached wording)', C);
  const on9 = await p.evaluate(() => { const d = programmeDays().find(x => x.iso === '2026-10-09'); const keys = d ? (dpLoads(d) || []).flatMap(g => (g.rows || []).map(r => r.a && r.a.key)) : []; return ['WC38', 'WC39', 'WC40', 'WC61'].filter(k => keys.includes(k)); });
  ok(on9.length === 4 ? !/WC38|WC39|WC40|WC61/.test(C.shown[0]) : true, `the record has ${on9.join(', ') || 'none of WC38/39/40/61'} on Fri 9 Oct; Load 1 ${on9.length === 4 ? 'does not name them' : '(not judged)'}`, {on9, load1: C.shown[0]});
  // 3. a later record change, through the page's own redraw, without a reload
  const D = await p.evaluate(() => { window.__dpLoads819 = dpLoads; const wc38 = allAssets().find(a => a.key === 'WC38');
    window.dpLoads = function (d) { const L = window.__dpLoads819(d) || [];   /* WC38 moved off Fri 9 Oct and back onto Wed 7 Oct */
      if (d && d.iso === '2026-10-09') return L.map(g => Object.assign({}, g, {rows: (g.rows || []).filter(r => !(r.a && r.a.key === 'WC38'))}));
      return d && d.iso === '2026-10-07' && wc38 ? L.concat([{kind: 'deliveries', rows: [{a: wc38}]}]) : L; };
    syncRedraw(); return null; });
  await wait(2500);
  const E = await p.evaluate(SNAP);
  ok(E && /^Record still shows Wed 7 Oct for WC38[;: ].* – moving to Fri 9 Oct per Coates/.test(E.shown[0]) && JSON.stringify(E.shown) === JSON.stringify(E.fresh), 'a record change (WC38 moved back to Wed 7 Oct) shows on the card at the page\'s next redraw, with no reload', E && E.shown[0]);
  await p.evaluate(() => { window.dpLoads = window.__dpLoads819; delete window.__dpLoads819; syncRedraw(); });
  await wait(2500);
  const F = await p.evaluate(SNAP);
  ok(F && JSON.stringify(F.shown) === JSON.stringify(C.shown) && JSON.stringify(F.shown) === JSON.stringify(F.fresh), 'and when the record moves back, the line goes again', F && F.shown[0]);
  const G = await p.evaluate(() => { const l = EP819.loads[0], w = ep819Print(1, {hold: true}); const txt = w.querySelector('.rs819').innerText; ep819Close(); return {line: epRecLine819(l), txt}; });
  ok(!G.line || G.txt.includes(G.line), 'the Load 1 run sheet carries the same record line, worked out when it is printed', G.line);
  ok(!s.errors.length && !cons.length && !s.counts.blocked, 'no page errors, no console errors, no write attempted', {errors: s.errors, cons, counts: s.counts});
  await s.browser.close();
  console.log(`\n${passes} passed, ${fails} failed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
