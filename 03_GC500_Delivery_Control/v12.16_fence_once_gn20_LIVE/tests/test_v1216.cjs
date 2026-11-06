// Author: Andrew Fisher. v12.16 - the fence under the scrim charged once, and GN20 back on the P&L. Opens the live page (base)
// and the build side by side, reading the live record (read only: the harness aborts every write), and holds the build to:
// the fencing charge down by each docket's scrim metres at the clean rate, to the cent; the paid side down only where a
// docket is at Advanced's rate sheet; 9961976 line 6 on GN20-A from 30 Sep; NVAC up by GN20's hire; the P&L model's own
// checks; the P&L card tying; and progress, Today and the area metres unchanged.
//   BASE=<live page> BUILD=<build> [MOB=1] node test_v1216.cjs
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
  const areas = fenceByArea(use), cleanArea = r2(areas.reduce((n, a) => n + ((a.lines.find(l => l.column === 'clean') || {}).qty || 0), 0));
  const r = rentalOf('GN20-A');
  return {
    charged: fd.charged, cost: fd.cost, scrimLines: use.filter(d => d.lines.some(l => l.under_scrim1216)).length,
    perDocket: use.map(d => ({id: d.id, week: d.week, cost: d.cost_total, paid: d.paid_total, approved: d.supplier_pricing_basis === 'approved supplier pricing',
      scrim: docketQuantity((d.quantities || {}).scrim) || 0, extra: (d.lines.find(l => l.under_scrim1216) || null)})),
    quantities: use.map(d => d.id + ':' + JSON.stringify(d.quantities)).join('|'),
    split: {paid: sp.paid, gear: sp.gear, labour: sp.docket_labour, green: sp.green, clean: sp.clean},
    nvac: (M.charge.by_branch.find(b => b.code === 'NVAC') || {}).charge, contracts: M.charge.contracts, contractLines: M.charge.contracts_lines,
    difference: M.difference, plChecks: P.checks, plRows: rows, today, cleanArea, negativeAreas: areas.filter(a => a.lines.some(l => l.qty < 0)).map(a => a.name),
    gn20a: r ? {from: r.from, off: r.off, lines: r.lines.map(l => l.rental_contract + '/' + l.line), branches: r.branches} : null,
    gn20note: ((DATA.assets || []).find(a => a.key === 'GN20') || {}).asset_no_state || '',
    costsFence: r2((allCosts() || []).filter(c => /^C-FD-/.test(c.id || '')).reduce((n, c) => n + (c.amount || 0), 0)),
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
  const r2 = n => Math.round(n * 100) / 100, C = n => Math.round(n * 100);
  const want = r2(B.charged - B.perDocket.reduce((n, d) => n + (d.scrim > 0 && d.cost != null ? C(d.scrim * 16.1607) : 0), 0) / 100);
  check(N.charged === want, `fencing charge ${B.charged} -> ${N.charged}, the scrim metres off at $16.1607 docket by docket (want ${want})`);
  const byId = new Map(B.perDocket.map(d => [d.id, d]));
  const wrong = N.perDocket.filter(d => { const b = byId.get(d.id); if (!b) return true;
    const dc = r2((d.cost || 0) - (b.cost || 0)), dp = r2((d.paid || 0) - (b.paid || 0));
    if (!(b.scrim > 0) || b.cost == null) return dc !== 0 || dp !== 0 || d.extra;
    return dc !== r2(-b.scrim * 16.1607) || dp !== (b.approved ? 0 : r2(-b.scrim * 10)) || !d.extra || d.extra.qty !== -b.scrim || d.extra.column !== 'clean'; });
  check(!wrong.length, `every docket: scrim off the clean on the charge; paid only where at Advanced's rate sheet (${N.scrimLines} dockets carry the line${wrong.length ? '; wrong: ' + wrong.slice(0, 5).map(d => d.id).join(', ') : ''})`);
  check(N.quantities === B.quantities, 'the papers\' quantities are unchanged on every docket');
  check(N.costsFence === N.charged && B.costsFence === B.charged, `Costs fencing category ${B.costsFence} -> ${N.costsFence}, equal to the Fencing tab's charge`);
  /* receipted orders stand at their invoiced amount (weeks 4-6), so the cost moves only on unbilled rate-sheet dockets */
  const RECEIPTED = ['Week 4', 'Week 5', 'Week 6'];
  const costWant = r2(B.perDocket.filter(d => !d.approved && d.scrim > 0 && d.cost != null && !RECEIPTED.includes(d.week)).reduce((n, d) => n - d.scrim * 10, 0));
  check(r2(N.cost - B.cost) === costWant && N.split.clean === true && N.split.paid === N.cost,
    `fencing cost ${B.cost} -> ${N.cost} (${costWant} on unbilled rate-sheet dockets; paid split ties)`);
  check(JSON.stringify(N.today) === JSON.stringify(B.today), 'Today\'s groups unchanged: ' + JSON.stringify(N.today));
  check(N.cleanArea === B.cleanArea && !N.negativeAreas.length, `area clean metres unchanged (${N.cleanArea} m), no area below zero`);
  check(!!N.gn20a && N.gn20a.from === '2026-09-30' && N.gn20a.lines.join() === '9961976/6' && N.gn20a.branches.join() === 'NVAC' && !B.gn20a, 'GN20-A carries 9961976 line 6 from 30 Sep, on NVAC: ' + JSON.stringify(N.gn20a));
  check(r2(N.nvac - B.nvac) > 0 && r2(N.contracts - B.contracts) === r2(N.nvac - B.nvac) && N.contractLines === B.contractLines + 1, `NVAC ${B.nvac} -> ${N.nvac} (+${r2(N.nvac - B.nvac)}), one more contract line`);
  check(Object.values(N.plChecks || {}).every(Boolean) && N.plRows.length === B.plRows.length && N.plRows.length > 0, 'the P&L model\'s checks all hold and the card renders its ' + N.plRows.length + ' rows');
  check(r2(N.difference - B.difference) === r2((N.nvac - B.nvac) + (N.charged - B.charged) - (N.cost - B.cost)), `the job difference moves by exactly GN20's hire, the fence charge and the fence cost: ${B.difference} -> ${N.difference}`);
  check(/re-added as GN20-A/.test(N.gn20note) && !/never came/.test(N.gn20note), 'the register\'s GN20 entry says where the set went');
  check(/ · v12\.16$/.test(N.footer.trim()), 'footer ' + N.footer.trim().slice(-12));
  check(errs.build === 0 && blocked.build === 0, `build: ${errs.build} page errors, ${blocked.build} record writes`);
  console.log('P&L card, base :', JSON.stringify(B.plRows));
  console.log('P&L card, build:', JSON.stringify(N.plRows));
  console.log(`${pass}/${pass + fail} ${MOB ? 'phone' : 'desktop'}`);
  process.exit(fail ? 1 : 0);
})();
