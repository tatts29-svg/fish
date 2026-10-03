#!/usr/bin/env python3
"""v7.53 - the circuit in Three.js: a new renderer for the showcase's 3D backdrop (follow-cam, trackside, helicopter,
overhead, race director; braking, cornering, a car to pass; kerbs, barriers, hoardings, fencing, gantries, lights,
grandstands, Surfers Paradise; the Coates #26 livery; speed lines and smoke; day, sunset and night; race control).
The project manager, 1 Oct 2026. The old engine stays in the page as the fallback when WebGL is missing.
    python3 patch_v753.py <page.html>   (needs v7.48 or later)"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if "G.X = {ver: '2.0-three'" in t: sys.exit('v7.53 already applied')
if 'function text747What(' not in t or 'const G = window.GC3D = {ver:' not in t: sys.exit('needs the live v7.48 or later, with the GC3D engine in it')
parts = sorted(f for f in os.listdir(os.path.join(here, 'src')) if f.endswith('.js'))
JS = '\n'.join(open(os.path.join(here, 'src', f), encoding='utf-8').read() for f in parts)
CSS = open(os.path.join(here, 'gc3dx.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
# 1. the engine, after the sound module and before the geospatial car, so it takes over the GC3D handles once
t = rep(t, "/* GC500 — the car, in the geospatial scene.", JS + "\n/* GC500 — the car, in the geospatial scene.", 'engine', p, True)
# 2. a sunset backdrop beside day and night
t = rep(t, "<option value=\"circuit3d_day\">The circuit in 3D — day</option><option value=\"circuit3d\">The circuit in 3D — night</option>",
 "<option value=\"circuit3d_day\">The circuit in 3D — day</option><option value=\"circuit3d_dusk\">The circuit in 3D — sunset</option><option value=\"circuit3d\">The circuit in 3D — night</option>", 'option', p, True)
t = rep(t, "const SHOW_BACKS = ['black', 'circuit', 'circuit3d_day', 'circuit3d'];", "const SHOW_BACKS = ['black', 'circuit', 'circuit3d_day', 'circuit3d_dusk', 'circuit3d']; /* v7.53 - sunset */", 'backs', p, True)
t = rep(t, "const is3dBack = v => v === 'circuit3d' || v === 'circuit3d_day' || v === 'circuit3d_led' || v === 'circuit3d_orange';",
 "const is3dBack = v => v === 'circuit3d' || v === 'circuit3d_day' || v === 'circuit3d_dusk' || v === 'circuit3d_led' || v === 'circuit3d_orange';", 'is3d', p, True)
t = rep(t, "const back3dLook = v => v === 'circuit3d_day' ? 'day' : v === 'circuit3d_led' ? 'led'",
 "const back3dLook = v => v === 'circuit3d_day' ? 'day' : v === 'circuit3d_dusk' ? 'dusk' : v === 'circuit3d_led' ? 'led'", 'look', p, True)
# 3. three.js starts loading the moment the showcase opens, so the backdrop is ready when it is chosen
t = rep(t, "function showOpen(){", "function showOpen(){\n if (window.GC3D && GC3D.preload) GC3D.preload(); /* v7.53 */", 'preload', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p, len(JS), 'chars of engine')
