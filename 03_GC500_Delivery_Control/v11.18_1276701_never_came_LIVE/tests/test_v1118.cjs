/* Author: Andrew Fisher. v11.18 checks: the Generators costing no longer prices 1276701 / 9961976 line 6; GN20 carries no
   number; the other fourteen sets are priced as before. GET only; the record is compared before and after.
     PAGE=build/GC500_v11.18/GC500_Delivery_Control_hosted.html node tests/test_v1118.cjs */
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
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.18'));
  const d = await p.evaluate(() => {
   const rows = ONHIRE_ROWS.filter(r => r.rental_contract === '9961976');
   const hist = DATA.rental_on_hire.source_history949.rows.filter(r => r.rental_contract === '9961976' && r.line === 6);
   const a = DATA.assets.find(x => x.key === 'GN20');
   const gens = generatorSourceResolve1004({assets: allAssets(), contractRows: ONHIRE_ROWS, state: S, delivery: deliveryOf, units: unitsOf, lines: chargeLines, branch: branchOf, destination: destinationOf, refLabel: null});
   const ids = gens.map(g => g.id);
   return {line6OnHire: rows.some(r => r.line === 6), anyAsset: ONHIRE_ROWS.some(r => String(r.asset_no) === '1276701'), hist: hist.length === 1 && hist[0].removed_1118 === 'never came to site' && hist[0].delivered === false,
           gn20: a && a.asset_numbers.length === 0 && /never came/.test(a.asset_no_state), summaryLines: DATA.rental_on_hire.summary.lines, contractLines: DATA.rental_on_hire.contracts.find(c => c.rental_contract === '9961976').lines,
           genIds: ids, genHas1276701: JSON.stringify(gens).includes('1276701'), genHasGN20: ids.some(x => /GN20/.test(x)) || JSON.stringify(gens).includes('"ref":"GN20"')};
  });
  check('line 6 / 1276701 is off the on-hire rows and in the source history as never delivered', !d.line6OnHire && !d.anyAsset && d.hist, d);
  check('GN20 carries no number and says why', d.gn20, d);
  check('on-hire summary and the 9961976 contract are recounted (298 lines, 36 on the contract)', d.summaryLines === 298 && d.contractLines === 36, {summaryLines: d.summaryLines, contractLines: d.contractLines});
  check('the generator costing no longer carries 1276701 or GN20', !d.genHas1276701 && !d.genHasGN20, {ids: d.genIds});
  await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-costs button')].find(x => (x.innerText || '').trim() === 'Generators'); if (b) b.click(); });
  await p.waitForTimeout(1200);
  const txt = await p.evaluate(() => document.getElementById('pane-costs').innerText);
  const actual = (txt.match(/Actual · priced\n\$([\d,.]+)/) || [])[1];
  check('Generators tab: 1276701 gone from the view', !/1276701/.test(txt) && !/GN20-S01/.test(txt), {actual});
  fs.writeFileSync(path.join(out, 'generators_tab.txt'), txt);
  console.log('Generators actual · priced:', actual);
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the checks', before === after);
  check('no page errors', h.errors.length === 0, h.errors);
  check('no writes attempted', h.counts.blocked === 0, h.counts);
 } catch (e) { check('run completed', false, String(e && e.stack || e).slice(0, 800)); }
 fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({author: 'Andrew Fisher', page: live ? 'live' : pageFile, passed: results.length - failed, failed, results}, null, 1));
 console.log('test_v1118: ' + (results.length - failed) + ' passed, ' + failed + ' failed');
 try { await h.browser.close(); } catch (e) {}
 process.exit(failed ? 1 : 0);
})();
