/* Author: Andrew Fisher. Read-only Build card facts from the native roster, programme and dated delivery history. */
(function (root) {
 'use strict';
 const DAY = 86400000, ANCHOR = Date.UTC(2026, 9, 7);
 const list = value => Array.isArray(value) ? value : [];
 function dateNumber(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return null;
  const n = Date.parse(iso + 'T00:00:00Z');
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === iso ? n : null;
 }
 function monday(iso) {
  const n = dateNumber(iso); if (n === null) return null;
  return n - ((new Date(n).getUTCDay() + 6) % 7) * DAY;
 }
 function nativeDependencies() {
  return {
   weeks: typeof DATA !== 'undefined' ? list(DATA.weeks) : [],
   rules: typeof PS7 !== 'undefined' ? list(PS7.life) : [],
   weekOf: iso => typeof weekOf === 'function' ? weekOf(iso) : null,
   programmeDay: iso => typeof programmeDay === 'function' ? programmeDay(iso) : null,
   staff: iso => typeof StaffNames910 !== 'undefined' ? StaffNames910.day(iso) : null,
   loads: day => typeof dpLoads === 'function' ? dpLoads(day) : null,
   idOf: (day, load) => typeof ldId === 'function' ? ldId(day, load) : null,
   delivery: (key, iso) => typeof deliveryAsOf === 'function' ? deliveryAsOf(key, iso) : null,
   tally: (assets, iso) => typeof lightTally === 'function' ? lightTally(assets, iso) : null
  };
 }
 function weekReading(iso, day, env) {
  const weeks = list(env.weeks), programme = env.programmeDay ? env.programmeDay(iso) : null;
  let week = env.weekOf ? env.weekOf(iso) : null, source = 'programme-date';
  if (!week && day.sheet) { week = weeks.find(w => w.sheet === day.sheet) || {sheet: day.sheet, phase: day.phase}; source = 'day-source-sheet'; }
  if (!week) {
   const sheets = [...new Set(['deliveries', 'removals'].flatMap(kind => list(day[kind]).flatMap(r => list(r.events).map(e => e.sheet))).filter(Boolean))];
   if (sheets.length === 1) { week = weeks.find(w => w.sheet === sheets[0]) || {sheet: sheets[0], phase: day.phase || programme?.phase}; source = 'delivery-source-sheet'; }
  }
  if (!week) {
   const start = monday(iso), candidates = weeks.filter(w => start !== null && monday(w.start) === start && monday(w.end) === start);
   const unique = [...new Map(candidates.map(w => [String(w.phase || '') + '|' + w.sheet, w])).values()];
   if (unique.length === 1) { week = unique[0]; source = 'programme-calendar-week'; }
  }
  const phase = String(week?.phase || day.phase || programme?.phase || '').trim();
  const sheet = String(week?.sheet || '').trim();
  let label;
  if (/^Demob Week\s+\d+$/i.test(sheet)) label = 'DEMOB · ' + sheet.replace(/^Demob\s+/i, '').toUpperCase();
  else if (sheet && phase && !sheet.toLowerCase().includes(phase.toLowerCase())) label = phase.toUpperCase() + ' · ' + sheet.toUpperCase();
  else label = (sheet || phase || 'Outside programme').toUpperCase();
  const countdown = /^Week (\d+)$/i.exec(sheet);
  const note = phase === 'Build' && countdown ? sheet + ' counts down to event week; it is not the elapsed build week.' : '';
  return {label, source: week ? source : 'programme-phase', note,
   derivation: source === 'delivery-source-sheet' ? 'Week follows the delivery events’ source sheet.' : source === 'programme-calendar-week' ? 'Week follows the unique programme sheet in the same Monday–Sunday calendar week.' : ''};
 }
 function ruleReading(iso, env) {
  const rules = list(env.rules).filter(r => Array.isArray(r) && typeof r[0] === 'string' && r[0].trim() && typeof r[2] === 'string');
  const n = dateNumber(iso); if (!rules.length || n === null) return null;
  const index = ((Math.floor((n - ANCHOR) / DAY) % rules.length) + rules.length) % rules.length;
  const rule = rules[index];
  return {index, title: rule[0], text: rule[2], kind: 'calendar-reminder', briefingConfirmed: false,
   source: 'Coates Life Saving Rules · PS7.life',
   note: 'Daily calendar reminder. All Life Saving Rules still apply; this is not a record that a briefing took place.'};
 }
 function loadReading(iso, today, day, env) {
  const future = iso > today, past = iso < today;
  const base = {completed: null, total: null, verified: false, groupingVerified: false, percent: null, scheduledGroups: 0,
   status: 'unavailable', source: 'Native day load groups and dated delivery history', issues: []};
  if (day.iso && day.iso !== iso) return {...base, issues: ['Day model does not match the requested date.']};
  const groups = env.loads ? env.loads(day) : null;
  if (!Array.isArray(groups)) return {...base, issues: ['Load groups unavailable.']};
  base.scheduledGroups = groups.length;
  if (!groups.length && list(day.loads).length) return {...base, status: 'not-verified', issues: ['Carrier loads have no corresponding referenced load groups.']};
  if (!groups.length) return {...base, completed: future ? null : 0, total: 0, verified: true, groupingVerified: true, status: 'none-scheduled',
   source: 'No load groups in the current programme for this date.'};
  const issues = [], seen = new Set(); let completed = 0;
  const start = Date.parse(iso + 'T00:00:00+10:00'), end = start + DAY;
  for (const group of groups) {
   const id = env.idOf ? env.idOf(day, group) : null;
   if (!id || seen.has(id)) issues.push('Load identity is missing or duplicated.');
   seen.add(id);
   if (group.kind !== 'deliveries') issues.push('Removal completion is not established by delivery records.');
   if (!['booking', 'load', 'plan'].includes(group.basis) || group.basis === 'booking' && !group.truck_id) issues.push('A reference page is not a confirmed truck load.');
   const assets = [...new Map(list(group.rows).filter(r => r?.a?.key).map(r => [r.a.key, r.a])).values()];
   if (!assets.length) { issues.push('Load has no referenced equipment.'); continue; }
   if (future) continue;
   const tally = env.tally ? env.tally(assets, iso) : null;
   if (!tally || tally.total !== assets.length || !Number.isFinite(tally.done) || tally.done < 0 || tally.done > assets.length) { issues.push('Dated completion count unavailable.'); continue; }
   let dated = true;
   for (const asset of assets) {
    const record = env.delivery ? env.delivery(asset.key, iso) : null;
    if (!record) { issues.push('Dated delivery history unavailable.'); dated = false; continue; }
    if (record.done) {
     const at = Date.parse(record.done_at);
     if (!Number.isFinite(at) || at < start || at >= end) {
      issues.push('A reference completion is undated or belongs to a different day.'); dated = false;
     }
    }
   }
   if (dated && tally.done === assets.length) completed++;
  }
  if (issues.length) return {...base, total: future ? groups.length : null, issues: [...new Set(issues)], status: future ? 'scheduled' : 'not-verified',
   source: future ? 'Current programme groups; their allocation to physical trucks is not verified.' : base.source};
  return {...base, completed: future ? null : completed, total: groups.length, verified: true, groupingVerified: true,
   percent: future ? null : completed / groups.length * 100,
   status: future ? 'scheduled' : completed === groups.length ? 'complete' : 'incomplete',
   source: future ? 'Recorded bookings and grouped loads in the current programme.' :
    'Recorded load groups: every reference has dated completion on this Brisbane date, with native quantity checks.' + (past ? ' Completion is replayed to the day’s close.' : ''),
   issues: []};
 }
 function create(env) {
  return {day(iso, today, dayObj) {
   if (dateNumber(iso) === null || dateNumber(today) === null) return {iso, valid: false, weekLabel: 'DATE UNAVAILABLE', staffNames: [], staffRecorded: false,
    loads: {completed: null, total: null, verified: false, percent: null, status: 'unavailable', issues: ['Invalid date.']}, lifeSavingRule: null, detailNote: 'A valid Brisbane calendar date is required.'};
   const day = dayObj || {iso}, week = weekReading(iso, day, env), roster = env.staff ? env.staff(iso) : null;
   const staffNames = [...new Set(list(roster?.names).map(n => String(n).trim()).filter(Boolean))];
   const loads = loadReading(iso, today, day, env), lifeSavingRule = ruleReading(iso, env);
   return {iso, valid: true, period: iso < today ? 'past' : iso > today ? 'future' : 'today', weekLabel: week.label,
    weekSource: week.source, staffNames, staffRecorded: staffNames.length > 0,
    staffSource: 'Native named day roster · StaffNames910.day', loads, lifeSavingRule,
    detailNote: [week.note, week.derivation, loads.source, ...loads.issues, lifeSavingRule?.note].filter(Boolean).join(' ')};
  }};
 }
 root.BuildCardData984 = {create, day(iso, today, dayObj) { return create(nativeDependencies()).day(iso, today, dayObj); }};
})(typeof window !== 'undefined' ? window : globalThis);
