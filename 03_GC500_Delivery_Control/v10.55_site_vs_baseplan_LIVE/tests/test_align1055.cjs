// Author: Andrew Fisher. v10.55 site vs Baseplan. GET-only; the P06 swap happens in page memory only.
//   node test_align1055.cjs path/to/page.html
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2]; let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
(async () => {
 for (const mob of [false, true]) {
  const tag = mob ? 'phone' : 'desktop';
  const h = await open(Object.assign({pageFile: page, hash: '#costs'}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {})); const p = h.page;
  try {
   await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
   await p.waitForTimeout(3500);
   const r = await p.evaluate(async () => {
    const out = {foot: document.getElementById('footL').textContent};
    const hire = () => { RENDER_MEMO.clear(); const a = assetOf('P06'), l = chargeLines(a)[0], card = cardRate(a.discipline, l.item, a.key); return ItemCharges979.project(a.key, l.item, ItemIdentity979.select(a.key, l.item, ONHIRE_ROWS, gcModel925(a).rows), generatorDisplayCharge1004, card.labour_per_piece, typeof Source949 !== 'undefined' ? Source949.model() : []).amount; };
    out.snap0 = snap1049().total; out.h0 = hire(); out.diff0 = [...align1055.scan().keys()];
    capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; S.operator = 'Andrew Fisher';
    numberPutOn('P06', '1097453', 'Andrew Fisher'); numberTakeOff('P06', '1087453', 'Andrew Fisher');
    out.nums = assetNumbersOf(assetOf('P06')); out.h1 = hire(); RENDER_MEMO.clear(); out.snap1 = snap1049().total;
    align1055.DIFFS.clear(); out.diff1 = [...align1055.scan().entries()].map(([k, ds]) => k + ':' + ds.map(d => d.site + '/' + d.baseplan + '/' + d.line).join(','));
    openAsset('P06'); await new Promise(r => setTimeout(r, 1200)); out.drawer = (document.querySelector('#drawer .align1055') || {}).innerText || '';
    return out; });
   ok(/v10\.55$/.test(r.foot), tag + ': footer v10.55');
   ok(r.diff0.length === 0, tag + ': before the change no building differs (' + r.diff0.join(',') + ')');
   ok(r.nums.join() === '1097453', tag + ': P06 carries 1097453 (in page memory)');
   ok(Math.abs(r.h0 - 1426.07) < 0.005 && Math.abs(r.h1 - 1426.07) < 0.005, tag + ': P06 keeps its $1,426.07 hire on line 64 (' + r.h0 + ' → ' + r.h1 + ')');
   ok(Math.abs(r.snap0 - r.snap1) < 0.005, tag + ': buildings total unchanged (' + r.snap0 + ' → ' + r.snap1 + ')');
   ok(r.diff1.length === 1 && r.diff1[0] === 'P06:1097453/1087453/64', tag + ': the difference is listed: ' + r.diff1.join('; '));
   ok(/Site 1097453 · Baseplan 1087453/.test(r.drawer), tag + ': the P06 drawer shows Site vs Baseplan');
   ok(h.errors.length === 0, tag + ': no page errors ' + h.errors.slice(0, 3).join(' | '));
  } finally { await h.browser.close(); }
 }
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
