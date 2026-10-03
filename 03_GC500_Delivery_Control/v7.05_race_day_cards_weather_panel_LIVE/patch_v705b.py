#!/usr/bin/env python3
"""v7.05b - no empty space inside the race day cards (Andrew Fisher, 27 Sep 2026: "I dont want empty space"): each card is as
tall as what it holds, and the day's figures sit straight under the weather panel. CSS only.   python3 patch_v705b.py <page>"""
import sys
CSS = """/* v7.05b - no empty space inside the race cards: each card is as tall as what it holds */
.daystrip{align-items:flex-start}
.daystrip .day .dpan{margin-top:0}
"""
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('\ufeff'); t = t.lstrip('\ufeff')
if 'v7.05b - no empty space' in t: sys.exit('v7.05b already applied')
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('\ufeff' if bom else '') + t); print('ok', p)
