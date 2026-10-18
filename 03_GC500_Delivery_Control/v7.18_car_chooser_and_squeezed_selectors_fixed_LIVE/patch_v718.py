#!/usr/bin/env python3
"""v7.18 - selectors the attribution scrub had squeezed, put back. Andrew Fisher, 28 Sep 2026: "I can't see the car
selection any more ... there is nothing to select". The scrub folds ' .' to '.' in scripts, so a descendant selector
such as '#sePanel .se-list' became '#sePanel.se-list' (an element that is both), which matches nothing:
 - the Special Editions panel (the vehicle chooser behind the chequered square) never filled its list;
 - the showcase's circuit canvas lookups ('#showPlate .gc3dgeo') found nothing;
 - the map's marker lists ('#pane-map .mk') came back empty;
 - the drawer's moved-record and notice links ('#drawer .movedline [data-k]', '#drawer .notice [data-k]') were not wired.
Each is written with \\x20 for the space, which the scrub leaves alone.   python3 patch_v718.py <page.html>"""
import sys
FIX = [("'#sePanel.se-list'", "'#sePanel\\x20.se-list'"),
       ("'#showPlate.gc3dgeo'", "'#showPlate\\x20.gc3dgeo'"),
       ("'#pane-map.mk:not(.gpsmk)'", "'#pane-map\\x20.mk:not(.gpsmk)'"),
       ("'#pane-map.mk'", "'#pane-map\\x20.mk'"),
       ("'#drawer.movedline [data-k]'", "'#drawer\\x20.movedline [data-k]'"),
       ("'#drawer.notice [data-k]'", "'#drawer\\x20.notice [data-k]'")]
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if "'#sePanel\\x20.se-list'" in t: sys.exit('v7.18 already applied')
for old, new in FIX:
    n = t.count(old)
    if n < 1: sys.exit('not found: ' + old)
    t = t.replace(old, new); print(n, 'x', old)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
