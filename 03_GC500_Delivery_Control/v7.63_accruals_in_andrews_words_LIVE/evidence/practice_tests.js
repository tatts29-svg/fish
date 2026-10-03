// v7.63 practice tests - read only against the live record (GETs only through the harness; every write is blocked).
// Supersedes v7.61's and v7.62's expectations where they conflict, and says which:
//  - v7.62 "automaticAccrualAbsent" / "unknownInvoicesStayUnknown": a "to accrue" figure IS shown, as a proposal (incurred
//    less the invoices recorded), with the caveat said once; the fencing row's invoices recorded come from the POs'
//    programme weeks, so they are not unknown. Everything else of v7.62's model is kept and checked here.
//  - v7.61 "sepFencingCostIncurredIs...PlusLabourShare": the green book is its own dated row now (Codex), not apportioned.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB, checks: {}};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof acc763Action === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p.waitForTimeout(1800);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(4000);
 R.present = await p.evaluate(() => !!document.getElementById('accruals761'));
 R.checks.defaultIsLastCompleteMonth = await p.evaluate(() => document.querySelector('#acc761Month').value === acc761DefaultMonth());
 R.model = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; const M = moneySummary(), c = M.charge; const before = JSON.stringify(M), journalsBefore = JSON.stringify(S.finance745 || {});
 const out = {months: {}, pl: {total: c.total, labour: c.labour, fencing: c.fencing}}; let sum = 0, ua = 0;
 acc761Months().forEach((m, i) => { const X = acc761Model(m); const Z = acc763Sums(X); sum = r2(sum + X.revenueTotal); if (i === 0) ua += (X.unallocatedRevenue || []).reduce((s, r) => s + (acc762RowAmount(r) || 0), 0); /* the undated rows are the same in every month: count them once */
 out.months[m] = {label: X.label, revenueTotal: X.revenueTotal, revenue: X.revenue.map(r => ({stream: r.stream, branch: r.branch, amount: r.amount, status: r.extra.status, act: acc763Action(Object.assign({kind: 'revenue'}, r), X).key})), costs: X.costs.map(r => ({stream: r.stream, branch: r.branch, candidate: r.candidate, invoiced: r.invoiced, accrue: r.accrue, status: r.extra.status, act: acc763Action(Object.assign({kind: 'cost'}, r), X).key})), toAccrue: Z.toAccrue, decide: Z.decide, planned: Z.planned, invoiced: X.invoiced, invoiceRecords: X.invoiceRecords, unallocatedRevenue: (X.unallocatedRevenue || []).map(r => ({stream: r.stream, amount: acc762RowAmount(r), basis: r.basis})), unallocatedCosts: (X.unallocatedCosts || []).map(r => ({stream: r.stream, amount: acc762RowAmount(r), basis: r.basis || r.evidence})), wip: X.wip.map(w => w.what), decisions: Z.decisions}; });
 out.allMonthsRevenue = sum; out.unallocatedRevenue = r2(ua); out.reconciles = Math.abs(sum + ua - c.total) < 1; out.ticksAllDated = ua < 0.01 || !acc761Months().some(m => (acc761Model(m).unallocatedRevenue || []).some(r => /per-piece/.test(r.stream)));
 out.readOnly = before === JSON.stringify(moneySummary()) && journalsBefore === JSON.stringify(S.finance745 || {}); out.baseplan = acc761Model(acc761Months()[0]).baseplan; return out; });
 R.checks.everyMonthPlusUnallocatedAddsToThePLRevenue = R.model.reconciles; R.checks.readOnlyKeepsTotalsAndJournals = R.model.readOnly; R.checks.baseplanBilledColumnsRead = !!R.model.baseplan && R.model.baseplan.n > 300;
 const sep = R.model.months['2026-09'];
 if (sep) { const fence = sep.costs.find(r => /^Fencing — supplier docket/.test(r.stream)); R.sep = {revenueTotal: sep.revenueTotal, toAccrue: sep.toAccrue, decide: sep.decide, invoiced: sep.invoiced, fence, labourRows: sep.revenue.filter(r => /per-piece/.test(r.stream)).map(r => [r.branch, r.amount]), unallocated: sep.unallocatedRevenue.concat(sep.unallocatedCosts), wip: sep.wip, decisions: sep.decisions};
 /* the two v7.62 regressions */
 R.checks.sepInvoicesRecordedAreTheConfirmedPOsByProgrammeWeek = await p.evaluate(() => { const inv = poAll().filter(o => o.confirmed && o.invoice_no && o.amount != null && acc763PoDate(o) && acc763PoDate(o).startsWith('2026-09')).reduce((s, o) => s + Number(o.amount), 0); const X = acc761Model('2026-09'); return inv > 0 && Math.abs(X.invoiced - inv) < 0.01; });
 R.checks.sepFencingAccrueIsIncurredLessInvoiced = !!fence && fence.invoiced > 0 && Math.abs(fence.accrue - Math.max(0, Math.round((fence.candidate - fence.invoiced) * 100) / 100)) < 0.02;
 R.checks.sepLabourTicksDatedByTheDayIn = await p.evaluate(() => { const X = acc761Model('2026-09'); const t = X.revenue.filter(r => /per-piece/.test(r.stream)).reduce((s, r) => s + r.amount, 0); const want = allAssets().filter(a => !a._cancelled && !a.rest_of && String(a.first_date || '').startsWith('2026-09')).reduce((s, a) => s + (assetTotal(a).labour || 0), 0); return want > 0 && Math.abs(t - want) < 0.05 && !X.unallocatedRevenue.some(r => /per-piece/.test(r.stream) && /no confirmed work date/.test(r.basis)); });
 R.checks.sepFencingRevenueIsAllDocketsAtTheCard = await p.evaluate(() => { const X = acc761Model('2026-09'); const fr = X.revenue.filter(r => /^Fencing Revenue/.test(r.stream)).reduce((s, r) => s + r.amount, 0); const all = allCosts().filter(c => c.usable && c.from === 'record' && /fenc/i.test(c.category || '') && String(c.date || '').startsWith('2026-09')).reduce((s, c) => s + (Number(c.amount) || 0), 0); return Math.abs(all - fr) < 0.01; });
 R.checks.sepNoRowIsPlanned = !sep.costs.some(r => r.act === 'planned') && !sep.revenue.some(r => r.act === 'planned');
 R.checks.sepHasWipQuestionAskedAsAQuestion = sep.wip.length === 1 && await p.evaluate(() => /Finance’s call/.test(acc761Model('2026-09').wip[0].words)); }
 const oct = R.model.months['2026-10'];
 if (oct) { R.checks.octFutureRowsArePlanned = oct.costs.filter(r => r.status === 'forecast').every(r => r.act === 'planned') && oct.revenue.filter(r => r.status === 'forecast').every(r => r.act === 'planned'); R.checks.octIncludesTheToiletsAtOurRates = oct.revenue.some(r => /Toilet Rehire/.test(r.stream) && r.amount > 60000); }
 /* the labour forecast (Codex's v7.62 model, checked as it was) */
 R.labour = await p.evaluate(() => { const L = acc761Labour(), LP = labourPlan().all, M = moneySummary(); const r2 = v => Math.round(v * 100) / 100; return {per: L.per, install: L.groups.install, scope: L.scope, scopePeople: L.scopePeople, scopeSupport: L.scopeSupport, labourOnly: L.labourOnlyTotal, packageTotal: L.packageTotal, all: {hours: L.all.hours, cost: L.all.cost, unpriced: L.all.unpriced, confirmed: L.all.confirmedPaidHours, pending: L.all.pendingPaidHours, forecast: L.all.forecastPaidHours}, months: Object.fromEntries(Object.entries(L.months).map(([k, v]) => [k, {hours: v.hours, cost: v.cost, unpriced: v.unpriced}])), people: L.people.length,
 perEqualsPlan: Math.abs(L.per.total - r2(LP.charged + LP.expected + LP.tocome + LP.later)) < 0.02, chargedEqualsPL: Math.abs(L.per.charged - M.charge.labour) < 0.02, packageReconciles: Math.abs(L.packageTotal - (L.per.total + (L.scope || 0))) < 0.02, labourOnlyExcludesSupport: Math.abs(L.labourOnlyTotal - (L.groups.install.total + (L.scopePeople || 0))) < 0.02, hoursClassified: Math.abs(L.all.hours - (L.all.confirmedPaidHours + L.all.pendingPaidHours + L.all.forecastPaidHours)) < 0.02, hoursEqualRows: Math.abs(L.all.hours - fin745Rows(todayIso()).reduce((s, r) => s + (r.paid || 0), 0)) < 0.02}; });
 ['perEqualsPlan', 'chargedEqualsPL', 'packageReconciles', 'labourOnlyExcludesSupport', 'hoursClassified', 'hoursEqualRows'].forEach(k => { R.checks['labour_' + k] = R.labour[k]; });
 /* what the page shows: Andrew's words, caveat once, the people table */
 R.text = await p.evaluate(() => document.getElementById('accruals761').innerText);
 R.checks.andrewsWordsNotAuditSpeak = /Accruals for Finance/i.test(R.text) && /What Finance does/i.test(R.text) && !/Sources, forecasts and allocation checks/.test(R.text) && !/evidence-qualified/i.test(R.text);
 R.checks.caveatSaidOnceNotPerRow = (R.text.match(/no automatic accrual/gi) || []).length >= 1 && (R.text.match(/Finance to verify work period/g) || []).length === 0;
 R.checks.badgesPresent = /Accrue/i.test(R.text) && /Check the invoice/i.test(R.text) && /Finance’s call/i.test(R.text) && /Payroll/i.test(R.text);
 R.checks.peopleDaysHoursTable = /People, days and hours/i.test(R.text) && /Awaiting confirmation/i.test(R.text) && /Before breaks/i.test(R.text);
 R.checks.noBrokenValues = !/\b(?:NaN|undefined|Infinity)\b/.test(R.text);
 R.checks.unallocatedExplained = !(R.sep && R.sep.unallocated.length) || /no day to put it in/.test(R.text);
 /* month switch to a future month and back */
 /* the current month (October on 1 Oct) splits a row into to date and still planned; a month still to come (November) is all planned */
 await p.selectOption('#acc761Month', '2026-10'); await p.waitForTimeout(1500);
 R.octText = await p.evaluate(() => document.getElementById('accruals761').innerText);
 R.checks.currentMonthSplitsToDateFromPlanned = /still planned/.test(R.octText) && /Planned/i.test(R.octText);
 const months = await p.evaluate(() => acc761Months()); const future = months.find(m => m > new Date().toISOString().slice(0, 7));
 if (future) { await p.selectOption('#acc761Month', future); await p.waitForTimeout(1500); R.futText = await p.evaluate(() => document.getElementById('accruals761').innerText);
 R.checks.futureMonthSaysPlannedNotIncurred = /Planned/i.test(R.futText) && /What is due in/i.test(R.futText) && !/Costs incurred in/.test(R.futText) && /Costs planned for/.test(R.futText); }
 await p.selectOption('#acc761Month', '2026-09'); await p.waitForTimeout(1500);
 R.checks.monthSwitchBack = await p.evaluate(() => acc761Month() === '2026-09');
 /* exports captured; nothing leaves the page */
 await p.evaluate(() => { window.__dl = []; const U = URL.createObjectURL; URL.createObjectURL = b => { const fr = new FileReader(); fr.onload = () => window.__dl.push({type: b.type, size: b.size, text: String(fr.result).slice(0, 300000)}); fr.readAsText(b); return U.call(URL, b); }; window.__clip = null; Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText(t){ window.__clip = t; return Promise.resolve(); }}}); });
 await p.click('#accruals761 [data-a761="csv"]'); await p.waitForTimeout(1200); await p.click('#accruals761 [data-a761="copy"]'); await p.waitForTimeout(800);
 const ex = await p.evaluate(() => ({dl: window.__dl, clip: window.__clip}));
 R.checks.csvExported = !!ex.dl[0] && /Accruals for Finance/.test(ex.dl[0].text) && /Labour to charge/.test(ex.dl[0].text) && /Person/.test(ex.dl[0].text) && /no automatic accrual/i.test(ex.dl[0].text);
 R.checks.copyTextCarriesTheFigures = !!ex.clip && /REVENUE EARNED IN THE MONTH/.test(ex.clip) && /LABOUR — THE FORECAST/.test(ex.clip) && /PEOPLE, DAYS AND HOURS/.test(ex.clip) && /Accrual to post: not confirmed/.test(ex.clip) && (!R.sep || ex.clip.includes(money0ForTest(R.sep.revenueTotal)));
 function money0ForTest(v){ return '$' + Math.round(v).toLocaleString('en-AU'); }
 R.checks.exportsHaveNoBrokenValues = !/\b(?:NaN|undefined|Infinity)\b/.test((ex.dl[0] ? ex.dl[0].text : '') + '\n' + (ex.clip || ''));
 if (ex.clip) fs.writeFileSync(path.join(out, 'copy_for_finance' + (MOB ? '_phone' : '') + '.txt'), ex.clip);
 if (ex.dl[0]) fs.writeFileSync(path.join(out, 'GC500_Finance_review_2026-09' + (MOB ? '_phone' : '') + '.csv'), ex.dl[0].text);
 R.blocked = s.counts && s.counts.blocked; R.checks.noWriteLeftThePage = !R.blocked;
 R.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); R.checks.noHorizontalOverflow = R.overflow <= 1;
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); R.checks.noErrors = s.errors.length === 0 && (s.console || []).length === 0;
 R.pass = Object.values(R.checks).every(Boolean); await s.browser.close();
 const slim = Object.assign({}, R, {text: undefined, octText: undefined, futText: undefined}); fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(slim, null, 1));
 console.log(JSON.stringify({pass: R.pass, checks: R.checks, sep: R.sep, labour: {per: R.labour.per.total, install: R.labour.install.total, labourOnly: R.labour.labourOnly, packageTotal: R.labour.packageTotal, all: R.labour.all}, errors: R.errors, console: R.console, overflow: R.overflow}, null, 1));
})();
