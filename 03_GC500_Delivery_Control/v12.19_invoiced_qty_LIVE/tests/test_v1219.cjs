// Author: Andrew Fisher. v12.19 - the V8s charged on Advanced's quantities. Opens the live page (base) and the build side by side,
// reading the live record (read only: the harness aborts every write), and holds the build to: every docket on an approved sheet
// charged on the sheet's own quantities at our rates, line by line; the rate-sheet dockets unchanged but for vehicle gates; the
// labour notes, team leader, materials and outside orders as fencing lines; the Fencing tab, the Costs category and the P&L on
// one figure; what we pay, the papers' quantities, Today and the area metres unchanged.
//   BASE=<live page> BUILD=<build> [MOB=1] node test_v1219.cjs
'use strict';
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page'));
const MOB = process.env.MOB === '1';
const read = () => {
  const r2 = n => Math.round(n * 100) / 100;
  const use = allDockets().filter(d => d.usable);
  const M = moneySummary(), P = pl770Model(), fd = fenceDerived(), sp = fencePaidSplit();
  const sec = document.getElementById('pl770'), desk = sec && sec.querySelector(':scope > .branch978-desktop');
  const rows = desk ? [...desk.querySelectorAll('tbody tr')].filter(tr => tr.children.length === 3).map(tr => [tr.children[0].textContent.replace(/\s+/g, ' ').trim(), tr.children[1].textContent.trim(), tr.children[2].textContent.trim()]) : [];
  const today = (() => { const s = todayWorkSummary848(todayIso()); const o = {}; for (const id in s.byId) o[id] = s.byId[id].done + '/' + s.byId[id].total; return o; })();
  const areas = fenceByArea(use), areaQty = JSON.stringify(areas.map(a => [a.name, a.lines.map(l => [l.column, r2(l.qty || 0)])]));
  const costs = allCosts().filter(c => /^C-FD-/.test(c.id || ''));
  return {
    charged: fd.charged, cost: fd.cost, split: {paid: sp.paid, gear: sp.gear, labour: sp.docket_labour, green: sp.green, clean: sp.clean},
    dockets: use.map(d => ({id: d.id, no: d.docket_no || null, inv: d.invoiced1219 || null, cost: d.cost_total, paid: d.paid_total, state: d.cost_state,
      lines: (d.lines || []).map(l => [l.column, l.name, l.unit, l.qty, l.rate, l.cost]), sup: Array.isArray(d.supplier_lines) ? d.supplier_lines.map(l => [l.column, l.qty]) : null})),
    quantities: use.map(d => d.id + ':' + JSON.stringify(d.quantities)).join('|'), today, areaQty,
    costsFence: r2(costs.reduce((n, c) => n + (c.amount || 0), 0)),
    extraLines: costs.filter(c => c.invoiced1219).map(c => ({id: c.id, amount: c.amount, usable: c.usable, branch: (costBranchOf(c) || {}).code || null, kind: c.kind, problems: c.problems})),
    billed: typeof FenceInvoiced1219 !== 'undefined' ? FenceInvoiced1219.billed() : null,
    rev: P.rev.map(r => [r.key, r.now, r.job]), plCost: P.cost.map(r => [r.key, r.now, r.job]), revJob: P.revJob, directJob: P.directJob, plChecks: P.checks,
    rehireBasis: (P.rev.find(r => r.key === 'rehire') || {}).basis || '',
    card: !!document.querySelector('#pl770[data-pl1194]'), plRows: rows,
    difference: M.difference, contribution: branchFinancial978(pl752Rows(), M).total.contributionJob,
    footer: (document.getElementById('footL') || {}).textContent || ''};
};
(async () => {
  const res = {}, errs = {}, blocked = {};
  for (const [tag, file] of [['base', process.env.BASE], ['build', process.env.BUILD]]) {
    const s = await open({pageFile: file, hash: '#costs', W: MOB ? 390 : 1440, H: MOB ? 844 : 1000, mobile: MOB});
    try {
      await s.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
      await s.page.waitForFunction(() => document.querySelector('#pl770[data-pl1194]'), null, {timeout: 60000});
      await s.page.waitForTimeout(2500);
      res[tag] = await s.page.evaluate(read);
    } catch (e) { res[tag] = {err: String(e).slice(0, 300)}; }
    errs[tag] = s.errors.length; blocked[tag] = s.counts.blocked;
    await s.browser.close();
  }
  const B = res.base, N = res.build; let pass = 0, fail = 0;
  const check = (ok, what) => { console.log((ok ? 'PASS ' : 'FAIL ') + what); ok ? pass++ : fail++; };
  if (B.err || N.err) { console.log('could not read', B.err || '', N.err || ''); process.exit(1); }
  const r2 = n => Math.round(n * 100) / 100, $ = t => Number(String(t).replace(/[^0-9.-]/g, ''));
  const RATE = {clean: 16.1607, scrim: 25.53, ped_gates: 36.1839, v_gates: 40.4, fence_blocks: 3.02, labour: 142, ccb_demarc: 13.08, ccb_event: 7.51, flat_feet: 9.6511};
  const sum = (ls, k, i) => r2(ls.filter(l => l[0] === k).reduce((n, l) => n + (l[i] || 0), 0));
  const CCB = ['ccb_demarc', 'ccb_event', 'flat_feet'];
  /* 1. every docket on an approved sheet: the sheet's quantities, our rates, line by line */
  const sheet = N.dockets.filter(d => d.sup && d.sup.length);
  const bad = sheet.filter(d => {
    if (d.inv !== 'sheet') return true;
    const S = d.sup, L = d.lines, sq = k => sum(S, k, 1);
    const ok = sum(L, 'clean', 3) === sq('clean') && sum(L, 'scrim', 3) === sq('scrim') && sum(L, 'ped_gates', 3) === sq('ped_gates') && sum(L, 'v_gates', 3) === sq('v_gates') &&
      sum(L, 'fence_blocks', 3) === sq('bases') && r2(sum(L, 'labour', 3)) === r2(sq('relocation') + sq('labour')) &&
      r2(CCB.reduce((n, k) => n + sum(L, k, 3), 0)) === r2(CCB.reduce((n, k) => n + sq(k), 0)) &&
      L.every(l => RATE[l[0]] != null && l[4] === RATE[l[0]] && l[5] === r2(l[3] * l[4])) && d.cost === r2(L.reduce((n, l) => n + l[5], 0));
    return !ok;
  });
  check(sheet.length === 115 && !bad.length, `${sheet.length} dockets on approved sheets, each charged on the sheet's quantities at our rates${bad.length ? '; wrong: ' + bad.slice(0, 6).map(d => d.no || d.id).join(', ') : ''}`);
  /* 2. the rate-sheet dockets keep their own lines; only vehicle gates take a price */
  const byId = new Map(B.dockets.map(d => [d.id, d]));
  const rateBad = N.dockets.filter(d => !(d.sup && d.sup.length)).filter(d => {
    const b = byId.get(d.id); if (!b) return true;
    const want = b.lines.map(l => l[0] === 'v_gates' && l[3] ? [l[0], l[1], l[2], l[3], 40.4, r2(l[3] * 40.4)] : l);
    return JSON.stringify(d.lines) !== JSON.stringify(want) || d.cost !== r2((b.cost || 0) + sum(want, 'v_gates', 5) - sum(b.lines, 'v_gates', 5));
  });
  check(!rateBad.length, `the ${N.dockets.length - sheet.length} rate-sheet dockets keep their lines, vehicle gates at $40.40${rateBad.length ? '; wrong: ' + rateBad.slice(0, 6).map(d => d.no || d.id).join(', ') : ''}`);
  /* 3. what else they bill */
  const X = N.billed || {lines: []}, line = id => (X.lines.find(l => l.id === id) || {}).amount;
  check(X.notes && X.notes.hours === 108.5 && line('LABOUR-NOTES') === 15407 && line('TEAM-LEADER') === 9200 && line('WEED-MAT') === 2580 && line('SHADE-CLOTH') === 784 && line('ORDER-4658850') === 195 && X.total === 28166,
    'labour notes 108.5 h $15,407; team leader $9,200; weed mat $2,580; shade cloth $784; order 4658850 $195: ' + JSON.stringify(X.lines.map(l => [l.id, l.amount])));
  check(N.extraLines.length === 5 && N.extraLines.every(c => c.usable && c.branch === 'STPS' && c.kind === 'subhire'), 'they are usable fencing lines on Costs, subhire on STPS: ' + JSON.stringify(N.extraLines.map(c => [c.id, c.usable, c.branch, (c.problems || []).join(';')])));
  /* 4. one figure */
  const dockets = r2(N.dockets.reduce((n, d) => n + (d.cost || 0), 0));
  check(N.charged === r2(dockets + X.total) && N.costsFence === N.charged, `Fencing tab ${N.charged} = the dockets ${dockets} + what else they bill ${X.total} = the Costs category ${N.costsFence}`);
  check(Math.abs(N.charged - 364816.28) < 1, `charge ${B.charged} -> ${N.charged} (the workbook's line-by-line figure is $364,816.28; the page rounds each docket)`);
  /* 5. what we pay, the papers, Today and the areas do not move */
  check(N.cost === B.cost && JSON.stringify(N.split) === JSON.stringify(B.split) && N.dockets.every(d => (byId.get(d.id) || {}).paid === d.paid), `what we pay unchanged (${N.cost}; gear ${N.split.gear}, crew ${N.split.labour}, green ${N.split.green})`);
  check(N.quantities === B.quantities && JSON.stringify(N.today) === JSON.stringify(B.today) && N.areaQty === B.areaQty, 'the papers\' quantities, Today and every area\'s metres unchanged');
  /* 6. the P&L follows, and only through Rehire Revenue */
  const D = r2(N.charged - B.charged), rb = B.rev.find(r => r[0] === 'rehire'), rn = N.rev.find(r => r[0] === 'rehire');
  const otherRev = JSON.stringify(N.rev.filter(r => r[0] !== 'rehire')) === JSON.stringify(B.rev.filter(r => r[0] !== 'rehire'));
  check(otherRev && r2(rn[1] - rb[1]) === D && r2(rn[2] - rb[2]) === D && JSON.stringify(N.plCost) === JSON.stringify(B.plCost) && r2(N.revJob - B.revJob) === D,
    `P&L: Rehire Revenue ${rb[2]} -> ${rn[2]} (+${D}), every other revenue line and every cost unchanged`);
  check(N.card && Object.values(N.plChecks || {}).every(Boolean) && N.plRows.length === B.plRows.length, `the P&L card ties and renders its ${N.plRows.length} rows`);
  const delta = name => { const is = r => r[0] === name || r[0].startsWith(name + ' '); const a = B.plRows.find(is), b = N.plRows.find(is); return a && b ? r2($(b[1]) - $(a[1])) : null; };
  check(delta('Rehire Revenue') === D && delta('Total Revenue') === D && delta('Gross Margin · all in') === D && delta('Difference · all in, not a margin yet') === D && delta('Total Direct Costs') === 0,
    'card: Rehire Revenue, Total Revenue, Gross Margin and Difference each +' + D + '; costs unchanged');
  check(r2(N.difference - B.difference) === D && r2(N.contribution - B.contribution) === D, `job difference ${B.difference} -> ${N.difference}; branch view ${B.contribution} -> ${N.contribution}`);
  check(/Advanced’s fencing on the quantities they bill, at the 2026 card/.test(N.rehireBasis), 'the P&L names the basis');
  check(/ · v12\.19$/.test(N.footer.trim()), 'footer ' + N.footer.trim().slice(-12));
  check(errs.build === 0 && blocked.build === 0, `build: ${errs.build} page errors, ${blocked.build} record writes`);
  console.log('P&L card, base :', JSON.stringify(B.plRows));
  console.log('P&L card, build:', JSON.stringify(N.plRows));
  console.log(`${pass}/${pass + fail} ${MOB ? 'phone' : 'desktop'}`);
  process.exit(fail ? 1 : 0);
})();
