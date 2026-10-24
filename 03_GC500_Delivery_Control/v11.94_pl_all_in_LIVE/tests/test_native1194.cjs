// Author: Andrew Fisher. v11.94 on the real Costs tab, reading the live record, writing nothing: the P&L card all in, every figure
// the page's own models' to the cent, fencing the only figure still to come, what is not in it yet named; across Costs the old
// "Additional forecast" / "Job forecast" wording is gone.
//   PAGE=build/GC500_v11.94/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1194.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 120000});
    await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; applyCapability(); go('costs'); });
    await p.waitForFunction(() => document.querySelector('#pl770[data-pl1194]'), null, {timeout: 60000});
    await p.waitForTimeout(2500);
    const r = await p.evaluate(mob => {
      let model; holdAssets(() => { const P = pl770Model(), X = cj764Model(), C = branchFinancial978(pl752Rows(), moneySummary()).total;
        const m = {rev: P.rev, cost: P.cost, revJob: P.revJob, directJob: P.directJob, wagesJob: P.wages.job, overJob: P.overJob, differenceJob: C.contributionJob,
          fenceRevenue: X.fencing.revenue, fenceCost: X.fencing.cost, hoursText: fmtNum(P.wages.hoursOnly || 0)};
        model = {rows: PL1194.rows(m), ok: PL1194.checks(m), gaps: (X.gaps || []).map(g => g.what), fence: X.fencing, hours: m.hoursText}; });
      const sec = document.getElementById('pl770'), desk = sec.querySelector(':scope > .branch978-desktop'), mobile = sec.querySelector(':scope > .branch978-mobile');
      const head = [...desk.querySelectorAll('thead th')].map(th => th.textContent.trim());
      const shown = [...desk.querySelectorAll('tbody tr')].filter(tr => tr.children.length === 3).map(tr => [tr.children[0].textContent.replace(/\s+/g, ' ').trim(), tr.children[1].textContent.trim(), tr.children[2].textContent.trim()]);
      const want = model.rows.filter(x => x.label && !x.text).map(x => [x.label + (x.pct != null ? ' ' + (x.pct * 100).toFixed(1) + '%' : ''), money(x.job), x.fence ? money(x.fence) : '—']);
      const pane = document.getElementById('pane-costs'), leaves = [...pane.querySelectorAll('th,td,span,b,h2,h3,h4,dt')].filter(n => !n.children.length).map(n => n.textContent.trim());
      const cards = [...mobile.querySelectorAll('.pl1194-card')].map(c => c.innerText.replace(/\s+/g, ' ').trim());
      return {model: {ok: model.ok, gaps: model.gaps, fence: [model.fence.revenue, model.fence.cost], hours: model.hours}, title: sec.querySelector('#pl770Title').textContent, basis: (sec.querySelector('[data-pnl981-basis]') || {}).textContent,
        head, shown, want, not: (sec.querySelector('.pl1194-not') || {}).textContent || '', dts: [...sec.querySelectorAll('dl > dt')].map(d => d.textContent.trim()),
        oldWords: leaves.filter(t => t === 'Additional forecast' || t === 'Job forecast').length, rest: leaves.filter(t => t === 'Rest of the job').length, total: leaves.filter(t => t === 'Job total').length,
        deskShown: getComputedStyle(desk).display !== 'none', mobShown: getComputedStyle(mobile).display !== 'none', cards: cards.length, fencedCards: cards.filter(c => /fencing still to come/.test(c)).length,
        over: document.documentElement.scrollWidth > innerWidth + 1};
    }, mobile);
    check(r.model.ok.all, 'the page\'s own figures tie to the cent: ' + JSON.stringify(r.model.ok));
    check(r.title === 'Whole-job P&L · all in' && /^All in · every line to job end, demob included/.test(r.basis), 'the card: "' + r.title + '" · ' + r.basis);
    check(JSON.stringify(r.head) === JSON.stringify(['GC500', 'Job total · all in', 'Of which · fencing still to come']), 'the columns: ' + r.head.join(' | '));
    check(r.shown.length === r.want.length && r.shown.every((row, k) => JSON.stringify(row) === JSON.stringify(r.want[k])), 'every row on the screen is the models\' figure to the cent (' + r.shown.length + ' rows)');
    const fenced = r.shown.filter(x => x[2] !== '—').map(x => x[0].replace(/ \d+\.\d%$/, ''));
    check(JSON.stringify(fenced) === JSON.stringify(['Rehire Revenue', 'Total Revenue', 'Rehire', 'Total Direct Costs', 'Gross Margin · all in', 'Difference · all in, not a margin yet']), 'fencing is the only figure still to come: ' + fenced.join(', '));
    check(r.model.fence[0] === 26522.4 && r.model.fence[1] === 10350, 'fencing still to come today: $26,522.40 Revenue, $10,350.00 cost');
    check(r.model.gaps.length > 0 && r.model.gaps.every(g => r.not.includes(g)) && r.not.includes('Coates wages and salary, ' + r.model.hours + ' h, hours only'), 'not in it yet, named: ' + r.not.slice(0, 160) + '…');
    check(['Current record', 'Job total · all in', 'Of which · fencing still to come', 'Gross Margin · all in', 'Difference · all in'].every(d => r.dts.includes(d)), 'the definitions say what all in and fencing still to come mean');
    check(r.oldWords === 0 && r.rest > 0 && r.total > 0, 'across Costs: no "Additional forecast" or "Job forecast" left; "Rest of the job" ×' + r.rest + ', "Job total" ×' + r.total);
    check(mobile ? (r.mobShown && !r.deskShown && r.cards >= 14 && r.fencedCards === 6) : (r.deskShown && !r.mobShown), mobile ? 'phone: ' + r.cards + ' cards, fencing on ' + r.fencedCards : 'desktop: the table');
    check(!r.over, 'no sideways scroll');
    if (dir) { fs.mkdirSync(dir, {recursive: true});
      await p.evaluate(() => { const m = document.querySelector('main'), sec = document.getElementById('pl770'); m.scrollTop += sec.getBoundingClientRect().top - m.getBoundingClientRect().top - 8; });
      await p.waitForTimeout(700); await p.screenshot({path: path.join(dir, tag + '-pl-all-in.png')});
      await p.evaluate(() => { const m = document.querySelector('main'), n = document.querySelector('#pl770 .pl1194-not'); m.scrollTop += n.getBoundingClientRect().top - m.getBoundingClientRect().top - 420; });
      await p.waitForTimeout(500); await p.screenshot({path: path.join(dir, tag + '-pl-foot.png')}); }
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, rows: r.shown.length, fence: r.model.fence}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v11.94 native: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
