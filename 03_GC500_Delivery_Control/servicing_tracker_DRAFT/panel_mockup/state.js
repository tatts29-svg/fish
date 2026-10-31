/* GC500 servicing tracker: THE STATE RULE. Author: Andrew Fisher, 18 Oct 2026.
   One copy, shared word for word by the crew card (/d/<token>) and the main page's read-only "Servicing tracker" panel
   on the Event nights tab, so a phone and the page can never show different percentages, rounding or finish times.
   The card's generator and the page patch paste this file in unchanged (ES5, no DOM, no clock of its own: the caller
   passes the service's time). In node: require('./state.js').
   Andrew, 18 Oct 2026: "purely just a track" - nothing here ticks the job record, changes a delivery state or a charge.

   THE RULE (the API contract of 18 Oct 2026):
   - A job is one task on one line on one service day. The tasks a line has are its kind's plan for that day
     (cfg.plans[kind][day.plan]): FWF Pumped out, Fresh water refilled, Cleaned & restocked; toilet block Pumped out,
     Cleaned & restocked; waste tank Pumped out; Sunday ("final") drops the water and adds Locked & confirmed empty.
   - A job is done while any done:true tick for it is not cancelled. An untick (done:false) cancels only the tick ids it
     names in `undoes`, and only ticks of the same line, task and day, so a late untick never wipes a newer tick from
     another phone. A voided tick (`voided`/`void`, or listed in a `voids` event from the edit link) counts for nothing.
   - A job's time is the earliest uncancelled tapped_at, never later than that tick's service `at`, never in the future.
     A tick with no usable tapped_at (the service drops one that is nowhere near its day) takes its `at`.
   - Andrew, 20 Oct 2026: "a button for if these were refilled but not to become part of a completion percentage".
     A task listed in cfg.extras (Refilled) is ticked and timed like any job but is left out of every percentage,
     every job count, a reference's "done" and an area's finished time.
   - Percentages (area and everything) = done jobs / all jobs for that day, each job weighed by its line's units
     (WC07's 20 FWF weigh 20), rounded DOWN so 99.x never shows 100.
   - A reference (a location) is done when every job on every one of its lines is done. A unit is serviced when every
     job on its line is done (units are counted by line: "u of 263 units").
   - An area's finished time is the latest done time of its jobs, once all of them are done; until then 0 (not finished).
   - Days run 08:00 to 08:00 Gold Coast time (UTC+10 all year): the service day of a moment is the Brisbane date of
     that moment minus 8 hours. Before the event the chooser opens on the first day that is not "if needed" (Friday). */
