// v7.66 practice tests - read only against the live record (GETs only through the harness; every write is blocked).
// Proves: the Rehire by branch card sits under Costs to job end; every figure on it is the P&L's or the Costs to job end
// card's to the cent (toilets = the KINP rehire cell + the servicing line; Rehire cost = the approved quotes; fencing on
// the record = the P&L's fencing revenue and its fencing category; fencing to come = the programme; the SUB lines and the
// NVAC forklifts counted); the totals add; the words are Andrew's; nothing on the record moves; desktop and phone.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB, checks: {}};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof rh766Model === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p.waitForTimeout(1800);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(4000);
 R.data = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; const before = JSON.stringify(moneySummary());
 const M = moneySummary(), c = M.charge, k = M.cost, X = cj764Model(), Rh = rh766Model(), B = pl752Rows(), RH = pl754Rehire(M);
 const pane = document.getElementById('pane-costs'); const all = [...pane.querySelectorAll('*')]; const pos = id => { const el = document.getElementById(id); return el ? all.indexOf(el) : -1; };
 const g = what => Rh.groups.find(x => new RegExp(what).test(x.what));
 const kinp = B.find(b => b.code === 'KINP') || {}; const toiletLines = ONHIRE_ROWS.filter(r => r.family === 'toilet' && !r.subhired && !r.charge_line).length;
 const forks = ONHIRE_ROWS.filter(r => r.branch_code === 'NVAC' && /forklift/.test(r.family || '') && !r.subhired && !r.charge_line); const forkSum = r2(forks.reduce((s, r) => { const a = contractCharge(r).amount; return s + (typeof a === 'number' ? a : 0); }, 0));
 const subs = ONHIRE_ROWS.filter(r => r.subhired && !r.charge_line);
 const fenceCat = (M.categories || []).find(x => x.key === 'fencing') || {};
 const T = Rh.totals; const sumRev = r2(Rh.groups.reduce((s, x) => s + (x.rev || 0), 0)), sumCost = r2(Rh.groups.reduce((s, x) => s + (x.cost || 0), 0)), sumRevTC = r2(Rh.groups.reduce((s, x) => s + (x.revToCome || 0), 0)), sumCostTC = r2(Rh.groups.reduce((s, x) => s + (x.costToCome || 0), 0));
 return {order: {costs764: pos('costs764'), rehire766: pos('rehire766'), monthend: pos('cj765monthend')}, groups: Rh.groups.map(x => ({branch: x.branch, what: x.what, lines: x.lines, units: x.units, rev: x.rev, revToCome: x.revToCome, revJob: x.revJob, cost: x.cost, costToCome: x.costToCome, costJob: x.costJob, missing: x.missing.length})),
 toilets: {rev: g('Toilets') && g('Toilets').rev, expect: r2((kinp.rehireCharge || 0) + (c.servicing || 0)), lines: g('Toilets') && g('Toilets').lines, toiletLines, cost: g('Toilets') && g('Toilets').cost, kRehire: k.rehire},
 forks: {n: g('Forklifts') && g('Forklifts').lines, expectN: forks.length, rev: g('Forklifts') && g('Forklifts').rev, expectRev: forkSum, cost: g('Forklifts') && g('Forklifts').cost},
 subs: {n: Rh.groups.filter(x => /^Sub-hired — /.test(x.what) && !/forklift$/i.test(x.what)).length, expectN: subs.length, kLines: k.subhire_lines},
 fence: {rev: g('Fencing') && g('Fencing').rev, expectRev: r2(c.fencing || 0), revToCome: g('Fencing') && g('Fencing').revToCome, expectRevTC: X.fencing.revenue, cost: g('Fencing') && g('Fencing').cost, expectCost: r2(fenceCat.amount || 0), costToCome: g('Fencing') && g('Fencing').costToCome, expectCostTC: X.fencing.cost},
 totals: {T, sumRev, sumCost, sumRevTC, sumCostTC, revenueJob: Rh.revenueJob, xJob: X.revenue.job, revenueNow: Rh.revenueNow, cTotal: c.total}, others: Rh.others.length, byBranch: Rh.byBranch, glanceLink: !!document.querySelector('#costs765 [data-jump765="rehire766"]'), readOnly: before === JSON.stringify(moneySummary())}; });
 const D = R.data, near = (a, b) => a != null && b != null && Math.abs(a - b) < 0.02;
 R.checks.cardUnderCostsToJobEnd = D.order.costs764 >= 0 && D.order.costs764 < D.order.rehire766 && D.order.rehire766 < D.order.monthend;
 R.checks.toiletsAreTheKinpCellPlusServicing = near(D.toilets.rev, D.toilets.expect) && D.toilets.lines === D.toilets.toiletLines && near(D.toilets.cost, D.toilets.kRehire);
 R.checks.forkliftsAreEveryNvacForkliftLine = D.forks.n === D.forks.expectN && D.forks.n >= 2 && near(D.forks.rev, D.forks.expectRev) && D.forks.cost == null;
 R.checks.subLinesEachCounted = D.subs.n === D.subs.expectN && D.subs.n === D.subs.kLines;
 R.checks.fencingIsThePLsAndTheProgramme = near(D.fence.rev, D.fence.expectRev) && near(D.fence.revToCome, D.fence.expectRevTC) && near(D.fence.cost, D.fence.expectCost) && near(D.fence.costToCome, D.fence.expectCostTC);
 R.checks.totalsAdd = near(D.totals.T.rev, D.totals.sumRev) && near(D.totals.T.cost, D.totals.sumCost) && near(D.totals.T.revJob, D.totals.sumRev + D.totals.sumRevTC) && near(D.totals.T.costJob, D.totals.sumCost + D.totals.sumCostTC) && near(D.totals.revenueJob, D.totals.xJob) && near(D.totals.revenueNow, D.totals.cTotal) && D.totals.T.share > 0.3 && D.totals.T.share < 1;
 R.checks.fourBranches = D.byBranch.length >= 4 && ['KINP', 'NVAC', 'MEAD', 'STPS'].every(b => D.byBranch.some(x => x.branch === b));
 R.checks.othersListed = D.others >= 3;
 R.checks.glanceLinksToIt = D.glanceLink;
 R.checks.readOnly = D.readOnly;
 R.text = await p.evaluate(() => document.getElementById('rehire766').innerText);
 R.checks.andrewsWords = /Rehire Revenue/.test(R.text) && /Rehire cost/i.test(R.text) && /Sub-hired/i.test(R.text) && /Event Portables/.test(R.text) && /Advanced Temporary Fencing/.test(R.text) && /our rates/i.test(R.text);
 R.checks.neverPartners = !/sub-hire partner|our partners|cross-hire|COGS|margin\b(?! and)/i.test(R.text.replace(/not a margin/gi, ''));
 R.checks.noBrokenValues = !/\b(?:NaN|undefined|Infinity|null)\b/.test(R.text);
 R.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); R.checks.noHorizontalOverflow = R.overflow <= 1;
 try { const h = await p.evaluate(() => { const e = document.getElementById('rehire766'); e.scrollIntoView(); return Math.ceil(e.getBoundingClientRect().height); }); await p.setViewportSize({width: MOB ? 390 : 1440, height: Math.min(9000, h + 300)}); await p.waitForTimeout(600); await p.evaluate(() => document.getElementById('rehire766').scrollIntoView({block: 'start'})); await p.waitForTimeout(500); const el = await p.$('#rehire766'); await el.screenshot({path: path.join(out, 'shot766_rehire' + (MOB ? '_phone' : '') + '.png')}); } catch (e) { R.shotError = String(e.message).slice(0, 160); }
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); R.checks.noErrors = s.errors.length === 0 && (s.console || []).length === 0; R.blocked = s.counts && s.counts.blocked; R.checks.noWriteLeftThePage = !R.blocked;
 R.pass = Object.values(R.checks).every(Boolean); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(Object.assign({}, R, {text: undefined}), null, 1));
 console.log(JSON.stringify({pass: R.pass, checks: R.checks, groups: D.groups, toilets: D.toilets, forks: D.forks, subs: D.subs, fence: D.fence, totals: D.totals, byBranch: D.byBranch, others: D.others, errors: R.errors, console: R.console, overflow: R.overflow, shotError: R.shotError}, null, 1));
})();
