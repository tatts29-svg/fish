// Author: Andrew Fisher. v12.27 - the Advanced race crew is a fencing cost on the P&L, not wages. Opens the live page (base) and the
// build one after the other on the Costs tab, reading the live record (read only), and holds the build to: the race crew's cost
// (RaceCrew1227) lands once on the P&L as a forecast (the hours are the planned roster; no race-day docket is on the record): 2142 to
// job end, Costs to job end's fencing line and the handover's fencing, with the dockets listed to confirm; direct costs known
// unchanged; it leaves the wages, people by branch and the wages note; difference to job end, revenue and every other cost line
// unchanged; every reconciliation tie to the cent.
//   BASE=<live page> BUILD=<build> [MOB=1] node test_v1227.cjs
'use strict';
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page'));
const MOB = process.env.MOB === '1';
const read = () => {
  const r2 = n => Math.round(n * 100) / 100;
  const M = moneySummary(), P = pl770Model(), X = cj764Model(), H = fh866Model(), R = recon888Model();
  const crewRows = fin745Rows(todayIso()).filter(r => Workforce1010.isPerson(r.person) && Workforce1010.DATES.includes(r.date));
  const line = (arr, key) => { const l = (arr || []).find(x => x.key === key) || {}; return {now: l.now ?? null, job: l.job ?? null, basis: String(l.basis || '')}; };
  const xrow = re => { const r = (X.rows || []).find(x => re.test(x.stream)) || {}; return {toDate: r.toDate ?? null, toCome: r.toCome ?? null, job: r.job ?? null, basis: String(r.basis || '')}; };
  const cat = key => { const c = (M.categories || []).find(x => x.key === key) || {}; return {amount: c.amount ?? null, known: !!c.known, hours: c.hours ?? null, parts: (c.parts || []).join(' | ')}; };
  const stream = key => { const s = (M.streams || []).find(x => x.key === key) || {}; return {charge: s.charge ?? null, cost: s.cost ?? null, notes: (s.notes || []).join(' | ')}; };
  const hcost = re => r2((H.costs || []).filter(c => re.test(c.stream)).reduce((s, c) => s + (c.job || 0), 0));
  let lwj = ''; try { lwj = labourWholeJob865(); } catch (e) { lwj = 'ERR ' + e.message; }
  let bf = null; try { const B = branchFinancial978(pl752Rows(), M); bf = B && B.total ? B.total : null; } catch (e) { bf = 'ERR ' + e.message; }
  let lb = null; try { const Q = (typeof questionsList === 'function' ? questionsList() : []) || []; const q = Q.find(x => x && x.id === 'lb-rates'); lb = q ? q.why : null; } catch (e) { lb = 'ERR ' + e.message; }
  const costsPane = (document.getElementById('costs') || document.body).textContent.replace(/\s+/g, ' ');
  return {
    crew: typeof RaceCrew1227 !== 'undefined' ? RaceCrew1227.model() : null,
    crewWords: typeof RaceCrew1227 !== 'undefined' ? RaceCrew1227.words(RaceCrew1227.model(), 'charge') : null,
    crewFin: {shifts: crewRows.length, hours: r2(crewRows.reduce((s, r) => s + (Number(r.paid) || 0), 0)), cost: r2(crewRows.reduce((s, r) => s + ((r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost) || 0), 0))},
    M: {charge: M.charge.total, known: M.cost.known, diff: M.difference, diff0: M.difference0, breakevenHours: M.breakeven_hours,
      catSum: r2((M.categories || []).reduce((s, c) => s + (c.known ? c.amount : 0), 0)), streamCost: r2((M.streams || []).reduce((s, x) => s + (x.cost_known ? x.cost : 0), 0)),
      fencing: cat('fencing'), external: cat('external'), sFencing: stream('fencing'), sCrew: stream('crew'), labourMissing: (M.missing || []).find(x => /^wages — /.test(x)) || ''},
    P: {revNow: P.revNow, revJob: P.revJob, direct: P.direct, directJob: P.directJob, costNow: P.costNow, costJob: P.costJob, gm: P.gm, diff: P.diff, checks: P.checks,
      wages: {toDate: P.wages.toDate, toCome: P.wages.toCome, job: P.wages.job},
      l2142: line(P.cost, 'install'), l2126: line(P.cost, 'rehire'), l3325: line(P.cost, 'pump'), l2144: line(P.cost, 'cons'), lTr: line(P.cost, 'transport'),
      rev: (P.rev || []).map(l => [l.key, l.now, l.job])},
    X: {known: X.known, toCome: X.toCome, job: X.job, plKnown: X.plKnown, plParts: X.plParts, wages: {toDate: X.wages.toDate, toCome: X.wages.toCome, job: X.wages.job, known: X.wages.known},
      fence: xrow(/^Fencing — Advanced/), labour: xrow(/^Labour hire/), crewGap: ((X.gaps || []).find(g => /^Fencing race crew — the hours on Advanced/.test(g.what)) || {}).why || null, others: (X.rows || []).filter(r => !/^Fencing — Advanced|^Labour hire/.test(r.stream)).map(r => [r.stream, r.toDate, r.toCome])},
    H: {costCheck: H.costCheck, peopleCheck: H.peopleCheck, costJob: H.costTotal.job, costToDate: H.costTotal.toDate, people: H.people && H.people.total, fencing: hcost(/^Fencing/), labour: hcost(/^Labour hire/), byBranch: H.costTotal.by},
    R: {ok: R.ok, bad: R.bad, count: R.count, failing: R.ties.filter(t => !t.ok).map(t => t.what)},
    note: labourNote753(), lwj: {crewRow: /Race weekend — the Advanced race crew \(Fencing 1–6\)/.test(lwj), err: /^ERR/.test(lwj), len: lwj.length,
      total: (lwj.match(/What the labour costs us, priced to job end<\/span><strong>([^<]+)<\/strong>/) || [])[1] || null}, bf, lb,
    pane: {l2142: costsPane.includes(money(P.cost.find(l => l.key === 'install').job)), crewWords: /race-day crew \(Fencing 1–6\)/.test(costsPane)},
    footer: (document.getElementById('footL') || {}).textContent || ''};
};
(async () => {
  const res = {}, errs = {}, blocked = {};
  for (const [tag, file] of [['base', process.env.BASE], ['build', process.env.BUILD]]) {
    const s = await open({pageFile: file, hash: '#costs', W: MOB ? 390 : 1440, H: MOB ? 844 : 1000, mobile: MOB});
    try {
      await s.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
      await s.page.waitForFunction(() => document.querySelector('#pl752') && document.querySelector('#costs764'), null, {timeout: 90000});
      await s.page.waitForTimeout(2500);
      res[tag] = await s.page.evaluate(read);
    } catch (e) { res[tag] = {err: String(e).slice(0, 300)}; }
    errs[tag] = s.errors.length; blocked[tag] = s.counts.blocked;
    await s.browser.close();
  }
  const B = res.base, N = res.build; let pass = 0, fail = 0;
  const check = (ok, what) => { console.log((ok ? 'PASS ' : 'FAIL ') + what); ok ? pass++ : fail++; };
  if (B.err || N.err) { console.log('could not read', B.err || '', N.err || ''); process.exit(1); }
  const r2 = n => Math.round(n * 100) / 100, eq = (a, b) => a != null && b != null && Math.abs(a - b) < 0.005, d = (a, b) => r2(a - b);
  const C = N.crew || {};
  /* the crew, read the same way on both pages */
  check(B.crew === null && C.shifts === B.crewFin.shifts && eq(C.hours, B.crewFin.hours) && eq(C.job, B.crewFin.cost) && C.shifts > 0,
    `RaceCrew1227: ${C.shifts} shifts, ${C.hours} h, $${C.job} — the same as the live page's running-sheet rows for Fencing 1–6 (${B.crewFin.shifts}, ${B.crewFin.hours} h, $${B.crewFin.cost})`);
  check(C.shifts === 18 && eq(C.hours, 216) && C.plannedShifts === 18 && eq(C.plannedHours, 216) && eq(C.known, 0) && eq(C.toCome, 30672) && C.unpricedShifts === 0 && C.rate === 142 && C.quote === '27172' && C.charge && eq(C.charge.amount, 19412.82),
    `checked again: 216 h planned × $142 (quote 27172) = $30,672.00, all forecast (no race-day docket on the record); V8 Fence team $${C.charge && C.charge.amount}`);
  check(/216 h planned/.test(N.crewWords) && /\$30,672\.00 forecast/.test(N.crewWords) && /race-day dockets are not on the record yet/.test(N.crewWords) && /Fence team 213 h at \$91\.14 = \$19,412\.82/.test(N.crewWords),
    'the words say planned, forecast, no dockets yet, and the V8 charge');
  /* where it lands: in the forecast, not in known */
  check(eq(N.M.known, B.M.known) && eq(N.M.diff, B.M.diff) && eq(d(N.M.known, B.M.known), C.known),
    `direct costs known unchanged ${N.M.known}; difference so far unchanged ${N.M.diff}`);
  check(eq(N.P.l2142.now, B.P.l2142.now) && eq(d(N.P.l2142.job, B.P.l2142.job), C.job) && /race-day crew \(Fencing 1–6\)/.test(N.P.l2142.basis) && /Fence team/.test(N.P.l2142.basis),
    `P&L 2142 Installation — external contractors: today ${N.P.l2142.now} (unchanged), to job end ${B.P.l2142.job} -> ${N.P.l2142.job}; basis names the crew and the V8 charge`);
  check(eq(N.P.direct, B.P.direct) && eq(d(N.P.directJob, B.P.directJob), C.job) && eq(N.P.costNow, B.P.costNow) && eq(d(N.P.costJob, B.P.costJob), C.job),
    `P&L direct costs today unchanged, to job end +$${d(N.P.directJob, B.P.directJob)}`);
  check(eq(d(B.P.gm.job, N.P.gm.job), C.job) && eq(N.P.diff.job, B.P.diff.job) && eq(d(B.P.wages.job, N.P.wages.job), C.job) && eq(N.P.gm.now, B.P.gm.now),
    `gross margin to job end ${B.P.gm.job} -> ${N.P.gm.job} (${Math.round(1000 * N.P.gm.pcJob) / 10}%); difference to job end unchanged ${N.P.diff.job}; wages to job end ${B.P.wages.job} -> ${N.P.wages.job}`);
  check(eq(N.M.fencing.amount, B.M.fencing.amount) && /race-day crew \(Fencing 1–6\)/.test(N.M.fencing.parts) && !/Fencing 1/.test(N.M.external.parts) && /Fencing 1/.test(B.M.external.parts),
    `fencing category (known so far) unchanged ${N.M.fencing.amount}, names the crew's forecast; Fencing 1–6 out of the hours-only external labour (${B.M.external.hours} -> ${N.M.external.hours} h)`);
  check(eq(N.M.sFencing.cost, B.M.sFencing.cost) && /race-day crew/.test(N.M.sFencing.notes) && eq(N.M.sCrew.cost, B.M.sCrew.cost) && eq(N.M.sFencing.charge, B.M.sFencing.charge),
    'fencing stream: known cost unchanged, note names the crew; the People stream unchanged');
  check(eq(N.X.fence.toDate, B.X.fence.toDate) && eq(d(N.X.fence.toCome, B.X.fence.toCome), C.toCome) && /race-day crew \(Fencing 1–6\)/.test(N.X.fence.basis),
    `Costs to job end: fencing line still to come ${B.X.fence.toCome} -> ${N.X.fence.toCome}, names the crew`);
  check(N.X.crewGap, 'Costs to job end lists Advanced\'s race-day dockets as the thing to confirm: ' + N.X.crewGap);
  check(eq(d(B.X.labour.job, N.X.labour.job), C.job) && !/and the race crew/.test(N.X.labour.basis) && eq(d(B.X.wages.job, N.X.wages.job), C.job) && eq(N.X.known, B.X.known) && eq(d(N.X.job, B.X.job), C.job),
    `Costs to job end: labour hire ${B.X.labour.job} -> ${N.X.labour.job}; known unchanged; job +$${d(N.X.job, B.X.job)}`);
  check(eq(N.H.costJob, B.H.costJob) && eq(d(N.H.fencing, B.H.fencing), C.job) && eq(d(B.H.labour, N.H.labour), C.job) && eq(d(B.H.people, N.H.people), C.job) && N.H.costCheck && N.H.peopleCheck,
    `Finance handover: total unchanged ${N.H.costJob}; fencing +$${d(N.H.fencing, B.H.fencing)}, labour hire and people -$${d(B.H.people, N.H.people)}; costCheck ${N.H.costCheck}, peopleCheck ${N.H.peopleCheck}`);
  check(N.R.ok && N.R.bad === 0 && N.R.count === B.R.count && B.R.ok,
    `reconciliation ties: ${N.R.count - N.R.bad}/${N.R.count} on the build (live ${B.R.count - B.R.bad}/${B.R.count})${N.R.failing.length ? ' failing ' + N.R.failing.join('; ') : ''}`);
  check(eq(N.M.catSum, N.M.known) && eq(N.M.streamCost, N.M.known) && eq(N.X.plKnown, N.X.plParts) && eq(N.X.known, N.M.known) && eq(N.P.costNow, N.M.known) && N.P.checks.costs && N.P.checks.costsJob,
    `direct costs known tie four ways to the cent: categories ${N.M.catSum}, streams ${N.M.streamCost}, Costs to job end ${N.X.known}, P&L lines ${N.P.costNow}`);
  check(N.bf && B.bf && eq(N.bf.cost, B.bf.cost) && eq(N.bf.costJob, B.bf.costJob),
    'by branch: costs with wages, today and to job end, unchanged');
  /* the wages say so */
  const hiredB = +((B.note.match(/wages — ([\d,]+) hired-in shifts/) || [])[1] || '0').replace(/,/g, ''), hiredN = +((N.note.match(/wages — ([\d,]+) hired-in shifts/) || [])[1] || '0').replace(/,/g, '');
  const costB = +((B.note.match(/record, \$([\d,.]+)/) || [])[1] || '0').replace(/,/g, ''), costN = +((N.note.match(/record, \$([\d,.]+)/) || [])[1] || '0').replace(/,/g, '');
  check(hiredB - hiredN === C.shifts && eq(d(costB, costN), C.job) && /The Advanced race crew, 18 shifts \$30,672\.00 forecast, is what we pay Advanced/.test(N.note) && N.M.labourMissing === N.note,
    `wages note: ${hiredB} -> ${hiredN} hired-in shifts, $${costB} -> $${costN}; says where the crew went`);
  check(N.lwj.crewRow && !N.lwj.err && !B.lwj.crewRow && N.lwj.total === B.lwj.total,
    `labour card: the crew on its own row; total labour cost unchanged (${N.lwj.total})`);
  check(typeof N.lb === 'string' && /The Advanced race crew is not wages: 18 shifts, \$30,672(\.00)? forecast/.test(N.lb), 'Questions: the labour note names the race crew as not wages, forecast');
  check(eq(N.M.breakevenHours, r2(B.M.breakevenHours - C.hours)), `wages hours outside the P&L ${B.M.breakevenHours} -> ${N.M.breakevenHours}`);
  /* nothing else moves */
  check(eq(N.M.charge, B.M.charge) && eq(N.P.revNow, B.P.revNow) && eq(N.P.revJob, B.P.revJob) && JSON.stringify(N.P.rev) === JSON.stringify(B.P.rev),
    `revenue unchanged: ${N.P.revNow} on the record, ${N.P.revJob} to job end, every revenue line`);
  check(['l2126', 'l3325', 'l2144', 'lTr'].every(k => eq(N.P[k].now, B.P[k].now) && eq(N.P[k].job, B.P[k].job)) && JSON.stringify(N.X.others) === JSON.stringify(B.X.others),
    'every other P&L cost line and Costs to job end line unchanged');
  check(N.pane.l2142 && N.pane.crewWords, 'on screen: the new 2142 job-end figure and the crew line are on the Costs tab');
  check(/ · v12\.27$/.test(N.footer.trim()), 'footer ' + N.footer.trim().slice(-12));
  check(errs.base === 0 && blocked.base === 0 && errs.build === 0 && blocked.build === 0, `base ${errs.base} errors ${blocked.base} writes; build ${errs.build} page errors, ${blocked.build} record writes`);
  console.log('crew words:', N.crewWords);
  console.log('wages note:', N.note);
  console.log(`${pass}/${pass + fail} ${MOB ? 'phone' : 'desktop'}`);
  process.exit(fail ? 1 : 0);
})();