var SvcState = (function () {
'use strict';
var HOUR = 3600000;

/* ---- days */
function svcDay(ms) { return new Date(ms + 2 * HOUR).toISOString().slice(0, 10); }   /* Brisbane date of (time - 8 h) */
function dayStart(id) { return Date.parse(id + 'T08:00:00+10:00'); }
function hm(ms) { return new Date(ms + 10 * HOUR).toISOString().slice(11, 16); }       /* Brisbane hh:mm */
function dayOf(cfg, id) { var ds = cfg.days; for (var i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i]; return null; }
function autoDay(cfg, ms) {
  var ids = cfg.days.map(function (d) { return d.id; });
  var first = (cfg.days.filter(function (d) { return !d.ifNeeded; })[0] || cfg.days[0]).id;
  var s = svcDay(ms);
  if (s < ids[0]) return first;                           /* before the event it opens on Friday; Thursday is only in case */
  if (s > ids[ids.length - 1]) return ids[ids.length - 1];
  var best = ids[0];
  ids.forEach(function (id) { if (id <= s) best = id; });
  return best;
}
function dayOpen(id, ms) { return id <= svcDay(ms); }       /* the service refuses a day after the current one */

/* ---- what a line needs on a day: the plan's tasks for its kind */
function tasksFor(cfg, line, dayId) { var d = dayOf(cfg, dayId); var p = cfg.plans[line.kind]; return (p && d && p[d.plan]) || []; }
function jobKey(line, task, day) { return line + '|' + task + '|' + day; }
function isExtra(cfg, task) { return !!(cfg.extras && cfg.extras.indexOf(task) >= 0); }
function countedFor(cfg, line, dayId) { return tasksFor(cfg, line, dayId).filter(function (t) { return !isExtra(cfg, t); }); }

/* ---- the state of every job from the ticks (any order: cancelling goes by id, not by arrival) */
function jobStates(events, nowMs) {
  var byId = Object.create(null), cancelled = Object.create(null), out = Object.create(null);
  events.forEach(function (e) { if (e && e.id) byId[e.id] = e; });
  events.forEach(function (e) {
    if (!e) return;
    if (e.void || e.voided) { if (e.id) cancelled[e.id] = 1; return; }
    if (Array.isArray(e.voids)) { e.voids.forEach(function (id) { cancelled[id] = 1; }); return; }
    if (e.done === false && Array.isArray(e.undoes)) e.undoes.forEach(function (id) {
      var t = byId[id]; if (t && t.line === e.line && t.task === e.task && t.day === e.day) cancelled[id] = 1;
    });
  });
  events.forEach(function (e) {
    if (!e || e.done !== true || cancelled[e.id]) return;
    var at = Date.parse(e.at), tap = Date.parse(e.tapped_at);
    var t = isFinite(tap) ? tap : (isFinite(at) ? at : nowMs);
    if (isFinite(at) && t > at) t = at;
    if (t > nowMs) t = nowMs;
    var k = jobKey(e.line, e.task, e.day);
    var s = out[k] || (out[k] = { at: Infinity, local: true, ids: [] });
    if (t < s.at) s.at = t;
    if (!e.local) s.local = false;
    s.ids.push(e.id);
  });
  return out;
}
function jobAt(st, lineId, task, day) { var s = st[jobKey(lineId, task, day)]; return s ? s.at : 0; }

/* ---- percentages: a job weighs its line's units, rounded DOWN */
function pct(d, w) { return w ? Math.floor(d * 100 / w) : 0; }
function refStats(cfg, r, day, st) {
  var w = 0, d = 0, last = 0, pend = false, units = 0, unitsDone = 0;
  r.lines.forEach(function (l) {
    var ts = countedFor(cfg, l, day), all = ts.length > 0;
    ts.forEach(function (t) {
      w += l.qty; var s = st[jobKey(l.id, t, day)];
      if (s) { d += l.qty; if (s.at > last) last = s.at; if (s.local) pend = true; } else all = false;
    });
    if (ts.length) { units += l.qty; if (all) unitsDone += l.qty; }
  });
  return { w: w, d: d, done: w > 0 && d === w, last: last, pending: pend, units: units, unitsDone: unitsDone };
}
function groupStats(cfg, refs, day, st) {
  var w = 0, d = 0, last = 0, refsDone = 0, units = 0, unitsDone = 0;
  refs.forEach(function (r) {
    var s = refStats(cfg, r, day, st);
    w += s.w; d += s.d; units += s.units; unitsDone += s.unitsDone;
    if (s.done) refsDone++; if (s.last > last) last = s.last;
  });
  return { w: w, d: d, refsDone: refsDone, refs: refs.length, pct: pct(d, w), finished: w > 0 && d === w ? last : 0,
    units: units, unitsDone: unitsDone };
}


/* Per-crew job totals use the same unit weights and completed job states as the area percentage. */
function taskStats(cfg, refs, day, st) {
  var out = Object.create(null);
  refs.forEach(function (r) { r.lines.forEach(function (l) {
    countedFor(cfg, l, day).forEach(function (t) {
      var g = out[t] || (out[t] = { w: 0, d: 0, pct: 0 });
      g.w += l.qty;
      if (st[jobKey(l.id, t, day)]) g.d += l.qty;
    });
  }); });
  Object.keys(out).forEach(function (t) { out[t].pct = pct(out[t].d, out[t].w); });
  return out;
}

return { HOUR: HOUR, svcDay: svcDay, dayStart: dayStart, hm: hm, dayOf: dayOf, autoDay: autoDay, dayOpen: dayOpen,
  tasksFor: tasksFor, countedFor: countedFor, isExtra: isExtra, jobKey: jobKey, jobStates: jobStates, jobAt: jobAt, pct: pct, refStats: refStats, groupStats: groupStats, taskStats: taskStats };
})();
if (typeof module === 'object' && module && module.exports) module.exports = SvcState;
