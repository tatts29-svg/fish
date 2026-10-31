/* Author: Andrew Fisher. v11.81 - the fencing build is complete at the docket numbers.
   Andrew, 24 Oct 2026: "So we need fencing to be 100% now and we work off number we have for completion of build", then
   "If we need to change anything in broadcast lets do it so everytjing matches we want everything to match."
   1. The project manager's ruling of 24 Oct 2026 closes the Build + Event programme at the numbers the dockets hold. At race
      weekend (the v11.63 cut-off, Fri 23 Oct) each fencing type whose recorded work is short of its programme line reads done
      = programme: scrim, vehicle and pedestrian gates, demarcation crowd control, relocations, removals. The original
      programme quantity stays on the row (closedBuild1181) and in its details; types already over their line (temporary
      fence 13,270 of 12,617 m, event crowd control, flat feet) are untouched, and the temporary-fence total is not changed.
      Readings for days before race weekend are untouched.
   2. The event week's leftover programme quantities are no longer forecast (cj764Fencing reads the event week as done, as
      v11.59 reads an ended week). The demob programme still to come stays in the forecast.
   3. Two crowd-control dockets confirmed as recorded (36766, 36768: Event) and service note 24492's 30 m relocation added
      to the reviewed evidence, on v11.63's mechanism and rules (data_v1181, read 24 Oct 2026); a later change to any of
      those records makes it stale again by the page's own check.
   Nothing here writes to the record. */
