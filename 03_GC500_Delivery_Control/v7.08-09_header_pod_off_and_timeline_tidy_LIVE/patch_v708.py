#!/usr/bin/env python3
"""v7.08 - the header's "next delivery day" pod (28 SEP · MON · Due in / Recorded on site / Still to come) is taken off
every page. Andrew Fisher, 27 Sep 2026: "Need to remove this from banner from each page." The day's figures stay on the
Timeline's day and on Today; the header keeps the clock, the race-day countdown and the record lamp.
CSS only, so it applies on any build from v6.x on.   python3 patch_v708.py <page.html>"""
import os, sys
CSS = """/* v7.08 - no "next delivery day" pod in the header, on any page */
#hztd,.hzpod.hztd{display:none !important}
"""
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.08 - no "next delivery day" pod' in t: sys.exit('v7.08 already applied')
if t.count('class="hzpod hztd"') + t.count("hzpod hztd") == 0: sys.exit('no header pod found - check the build')
k = t.find('</style>')
t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
