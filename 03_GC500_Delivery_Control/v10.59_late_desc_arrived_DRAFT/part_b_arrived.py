"""Author: Andrew Fisher. v10.59 part B - an arrival recorded late lands on the day it came.

Andrew, 17 Oct 2026: "the swivel chairs turned up on the correct day. So did the fridges", then "What dates they
should of had turn up. Have it as those dates". P26 and P28 (the police fridges) and P34 (the chairs) were due 14 Oct
and came that day; they were recorded on site 17 Oct.

The page stamps a light at the moment it is set, so an arrival recorded late counted on the day it was recorded.

What this adds:
- arrivedOn1059.set(key, iso, why): on the edit link, for a reference whose light is on site now and which the record
  does not already have on site by that day's close, adds ONE entry to its light history, in the form the record
  already uses for a day with no time (T0266's 13 Oct arrival, entered 14 Oct):
    {state: 'on site', at: <00:00 that Brisbane day>, by, recorded_at: <now>, date_only: true, effective_date: iso, note?}
  Nothing else moves: the light, its time and who set it stay as recorded. The history is a union across copies, so
  the entry cannot be lost in a merge. The page's stamp formatting already prints it as "14 Oct · time not recorded".
- Every view that replays a past day (whole build at the day's close, DAY'S DELIVERIES receipts, WHAT WENT IN,
  arrivals on a day, arrived by) reads the entry like any other, so the item counts from the day it came.
- A light set after such an entry is not a second arrival: arrivals on a day and the day it went green skip it; the
  day cards call it "set again · already on site since 14 Oct (time not recorded)".
- No screen prints the entry's 00:00 as a time: the day cards' came-in and WHAT WENT IN lines say "on site by the day's
  close (time not recorded) · entered <when>"; Coates on time never uses it as a site tick; the change log and the
  milestone sheet read the history in time order.

    python3 part_b_arrived.py path/to/page.html
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"

JS = r'''/* Author: Andrew Fisher. v10.59 - an arrival recorded late lands on the day it came (Andrew, 17 Oct 2026: "the swivel chairs turned up on the correct day. So did the fridges"). */
(function(W){
 'use strict';
 if (W.arrivedOn1059) return;
 const valid = x => /^\d{4}-\d{2}-\d{2}$/.test(String(x)) && Number.isFinite(Date.parse(x + 'T00:00:00Z')) && new Date(x + 'T00:00:00Z').toISOString().slice(0, 10) === x;
 /* the entry this adds: on site by the close of the day, no time of day */
 const late = h => !!(h && h.state === 'on site' && h.date_only === true && valid(h.effective_date));
 function set(key, iso, why){
  if (typeof mayWrite !== 'function' || !mayWrite('the day it came')) return {ok: false, reason: 'not an edit link'};
  if (!isRef(key)) return {ok: false, reason: String(key || '') + ' is not a reference in this file'};
  if (!valid(iso)) return {ok: false, reason: 'not a date'};
  if (iso >= todayIso()) return {ok: false, reason: 'the day must be before today; today is recorded by the light itself'};
  const who = whoAmI(); if (!who) return {ok: false, reason: 'no name to record it under'};
  const d = deliveryOf(key);
  if (!(d.recorded && d.state === 'on site')) return {ok: false, reason: key + ' is not on site now; set its light first'};
  /* the light must be set on site on the reference's own record (not only the rental system's date or the schedule's
     copy): an entry on a record with no light of its own could be dropped as empty, or read as the rental's */
  const own = (S.delivery || {})[key];
  if (!own || own.state !== 'on site') return {ok: false, reason: key + '\'s light is not set on site on its own record; set its light first'};
  /* a light that changed after that day (a pick-up, a correction) is for a person to read before an earlier arrival goes in */
  const cut = cutoffOf(iso), nowIso = new Date().toISOString();
  if (histOf(key, 'history').some(h => h && h.state !== 'on site' && h.at > cut && h.at <= nowIso)) return {ok: false, reason: key + '\'s light changed after ' + iso + '; read its history first'};
  const was = deliveryAsOf(key, iso);
  if (was && was.recorded && was.state === 'on site') return {ok: true, already: true, reason: key + ' is already on site by the close of ' + iso};
  S.delivery = S.delivery || {};
  const x = S.delivery[key] || (S.delivery[key] = {});
  const entry = {state: 'on site', at: new Date(iso + 'T00:00:00+10:00').toISOString(), by: who, recorded_at: new Date().toISOString(), date_only: true, effective_date: iso};
  const note = String(why == null ? '' : why).trim().slice(0, 200); if (note) entry.note = note;
  x.history = (Array.isArray(x.history) ? x.history : []).concat([entry]).slice(-400);
  bump();
  return {ok: true, entry};
 }
 /* words for the entry wherever a light change is listed */
 function words(h){ return late(h) ? 'on site by ' + fmtDate(h.effective_date) + ' (time not recorded)' + (h.recorded_at ? ' · entered ' + fmtStamp(h.recorded_at) : '') + (h.by ? ' by ' + h.by : '') : ''; }
 W.arrivedOn1059 = {set, late, words};
})(window);
'''

PATCHES = [
    ('arrived on: the page function', END, '</script>\n<script id="arrivedon1059-script">' + JS + '</script>\n</body>\n</html>'),
    ('arrivals on a day: a light set after a day-only arrival is not a second arrival',
     " (d.history || []).forEach(h => { if (h.state === 'on site' && dayStampOf(h.at) === iso) { at = h.at; by = h.by || null; } });\n"
     " if (!at && d.recorded && d.state === 'on site' && dayStampOf(d.set_at) === iso) { at = d.set_at; by = d.by || null; }",
     " /* v10.59 - an arrival entered later as on site by a day (date only) accounts for the light set when it was entered */\n"
     " let run1059 = false; (d.history || []).forEach((h, i, hs) => { if (h.state !== 'on site') { run1059 = false; return; } if (h.date_only === true) run1059 = true; else if (run1059 && i && hs[i - 1].state === 'on site') return; if (dayStampOf(h.at) === iso) { at = h.at; by = h.by || null; } });\n"
     " if (!at && !run1059 && d.recorded && d.state === 'on site' && dayStampOf(d.set_at) === iso) { at = d.set_at; by = d.by || null; }"),
    ('the day it went green: the day-only arrival, not the later re-set',
     " (d.history || []).forEach(h => { if (h.state === 'on site') at = h.at; });\n return dayStampOf(at || d.set_at);",
     " let run1059 = false; (d.history || []).forEach((h, i, hs) => { if (h.state !== 'on site') { run1059 = false; return; } if (h.date_only === true) { run1059 = true; at = h.at; return; } if (run1059 && i && hs[i - 1].state === 'on site') return; at = h.at; });\n return dayStampOf(at || d.set_at);"),
    ('change log: the light steps in time order (an entry added later for an earlier day sits where it belongs)',
     " Object.entries(S.delivery || {}).forEach(([k, d]) => {\n const hist = Array.isArray(d.history) ? d.history : [];",
     " Object.entries(S.delivery || {}).forEach(([k, d]) => {\n const hist = (Array.isArray(d.history) ? d.history : []).slice().sort((x, y) => String(x.at).localeCompare(String(y.at)));"),
    ('equipment facts: a day-only arrival is the day it came',
     "const observed=uniq((d.history||[]).filter(h=>h.state==='on site').map(h=>day(h.at)).concat(d.recorded&&d.state==='on site'?day(d.set_at):null));",
     "const late1059=(d.history||[]).filter(h=>h.state==='on site'&&h.date_only===true&&h.effective_date).map(h=>h.effective_date);const observed=late1059.length?uniq(late1059):uniq((d.history||[]).filter(h=>h.state==='on site').map(h=>day(h.at)).concat(d.recorded&&d.state==='on site'?day(d.set_at):null));"),
    ('milestone sheet: the history in time order',
     "  const hist = (r.history || []).filter(h => h && h.at && dayOf(h.at) && dayOf(h.at) <= asOf);",
     "  const hist = (r.history || []).filter(h => h && h.at && dayOf(h.at) && dayOf(h.at) <= asOf).slice().sort((x, y) => String(x.at).localeCompare(String(y.at)));"),
    ('day cards (v10.56): came in on a day-only arrival says so, not 00:00',
     "   return {ref: a.key, desc, qty: qty.join(' · ') || '—', at: r.at};",
     "   return {ref: a.key, desc, qty: qty.join(' · ') || '—', at: r.at, late: ((r.d && r.d.history) || []).find(h => h && h.at === r.at && h.date_only === true) || null};"),
    ('day cards (v10.56): the came-in source line',
     "source: 'On site ' + hhmm(x.at) + ' · quantity on the reference'",
     "source: (x.late ? 'On site by the day’s close (time not recorded)' + (x.late.recorded_at ? ' · entered ' + day(x.late.recorded_at) + ' ' + hhmm(x.late.recorded_at) : '') : 'On site ' + hhmm(x.at)) + ' · quantity on the reference'"),
    ('WHAT WENT IN: the site light time on a day is a real light set, never a day-only entry',
     "  const h0 = hist(a, 'history'); let at = null; h0.forEach(h => { if (h.state === 'on site' && dayOf(h.at) === iso) at = h.at; });",
     "  const h0 = hist(a, 'history'); let at = null; h0.forEach(h => { if (h.state === 'on site' && h.date_only !== true && dayOf(h.at) === iso) at = h.at; });"),
    ('WHAT WENT IN: a day-only arrival named as such',
     "  if (lit) bits.push((was.on ? 'Site light set again ' : 'Site light ') + hm(lit));",
     "  if (lit) bits.push((was.on ? 'Site light set again ' : 'Site light ') + hm(lit));\n"
     "  else { const late = hist(a, 'history').find(h => h.state === 'on site' && h.date_only === true && h.effective_date === iso); if (late) bits.push('On site by the day’s close (time not recorded)' + (late.recorded_at ? ' · entered ' + dmy(dayOf(late.recorded_at)) + ' ' + hm(late.recorded_at) : '') + (late.by ? ' by ' + late.by : '')); }"),
    ('WHAT WENT IN: already on site since a day-only arrival',
     "(b ? ' since ' + dmy(dayOf(b.at)) + ' ' + hm(b.at) : '')",
     "(b ? ' since ' + (b.date_only === true && b.effective_date ? dmy(b.effective_date) + ' (time not recorded)' : dmy(dayOf(b.at)) + ' ' + hm(b.at)) : '')"),
    ('milestone sheet: a day-only entry is not a move',
     "  if (hist.length > 1) movedMany.push({key: a.key, n: hist.length, path: hist.map(h => h.state).join(' → ')});",
     "  const moves1059 = hist.filter(h => h.date_only !== true); if (moves1059.length > 1) movedMany.push({key: a.key, n: moves1059.length, path: moves1059.map(h => h.state).join(' → ')});"),
    ('milestone sheet: the first on-site entry carries its day-only flag',
     "  if (first) { onsite.push({key: a.key, at: first.at, by: first.by || null});",
     "  if (first) { onsite.push({key: a.key, at: first.at, by: first.by || null, date_only: first.date_only === true, effective_date: first.effective_date || null});"),
    ('milestone sheet: a day-only first on site prints the day, not 00:00',
     "const ev = e => e ? `${esc(e.key)} · ${esc(dmyhm(e.at))}",
     "const ev = e => e ? `${esc(e.key)} · ${esc(e.date_only && e.effective_date ? dmy(e.effective_date) + ' · time not recorded' : dmyhm(e.at))}"),
    ('Coates on time: a day-only entry is never a site tick',
     "  const hs = (d && Array.isArray(d.history) ? d.history : []).filter(h => h && Number.isFinite(Date.parse(h.at))).slice()",
     "  const hs = (d && Array.isArray(d.history) ? d.history : []).filter(h => h && h.date_only !== true && Number.isFinite(Date.parse(h.at))).slice()"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'arrivedon1059-script' in t: sys.exit('part_b refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('part_b applied: arrivedOn1059.set - an arrival recorded late lands on the day it came')
