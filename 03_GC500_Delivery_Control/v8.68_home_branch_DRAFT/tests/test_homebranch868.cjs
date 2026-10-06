// Author: Andrew Fisher. v8.68 Home branch checks, read-only against the live record (every write is aborted by open_page).
//   PAGE=build/GC500_v8.68/GC500_Delivery_Control_hosted.html [MOB=1] node v8.68_home_branch_DRAFT/tests/test_homebranch868.cjs
const {open} = require('../../toolchain/harness/open_page');
/* the branches Andrew gave on 6 Oct 2026, set in memory only - never saved */
const HOME = {'Aaron Zelvis': 'KINP', 'Alfie Harris': 'NTSP', 'Andrew Fisher': 'NOIS', 'Daniel Gough': 'NOIS', 'Jayden Paul': 'KINP', 'Kyle Gover': 'MEAD', 'Frank Devilles': 'BFIS', 'Ludwig Chee': 'NSNA', 'Wayne Crimmin': 'STPS'};
(async () => { const MOB = !!process.env.MOB, R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0; } catch (e) { return false; } }, null, {timeout: 30000}); await p.waitForTimeout(1200);
  const near = (a, b) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 0.005;
  const F = await p.evaluate(() => { const K = OUR_KIND.person; return {field: K.fields.some(f => f.name === 'branch' && f.type === 'branch'), clean: cleanOur(K, {branch: ' kinp '}).branch}; });
  ok('a person line takes a home branch, cleaned to the code', F.field && F.clean === 'KINP', F);
  /* before: as the record stands */
  const B = await p.evaluate(() => holdAssets(() => { const H = fh866Model(), W = cj764Model().wages; return {total: H.people.total, wages: W.job, check: H.peopleCheck, rows: H.people.rows.length, set: H.people.set}; }));
  ok('wages by person add to the wages priced, to the cent, as the record stands', near(B.total, B.wages) && B.check && B.rows > 0, B);
  /* set the six in memory */
  const A = await p.evaluate(HOME => holdAssets(() => { const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
    S.costs = S.costs || []; const added = [];
    Object.entries(HOME).forEach(([n, b]) => { const cur = ourCosts().find(c => c.kind === 'person' && c.person === n); const id = 'W-P-' + ourSlug(n);
      const line = Object.assign({}, cur || {id, side: 'ours', kind: 'person', category: 'Person — rate and role', person: n}, {id, branch: b}); delete line._where; S.costs = S.costs.filter(c => c.id !== id); S.costs.push(line); added.push(id); });
    try { RENDER_MEMO.clear(); } catch (e) {}
    const H = fh866Model(), P = H.people, W = cj764Model().wages;
    const homes = Object.fromEntries(P.rows.map(g => [g.person, g.home]));
    const moveTotal = r2(Object.values(P.move).reduce((s, o) => s + Object.values(o).reduce((t, v) => t + v, 0), 0));
    const homeSum = r2(Object.values(P.byHome).reduce((s, v) => s + v, 0));
    const rowsAdd = Object.entries(P.move).every(([k, o]) => Math.abs(r2(Object.values(o).reduce((t, v) => t + v, 0)) - (P.byHome[k] || 0)) < 0.005);
    const types = Object.fromEntries(Object.keys(HOME).map(n => [n, (ourCosts().find(c => c.kind === 'person' && c.person === n) || {}).type || null]));
    const out = {homes, set: P.set, rows: P.rows.length, total: P.total, wages: W.job, check: H.peopleCheck, moveTotal, homeSum, rowsAdd, revCols: P.revCols, homeKeys: P.homes, list: fh866Branches(), pb: personBranch868('aaron zelvis'), costJob: H.costTotal.job, costCheck: H.costCheck, types};
    return {out, added}; }), HOME);
  const O = A.out;
  ok('each person carries the home branch given', Object.entries(HOME).every(([n, b]) => !(n in O.homes) || O.homes[n] === b) && O.set >= 4, {homes: O.homes, set: O.set});
  ok('looking a person up ignores case', O.pb === 'KINP', {pb: O.pb});
  ok('setting a branch keeps the person’s employment type', O.types['Andrew Fisher'] === 'Salary' && O.types['Daniel Gough'] === 'External', O.types);
  ok('with branches set, wages by person still add to the wages priced, to the cent', near(O.total, O.wages) && O.check, {total: O.total, wages: O.wages});
  ok('wages by home branch add to the total', near(O.homeSum, O.total), {homeSum: O.homeSum, total: O.total});
  ok('home branch to revenue branch: every row adds to its home total, and the table to the total', O.rowsAdd && near(O.moveTotal, O.total), {moveTotal: O.moveTotal});
  ok('a new code (NTSP) joins the branch list and the home rows', O.list.includes('NTSP') && O.homeKeys.includes('NTSP') && O.homeKeys.includes('NOIS'), {homes: O.homeKeys});
  ok('the costs by branch table is unchanged by home branches', O.costCheck, {costJob: O.costJob});
  /* the page, drawn with the branches set */
  await p.evaluate(() => { const b = document.querySelector('[data-finance857="handover"]'); if (b) b.click(); }); await p.waitForTimeout(1500);
  const V = await p.evaluate(() => { const sec = document.getElementById('handover866'); const t = sec ? sec.innerText : ''; return {wbp: /Wages by person — home branch/.test(t), move: /from the home branch to the branch the revenue is in/.test(t), ntsp: /NTSP/.test(t), notes: (t.match(/Andrew —|What Finance still need/g) || []).length}; });
  ok('handover shows wages by person and the home-to-revenue table, with no notes', V.wbp && V.move && V.ntsp && V.notes === 0, V);
  const csv = await p.evaluate(() => fh866Csv(fh866Model()).split('\r\n').map(l => l.replace(/^"/, '').replace(/"(,|$).*$/s, '')));
  ok('CSV carries the wages by person and the move table, and keeps its four sections', ['2b. Wages by person', '2c. Wages from home branch to revenue branch', '1. Purchase orders', '2. Costs by branch, to job end', '3. Demob forecast by branch', '4. Invoice by 2026-10-31'].every(h => csv.includes(h)), {});
  await p.evaluate(d => { state.runDay = d; }, '2026-10-02');
  await p.evaluate(() => { const b = document.querySelector('[data-finance857="runsheet"]'); if (b) b.click(); }); await p.waitForTimeout(1500);
  const RS = await p.evaluate(() => { const pane = document.getElementById('pane-runsheet'); const t = pane ? pane.innerText : ''; const tbl = pane && pane.querySelector('table.rstbl'); const ths = tbl ? tbl.querySelectorAll('thead th').length : 0; const widths = tbl ? [...tbl.querySelectorAll('tbody tr')].map(tr => tr.children.length) : [];
    return {head: /home branch/i.test(t), kinp: /KINP/.test(t), inputs: pane ? pane.querySelectorAll('[data-rsbranch]').length : -1, datalist: !!document.getElementById('rsBranches868'), widthsOk: widths.every(n => n === ths), ed: canEdit()}; });
  ok('running sheet shows the home branch to a view link, with no box to type in', RS.head && RS.kinp && RS.inputs === 0 && RS.datalist && RS.widthsOk && RS.ed === false, RS);
  /* clean up the in-memory lines */
  await p.evaluate(ids => { S.costs = (S.costs || []).filter(c => !ids.includes(c.id)); try { RENDER_MEMO.clear(); } catch (e) {} }, A.added);
  const G = await p.evaluate(() => { const was = JSON.stringify(S.costs || []); const r = setOurPerson('Aaron Zelvis', {branch: 'KINP'}); return {r, same: JSON.stringify(S.costs || []) === was}; });
  ok('on a view-only link setting a branch does not go through', !G.r && G.same, G);
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 4));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  R.forEach(r => console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 700)}`));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'desktop'}: ${R.length - fails}/${R.length} pass`); await s.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('TEST FAIL', e); process.exit(2); });
