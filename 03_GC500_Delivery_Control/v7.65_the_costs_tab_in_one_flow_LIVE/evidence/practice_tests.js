// v7.65 practice tests - read only against the live record (GETs only through the harness; every write is blocked).
// Proves: the Costs tab runs in one flow (glance, P&L, costs to job end, month-end, the working folded); the glance's
// figures are the cards' figures; the old ledger is off the tab; the folds remember; a filter opens the charge lines;
// the editors' forms and Finance's controls are still reachable; nothing on the record moves; desktop and phone.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB, checks: {}};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof cj765Glance === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p.waitForTimeout(1800);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(4000);
 R.data = await p.evaluate(() => {
 const before = JSON.stringify(moneySummary()); const M = moneySummary(), X = cj764Model(), A = acc761Model(acc761Month()), S = acc763Sums(A);
 const pane = document.getElementById('pane-costs'); const all = [...pane.querySelectorAll('*')];
 const pos = id => { const el = document.getElementById(id); return el ? all.indexOf(el) : -1; };
 const order = ['costs765', 'pl752', 'costs764', 'cj765monthend', 'accruals761', 'finance745', 'cj765detail'].map(id => [id, pos(id)]);
 const inFold = id => { const el = document.getElementById(id); const d = el && el.closest('details.plfold765'); return d ? {key: d.dataset.sfold, open: d.open} : null; };
 const tiles = [...document.querySelectorAll('#costs765 .cj765-tile')].map(t => ({label: t.querySelector('span').textContent, now: t.querySelector('.cj765-now').firstChild.textContent.trim(), nowB: (t.querySelector('.cj765-now b') || {}).textContent, end: t.querySelector('.cj765-end') ? t.querySelector('.cj765-end').firstChild.textContent.trim() : null, endB: (t.querySelector('.cj765-end b') || {}).textContent}));
 const visible = pane.innerText.length;
 const folds = [...pane.querySelectorAll('details.plfold765')]; const closed = folds.filter(d => !d.open).length;
 folds.forEach(d => { d.open = true; }); const opened = pane.innerText.length; folds.forEach(d => { d.open = false; }); SFOLD_OPEN.forEach(k => { if (/^costs765\|/.test(k)) SFOLD_OPEN.delete(k); });
 return {order, tiles, glance: {record: money0(X.revenue.record), job: money0(X.revenue.job), known: money0(X.known), costJob: money0(X.job), diffNow: money0(M.difference0), diffEnd: money0(Math.round((X.revenue.job - X.job - X.wages.job) * 100) / 100), accRev: money0(A.revenueTotal), toAccrue: money0(S.toAccrue), month: A.label},
 ledger: !!document.getElementById('moneyCard'), folds: {n: folds.length, closed, keys: folds.map(d => d.dataset.sfold), cats: inFold('costCats'), transport: inFold('ourTransport'), workforce: inFold('workforce'), branch: inFold('card748'), lines: inFold('costLinesTable765') || (() => { const d = pane.querySelector('details[data-sfold="costs765|lines"]'); return d ? {key: d.dataset.sfold, open: d.open, hasTable: !!d.querySelector('table.costtbl')} : null; })()},
 text: {visible, opened}, controls: {fin745Month: !!document.getElementById('fin745Month'), acc761Month: !!document.getElementById('acc761Month'), ourForm: !!pane.querySelector('#ourTransport form.ourform, #ourTransport'), filters: pane.querySelectorAll('[data-cf]').length, jumps: pane.querySelectorAll('[data-jump765]').length},
 h3s: [...pane.querySelectorAll('h3.sec')].map(h => h.firstChild.textContent.trim()), readOnly: before === JSON.stringify(moneySummary())}; });
 const D = R.data, O = Object.fromEntries(D.order);
 R.checks.glancePresent = O.costs765 >= 0 && D.tiles.length === 4;
 R.checks.oneFlowInOrder = O.costs765 < O.pl752 && O.pl752 < O.costs764 && O.costs764 < O.cj765monthend && O.cj765monthend < O.accruals761 && O.accruals761 < O.finance745 && O.finance745 < O.cj765detail;
 R.checks.glanceRevenueIsTheCards = D.tiles[0].now === D.glance.record && D.tiles[0].end === D.glance.job;
 R.checks.glanceCostsAreTheCards = D.tiles[1].now === D.glance.known && D.tiles[1].end === D.glance.costJob;
 R.checks.glanceDifferenceIsThePLs = D.tiles[2].nowB === D.glance.diffNow && D.tiles[2].endB === D.glance.diffEnd;
 R.checks.glanceMonthEndIsTheAccruals = D.tiles[3].now === D.glance.accRev && (D.tiles[3].end == null || D.tiles[3].end === D.glance.toAccrue);
 R.checks.oldLedgerOffTheTab = !D.ledger;
 R.checks.theWorkingFolded = D.folds.n === 3 && D.folds.closed === 3 && D.folds.cats && D.folds.cats.key === 'costs765|cats' && D.folds.transport && D.folds.workforce && D.folds.branch && D.folds.branch.key === 'costs765|branch' && D.folds.lines && D.folds.lines.hasTable;
 R.checks.visibleTextShorter = D.text.visible < D.text.opened * 0.75;
 R.checks.controlsStillReachable = D.controls.fin745Month && D.controls.acc761Month && D.controls.ourForm && D.controls.filters >= 3 && D.controls.jumps >= 4; /* v7.66 and v7.67 add links of their own */
 R.checks.readOnly = D.readOnly;
 /* a fold opened stays open through a re-render */
 R.fold = await p.evaluate(async () => { const d = document.querySelector('#pane-costs details[data-sfold="costs765|cats"]'); d.querySelector('summary').click(); await new Promise(r => setTimeout(r, 150)); const openedByClick = d.open; renderCosts(); await new Promise(r => setTimeout(r, 300)); const d2 = document.querySelector('#pane-costs details[data-sfold="costs765|cats"]'); const stillOpen = d2.open; d2.querySelector('summary').click(); await new Promise(r => setTimeout(r, 150)); renderCosts(); await new Promise(r => setTimeout(r, 300)); const d3 = document.querySelector('#pane-costs details[data-sfold="costs765|cats"]'); return {openedByClick, stillOpen, closedAgain: !d3.open}; });
 R.checks.foldRemembers = R.fold.openedByClick && R.fold.stillOpen && R.fold.closedAgain;
 /* a filter opens the charge lines, and they stay open when the filter comes off - the reader pressed All inside them */
 R.filter = await p.evaluate(async () => { const b = document.querySelector('#pane-costs [data-cf="problems"]'); b.click(); await new Promise(r => setTimeout(r, 400)); const d = document.querySelector('#pane-costs details[data-sfold="costs765|lines"]'); const r1 = {open: d.open, filter: state.costFilter, rows: d.querySelectorAll('tbody tr').length}; const a = document.querySelector('#pane-costs [data-cf="all"]'); a.click(); await new Promise(r => setTimeout(r, 400)); const d2 = document.querySelector('#pane-costs details[data-sfold="costs765|lines"]'); const r2 = {staysOpenAfter: d2.open, filterAfter: state.costFilter}; d2.querySelector('summary').click(); await new Promise(r => setTimeout(r, 150)); return Object.assign(r1, r2, {closesByHand: !document.querySelector('#pane-costs details[data-sfold="costs765|lines"]').open}); });
 R.checks.filterOpensTheLines = R.filter.open && R.filter.filter === 'problems' && R.filter.staysOpenAfter && R.filter.filterAfter === 'all' && R.filter.closesByHand;
 /* a jump scrolls to its section */
 R.jump = await p.evaluate(async () => { const b = document.querySelector('#pane-costs [data-jump765="costs764"]'); b.click(); await new Promise(r => setTimeout(r, 900)); const r = document.getElementById('costs764').getBoundingClientRect(); return {top: Math.round(r.top), vh: window.innerHeight}; });
 R.checks.jumpReachesTheSection = R.jump.top > -40 && R.jump.top < R.jump.vh;
 /* v7.64 and v7.63 still hold on this build */
 R.prev = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; const M = moneySummary(), c = M.charge, X = cj764Model(); let sum = 0, ua = 0; acc761Months().forEach((m, i) => { const A = acc761Model(m); sum = r2(sum + A.revenueTotal); if (i === 0) ua += (A.unallocatedRevenue || []).reduce((s, r) => s + (acc762RowAmount(r) || 0), 0); }); return {cardKnownIsThePL: Math.abs(X.known - M.cost.known) < 0.02, accrualsReconcile: Math.abs(sum + ua - c.total) < 1}; });
 R.checks.v764_cardStillReconciles = R.prev.cardKnownIsThePL; R.checks.v763_everyMonthStillAddsToRevenue = R.prev.accrualsReconcile;
 /* what the page shows */
 R.text = await p.evaluate(() => document.getElementById('costs765').innerText + '\n' + [...document.querySelectorAll('#pane-costs h3.sec, #pane-costs details.plfold765 > summary')].map(e => e.innerText).join('\n'));
 R.checks.wordsPresent = /At a glance/i.test(R.text) && /Where the job stands on money/i.test(R.text) && /to job end/i.test(R.text) && /Month-end/i.test(R.text) && /The working/i.test(R.text) && /Charge lines on the record/i.test(R.text);
 R.checks.noBrokenValues = !/\b(?:NaN|undefined|Infinity|null)\b/.test(R.text);
 R.checks.noMarginClaimed = !/\bmargin\b(?! and not a profit)/i.test(R.text.replace(/not a margin and not a profit/gi, ''));
 R.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); R.checks.noHorizontalOverflow = R.overflow <= 1;
 try { await p.evaluate(() => { location.hash = '#costs'; document.getElementById('costs765').scrollIntoView({block: 'start'}); }); await p.waitForTimeout(500); const h = await p.evaluate(() => { const a = document.getElementById('costs765').getBoundingClientRect(), b = document.getElementById('pl752').getBoundingClientRect(); return Math.ceil(b.bottom - a.top); }); await p.setViewportSize({width: MOB ? 390 : 1440, height: Math.min(9000, h + 200)}); await p.waitForTimeout(600); await p.evaluate(() => document.getElementById('costs765').scrollIntoView({block: 'start'})); await p.waitForTimeout(500); const el = await p.$('#costs765'); await el.screenshot({path: path.join(out, 'shot765_glance' + (MOB ? '_phone' : '') + '.png')}); await p.screenshot({path: path.join(out, 'shot765_costs_tab' + (MOB ? '_phone' : '') + '.png')}); } catch (e) { R.shotError = String(e.message).slice(0, 160); }
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); R.checks.noErrors = s.errors.length === 0 && (s.console || []).length === 0; R.blocked = s.counts && s.counts.blocked; R.checks.noWriteLeftThePage = !R.blocked;
 R.pass = Object.values(R.checks).every(Boolean); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(Object.assign({}, R, {text: undefined}), null, 1));
 console.log(JSON.stringify({pass: R.pass, checks: R.checks, order: D.order, tiles: D.tiles, glance: D.glance, folds: D.folds, text: D.text, controls: D.controls, h3s: D.h3s, fold: R.fold, filter: R.filter, jump: R.jump, errors: R.errors, console: R.console, overflow: R.overflow, shotError: R.shotError}, null, 1));
})();
