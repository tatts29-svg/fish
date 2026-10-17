#!/usr/bin/env python3
"""v6.69c - a Plant table below the fold is not laid out until it is scrolled near (content-visibility), so filling its
rows in costs nothing on screen; printing lays everything out as before.
  python3 patch_v669c.py <page.html> [builder.py]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep
CSS = ("@media print{ .skipwork{display:none} .dstat .hz.lite > use{display:none !important} }\n"
       "/* v6.69 - a Plant table below the fold is not laid out until it is scrolled near: its rows fill in for free */\n"
       "#pane-plant > .card.has-table{content-visibility:auto;contain-intrinsic-size:auto 1400px}\n"
       "@media print{ #pane-plant > .card.has-table{content-visibility:visible} }")
def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, "@media print{ .skipwork{display:none} .dstat .hz.lite > use{display:none !important} }", CSS, 'cv css', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
patch(sys.argv[1], True)
if len(sys.argv) > 2: patch(sys.argv[2], False)
