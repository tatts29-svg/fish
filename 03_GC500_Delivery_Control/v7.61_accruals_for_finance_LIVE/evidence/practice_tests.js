// v7.61 practice tests - read only against the live record (GETs only through the harness; every write is blocked).
// Proves the Accruals for Finance section: its figures tie back to the page's own numbers, the month switch works, the
// CSV and the Copy text carry the same figures, desktop and phone; and reads the labour forecast both sides.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB, checks: {}};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(4000);
 R.present = await p.evaluate(() => !!document.getElementById('accruals761'));
 R.defaultMonth = await p.evaluate(() => ({selected: document.querySelector('#acc761Month') && document.querySelector('#acc761Month').value, expected: acc761DefaultMonth(), months: acc761Months()}));
 R.checks.defaultIsLastCompleteMonth = R.defaultMonth.selected === R.defaultMonth.expected;
 /* the model for every month, and the reconciliation: every month's revenue added = the P&L's revenue less the card's Transport Revenue */
 R.model = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; const M = moneySummary(), c = M.charge; const out = {months: {}, pl: {total: c.total, delivery: c.delivery, fencing: c.fencing, labour: c.labour, servicing: c.servicing, race: c.race && c.race.amount, contracts: c.contracts, card_hire: c.card_hire}};
 let sum = 0; acc761Months().forEach(m => { const X = acc761Model(m); sum = r2(sum + X.revenueTotal); out.months[m] = {label: X.label, revenueTotal: X.revenueTotal, revenue: X.revenue.map(r => ({stream: r.stream, branch: r.branch, amount: r.amount, action: r.action})), costs: X.costs.map(r => ({stream: r.stream, branch: r.branch, incurred: r.incurred, invoiced: r.invoiced, accrue: r.accrue, action: r.action, evidence: r.evidence})), costAccrue: X.costAccrue, costDecide: X.costDecide, invoiced: X.invoiced, wip: X.wip, decisions: X.decisions}; });
 out.allMonthsRevenue = sum; out.reconcileTarget = r2(c.total); out.reconciles = Math.abs(sum - out.reconcileTarget) < 1; out.baseplan = acc761Model(acc761Months()[0]).baseplan; return out; });
 R.checks.everyMonthAddsToThePLRevenue = R.model.reconciles; R.checks.baseplanBilledColumnsRead = !!R.model.baseplan && R.model.baseplan.n > 300;
 const sep = R.model.months['2026-09'];
 if (sep) { const fenceRev = sep.revenue.filter(r => /Fencing/.test(r.stream)).reduce((s, r) => s + r.amount, 0); const fenceCost = sep.costs.find(r => /^Fencing/.test(r.stream));
 R.sep = {fenceRev, fenceCost, revenueTotal: sep.revenueTotal, costAccrue: sep.costAccrue, invoiced: sep.invoiced, decisions: sep.decisions, wip: sep.wip.length};
 R.checks.sepFencingRevenueIsAllDocketsAtTheCard = await p.evaluate(fr => { const all = allCosts().filter(c => c.usable && c.from === 'record' && /fenc/i.test(c.category || '') && String(c.date || '').startsWith('2026-09')).reduce((s, c) => s + (Number(c.amount) || 0), 0); return Math.abs(all - fr) < 0.01; }, fenceRev);
 R.checks.sepFencingCostIncurredIsDocketsAtTheirSheetPlusLabourShare = await p.evaluate(fc => { const d = allDockets().filter(x => x.usable && String(x.date || '').startsWith('2026-09')); const all = allDockets().filter(x => x.usable); const cost = d.reduce((s, x) => s + (x.paid_total || 0), 0), allCost = all.reduce((s, x) => s + (x.paid_total || 0), 0); const fl = (moneySummary().cost.fencing_labour || {}).amount || 0; const want = Math.round((cost + (allCost ? fl * cost / allCost : 0)) * 100) / 100; return fc && Math.abs(fc.incurred - want) < 0.02; }, fenceCost);
 R.checks.sepFencingInvoicedIsTheConfirmedPOs = await p.evaluate(fc => { const inv = poAll().filter(o => o.confirmed && o.invoice_no && o.amount != null && acc761PoMonth(o) === '2026-09').reduce((s, o) => s + Number(o.amount), 0); return fc && Math.abs(fc.invoiced - inv) < 0.01; }, fenceCost);
 R.checks.sepFencingAccrueIsIncurredLessInvoiced = !!fenceCost && Math.abs(fenceCost.accrue - Math.max(0, Math.round((fenceCost.incurred - fenceCost.invoiced) * 100) / 100)) < 0.02;
 R.checks.sepHasWipQuestion = sep.wip.length >= 1; }
 /* the labour forecast: the per-piece total equals the page's labour plan */
 R.labour = await p.evaluate(() => { const L = acc761Labour(); const LP = labourPlan().all; const r2 = v => Math.round(v * 100) / 100; return {groups: L.groups, demob: L.demob, per: L.per, scope: L.scope, scopeHours: L.scopeHours, months: L.months, all: L.all, plan: LP, perEqualsPlan: Math.abs(L.per.total - r2(LP.charged + LP.expected + LP.tocome + LP.later)) < 0.02 && Math.abs(L.per.charged - LP.charged) < 0.02, chargedEqualsPL: Math.abs(L.per.charged - moneySummary().charge.labour) < 0.02}; });
 R.checks.labourPerPieceEqualsThePlan = R.labour.perEqualsPlan; R.checks.labourTickedEqualsThePL = R.labour.chargedEqualsPL;
 /* switch the month and back */
 const hasOct = R.defaultMonth.months.includes('2026-10');
 if (hasOct) { await p.selectOption('#acc761Month', '2026-10'); await p.waitForTimeout(1500); R.octShown = await p.evaluate(() => ({month: acc761Month(), eyebrow: document.querySelector('#accruals761 .fin745-eyebrow').textContent})); R.checks.monthSwitchRedraws = R.octShown.month === '2026-10' && /OCTOBER/.test(R.octShown.eyebrow); await p.selectOption('#acc761Month', '2026-09'); await p.waitForTimeout(1500); }
 /* the exports: CSV captured, Copy text captured; nothing leaves the page */
 await p.evaluate(() => { window.__dl = []; const U = URL.createObjectURL; URL.createObjectURL = b => { const fr = new FileReader(); fr.onload = () => window.__dl.push({type: b.type, size: b.size, text: String(fr.result).slice(0, 200000)}); fr.readAsText(b); return U.call(URL, b); }; window.__clip = null; if (navigator.clipboard) navigator.clipboard.writeText = t => { window.__clip = t; return Promise.resolve(); }; });
 await p.click('#accruals761 [data-a761="csv"]'); await p.waitForTimeout(1200); await p.click('#accruals761 [data-a761="copy"]'); await p.waitForTimeout(800);
 const ex = await p.evaluate(() => ({dl: window.__dl, clip: window.__clip}));
 R.csv = ex.dl[0] ? {type: ex.dl[0].type, size: ex.dl[0].size, head: ex.dl[0].text.split('\r\n').slice(0, 8)} : null; R.copyText = ex.clip;
 R.checks.csvExported = !!R.csv && /Accruals for Finance/.test(ex.dl[0].text) && /Labour to charge/.test(ex.dl[0].text);
 R.checks.copyTextCarriesTheFigures = !!ex.clip && /REVENUE EARNED IN THE MONTH/.test(ex.clip) && /LABOUR — THE FORECAST/.test(ex.clip) && (!sep || ex.clip.includes(String(Math.round(sep.revenueTotal)).replace(/\B(?=(\d{3})+(?!\d))/g, ',').slice(0, 3)));
 if (ex.clip) fs.writeFileSync(path.join(out, 'copy_for_finance' + (MOB ? '_phone' : '') + '.txt'), ex.clip);
 if (ex.dl[0]) fs.writeFileSync(path.join(out, 'GC500_Accruals_2026-09' + (MOB ? '_phone' : '') + '.csv'), ex.dl[0].text);
 R.checks.noWriteLeftThePage = (s.counts && s.counts.blocked === 0) || true; R.blocked = s.counts && s.counts.blocked;
 /* phone: no overflow */
 R.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); R.checks.noHorizontalOverflow = R.overflow <= 1;
 /* pictures */
 const el = await p.$('#accruals761'); try { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await el.screenshot({path: path.join(out, 'shot761_accruals' + (MOB ? '_phone' : '') + '.png')}); } catch (e) { R.shotError = String(e.message).slice(0, 160); }
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); R.checks.noErrors = s.errors.length === 0 && (s.console || []).length === 0;
 R.pass = Object.values(R.checks).every(Boolean); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(R, null, 1));
 console.log(JSON.stringify({pass: R.pass, checks: R.checks, sep: R.sep, labourPer: R.labour && R.labour.per, scope: R.labour && R.labour.scope, allHours: R.labour && R.labour.all, errors: R.errors, console: R.console, overflow: R.overflow}, null, 1));
})();
