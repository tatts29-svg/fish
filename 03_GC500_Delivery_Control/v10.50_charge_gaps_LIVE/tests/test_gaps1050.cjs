// v10.50 charge gaps. GET-only: compares the build with the live page; nothing reaches the service.
//   node test_gaps1050.cjs path/to/page.html
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
async function read(pageFile){
 const h = await open(Object.assign({hash: '#costs'}, pageFile ? {pageFile} : {})); const errs = []; h.page.on('pageerror', e => errs.push(e.message));
 await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
 await h.page.waitForTimeout(4000);
 const r = await h.page.evaluate(() => holdAssets(() => {
  const T = buildingTransportModel831(), leg = (ref, item, l) => { const x = (T.rows || []).find(r => r.ref === ref && r.item === item && r.leg === l); return x ? {state: x.state, rate: x.rate, add: x.additional, act: x.actualAdditional1006, rem: x.remainingAdditional1006, src: x.rateSource, cov: (x.coverage || []).map(c => c.id)} : null; };
  const m = moneySummary(); const flat = {}; Object.keys(m || {}).forEach(k => { if (typeof m[k] === 'number') flat[k] = m[k]; });
  const P = labourPlan(); const fireToCome = (P.slots || []).filter(s => s.key === 'fire_ext' && s.state !== 'charged').length;
  const sv = servicing748(); const fwf = (sv.card_lines || []).find(l => /^FWF/.test(l.card_line));
  return {foot: document.getElementById('footL').textContent, money: flat, transport: {act: T.actualAdditional1006, rem: T.remainingAdditional1006},
   wc05d: leg('WC05', 'Waste tank', 'delivery'), wc05p: leg('WC05', 'Waste tank', 'pickup'), wc20d: leg('WC20', 'Waste tank', 'delivery'),
   wc02d: leg('WC02', 'FWF', 'delivery'), wc06d: leg('WC06', 'FWF', 'delivery'), t3d: leg('T0003', 'Forklift 5T', 'delivery'), t3p: leg('T0003', 'Forklift 5T', 'pickup'),
   t109d: leg('T0109', '2.5T Forklift STD', 'delivery'), t25p: leg('T0025', 'Trakmat', 'pickup'), t25d: leg('T0025', 'Trakmat', 'delivery'),
   c258: leg('T0258', '3.0m Cont', 'delivery'), c266p: leg('T0266', '6.0m Refrigerator Cont', 'pickup'), t85: leg('T0085', '3.5T Forklift Std', 'delivery'), fl03: leg('FL03', 'Forklift 5T', 'pickup'), fl04: leg('FL04', 'Forklift 2.5T', 'delivery'),
   wb01: leg('WB01', 'TL2', 'delivery'), vms: leg('T0001', 'VMS', 'delivery'), gn20: leg('GN20', '350kva', 'delivery'),
   p05fire: labourLinesFor('P05', 'Portable buildings', 'Building 6m', 'P05', undefined, assetOf('P05')).lines.some(x => x.key === 'fire_ext'),
   p08fire: labourLinesFor('P08', 'Portable buildings', 'Building 6m', 'P08', undefined, assetOf('P08')).lines.some(x => x.key === 'fire_ext'),
   fireToCome, t24: nightService1040(assetOf('T0024')), fwfUnits: fwf && fwf.units1040, snap: typeof snap1049 === 'function' ? snap1049().total : null};
 }));
 r.errs = errs; await h.browser.close(); return r;
}
(async () => {
 const live = await read(null), b = await read(page);
 console.log(JSON.stringify({live: {money: live.money, transport: live.transport, fireToCome: live.fireToCome, fwf: live.fwfUnits}, build: {money: b.money, transport: b.transport, fireToCome: b.fireToCome, fwf: b.fwfUnits, snap: b.snap}}, null, 1));
 ok(/v10\.50$/.test(b.foot), 'footer v10.50');
 ok(b.wc05d && b.wc05d.state === 'estimate' && b.wc05d.rate === 500 && b.wc05d.act === 500, 'WC05 tank delivery $500, on site so arrived');
 ok(b.wc05p && b.wc05p.add === 500 && b.wc05p.act === 500 && b.wc05p.rem === 0, 'WC05 tank pick-up $500 counts like every other leg on site (arrived once the unit is here)');
 ok(b.wc20d && b.wc20d.add === 1000, 'WC20 two tanks $1,000 delivery');
 ok(b.wc02d && b.wc02d.act === 47.5 && b.wc06d && b.wc06d.act === 95, 'WC02 $47.50 and WC06 $95 delivery at the FWF card rate');
 ok(b.t3d && b.t3d.act === 500 && b.t3p && b.t3p.add === 500, 'T0003 forklift $500 each way');
 ok(b.t109d && b.t109d.act === 500, 'T0109 forklift delivery $500');
 ok(b.t25p && b.t25p.add === 103.3 && b.t25d && b.t25d.state === live.t25d.state, 'T0025 Trakmat pick-up $103.30; delivery unchanged (covered)');
 ok([b.c258, b.c266p, b.t85, b.fl03, b.fl04].every(x => x && x.state === 'covered' && x.add === 0 && x.cov.length), 'containers and contract forklifts show covered, nothing added');
 ok(b.wb01 && b.wb01.state === 'held' && b.vms && b.vms.state === 'held' && b.gn20 && b.gn20.state === 'held', 'barriers, VMS and GN20 still wait for Andrew (held)');
 ok(!b.p05fire && b.p08fire, 'fire extinguisher line only where one is recorded (P05 none, P08 yes)');
 ok(b.fireToCome === 0 && live.fireToCome > 0, 'no fire extinguisher forecast where none is recorded (live had ' + live.fireToCome + ')');
 ok(b.t24 === null, 'T0024 Coates compound toilet: no servicing');
 const dT = Math.round((b.transport.act - live.transport.act) * 100) / 100;
 ok(Math.abs(dT - 8293.3) < 0.01, 'transport arrived +$8,293.30 (tanks $6,000, WC02/04/06 $190, T0003 $1,000, T0109 $1,000, T0025 $103.30): ' + dT);
 const dD = Math.round(((b.money.difference || 0) - (live.money.difference || 0)) * 100) / 100;
 ok(Math.abs(dD - 8949.13) < 0.01, 'result +$8,949.13 = transport $8,293.30 + accessible servicing $874.44 − T0024 servicing $218.61: ' + dD);
 ok(Math.abs(b.snap - 149017.32) < 0.01, 'buildings snapshot $149,017.32 = $147,017.32 + containers $2,000 on the contract: ' + b.snap);
 ok(b.errs.length === 0, 'no page errors ' + b.errs.join(' | '));
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
