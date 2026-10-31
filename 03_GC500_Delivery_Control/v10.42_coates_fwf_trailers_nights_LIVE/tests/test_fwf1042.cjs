#!/usr/bin/env node
/* Author: Andrew Fisher. v10.42 test: Coates' FWF trailers get event-night servicing like every FWF. Base (live v10.40)
   against the build, live record read only, every write aborted.
     node tests/test_fwf1042.cjs <base.html> <build.html> */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
async function read(pageFile) {
  const h = await open({pageFile, hash: '#plant'});
  try {
    await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    const r = await h.page.evaluate(() => { const sv = servicing748();
      return {footer: (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0], total: sv.total, atCost: sv.at_cost_total,
        lines: sv.card_lines.map(l => ({line: l.card_line, qty: l.qty, units: l.units1040, amount: l.amount})),
        wc100: nightService1040(assetOf('WC100')), wc09: nightService1040(assetOf('WC09')), wc32: nightService1040(assetOf('WC32'))}; });
    await h.page.evaluate(() => openAsset('WC100')); await h.page.waitForTimeout(900);
    r.drawer = await h.page.evaluate(() => { const el = document.querySelector('#drawer .ns1040'); return el ? el.innerText.replace(/\n/g, ' | ').slice(0, 300) : null; });
    for (const tab of ['costs', 'pricing']) { await h.page.evaluate(k => { try { go(k); } catch (e) {} }, tab); await h.page.waitForTimeout(1500); }
    r.errors = h.errors.slice(); return r;
  } finally { await h.browser.close(); }
}
(async () => {
  const [base, build] = process.argv.slice(2);
  const B = await read(base), N = await read(build);
  let failed = 0, total = 0; const check = (w, ok, d) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + w + (d ? ' - ' + d : '')); };
  const L = (S, k) => S.lines.find(l => /^FWF/.test(l.line) === (k === 'fwf') && (k !== 'fwf' || true) && (k === 'fwf' ? /^FWF/.test(l.line) : l.line === k)) || {};
  const bf = L(B, 'fwf'), nf = L(N, 'fwf');
  check('build is v10.42 on v10.40', B.footer === 'v10.40' && N.footer === 'v10.42', B.footer + ' -> ' + N.footer);
  check('WC100: was not charged', B.wc100 === null, JSON.stringify(B.wc100));
  const w = (N.wc100 || {lines: []}).lines.find(l => l.kind === 'fwf') || {};
  check('WC100: 2 Coates FWF trailers × $72.87 = $145.74 a night, $437.22 for Fri, Sat, Sun', w.units === 2 && w.per_night === 145.74 && N.wc100.total === 437.22 && w.nights.length === 3, JSON.stringify({units: w.units, per: w.per_night, total: N.wc100 && N.wc100.total}));
  check('FWF units on the card line go up by exactly 2', nf.units === bf.units + 2, bf.units + ' -> ' + nf.units);
  check('FWF line: units × 3 nights × $72.87', nf.qty === nf.units * 3 && Math.abs(nf.amount - Math.round(nf.qty * 72.87 * 100) / 100) < 0.005, JSON.stringify(nf));
  check('servicing total goes up by exactly $437.22', Math.abs(N.total - B.total - 437.22) < 0.005, B.total + ' -> ' + N.total);
  const others = l => l.filter(x => !/^FWF/.test(x.line)).map(x => x.line + ' ' + x.qty + ' ' + x.amount).join('; ');
  check('waste tank and sewer-connect lines unchanged', others(B.lines) === others(N.lines), others(N.lines));
  check('water lines (charged at cost) unchanged', B.atCost === N.atCost, B.atCost + ' / ' + N.atCost);
  check('WC09 unchanged (10 FWF + 2 sewer blocks, $3,747.60)', JSON.stringify(B.wc09) === JSON.stringify(N.wc09) && N.wc09.total === 3747.6, N.wc09 && N.wc09.total);
  check('cancelled WC32 stays uncharged', N.wc32 === null, JSON.stringify(N.wc32));
  check('WC100 drawer shows each night and $437.22', !!N.drawer && /fri/i.test(N.drawer) && /sun/i.test(N.drawer) && /437\.22/.test(N.drawer), N.drawer);
  check('no page errors (drawer, Costs, Pricing)', !N.errors.length, N.errors[0] || '');
  console.log('servicing charged to the V8s: ' + B.total + ' -> ' + N.total + ' (FWF units ' + bf.units + ' -> ' + nf.units + ')');
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
