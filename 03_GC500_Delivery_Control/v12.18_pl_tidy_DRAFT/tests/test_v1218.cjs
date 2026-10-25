// Author: Andrew Fisher. v12.18 - the P&L tidy. Opens the live page (base) and the build side by side, reading the live
// record (read only: the harness aborts every write), and holds the build to: the fencing cost up by Advanced's receipted
// orders outside the programme weeks (order 4658850, $195) on the gear side, and nothing else in money; the charge to the
// V8s, the papers' quantities, Today and the area metres unchanged; the P&L model's checks holding and the card tying; the
// card's new wording; the job difference down by exactly that cost.
//   BASE=<live page> BUILD=<build> [MOB=1] node test_v1218.cjs
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
  const texts = desk ? [...desk.querySelectorAll('tbody tr[data-pl1194-text]')].map(tr => tr.textContent.replace(/\s+/g, ' ').trim()) : [];
  const heads = desk ? [...desk.querySelectorAll('thead th')].map(th => th.textContent.trim()) : [];
  const today = (() => { const s = todayWorkSummary848(todayIso()); const o = {}; for (const id in s.byId) o[id] = s.byId[id].done + '/' + s.byId[id].total; return o; })();
  const areas = fenceByArea(use), cleanArea = r2(areas.reduce((n, a) => n + ((a.lines.find(l => l.column === 'clean') || {}).qty || 0), 0));
  const C = branchFinancial978(pl752Rows(), M).total;
  return {
    charged: fd.charged, fenceCost: fd.cost, split: {paid: sp.paid, gear: sp.gear, labour: sp.docket_labour, green: sp.green, clean: sp.clean},
    quantities: use.map(d => d.id + ':' + JSON.stringify(d.quantities)).join('|'), perDocket: use.map(d => d.id + ':' + d.cost_total + ':' + d.paid_total).join('|'),
    difference: M.difference, contribution: C.contributionJob,
    rev: P.rev.map(r => [r.key, r.now, r.job]), plCost: P.cost.map(r => [r.key, r.now, r.job]), revJob: P.revJob, directJob: P.directJob, plChecks: P.checks,
    rehireBasis: (P.cost.find(r => r.key === 'rehire') || {}).basis || '', words: fenceOrdersWords1159(' · '),
    card: !!document.querySelector('#pl770[data-pl1194]'), plRows: rows, texts, heads,
    basisLine: ((sec && sec.querySelector('[data-pnl981-basis]')) || {}).textContent || '',
    dl: sec ? [...sec.querySelectorAll('dl > dt')].map(dt => dt.textContent.trim() + ' = ' + ((dt.nextElementSibling || {}).textContent || '').trim()) : [],
    today, cleanArea, costsFence: r2((allCosts() || []).filter(c => /^C-FD-/.test(c.id || '')).reduce((n, c) => n + (c.amount || 0), 0)),
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
  const r2 = n => Math.round(n * 100) / 100, $ = t => Number(String(t).replace(/[^0-9.-]/g, '')), ADD = 195;
  check(N.charged === B.charged && N.costsFence === N.charged && N.perDocket === B.perDocket, `charge to the V8s unchanged (${N.charged}), Costs category equal, every docket's charge and pay unchanged`);
  check(r2(N.fenceCost - B.fenceCost) === ADD && r2(N.split.gear - B.split.gear) === ADD && N.split.labour === B.split.labour && N.split.green === B.split.green && N.split.clean === true && N.split.paid === N.fenceCost,
    `fencing cost ${B.fenceCost} -> ${N.fenceCost}, on the gear side (${B.split.gear} -> ${N.split.gear}); crew and green book unchanged; the split ties`);
  check(N.quantities === B.quantities && JSON.stringify(N.today) === JSON.stringify(B.today) && N.cleanArea === B.cleanArea, 'the papers\' quantities, Today and the area metres unchanged');
  const moved = N.plCost.filter((r, i) => JSON.stringify(r) !== JSON.stringify(B.plCost[i]));
  check(JSON.stringify(N.rev) === JSON.stringify(B.rev) && moved.length === 1 && moved[0][0] === 'rehire' && r2(moved[0][1] - B.plCost.find(r => r[0] === 'rehire')[1]) === ADD && r2(moved[0][2] - B.plCost.find(r => r[0] === 'rehire')[2]) === ADD && r2(N.directJob - B.directJob) === ADD,
    `P&L: revenue unchanged; only Rehire cost moves, +${ADD} to date and to job end; direct costs ${B.directJob} -> ${N.directJob}`);
  check(N.card && Object.values(N.plChecks || {}).every(Boolean) && N.plRows.length === B.plRows.length, `the P&L card ties and renders its ${N.plRows.length} rows`);
  const diffRows = N.plRows.filter((r, i) => r.join('|') !== B.plRows[i].join('|')).map(r => r[0]);
  const delta = name => { const is = r => r[0] === name || (name !== 'Rehire' && r[0].startsWith(name)); const a = B.plRows.find(is), b = N.plRows.find(is); return a && b ? r2($(b[1]) - $(a[1])) : null; };
  check(diffRows.join('|') === 'Rehire|Total Direct Costs|Gross Margin · all in 55.5%|Difference · all in, not a margin yet' && delta('Rehire') === ADD && delta('Total Direct Costs') === ADD && delta('Gross Margin') === -ADD && delta('Difference') === -ADD,
    'card rows that move: ' + diffRows.join(', '));
  check(r2(N.difference - B.difference) === -ADD && r2(N.contribution - B.contribution) === -ADD, `job difference ${B.difference} -> ${N.difference}; branch view ${B.contribution} -> ${N.contribution}`);
  check(N.heads.join('|') === 'GC500|Job total · all in|Of which · fencing demob still to come' && N.dl.some(x => x.startsWith('Of which · fencing demob still to come = Advanced’s demob weeks') && /relocation and removal hours are not priced yet/.test(x)),
    'column head and its definition: ' + N.heads.join(' | '));
  check(/fencing’s demob is the one estimate still to come, and Advanced’s relocation and removal hours are not priced yet/.test(N.basisLine), 'card line: ' + N.basisLine);
  check(N.texts.some(t => /^Coates wages and salary\s*[\d,.]+ h · hours only, not priced$/.test(t)) && !N.texts.some(t => /project manager/.test(t)), 'wages row: ' + N.texts.join(' / '));
  check(/with Advanced’s sheet matched to the cent/.test(N.rehireBasis) && !/invoiced and matched/.test(N.rehireBasis) && /order 4658850 \$195\.00 \(receipt 4922343 · INV 93920 - partial Collection\) sits outside the programme weeks and counts at its amount/.test(N.rehireBasis),
    'Rehire basis names the sheet match and the collection');
  check(N.words.startsWith(B.words) && /4658850/.test(N.words), 'the receipted-order words keep the week orders and add the collection');
  check(/ · v12\.18$/.test(N.footer.trim()), 'footer ' + N.footer.trim().slice(-12));
  check(errs.build === 0 && blocked.build === 0, `build: ${errs.build} page errors, ${blocked.build} record writes`);
  console.log('P&L card, base :', JSON.stringify(B.plRows));
  console.log('P&L card, build:', JSON.stringify(N.plRows));
  console.log(`${pass}/${pass + fail} ${MOB ? 'phone' : 'desktop'}`);
  process.exit(fail ? 1 : 0);
})();
