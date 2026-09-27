#!/usr/bin/env python3
"""v7.17 - a building with no quantity is one. Andrew Fisher, 27 Sep 2026: "Buildings with no qty. Its qty 1".
In the one projection every page reads (buildAllAssets), right after the v6.83 light-tower rule: a charge line whose item
is a building (Building 3.6m / 4.8m / 6m / 9.6m / 12m) and that still has no quantity - nothing typed over it, not worked
out from its asset numbers - is quantity 1, priced, and says so in its own words with the schedule's wording kept beside.
A quantity typed by a person or worked out from the asset numbers still wins.   python3 patch_v717.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.17 - A BUILDING WITH NO QUANTITY IS ONE' in t: sys.exit('v7.17 already applied')
old = " quantity_state: 'one light tower — the reference names a single numbered tower, and Andrew confirmed one each on 27 Sep 2026. The schedule: ' + l.quantity_state})];\n }"
new = old + """
 /* v7.17 - A BUILDING WITH NO QUANTITY IS ONE (Andrew, 27 Sep 2026: "Buildings with no qty. Its qty 1") */
 if (!a.relocation && chargeLinesOut && chargeLinesOut.length) chargeLinesOut = chargeLinesOut.map(l => (l.quantity == null && /^building\\b/i.test(String(l.item || '').trim()))
 ? Object.assign({}, l, {quantity: 1, priceable: true, quantity_auto: true,
 quantity_on_the_schedule: 'quantity_on_the_schedule' in l ? l.quantity_on_the_schedule : l.quantity,
 quantity_state_on_the_schedule: l.quantity_state_on_the_schedule || l.quantity_state,
 quantity_state: 'one building — the schedule gave no quantity, and Andrew confirmed on 27 Sep 2026 that a building with no quantity is one. The schedule: ' + l.quantity_state})
 : l);
 /* and the schedule's own rows for a building that give no quantity read 1 too, so the day list, the cards, the sheets,
    the pre-start and the register all say 1 - the row's own wording is kept beside it */
 const evsOut = (a.events || []).map(e => ((e.quantity_display == null || e.quantity_display === '' || e.quantity_display === 'blank') && /^building\\b/i.test(String(e.item || '').trim()))
 ? Object.assign({}, e, {quantity_display: '1', quantity_on_the_schedule: e.quantity_display == null ? null : e.quantity_display,
 quantity_auto: 'one building — the schedule row gave no quantity, and Andrew confirmed on 27 Sep 2026 that a building with no quantity is one'})
 : e);"""
t = rep(t, old, new, 'building qty', p, True)
t = rep(t, " item_types: itemTypes,\n charge_lines: chargeLinesOut,", " item_types: itemTypes,\n charge_lines: chargeLinesOut,\n events: evsOut,   /* v7.17 */", 'events out', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
