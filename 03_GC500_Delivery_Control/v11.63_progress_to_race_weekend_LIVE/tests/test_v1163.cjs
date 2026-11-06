'use strict';
// v11.63 - progress to race weekend. Read-only: GET only, every write the page tries is aborted by the harness.
// Opens the page three times in turn (never two at once): with the real clock, then with the page clock set to Tue 27 Oct
// and Tue 3 Nov 2026. Every progress reading must equal what it reads on Fri 23 Oct; demob must keep moving with the day.
//   PAGE=build/GC500_v11.63/GC500_Delivery_Control_hosted.html node tests/test_v1163.cjs        (desktop; MOB=1 for phone)
//   node tests/test_v1163.cjs                                                                   (the live page)
const {open} = require('../../toolchain/harness/open_page.js');
const CLOCKS = ['', '2026-10-27T10:00:00+10:00', '2026-11-03T10:00:00+10:00'];
const shift = c => c ? `(()=>{const RD=Date,off=RD.parse(${JSON.stringify(c)})-RD.now();function FD(...a){if(!new.target)return new RD(RD.now()+off).toString();return a.length?new RD(...a):new RD(RD.now()+off);}FD.prototype=RD.prototype;FD.now=()=>RD.now()+off;FD.parse=RD.parse;FD.UTC=RD.UTC;globalThis.Date=FD;})();` : '';
const EXPECT_WRAPPED = ['todayWorkDay841', 'todayWorkMetrics840', 'todayWorkSummary842', 'todayWorkSummary848', 'todayFencingSummary848', 'fenceOverall853', 'progress881Model',
 'completionAsOf', 'completionBlock', 'wipModel', 'dsnScreen', 'progressMailto', 'showScene', 'fenceCcbReview847', 'fenceCcbSummary847'];
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
async function read(clock) {
 const MOB = !!process.env.MOB;
 const h = await open(Object.assign(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 1000}, {hash: '#today', init: shift(clock)}, process.env.PAGE ? {pageFile: process.env.PAGE} : {}));
 const p = h.page, cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof go === 'function', null, {timeout: 240000});
  await p.waitForTimeout(7000);
  const r = await p.evaluate(() => {
   const out = {errors: []}, t = (k, f) => { try { out[k] = f(); } catch (e) { out.errors.push(k + ': ' + String(e && e.message || e).slice(0, 300)); } };
   const r2 = n => typeof n === 'number' ? Math.round(n * 100) / 100 : n;
   t('today', () => todayIso());
   t('footer', () => document.body.innerText.includes('v11.63'));
   t('wrapped', () => window.rw1163Wrapped || []);
   t('index', () => { const m = progress881Model(); return {day: m.day, ready: m.ready, min: r2(m.pct && m.pct.min), max: r2(m.pct && m.pct.max), rows: Object.fromEntries(m.rows.map(x => [x.id, [r2(x.min), r2(x.max)]]))}; });
   t('fence', () => { const f = fenceOverall853(); return {state: f.state, min: r2(f.pct && f.pct.min), max: r2(f.pct && f.pct.max), pending: f.classificationPending, total: f.total, left: f.left}; });
   t('ccb', () => { const s = todayFencingSummary848().classification; return {pending: s.pendingCount, conf: s.confirmedByType, raw: s.rawByType}; });
   t('reviews', () => Object.fromEntries(['36560', '36568', '36603', '36611', '36623', '36627', '36629', '36634', '36635', '36636', '36637', '36643', '36645', '36647', '36751', '36755', '36760', '36764']
    .map(no => { const d = allDockets().find(x => String(x.docket_no) === no); const v = d ? fenceCcbReview847(d) : null; return [no, v ? [v.state, v.reviewState, v.split1163 || null] : null]; })));
   t('evidence', () => { const e = fenceProgressEvidence848(); return {state: e.state, pending: e.pending.length}; });
   t('fenceRows', () => Object.fromEntries(todayWorkSummary848().fencingRows.filter(x => ['relocation', 'removal', 'ccb_event', 'ccb_demarc'].includes(x.id)).map(x => [x.id, [x.done, x.total, !!x.doneRange]])));
   t('groups', () => Object.fromEntries(Object.entries(todayWorkSummary848().byId).map(([k, x]) => [k, [r2(x.pct), x.done, x.total]])));
   t('completion', () => { const c = completionAsOf(todayIso()); return {all: c.all, on: c.on, plan: c.plan, onDue: c.onDue, shortfall: c.shortfall, word: c.word, out: (c.rw1163 && c.rw1163.out || []).map(x => x.key)}; });
   t('wip', () => { const m = wipModel(todayIso()); return [m.mode.all.k2, m.mode.all.fr, m.mode.due.fr]; });
   t('milestones', () => MS1025.allFacts().filter(f => f.reached).length);
   t('pillars', () => { const o = cwPillars().find(x => x.k === 'O').rows[0], a = cwPillars().find(x => x.k === 'A').rows; return {due: o, onsite: a.find(r => /On site now/.test(r[0])), off: a.find(r => /Off site again/.test(r[0]))}; });
   t('reds', () => cwReds().filter(x => /overdue against the programme/.test(x.what)).length);
   t('attention', () => attention().progress);
   t('rowsKey', () => JSON.stringify(dsnState(window.PROGRESS_TO1163 || '2026-10-23').rows.map(x => [x.a.key, x.unitsOn, x.on, x.due])));
   t('mail', () => decodeURIComponent(progressMailto(todayIso())));
   return out;
  });
  await p.evaluate(() => go('today')); await p.waitForTimeout(3500);
  r.todayText = await p.evaluate(() => (document.getElementById('pane-today') || {}).innerText || '');
  r.pageErrors = h.errors.slice(); r.cons = cons;
  return r;
 } finally { await h.browser.close(); }
}
(async () => {
 const R = [];
 for (const c of CLOCKS) { console.log('== reading with the page clock at ' + (c || 'now') + (process.env.MOB ? ' (phone)' : ' (desktop)')); R.push(await read(c)); }
 const [base] = R;
 console.log('== Friday 23 Oct 2026 (the real clock)');
 ok(base.errors.length === 0 && base.pageErrors.length === 0 && base.cons.length === 0, 'no page errors, no console errors, every reading ran ' + JSON.stringify(base.errors.concat(base.pageErrors, base.cons)).slice(0, 200));
 ok(base.footer, 'footer reads v11.63');
 ok(EXPECT_WRAPPED.every(n => base.wrapped.includes(n)), 'every progress reading carries the race-weekend cut-off (' + base.wrapped.length + ' wrapped)');
 ok(base.index.ready && base.index.min === base.index.max, 'the category index is one figure, not a range: ' + base.index.min + '%');
 ok(base.fence.state === 'ready' && base.fence.min === base.fence.max && base.fence.pending === false, 'fencing is one figure: ' + base.fence.min + '% (' + JSON.stringify(base.fence.left) + ' m left)');
 ok(base.ccb.pending === 0, 'no crowd-control docket waits on a category (' + JSON.stringify(base.ccb.conf) + ')');
 ok(Object.values(base.reviews).every(v => v && v[0] === 'confirmed' && v[1] === 'current'), 'the eighteen crowd-control reviews are confirmed and current');
 ok(JSON.stringify(base.reviews['36627'][2]) === '{"ccb_event":125,"ccb_demarc":7.5}' && JSON.stringify(base.reviews['36629'][2]) === '{"ccb_event":237.5,"ccb_demarc":182.5}', '36627 and 36629 confirmed split exactly as recorded');
 ok(base.evidence.state === 'ready' && base.evidence.pending === 0, 'the evidence catalogue is current, nothing waiting on review');
 ok(base.fenceRows.relocation[0] === 582.5 && base.fenceRows.removal[0] === 1102.5, 'relocations 582.5 m and removals 1,102.5 m read from the papers (' + JSON.stringify(base.fenceRows) + ')');
 ok(['buildings', 'toilets', 'barriers', 'generators', 'lighting', 'vms', 'equipment'].every(k => base.groups[k][0] === 100), 'every equipment group at 100%');
 ok(base.completion.all === base.completion.on && base.completion.shortfall === 0 && base.completion.out.join() === 'WB20,WB19', 'Delivery pace: ' + base.completion.on + ' of ' + base.completion.all + ' booked by race weekend, nothing behind; WB20 and WB19 named, not counted');
 ok(base.wip[0] === 'TO RACE WEEKEND', 'the Today report says to race weekend, not whole job');
 ok(base.milestones === 7, 'seven areas at 100%');
 ok(/311\s*of 311 barriers on site/.test(base.todayText) && /Booked to come in after race weekend, so not counted here: WB20/.test(base.todayText), 'Where we are: water barriers 311 of 311, WB20 and WB19 named under the plates');
 ok(/booked by race weekend/.test(base.mail) && /WB19/.test(base.mail), 'the progress email counts what is booked by race weekend and names what is not');
 for (const [i, c] of CLOCKS.entries()) {
  if (!i) continue;
  const r = R[i];
  console.log('== ' + r.today + ' (page clock ' + c + ')');
  ok(r.errors.length === 0 && r.pageErrors.length === 0 && r.cons.length === 0, 'no page errors, no console errors ' + JSON.stringify(r.errors.concat(r.pageErrors, r.cons)).slice(0, 200));
  ok(JSON.stringify(r.index) === JSON.stringify(base.index), 'category index as on Friday: ' + r.index.min + '%');
  ok(JSON.stringify(r.fence) === JSON.stringify(base.fence) && JSON.stringify(r.ccb) === JSON.stringify(base.ccb), 'fencing as on Friday: ' + r.fence.min + '%');
  ok(JSON.stringify(r.groups) === JSON.stringify(base.groups) && JSON.stringify(r.fenceRows) === JSON.stringify(base.fenceRows), 'every group and fencing line as on Friday');
  ok(JSON.stringify(r.completion) === JSON.stringify(base.completion), 'Delivery pace as on Friday: ' + r.completion.word + ', shortfall ' + r.completion.shortfall);
  ok(JSON.stringify(r.wip) === JSON.stringify(base.wip), 'the Today report as on Friday: ' + r.wip[1]);
  ok(r.milestones === base.milestones, 'milestones as on Friday: ' + r.milestones + ' areas at 100%');
  ok(r.rowsKey === base.rowsKey, 'all references read at race weekend exactly as on Friday');
  ok(/Due by race weekend/.test(r.pillars.due[0]) && r.pillars.due[1] === base.pillars.due[1] && r.reds === 0 && r.attention === 0, 'Coates Way: due by race weekend, ' + r.pillars.due[1] + '; no overdue red; no tab dot');
  ok(r.pillars.off[1] !== base.pillars.off[1], 'demob keeps the real day: ' + r.pillars.off[1] + ' (Friday: ' + base.pillars.off[1] + ')');
  ok(/Progress to race weekend · Fri 23 Oct 2026/.test(r.todayText) && /Progress counts to race weekend, Fri 23 Oct 2026/.test(r.todayText), 'Today says progress counts to race weekend, Fri 23 Oct 2026');
  ok(new RegExp('Weather for ' + ({'2026-10-27': 'Tue 27 Oct', '2026-11-03': 'Tue 03 Nov|Tue 3 Nov'}[r.today])).test(r.todayText), 'the weather stays on the real day');
  ok(!/behind by|behind on-site plan|reference behind/.test(r.todayText), 'nothing on Today reads behind');
 }
 console.log(`\n${pass} passed, ${fail} failed`);
 process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
