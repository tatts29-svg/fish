// Author: Andrew Fisher. Every building on the record with all its charges, from the live page (GET only).
//   node buildings.cjs out.json
const {open} = require('../toolchain/harness/open_page.js');
(async () => {
 const s = await open({hash: '#costs'}); const p = s.page;
 await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
 await p.waitForTimeout(4000);
 const r = await p.evaluate(() => holdAssets(() => {
  const T = buildingTransportModel831(), src = typeof Source949 !== 'undefined' ? Source949.model() : [];
  return allAssets().filter(a => a.discipline === 'Portable buildings').map(a => {
   const d = deliveryOf(a.key) || {}, l = (chargeLines(a) || [])[0] || {}, item = l.item;
   let hire = null, contract = null, line = null, assetNo = null;
   try { const card = cardRate(a.discipline, item, a.key); const ic = ItemCharges979.project(a.key, item, ItemIdentity979.select(a.key, item, ONHIRE_ROWS, gcModel925(a).rows), generatorDisplayCharge1004, card.labour_per_piece, src);
    hire = ic.amount; const x = (ic.lines || [])[0]; if (x) { contract = x.contract; line = x.line; assetNo = x.assetNo; } } catch (e) {}
   const info = item ? labourLinesFor(a.key, a.discipline, item, a.key, undefined, a) : {lines: []};
   const lab = {}; (info.lines || []).forEach(x => { lab[x.key] = {rate: x.rate, ticked: !!x.ticked || !!labourTicked(a.key, a.discipline, item, x.key, undefined, a) || !!((S.labour || {})[labourKey(a.key, a.discipline, item, x.key)])}; });
   const tr = {}; (T.rows || []).filter(x => x.ref === a.key).forEach(x => { tr[x.leg] = {rate: x.rate, charge: x.actualAdditional1006, state: x.state, tick: x.tick1033 || null}; });
   return {ref: a.key, name: a.name, item, qty: l.quantity, assetNo: assetNo || (a._buildingNumbers || [])[0] || null, contract, line, state: d.state, done: !!d.done,
    cancelled: !!a._cancelled, moved: !!movedAway(a.key), first: a.first_date, hire, lab, tr};
  });
 }));
 require('fs').writeFileSync(process.argv[2], JSON.stringify(r, null, 1)); console.log(r.length);
 await s.browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
