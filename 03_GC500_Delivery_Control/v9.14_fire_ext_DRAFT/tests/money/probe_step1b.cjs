// Step 1 probe, part b: where the controls sit, the shape of today's accessory rows, and what the EXISTING Attach path
// writes when somebody records extinguishers with it today (edit capability simulated, SYNC.db.doc captured, nothing sent;
// every network write is aborted by the harness anyway). Counts and booleans only. Author: Andrew Fisher.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
const PAGE = process.env.PAGE, OUT = process.env.OUT, MOB = !!process.env.MOB;
(async () => {
  const s = await open({pageFile: PAGE, mobile: MOB, W: MOB ? 390 : 1440, H: MOB ? 844 : 900, dpr: MOB ? 2 : 1});
  const consoleErr = []; s.page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 200)); });
  await s.page.waitForFunction(() => typeof allAssets === 'function' && typeof SYNC === 'object' && SYNC.status === 'live', null, {timeout: 120000}).catch(() => {});
  await s.page.waitForTimeout(5000);
  const viewFolds = await s.page.evaluate(() => {
    const r = {};
    ['AA', 'WC09'].forEach(k => { openAsset(k); const dr = document.getElementById('drawer');
      const f = el => { const d = el && el.closest('details[data-f816]'); return d ? {fold: d.dataset.f816, editonly: d.classList.contains('editonly'), open: d.open, shown: getComputedStyle(d).display !== 'none'} : null; };
      const fire = [...dr.querySelectorAll('input[data-lab]')].find(i => /\|fire_ext$/.test(i.dataset.lab));
      r[k] = {accForm: f(dr.querySelector('#accForm')), fireTick: f(fire), foldsShown: [...dr.querySelectorAll('details[data-f816]')].filter(d => getComputedStyle(d).display !== 'none').map(d => d.dataset.f816)};
      document.getElementById('dclose').click(); });
    return r; });
  await s.page.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit';
    if (!window.__fetch0) { window.__fetch0 = window.fetch; const of = window.__fetch0; window.fetch = async (u, o) => { const r = await of(u, o); const url = String(u); if (/\/api\/(version|state)(\?|$)/.test(url) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; }; }
    document.body.classList.remove('viewonly'); window.__W = [];
    SYNC.db.doc = path => ({id: path.split('/').slice(1).join('/'), path, set: async body => { window.__W.push([path, 'set']); }, delete: async () => { window.__W.push([path, 'delete']); }});
    S.operator = 'Test operator'; const w = document.getElementById('who'); if (w) w.value = 'Test operator'; applyCapability(); });
  const editFolds = await s.page.evaluate(() => {
    const r = {};
    ['AA', 'WC09', 'GN01', 'T0001'].forEach(k => { openAsset(k); const dr = document.getElementById('drawer');
      const f = el => { const d = el && el.closest('details[data-f816]'); return d ? {fold: d.dataset.f816, title: (d.querySelector('summary') || {}).textContent.replace(/\s+/g, ' ').trim().slice(0, 80), editonly: d.classList.contains('editonly'), open: d.open} : null; };
      const fire = [...dr.querySelectorAll('input[data-lab]')].find(i => /\|fire_ext$/.test(i.dataset.lab));
      r[k] = {accForm: f(dr.querySelector('#accForm')), fireTick: f(fire), folds: [...dr.querySelectorAll('details[data-f816]')].map(d => d.dataset.f816 + (d.classList.contains('editonly') ? '*' : ''))};
      document.getElementById('dclose').click(); });
    return r; });
  const shape = await s.page.evaluate(() => {
    const rows = (S.accessories || {}).WC09 || [];
    const allRows = Object.values(S.accessories || {}).flat();
    const fireRates = new Set(); ((DATA.rate_match || {}).items || []).forEach(e => ((e.labour_per_piece || {}).lines || []).forEach(L => { if (L.key === 'fire_ext' && L.money === 'rate') fireRates.add(L.rate); }));
    return {wc09Rows: rows.map(x => ({keys: Object.keys(x).sort(), type: x.type, qty: x.qty, qty_stated: x.qty_stated, asset_no_present: !!x.asset_no, asset_no_state: x.asset_no_state, origin: x.origin, as_written: x.as_written, has_added_by: !!x.added_by, has_added_at: !!x.added_at})),
      rowsWithNoAssetNo: allRows.filter(x => !x.asset_no).length, rowsTotal: allRows.length, addedHere: allRows.filter(x => x._added).length,
      dpAccWC09: dpAcc(assetOf('WC09')).map(x => (x.q > 1 ? x.q + ' × ' : '') + x.t),
      distinctFireRatesOnCard: fireRates.size,
      syncOn: SYNC.on, firstHasAcc: SYNC.first.has('accessories'), docIdWC09: docIdOf('WC09')};
  });
  // what the existing Attach path writes today if somebody records two extinguishers on WC09 as "Other"
  const before = await s.page.evaluate(() => { const M = moneySummary(), TK = pl760Ticks(), t = assetTotal(assetOf('WC09'));
    return {labour: M.charge.labour, total: M.charge.total, fireTicks: TK.fire_ext.ticks, fireAmt: TK.fire_ext.amount, accTotal: t.accessories, assetTotalNull: t.total == null, known: t.known}; });
  await s.page.evaluate(() => { openAsset('WC09'); const dr = document.getElementById('drawer'); const fd = dr.querySelector('details[data-f816="contents"]'); if (fd) fd.open = true;
    window.__W = []; document.getElementById('accType').value = 'Other'; document.getElementById('accQty').value = '2'; document.getElementById('accDesc').value = 'Fire extinguisher'; document.getElementById('accNo').value = '';
    document.getElementById('accAdd').click(); });
  await s.page.waitForTimeout(2500);
  const after = await s.page.evaluate(b => { const M = moneySummary(), TK = pl760Ticks(), t = assetTotal(assetOf('WC09'));
    const row = ((S.accessories || {}).WC09 || []).slice(-1)[0] || {};
    return {docsWritten: window.__W.map(w => w[0].split('/')[0] + '/…'), docCount: window.__W.length,
      newRow: {type: row.type, qty: row.qty, as_written: row.as_written, asset_no: row.asset_no, asset_no_state: row.asset_no_state},
      labourSame: M.charge.labour === b.labour, chargeTotalSame: M.charge.total === b.total, fireTicksSame: TK.fire_ext.ticks === b.fireTicks, fireAmtSame: TK.fire_ext.amount === b.fireAmt,
      accTotalNowNull: t.accessories == null, accTotalBeforeNull: b.accTotal == null, assetTotalNowNull: t.total == null, assetTotalBeforeNull: b.assetTotalNull, knownSame: t.known === b.known,
      dpAccWC09: dpAcc(assetOf('WC09')).map(x => (x.q > 1 ? x.q + ' × ' : '') + x.t),
      drawerShows: [...document.querySelectorAll('#drawer .acc')].map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 90)).filter(t => /Other|extinguisher/i.test(t))}; }, before);
  const res = {viewFolds, editFolds, shape, before: {fireTicks: before.fireTicks, accTotalNull: before.accTotal == null, assetTotalNull: before.assetTotalNull}, after, errors: s.errors, consoleErr, counts: s.counts};
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log('done', OUT, 'blocked', s.counts.blocked, 'errors', s.errors.length);
  await s.browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
