#!/usr/bin/env python3
"""v5.89 - the Google 3D map: the page asked Google's loader for the maps3d library the instant the bootstrap script
had loaded, before the loader had put importLibrary in place, so every press read as a failure while the library
loaded fine a moment later (seen on the live page, 25 Sep 2026, once the Google key was handed out). The page now waits
for importLibrary to exist, up to ten seconds, before asking.  python3 patch_v589.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
old = """    sc.onload = () => { GMAPS.ready = true; ok(); };"""
new = """    /* v5.89 - the loader defines importLibrary a moment after its own script has loaded; wait for it (up to 10 s) */
    sc.onload = () => { const t0 = Date.now(); (function poll(){ if (window.google && google.maps && typeof google.maps.importLibrary === 'function') { GMAPS.ready = true; ok(); }
      else if (Date.now() - t0 > 10000) { GMAPS.loading = null; no(new Error('the Maps JavaScript library loaded but importLibrary never appeared')); } else setTimeout(poll, 50); })(); };"""
assert s.count(old) == 1, s.count(old); s = s.replace(old, new)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.89', n0, '->', len(s))
