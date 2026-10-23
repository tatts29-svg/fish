/* Author: Andrew Fisher. v11.63 - progress to race weekend.
   Andrew, 23 Oct 2026: "Just with the progress we are doing progress of up to race weekend. Not after friday 23/10/2026.
   Or things will look like they are not complete if that makes sense." Then: "We need to get this perfect." and "I need
   everything talking. Everything updated."
   1. One cut-off. Every progress reading on the page counts the programme to Fri 23 Oct 2026 and no later: the Today board
      and its groups, the category index, the fencing card, Where we are, Delivery pace, the milestones, the Showcase progress
      scenes, the progress email, the Coates Way adherence rows and the tab dot. After the Friday they stay where race
      weekend left them; demob, costs, servicing, prestarts and the Timeline keep the real day. References booked to come in
      after race weekend are named and not counted (WB19, WB20).
   2. Fencing reads one figure: the crowd-control reviews made stale by the scrim corrections of 23 Oct are read again, the
      event-week crowd-control dockets are confirmed as recorded (dockets are the truth, the project manager's rule of
      22 Oct 2026), and a docket the record splits between Event and Demarcation is confirmed split exactly as recorded.
   3. The evidence catalogue reads the papers: the 24481 overlap read again, and the relocations on the service notes and the
      removals on the collection forms added on the catalogue's own rules.
   Every review row and evidence snapshot is the record exactly as it stood when read (data_v1163, read 23 Oct 2026); any
   later change to one of those records makes it stale again by the page's own check. Nothing here writes to the record. */
