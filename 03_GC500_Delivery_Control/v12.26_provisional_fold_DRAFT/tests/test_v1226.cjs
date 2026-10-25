// Author: Andrew Fisher. v12.26 (v12.22 with provisional lines folded) - figures first on the Costs cards. Opens the live page (base) and the build side by side on the
// Costs tab, reading the live record (read only), and holds the build to: every figure unchanged; on the Forecast P&L, Transport
// Revenue and Rehire by branch the explanations hidden until "Show the workings", and all back after it; "Not in it yet" grouped
// and short with the full list kept; the visible text much shorter.
//   BASE=<live page> BUILD=<build> [MOB=1] node test_v1226.cjs
'use strict';
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page'));
const MOB = process.env.MOB === '1';
const read = () => {
  const vis = el => { let n = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
    while ((t = w.nextNode())) { let p = t.parentElement, hidden = false; while (p && p !== el.parentElement) { if (getComputedStyle(p).display === 'none') { hidden = true; break; } p = p.parentElement; }
      if (!hidden) n += t.textContent.replace(/\s+/g, ' ').trim().length; } return n; };
  const shown = el => !!el && getComputedStyle(el).display !== 'none';
  const card = id => document.getElementById(id);
  const P = card('pl752'), T = card('buildingTransport831'), R = card('rehire766');
  const M = moneySummary(), PL = pl770Model(), fd = fenceDerived(), RH = rh766Model();
  const state = () => ({
    pl: P ? {cls: P.className, smallShown: [...P.querySelectorAll('.pl-lb > small')].filter(shown).length, small: P.querySelectorAll('.pl-lb > small').length, vis: vis(P),
      shortShown: shown(P.querySelector('.pl-missing-short1220')), fullShown: shown(P.querySelector('.pl-missing-full1220')) || (!P.querySelector('.pl-missing-full1220') && shown(P.querySelector('ul.pl-missing')))} : null,
    tr: T ? {cls: T.className, basisShown: shown(T.querySelector('.fin745-basis')), vis: vis(T)} : null,
    rh: R ? {cls: R.className, basisShown: [...R.querySelectorAll('.rh766-basis')].filter(shown).length, basis: R.querySelectorAll('.rh766-basis').length, metricSmall: [...R.querySelectorAll('.fin745-metric small')].filter(shown).length, vis: vis(R)} : null});
  const before = state();
  const lists = P ? {full: [...P.querySelectorAll((P.querySelector('.pl-missing-full1220') ? '.pl-missing-full1220' : 'ul.pl-missing') + ' > li')].map(li => li.textContent.trim()),
    short: [...P.querySelectorAll('.pl-missing-short1220 > li')].map(li => li.textContent.trim())} : null;
  const figures = {
    plAmts: P ? [...P.querySelectorAll('.pl-amt')].map(e => e.textContent.trim()) : [], plLabels: P ? [...P.querySelectorAll('.pl-lb')].map(e => (e.firstChild && e.firstChild.textContent || '').trim()) : [],
    trSummaries: T ? [...T.querySelectorAll('summary')].map(e => e.textContent.trim()) : [],
    rhNums: R ? [...R.querySelectorAll('td.num')].map(td => [...td.childNodes].filter(n => !(n.nodeType === 1 && n.classList.contains('acc761-w'))).map(n => n.textContent).join('').trim()) : []};
  const btns = [...document.querySelectorAll('[data-work1220]')].map(b => [b.getAttribute('data-work1220'), b.textContent.trim(), b.getAttribute('aria-expanded')]);
  document.querySelectorAll('[data-work1220]').forEach(b => b.click());
  const after = state(), btnsAfter = [...document.querySelectorAll('[data-work1220]')].map(b => [b.getAttribute('data-work1220'), b.textContent.trim(), b.getAttribute('aria-expanded')]);
  document.querySelectorAll('[data-work1220]').forEach(b => b.click());
  const again = state();
  return {money: {total: M.charge.total, known: M.cost.known != null ? M.cost.known : null, diff0: M.difference0, diff: M.difference, revJob: PL.revJob, directJob: PL.directJob, charged: fd.charged, cost: fd.cost,
      rh: RH && RH.total ? [RH.total.revJob, RH.total.costJob] : null},
    before, after, again, lists, figures, btns, btnsAfter, footer: (document.getElementById('footL') || {}).textContent || ''};
};
(async () => {
  const res = {}, errs = {}, blocked = {};
  for (const [tag, file] of [['base', process.env.BASE], ['build', process.env.BUILD]]) {
    const s = await open({pageFile: file, hash: '#costs', W: MOB ? 390 : 1440, H: MOB ? 844 : 1000, mobile: MOB});
    try {
      await s.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
      await s.page.waitForFunction(() => document.querySelector('#pl752') && document.querySelector('#rehire766') && document.querySelector('#buildingTransport831'), null, {timeout: 60000});
      await s.page.waitForTimeout(2500);
      res[tag] = await s.page.evaluate(read);
    } catch (e) { res[tag] = {err: String(e).slice(0, 300)}; }
    errs[tag] = s.errors.length; blocked[tag] = s.counts.blocked;
    await s.browser.close();
  }
  const B = res.base, N = res.build; let pass = 0, fail = 0;
  const check = (ok, what) => { console.log((ok ? 'PASS ' : 'FAIL ') + what); ok ? pass++ : fail++; };
  if (B.err || N.err) { console.log('could not read', B.err || '', N.err || ''); process.exit(1); }
  check(JSON.stringify(N.money) === JSON.stringify(B.money), 'every money figure unchanged: ' + JSON.stringify(N.money));
  check(JSON.stringify(N.figures) === JSON.stringify(B.figures), `the cards' figures unchanged (${N.figures.plAmts.length} P&L amounts, ${N.figures.trSummaries.length} transport groups, ${N.figures.rhNums.length} rehire cells)`);
  const ids = N.btns.map(b => b[0]).sort().join(',');
  check(ids === 'pl752,rehire766,transport831' && N.btns.every(b => b[1] === 'Show the workings' && b[2] === 'false') && /figures1220/.test(N.before.pl.cls) && /figures1220/.test(N.before.tr.cls) && /figures1220/.test(N.before.rh.cls),
    'each card carries its "Show the workings" button: ' + JSON.stringify(N.btns));
  check(N.before.pl.smallShown === 0 && N.before.pl.small > 0 && N.before.pl.shortShown && !N.before.pl.fullShown && !N.before.tr.basisShown && N.before.rh.basisShown === 0 && N.before.rh.metricSmall === 0,
    `by default the workings are folded away (P&L notes 0 of ${N.before.pl.small} shown; transport and rehire basis hidden; short list shown)`);
  check(N.after.pl.smallShown === N.after.pl.small && !N.after.pl.shortShown && N.after.pl.fullShown && N.after.tr.basisShown && N.after.rh.basisShown === N.after.rh.basis && N.btnsAfter.every(b => b[1] === 'Hide the workings' && b[2] === 'true'),
    'after "Show the workings" every note, basis and the full list are back');
  check(N.again.pl.smallShown === 0 && N.again.pl.shortShown && !N.again.tr.basisShown && N.again.rh.basisShown === 0, 'and they fold away again');
  check(JSON.stringify(N.lists.full) === JSON.stringify(B.lists.full), `"Not in it yet": the full list is the base list, ${N.lists.full.length} lines`);
  const barrier = N.lists.short.find(t => /^(Provisional: )?\d+ × /.test(t));
  check(N.lists.short.length < N.lists.full.length && N.lists.short.every(t => t.length <= 175) && (!B.lists.full.some(t => /^(Provisional: )?WB0\d · /.test(t)) || !!barrier),
    `short list ${N.lists.short.length} lines (from ${N.lists.full.length}), each short; barriers: ${barrier || 'none'}`);
  const figs = s => s.match(/\$[\d,]+(?:\.\d+)?/g) || [];
  const fullText = N.lists.full.join(' | '), shortText = N.lists.short.join(' | ');
  const invented = figs(shortText).filter(f => !fullText.includes(f));
  const lost = [...new Set(N.lists.full.flatMap(t => figs(t.split(/;\s+|\.\s+/)[0])))].filter(f => !shortText.includes(f));
  const broken = N.lists.short.filter(t => /&\s*$|&(?:amp|lt|gt|quot|#\d+);/.test(t));
  check(!invented.length && !lost.length && !broken.length,
    `the short lines keep their figures (lost ${JSON.stringify(lost)}, new ${JSON.stringify(invented)}) and no character is cut (${broken.length})`);
  const r = (a, b) => Math.round(100 * a / b);
  check(N.before.pl.vis < 0.6 * B.before.pl.vis && N.before.rh.vis < 0.6 * B.before.rh.vis && N.before.tr.vis < B.before.tr.vis,
    `visible text: P&L ${r(N.before.pl.vis, B.before.pl.vis)}%, rehire ${r(N.before.rh.vis, B.before.rh.vis)}%, transport ${r(N.before.tr.vis, B.before.tr.vis)}% of before`);
  check(N.after.pl.vis >= 0.97 * B.before.pl.vis && N.after.rh.vis >= 0.97 * B.before.rh.vis && N.after.tr.vis >= 0.97 * B.before.tr.vis, 'with the workings shown, the text is all there again');
  check(/ · v12\.26$/.test(N.footer.trim()), 'footer ' + N.footer.trim().slice(-12));
  check(errs.build === 0 && blocked.build === 0, `build: ${errs.build} page errors, ${blocked.build} record writes`);
  console.log('short list:', JSON.stringify(N.lists.short));
  console.log(`${pass}/${pass + fail} ${MOB ? 'phone' : 'desktop'}`);
  process.exit(fail ? 1 : 0);
})();
