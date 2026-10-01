// v7.84 - the ways in Andrew gave (2 Oct 2026). Author: Andrew Fisher. Read-only: GETs only, writes aborted by the harness.
//   PAGE=<built page> [MOB=1] [OUT=<json>] node ways_in_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const MOB = !!process.env.MOB, s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 1000}), p = s.page;
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)});
  await p.waitForFunction(() => typeof wayIn784 === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  const R = await p.evaluate(() => {
    const out = {refs: {}}, mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} };
    ['WC25', 'WC45', 'WC47', 'GN04', 'WC31'].forEach(k => { const a = assetOf(k); if (!a) { out.refs[k] = {missing: true}; return; }
      const t = dropSmsText(a), d = dirs782(a), D = dest782(a), wi = wayIn782(a);
      let sheet = ''; programmeDays().some(x => dpLoads(x).some((g, i) => { if ((g.rows || []).some(r => r.a && r.a.key === k)) { const b = document.createElement('div'); b.innerHTML = dpPage(x, g, 'drv', i + 1, dpLoads(x).length); sheet = b.textContent.replace(/\s+/g, ' '); return true; } }));
      const box = document.createElement('div'); box.innerHTML = entryRow(a); const drawer = box.textContent.replace(/\s+/g, ' ');
      out.refs[k] = {inPlace: inPlace782(k), dir: d.dir, ok: d.ok, missing: d.missing, kind: D && D.kind, entry: (/ENTRY: [^\n]*/.exec(t) || [''])[0], access: (/Site access: [^\n]*/.exec(t) || [''])[0], hold: /HOLD:/.test(t), units: smsShape(t).units,
        sheetHas: !!sheet && wi.every(w => sheet.includes(w)), sheetFound: !!sheet, wayIn: wi, drawer: drawer.slice(0, 160)}; });
    /* every item still to come: which still have no way in */
    out.noWay = allAssets().filter(a => !a._cancelled && !inPlace782(a.key)).filter(a => { const d = dirs782(a); return !d.dir; }).map(a => a.key).sort();
    /* a pin taken on site still wins (synthetic, put back) */
    const keep = S.entries; S.entries = Object.assign({}, keep || {}, {WC25: {lat: -27.99, lon: 153.43, acc: 4, at: '2026-10-02T01:00:00.000Z', by: 'Test Person', n: 5}}); mc();
    out.pinWins = /turn in at -27\.990000, 153\.430000/.test(text747WayIn(assetOf('WC25'))); S.entries = keep; mc();
    /* a park item keeps the park's own pit lane rule wording */
    const park = allAssets().find(a => !wayIn784(a.key) && (entryOf(a.key) || {}).took === 'the pit lane rule');
    out.park = park ? {ref: park.key, access: text747WayIn(park), drawer: (b => (b.innerHTML = entryRow(park), b.textContent.replace(/\s+/g, ' ').slice(0, 120)))(document.createElement('div'))} : null;
    return out; });
  const pit = ['WC25', 'WC45', 'WC47', 'GN04'];
  ok('W1 WC25, WC45, WC47, GN04: the text says meet at the pit lane start point - Site access and ENTRY - and no HOLD', pit.every(k => R.refs[k].dir && /meet at the pit lane start point/.test(R.refs[k].access) && R.refs[k].entry === 'ENTRY: meet at the pit lane start point.' && !R.refs[k].hold), JSON.stringify(pit.map(k => [k, R.refs[k].access, R.refs[k].entry, R.refs[k].hold])));
  ok('W2 WC31: the text says in from the north, towards The Hill, to the drop-off on the map - and no HOLD', R.refs.WC31.dir && /from the north end, head towards The Hill/.test(R.refs.WC31.entry) && !R.refs.WC31.hold, JSON.stringify(R.refs.WC31));
  ok('W3 the drop-off for all five is still their own spot on the map (not the pit lane)', Object.values(R.refs).every(x => x.kind && x.kind !== 'report'), JSON.stringify(Object.entries(R.refs).map(([k, x]) => [k, x.kind])));
  ok('W4 the driver sheet prints the same way in the text gives (where the item is on a load)', Object.values(R.refs).every(x => !x.sheetFound || x.sheetHas), JSON.stringify(Object.entries(R.refs).map(([k, x]) => [k, x.sheetFound, x.sheetHas, x.wayIn])));
  ok('W5 the drawer says "meet at the pit lane start point", not "like everything in the park"', pit.every(k => /meet at the pit lane start point/.test(R.refs[k].drawer) && !/like everything in the park/.test(R.refs[k].drawer)), JSON.stringify(pit.map(k => R.refs[k].drawer)));
  ok('W6 the only items still to come with no way in are the four Andrew has not answered: WB07, WB13, WB18, WB20', JSON.stringify(R.noWay) === JSON.stringify(['WB07', 'WB13', 'WB18', 'WB20']), JSON.stringify(R.noWay));
  ok('W7 a way in pinned on site still wins over the given words', R.pinWins, String(R.pinWins));
  ok('W8 a park item keeps the park\'s own pit lane rule (unchanged)', R.park && /pit lane/.test(R.park.access) && !/meet at/.test(R.park.access) && /like everything in the park/.test(R.park.drawer), JSON.stringify(R.park));
  ok('W9 every one of the five texts still fits three texts', Object.values(R.refs).every(x => x.units <= 459), JSON.stringify(Object.entries(R.refs).map(([k, x]) => [k, x.units])));
  ok('E1 no page errors', !s.errors.length, JSON.stringify(s.errors).slice(0, 200));
  const passed = T.filter(t => t.pass).length;
  T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + ' — ' + t.detail.slice(0, 700)));
  console.log(passed + '/' + T.length + ' ' + (MOB ? 'phone' : 'desktop'));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, passed, of: T.length, tests: T}, null, 1));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})();
