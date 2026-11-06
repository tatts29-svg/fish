// v7.54 practice tests - read only.   CHROMIUM_PATH=... node practice_tests.js <build.html> <outdir>
// Every branch row carries the Sub-hired · rehire cell: KINP the Event Portables toilets and its one SUB line, MEAD
// its one SUB line, STPS and NVAC none; the branch totals still equal the contracts line to the cent.
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
const ready = p => p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && typeof pl754Cell === 'function', null, {timeout: 240000}).then(() => p.waitForTimeout(2500));
const figures = p => p.evaluate(() => { const M = moneySummary(); const B = pl752Rows(); const RH = pl754Rehire(M);
 const rows = [...document.querySelectorAll('#pl752 .pl-tbl tbody tr')].map(tr => ({branch: (tr.querySelector('td:first-child b') || tr.querySelector('td:first-child') || {}).textContent, sub: ((tr.querySelector('.pl-sub') || {}).innerText || '').replace(/\s+/g, ' ').trim(), total: ((tr.querySelector('td:last-child') || {}).innerText || '').trim()}));
 const toilets = ONHIRE_ROWS.filter(r => r.family === 'toilet');
 return {contracts: M.charge.contracts, branchTotal: Math.round(B.reduce((s, b) => s + b.total, 0) * 100) / 100, revenue: M.charge.total, costs: M.cost.known,
 branches: B.map(b => ({code: b.code, lines: b.lines, total: b.total, subLines: b.subLines, rehire: b.rehire, suppliers: b.suppliers, rehireLines: b.rehireLines, rehireUnits: b.rehireUnits, rehireCharge: b.rehireCharge, rehireCoatesNos: b.rehireCoatesNos, rehireUnrated: b.rehireUnrated, plantLines: b.plantLines, plantCharge: b.plantCharge, plantWhat: b.plantWhat})),
 plantCheck: ONHIRE_ROWS.filter(r => r.subhired_machine && !r.subhired).map(r => ({branch: r.branch_code, what: r.what, amount: (contractCharge(r) || {}).amount})),
 RH, check: {toiletLines: toilets.length, toiletUnits: toilets.reduce((s, r) => s + (Number(r.quantity) || 0), 0), toiletCharge: Math.round(toilets.reduce((s, r) => { const c = contractCharge(r); return s + (typeof c.amount === 'number' ? c.amount : 0); }, 0) * 100) / 100, servicing: M.charge.servicing, rehireCost: M.cost.rehire, streamToilets: (M.streams.find(x => x.key === 'toilets') || {}).charge},
 rows, everyRowHasCell: rows.every(r => r.sub.length > 0), head: ((document.querySelector('#pl752 .pl-tbl thead') || {}).innerText || '').replace(/\s+/g, ' ')}; });
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const R = {};
 let s = await open({pageFile: build, W: 1440, H: 1000}); let p = s.page; await ready(p);
 await p.evaluate(() => go('costs')); await p.waitForTimeout(1500); R.desktop = await figures(p);
 await p.evaluate(() => document.querySelector('#pl752 .pl-wide').scrollIntoView()); await p.waitForTimeout(400);
 const box = await p.evaluate(() => { const r = document.querySelector('#pl752 .pl-wide').getBoundingClientRect(); return {y: Math.max(0, r.top), h: Math.min(r.height + 8, 1000 - Math.max(0, r.top))}; });
 await p.screenshot({path: path.join(out, 'shot754_by_branch.png'), clip: {x: 0, y: box.y, width: 1440, height: box.h}});
 R.errors = s.errors; await s.browser.close();
 s = await open({pageFile: build, mobile: true, W: 390, H: 844, dpr: 2}); p = s.page; await ready(p);
 await p.evaluate(() => go('costs')); await p.waitForTimeout(1500); R.phone = await figures(p);
 R.phoneOverflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
 await p.evaluate(() => document.querySelector('#pl752 .pl-wide').scrollIntoView()); await p.waitForTimeout(400);
 await p.screenshot({path: path.join(out, 'shot754_by_branch_phone.png')}); R.phoneErrors = s.errors; await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results.json'), JSON.stringify(R, null, 1));
 const d = R.desktop; const K = d.branches.find(b => b.code === 'KINP') || {};
 const N = d.branches.find(b => b.code === 'NVAC') || {};
 console.log(JSON.stringify({contracts: d.contracts, branchTotal: d.branchTotal, branchEqualsContracts: Math.abs(d.branchTotal - d.contracts) < 0.01, revenue: d.revenue, costs: d.costs, kinp: K, nvacPlant: {plantLines: N.plantLines, plantCharge: N.plantCharge, plantWhat: N.plantWhat}, plantCheck: d.plantCheck, kinpMatchesToilets: K.rehireLines === d.check.toiletLines && K.rehireUnits === d.check.toiletUnits && Math.abs(K.rehireCharge - d.check.toiletCharge) < 0.01, check: d.check, RH: d.RH, rows: d.rows, everyRowHasCell: d.everyRowHasCell, head: d.head, errors: R.errors, phoneErrors: R.phoneErrors, phoneOverflow: R.phoneOverflow}, null, 1));
})();
