// v7.68 practice tests - read only against the live record (GETs only through the harness; every write is blocked).
// Proves: WC60 gets its Waste tank line from the contract (9968955 lines 94, 95), quantity 2, with the card's install and
// levelling priced per tank and the two tank numbers as the pieces; the toilet blocks' ticks still read ($811.98); WC05,
// WC20 and WC27 are untouched (no second line); no other reference gains a line; the P&L's revenue, labour and costs do
// not move until somebody ticks; a rehearsed tick on each tank (writes blocked) adds $145.74 install + $104.10 levelling
// per tank = $499.68; WC60 is no longer "carrying more numbers than it ordered"; desktop and phone; 0 errors.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB, checks: {}};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof tank768LinesFor === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p.waitForTimeout(1800);
 R.data = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; const M0 = moneySummary(); const before = JSON.stringify(M0);
 const a = assetOf('WC60'); const L = chargeLines(a); const tank = L.find(l => l.item === 'Waste tank'); const T = assetTotal(a);
 const lab = tank ? labourLinesFor('WC60', tank.discipline, 'Waste tank', 'WC60', undefined, a) : null;
 const others = ['WC05', 'WC20', 'WC27'].map(k => { const x = assetOf(k); return {key: k, lines: chargeLines(x).map(l => l.item + ' x' + l.quantity), tankLines: chargeLines(x).filter(l => /waste tank/i.test(l.item)).length, labour: r2(assetTotal(x).lines.reduce((s, l) => s + ((l.labour && l.labour.total) || 0), 0))}; });
 const gained = allAssets().filter(x => (x.charge_lines || []).some(l => l._tank768)).map(x => x.key);
 const extra = typeof extraNumbers === 'function' ? extraNumbers().map(e => e.a.key) : null;
 return {tank: tank && {qty: tank.quantity, state: tank.quantity_state, rate_state: tank.rate_state, priceable: tank.priceable, lines: tank._tank768 && tank._tank768.lines, contract: tank._tank768 && tank._tank768.contract},
 itemTypes: a.item_types, lab: lab && {state: lab.state, priced: lab.lines.map(l => [l.key, l.rate, l.ticked]), withheld: lab.withheld},
 units: {tank: labourUnits(a, 'Waste tank'), block: labourUnits(a, 'Toilet Block 6m')}, lineNumbers: lineNumbersOf(a),
 toilets: T.lines.filter(l => l.item === 'Toilet Block 6m').map(l => ({qty: l.qty, labour: l.labour.total, ticks: l.labour.ticked.length})),
 tankMoneyNow: T.lines.filter(l => l.item === 'Waste tank').map(l => ({qty: l.qty, labour: l.labour.total, ticks: l.labour.ticked.length, cardHire: l.total})),
 others, gained, extra, money: {total: M0.charge.total, labour: M0.charge.labour, ticks: M0.charge.labour_ticks, costKnown: M0.cost.known, cardHire: M0.charge.card_hire, contracts: M0.charge.contracts}, readOnly: before === JSON.stringify(moneySummary())}; });
 const D = R.data, near = (a, b) => a != null && b != null && Math.abs(a - b) < 0.02;
 R.checks.wc60HasItsTankLineFromTheContract = !!D.tank && D.tank.qty === 2 && D.tank.contract === '9968955' && Array.isArray(D.tank.lines) && D.tank.lines.join(',') === '94,95' && /from the contract/.test(D.tank.state) && D.itemTypes.includes('Waste tank') && D.itemTypes[0] === 'Toilet Block 6m';
 R.checks.installAndLevellingPricedPerTank = !!D.lab && D.lab.priced.some(x => x[0] === 'install' && near(x[1], 145.74)) && D.lab.priced.some(x => x[0] === 'levelling' && near(x[1], 104.1)) && !D.lab.priced.some(x => x[0] === 'steps') && (D.lab.withheld || []).includes('Steps');
 R.checks.theTwoTanksAreThePieces = D.units.tank.join(',') === '1328980,1328981' && D.units.block.join(',') === '1087500,1119489';
 R.checks.toiletBlockTicksStillRead = D.toilets.length === 1 && D.toilets[0].qty === 2 && near(D.toilets[0].labour, 811.98) && D.toilets[0].ticks === 6;
 R.checks.nothingTickedOnTheTanksYet = D.tankMoneyNow.length === 1 && D.tankMoneyNow[0].ticks === 0 && (D.tankMoneyNow[0].labour === 0 || D.tankMoneyNow[0].labour == null);
 R.checks.otherTankLocationsUntouched = D.others.every(o => o.tankLines === 1) && near(D.others.find(o => o.key === 'WC05').labour, 655.83);
 R.checks.onlyWc60GainedALine = D.gained.length === 1 && D.gained[0] === 'WC60';
 R.checks.wc60NoLongerOverNumbered = Array.isArray(D.extra) && !D.extra.includes('WC60');
 /* the P&L: revenue, labour and costs exactly as the live page (base_live.html beside the build, the page v7.68 was built on) reads
 the same record at the same time (nothing ticked on the tanks yet); the card comparison rises by the two tanks' card hire only */
 const basePath = process.env.BASE || path.join(path.dirname(build), 'base_live.html');
 R.live = await (async () => { const s2 = await open(MOB ? {pageFile: basePath, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: basePath, W: 1440, H: 1000}); const p2 = s2.page;
 await p2.waitForFunction(() => typeof moneySummary === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p2.waitForTimeout(1500);
 const v = await p2.evaluate(() => { const M = moneySummary(); return {total: M.charge.total, servicing: M.charge.servicing || 0, labour: M.charge.labour, ticks: M.charge.labour_ticks, costKnown: M.cost.known, cardHire: M.charge.card_hire, version: SYNC.version, wc60Lines: chargeLines(assetOf('WC60')).map(l => l.item + ' x' + l.quantity)}; }); await s2.browser.close(); return v; })();
 /* the servicing line is v7.69's (the water charged on at cost) and is left out of this comparison: v7.68 moves nothing but the tank line */
 R.checks.plUnmovedUntilTicked = near(D.money.total - (D.money.servicing || 0), R.live.total - (R.live.servicing || 0)) && near(D.money.labour, R.live.labour) && D.money.ticks === R.live.ticks && near(D.money.costKnown, R.live.costKnown);
 R.checks.cardComparisonRisesByTheTanksOnly = near(D.money.cardHire - R.live.cardHire, 2 * 750.561);
 R.checks.liveHadNoTankLine = Array.isArray(R.live.wc60Lines) && R.live.wc60Lines.length === 1 && R.live.wc60Lines[0] === 'Toilet Block 6m x2';
 /* rehearsal: tick install and levelling on each tank with the writes blocked (view link, capability stubbed) */
 R.rehearsal = await p.evaluate(() => { const r2 = v => Math.round(v * 100) / 100; try { window.capability = () => 'edit'; window.mayWrite = () => true; window.whoAmI = () => 'Andrew Fisher via Claude (rehearsal)'; } catch (e) {}
 const b0 = moneySummary().charge.labour; const log = [];
 ['1328980', '1328981'].forEach(u => ['install', 'levelling'].forEach(k => log.push([u, k, setLabour('WC60', 'Toilets & amenities', 'Waste tank', k, true, u)])));
 RENDER_MEMO.clear && RENDER_MEMO.clear(); const a = assetOf('WC60'); const T = assetTotal(a); const tank = T.lines.find(l => l.item === 'Waste tank');
 const keys = Object.keys(S.labour || {}).filter(k => k.startsWith('WC60') && /Waste tank/.test(k));
 return {log, keys, tankLabour: tank && tank.labour.total, tankTicks: tank && tank.labour.ticked.length, labourAfter: r2(moneySummary().charge.labour - b0), waiting: typeof syncWaiting === 'function' ? syncWaiting() : null}; });
 R.checks.rehearsedTicksChargeTheTanks = R.rehearsal.log.every(x => x[2] === true) && near(R.rehearsal.tankLabour, 499.68) && R.rehearsal.tankTicks === 4 && near(R.rehearsal.labourAfter, 499.68) && R.rehearsal.keys.length === 4 && R.rehearsal.keys.every(k => /^WC60\/u13289(80|81)\|Toilets & amenities\|Waste tank\|(install|levelling)$/.test(k));
 R.text = await p.evaluate(() => { location.hash = '#costs'; return ''; }); await p.waitForTimeout(2500);
 R.costsText = await p.evaluate(() => (document.getElementById('pane-costs') || {}).innerText || '');
 R.checks.noBrokenValues = !/\b(?:NaN|undefined|Infinity)\b/.test(R.costsText);
 R.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); R.checks.noHorizontalOverflow = R.overflow <= 1;
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); R.checks.noErrors = s.errors.length === 0 && (s.console || []).length === 0; R.blocked = s.counts && s.counts.blocked; R.checks.everyWriteBlocked = !!R.blocked || R.rehearsal.waiting === 0 || R.rehearsal.waiting == null;
 R.pass = Object.values(R.checks).every(Boolean); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(Object.assign({}, R, {costsText: undefined}), null, 1));
 console.log(JSON.stringify({pass: R.pass, checks: R.checks, data: D, rehearsal: R.rehearsal, errors: R.errors, console: R.console, overflow: R.overflow, blocked: R.blocked}, null, 1));
})();
