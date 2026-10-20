#!/usr/bin/env python3
"""v7.19 - Where we are without "Delivery signals", and no dead Edit in Tools on a view link.
Andrew Fisher, 28 Sep 2026: "On the where we are. Remove this. I don't need to see it." (the Delivery signals box: 61 on site
/ 0 in transit / 0 recorded not on site / 138 no delivery record, with its lamp banks). Nothing else on Where we are uses
that lamp-bank design. And from the error sweep: on a view link the Tools menu offered "Edit", which a view link cannot
open, so pressing it did nothing and left the menu open; Edit is now listed only where it can open.
   python3 patch_v719.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.19 - Delivery signals off' in t: sys.exit('v7.19 already applied')
t = rep(t, "${deliverySignals(allAssets())}", "${''/* v7.19 - Delivery signals off Where we are, on Andrew's word */}", 'signals', p, True)
t = rep(t, "if (mv) mv.innerHTML = TABS.filter(([k]) => !TABS_OFF.has(k) || editOk(k))",
        "if (mv) mv.innerHTML = TABS.filter(([k]) => (!TABS_OFF.has(k) || editOk(k)) && (k !== 'edit' || editOk(k)))", 'tools edit', p, True)
k = t.find('</style>'); t = t[:k] + '/* v7.19 - no Edit in Tools on a view link (the list is drawn before the service says what the link may do) */\nbody.viewonly #mmViews [data-goto="edit"],body.viewonly #tabMoreMenu [data-goto="edit"]{display:none !important}\n' + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
