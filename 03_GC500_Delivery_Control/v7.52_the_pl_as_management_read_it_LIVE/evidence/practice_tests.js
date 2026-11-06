// v7.52 practice tests - read only.   CHROMIUM_PATH=... node practice_tests.js <build.html> <outdir>
const {open} = require('../../toolchain/harness/open_page.js'); const fs = require('fs'); const path = require('path');
const ready = p => p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && typeof pl752Card === 'function', null, {timeout: 240000}).then(() => p.waitForTimeout(2500));
const figures = p => p.evaluate(() => { const M = moneySummary(); const B = pl752Rows(); const card = B.reduce((s, b) => s + b.card, 0);
  const txt = document.getElementById('pl752').innerText;
  return {revenue: M.charge.total, costs: M.cost.known, diff: M.difference0, contracts: M.charge.contracts, branchTotal: Math.round(B.reduce((s, b) => s + b.total, 0) * 100) / 100, branches: B,
    statementShows: {revenue: txt.includes(money0(M.charge.total)), costs: txt.includes(money0(M.cost.known)), diff: txt.includes(money0(Math.abs(M.difference0)))},
    foldClosed: !document.querySelector('.plfold752').open, moneyCardStillThere: !!document.getElementById('moneyCard'), catRows: document.querySelectorAll('#pl752 .pl-col + .pl-col .pl-ln').length, subCells: [...document.querySelectorAll('#pl752 .pl-tbl tbody tr')].map(tr => (tr.querySelector('td:first-child b') || {}).textContent + ': ' + ((tr.querySelector('.pl-sub') || {}).innerText || '').replace(/\s+/g, ' ').trim()), subLoc: ((document.querySelector('#pl752 .pl-subloc') || {}).innerText || '').slice(0, 200)}; });
(async () => {
 const [build, out] = [process.argv[2], process.argv[3] || __dirname]; const R = {};
 let s = await open({pageFile: build, W: 1440, H: 1000}); let p = s.page; await ready(p);
 await p.evaluate(() => go('costs')); await p.waitForTimeout(1500); R.desktop = await figures(p);
 await p.evaluate(() => document.getElementById('pl752').scrollIntoView()); await p.waitForTimeout(400);
 const box = await p.evaluate(() => { const r = document.getElementById('pl752').getBoundingClientRect(); return {y: Math.max(0, r.top), h: Math.min(r.height + 8, 1000)}; });
 await p.screenshot({path: path.join(out, 'shot752_pl_desktop.png'), clip: {x: 0, y: box.y, width: 1440, height: box.h}});
 await p.screenshot({path: path.join(out, 'shot752_pl_desktop_full.png'), fullPage: false});
 R.errors = s.errors; await s.browser.close();
 s = await open({pageFile: build, mobile: true, W: 390, H: 844, dpr: 2}); p = s.page; await ready(p);
 await p.evaluate(() => go('costs')); await p.waitForTimeout(1500); R.phone = await figures(p);
 R.phoneOverflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
 await p.evaluate(() => document.getElementById('pl752').scrollIntoView()); await p.waitForTimeout(400);
 await p.screenshot({path: path.join(out, 'shot752_pl_phone.png')}); R.phoneErrors = s.errors; await s.browser.close();
 fs.writeFileSync(path.join(out, 'practice_results.json'), JSON.stringify(R, null, 1));
 const d = R.desktop; console.log(JSON.stringify({revenue: d.revenue, costs: d.costs, diff: d.diff, contracts: d.contracts, branchTotal: d.branchTotal, branchEqualsContracts: Math.abs(d.branchTotal - d.contracts) < 0.01, branches: d.branches, statementShows: d.statementShows, foldClosed: d.foldClosed, moneyCardStillThere: d.moneyCardStillThere, catRows: d.catRows, subCells: d.subCells, subLoc: d.subLoc, errors: R.errors, phoneErrors: R.phoneErrors, phoneOverflow: R.phoneOverflow}, null, 1));
})();
