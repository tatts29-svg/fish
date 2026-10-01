// v7.64 practice tests - read only against the live record (GETs only through the harness; every write is blocked).
// Proves: every load is counted by its docket (C1); the undated docket has a day on both sides (C4); the relocation note
// (C2); the Costs to job end card reconciles to the P&L's known direct costs to the cent and its job figure is known +
// to come; the fencing programme's remaining weeks are carried through on both sides; revenue to job end = the record +
// the fencing to come; nothing on the record moves; desktop and phone.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB, checks: {}};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof cj764Model === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p.waitForTimeout(1800);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(4000);
 R.present = await p.evaluate(() => !!document.getElementById('costs764'));
 R.data = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; const before = JSON.stringify(moneySummary()); const M = moneySummary(), k = M.cost, c = M.charge; const X = cj764Model();
 /* C1: every schedule row with a figure */
 let every = 0, everySum = 0, refs = new Set(); allAssets().filter(a => !a._cancelled && !a.rest_of).forEach(a => (a.events || []).forEach(e => { const tc = e.transport_cost; if (tc && tc.amount != null) { every++; everySum += tc.amount; refs.add(a.key); } }));
 [(((DATA.plant_lines || {}).fencing_rows_not_plant) || []), (DATA.unreferenced || [])].forEach(rs => rs.forEach(r => { const tc = r.transport_cost; if (tc && tc.amount != null) { every++; everySum += tc.amount; } }));
 const ours = new Set(ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null && x.ref).map(x => x.ref));
 const ST = k.transport.schedule;
 /* C4 */
 const A9 = acc761Model('2026-09'); const undatedDockets = (A9.unallocatedCosts || []).filter(r => /Docket work date missing/.test(r.basis || r.evidence || ''));
 const dockW6 = allDockets().find(d => !d.date && d.week); const costRowSep = A9.costs.find(r => /^Fencing — supplier docket/.test(r.stream));
 /* the card */
 const sumKnown = r2(X.rows.filter(r => r.inPl).reduce((s, r) => s + (r.toDate || 0), 0)), sumToCome = r2(X.rows.filter(r => r.inPl).reduce((s, r) => s + (r.toCome || 0), 0));
 const fenceWeeksSum = r2(X.fencing.weeks.reduce((s, w) => s + w.cost, 0)), fenceWeeksRev = r2(X.fencing.weeks.reduce((s, w) => s + w.revenue, 0));
 return {transport: {counted: ST.counted, countedRefs: ST.counted_refs, every, everySum: r2(everySum), refs: refs.size, oursRefs: ours.size, kAmount: k.transport.amount, wc05: allAssets().find(a => a.key === 'WC05') ? (allAssets().find(a => a.key === 'WC05').events || []).filter(e => e.transport_cost && e.transport_cost.amount != null).length : null},
 c4: {undatedInAccruals: undatedDockets.length, workbookUndated: dockW6 ? {id: dockW6.id, week: dockW6.week, paid: dockW6.paid_total} : null, sepFenceCostSources: costRowSep ? costRowSep.extra.sourceCount : null, sepFenceCostCandidate: costRowSep ? costRowSep.candidate : null},
 card: {known: X.known, plKnown: X.plKnown, sumKnown, toCome: X.toCome, sumToCome, job: X.job, wages: X.wages, revenue: X.revenue, plTotal: c.total, fencing: {cost: X.fencing.cost, revenue: X.fencing.revenue, weeksSum: fenceWeeksSum, weeksRev: fenceWeeksRev, weeks: X.fencing.weeks.map(w => ({w: w.prog || w.week, state: w.state, cost: w.cost, rev: w.revenue, n: w.lines.length})), hourly: X.fencing.hourly, noCostRate: X.fencing.noCostRate, noCardRate: X.fencing.noCardRate, notRolled: X.fencing.notRolled}, rows: X.rows.map(r => ({stream: r.stream, toDate: r.toDate, toCome: r.toCome, job: r.job, inPl: r.inPl})), gaps: X.gaps.length},
 known: k.known, categories: (M.categories || []).map(x => [x.key, x.amount]), fencingPart: ((M.categories || []).find(x => x.key === 'fencing') || {}).parts, readOnly: before === JSON.stringify(moneySummary())}; });
 const D = R.data;
 R.checks.c1_everyLoadWithAFigureCounted = D.transport.countedRefs === D.transport.every - (D.transport.oursRefs ? 0 : 0) && Math.abs(D.transport.counted - D.transport.everySum) < 0.01;
 R.checks.c1_wc05HasTwoTrucks = D.transport.wc05 === 2;
 R.checks.c1_transportCostIsEveryLoad = Math.abs(D.transport.kAmount - D.transport.everySum) < 0.01;
 R.checks.c4_noUndatedDocketInAccruals = D.c4.undatedInAccruals === 0 && !!D.c4.workbookUndated;
 R.checks.c2_relocationNoteOnThePL = (D.fencingPart || []).some(x => /relocation metres on \d+ dockets? are costed by the hour/.test(x));
 R.checks.card_knownEqualsThePL = Math.abs(D.card.known - D.known) < 0.02 && Math.abs(D.card.sumKnown - D.known) < 0.02;
 R.checks.card_jobIsKnownPlusToCome = Math.abs(D.card.job - (D.card.known + D.card.toCome)) < 0.02 && Math.abs(D.card.toCome - D.card.sumToCome) < 0.02;
 R.checks.card_fencingToComeIsTheWeeks = Math.abs(D.card.fencing.cost - D.card.fencing.weeksSum) < 0.02 && Math.abs(D.card.fencing.revenue - D.card.fencing.weeksRev) < 0.02 && D.card.fencing.weeks.length >= 2 && D.card.fencing.cost > 0 && D.card.fencing.revenue > D.card.fencing.cost;
 R.checks.card_fencingNamesWhatIsNotRated = Object.keys(D.card.fencing.hourly).length > 0 && Object.keys(D.card.fencing.noCostRate).length > 0 && D.card.fencing.notRolled.length > 0;
 R.checks.card_revenueToJobEnd = Math.abs(D.card.revenue.job - (D.card.plTotal + D.card.fencing.revenue)) < 0.02 && Math.abs(D.card.revenue.record - D.card.plTotal) < 0.02;
 R.checks.card_wagesOnTheirOwnLine = D.card.rows.some(r => !r.inPl && /wages/.test(r.stream)) && D.card.wages.unpricedHours > 0;
 R.checks.card_gapsListed = D.card.gaps >= 5;
 R.checks.readOnly = D.readOnly;
 /* v7.63 and v7.60 still hold on this build */
 R.prev = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; const c = moneySummary().charge; let sum = 0, ua = 0; acc761Months().forEach((m, i) => { const X = acc761Model(m); sum = r2(sum + X.revenueTotal); if (i === 0) ua += (X.unallocatedRevenue || []).reduce((s, r) => s + (acc762RowAmount(r) || 0), 0); }); const TK = pl760Ticks(); const B = pl752Rows(); const branches = r2(B.reduce((s, b) => s + b.total, 0) + (Number(c.servicing) || 0) + Object.values(pl760FencingByBranch()).reduce((s, v) => s + v, 0) + TK.total); return {accrualsReconcile: Math.abs(sum + ua - c.total) < 1, plReconciles: Math.abs(branches + (c.race && c.race.amount || 0) - c.total) < 2, ticks: Math.abs(TK.total - c.labour) < 0.02}; });
 R.checks.v763_everyMonthStillAddsToRevenue = R.prev.accrualsReconcile; R.checks.v760_branchesStillReconcile = R.prev.plReconciles && R.prev.ticks;
 /* what the page shows */
 R.text = await p.evaluate(() => document.getElementById('costs764').innerText);
 R.checks.wordsPresent = /Costs to job end/i.test(R.text) && /Still to come/i.test(R.text) && /Not priced yet/i.test(R.text) && /fencing programme/i.test(R.text);
 R.checks.noBrokenValues = !/\b(?:NaN|undefined|Infinity)\b/.test(R.text);
 R.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); R.checks.noHorizontalOverflow = R.overflow <= 1;
 const el = await p.$('#costs764'); try { const h = await p.evaluate(() => { const e = document.getElementById('costs764'); e.scrollIntoView(); return Math.ceil(e.getBoundingClientRect().height); }); await p.setViewportSize({width: MOB ? 390 : 1440, height: Math.min(9000, h + 300)}); await p.waitForTimeout(600); await p.evaluate(() => document.getElementById('costs764').scrollIntoView({block: 'start'})); await p.waitForTimeout(500); await el.screenshot({path: path.join(out, 'shot764_job_end' + (MOB ? '_phone' : '') + '.png')}); } catch (e) { R.shotError = String(e.message).slice(0, 160); }
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); R.checks.noErrors = s.errors.length === 0 && (s.console || []).length === 0; R.blocked = s.counts && s.counts.blocked; R.checks.noWriteLeftThePage = !R.blocked;
 R.pass = Object.values(R.checks).every(Boolean); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(Object.assign({}, R, {text: undefined}), null, 1));
 console.log(JSON.stringify({pass: R.pass, checks: R.checks, transport: D.transport, c4: D.c4, card: {known: D.card.known, plKnown: D.card.plKnown, toCome: D.card.toCome, job: D.card.job, wages: D.card.wages, revenue: D.card.revenue, fencing: D.card.fencing, rows: D.card.rows}, errors: R.errors, console: R.console, overflow: R.overflow}, null, 1));
})();