(function (W) {
 'use strict';
 const RW = '2026-10-23';
 const isDay = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
 const today = () => { try { return todayIso(); } catch (e) { return RW; } };
 const rwDay = d => { const x = isDay(d) ? d : today(); return x > RW ? RW : x; };
 const rwAfter = d => (isDay(d) ? d : today()) > RW;
 const dateWords = d => { try { return fmtDate(d); } catch (e) { return d; } };
 const num = v => { try { return fmtNum(v); } catch (e) { return String(v); } };
 W.PROGRESS_TO1163 = RW; W.rwDay1163 = rwDay; W.rwAfter1163 = rwAfter;

 /* references the schedule brings in after race weekend are not race-weekend progress: named, never counted */
 const inDay = r => (r && r.st && r.st.in) || null;
 const later = r => { const d = inDay(r); return isDay(d) && d > RW; };
 function scopeX(X) {
  if (!X || !Array.isArray(X.rows) || X.rw1163) return X;
  const out = X.rows.filter(later);
  const Y = Object.assign(Object.create(Object.getPrototypeOf(X)), X, {rows: out.length ? X.rows.filter(r => !later(r)) : X.rows});
  Y.rw1163 = {day: RW, out: out.map(r => ({key: r.a.key, name: r.a.name || '', discipline: r.a.discipline || '', units: r.asked || 0, in: inDay(r)}))
   .sort((a, b) => String(a.in).localeCompare(String(b.in)) || a.key.localeCompare(b.key))};
  return Y;
 }
 function laterWords(o) {
  const out = o && Array.isArray(o.out) ? o.out : [];
  if (!out.length) return '';
  return 'Booked to come in after race weekend, so not counted here: ' + out.map(x => x.key + (x.name ? ' ' + x.name : '') + ', ' + num(x.units) + ' '
   + String(x.discipline || 'units').toLowerCase() + ' from ' + dateWords(x.in)).join('; ') + '.';
 }
 W.rwScopeX1163 = scopeX; W.rwLaterWords1163 = laterWords;

 /* the in-side readings (due, on site, complete, overdue) and the fencing programme lines as at race weekend; the out-side
    readings (pick-ups, off site) and the calendar stay on the real day */
 const IN = ['total', 'due', 'complete', 'onsite', 'overdue', 'norecord', 'next', 'later', 'undated', 'early', 'overdue_keys', 'norecord_keys'];
 const mergeT = (real, rw) => { if (!real || !rw) return real; const t = Object.assign({}, real); IN.forEach(k => { if (k in rw) t[k] = Array.isArray(rw[k]) ? rw[k].slice() : rw[k]; }); return t; };
 function mergeP(P) {
  try {
   if (!P || !isDay(P.asOf) || P.asOf <= RW || P.rw1163) return P;
   const Q = progressAsOf(RW);
   const M = Object.assign({}, P, {all: mergeT(P.all, Q.all), byDisc: (P.byDisc || []).map(x => { const y = (Q.byDisc || []).find(z => z.discipline === x.discipline); return y ? Object.assign({}, x, {t: mergeT(x.t, y.t)}) : x; })});
   ['fenceLines', 'notRolled', 'areas', 'areasDone', 'weeksStarted'].forEach(k => { if (k in Q) M[k] = Q[k]; });
   M.asOf = RW; M.rw1163 = {real: P.asOf, day: RW};
   return M;
  } catch (e) { return P; }
 }
 W.rwMergeP1163 = mergeP;

 const wrapped = W.rw1163Wrapped = [];
 const wrap = (name, make) => {
  const base = W[name];
  if (typeof base !== 'function' || base.rw1163) return false;
  const g = make(base); g.rw1163 = true; W[name] = g; wrapped.push(name); return true;
 };
 /* the Today board's day, and every progress builder, stop at race weekend. A builder called without a day keeps its own
    default (the selected view date, or today) and only that default is capped. */
 W.todayWorkDayReal1163 = W.todayWorkDay841;
 wrap('todayWorkDay841', base => function () { return rwDay(base.apply(this, arguments)); });
 const viewDay = () => (typeof state !== 'undefined' && state && isDay(state.asOf)) ? state.asOf : today();
 const BUILDERS = {todayWorkMetrics840: today, todayWorkSummary842: viewDay, todayWorkSummary848: viewDay, todayFencingSummary841: today,
  todayFencingSummary847: today, todayFencingSummary848: today, todayGroupDetails841: viewDay, todayTypeMetrics843: viewDay,
  fenceOverall853: today, progress881Model: viewDay};
 Object.keys(BUILDERS).forEach(name => wrap(name, base => function (day) {
  const args = Array.prototype.slice.call(arguments);
  args[0] = rwDay(isDay(day) ? day : BUILDERS[name]());
  return base.apply(this, args);
 }));

 /* Delivery pace: as at race weekend, over what is booked by race weekend */
 wrap('completionAsOf', base => function (asOf, X) {
  const real = isDay(asOf) ? asOf : today(), d = rwDay(real);
  const Y = scopeX(X && d === real ? X : dsnState(d));
  const C = base.call(this, d, Y);
  try {
   if (C && Y && Y.rw1163) {
    C.rw1163 = Object.assign({}, Y.rw1163, {real});
    if (C.toRace != null && Y.P && Y.P.race && typeof daysBetween === 'function') C.toRace = daysBetween(real, Y.P.race);
   }
  } catch (e) {}
  return C;
 });
 wrap('completionBlock', base => function (asOf, C, opts) {
  const real = isDay(asOf) ? asOf : today();
  const c = C || completionAsOf(real);
  let html = base.call(this, rwDay(real), c, opts);
  try {
   if (c && c.rw1163) {
    html = html.replace(/ on the whole job/g, ' booked by race weekend');
    if (real > RW) html = html.replace(/by today/g, 'by race weekend');
   }
  } catch (e) {}
  return html;
 });
 wrap('wipModel', base => function (asOf) {
  const real = isDay(asOf) ? asOf : today(), d = rwDay(real);
  const M = base.call(this, d);
  try {
   if (M && d !== real && typeof moneySummary === 'function') M.M = moneySummary(real); /* the money stays on the real day */
   if (M && M.C && M.C.rw1163 && M.mode && M.mode.all) { M.mode.all.k2 = 'TO RACE WEEKEND'; M.mode.all.dt = 'Booked by race weekend · as at ' + M.dm + (M.C.refsNoQty ? ' · provisional' : ''); }
  } catch (e) {}
  return M;
 });
 /* Where we are: the plates as at race weekend, over what is booked by race weekend; the head and what has gone out stay on the day */
 wrap('dsnScreen', base => function (asOf) {
  const real = isDay(asOf) ? asOf : today(), d = rwDay(real);
  const X = scopeX(dsnState(d));
  const groups = dsnGroups(d, X);
  const note = groups && X.rw1163 ? '<p class="dsnsrc rw1163-note" data-rw1163>' + (real > RW ? '<b>Progress counts to race weekend, ' + dateWords(RW) + '.</b> ' : '<b>Progress to race weekend, ' + dateWords(RW) + '.</b> ')
   + (typeof esc === 'function' ? esc(laterWords(X.rw1163)) : laterWords(X.rw1163)) + '</p>' : '';
  return dsnHead(real) + groups + note + dsnOut(real);
 });
 wrap('progressMailto', base => function (asOf, X) {
  const real = isDay(asOf) ? asOf : today();
  if (real <= RW) return base.call(this, real, scopeX(X || dsnState(real)));
  const Y = scopeX(dsnState(rwDay(real)));
  try { Y.P = mergeP(dsnState(real).P); } catch (e) {}
  return base.call(this, real, Y);
 });
 /* the Showcase: the progress scenes read race weekend; the countdown, the people and the calendar stay on the day */
 const SCENES = ['install', 'equipment', 'complete', 'fence', 'fenceprog', 'effort', 'site'];
 wrap('showScene', base => function (key, asOf) { return base.call(this, key, SCENES.includes(key) ? rwDay(asOf) : asOf); });
 /* the milestones read from outside their own script (the banner's unseen check) */
 try {
  const MS = W.MS1025;
  if (MS && !MS.rw1163) {
   ['allFacts', 'reachedAreas', 'sectionHtml'].forEach(k => { const b = MS[k]; if (typeof b === 'function') MS[k] = function (asOf) { return b.call(this, rwDay(asOf)); }; });
   const f = MS.facts; if (typeof f === 'function') MS.facts = function (id, asOf) { return f.call(this, id, rwDay(asOf)); };
   MS.rw1163 = true;
  }
 } catch (e) {}

 /* 2. the crowd-control reviews and 3. the evidence catalogue, from the data read on 23 Oct 2026 */
 const D1163 = window.DATA1163 || null;
 try {
  const R = typeof DATA !== 'undefined' && DATA && DATA.fence_ccb_review847, add = D1163 && D1163.ccb;
  if (R && Array.isArray(R.rows) && add && !R.ccb1163) {
   const nos = new Set(add.rows.map(r => r.docket_no));
   R.rows = R.rows.filter(r => !nos.has(r.docket_no)).concat(add.rows);
   const ids = new Set(R.sources.map(s => s.id)); add.sources.forEach(s => { if (!ids.has(s.id)) { R.sources.push(s); ids.add(s.id); } });
   R.ccb1163 = true;
  }
 } catch (e) {}
 try {
  const F = typeof FENCE_PROGRESS848 !== 'undefined' ? FENCE_PROGRESS848 : null, ev = D1163 && D1163.evidence;
  if (F && Array.isArray(F.operations) && ev && !F.ev1163) {
   (ev.refresh || []).forEach(x => { const op = F.operations.find(o => o.id === x.id); if (op) { op.red_overlap = x.red_overlap; if (x.basis_add) op.basis = String(op.basis || '').trimEnd() + x.basis_add; } });
   const have = new Set(F.operations.map(o => o.id)); (ev.operations || []).forEach(o => { if (!have.has(o.id)) { F.operations.push(o); have.add(o.id); } });
   const ids = new Set(F.sources.map(s => s.id)); (ev.sources || []).forEach(s => { if (!ids.has(s.id)) { F.sources.push(s); ids.add(s.id); } });
   F.ev1163 = true;
  }
 } catch (e) {}

 /* a docket the record splits between Event and Demarcation (36627, 36629) is confirmed split, exactly as recorded: the page's
    own review runs every identity, snapshot and source check; the split must equal the record's two quantities to the metre */
 const TYPES = ['ccb_event', 'ccb_demarc'], NAMES = {ccb_event: 'Event', ccb_demarc: 'Demarcation'};
 const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
 wrap('fenceCcbReview847', base => function (record, options) {
  const r = base.apply(this, arguments);
  try {
   if (!r || r.state !== 'pending' || r.reviewState !== 'stale' || r.currentType !== null) return r;
   const input = options || {}, catalogue = own(input, 'catalogue') ? input.catalogue : typeof DATA === 'undefined' ? null : DATA.fence_ccb_review847;
   if (!catalogue || !Array.isArray(catalogue.rows)) return r;
   const rows = catalogue.rows.filter(x => x && (x.record_id === r.recordId || x.docket_no === r.docketNo));
   if (rows.length !== 1) return r;
   const d = rows[0].decision;
   if (!d || d.state !== 'confirmed' || d.type !== 'split' || !d.split || typeof d.split !== 'object') return r;
   const probe = Object.assign({}, catalogue, {rows: catalogue.rows.map(x => x === rows[0] ? Object.assign({}, x, {decision: Object.assign({}, d, {state: 'pending'})}) : x)});
   const chk = base.call(this, record, Object.assign({}, input, {catalogue: probe}));
   if (chk.reviewState !== 'current') return chk;
   const q = record && record.quantities || {};
   const keys = Object.keys(d.split);
   const same = keys.length === 2 && keys.every(k => TYPES.includes(k)) && TYPES.every(k => Number(d.split[k]) > 0 && Math.abs(Number(q[k]) - Number(d.split[k])) < 0.005);
   if (!same) return Object.assign(chk, {reviewState: 'stale', reason: 'The split CCB categories do not match the current allocation; review is required.'});
   const split = Object.fromEntries(TYPES.map(k => [k, Number(q[k])]));
   return Object.assign(chk, {state: 'confirmed', confirmedType: TYPES.map(k => NAMES[k] + ' ' + num(split[k]) + ' m').join(' · '), split1163: split, reason: d.basis});
  } catch (e) { return r; }
 });
 wrap('fenceCcbSummary847', base => function (dockets, options) {
  const S = base.apply(this, arguments);
  try {
   (S && S.rows || []).forEach(rv => {
    if (!rv || rv.state !== 'confirmed' || !rv.split1163) return;
    TYPES.forEach(k => { const v = rv.split1163[k]; if (!(v > 0)) return; S.pendingByType[k] = Math.round((S.pendingByType[k] - v) * 100) / 100; S.confirmedByType[k] = Math.round((S.confirmedByType[k] + v) * 100) / 100; });
   });
  } catch (e) {}
  return S;
 });
})(window);
