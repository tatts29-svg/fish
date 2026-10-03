#!/usr/bin/env python3
"""v7.11 - the selected day on the Timeline without its heading and its four panels. Andrew Fisher, 27 Sep 2026: "Also
remove from time line" - the "Mon 28 Sep 2026 · weather · Week 3 · Build · 9 due in · 0 due out · lights" heading and the
Due in / Loads / Due out / Missing refs panels. The day is already named on the Day documents plate and on its race card
(with its weather); the day's list starts straight away. Only the one-day view: the Every-day list keeps each day's
heading, because there it is what separates one day from the next. CSS only.   python3 patch_v711.py <page.html>"""
import sys
CSS = """/* v7.11 - the one-day view starts at the day's list: no heading, no four panels */
#pane-timeline > .dayblock > .dayhead,#pane-timeline > .dayblock > .dpanels{display:none !important}
#pane-timeline > .dayblock > .sect:first-of-type{margin-top:0 !important}
"""
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.11 - the one-day view' in t: sys.exit('v7.11 already applied')
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
