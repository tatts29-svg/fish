#!/usr/bin/env python3
"""v7.42 - the pit lane is the way in. Andrew Fisher, 29 Sep 2026: "Anywhere in the park the truck entry point is going
to be pit lane. From the road they go into the pit lane." "You're driving from the left, the same way the race cars go."
 - one rule for every reference inside Macintosh Island Park: off the Gold Coast Highway into the pit lane at its
   north-west end, then down the lane the way the race cars go; a pin taken at a turn-in still wins for its reference
 - the drawer's Way in row, the driver sheet, Navigate and the maps all read it; the end can be switched on the record
    python3 patch_v742.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function pitLaneWayIn(' in t: sys.exit('v7.42 already applied')
if 'function photoLinkPut(' not in t: sys.exit('needs v7.41')
JS = open(os.path.join(here, 'pit742_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'pit742.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
# 1. the reader: entryOf now falls back to the rule
t = rep(t, "function entryOf(ref){ return (S.entries || {})[ref] || null; }", JS, 'entryOf', p, True)
# 2. pinning and clearing: a pin is compared with what was PINNED, not with the rule; clearing says the rule is back
t = rep(t, " const had = entryOf(ref);\n takeBestFix(", " const had = (S.entries || {})[ref]; /* v7.42 - the rule is not a pin that was here */\n takeBestFix(", 'pin had', p, True)
t = rep(t, " flash(ref + ' — the recorded way in is taken off. Directions go to the drop itself again.');",
 " flash(ref + ' — the recorded way in is taken off. ' + (entryOf(ref) ? 'The pit lane is the way in again.' : 'Directions go to the drop itself again.'));", 'clear words', p, True)
# 3. the drawer's Way in row
t = rep(t, "function entryRow(a){\n const e = entryOf(a.key);\n if (!e) return", "function entryRow(a){\n const e = entryOf(a.key);\n if (e && e.gate) return pitLaneRow(a, e); /* v7.42 */\n if (!e) return", 'row', p, True)
# 4. the driver sheet
t = rep(t, """ (() => { const en = entryOf(a.key); if (!en || en.lat == null) return '';
 const q = fixQuality(en.acc), d = entryToDrop(a.key);
 return '<br><br><b>Way in — where to turn off the street:</b><br>'""",
 """ (() => { const en = entryOf(a.key); if (!en || en.lat == null) return '';
 const q = fixQuality(en.acc), d = entryToDrop(a.key);
 if (en.gate) return '<br><br><b>Way in — the pit lane:</b><br>' /* v7.42 */
 + '<a href="' + e(navUrl({lat: en.lat, lon: en.lon})) + '" style="font-family:Consolas,monospace;font-size:12.5px;color:' + INK + '">'
 + en.lat.toFixed(6) + ', ' + en.lon.toFixed(6) + '</a>'
 + ' <span style="color:' + MUTE + '">' + e(pitLaneWords(en)) + (d ? ' · ' + d.m + ' m from ' + e(d.basis) : '') + '</span>'
 + '<br><span style="color:' + MUTE + '">' + e(pitLaneRuleWords()) + '</span>';
 return '<br><br><b>Way in — where to turn off the street:</b><br>'""", 'sheet', p, True)
# 5. the satellite board: one mark for the lane entry
t = rep(t, """ return feat(e.lon, e.lat, {ref: r, by: e.by || 'unnamed', at: e.at ? fmtStamp(e.at) : '',
 acc: fixQuality(e.acc).word, away: d ? d.m + ' m from ' + d.basis : ''}); })},""",
 """ return feat(e.lon, e.lat, {ref: r, by: e.by || 'unnamed', at: e.at ? fmtStamp(e.at) : '',
 acc: fixQuality(e.acc).word, away: d ? d.m + ' m from ' + d.basis : ''}); }).concat(pitLaneWayFeatures(feat))}, /* v7.42 */""", 'board', p, True)
# 6. the drawer's map: the mark says what it is
t = rep(t, """.setPopup(new gl.Popup({offset: 22, closeButton: false}).setText('Way in to ' + a.key + ' — pinned by '
 + (ent.by || 'somebody') + ' standing at the turn-in, ' + fixQuality(ent.acc).word
 + (ed ? ' · ' + ed.m + ' m from ' + ed.basis : ''))).addTo(map);""",
 """.setPopup(new gl.Popup({offset: 22, closeButton: false}).setText(ent.gate ? pitLanePopup(a.key, ed) : 'Way in to ' + a.key + ' — pinned by '
 + (ent.by || 'somebody') + ' standing at the turn-in, ' + fixQuality(ent.acc).word
 + (ed ? ' · ' + ed.m + ' m from ' + ed.basis : ''))).addTo(map);""", 'drawer map', p, True)
# 7. the button that switches the end
t = rep(t, " const eof = e.target.closest('[data-entryoff]');",
 """ const pend2 = e.target.closest('[data-pitlaneend]');
 if (pend2) { e.stopPropagation(); e.preventDefault(); const end = pend2.dataset.pitlaneend; if (pitLaneRuleSet({end})) { flash('Trucks now enter the pit lane at its ' + end + ' end and drive it ' + PIT_LANE_ENDS[end].drive + ' — for every reference in the park.'); render(); } return; } /* v7.42 */
 const eof = e.target.closest('[data-entryoff]');""", 'end button', p, True)
# 8. the record: blank, load, export, merge, checker, sync
t = rep(t, " photoLinks:{}, /* v7.41 - one document per photograph */\n", " photoLinks:{}, /* v7.41 - one document per photograph */\n gates:{}, /* v7.42 - the pit lane rule, when somebody changes it */\n", 'blank', p, True)
t = rep(t, " photoLinks: (j && j.photoLinks) || {}, units: (j && j.units) || {},", " photoLinks: (j && j.photoLinks) || {}, gates: (j && j.gates) || {}, units: (j && j.units) || {},", 'load', p, True)
t = rep(t, " photoLinks: S.photoLinks || {},\n", " photoLinks: S.photoLinks || {},\n gates: S.gates || {},\n", 'export', p, True)
t = rep(t, "'mapRef', 'dropPhotos', 'photoLinks', 'units', 'labour',", "'mapRef', 'dropPhotos', 'photoLinks', 'gates', 'units', 'labour',", 'merge list', p, True)
t = rep(t, "f === 'photoLinks' ? 'the photograph' : f === 'units'", "f === 'photoLinks' ? 'the photograph' : f === 'gates' ? 'the way-in rule' : f === 'units'", 'merge label', p, True)
t = rep(t, "'by', 'dropPhotos', 'photoLinks', 'units', 'docketPapers', 'actions', 'schema',", "'by', 'dropPhotos', 'photoLinks', 'gates', 'units', 'docketPapers', 'actions', 'schema',", 'checker known', p, True)
t = rep(t, "'by', 'dropPhotos', 'photoLinks', 'units', 'docketPapers', 'loads', 'purchaseOrders',", "'by', 'dropPhotos', 'photoLinks', 'gates', 'units', 'docketPapers', 'loads', 'purchaseOrders',", 'checker keyed', p, True)
t = rep(t, " photoLinks: {kind: 'map', get: () => S.photoLinks, set: v => S.photoLinks = v},",
 " photoLinks: {kind: 'map', get: () => S.photoLinks, set: v => S.photoLinks = v},\n /* v7.42 - the pit lane rule: which end a truck comes in at, and whether the rule is on */\n gates: {kind: 'map', get: () => S.gates, set: v => S.gates = v},", 'sync', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
