// Author: Andrew Fisher. Every charge gap on the record: on-site references whose delivery or pick-up leg is not
// charged, card lines with no rate, references with nothing priced. Live page, GET only.   node scout.cjs out.json
const {open} = require('../toolchain/harness/open_page.js');
(async () => {
 const s = await open({hash: '#costs'}); const p = s.page;
 await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
 await p.waitForTimeout(4000);
 const r = await p.evaluate(() => holdAssets(() => {
  const T = buildingTransportModel831(), rows = T.rows || [];
  const out = [];
  allAssets().forEach(a => {
   if (a._cancelled || movedAway(a.key)) return; const d = deliveryOf(a.key) || {}; if (d.state !== 'on site') return;
   const ls = chargeLines(a) || [];
   const tr = rows.filter(x => x.ref === a.key && (x.leg === 'delivery' || x.leg === 'pickup')).map(x => ({leg: x.leg, item: x.item, qty: x.quantity, state: x.state, rate: x.rate, additional: x.additional, actual: x.actualAdditional1006, tick: x.tick1033 || null, reasons: x.reasons || [], rateSource: x.rateSource || null, family: x.family || null, covered: (x.coverage || []).map(c => c.id + ' ' + c.amount)}));
   const lab = ls.map(l => { const info = labourLinesFor(a.key, l.discipline, l.item, a.key, undefined, a); const m = labourMoney(a.key, l, a.key, a) || {};
    return {item: l.item, qty: qtyOf(l), state: info.state, priced: (info.lines || []).map(x => x.key + ':' + x.rate + (x.ticked ? '✓' : '')), withheld: info.withheld || [], blocked: !!m.blocked, why: m.why || null}; });
   out.push({ref: a.key, disc: a.discipline, name: a.name, items: ls.map(l => l.item + ' ×' + qtyOf(l)), tr, lab});
  });
  return out;
 }));
 require('fs').writeFileSync(process.argv[2], JSON.stringify(r, null, 1)); console.log(r.length);
 await s.browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
