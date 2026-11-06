// Author: Andrew Fisher. v12.65 on the real Costs & P&L tab, reading the live record, writing nothing: the face is the P&L in
// Coates lines (whole job, then by branch), "Not in it yet", and two closed folds (Fencing, everything included; Workings);
// every figure the page's own models' to the cent; the branches foot to the job; every old card still on the page, inside the
// folds, with its buttons; no page errors, no writes.
//   PAGE=build/GC500_v12.65/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_v1265.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, hash: '#costs'}), p = s.page;
  const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const lines = [];
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1262') && document.getElementById('pl1262-work'), null, {timeout: 60000});
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const money2 = s => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;
      const Mo = holdAssets(() => PL1262.model());
      const P = holdAssets(() => pl770Model()), M = holdAssets(() => moneySummary()), F = holdAssets(() => fh866Model()), X = holdAssets(() => cj764Model());
      const pane = document.getElementById('pane-costs'), sec = document.getElementById('pl1262');
      const kids = [...pane.children].map(e => e.id || e.className.toString().split(' ')[0]);
      const tables = [...sec.querySelectorAll('table')];
      const rows = t => [...t.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent.replace(/\s+/g, ' ').trim()));
      const t1 = rows(tables[0]), t2 = rows(tables[1]);
      /* a total row has four cells and the name in the second; the section headings are one wide cell */
      const find = (rs, name) => rs.find(x => x.length >= 4 && x[1] === name) || rs.find(x => x.length >= 4 && x[0] === name) || rs.find(x => x.length >= 4 && (x[1] || '').startsWith(name));
      const work = document.getElementById('pl1262-work'), fence = document.getElementById('pl1262-fence');
      const inWork = id => !!(work && work.querySelector('#' + CSS.escape(id)));
      const prose = [...sec.querySelectorAll('p')].filter(x => !x.classList.contains('fin745-eyebrow') && !x.classList.contains('pl1262-foot')).map(x => x.textContent.trim()).filter(Boolean);
      return {
        ok: Mo.ok, checks: Mo.checks, ties: pane.getAttribute('data-pl1262'), kids, t1, t2,
        model: {revNow: P.revNow, revJob: P.revJob, direct: P.direct, directJob: P.directJob, gmNow: P.gm.now, gmJob: P.gm.job, diffJob: P.diff.job, wagesJob: P.wages.job, overJob: P.overJob, plJob: F.plJob, gaps: (X.gaps || []).length, revB: F.inv.map(x => [x.branch, x.job])},
        cells: {revenue: find(t1, 'Revenue'), cos: find(t1, 'Cost of sales'), gm: find(t1, 'Gross margin'), contrib: find(t1, 'Contribution'), op: find(t1, 'Operating costs')},
        branch: {rev: find(t2, 'Revenue · job end'), costs: find(t2, 'Costs · job end'), contrib: find(t2, 'Contribution · job end'), head: [...tables[1].querySelectorAll('thead th')].map(th => th.textContent.trim())},
        workOpen: work.open, fenceOpen: fence ? fence.open : null, workCount: work.children.length - 1,
        oldCards: {pl770: inWork('pl770'), recon: inWork('recon888'), charge: inWork('charge1224'), lock: inWork('lock1049'), align: inWork('align1055'), fin745: inWork('finance745') || !!work.querySelector('.costs-audit-fold'), fence: !!(fence && fence.querySelector('#fence-allin12423'))},
        buttons: work.querySelectorAll('button').length, gaps: document.querySelectorAll('#pl1262-gaps li').length, prose,
        faceTop: kids.indexOf('pl1262') >= 0 && kids.indexOf('pl1262') < kids.indexOf('pl1262-work'),
        secWidth: sec.getBoundingClientRect().width, docWidth: document.documentElement.clientWidth, scrollW: document.documentElement.scrollWidth
      };
    });
    const money2 = s => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;
    const same = (a, b) => Math.abs(money2(a) - b) < 0.006;
    check(r.ok && r.ties === 'ties', 'the model ties on every check: ' + JSON.stringify(r.checks));
    check(r.faceTop, 'the P&L is above the Workings fold: ' + r.kids.join(','));
    check(r.kids.indexOf('pl1262-gaps') > r.kids.indexOf('pl1262') && r.kids.indexOf('pl1262-work') === r.kids.length - 1, 'order: P&L, Not in it yet, folds, Workings last: ' + r.kids.join(','));
    check(!r.workOpen && (r.fenceOpen === null || !r.fenceOpen), 'the folds start closed');
    check(same(r.cells.revenue[2], r.model.revNow) && same(r.cells.revenue[3], r.model.revJob), 'revenue totals are the P&L model: ' + r.cells.revenue);
    check(same(r.cells.cos[2], r.model.direct) && same(r.cells.cos[3], r.model.directJob), 'cost of sales totals are the P&L model: ' + r.cells.cos);
    check(same(r.cells.gm[2].split(' ')[0], r.model.gmNow) && same(r.cells.gm[3].split(' ')[0], r.model.gmJob), 'gross margin is the P&L model: ' + r.cells.gm);
    check(same(r.cells.contrib[3].split(' ')[0], r.model.diffJob), 'contribution to job end is the P&L difference to job end: ' + r.cells.contrib);
    check(same(r.cells.op[3], r.model.wagesJob + r.model.overJob), 'operating costs to job end = wages priced + travel, accommodation, meals: ' + r.cells.op);
    check(r.branch.head.join(',') === ',KINP,STPS,NVAC,MEAD,Job', 'branch columns: ' + r.branch.head.join(','));
    check(same(r.branch.rev[5], r.model.revJob), 'branch revenue foots to the job: ' + r.branch.rev);
    check(same(r.branch.costs[5], r.model.plJob), 'branch costs foot to the handover job total: ' + r.branch.costs);
    check(same(r.branch.contrib[5], r.model.diffJob), 'branch contribution foots to the job: ' + r.branch.contrib);
    const footBr = [1, 2, 3, 4].reduce((t, i) => t + money2(r.branch.contrib[i]), 0);
    check(Math.abs(footBr - money2(r.branch.contrib[5])) < 0.05, 'the four branch contributions add to the job column');
    check(Object.values(r.oldCards).every(Boolean), 'every old card is still on the page, inside the folds: ' + JSON.stringify(r.oldCards));
    check(r.buttons > 10, 'the old cards keep their buttons: ' + r.buttons);
    check(r.gaps === r.model.gaps && r.gaps > 0, '"Not in it yet" lists the model’s gaps: ' + r.gaps);
    check(r.prose.length === 0, 'no sentence on the face of the P&L: ' + JSON.stringify(r.prose));
    check(r.scrollW <= r.docWidth + 1, 'no sideways page scroll (' + r.scrollW + ' vs ' + r.docWidth + ')');
    check(s.errors.length === 0 && cons.length === 0, 'no page errors or console errors: ' + JSON.stringify(s.errors.slice(0, 2)) + JSON.stringify(cons.slice(0, 2)));
    check(s.counts.blocked === 0, 'no write attempted: ' + s.counts.blocked);
    lines.push(`v12.65 ${tag}: ${checks}/${checks} checks passed`, 'table 1: ' + r.t1.map(x => x.join(' | ')).join('\n  '), 'table 2: ' + r.t2.map(x => x.join(' | ')).join('\n  '));
    if (dir) {
      fs.mkdirSync(dir, {recursive: true});
      await p.screenshot({path: path.join(dir, `pl_${tag}.png`)});
      await p.evaluate(() => { const w = document.getElementById('pl1262-work'); if (w) w.open = true; });
      await p.waitForTimeout(600);
      await p.screenshot({path: path.join(dir, `pl_${tag}_workings_open.png`)});
      fs.writeFileSync(path.join(dir, `test_${tag}.txt`), lines.join('\n') + '\n');
    }
    console.log(lines[0]);
  } catch (e) {
    console.error(`v12.65 ${tag}: FAILED after ${checks} checks: ${e.message}`); process.exitCode = 1;
  } finally { await s.browser.close(); }
})();
