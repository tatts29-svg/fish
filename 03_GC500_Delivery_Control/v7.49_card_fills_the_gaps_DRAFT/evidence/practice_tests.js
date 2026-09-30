// v7.48 practice tests - read only (every write the page tries is aborted by the harness).
//   CHROMIUM_PATH=... node practice_tests.js <base_live.html> <build.html> <outdir>
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
const ready = p => p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live', null, {timeout: 240000}).then(() => p.waitForTimeout(3000));
const figures = p => p.evaluate(() => { const M = moneySummary(), t = M.streams.find(s => s.key === 'toilets'), b = M.streams.find(s => s.key === 'buildings');
  return {revenue: M.charge.total, contracts: M.charge.contracts, unknown: M.charge.contracts_unknown, servicing: M.charge.servicing || 0,
    toilets: {charge: t.charge0, cost: t.cost0, diff: t.difference0, unrated: t.unrated, notes: t.notes}, buildings: {charge: b && b.charge0, unrated: b && b.unrated}}; });
(async () => {
 const [base, build, out] = [process.argv[2], process.argv[3], process.argv[4] || __dirname]; const R = {};
 let s = await open({pageFile: base}); await ready(s.page); R.before = await figures(s.page); await s.browser.close();
 s = await open({pageFile: build}); const p = s.page; await ready(p); R.after = await figures(p);
 R.filled = await p.evaluate(() => ONHIRE_ROWS.map(r => ({r, f: lr748For(r)})).filter(x => x.f).map(x => ({line: x.r.rental_contract + '·' + x.r.line, what: x.r.what, from: x.f.from, card: x.f.card && x.f.card.line, rate: x.f.rate, charge: contractCharge(x.r).amount, basis: contractCharge(x.r).basis.slice(0, 200)})));
 R.servicing = await p.evaluate(() => servicing748());
 // a typed rate wins, an empty one puts the card back (in memory only; save() is aborted by the harness)
 R.typed = await p.evaluate(() => { const r = ONHIRE_ROWS.find(x => x.rental_contract === '9961976' && x.line === 7); S.lineRates = S.lineRates || {};
   const card = contractCharge(r).amount; S.lineRates['c|9961976|7'] = '800'; const typed = contractCharge(r).amount; RENDER_MEMO.clear(); const rev1 = moneySummary().charge.total;
   S.lineRates['service|FWF Pump out & Clean & Restock'] = '60'; const sv = servicing748Total(); RENDER_MEMO.clear(); const rev2 = moneySummary().charge.total;
   delete S.lineRates['c|9961976|7']; delete S.lineRates['service|FWF Pump out & Clean & Restock']; RENDER_MEMO.clear(); return {card, typed, back: contractCharge(r).amount, servicingTyped: sv, rev1, rev2, revBack: moneySummary().charge.total}; });
 R.decidedStands = await p.evaluate(() => { const r = ONHIRE_ROWS.find(x => x.rental_contract === '9968955' && x.line === 3); S.lineRates = S.lineRates || {}; S.lineRates['c|9968955|3'] = '999'; const c = contractCharge(r); delete S.lineRates['c|9968955|3']; return {amount: c.amount, how: c.how}; });
 // the Costs tab, as an editor sees it (typing into a box)
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Practice test'; });
 await p.evaluate(() => go('costs')); await p.waitForTimeout(1500);
 R.ui = await p.evaluate(() => { const c = document.getElementById('card748'); return {shown: !!c, boxes: c ? c.querySelectorAll('[data-lr748]').length : 0, text: c ? c.innerText.slice(0, 900) : ''}; });
 await p.evaluate(() => { const i = document.querySelector('[data-lr748="c|9961976|10"]'); i.value = '95'; i.dispatchEvent(new Event('change', {bubbles: true})); }); await p.waitForTimeout(800);
 R.uiTyped = await p.evaluate(() => ({marginShows: (document.querySelector('#pane-costs') || {}).innerText.includes(money0(moneySummary().charge.total)), revenue: moneySummary().charge.total, stored: (S.lineRates || {})['c|9961976|10'], by: (S.by || {})['lineRates/c|9968929|7'], charge: contractCharge(ONHIRE_ROWS.find(x => x.rental_contract === '9961976' && x.line === 10)).amount, cell: (document.querySelector('[data-lr748="c|9961976|10"]') || {}).value}));
 await p.evaluate(() => { const i = document.querySelector('[data-lr748="c|9961976|10"]'); i.value = ''; i.dispatchEvent(new Event('change', {bubbles: true})); }); await p.waitForTimeout(800);
 R.uiCleared = await p.evaluate(() => ({stored: (S.lineRates || {})['c|9961976|10'] || null, charge: contractCharge(ONHIRE_ROWS.find(x => x.rental_contract === '9961976' && x.line === 10)).amount}));
 await p.evaluate(() => document.getElementById('card748').scrollIntoView()); await p.waitForTimeout(400);
 await p.screenshot({path: path.join(out, 'shot748_costs_desktop.png')});
 R.errors = s.errors; R.blockedWrites = s.counts.blocked; await s.browser.close();
 s = await open({pageFile: build, mobile: true, W: 390, H: 844, dpr: 2}); await ready(s.page);
 await s.page.evaluate(() => go('costs')); await s.page.waitForTimeout(1500); await s.page.evaluate(() => document.getElementById('card748').scrollIntoView()); await s.page.waitForTimeout(400);
 await s.page.screenshot({path: path.join(out, 'shot748_costs_phone.png')}); R.phoneErrors = s.errors;
 R.phoneOverflow = await s.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results.json'), JSON.stringify(R, null, 1));
 console.log(JSON.stringify({before: R.before, after: R.after, filled: R.filled.map(f => [f.line, f.what, f.rate, f.charge]), servicing: R.servicing && R.servicing.total, typed: R.typed, decidedStands: R.decidedStands, ui: {shown: R.ui.shown, boxes: R.ui.boxes}, uiTyped: R.uiTyped, uiCleared: R.uiCleared, errors: R.errors, phoneErrors: R.phoneErrors, phoneOverflow: R.phoneOverflow}, null, 1));
})();