(function (W) {
 'use strict';
 const RULING = W.FENCE_BUILD_CLOSED1181 = {by: 'the project manager', on: '2026-10-24', at: '2026-10-23', weeks: ['EVENT WEEK'],
  said: 'So we need fencing to be 100% now and we work off number we have for completion of build',
  types: ['scrim', 'v_gates', 'ped_gates', 'ccb_event', 'ccb_demarc', 'relocation', 'removal', 'clean', 'flat_feet']};
 const isDay = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
 const num = v => typeof v === 'number' && Number.isFinite(v);
 const r2 = n => Math.round(n * 100) / 100;
 const today = () => { try { return todayIso(); } catch (e) { return RULING.on; } };
 const words = 'Build complete at the docket numbers (the project manager, 24 Oct 2026)';

 /* the forecast: the event week is done on the ruling, as an ended week is */
 W.fenceBuildClosed1181 = function (w, day) {
  return !!(w && RULING.weeks.includes(String(w.progSheet || w.prog || '').toUpperCase()) && (isDay(day) ? day : today()) >= RULING.on);
 };

 /* 3. the two crowd-control reviews and the 24492 relocation, from the data read on 24 Oct 2026 */
 const D = W.DATA1181 || null;
 try {
  const R = typeof DATA !== 'undefined' && DATA && DATA.fence_ccb_review847, add = D && D.ccb;
  if (R && Array.isArray(R.rows) && add && !R.ccb1181) {
   const nos = new Set(add.rows.map(r => r.docket_no));
   R.rows = R.rows.filter(r => !nos.has(r.docket_no)).concat(add.rows);
   const ids = new Set(R.sources.map(s => s.id)); add.sources.forEach(s => { if (!ids.has(s.id)) { R.sources.push(s); ids.add(s.id); } });
   R.ccb1181 = true;
  }
 } catch (e) {}
 try {
  const F = typeof FENCE_PROGRESS848 !== 'undefined' ? FENCE_PROGRESS848 : null, ev = D && D.evidence;
  if (F && Array.isArray(F.operations) && ev && !F.ev1181) {
   const have = new Set(F.operations.map(o => o.id)); (ev.operations || []).forEach(o => { if (!have.has(o.id)) { F.operations.push(o); have.add(o.id); } });
   const ids = new Set(F.sources.map(s => s.id)); (ev.sources || []).forEach(s => { if (!ids.has(s.id)) { F.sources.push(s); ids.add(s.id); } });
   F.ev1181 = true;
  }
 } catch (e) {}

 /* 1. the rows at race weekend: a type short of its programme line reads done = programme, its line kept beside it */
 const viewDay = () => (typeof state !== 'undefined' && state && isDay(state.asOf)) ? state.asOf : today();
 const atDay = day => { const d = isDay(day) ? day : viewDay(); return typeof W.rwDay1163 === 'function' ? W.rwDay1163(d) : d; };
 function closeRows(rows) {
  (rows || []).forEach(row => {
   if (!row || !RULING.types.includes(row.id)) return;
   if (!num(row.total) || !num(row.done) || row.total < 0 || row.done < 0) return;
   if (row.totalRange || row.doneRange || row.recordedRange || row.classificationPending || row.evidencePending || row.unquantifiedPlan) return;
   const left = r2(row.total - row.done);
   if (left > 0 && !row.closedBuild1181) {
    row.closedBuild1181 = {programme: row.total, left, ruling: RULING.on};
    row.issues = (row.issues || []).concat([words + ': ' + (typeof fmtNum === 'function' ? fmtNum(left) : left) + ' ' + (row.unit || '') + ' of the programme line ('
     + (typeof fmtNum === 'function' ? fmtNum(row.total) : row.total) + ' ' + (row.unit || '') + ') was never docketed and is not carried.']);
    Object.assign(row, {total: row.done, left: 0, remaining: 0, pct: 100, leftRange: null, pctRange: null});
    if (row.plan && typeof row.plan === 'object') row.plan = Object.assign({}, row.plan, {behind: 0, status: 'on-plan', label: words});
   }
   if (row.sourceProvisional) {
    row.sourceProvisional = false; row.provisionalClosed1181 = true;
    if (row.plan && typeof row.plan.label === 'string' && /^Provisional:\s*/.test(row.plan.label)) row.plan = Object.assign({}, row.plan, {label: row.plan.label.replace(/^Provisional:\s*/, '')});
   }
  });
  return rows;
 }
 /* the programme/docket table (progressAsOf fenceLines) at race weekend: planned stays the programme's own figure; what was
    never docketed is not carried, so nothing reads as not yet docketed */
 function closeLines(lines) {
  (lines || []).forEach(l => {
   if (!l || !RULING.types.includes(l.column) || l.closedBuild1181 || l.ccbPending) return;
   if (!num(l.planned) || !num(l.done) || !num(l.behind) || l.behind <= 0) return;
   l.closedBuild1181 = {planned: l.planned, behind: l.behind, ruling: RULING.on}; l.behind = 0;
  });
  return lines;
 }
 W.closeFenceLines1181 = closeLines;
 const P0 = W.progressAsOf;
 if (typeof P0 === 'function' && !P0.closed1181) {
  const g = function () { const P = P0.apply(this, arguments); try { if (P && isDay(P.asOf) && P.asOf >= RULING.at && Array.isArray(P.fenceLines)) closeLines(P.fenceLines); } catch (e) {} return P; };
  g.closed1181 = true; W.progressAsOf = g;
 }
 W.closeFenceRows1181 = closeRows;
 const base = W.todayWorkSummary848;
 if (typeof base === 'function' && !base.closed1181) {
  const f = function (day) {
   const s = base.apply(this, arguments);
   try { if (s && Array.isArray(s.fencingRows) && atDay(day) >= RULING.at) { closeRows(s.fencingRows); s.closedBuild1181 = RULING; } } catch (e) {}
   return s;
  };
  f.closed1181 = true; W.todayWorkSummary848 = f;
 }
 /* the overall reading rebuilds the temporary-fence row from the source summary; on a closed summary it reads the ruling too */
 const FP = W.FencingProgress1104;
 if (FP && typeof FP.rows === 'function' && !FP.rows.closed1181) {
  const rows0 = FP.rows;
  const g = function (summary, fencing) { const r = rows0.apply(this, arguments); try { if (summary && summary.closedBuild1181) closeRows(r); } catch (e) {} return r; };
  g.closed1181 = true; FP.rows = g;
 }
})(window);
