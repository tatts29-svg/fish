// Author: Andrew Fisher. v8.88 Transport view and Everything reconciles: opens from Costs; every load, carrier and branch in the source is shown;
// the per-branch, per-carrier and grand totals equal the P&L, Costs to job end and Finance handover model figures; links work; the
// reconciliation is all tied and flags an injected mismatch; the phone layout has no horizontal overflow; no errors and no live writes.
// Read-only against the live record (every write is aborted by open_page). No $ amount is printed.
//   PAGE=build/GC500_v8.88/GC500_Delivery_Control_hosted.html [MOB=1] [W=2560 H=1370] [OUT=dir] node v8.88_costs_transport_DRAFT/tests/test_transport888.cjs
const fs = require('fs'), {open} = require('../../toolchain/harness/open_page');
(async () => { let s; try { const MOB = !!process.env.MOB, W = MOB ? 390 : Number(process.env.W || 1440), H = MOB ? 844 : Number(process.env.H || 900), R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  s = await open({pageFile: process.env.PAGE, W, H, mobile: MOB, dpr: MOB ? 2 : 1}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof transport888Core === 'function', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0 && !!document.getElementById('recon888'); } catch (e) { return false; } }, null, {timeout: 30000}); await p.waitForTimeout(1200);
  const near = (a, b, eps = 0.005) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < eps;
  /* 1. the summary: the reconciliation line under the glance, all tied; the Transport button on the nav */
  const A = await p.evaluate(() => { const r = document.getElementById('recon888'), glance = document.getElementById('costs765'); const R = recon888Model();
    return {present: !!r, afterGlance: !!glance && glance.nextElementSibling === r, summary: (r.querySelector('summary') || {}).textContent || '', rows: r.querySelectorAll('tr[data-recon888]').length, badRows: r.querySelectorAll('tr.recon888-bad').length, model: {ok: R.ok, bad: R.bad, count: R.count, error: R.error || null, groups: [...new Set(R.ties.map(t => t.group))], ties: R.ties.map(t => ({what: t.what, ok: t.ok, n: t.parts.length}))},
      nav: [...document.querySelectorAll('#pane-costs .finance857-nav button')].map(b => b.textContent.trim()), five: document.querySelectorAll('#pane-costs [data-finance857]').length, tbtn: !!document.querySelector('#pane-costs [data-finance888="transport"]')}; });
  ok('Everything reconciles sits directly under At a glance', A.present && A.afterGlance, {present: A.present, afterGlance: A.afterGlance});
  ok('every tie-out is tied in the model and on the page (' + A.model.count + ' tie-outs)', A.model.ok && A.model.bad === 0 && A.badRows === 0 && A.rows === A.model.count && A.model.count >= 15 && !A.model.error, {bad: A.model.bad, rows: A.rows, badRows: A.badRows, error: A.model.error, failing: A.model.ties.filter(t => !t.ok).map(t => t.what)});
  ok('the tie-outs cover the P&L, Transport and the operational tabs', ['P&L', 'Transport', 'Operational'].every(g => A.model.groups.includes(g)) && /Everything reconciles/.test(A.summary) && /all tied/.test(A.summary), {groups: A.model.groups, summary: A.summary.slice(0, 80)});
  ok('Costs nav keeps its five sections and adds Transport', A.five === 5 && A.tbtn && A.nav.length === 6 && A.nav[5] === 'Transport', A.nav);
  /* 2. the Transport view opens from Costs */
  await p.evaluate(() => { document.querySelector('#pane-costs [data-finance888="transport"]').click(); }); await p.waitForFunction(() => !!document.getElementById('transport888'), null, {timeout: 30000}); await p.waitForTimeout(800);
  const B = await p.evaluate(() => holdAssets(() => { const sec = document.getElementById('transport888'), T = transport888Core(), V = transport888View(), M = moneySummary(), X = cj764Model(), H = fh866Model(), P = pl770Model(), B = pl752Rows(), BT = buildingTransportModel831();
    const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100, txt = sec ? sec.innerText : '';
    const live = T.rows.filter(r => !r.cancelled);
    /* the source: every load with a transport fact, every carrier named, every branch on a load */
    const srcLoads = []; allAssets().forEach(a => { if (a._cancelled || rowOff(a.key)) return; (a.events || []).forEach(e => { if (e.carrier || e.dd || e.transport_cost || e.load_time) srcLoads.push({key: a.key, task: String(e.task_id || '').toUpperCase(), carrier: e.carrier || ''}); }); });
    const fenceTasks = (((DATA.plant_lines || {}).fencing_rows_not_plant) || []).filter(r => !rowOff(r.task_id)).map(r => String(r.task_id).toUpperCase());
    const unrefTasks = (DATA.unreferenced || []).filter(r => !rowOff(r.task_id)).map(r => String(r.task_id).toUpperCase());
    const shownTasks = new Set(live.map(r => r.task)), shownKeys = new Set(live.map(r => r.key).filter(Boolean));
    const srcKeys = [...new Set(srcLoads.map(x => x.key))], missingKeys = srcKeys.filter(k => !shownKeys.has(k)), missingFence = fenceTasks.filter(t => !shownTasks.has(t)), missingUnref = unrefTasks.filter(t => !shownTasks.has(t));
    const srcCarriers = [...new Set(srcLoads.flatMap(x => transport888Carriers(x.carrier)))], tabCarriers = new Set(V.byCarrier.flatMap(c => c.name.split(' / ')));
    const srcBranches = [...new Set(srcLoads.map(x => (branchOf(x.key) || {}).code).filter(Boolean))], tabBranches = new Set(V.byBranch.map(b => b.code));
    const rowsOnPage = sec.querySelectorAll('tr[data-tr888-row]').length;
    const refButtons = [...sec.querySelectorAll('button[data-open]')].map(b => b.dataset.open), dayButtons = [...sec.querySelectorAll('button[data-tr888-day]')].map(b => b.dataset.tr888Day);
    /* the totals against the models */
    const xT = (X.rows || []).find(r => /^Transport/.test(r.stream)) || {}, hT = (H.costs || []).find(r => r.kind === 'transport') || {by: {}}, pT = (P.cost || []).find(l => l.key === 'transport') || {}, pR = (P.rev || []).find(l => l.key === 'transport') || {};
    const branchSum = f => r2(V.byBranch.reduce((s, b) => s + (b[f] || 0), 0)), carrierSum = f => r2(V.byCarrier.reduce((s, c) => s + (c[f] || 0), 0));
    const handoverByBranchOk = V.byBranch.filter(b => b.code !== '—').every(b => near(b.handover, r2(hT.by[b.code] || 0)));
    const revenueByBranchOk = V.byBranch.every(b => near(b.revenue, r2((B.find(x => x.code === b.code) || {}).transport || 0)));
    const provisionalByBranchOk = V.byBranch.every(b => near(b.provisional, r2(((BT.byBranch || []).find(x => (x.branch || '—') === b.code) || {}).uncoveredAdditional || 0)));
    const perLoadSum = r2(live.reduce((s, r) => s + (r.counted ? r.actual : 0), 0) + T.OCL.filter(c => c.amount != null && !c.awaiting).reduce((s, c) => s + c.amount, 0));
    const perLoadForecast = r2(live.reduce((s, r) => s + ((r.forecast && (r.forecast.kind === 'card' || r.forecast.kind === 'average')) ? r.forecast.amount : 0), 0));
    function near(a, b, eps = 0.005) { return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < eps; }
    return {present: !!sec, heading: (document.querySelector('#finance857-section .panehead') || {}).textContent || '', pressed: (document.querySelector('#pane-costs [data-finance888]') || {}).getAttribute('aria-pressed'),
      counts: {srcKeys: srcKeys.length, shownKeys: shownKeys.size, missingKeys, fence: fenceTasks.length, missingFence, unref: unrefTasks.length, missingUnref, rows: live.length, rowsOnPage, srcCarriers, missingCarriers: srcCarriers.filter(c => !tabCarriers.has(c)), srcBranches, missingBranches: srcBranches.filter(b => !tabBranches.has(b)), unconfirmedRow: V.byBranch.some(b => b.code === '—'), filters: sec.querySelectorAll('[data-tr888f]').length},
      totals: {actual: V.tot.actual, pl: M.cost.transport.amount, cj: xT.toDate, h: hT.toDate, pl770: pT.now, branchActual: branchSum('actual'), carrierActual: carrierSum('amount'), perLoadSum,
        toCome: V.tot.toCome, cjToCome: xT.toCome, hToCome: hT.toCome, pl770ToCome: typeof pT.job === 'number' && typeof pT.now === 'number' ? r2(pT.job - pT.now) : null, branchToCome: branchSum('toCome'), perLoadForecast, forecastModel: T.forecast.total,
        handover: V.tot.handover, hJob: hT.job, handoverByBranchOk, revenue: V.revenueTotal, plRev: M.charge.delivery, pl770Rev: pR.now, branchRevenue: branchSum('revenue'), revenueByBranchOk, lines: V.lines.length, cfLines: contractFigures(ONHIRE_ROWS).transport.lines,
        provisional: V.provisionalTotal, cjProv: X.revenue.transportToCome, branchProv: branchSum('provisional'), provisionalByBranchOk, loads: V.tot.loads, carrierLoads: V.byCarrier.reduce((s, c) => s + c.loads, 0), branchLoads: V.byBranch.reduce((s, b) => s + b.loads, 0), figure: V.tot.figure, plFigure: M.cost.transport.schedule.counted_refs + M.cost.transport.schedule.by_our_line, internal: V.tot.internal, plInternal: M.cost.transport.schedule.internal, demobInPl: T.demob.total, hDemob: ((H.demob || []).find(d => /^Transport/.test(d.stream)) || {}).total, doubleCounted: T.doubleCounted},
      words: {ties: /all tied/.test(txt), unconfirmed: /unconfirmed/.test(txt), noDollarsOutside: true, notInPl: /Not in the P&L/.test(txt), rules: /load times at/.test(txt), author: /Author: Andrew Fisher/.test(txt), plan: /carrier plan of/.test(txt), guessed: !/guess(ed)? a branch/.test(txt)},
      refButtons: refButtons.slice(0, 3), refButtonCount: refButtons.length, dayButtons: [...new Set(dayButtons)].slice(0, 2), overflow: document.documentElement.scrollWidth <= innerWidth + 2, paneOverflow: (document.getElementById('pane-costs') || {}).scrollWidth <= (document.querySelector('main') || {}).clientWidth + 2,
      phone: {stacked: getComputedStyle(sec.querySelector('.tr888-register thead')).display, rowDisplay: getComputedStyle(sec.querySelector('tr[data-tr888-row]') || sec).display, metricsCols: getComputedStyle(sec.querySelector('.fin745-metrics')).gridTemplateColumns.split(' ').length, phoneNo: !/\b0[45]\d{2}[ -]?\d{3}[ -]?\d{3}\b/.test(txt) && !/@/.test(txt)}}; }));
  ok('Transport view mounts from the Costs nav, with its own heading and the button pressed', B.present && /^Transport — /.test(B.heading) && B.pressed === 'true', {heading: B.heading, pressed: B.pressed});
  ok('every reference with a transport fact in the source is on the Transport view', B.counts.missingKeys.length === 0 && B.counts.shownKeys >= B.counts.srcKeys && B.counts.srcKeys > 50, {src: B.counts.srcKeys, shown: B.counts.shownKeys, missing: B.counts.missingKeys});
  ok('every fencing semi and every schedule row with no reference is on it', B.counts.missingFence.length === 0 && B.counts.missingUnref.length === 0 && B.counts.fence > 0 && B.counts.unref > 0, {missingFence: B.counts.missingFence, missingUnref: B.counts.missingUnref});
  ok('every carrier named in the source has a row; every branch on a load has a row, plus the unconfirmed loads', B.counts.missingCarriers.length === 0 && B.counts.srcCarriers.length >= 4 && B.counts.missingBranches.length === 0 && B.counts.srcBranches.length >= 3 && B.counts.unconfirmedRow, {carriers: B.counts.srcCarriers, missingCarriers: B.counts.missingCarriers, branches: B.counts.srcBranches, missingBranches: B.counts.missingBranches});
  ok('one row per load on the page (' + B.counts.rowsOnPage + ')', B.counts.rowsOnPage === B.counts.rows && B.counts.rows > 100 && B.counts.filters >= 8, {rows: B.counts.rows, onPage: B.counts.rowsOnPage});
  const t = B.totals;
  ok('grand total to date equals the P&L, Costs to job end, the business’s lines and the Finance handover', near(t.actual, t.pl) && near(t.actual, t.cj) && near(t.actual, t.h) && near(t.actual, t.pl770) && t.actual > 0, {eq: [t.actual === t.pl, t.actual === t.cj, t.actual === t.h, t.actual === t.pl770]});
  ok('per-branch totals add to the grand total; per-carrier totals add to it; the loads add to it', near(t.branchActual, t.actual) && near(t.carrierActual, t.actual) && near(t.perLoadSum, t.actual), {branch: t.branchActual === t.actual, carrier: t.carrierActual === t.actual, loads: t.perLoadSum === t.actual});
  ok('forecast still to come equals Costs to job end, the business’s lines and the handover, and adds by branch and by load', near(t.toCome, t.cjToCome) && near(t.toCome, t.hToCome) && near(t.toCome, t.pl770ToCome) && near(t.branchToCome, t.toCome) && near(t.perLoadForecast, t.toCome) && near(t.forecastModel, t.toCome) && t.toCome > 0, {eq: [t.toCome === t.cjToCome, t.toCome === t.hToCome, t.toCome === t.pl770ToCome, t.branchToCome === t.toCome, t.perLoadForecast === t.toCome]});
  ok('the Finance handover column is the handover’s own split, branch for branch, and adds to its job figure', t.handoverByBranchOk && near(t.handover, t.hJob) && near(t.hJob, t.actual + t.toCome), {byBranch: t.handoverByBranchOk, eq: t.handover === t.hJob});
  ok('Transport Revenue equals the P&L, the business’s lines and the by-branch table, line for line', near(t.revenue, t.plRev) && near(t.revenue, t.pl770Rev) && near(t.branchRevenue, t.revenue) && t.revenueByBranchOk && t.lines === t.cfLines && t.lines > 0, {eq: [t.revenue === t.plRev, t.revenue === t.pl770Rev, t.branchRevenue === t.revenue], lines: t.lines, cf: t.cfLines});
  ok('provisional transport revenue to come equals Costs to job end and the Additional transport forecast by branch', near(t.provisional, t.cjProv) && near(t.branchProv, t.provisional) && t.provisionalByBranchOk, {eq: [t.provisional === t.cjProv, t.branchProv === t.provisional], byBranch: t.provisionalByBranchOk});
  ok('the load counts agree: by branch, by carrier, with a figure, on a Coates truck', t.branchLoads === t.loads && t.carrierLoads === t.loads && t.figure === t.plFigure && t.internal === t.plInternal && t.doubleCounted === 0, {loads: t.loads, branch: t.branchLoads, carrier: t.carrierLoads, figure: [t.figure, t.plFigure], internal: [t.internal, t.plInternal], doubleCounted: t.doubleCounted});
  ok('demob transport in the handover is the Transport view’s cut of the P&L', near(t.demobInPl, t.hDemob), {eq: t.demobInPl === t.hDemob});
  ok('the words: tied, unconfirmed where unknown, demob legs named as not in the P&L, the rules, the carrier plan, the author; no phone number or email', B.words.ties && B.words.unconfirmed && B.words.notInPl && B.words.rules && B.words.plan && B.words.author && B.phone.phoneNo, B.words);
  /* 3. the links: a reference opens its drawer; a day opens the Timeline */
  ok('reference and Timeline links are drawn', B.refButtonCount > 50 && B.dayButtons.length >= 1, {refs: B.refButtonCount, days: B.dayButtons});
  await p.evaluate(() => { const b = document.querySelector('#transport888 button[data-open]'); b.scrollIntoView({block: 'center'}); b.click(); }); await p.waitForTimeout(900);
  const L1 = await p.evaluate(() => ({on: document.getElementById('drawer').classList.contains('on'), sel: state.sel, first: (document.querySelector('#transport888 button[data-open]') || {}).dataset.open}));
  ok('a reference link opens the reference drawer', L1.on && L1.sel === L1.first, L1);
  await p.evaluate(() => { if (state.drawerClose) state.drawerClose(); }); await p.waitForTimeout(400);
  const dayIso = B.dayButtons[0];
  await p.evaluate(iso => { const b = [...document.querySelectorAll('#transport888 button[data-tr888-day]')].find(x => x.dataset.tr888Day === iso); b.scrollIntoView({block: 'center'}); b.click(); }, dayIso); await p.waitForTimeout(1500);
  const L2 = await p.evaluate(() => ({tab: state.tab, day: state.day, hash: location.hash, pane: !!document.querySelector('#pane-timeline:not([hidden])')}));
  ok('a Timeline link opens that day on the Timeline', L2.tab === 'timeline' && L2.day === dayIso && L2.hash === '#day/' + dayIso, L2);
  /* back to Costs: the tab opens on the P&L summary as it always has, and the Transport button reopens the view */
  await p.evaluate(() => go('costs')); await p.waitForTimeout(1200);
  const back = await p.evaluate(() => ({view: state.financeView857, summary: !!document.getElementById('recon888') && !!document.getElementById('costs765'), transport: !!document.getElementById('transport888')}));
  await p.evaluate(() => { document.querySelector('#pane-costs [data-finance888="transport"]').click(); }); await p.waitForFunction(() => !!document.getElementById('transport888'), null, {timeout: 30000}); await p.waitForTimeout(800);
  ok('coming back to Costs opens the summary whole, and the Transport button reopens the view', back.summary && !back.transport && back.view === 'summary', back);
  /* 4. a filter narrows the rows and the shown total follows */
  await p.evaluate(() => { document.querySelector('#transport888 [data-tr888f="figure"]').click(); }); await p.waitForTimeout(900);
  const F = await p.evaluate(() => holdAssets(() => { const T = transport888Core(), live = T.rows.filter(r => !r.cancelled && r.counted); return {rows: document.querySelectorAll('#transport888 tr[data-tr888-row]').length, expect: live.length, pressed: document.querySelector('#transport888 [data-tr888f="figure"]').getAttribute('aria-pressed')}; }));
  ok('the With a figure filter shows exactly the loads with a figure', F.rows === F.expect && F.pressed === 'true' && F.rows > 0, F);
  await p.evaluate(() => { document.querySelector('#transport888 [data-tr888f="all"]').click(); }); await p.waitForTimeout(600);
  /* 5. the phone layout */
  ok(MOB ? 'phone: the register stacks into cards, two metric tiles across, no page-wide horizontal overflow' : 'laptop: table layout, four metric tiles across, no page-wide horizontal overflow', B.overflow && (MOB ? B.phone.stacked === 'none' && B.phone.rowDisplay === 'block' && B.phone.metricsCols === 2 : B.phone.stacked !== 'none' && B.phone.metricsCols === 4), B.phone);
  if (process.env.OUT) { fs.mkdirSync(process.env.OUT, {recursive: true}); const tag = MOB ? 'phone' : String(W);
    await p.evaluate(() => { document.querySelector('main').scrollTop = 0; }); await p.waitForTimeout(300); await p.screenshot({path: process.env.OUT + '/transport-' + tag + '-1.png'});
    await p.evaluate(() => { const el = document.querySelector('#transport888 .tr888-register'); if (el) el.scrollIntoView({block: 'start'}); }); await p.waitForTimeout(300); await p.screenshot({path: process.env.OUT + '/transport-' + tag + '-2.png'});
    await p.evaluate(() => { financeHome857(); state.financeView857 = 'summary'; render(); }); await p.waitForTimeout(1500);
    await p.evaluate(() => { const el = document.getElementById('recon888'); if (el) { el.open = true; el.scrollIntoView({block: 'start'}); } }); await p.waitForTimeout(300); await p.screenshot({path: process.env.OUT + '/reconciles-' + tag + '.png'});
    await p.evaluate(() => { financeHome857(); state.financeView857 = 'transport'; render(); }); await p.waitForTimeout(1200); }
  /* 6. an injected mismatch is flagged, never hidden: a transport figure is altered in memory on a copy of the model's result and the reconciliation re-read */
  const I = await p.evaluate(() => holdAssets(() => { const before = recon888Model(); const orig = window.transport888View;
    window.transport888View = function(){ const V = orig(); V.tot = Object.assign({}, V.tot, {actual: V.tot.actual + 1234.56}); return V; };
    let after; try { after = recon888Model(); } finally { window.transport888View = orig; }
    const again = recon888Model();
    const summaryText = (() => { const html = recon888Html(); const d = document.createElement('div'); d.innerHTML = html; return (d.querySelector('summary') || {}).textContent || ''; })();
    return {beforeOk: before.ok, afterBad: after.bad, afterOk: after.ok, flagged: after.ties.filter(t => !t.ok).map(t => t.what), againOk: again.ok, summaryText}; }));
  ok('an injected mismatch is flagged on the exact tie-out, and the real figures tie again afterwards', I.beforeOk && !I.afterOk && I.afterBad >= 1 && I.flagged.includes('Transport (cartage) to date') && I.againOk && /all tied/.test(I.summaryText), I);
  const I2 = await p.evaluate(() => holdAssets(() => { const orig = window.transport888View; window.transport888View = function(){ const V = orig(); V.tot = Object.assign({}, V.tot, {actual: V.tot.actual + 1}); return V; };
    let html; try { html = recon888Html(); } finally { window.transport888View = orig; } const d = document.createElement('div'); d.innerHTML = html;
    return {open: d.querySelector('details').hasAttribute('open'), flag: d.querySelector('details').classList.contains('recon888-flag'), words: (d.querySelector('summary') || {}).textContent || '', badRows: d.querySelectorAll('tr.recon888-bad').length}; }));
  ok('the line opens itself and says how many do not tie', I2.open && I2.flag && /do not tie/.test(I2.words) && I2.badRows >= 1, I2);
  /* 7. nothing changed, nothing sent */
  const same = await p.evaluate(() => { const b = JSON.stringify([moneySummary(), cj764Model().job, fh866Model().costTotal]); render(); return b === JSON.stringify([moneySummary(), cj764Model().job, fh866Model().costTotal]); });
  ok('a redraw changes no figure', same, {});
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 4));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  R.forEach(r => console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 700)}`));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : W + ' px'}: ${R.length - fails}/${R.length}`); process.exitCode = fails ? 1 : 0;
} finally { if (s) await s.browser.close(); } })().catch(e => { console.error('TEST FAIL', e); process.exit(2); });
