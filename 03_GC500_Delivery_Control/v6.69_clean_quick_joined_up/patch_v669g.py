#!/usr/bin/env python3
"""v6.69g - SEARCH, THE DRAWER AND SHOW ON MAP WORK FROM ONE LIST. Each keystroke's drop-down (finderOpen), opening a
record (openAsset) and Show on map built the asset list over and over while they worked: 55-70 ms a keystroke, 0.2 s to
open a record. They now hold one list for the length of the job, as a page draw does: 17 ms and 37 ms. None of them
changes the record, so nothing can be held stale.
  python3 patch_v669g.py <page.html> [builder.py]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep
def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, "function finderOpen(q){", "function finderOpen(q){ return holdAssets(() => finderOpen_held(q)); } /* v6.69 */\nfunction finderOpen_held(q){", 'finder', path, need)
    t = rep(t, "function openAsset(key, opts){", "function openAsset(key, opts){ return holdAssets(() => openAsset_held(key, opts)); } /* v6.69 */\nfunction openAsset_held(key, opts){", 'openAsset', path, need)
    t = rep(t, "function showOnMap(key){", "function showOnMap(key){ return holdAssets(() => showOnMap_held(key)); } /* v6.69 */\nfunction showOnMap_held(key){", 'showOnMap', path, need)
    t = rep(t, "function mapLocate(sheetKey, label, key, opts){", "function mapLocate(sheetKey, label, key, opts){ return holdAssets(() => mapLocate_held(sheetKey, label, key, opts)); } /* v6.69 */\nfunction mapLocate_held(sheetKey, label, key, opts){", 'mapLocate', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
patch(sys.argv[1], True)
if len(sys.argv) > 2: patch(sys.argv[2], False)
