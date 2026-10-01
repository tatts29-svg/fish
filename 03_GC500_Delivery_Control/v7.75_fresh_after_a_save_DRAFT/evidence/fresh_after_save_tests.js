// v7.75 - fresh after a save, and the recovery ratios wait for the quotes. Author: Andrew Fisher.
// Opens a built page through the harness (GETs only; every write the page tries is aborted; the view link cannot save),
// waits for the shared record, then:
//   A. the v7.76 finding, reproduced: a box on the old pane commits during go()'s focus move, writes the record and
//      save()s; the rest of that draw must read the record as it now is (the asset list, the forecast and Rehire
//      models). On v7.76 this FAILS (stale); on v7.75 it passes.
//   B. a tab change with no save in it builds the asset list exactly as often as v7.76 (no speed lost), every tab.
//   C. the recovery ratios: today unchanged; with the quotes unapproved, or not splitting to the cent, Transport and
//      Consumables Recovery read "not readable yet" with the reason, and nothing divides.
//   PAGE=<built page> [MOB=1] [OUT=<results.json>] node fresh_after_save_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof pl770Model === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  await p.evaluate(() => go('today')); await p.waitForTimeout(1500);
  const R = await p.evaluate(() => {
    const out = [];
    const ok = (name, pass, detail) => out.push({name, pass: !!pass, detail: String(detail)});
    const v775 = typeof heldFresh775 === 'function';
    /* A. the commit during go()'s focus move */
    go('about'); /* a small pane: kept, not emptied, on leaving, so the box blurs as a typed box does */
    const pane = document.getElementById('pane-about');
    const box = document.createElement('input'); box.id = 'v775probe'; pane.appendChild(box); box.focus();
    const seen = {};
    box.addEventListener('blur', () => {
      const before = allAssets(), modelBefore = cj764Model(), rhBefore = rh766Model();
      S.added = S.added || [];
      S.added.push({key: 'V775-PROBE', name: 'probe', added_at: new Date().toISOString(), added_by: 'probe'});
      save(); render();
      const after = allAssets();
      seen.inList = after.some(a => a.key === 'V775-PROBE');
      seen.listRebuilt = after !== before;
      seen.modelRebuilt = cj764Model() !== modelBefore;
      seen.rehireRebuilt = rh766Model() !== rhBefore;
      seen.held = typeof ASSETS_HELD !== 'undefined' && !!ASSETS_HELD;
      S.added.pop(); save();
    }, {once: true});
    go('costs');
    box.remove();
    ok('A1 the commit ran inside the held draw (the v7.76 path)', seen.held, JSON.stringify(seen));
    ok('A2 the rest of the draw sees the saved record (asset list)', seen.inList && seen.listRebuilt, JSON.stringify(seen));
    ok('A3 the forecast and Rehire models are worked out again after the save', seen.modelRebuilt && seen.rehireRebuilt, JSON.stringify(seen));
    ok('A4 after the draw the probe is gone from the list (the page is left as found)', !allAssets().some(a => a.key === 'V775-PROBE'), allAssets().length);
    /* B. builds per tab change with no save */
    const orig = buildAllAssets; let builds = 0; buildAllAssets = function () { builds++; return orig.apply(this, arguments); };
    const per = {};
    try { TABS.map(t => t[0]).filter(k => !TABS_OFF.has(k)).forEach(k => { builds = 0; go(k); per[k] = builds; }); } finally { buildAllAssets = orig; }
    ok('B1 a tab change builds the asset list once at most (no save, no rebuild)', Object.values(per).every(n => n <= 1), JSON.stringify(per));
    go('costs');
    /* C. the recovery ratios */
    RENDER_MEMO.clear(); const P0 = pl770Model();
    const row = (P, nm) => P.rec.find(r => r.name === nm) || {};
    ok('C1 today the quotes split and the ratios read as before', P0.qClean && row(P0, 'Transport Recovery').now != null && row(P0, 'Consumables Recovery').now != null, `qClean ${P0.qClean} · transport ${row(P0, 'Transport Recovery').now} · consumables ${row(P0, 'Consumables Recovery').now}`);
    const ms = moneySummary;
    try {
      moneySummary = function () { const M = ms.apply(this, arguments); return Object.assign({}, M, {cost: Object.assign({}, M.cost, {rehire_approved: false})}); };
      RENDER_MEMO.clear(); const P1 = pl770Model();
      const t1 = row(P1, 'Transport Recovery'), c1 = row(P1, 'Consumables Recovery');
      ok('C2 quotes not approved: Transport and Consumables Recovery wait, and say why', !P1.qClean && t1.now == null && t1.job == null && c1.now == null && c1.job == null && /not approved/.test(t1.words) && /not approved/.test(c1.words), `${t1.now} ${t1.job} · ${t1.words}`);
    } finally { moneySummary = ms; }
    const Q = (DATA.rehire_quotes && DATA.rehire_quotes.quotes) || [];
    const ln = Q.length && Q[0].groups && Q[0].groups[0] && Q[0].groups[0].lines && Q[0].groups[0].lines[0];
    if (ln) {
      const was = ln.total_price;
      try {
        ln.total_price = Number(was) + 1;
        RENDER_MEMO.clear(); const P2 = pl770Model();
        const t2 = row(P2, 'Transport Recovery'), c2 = row(P2, 'Consumables Recovery');
        ok('C3 quotes not splitting to the cent: Transport and Consumables Recovery wait, and say why', !P2.qClean && t2.now == null && c2.now == null && /did not split/.test(t2.words), `${t2.now} · ${t2.words}`);
      } finally { ln.total_price = was; }
    } else ok('C3 quotes not splitting to the cent', false, 'no quote line on the record to vary');
    RENDER_MEMO.clear(); const P3 = pl770Model();
    ok('C4 put back: the ratios read as before', P3.qClean && row(P3, 'Transport Recovery').now === row(P0, 'Transport Recovery').now, `${row(P3, 'Transport Recovery').now}`);
    return {v775, tests: out};
  });
  const passed = R.tests.filter(t => t.pass).length;
  R.tests.forEach(t => console.log(`${t.pass ? 'PASS' : 'FAIL'} ${t.name} — ${t.detail.slice(0, 160)}`));
  console.log(`${passed}/${R.tests.length} ${MOB ? 'phone' : 'desktop'} · page errors ${s.errors.length}${R.v775 ? '' : ' · (page without v7.75)'}`);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, mobile: MOB, passed, of: R.tests.length, errors: s.errors, tests: R.tests}, null, 1));
  await s.browser.close();
  process.exit(passed === R.tests.length && !s.errors.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
