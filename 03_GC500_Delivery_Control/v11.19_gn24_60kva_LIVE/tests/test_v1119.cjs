
/* Author: Andrew Fisher. v11.19 checks: 9961976 line 17 (1276412, the 80 kVA that never came) is off the on-hire rows and in the
   source history; GN24 keeps line 49 (1277089) alone and the Generators costing prices it as one 60 kVA set from 19 Oct;
   the other sets are priced as before. GET only; the record is compared before and after.
     PAGE=build/GC500_v11.19/GC500_Delivery_Control_hosted.html node tests/test_v1119.cjs
     LIVE=1 node tests/test_v1119.cjs */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 400))); };
(async () => {
 const h = await open({pageFile, hash: '#costs', W: 1500, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.19'));
  const d = await p.evaluate(() => {
   const rows = ONHIRE_ROWS.filter(r => r.rental_contract === '9961976');
   const hist = DATA.rental_on_hire.source_history949.rows.filter(r => r.rental_contract === '9961976' && r.line === 17);
   const a = DATA.assets.find(x => x.key === 'GN24');
   const gens = generatorInputs1004();
   const g = gens.find(x => x.ref === 'GN24');
   return {line17OnHire: rows.some(r => r.line === 17), anyAsset: ONHIRE_ROWS.some(r => String(r.asset_no) === '1276412'),
           line49: rows.filter(r => r.line === 49 && String(r.asset_no) === '1277089').length,
           hist: hist.length === 1 && hist[0].removed_1119 === 'never came to site' && hist[0].delivered === false && String(hist[0].asset_no) === '1276412',
           gn24Why: !!(a && a.never_came_1119), summaryLines: DATA.rental_on_hire.summary.lines, contractLines: DATA.rental_on_hire.contracts.find(c => c.rental_contract === '9961976').lines,
           holdNote: DATA.rate_hold1029.spares_unjoined.left_as_is,
           gn24: g && {qty: g.qty, item: g.item, deliveredDate: g.deliveredDate, actualIsConfirmed: g.actualIsConfirmed, actualQuantity: g.actualQuantity, issues: g.issues, deliveries: g.contractDeliveries.map(x => x.id)},
           genHas1276412: JSON.stringify(gens.map(x => ({c: x.contractDeliveries, r: x.contractRows, n: x.assetNumbers, id: x.id}))).includes('1276412'), genCount: gens.length};
  });
  check('line 17 / 1276412 is off the on-hire rows and in the source history as never delivered', !d.line17OnHire && !d.anyAsset && d.hist, d);
  check('line 49 / 1277089 stays on the contract for GN24', d.line49 === 1, d);
  check('GN24 in the register says why; the rate-hold note is settled', d.gn24Why && /settled 22 Oct 2026/.test(d.holdNote) && !/1276412/.test(d.holdNote), {holdNote: d.holdNote});
  check('on-hire summary and the 9961976 contract are recounted (297 lines, 35 on the contract)', d.summaryLines === 297 && d.contractLines === 35, {summaryLines: d.summaryLines, contractLines: d.contractLines});
  check('the generator costing sees GN24 as one 60 kVA set, confirmed on site 19 Oct, line 49 alone, no issue', d.gn24 && d.gn24.qty === 1 && d.gn24.item === '60kva' && d.gn24.deliveredDate === '2026-10-19' && d.gn24.actualIsConfirmed && d.gn24.actualQuantity === 1 && d.gn24.issues.length === 0 && d.gn24.deliveries.join() === '9961976:49', d.gn24);
  check('1276412 is on no contract line, row or number the generator costing reads (the register\'s why-note is the only mention)', !d.genHas1276412, {genCount: d.genCount});
  await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-costs button')].find(x => (x.innerText || '').trim() === 'Generators'); if (b) b.click(); });
  await p.waitForTimeout(1200);
  const txt = await p.evaluate(() => document.getElementById('pane-costs').innerText);
  fs.writeFileSync(path.join(out, 'generators_tab.txt'), txt);
  const i = txt.indexOf('\nGN24\n'), j = txt.indexOf('\nGN25\n', i);
  const block = i >= 0 ? txt.slice(i, j > i ? j : i + 800) : '';
  check('Generators tab: GN24 is 1 × 60kva from 19 Oct, priced $386.00 standby + race = $965.01, nothing "Not priced"', /1 × 60kva/.test(block) && /\$386\.00/.test(block) && /\$965\.01/.test(block) && !/Not priced/.test(block) && !/needs allocation/.test(block), {block: block.slice(0, 400)});
  check('Generators tab: 1276412 and GN-24 gone from the view', !/1276412/.test(txt), {});
  const heads = txt.split('\n').map((l, n, arr) => /Actual/.test(l) ? l + ' | ' + (arr[n + 1] || '') : null).filter(Boolean).slice(0, 6);
  console.log('Actual lines:', JSON.stringify(heads));
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the read', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + 'test_v1119.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
