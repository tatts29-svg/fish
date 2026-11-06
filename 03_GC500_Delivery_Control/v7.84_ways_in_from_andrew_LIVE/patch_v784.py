#!/usr/bin/env python3
r"""v7.84 - the ways in Andrew gave, 2 Oct 2026. Author: Andrew Fisher. Apply on top of v7.83
(toolchain/build.sh v7.84 patch_v782.py patch_v783.py patch_v784.py).

Andrew, 2 Oct 2026: "wc25 meet at pitlane start point. wc31 from North head towards hill to drop off. location on map..
wc45 meet at starting point pitlane wc47 meet at starting point pitlane Lane. gn04 meet at starting point pitlane"

  - WC25, WC45, WC47, GN04: the way in is to meet at the pit lane start point - the pit lane entry the pit lane rule
    already uses (its north-west end off the Gold Coast Hwy, or the south end if the rule is switched). The drop-off is
    still each item's own position on the map.
  - WC31: in from the north, head towards The Hill to the drop-off; the drop-off is its location on the map.
  - Said in his words on the text (Site access and ENTRY), the driver sheet, the location sign's run sheet, the drawer
    and the print check. A way in somebody pins on site for one of these still wins, as a pin always does.
  - Still to come from Andrew: WB07 (Admiralty Dr), WB13, WB18, WB20 (Turn 2 / Ferny Ave) - they stay on HOLD.
    python3 patch_v784.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'const WAYIN784 = ' in t: sys.exit('v7.84 already applied')
for need in ('function dest782(', 'function wayIn782(', 'function pitLaneWayIn(', 'function inv83Open('):
    if need not in t: sys.exit('v7.84 needs v7.83 (missing ' + need + ')')

t = rep(t, "function entryOf(ref){\n const e = (S.entries || {})[ref];\n if (e) return e; /* somebody stood at the turn-in: that wins, as a pin always does */",
        r"""/* v7.84 - the ways in the project manager gave, 2 Oct 2026, in his words */
const WAYIN784 = {
 by: 'the project manager, 2 Oct 2026',
 said: 'wc25 meet at pitlane start point. wc31 from North head towards hill to drop off. location on map.. wc45 meet at starting point pitlane wc47 meet at starting point pitlane Lane. gn04 meet at starting point pitlane',
 refs: {WC25: 'pit', WC45: 'pit', WC47: 'pit', GN04: 'pit', WC31: 'north-hill'}};
function wayIn784(ref){ return WAYIN784.refs[ref] || null; }
/* meet at the pit lane start point: the pit lane entry the pit lane rule uses */
function meet784(ref){
 if (wayIn784(ref) !== 'pit') return null;
 const r = pitLaneRule(), end = PIT_LANE_ENDS[r.end] || PIT_LANE_ENDS.north, fr = frameOf(end.at[0], end.at[1]);
 const onFrame = !!fr && fr.ax >= -0.25 && fr.ax <= 1.25 && fr.ay >= -0.25 && fr.ay <= 1.25;
 return {lat: end.at[0], lon: end.at[1], acc: null, at: '2026-10-02T00:00:00.000Z', by: WAYIN784.by, ax: onFrame ? fr.ax : null, ay: onFrame ? fr.ay : null,
  off: null, outside: null, away_m: null, ref, unit: null, n: 0, took: 'meet at the pit lane start point', meet784: true,
  gate: 'pitlane', end: r.end, how: end.how, drive: end.drive, bearing: end.bearing};
}
function entryOf(ref){
 const e = (S.entries || {})[ref];
 if (e) return e; /* somebody stood at the turn-in: that wins, as a pin always does */
 { const m = meet784(ref); if (m) return m; } /* v7.84 */""", 'way in: meet at the pit lane start', p, True)

# the text's Site access line
t = rep(t, " const e = entryOf(a.key); if (!e) return '';\n if (e.took === 'the pit lane rule') return e.end === 'south'",
        " const e = entryOf(a.key); if (!e) return '';\n if (e.meet784) return 'Site access: meet at the pit lane start point - ' + (e.end === 'south' ? 'Gold Coast Hwy via the paddock ramps.' : 'Gold Coast Hwy > north-west pit lane entry.'); /* v7.84 */\n if (e.took === 'the pit lane rule') return e.end === 'south'", 'text: site access for a meet', p, True)

# the ENTRY line (and the sheet, the drawer and the readiness checks, which read entry782)
t = rep(t, "function entry782(a){\n { const R = report782(a);",
        r"""function entry782(a){
 if (a) { const w = wayIn784(a.key); /* v7.84 - the project manager's own words win over the area rule (WC31 is part on site, the rest still to come) */
  if (w === 'pit') return {side: 'pit lane start', zone: 'given', sms: 'ENTRY: meet at the pit lane start point.', words: 'Meet at the pit lane start point (' + WAYIN784.by + ').'};
  if (w === 'north-hill') return {side: 'from the north', zone: 'given', sms: 'ENTRY: from the north end, head towards The Hill to the drop-off (location on the map).', words: 'In from the north end, head towards The Hill to the drop-off - the location on the map (' + WAYIN784.by + ').'}; }
 { const R = report782(a);""", 'entry: his words', p, True)

# the drawer's way-in row says what it is, not "like everything in the park"
t = rep(t, " return `<div class=\"pinrow on pitlane\"><div class=\"pinwho\"><b>Way in</b><span class=\"w\">the pit lane, like everything in the park</span></div>",
        " return `<div class=\"pinrow on pitlane\"><div class=\"pinwho\"><b>Way in</b><span class=\"w\">${e.meet784 ? 'meet at the pit lane start point - ' + esc(WAYIN784.by) : 'the pit lane, like everything in the park'}</span></div>", 'drawer: meet words', p, True)

t = t.replace('/* v7.83 - Inventory: Share PDF', "/* v7.84 - the ways in the project manager gave (WC25, WC45, WC47, GN04 meet at the pit lane start point; WC31 from the north towards The Hill). */\n/* v7.83 - Inventory: Share PDF", 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.84 applied: the ways in Andrew gave (5 references)')
