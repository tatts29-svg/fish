"""Author: Andrew Fisher. v10.59 part B - an arrival recorded late lands on the day it came.

Andrew, 17 Oct 2026, on P26, P28 (the police fridges), P34 (the chairs) and the broadcast fridges FR01/FR02, all
recorded on site on 17 Oct: "the swivel chairs turned up on the correct day. So did the fridges". They came on 14 Oct.

The page stamps a light at the moment it is set, so until now an arrival recorded late counted on the day it was
recorded: the 14 Oct card read 11 / 16 received, with those five "receipt incomplete".

What this adds:
- arrivedOn1059.set(key, iso, why): on the edit link, for a reference whose light is on site now and which the
  record does not already have on site by that day's close, adds ONE entry to its light history:
    {state: 'on site', at: <the last instant of that Brisbane day>, by, arrived_on: iso, entered_at: <now>,
     time_not_recorded: true, note?}
  Nothing else moves: the light, its time and who set it stay as recorded. A history entry is kept by every copy (the
  history is a union), so it cannot be lost in a merge.
- Every view that replays a past day (whole build at the day's close, DAY'S DELIVERIES receipts, WHAT WENT IN,
  arrivals on a day, arrived by) reads the entry like any other, so the item counts from the close of the day it came.
- No screen prints the entry's stamp as a time: where a time would show it reads "time not recorded" with the day it
  came and who entered it, and when (see DISPLAY below).

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
 const late = h => !!(h && h.time_not_recorded === true && valid(h.arrived_on));
 function set(key, iso, why){
  if (typeof mayWrite !== 'function' || !mayWrite('the day it came')) return {ok: false, reason: 'not an edit link'};
  if (!isRef(key)) return {ok: false, reason: String(key || '') + ' is not a reference in this file'};
  if (!valid(iso)) return {ok: false, reason: 'not a date'};
  if (iso >= todayIso()) return {ok: false, reason: 'the day must be before today; today is recorded by the light itself'};
  const who = whoAmI(); if (!who) return {ok: false, reason: 'no name to record it under'};
  const d = deliveryOf(key);
  if (!(d.recorded && d.state === 'on site')) return {ok: false, reason: key + ' is not on site now; set its light first'};
  const was = deliveryAsOf(key, iso);
  if (was && was.recorded && was.state === 'on site') return {ok: true, already: true, reason: key + ' is already on site by the close of ' + iso};
  S.delivery = S.delivery || {};
  const x = S.delivery[key] || (S.delivery[key] = {});
  const entry = {state: 'on site', at: cutoffOf(iso), by: who, arrived_on: iso, entered_at: new Date().toISOString(), time_not_recorded: true};
  const note = String(why == null ? '' : why).trim().slice(0, 200); if (note) entry.note = note;
  x.history = (Array.isArray(x.history) ? x.history : []).concat([entry]).slice(-400);
  bump();
  return {ok: true, entry};
 }
 /* words for the entry wherever a light change is listed */
 function words(h){ return late(h) ? 'on site by ' + fmtDate(h.arrived_on) + ' (time not recorded) · entered ' + fmtStamp(h.entered_at) + (h.by ? ' by ' + h.by : '') : ''; }
 W.arrivedOn1059 = {set, late, words};
})(window);
'''

PATCHES = [
    ('arrived on: the page function', END, '</script>\n<script id="arrivedon1059-script">' + JS + '</script>\n</body>\n</html>'),
]
# DISPLAY patches are added after the readers audit (arrived-on-readers workflow): each place that prints a light
# stamp as a time skips or words the late entry.

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'arrivedon1059-script' in t: sys.exit('part_b refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('part_b applied: arrivedOn1059.set - an arrival recorded late lands on the day it came')
