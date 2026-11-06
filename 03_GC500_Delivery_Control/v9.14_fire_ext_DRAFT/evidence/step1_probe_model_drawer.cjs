// Step 1 probe for v9.14 (fire extinguishers): read-only. Author: Andrew Fisher.
// Opens the live page bytes at the live address through the harness (every write aborted), reads the model and the
// drawer as a viewer, then again with the edit capability simulated and SYNC.db.doc captured (nothing sent).
// Prints counts and booleans only - no money figures.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
const PAGE = process.env.PAGE, OUT = process.env.OUT, MOB = !!process.env.MOB;
(async () => {
  const s = await open({pageFile: PAGE, mobile: MOB, W: MOB ? 390 : 1440, H: MOB ? 844 : 900, dpr: MOB ? 2 : 1});
  const consoleErr = []; s.page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 200)); });
  await s.page.waitForFunction(() => typeof allAssets === 'function' && typeof SYNC === 'object' && SYNC.status && SYNC.status !== 'connecting', null, {timeout: 120000}).catch(() => {});
  await s.page.waitForTimeout(6000);
  const model = await s.page.evaluate(() => {
    const out = {cap: capability(), level: SYNC.level, status: SYNC.status, footer: (document.body.innerText.match(/· v\d+\.\d+/) || [''])[0]};
    const A = allAssets().filter(a => !a._cancelled);
    out.refs = A.length;
    const kinds = {}; A.forEach(a => { const k = refKind(a); kinds[k] = (kinds[k] || 0) + 1; }); out.kinds = kinds;
    out.carries = A.filter(a => carriesAccessories(a)).length;
    // fire_ext per charge line
    const per = {}; let offeredRefs = new Set(), withheldRefs = new Set(), noLine = new Set();
    A.forEach(a => chargeLines(a).forEach(l => {
      const info = labourLinesFor(a.key, l.discipline, l.item, a.key, undefined, a);
      const c = cardRate(l.discipline, l.item, a.key), lp = c && c.labour_per_piece;
      const fl = lp && (lp.lines || []).find(x => x.key === 'fire_ext');
      const k = l.discipline + ' | ' + l.item;
      const st = !lp ? 'no card line (no labour_per_piece)' : !fl ? 'no fire_ext line' : fl.money + (fl.heading ? ' [' + fl.heading + ']' : '');
      const offered = info.lines.some(x => x.key === 'fire_ext');
      per[k] = per[k] || {card: st, offered, refs: 0, kind: refKind(a)}; per[k].refs++;
      if (offered) offeredRefs.add(a.key); else if (info.withheld && info.withheld.includes('Fire extinguisher')) withheldRefs.add(a.key); else noLine.add(a.key);
    }));
    out.perItem = per; out.fireOfferedRefs = offeredRefs.size; out.fireWithheldRefs = withheldRefs.size; out.fireNoLineRefs = [...noLine].filter(k => !offeredRefs.has(k) && !withheldRefs.has(k)).length;
    out.fireOfferedNotBuilding = [...offeredRefs].filter(k => refKind(assetOf(k)) !== 'building');
    out.refsNoChargeLines = A.filter(a => !chargeLines(a).length).length;
    // ticks recorded
    const L = S.labour || {}; out.fireTicksRecorded = Object.keys(L).filter(k => /\|fire_ext$/.test(k) && L[k]).length;
    out.fireTickKeys = Object.keys(L).filter(k => /\|fire_ext$/.test(k) && L[k]).map(k => k.split('|')[0]);
    const TK = pl760Ticks(); out.TK_fire = {ticks: TK.fire_ext.ticks, unknown: TK.fire_ext.unknown, amountPositive: TK.fire_ext.amount > 0};
    const LP = labourPlan(); const fs_ = LP.slots.filter(x => x.key === 'fire_ext'); const byState = {}; fs_.forEach(x => { byState[x.state] = (byState[x.state] || 0) + 1; });
    out.planFireSlots = {n: fs_.length, byState, valued: fs_.filter(x => x.value != null).length};
    try { const AL = acc761Labour(); const g = AL.groups.fire_ext; out.acc761Fire = {n: g.n, unpriced: g.unpriced, complete: g.complete, totalPositive: g.total > 0}; } catch (e) { out.acc761Fire = 'err ' + e.message; }
    // accessories on the record
    const acc = S.accessories || {}; out.accRefs = Object.keys(acc).length;
    const types = {}; Object.values(acc).forEach(rows => (rows || []).forEach(r => { types[r.type] = (types[r.type] || 0) + 1; })); out.accTypes = types;
    out.accFire = Object.entries(acc).filter(([k, rows]) => (rows || []).some(r => /fire|extinguish/i.test(String(r.type) + ' ' + String(r.as_written)))).map(([k]) => k);
    out.accRateFire = (() => { const r = accRateFor('Fire extinguisher'); return {value: r.value, per: r.per, source: r.source, cardState: r.card && r.card.state}; })();
    out.partOfBuilding = Object.keys(PART_OF_THE_BUILDING);
    out.plantLines = PLANT_LINES.length; out.plantDisc = [...new Set(plantLinesShown().map(l => l.discipline))];
    out.compound = A.filter(a => /compound/i.test(String(a.name || '') + ' ' + (a.locations || []).join(' '))).map(a => a.key + ':' + refKind(a));
    out.syncAccKind = SYNC_COLLS.accessories.kind; out.syncLabourKind = SYNC_COLLS.labour.kind;
    return out;
  });
  // pick sample references by kind
  const picks = await s.page.evaluate(() => {
    const A = allAssets().filter(a => !a._cancelled && !a.rest_of);
    const byKind = k => (A.find(a => refKind(a) === k) || {}).key;
    const bld = (A.find(a => refKind(a) === 'building' && chargeLines(a).some(l => /^Building 6m$/.test(l.item))) || {}).key;
    const cont = (A.find(a => chargeLines(a).some(l => /Cont/i.test(l.item))) || {}).key;
    const plant = (plantLinesShown()[0] || {}).key;
    const vms = (A.find(a => a.discipline === 'Variable message signs') || {}).key;
    const fork = (A.find(a => a.discipline === 'Access & plant') || {}).key;
    return {building: bld, toilet: 'WC09', container: cont, generator: byKind('generator'), tower: byKind('tower'), barrier: byKind('barrier'), plant, vms, forklift: fork, compoundToilet: 'WC05'};
  });
  const drawerCheck = async (label) => {
    const res = {};
    for (const [kind, key] of Object.entries(picks)) {
      if (!key) { res[kind] = 'none'; continue; }
      res[kind] = await s.page.evaluate(k => {
        try { openAsset(k); } catch (e) { return 'openAsset threw ' + e.message; }
        const dr = document.getElementById('drawer');
        const form = dr.querySelector('#accForm'), sel = dr.querySelector('#accType');
        const opts = sel ? [...sel.options].map(o => o.value) : [];
        const fireTicks = [...dr.querySelectorAll('input[data-lab]')].filter(i => /\|fire_ext$/.test(i.dataset.lab));
        const hire = dr.querySelector('#dsectHire');
        const r = {key: k, kind: refKind(assetOf(k)), carriesAccessories: carriesAccessories(assetOf(k)), accForm: !!form, accFormVisible: !!(form && form.offsetParent),
          fireInTypeList: opts.some(o => /fire|extinguish/i.test(o)), typeListLen: opts.length, accNoRequired: !!(dr.querySelector('#accNo') || {}).required,
          qtyHiddenUnderMore: !!(dr.querySelector('#accMore #accQty')), accMoreOpen: !!(dr.querySelector('#accMore') || {}).open,
          fireTickCount: fireTicks.length, fireTickDisabled: fireTicks.some(i => i.disabled), fireTickInHireFold: fireTicks.some(i => !!i.closest('#dsectHire')),
          hireFoldOpen: hire ? hire.open : null, fireTickVisible: fireTicks.some(i => !!i.offsetParent),
          fireText: [...dr.querySelectorAll('.labtick')].filter(l => /Fire extinguisher/.test(l.textContent)).map(l => l.textContent.replace(/\$[\d,.]+/g, '<figure>').replace(/\s+/g, ' ').trim()).slice(0, 2),
          labourWords: (() => { const dd = [...dr.querySelectorAll('dt')].find(d => /Labour on this reference/.test(d.textContent)); return dd && dd.nextElementSibling ? dd.nextElementSibling.textContent.replace(/\$[\d,.]+/g, '<figure>').replace(/\s+/g, ' ').trim().slice(0, 300) : null; })(),
          bodyViewonly: document.body.classList.contains('viewonly')};
        const c = document.getElementById('dclose'); if (c) c.click();
        return r;
      }, key);
    }
    return res;
  };
  const view = await drawerCheck('view');
  // simulate an editor without sending anything
  await s.page.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit';
    if (!window.__fetch0) { window.__fetch0 = window.fetch; const of = window.__fetch0; window.fetch = async (u, o) => { const r = await of(u, o); const url = String(u); if (/\/api\/(version|state)(\?|$)/.test(url) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; }; }
    document.body.classList.remove('viewonly'); window.__W = [];
    SYNC.db.doc = path => ({id: path.split('/')[1], path, set: async body => { window.__W.push([path, 'set']); }, delete: async () => { window.__W.push([path, 'delete']); }});
    applyCapability(); });
  const edit = await drawerCheck('edit');
  const writes = await s.page.evaluate(() => (window.__W || []).length);
  const res = {model, picks, view, edit, writesCaptured: writes, errors: s.errors, consoleErr, counts: s.counts};
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log('done', OUT, 'blocked', s.counts.blocked, 'errors', s.errors.length);
  await s.browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
