// Author: Andrew Fisher. Every toilet reference with all its charges, from the live page (GET only).
//   node toilets.cjs out.json [page.html]   (default: the live page)
const {open} = require('../toolchain/harness/open_page.js');
(async () => {
 const s = await open(Object.assign({hash: '#costs'}, process.argv[3] ? {pageFile: process.argv[3]} : {})); const p = s.page;
 await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
 await p.waitForTimeout(4000);
 const r = await p.evaluate(() => holdAssets(() => {
  const T = buildingTransportModel831(), src = typeof Source949 !== 'undefined' ? Source949.model() : [], R = nightRates1040();
  const L = S.labour || {}, ST = S.stamps || {}, r2 = v => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
  return allAssets().filter(a => a.discipline === 'Toilets & amenities').map(a => {
   const d = deliveryOf(a.key) || {};
   const lines = (chargeLines(a) || []).map(l => {
    let hire = null, hireLines = [];
    try { const card = cardRate(a.discipline, l.item, a.key); const ic = ItemCharges979.project(a.key, l.item, ItemIdentity979.select(a.key, l.item, ONHIRE_ROWS, gcModel925(a).rows), generatorDisplayCharge1004, card.labour_per_piece, src);
     hire = ic.amount; hireLines = (ic.lines || []).map(x => ({contract: x.contract, line: x.line, assetNo: x.assetNo, qty: x.quantity, amount: x.amount, ownUse: x.ownUse, included: x.included})); } catch (e) {}
    const m = labourMoney(a.key, l, a.key, a) || {}; const lab = {};
    (m.ticked || []).forEach(x => { lab[x.key] = {rate: x.rate, qty: x.chargeQty975 != null ? x.chargeQty975 : x.qty, value: r2(x.value != null ? x.value : (x.rate || 0) * (x.qty || 0))}; });
    const info = labourLinesFor(a.key, a.discipline, l.item, a.key, undefined, a);
    const card = (info.lines || []).map(x => x.key + ':' + x.rate);
    return {item: l.item, qty: qtyOf(l), hire, hireLines, lab, labTotal: m.total, blocked: !!m.blocked, why: m.why || null, card};
   });
   const tr = {}; (T.rows || []).filter(x => x.ref === a.key && (x.leg === 'delivery' || x.leg === 'pickup')).forEach(x => { const t = tr[x.leg] || (tr[x.leg] = {charge: 0, units: 0, rows: 0, ticks: []}); t.charge = r2(t.charge + (Number(x.actualAdditional1006) || 0)); t.units += Number(x.quantity) || 0; t.rows++; t.ticks.push(x.tick1033 || x.state); });
   const ns = nightService1040(a, R);
   const off = Object.keys(ST).filter(k => k.startsWith('labour/' + a.key + '|') && !L[k.slice(7)]).map(k => k.slice(7));
   return {ref: a.key, name: a.name, state: d.state, done: !!d.done, cancelled: !!a._cancelled, moved: !!movedAway(a.key), lines, tr,
    nights: ns ? {lines: ns.lines.map(x => ({kind: x.kind, units: x.units, rate: x.rate, per_night: x.per_night, total: x.total})), per_night: ns.per_night, total: ns.total} : null, off};
  });
 }));
 require('fs').writeFileSync(process.argv[2], JSON.stringify(r, null, 1)); console.log(r.length);
 await s.browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
