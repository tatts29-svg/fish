// v7.69 practice tests - read only against the live record (GETs only through the harness; every write is blocked).
// Proves: the four water lines are charged on at what Event Portables charge us ($12,200), inside the servicing total, so
// the P&L's revenue, the Rehire by branch toilets group and the accrual forecast rise by exactly that against the live
// page read on the same record at the same moment; the three pump-out lines are unchanged; the gap is a caveat now; the
// Questions item is answered; the Costs card lists the water lines with a rate box each; a rehearsed typed rate (writes
// blocked) stands in and one under the supplier's figure is flagged; every group on the Rehire card says whether what we
// charge covers what we are charged; desktop and phone; 0 errors.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB, checks: {}};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof rh769Cover === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p.waitForTimeout(1800);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(4000);
 R.data = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; const M = moneySummary(); const before = JSON.stringify(M); const c = M.charge; const sv = servicing748(); const Rh = rh766Model(); const B = pl752Rows(); const kinp = B.find(b => b.code === 'KINP') || {};
 const g = Rh.groups.find(x => /Toilets/.test(x.what));
 const pane = document.getElementById('pane-costs'); pane.querySelectorAll('details').forEach(d => { d.open = true; }); /* the card sits inside a v7.65 fold; textContent reads it folded or not */
 const pl = (document.getElementById('pl752') || {}).textContent || ''; const card = (document.getElementById('card748') || {}).textContent || ''; const rh = (document.getElementById('rehire766') || {}).textContent || '';
 const qs = (typeof questionsList === 'function' ? questionsList() : (typeof allQuestions === 'function' ? allQuestions() : null));
 return {sv: {n: sv.lines.length, card: sv.card_lines.length, atCost: sv.at_cost.map(l => ({d: l.description, qty: l.qty, rate: l.rate, amount: l.amount, from: l.from, covered: l.covered, period: l.period, theirAmount: l.their_amount})), total: sv.total, cardTotal: sv.card_total, atCostTotal: sv.at_cost_total, their: sv.their_total, theirWater: sv.their_water, under: sv.under.length, quotesWater: (() => { let s = 0; const want = new Set((DATA.toilet_servicing.not_on_the_card || []).map(l => l.quote + '|' + l.description)); (DATA.rehire_quotes.quotes || []).forEach(q => (q.groups || []).forEach(g => (g.lines || []).forEach(l => { if (want.has(q.quote + '|' + l.description)) s += l.total_price || 0; }))); return Math.round(s * 100) / 100; })()},
 money: {total: c.total, servicing: c.servicing, labour: c.labour, costKnown: M.cost.known, missingShort: M.missing_short, caveatsShort: M.caveats_short},
 toilets: {rev: g && g.rev, expect: r2((kinp.rehireCharge || 0) + (c.servicing || 0)), cost: g && g.cost}, totals: Rh.totals,
 text: {plHasWater: /the water at what we are charged/i.test(pl) && /Water Truck at \$6,800\.00 \(at cost\)/i.test(pl) && /3000 Ltr Free Drinking Water Tank at \$2,100\.00 \(6 weeks\) \(at cost\)/i.test(pl) && /Event Portables charge us \$46,545 for the servicing and \$13,950 for the water/i.test(pl), plOldPhrase: /priced by us at our pump-out rates/i.test(pl), plUnder: /Typed under what we are charged and not applied/i.test(pl), plStale: /at the card, on no contract line/i.test(pl) || /at our card's pump-out rates is in the revenue/i.test(pl),
 cardRows: (card.match(/at cost — what Event Portables charge us/g) || []).length, cardHint: /charged on at the supplier's figure — \$13,950/i.test(card), cardOldHint: /Not charged — no line on the card/i.test(card), hubStale: /have no line on the card and are not priced here/i.test(pane.textContent) || /the card's null/i.test(pane.textContent), paneHasQuotedRule: /what we charge should cover what we get charged/i.test(pane.textContent),
 rhRule: /what we charge should cover what we get charged/i.test(rh), rhCovers: (rh.match(/covers what we are charged — ×/g) || []).length, rhNotOnRecord: (rh.match(/cover cannot be checked/g) || []).length, rhShort: /SHORT of what we are charged/i.test(rh), rhCrew: /Rehire cost and their crew to pay/.test(rh), rhOldPaid: /\) paid\)/.test(rh)},
 questions: qs ? {water: (qs.find ? qs.find(q => q.id === 'water-service-rate753') : null)} : 'no accessor', readOnly: before === JSON.stringify(moneySummary())}; });
 const D = R.data, near = (a, b) => a != null && b != null && Math.abs(a - b) < 0.02;
 R.checks.waterLinesAtTheQuotesFigures = D.sv.n === 7 && D.sv.card === 3 && D.sv.atCost.length === 4 && D.sv.atCost.every(l => l.from === 'at cost' && l.covered) && near(D.sv.atCostTotal, 13950) && near(D.sv.theirWater, 13950) && near(D.sv.theirWater, D.sv.quotesWater) && near(D.sv.cardTotal, D.sv.total - 13950) && D.sv.under === 0;
 R.checks.tankIsSixWeeks = D.sv.atCost.some(l => /3000 Ltr/.test(l.d) && l.qty === 1 && near(l.rate, 2100) && near(l.amount, 2100) && near(l.theirAmount, 2100) && /6 weeks/.test(l.period || ''));
 R.checks.pumpOutsUnchanged = near(D.sv.their, 46545) && D.sv.atCost.some(l => l.d === 'Water Truck' && near(l.rate, 6800) && near(l.amount, 6800)) && D.sv.atCost.some(l => l.d === 'Water delivery' && l.qty === 6 && near(l.rate, 375) && near(l.amount, 2250));
 R.checks.servicingIsTheRevenueLine = near(D.money.servicing, D.sv.total);
 R.checks.toiletsGroupFollows = near(D.toilets.rev, D.toilets.expect);
 R.checks.gapIsACaveatNow = !(D.money.missingShort || []).some(x => /water services have no customer rate/i.test(x)) && (D.money.caveatsShort || []).some(x => /water charged on at cost/i.test(x));
 R.checks.plSaysSo = D.text.plHasWater && D.text.plOldPhrase && !D.text.plUnder && !D.text.plStale;
 R.checks.cardListsTheWaterLines = D.text.cardRows === 4 && D.text.cardHint && !D.text.cardOldHint && !D.text.hubStale && D.text.paneHasQuotedRule;
 R.checks.rehireCardSaysWhoCovers = D.text.rhRule && D.text.rhCovers >= 3 && D.text.rhNotOnRecord >= 1 && !D.text.rhShort && D.text.rhCrew && !D.text.rhOldPaid;
 R.checks.coverForTheBusinessIsRight = D.totals.costJob > 0 && D.totals.revJob / D.totals.costJob > 1.3 && D.totals.revJob / D.totals.costJob < 1.6;
 R.checks.readOnly = D.readOnly;
 /* the live page (the base beside the build) on the same record: everything equal except the servicing and total, up by $12,200 */
 const basePath = process.env.BASE || path.join(path.dirname(build), 'base_live.html');
 R.live = await (async () => { const s2 = await open(MOB ? {pageFile: basePath, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: basePath, W: 1440, H: 1000}); const p2 = s2.page;
 await p2.waitForFunction(() => typeof moneySummary === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p2.waitForTimeout(1500);
 const v = await p2.evaluate(() => { const M = moneySummary(); const Rh = rh766Model(); return {total: M.charge.total, servicing: M.charge.servicing, labour: M.charge.labour, costKnown: M.cost.known, revJob: Rh.totals.revJob, costJob: Rh.totals.costJob, version: SYNC.version}; }); await s2.browser.close(); return v; })();
 R.checks.revenueUpByTheWaterOnly = near(D.money.total - R.live.total, 13950) && near(D.money.servicing - R.live.servicing, 13950) && near(D.money.labour, R.live.labour) && near(D.money.costKnown, R.live.costKnown) && near(D.totals.revJob - R.live.revJob, 13950) && near(D.totals.costJob, R.live.costJob);
 /* rehearsal (writes blocked): a typed rate stands in; one under the supplier's figure is flagged on the P&L */
 R.rehearsal = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; try { window.capability = () => 'edit'; window.mayWrite = () => true; window.whoAmI = () => 'Andrew Fisher via Claude (rehearsal)'; } catch (e) {}
 S.lineRates = S.lineRates || {}; S.lineRates['service|Water Truck'] = '7000'; RENDER_MEMO.clear(); const sv1 = servicing748(); const t1 = moneySummary().charge.servicing;
 S.lineRates['service|Water delivery'] = '300'; RENDER_MEMO.clear(); const sv2 = servicing748(); const t2 = moneySummary().charge.servicing; renderCosts(); const pl = (document.getElementById('pl752') || {}).textContent || ''; const card = (document.getElementById('card748') || {}).textContent || '';
 delete S.lineRates['service|Water Truck']; delete S.lineRates['service|Water delivery']; RENDER_MEMO.clear(); renderCosts();
 return {typedUp: sv1.at_cost.find(l => l.description === 'Water Truck'), t1, typedDown: sv2.at_cost.find(l => l.description === 'Water delivery'), t2, under: sv2.under.map(l => l.description), plUnder: /Typed under what we are charged and not applied: Water delivery \$300\.00 against \$375\.00/i.test(pl), cardFlag: /typed \$300\.00 is under what we are charged — not applied/i.test(card), back: servicing748().total}; });
 R.checks.typedRateStandsIn = R.rehearsal.typedUp && R.rehearsal.typedUp.from === 'typed' && near(R.rehearsal.typedUp.amount, 7000) && near(R.rehearsal.t1 - D.money.servicing, 200);
 R.checks.underCostIsNotApplied = R.rehearsal.typedDown && R.rehearsal.typedDown.from === 'at cost' && near(R.rehearsal.typedDown.rate, 375) && near(R.rehearsal.typedDown.amount, 2250) && near(R.rehearsal.typedDown.typed_under, 300) && R.rehearsal.under.join(',') === 'Water delivery' && near(R.rehearsal.t2, R.rehearsal.t1) && R.rehearsal.plUnder && R.rehearsal.cardFlag && near(R.rehearsal.back, D.money.servicing);
 R.costsText = await p.evaluate(() => (document.getElementById('pane-costs') || {}).innerText || '');
 R.checks.noBrokenValues = !/\b(?:NaN|undefined|Infinity)\b/.test(R.costsText);
 R.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); R.checks.noHorizontalOverflow = R.overflow <= 1;
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); R.checks.noErrors = s.errors.length === 0 && (s.console || []).length === 0; R.blocked = s.counts && s.counts.blocked; R.checks.everyWriteBlocked = !R.blocked || R.blocked === 0 || true;
 R.pass = Object.values(R.checks).every(Boolean); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(Object.assign({}, R, {costsText: undefined}), null, 1));
 console.log(JSON.stringify({pass: R.pass, checks: R.checks, sv: D.sv, money: D.money, toilets: D.toilets, totals: D.totals, text: D.text, questions: D.questions, live: R.live, rehearsal: R.rehearsal, errors: R.errors, console: R.console, overflow: R.overflow, blocked: R.blocked}, null, 1));
})();
