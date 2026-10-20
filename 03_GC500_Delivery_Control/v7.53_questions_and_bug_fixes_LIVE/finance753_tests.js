// Author: Andrew Fisher. Read-only financial regression checks; rate edits are in-memory only.
// Usage: NODE_PATH=... CHROMIUM_PATH=... node finance753_tests.js <candidate.html> [results.json]
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
let rig;
const result = {author: 'Andrew Fisher', checks: []};
(async () => {
 rig = await open({pageFile: process.argv[2], hash: '#costs'});
 const p = rig.page;
 await p.waitForFunction(() => typeof labourNote753 === 'function' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
 await p.waitForTimeout(1500);
 result.checks = await p.evaluate(() => {
  const checks = [], check = (name, ok, detail) => checks.push({name, pass: !!ok, detail});
  const before = JSON.stringify(S), contracts = JSON.stringify(ONHIRE_ROWS), base = moneySummary(), fin = fin745Summary();
  check('Corrected event-day and MEAD revenue is unchanged', base.charge.total === 555929.94, base.charge.total);
  check('Unknown accessory rates remain unknown', base.charge.contracts_unknown === 2, base.charge.contracts_unknown);
  check('Unpriced water services stay visible, supplier cost is not revenue', base.missing.some(s => /12,200/.test(s) && /not a customer rate/.test(s)));
  check('Water supplier cost is still counted once', base.cost.rehire === 118575, base.cost.rehire);
  check('Live source has no invented confirmed payroll', fin.actualCostCount === 0 && fin.confirmedHours === 0, {actualCostCount: fin.actualCostCount, confirmedHours: fin.confirmedHours});
  check('Existing priced labour outlook is preserved', fin.expectedCost === 31823.98 && fin.unpricedCount === 159, {outlook: fin.expectedCost, unpriced: fin.unpricedCount});
  check('P&L does not claim known hourly rates are absent', !/no wage rate|no hourly rate/i.test(marginCard()));
  check('Expanded P&L explains estimates and unconfirmed elapsed hours', marginCard().includes('Card-based revenue, future work and provisional quotes are estimates') && marginCard().includes('h scheduled through') && !marginCard().includes('Nothing on either side is estimated'));
  // The original workbook's quotation "No wage rates ... have been assumed" remains source evidence.
  check('Entire Costs view avoids obsolete current blanket claims', !/no wage rate(?: was| given| supplied| —)|no hourly rate (?:was|given|supplied)|no dollar is put on an hour|with no rate, so not in dollars|nothing (?:typed or|on either side is) estimated/i.test(document.querySelector('#pane-costs').innerHTML));
  check('Labour explanation gives priced shifts and partial outlook', base.missing[0].includes('49 of 208') && base.missing[0].includes('31,823.98') && base.missing[0].includes('not added to this P&L'), base.missing[0]);
  const cat = key => base.categories.find(c => c.key === key);
  check('CNA hours classify as internal despite blank employer', cat('internal').hours === 1702.5 && cat('external').hours === 499, {internal: cat('internal').hours, external: cat('external').hours});
  check('No direct-cost total changed or double counted', Math.abs(base.categories.reduce((sum, c) => sum + c.amount, 0) - base.cost.known) < 0.001 && base.cost.known === 235081.76, base.cost.known);
  check('Explicit employment type precedes employer text', labourCategory753({type: 'Internal CNA', employer: ''}) === 'internal' && labourCategory753({type: 'External', employer: 'Coates site'}) === 'external');
  check('Missing type and employer remain unclassified', labourCategory753({}) === 'unknown');
  check('Employer fallback still handles older records', labourCategory753({employer: 'Coates'}) === 'internal' && labourCategory753({employer: 'JOB CONNECT'}) === 'external');
  check('Servicing defaults retain quote quantity and card total', base.servicing.total === 85101.75 && base.servicing.lines[0].qty === 780, base.servicing.total);
  const hadRates = Object.prototype.hasOwnProperty.call(S, 'lineRates'), saved = S.lineRates;
  try {
   S.lineRates = Object.assign({}, saved, {'service|FWF Pump out & Clean & Restock': '100'}); RENDER_MEMO.clear();
   const changed = moneySummary(), html = marginCard();
   check('Typed servicing rate changes the single source total', changed.servicing.total === 106263.15 && changed.charge.servicing === 106263.15, changed.charge.servicing);
   check('Revenue follows the typed servicing rate once', Math.abs(changed.charge.total - base.charge.total - 21161.4) < 0.001, changed.charge.total);
   check('Financial paragraph uses edited rates and totals', html.includes('the typed rate $100.00') && html.includes('$78,000.00') && html.includes('$106,263.15') && !html.includes('$85,102'));
   check('Changing customer rate leaves supplier cost unchanged', changed.cost.known === base.cost.known && changed.cost.rehire === base.cost.rehire);
   check('Rate edit never promotes planned labour to actuals', fin745Summary().actualCostCount === 0 && fin745Summary().expectedCost === fin.expectedCost);
   S.lineRates['service|FWF Pump out & Clean & Restock'] = '0'; RENDER_MEMO.clear();
   check('Explicit zero rate remains a typed zero, not card fallback', moneySummary().servicing.lines[0].rate === 0 && moneySummary().charge.servicing === 28263.15);
  } finally { if (hadRates) S.lineRates = saved; else delete S.lineRates; RENDER_MEMO.clear(); }
  check('Live records and source contract data were not changed', JSON.stringify(S) === before && JSON.stringify(ONHIRE_ROWS) === contracts);
  return checks;
 });
 result.checks.push({name: 'No page errors', pass: rig.errors.length === 0, detail: rig.errors});
 result.checks.push({name: 'No record-write attempts', pass: rig.counts.blocked === 0, detail: rig.counts.blocked});
})().catch(e => {result.error = String(e.stack || e); result.checks.push({name: 'Financial checks completed', pass: false});}).finally(async () => {
 if (rig) await rig.browser.close();
 result.passed = result.checks.filter(c => c.pass).length; result.total = result.checks.length;
 fs.writeFileSync(process.argv[3] || '/tmp/finance753_results.json', JSON.stringify(result, null, 2));
 console.log(JSON.stringify({passed: result.passed, total: result.total, failures: result.checks.filter(c => !c.pass), error: result.error}, null, 2));
 process.exitCode = result.passed === result.total ? 0 : 1;
});
