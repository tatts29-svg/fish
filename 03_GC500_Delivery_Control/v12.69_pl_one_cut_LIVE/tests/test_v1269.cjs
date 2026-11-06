// Author: Andrew Fisher. v12.69 on the real Costs & P&L tab, reading the live record, writing nothing: the face is three tiles,
// revenue in plain words, one cost table under the eight categories, by-branch cards, Not in it yet, then three closed folds; every
// figure the page's own models' to the cent; one difference so far on the face, At a glance, the Forecast P&L, the Forecast P&L by
// branch and "Are we making money?"; the reconciliation card still ties; every old card still on the page with its buttons.
//   PAGE=build/GC500_v12.69/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_v1269.cjs
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
    await p.waitForFunction(() => document.getElementById('pl1267') && document.getElementById('pl1267-work'), null, {timeout: 60000});
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const txt = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
      const Mo = holdAssets(() => PL1267.model());
      const P = holdAssets(() => pl770Model()), M = holdAssets(() => moneySummary()), F = holdAssets(() => fh866Model()), X = holdAssets(() => cj764Model());
      const LH = holdAssets(() => labourHireSoFar1267(todayIso()));
      const R = holdAssets(() => recon888Model());
      const pane = document.getElementById('pane-costs');
      const kids = [...pane.children].map(e => e.id || e.className.toString().split(' ')[0]);
      const tiles = [...document.querySelectorAll('#pl1267 .pl1267-tile')].map(t => ({l: txt(t.querySelector('.pl1267-tl')), v: txt(t.querySelector('.pl1267-tv')), s: txt(t.querySelector('.pl1267-ts'))}));
      const rows = sel => [...document.querySelectorAll(sel + ' tbody tr')].map(tr => ({cls: tr.className, cells: [...tr.children].map(td => txt(td))}));
      const rev = rows('#pl1267-rev table'), cost = rows('#pl1267-cost table');
      const find = (rs, name) => rs.find(x => x.cells.length === 3 && x.cells[0].startsWith(name));
      const work = document.getElementById('pl1267-work'), fence = document.getElementById('pl1267-fence'), fin = document.getElementById('pl1267-finance');
      const inWork = id => !!(work && work.querySelector('#' + CSS.escape(id)));
      const prose = [...document.querySelectorAll('#pl1267 p, #pl1267-rev p, #pl1267-cost p, #pl1267-branch p, #pl1267-gaps p')].filter(x => !x.classList.contains('fin745-eyebrow') && !x.classList.contains('pl1267-foot')).map(x => txt(x)).filter(Boolean);
      /* the legacy cards: read from the pane where this layout draws them, else from the card's own renderer (a pure function of
         the models), so the one-difference check holds whatever the pane's layout mode */
      const rendered = (id, fn) => { const el = document.getElementById(id); if (el) return {el, where: 'pane'}; const d = document.createElement('div'); d.innerHTML = fn(); return {el: d, where: 'rendered'}; };
      const G = rendered('costs765', () => cj765Glance()), MC = rendered('moneyCard', () => marginCard());
      const P752 = (() => { const d = document.createElement('div'); d.innerHTML = pl752Card(); return {el: d, where: 'rendered'}; })();
      const glanceDiff = [...G.el.querySelectorAll('.cj765-tile')].map(t => txt(t)).find(t => /^Difference/.test(t)) || null;
      /* the Forecast P&L in the business's lines: its card is re-drawn by the all-in statement on this page, so read its own renderer */
      const d770 = document.createElement('div'); d770.innerHTML = pl770Card();
      const pl770Diff = txt([...d770.querySelectorAll('.fin745-metric')].find(x => /Difference so far/.test(txt(x))));
      /* the all-in statement that stands in #pl770: every "Difference so far" it prints on the current record */
      const allIn = [...document.querySelectorAll('#pl770 tr')].map(tr => txt(tr)).filter(t => /Difference/.test(t)).slice(0, 6);
      /* the figure before the change must appear nowhere on the pane except the streams table that lays the arithmetic out */
      const oldHits = [...pane.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.textContent.includes(money(M.difference_before1267)) || e.textContent.includes(money0(M.difference0_before1267))) && !e.closest('#moneyCard')).map(e => txt(e).slice(0, 120)).slice(0, 5);
      const pl752Kpi = txt([...P752.el.querySelectorAll('.pl-kpi')].find(x => /Difference so far/.test(txt(x))));
      const moneyKpi = txt([...MC.el.querySelectorAll('.kpi')].find(x => /Difference so far/.test(txt(x))));
      const moneyRows = [...MC.el.querySelectorAll('table.streamtbl tr.total')].map(tr => txt(tr));
      const where = {glance: G.where, pl752: P752.where, money: MC.where};
      const branches = [...document.querySelectorAll('#pl1267-branch .pl1267-br')].map(b => ({h: txt(b.querySelector('.pl1267-bb')), r: [...b.querySelectorAll('.pl1267-r span:last-child')].map(txt)}));
      const ledgerRows = rows('#pl1267-finance table.pl1267-ltbl');
      return {
        ok: Mo.ok, checks: Mo.checks, ties: pane.getAttribute('data-pl1267'), kids, tiles, rev, cost, branches, ledgerRows: ledgerRows.length,
        face: {revNow: Mo.revNow, revJob: Mo.revJob, costNow: Mo.costNow, costJob: Mo.costJob, diffNow: Mo.diffNow, diffJob: Mo.diffJob, groups: Mo.groups.map(g => g.name), gaps: Mo.gaps.length},
        model: {revNow: P.revNow, revJob: P.revJob, total: M.charge.total, known: M.cost.known, difference: M.difference, before: M.difference_before1267, d0: M.difference0, d0before: M.difference0_before1267, diffJob: P.diff.job, diffNow: P.diff.now, handToDate: F.costTotal && F.costTotal.toDate, plJob: F.plJob, wagesToDate: X.wages.toDate, hireStream: (F.costs.find(c => /labour hire/i.test(c.stream)) || {}).toDate, gaps: X.gaps.length, lhKnown: LH.known, lhJob: LH.job, lhCost: M.cost.labour_hire1267, revB: F.inv.map(x => [x.branch, x.job])},
        recon: {ok: R.ok, bad: R.bad, count: R.count, badTies: (R.ties || []).filter(t => !t.ok).map(t => t.what).slice(0, 5)},
        cells: {revTot: find(rev, 'Charged to the V8s'), costTot: find(cost, 'What it costs us'), diff: find(cost, 'Difference so far'), hire: find(cost, 'The hired-in people'), wages: find(cost, 'Coates wages')},
        legacy: {glanceDiff, pl770Diff, pl752Kpi, moneyKpi, moneyRows, allIn, oldHits, where, paneMode: pane.className},
        workOpen: work.open, fenceOpen: fence ? fence.open : null, finOpen: fin ? fin.open : null, workCount: work.children.length - 1,
        oldCards: {pl770: inWork('pl770'), recon: inWork('recon888'), charge: inWork('charge1224'), lock: inWork('lock1049'), align: inWork('align1055'), fin745: inWork('finance745') || !!work.querySelector('.costs-audit-fold'), monthEnd: inWork('cj765monthend'), sources: inWork('cj765detail'), fence: !!(fence && fence.querySelector('#fence-allin12423'))},
        buttons: work.querySelectorAll('button').length, gaps: document.querySelectorAll('#pl1267-gaps li').length, prose, pl1262: !!document.getElementById('pl1262'),
        tableOverflow: [...document.querySelectorAll('#pl1267-rev .tblwrap, #pl1267-cost .tblwrap')].map(w => w.scrollWidth - w.clientWidth),
        colsSeen: [...document.querySelectorAll('#pl1267-rev th, #pl1267-cost th')].map(th => { const b = th.getBoundingClientRect(); return b.right <= document.documentElement.clientWidth + 1; }),
        scrollW: document.documentElement.scrollWidth, docWidth: document.documentElement.clientWidth
      };
    });
    const money2 = s => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;
    const same = (a, b) => Math.abs(money2(a) - b) < 0.006;
    const first$ = s => (String(s).match(/-?\$[\d,]+(?:\.\d\d)?/) || [''])[0];
    const r2 = n => Math.round(n * 100) / 100;
    const m = r.model;
    check(r.ok && r.ties === 'ties', 'the face ties on every check: ' + JSON.stringify(r.checks));
    check(!r.pl1262, 'the v12.65 face is gone');
    check(r.kids.join(',').endsWith('pl1267,pl1267-rev,pl1267-cost,pl1267-branch,pl1267-gaps,pl1267-finance,pl1267-fence,pl1267-work'), 'order: tiles, revenue, costs, branches, not in it yet, Finance’s lines, fencing, Workings: ' + r.kids.join(','));
    check(!r.workOpen && (r.fenceOpen === null || !r.fenceOpen) && r.finOpen === false, 'the three folds start closed');
    /* one model, one difference */
    check(same(m.before - m.difference, m.lhKnown) && m.lhKnown > 0, 'the difference so far is the Forecast P&L’s less the labour hire so far: ' + m.before + ' - ' + m.lhKnown + ' = ' + m.difference);
    check(Math.abs(m.lhKnown - m.wagesToDate) < 0.006 && Math.abs(m.lhKnown - m.hireStream) < 0.006, 'the labour hire so far is Costs to job end’s and the Finance handover’s figure: ' + [m.lhKnown, m.wagesToDate, m.hireStream].join(' / '));
    check(m.d0 === m.d0before - Math.round(m.lhKnown), 'the printed-dollar difference moves by the same labour hire');
    check(Math.abs(m.diffNow - m.difference) < 0.006, 'the Forecast P&L in the business’s lines reads the same difference so far');
    check(same(r.face.diffNow, m.difference) && same(r.face.diffNow, r2(m.total - m.handToDate)), 'the face’s difference so far = revenue less the Finance handover’s costs to date = the Forecast P&L’s difference: ' + r.face.diffNow);
    check(same(r.face.diffJob, m.diffJob), 'the face’s difference at job end is the Forecast P&L’s: ' + r.face.diffJob + ' vs ' + m.diffJob);
    check(same(r.face.costNow, m.handToDate) && same(r.face.costJob, m.plJob), 'what it costs us is the Finance handover’s to the cent: ' + r.face.costNow + ' / ' + r.face.costJob);
    check(same(r.face.revNow, m.revNow) && same(r.face.revNow, m.total) && same(r.face.revJob, m.revJob), 'charged to the V8s is the Forecast P&L’s revenue: ' + r.face.revNow + ' / ' + r.face.revJob);
    /* the tiles and the tables show those figures */
    check(r.tiles.length === 3 && same(first$(r.tiles[0].v), m.revNow) && same(first$(r.tiles[1].v), m.handToDate) && same(first$(r.tiles[2].v), m.difference), 'the three tiles: ' + JSON.stringify(r.tiles.map(t => t.v)));
    check(same(first$(r.tiles[0].s), m.revJob) && same(first$(r.tiles[1].s), m.plJob) && same(first$(r.tiles[2].s), m.diffJob), 'job end under each tile: ' + JSON.stringify(r.tiles.map(t => t.s)));
    check(r.cells.revTot && same(r.cells.revTot.cells[1], m.revNow) && same(r.cells.revTot.cells[2], m.revJob), 'the revenue table foots to the tile: ' + JSON.stringify(r.cells.revTot));
    check(r.cells.costTot && same(r.cells.costTot.cells[1], m.handToDate) && same(r.cells.costTot.cells[2], m.plJob), 'the cost table foots to the tile: ' + JSON.stringify(r.cells.costTot));
    check(r.cells.diff && same(first$(r.cells.diff.cells[1]), m.difference) && same(first$(r.cells.diff.cells[2]), m.diffJob), 'the difference row: ' + JSON.stringify(r.cells.diff));
    check(r.cells.hire && same(r.cells.hire.cells[1], m.lhKnown), 'the hired-in people’s line is the labour hire so far: ' + JSON.stringify(r.cells.hire));
    check(r.cells.wages && / h$/.test(r.cells.wages.cells[1]) && / h$/.test(r.cells.wages.cells[2]), 'Coates wages are hours only on the face: ' + JSON.stringify(r.cells.wages));
    const lineSum = side => r.cost.filter(x => x.cells.length === 3 && !/^(What it costs us|Difference so far)/.test(x.cells[0]) && !/ h$/.test(x.cells[side])).reduce((t, x) => t + money2(x.cells[side]), 0);
    check(Math.abs(lineSum(1) - m.handToDate) < 0.05 && Math.abs(lineSum(2) - m.plJob) < 0.05, 'the cost lines add to the total so far and at job end: ' + lineSum(1) + ' / ' + lineSum(2));
    check(r.face.groups.length >= 5 && r.face.groups.every(g => /fencing|contractor|Rehire|Internal labour|other event/i.test(g)), 'the groups are management’s categories: ' + r.face.groups.join(' | '));
    /* by branch */
    check(r.branches.length === 5 && r.branches[4].h === 'THE JOB' && same(r.branches[4].r[0], m.revJob) && same(r.branches[4].r[1], m.plJob) && same(r.branches[4].r[2], m.diffJob), 'the job card foots to the models: ' + JSON.stringify(r.branches[4]));
    const sumB = i => r.branches.slice(0, 4).reduce((t, b) => t + money2(b.r[i]), 0);
    check(Math.abs(sumB(0) - m.revJob) < 0.05 && Math.abs(sumB(1) - m.plJob) < 0.05 && Math.abs(sumB(2) - m.diffJob) < 0.05, 'the four branches add to the job on every row');
    check(r.branches.slice(0, 4).every(b => / · /.test(b.h)), 'every branch card names its branch: ' + r.branches.map(b => b.h).join(' | '));
    /* the legacy cards show the one difference */
    check(r.legacy.glanceDiff && same(first$(r.legacy.glanceDiff.replace(/^Difference/, '')), m.difference) && /labour hire/.test(r.legacy.glanceDiff), 'At a glance shows the same difference and says labour hire: ' + r.legacy.glanceDiff);
    /* the Forecast P&L's own Difference card is re-drawn by the all-in statement on this page; where it renders it must agree, and
       the all-in statement shows the job-end difference the face shows */
    check(!r.legacy.pl770Diff || (same(first$(r.legacy.pl770Diff.replace(/^Difference so far[^$]*/, '')), m.difference) && /labour hire/.test(r.legacy.pl770Diff)), 'the Forecast P&L’s Difference card, where drawn, shows the same difference: ' + r.legacy.pl770Diff);
    check(r.legacy.allIn.some(t => /Difference/.test(t) && same(first$(t), m.diffJob)), 'the all-in statement shows the same difference at job end: ' + r.legacy.allIn.join(' || '));
    check(r.legacy.oldHits.length === 0, 'the figure before the change appears nowhere on the pane: ' + JSON.stringify(r.legacy.oldHits));
    check(r.legacy.pl752Kpi && same(first$(r.legacy.pl752Kpi), m.d0) && /after labour hire/.test(r.legacy.pl752Kpi), 'the Forecast P&L by branch KPI shows the printed-dollar difference after labour hire: ' + r.legacy.pl752Kpi);
    check(r.legacy.moneyKpi && same(first$(r.legacy.moneyKpi), m.d0), 'Are we making money? shows the same printed-dollar difference: ' + r.legacy.moneyKpi);
    check(r.legacy.moneyRows.length === 3 && /before labour hire/.test(r.legacy.moneyRows[0]) && /Labour hire/.test(r.legacy.moneyRows[1]) && /after labour hire/.test(r.legacy.moneyRows[2]) && same(first$(r.legacy.moneyRows[2]), m.d0), 'the streams table lays the arithmetic out: ' + r.legacy.moneyRows.join(' || '));
    check(r.recon.ok === true && r.recon.bad === 0 && r.recon.count > 0, 'Everything reconciles still ties on every check: ' + JSON.stringify(r.recon));
    /* the folds hold everything that was there */
    check(Object.values(r.oldCards).every(Boolean), 'every old card is still on the page, inside the folds: ' + JSON.stringify(r.oldCards));
    check(r.buttons > 10, 'the old cards keep their buttons: ' + r.buttons);
    check(r.ledgerRows > 12, 'Finance’s lines hold the ledger tables: ' + r.ledgerRows + ' rows');
    check(r.gaps === m.gaps + 1 && r.gaps > 1, '"Not in it yet" lists the model’s gaps and the Coates wages line: ' + r.gaps);
    check(r.prose.length === 0, 'no sentence on the face: ' + JSON.stringify(r.prose));
    check(r.scrollW <= r.docWidth + 1, 'no sideways page scroll (' + r.scrollW + ' vs ' + r.docWidth + ')');
    check(r.tableOverflow.length === 2 && r.tableOverflow.every(x => x <= 1) && r.colsSeen.length === 6 && r.colsSeen.every(Boolean), 'the revenue and cost tables fit the screen, So far and Job end in view: ' + JSON.stringify(r.tableOverflow) + ' ' + JSON.stringify(r.colsSeen));
    check(s.errors.length === 0 && cons.length === 0, 'no page errors or console errors: ' + JSON.stringify(s.errors.slice(0, 2)) + JSON.stringify(cons.slice(0, 2)));
    check(s.counts.blocked === 0, 'no write attempted: ' + s.counts.blocked);
    lines.push(`v12.69 ${tag}: ${checks}/${checks} checks passed`, 'model: ' + JSON.stringify(m), 'tiles: ' + JSON.stringify(r.tiles), 'revenue: ' + r.rev.map(x => x.cells.join(' | ')).join('\n  '), 'costs: ' + r.cost.map(x => x.cells.join(' | ')).join('\n  '), 'branches: ' + JSON.stringify(r.branches), 'legacy: ' + JSON.stringify(r.legacy), 'recon: ' + JSON.stringify(r.recon));
    if (dir) {
      fs.mkdirSync(dir, {recursive: true});
      await p.screenshot({path: path.join(dir, `pl_${tag}.png`), fullPage: !mobile});
      await p.evaluate(() => { const f = document.getElementById('pl1267-finance'); if (f) f.open = true; });
      await p.waitForTimeout(500);
      await p.screenshot({path: path.join(dir, `pl_${tag}_finance_open.png`), fullPage: !mobile});
      await p.evaluate(() => { const f = document.getElementById('pl1267-finance'); if (f) f.open = false; const w = document.getElementById('pl1267-work'); if (w) w.open = true; const g = document.getElementById('costs765'); if (g) g.scrollIntoView(); });
      await p.waitForTimeout(600);
      await p.screenshot({path: path.join(dir, `pl_${tag}_workings_glance.png`)});
      fs.writeFileSync(path.join(dir, `test_${tag}.txt`), lines.join('\n') + '\n');
    }
    console.log(lines[0]);
  } catch (e) {
    console.error(`v12.69 ${tag}: FAILED after ${checks} checks: ${e.message}`); process.exitCode = 1;
    if (dir) { try { fs.mkdirSync(dir, {recursive: true}); await p.screenshot({path: path.join(dir, `pl_${tag}_FAILED.png`)}); } catch (_) {} }
  } finally { await s.browser.close(); }
})();
