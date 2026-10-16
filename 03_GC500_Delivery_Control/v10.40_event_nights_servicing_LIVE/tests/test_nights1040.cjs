#!/usr/bin/env node
/* Author: Andrew Fisher. v10.40 test: event-night servicing per unit per night. Base (live v10.39) against the build,
   live record read only, every write aborted.
     node tests/test_nights1040.cjs <base.html> <build.html> */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
async function read(pageFile) {
  const h = await open({pageFile, hash: '#plant'});
  try {
    await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    const r = await h.page.evaluate(() => {
      const sv = servicing748(), out = {footer: (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0], total: sv.total, card: sv.card_total, atCost: sv.at_cost_total,
        lines: sv.card_lines.map(l => ({line: l.card_line, qty: l.qty, rate: l.rate, amount: l.amount, units: l.units1040, desc: l.description}))};
      if (typeof nightService1040 === 'function') { const a = assetOf('WC09'); out.wc09 = nightService1040(a); out.wc05 = nightService1040(assetOf('WC05')); out.p03 = nightService1040(assetOf('P03')); out.nights = nights1040().map(n => n.label); out.html = nightsHtml1040('WC09'); }
      return out; });
    const t0 = Date.now(); await h.page.evaluate(() => openAsset('WC09')); await h.page.waitForTimeout(900);
    r.drawerMs = Date.now() - t0; r.drawerHas = await h.page.evaluate(() => { const el = document.querySelector('#drawer .ns1040'); return el ? el.innerText.replace(/\n/g, ' | ').slice(0, 400) : null; });
    for (const tab of ['costs', 'pricing']) { await h.page.evaluate(k => { try { go(k); } catch (e) {} }, tab); await h.page.waitForTimeout(1500); }
    r.errors = h.errors.slice();
    return r;
  } finally { await h.browser.close(); }
}
(async () => {
  const [base, build] = process.argv.slice(2);
  const B = await read(base), N = await read(build);
  let failed = 0, total = 0; const check = (w, ok, d) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + w + (d ? ' - ' + d : '')); };
  const L = k => N.lines.find(l => l.line === k) || {};
  check('build is v10.40 on v10.39', B.footer === 'v10.39' && N.footer === 'v10.40', B.footer + ' -> ' + N.footer);
  check('three event nights: Fri, Sat, Sun', N.nights && N.nights.length === 3 && /Friday/.test(N.nights[0]) && /Sunday/.test(N.nights[2]), JSON.stringify(N.nights));
  check('FWF: every unit × 3 nights at $72.87', L('FWF Pump out & Clean & Restock').qty === L('FWF Pump out & Clean & Restock').units * 3 && L('FWF Pump out & Clean & Restock').rate === 72.87, JSON.stringify(L('FWF Pump out & Clean & Restock')));
  check('waste tanks: every tank × 3 nights at $624.60', L('Tank Pump Out & Clean & Restock').qty === L('Tank Pump Out & Clean & Restock').units * 3 && L('Tank Pump Out & Clean & Restock').rate === 624.6, JSON.stringify(L('Tank Pump Out & Clean & Restock')));
  check('sewer-connect blocks × 3 nights at $260.25', L('Sewer Connect Units Clean & Restock').qty === L('Sewer Connect Units Clean & Restock').units * 3 && L('Sewer Connect Units Clean & Restock').rate === 260.25, JSON.stringify(L('Sewer Connect Units Clean & Restock')));
  check('water lines (charged at cost) unchanged', B.atCost === N.atCost, B.atCost + ' / ' + N.atCost);
  const w = N.wc09 || {lines: []}, wf = w.lines.find(l => l.kind === 'fwf') || {}, ws = w.lines.find(l => l.kind === 'sewer') || {};
  check('WC09: 10 FWF $728.70 a night, 2 sewer blocks $520.50 a night, 3 nights $3,747.60', wf.units === 10 && wf.per_night === 728.7 && ws.units === 2 && ws.per_night === 520.5 && w.total === 3747.6, JSON.stringify({fwf: wf.per_night, sewer: ws.per_night, total: w.total}));
  const t5 = N.wc05 || {lines: []};
  check('WC05 (block with a waste tank): the tank is charged, the block is not charged twice', t5.lines.some(l => l.kind === 'tank') && !t5.lines.some(l => l.kind === 'sewer'), JSON.stringify(t5.lines.map(l => l.kind + ' ' + l.units)));
  check('a building carries no toilet servicing', N.p03 === null, JSON.stringify(N.p03));
  check('the drawer shows each night and the three-night total', !!N.drawerHas && /fri/i.test(N.drawerHas) && /sun/i.test(N.drawerHas) && /3,747\.60/.test(N.drawerHas), N.drawerHas);
  check('no page errors (drawer, Costs, Pricing)', !N.errors.length, N.errors[0] || '');
  console.log('servicing charged to the V8s: ' + B.total + ' -> ' + N.total + ' (card lines ' + B.card + ' -> ' + N.card + ')');
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
