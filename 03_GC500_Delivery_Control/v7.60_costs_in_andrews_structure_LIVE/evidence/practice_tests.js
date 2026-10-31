// v7.60 practice tests - read only against the live record. Proves the three rules with the page's own numbers:
// the labour ticks split by kind add to the old single line; the toilets' servicing and rehire cost sit on the
// toilets' branch; All branches + the scope = Total revenue; the lower By branch card carries the servicing under
// subhire on that branch. Also reads the labour hours and the forecast of labour to charge (Andrew, 1 Oct).
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(4000);
 R.numbers = await p.evaluate(() => {
 const M = moneySummary(), c = M.charge, TK = pl760Ticks(), B = pl752Rows(), RH = pl754Rehire(M);
 const TB = pl760ToiletBranch(), FB = pl760FencingByBranch();
 const cat = k => (M.categories || []).find(x => x.key === k) || {};
 const r2 = v => Math.round(v * 100) / 100;
 const ticksSum = r2(TK.install.amount + TK.cleaning.amount + TK.fire_ext.amount + TK.other.amount);
 const branches = r2(B.reduce((s, b) => s + b.total, 0) + (Number(c.servicing) || 0) + Object.values(FB).reduce((s, v) => s + v, 0) + ticksSum);
 return {labour_old_line: c.labour, labour_ticks_old: c.labour_ticks, ticks: {install: TK.install, cleaning: TK.cleaning, fire_ext: TK.fire_ext, other: TK.other, total: TK.total, count: TK.ticks}, ticksSumEqualsOld: Math.abs(ticksSum - c.labour) < 0.01 && TK.ticks === c.labour_ticks,
 toiletBranch: TB, servicing: c.servicing, rehireCost: RH.cost, rehireApproved: RH.approved, fencingByBranch: FB, fencingCost: cat('fencing').amount, rehireCostCategory: cat('rehire').amount,
 contractsTotal: r2(B.reduce((s, b) => s + b.total, 0)), branchesRevenue: branches, scope: c.race && c.race.amount, scopeHours: c.race && c.race.hours, totalRevenue: c.total, reconciles: Math.abs(branches + (c.race && c.race.amount || 0) - c.total) < 2,
 byBranchTicks: Object.fromEntries(Object.entries(TK.byBranch).map(([k, v]) => [k, {install: v.install.amount, cleaning: v.cleaning.amount, amount: v.amount}])),
 knownCosts: M.cost && M.cost.known, difference: M.difference0};
 });
 /* what the page shows */
 R.plText = await p.evaluate(() => { const el = document.querySelector('#pane-costs'); const t = el.innerText; const a = t.indexOf('Forecast P&L'), z = t.indexOf('MONTH-END CONTROL'); return t.slice(a, z > a ? z : a + 9000); });
 R.hasOldLabourLine = /Labour ticked on references/.test(R.plText);
 R.hasLabourInstall = /Labour — Install/.test(R.plText); R.hasCleaningLine = /Cleaning, per piece|Cleaning\b/.test(R.plText);
 R.servicingNamesBranch = new RegExp('Toilet servicing and cleaning — ' + R.numbers.toiletBranch + ' rehire').test(R.plText);
 R.lowerTable = await p.evaluate(() => { const rows = [...document.querySelectorAll('#pane-costs table.brtbl tbody tr')].map(tr => [...tr.children].map(td => td.innerText.trim().replace(/\s+/g, ' '))); return rows; });
 /* the labour hours and the forecast of labour to charge (Andrew, 1 Oct) */
 R.labour = await p.evaluate(() => {
 const M = moneySummary(), c = M.charge, k = M.cost; const LP = labourPlan().all; const TK = pl760Ticks();
 const T = (typeof trackerFigures === 'function') ? trackerFigures(todayIso()) : null;
 const fin = (typeof fin745Summary === 'function') ? fin745Summary(null, todayIso()) : null;
 return {tracker: T ? {build_demob_hours: T.hours || T.build_demob || null, race_hours: T.race_hours || null, raw_keys: Object.keys(T).slice(0, 40)} : null,
 cost_labour: k.labour ? {hours: k.labour.hours, ordinary: k.labour.ordinary, x15: k.labour.x15, x2: k.labour.x2, race: k.labour.race, keys: Object.keys(k.labour)} : null,
 cost_external: k.external ? Object.assign({}, k.external, {people: undefined}) : null, race_hours: k.race_hours,
 charge_ticks: {ticked_now: c.labour, ticks: c.labour_ticks, by_kind: {install: TK.install.amount, cleaning: TK.cleaning.amount, fire_ext: TK.fire_ext.amount}},
 charge_forecast: {expected_on_site_to_tick: LP.expected, to_come: LP.tocome, demob_cleaning_later: LP.later, keys: Object.keys(LP)},
 event_scope: c.race ? {amount: c.race.amount, hours: c.race.hours, scope: c.race.scope} : null,
 finance745: fin ? {rows: fin.rows.length, expectedCost: fin.expectedCost, unpricedHours: fin.unpricedHours, unpricedCount: fin.unpricedCount, complete: fin.complete} : null};
 });
 /* pictures */
 const card = await p.$('#pane-costs .pl752, #pane-costs .pl-card, #pane-costs [class*="pl7"]');
 const plEl = await p.evaluateHandle(() => { const h = [...document.querySelectorAll('#pane-costs h4')].find(x => /By branch/.test(x.textContent)); return h ? h.closest('.pl-wide') || h.parentElement : document.querySelector('#pane-costs'); });
 try { await plEl.asElement().scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await plEl.asElement().screenshot({path: path.join(out, 'shot760_by_branch' + (MOB ? '_phone' : '') + '.png')}); } catch (e) { R.shotError = String(e.message).slice(0, 120); }
 const top = await p.evaluateHandle(() => { const h = [...document.querySelectorAll('#pane-costs h3, #pane-costs h2')].find(x => /Forecast P&L/.test(x.textContent)); let el = h; for (let i = 0; i < 4 && el && !(el.className && /pl/.test(el.className)); i++) el = el.parentElement; return el || document.querySelector('#pane-costs'); });
 try { await top.asElement().scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await top.asElement().screenshot({path: path.join(out, 'shot760_pl' + (MOB ? '_phone' : '') + '.png')}); } catch (e) { R.shotError2 = String(e.message).slice(0, 120); }
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(Object.assign({}, R, {plText: undefined, lowerTable: R.lowerTable.slice(0, 6)}), null, 1));
})();
