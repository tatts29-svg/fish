// v7.67 practice tests - read only against the live record (GETs only through the harness; every write is blocked).
// Proves: the P&L says what we priced and how (the card lines, the servicing with quantities and Event Portables'
// charge, the two lines without a card line with the sibling rate named); no figure changes; the link to each line
// opens the card table; desktop and phone.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node practice_tests.js <build.html> [outdir]
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const MOB = process.env.MOB === '1'; const R = {mobile: MOB, checks: {}};
 const s = await open(MOB ? {pageFile: build, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: build, W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof pl767Unpriced === 'function' && typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await p.waitForTimeout(1800);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(4000);
 R.data = await p.evaluate(() => { const before = JSON.stringify(moneySummary()); const M = moneySummary(), c = M.charge; const U = pl767Unpriced(); const sv = servicing748();
 const pl = document.getElementById('pl752').innerText; return {pl, total: c.total, servicing: c.servicing, svTotal: sv.total, their: sv.their_total, unpriced: {n: U.n, words: U.words, short: U.short, sib: U.items.filter(x => x.sib).length}, link: !!document.querySelector('#pl752 [data-jump765="card748"]'), readOnly: before === JSON.stringify(moneySummary())}; });
 const D = R.data;
 R.checks.pricedByUsSaid = /Hire priced by us from the street rate card 2026/i.test(D.pl) && /priced by us at our pump-out rates/i.test(D.pl) && !/an estimate until the branch puts a rate/i.test(D.pl) && !/on no contract line yet · servicing/i.test(D.pl);
 R.checks.servicingWorkingShown = /780 × FWF Pump out/i.test(D.pl) && /24 × Tank Pump Out/i.test(D.pl) && /Event Portables charge us \$46,545/i.test(D.pl);
 R.checks.ruleSaid = /day rate × the days to the term date/i.test(D.pl) && /whole-event rate/i.test(D.pl);
 R.checks.unpricedNamedWithSibling = D.unpriced.n === 2 && D.unpriced.sib >= 1 && D.unpriced.words.some(w => /Rate 1 \$9\.30 a week/.test(w)) && /own line SUB-2527 carries Rate 1 \$9\.30 a week/.test(D.pl) && /for the branch to confirm/.test(D.pl) && /what the contracts hold for them/i.test(D.pl);
 R.checks.linkToEachLine = D.link;
 R.checks.noFigureMoved = Math.abs(D.servicing - D.svTotal) < 0.02 && D.total > 500000;
 R.checks.readOnly = D.readOnly;
 R.jump = await p.evaluate(async () => { const b = document.querySelector('#pl752 [data-jump765="card748"]'); if (!b) return null; b.click(); await new Promise(r => setTimeout(r, 900)); const d = document.getElementById('card748').closest('details'); const r = document.getElementById('card748').getBoundingClientRect(); return {foldOpen: d ? d.open : null, top: Math.round(r.top), vh: window.innerHeight}; });
 R.checks.jumpOpensTheFold = !!R.jump && R.jump.foldOpen === true && R.jump.top > -40 && R.jump.top < R.jump.vh;
 R.checks.noBrokenValues = !/\b(?:NaN|undefined|Infinity|null)\b/.test(D.pl);
 R.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); R.checks.noHorizontalOverflow = R.overflow <= 1;
 try { await p.evaluate(() => document.getElementById('pl752').scrollIntoView({block: 'start'})); await p.waitForTimeout(400); const h = await p.evaluate(() => Math.ceil(document.getElementById('pl752').getBoundingClientRect().height)); await p.setViewportSize({width: MOB ? 390 : 1440, height: Math.min(9000, h + 300)}); await p.waitForTimeout(600); await p.evaluate(() => document.getElementById('pl752').scrollIntoView({block: 'start'})); await p.waitForTimeout(500); const el = await p.$('#pl752'); await el.screenshot({path: path.join(out, 'shot767_pl' + (MOB ? '_phone' : '') + '.png')}); } catch (e) { R.shotError = String(e.message).slice(0, 160); }
 R.errors = s.errors; R.console = (s.console || []).slice(0, 10); R.checks.noErrors = s.errors.length === 0 && (s.console || []).length === 0; R.blocked = s.counts && s.counts.blocked; R.checks.noWriteLeftThePage = !R.blocked;
 R.pass = Object.values(R.checks).every(Boolean); await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results' + (MOB ? '_phone' : '') + '.json'), JSON.stringify(Object.assign({}, R, {data: Object.assign({}, D, {pl: undefined})}), null, 1));
 console.log(JSON.stringify({pass: R.pass, checks: R.checks, unpriced: D.unpriced, servicing: [D.servicing, D.svTotal, D.their], jump: R.jump, errors: R.errors, console: R.console, overflow: R.overflow, shotError: R.shotError}, null, 1));
})();
