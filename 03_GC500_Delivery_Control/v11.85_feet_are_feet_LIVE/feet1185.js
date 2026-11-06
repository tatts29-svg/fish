/* Author: Andrew Fisher. v11.85 - the feet read as feet.
   Andrew, 24 Oct 2026: "Do you have the feet right ... Feet/bases we should have 1000s not hundreds ... Concrete block are wrong ...
   Forget what we charge i want data what they used ... What are concrete blocks are they not feet". They are: feet, bases and
   blocks are one item. The progress views carried a recorded-only "Fence blocks" line read from the docket column the card's
   Fence Blocks charge line uses (216, all of them docket 36566's bases, charged at $3.02 on the project manager's word of
   2 Oct 2026). It now reads "Feet / bases" with what the crew wrote in the component boxes of the usable hire agreements
   (fenceComponents849, the count the Showcase and the Fencing tab's components already show: 8,235 to race weekend), on the
   Today fencing table and its breakdown (every hire agreement with its feet) and on the Progress tab's planned-against-
   docketed table. The 216 are inside that total, counted once. Boxes left blank are counted and named, never estimated. The
   charge line, its rate, the Fencing tab's weekly charge lines and docket 36566's own entry are unchanged. Nothing here
   writes to the record. */
(function (W) {
 'use strict';
 const LABEL = 'Feet / bases', ID = 'fence_blocks';
 const isDay = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
 const fmt = n => { try { return fmtNum(n); } catch (e) { return String(n); } };
 const capped = day => (isDay(day) && typeof W.rwDay1163 === 'function') ? W.rwDay1163(day) : day;
 const plural = (n, one, many) => fmt(n) + ' ' + (n === 1 ? one : many);
 /* the feet the hire agreements carry to a day, from the page's own component count */
 function feet(day) {
  try {
   if (!isDay(day) || typeof W.fenceComponents849 !== 'function') return null;
   const C = W.fenceComponents849(day);
   if (!C || C.state !== 'ready') return null;
   const b = (C.recorded || []).find(t => t && t.id === 'base');
   if (!b) return null;
   const rows = (C.rows || []).filter(r => r && r.book === 'red' && typeof (r.components || {}).base === 'number' && r.components.base > 0);
   return {day: C.asOf, quantity: b.quantity || 0, records: b.sourceRecordCount || 0, blank: b.missingRecordCount || 0, rows};
  } catch (e) { return null; }
 }
 W.feet1185 = feet;
 const note = (f, blocks) => 'Feet (bases) the crew wrote in the component boxes of the usable hire agreements: feet, bases and blocks are one item. '
  + fmt(f.quantity) + ' on ' + plural(f.records, 'hire agreement', 'hire agreements') + '.'
  + (f.blank ? ' ' + plural(f.blank, 'hire agreement', 'hire agreements') + ' with panels or braces left the box blank; those are not estimated.' : '')
  + (blocks && blocks.recorded > 0 ? ' The ' + fmt(blocks.recorded) + ' on the card\'s Fence Blocks charge line (docket 36566) are these feet, counted once here.' : '')
  + ' No programme total is supplied.';

 /* 1. the fencing summary's recorded-only line (Today, the overall reading's details, the Showcase actuals) */
 function relabelRows(s) {
  if (!s || !Array.isArray(s.summaryRows) || s.feet1185) return s;
  const f = feet(s.asOf);
  if (!f) return s;
  const rows = s.summaryRows, at = rows.findIndex(r => r && r.id === ID);
  let row = at >= 0 ? rows[at] : null;
  const blocks = row ? {label: row.label, recorded: row.recorded, recordCount: row.recordCount} : null;
  if (!row) {
   if (!(f.quantity > 0)) return s;
   row = {id: ID, planned: null, remaining: null, pct: null, offProgramme: 0, recordCount: 0, issues: [], loading: false, missing: false,
    scope: 'Installation programme · Build + Event', confirmedRecorded: null, pendingRecorded: 0, totalRange: null, recordedRange: null, doneRange: null,
    leftRange: null, pctRange: null, undatedRecorded: 0, compoundRecorded: 0, unquantifiedPlan: false, asBuiltAllowance: false, sourcePlannedTotal: null,
    knownPlanRecorded: null, unquantifiedRecorded: 0, extraWorkRecorded: 0, evidencePending: false, classificationPending: false,
    classificationPendingMetres: 0, sourceProvisional: false, sourceIssues: []};
   const before = rows.findIndex(r => r && ['labour', 'ccb_unclassified', 'scrim_existing'].includes(r.id));
   if (before >= 0) rows.splice(before, 0, row); else rows.push(row);
  }
  Object.assign(row, {label: LABEL, unit: 'each', kind: 'recorded-only', recorded: f.quantity, redRecorded: f.quantity, knownPlanRecorded: f.quantity,
   recordCount: f.records, planned: null, remaining: null, pct: null, sourcePlannedTotal: null, extraWorkRecorded: 0, offProgramme: 0, undatedRecorded: 0,
   compoundRecorded: 0, comparison: 'Recorded only · no programme total', note: note(f, blocks),
   feet1185: {quantity: f.quantity, records: f.records, blank: f.blank, day: f.day, blocks}});
  s.feet1185 = true;
  return s;
 }
 const S0 = W.todayFencingSummary848;
 if (typeof S0 === 'function' && !S0.feet1185) {
  const g = function () { const s = S0.apply(this, arguments); try { relabelRows(s); } catch (e) {} return s; };
  g.feet1185 = true; W.todayFencingSummary848 = g;
 }

 /* 2. the Progress tab's planned-to-date against docketed table */
 function relabelLines(P) {
  if (!P || !Array.isArray(P.fenceLines) || P.feet1185 || !isDay(P.asOf)) return P;
  const f = feet(capped(P.asOf));
  if (!f) return P;
  const L = P.fenceLines, at = L.findIndex(l => l && l.column === ID);
  let l = at >= 0 ? L[at] : null;
  const blocks = l ? {name: l.name, done: l.done} : null;
  if (!l) { if (!(f.quantity > 0)) return P; l = {column: ID}; L.push(l); }
  Object.assign(l, {name: LABEL, unit: 'each', planned: null, behind: null, done: f.quantity,
   feet1185: {quantity: f.quantity, records: f.records, blank: f.blank, day: f.day, blocks}});
  P.feet1185 = true;
  return P;
 }
 const P0 = W.progressAsOf;
 if (typeof P0 === 'function' && !P0.feet1185) {
  const g = function () { const P = P0.apply(this, arguments); try { relabelLines(P); } catch (e) {} return P; };
  g.feet1185 = true; W.progressAsOf = g;
 }

 /* 3. the Today breakdown of that line: every hire agreement with its feet, not the one charge-line docket */
 function feetDockets(result, day) {
  const f = feet(capped(isDay(day) ? day : (typeof todayIso === 'function' ? todayIso() : null)));
  if (!f) return result;
  const records = typeof allDockets === 'function' ? allDockets() : [];
  const byId = new Map(records.map(d => [String(d.id), d]));
  const core = W.GC500FencingTrace837, keyOf = d => core && typeof core.key === 'function' ? core.key(d) : null;
  let papersState = 'unchecked';
  try { if (typeof photoIndex === 'function') { const st = photoIndex().state; papersState = st === 'ready' ? 'ready' : st === 'loading' || st === 'unrequested' ? 'checking' : st === 'none' ? 'unavailable' : 'unchecked'; } } catch (e) {}
  /* the same link rule as the page's own breakdown (todayLinkedFencing844) */
  const safeUrl = (value, thumbnail) => {
   if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return null;
   const url = value.trim();
   if (thumbnail && /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(url)) return url;
   try { const parsed = new URL(url, typeof location !== 'undefined' ? location.href : 'https://gc500.invalid/');
    return url && /^https?:$/.test(parsed.protocol) && !parsed.username && !parsed.password ? url : null; } catch (e) { return null; }
  };
  const papersOf = d => {
   const out = [], seen = new Set();
   if (!d) return out;
   for (const pointer of [...(typeof docketPapersOf === 'function' ? docketPapersOf(d.id) : []), ...(typeof docketPapersByName === 'function' ? docketPapersByName(d) : [])]) {
    if (!pointer || !pointer.id || seen.has(String(pointer.id))) continue;
    seen.add(String(pointer.id));
    let media = {state: 'unchecked'};
    try { if (typeof photoFor === 'function') media = photoFor(pointer); } catch (e) {}
    const paper = {id: String(pointer.id), name: String(media.file && (media.file.title || media.file.name) || pointer.name || pointer.id), state: media.state || 'unchecked'};
    if (media.state === 'ready') {
     const url = safeUrl(media.url, false), thumb = safeUrl(media.thumb, true);
     if (url) { paper.url = url; if (thumb) paper.thumb = thumb; } else paper.state = 'unavailable';
    }
    out.push(paper);
   }
   return out;
  };
  const rows = f.rows.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.number).localeCompare(String(b.number), undefined, {numeric: true}));
  result.unit = 'each';
  result.dockets = rows.map((r, i) => {
   const d = byId.get(r.recordId) || null, key = d ? keyOf(d) : null;
   const unique = key && records.filter(x => keyOf(x) === key).length === 1;
   return {key: 'feet1185:' + r.recordId + ':' + i, id: r.recordId, number: r.number, recordLabel: 'Hire agreement', date: r.date, quantity: r.components.base,
    unit: 'each', location: r.location, areaStatus: null, recordAction: unique ? {kind: 'fencing-docket', key} : {kind: 'fencing'}, areas: [],
    papers: papersOf(d), papersState, mapState: 'unmapped', mapNote: 'Feet as written in this hire agreement\'s component box.', sourceLinks: []};
  });
  result.plannedLocations = [];
  result.basis = 'Feet (bases) as the crew wrote them in the component boxes of the usable hire agreements, to the selected day: feet, bases and blocks are one item. ' + fmt(f.quantity) + ' on ' + plural(f.records, 'hire agreement', 'hire agreements') + ', each counted once.';
  result.qualifier = f.blank ? plural(f.blank, 'hire agreement', 'hire agreements') + ' with panels or braces left the box blank; those are not estimated.' : 'Every hire agreement with panels or braces has its feet written.';
  result.feet1185 = {quantity: f.quantity, records: f.records, blank: f.blank, day: f.day};
  return result;
 }
 const T0 = W.todayLinkedFencing848;
 if (typeof T0 === 'function' && !T0.feet1185) {
  const g = function (typeId, asOf) {
   const r = T0.apply(this, arguments);
   try { if (String(typeId) === ID && r && r.state === 'ready') feetDockets(r, asOf); } catch (e) {}
   return r;
  };
  g.feet1185 = true; W.todayLinkedFencing848 = g;
 }
})(window);
