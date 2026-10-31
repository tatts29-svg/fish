#!/usr/bin/env python3
"""v7.56 - the map zooms quicker, and stays sharp while it does. Andrew, 1 Oct 2026: "Maps revisit. Improve.
Smoothness. Accuracy. Graphics. Zooming in and out quicker, accurate. Faultless."

What the explorer did: a wheel notch grew the zoom by about a fifth per hundred pixels, the eased move chased its
target with a 67 ms time constant, the +/- buttons stepped 1.6x, and the sharp tiles were only fetched once the map
had been still for 180 ms - so a long zoom ran blurry and snapped sharp at the end. Now:
  - a wheel notch is worth almost twice as much (x1.38 per hundred pixels; Ctrl+wheel x2.2), the buttons step 2x,
    and the eased move closes on its target in about a third of the time (time constant 45 ms) - still eased, still
    about the point under the cursor or between the fingers, so the spot you zoom on stays put;
  - the tiles are brought in DURING the zoom, throttled to every 150 ms while the zoom crosses tile levels, as they
    already are during a drag - so the picture sharpens as you go, not after;
  - the map is called still after 120 ms, not 180.
Nothing about what the map shows, its pins, its search or its record changes.
    python3 patch_v756.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.56 - tiles during the zoom' in t: sys.exit('v7.56 already applied')
if "zoomTo(zoomNow() * Math.exp(-Math.max(-240, Math.min(240, dy)) * (e.ctrlKey ? 0.006 : 0.0018)), cx, cy);" not in t: sys.exit('needs the v6.94 explorer wheel handler')

# 1. the eased zoom closes faster, and fetches tiles as it goes
t = rep(t, "const old = state.zoom; let z = old + (zTarget - old) * (1 - Math.exp(-dt * 15));",
 "const old = state.zoom; let z = old + (zTarget - old) * (1 - Math.exp(-dt * 22)); /* v7.56 - quicker close */", 'ease', p, True)
t = rep(t, " state.zoom = z; state.ox = zAnchor.x - (zAnchor.x - state.ox) * (z / old); state.oy = zAnchor.y - (zAnchor.y - state.oy) * (z / old);\n clamp(); apply(); busy();\n if (z !== zTarget && stage.isConnected) zAnim = requestAnimationFrame(zoomStep); else { zAnim = 0; zLast = 0; zTarget = state.zoom; }",
 " state.zoom = z; state.ox = zAnchor.x - (zAnchor.x - state.ox) * (z / old); state.oy = zAnchor.y - (zAnchor.y - state.oy) * (z / old);\n clamp(); apply(); busy();\n /* v7.56 - tiles during the zoom: sharpen as it goes, throttled as a drag is */\n if (t - zTiles > 150) { zTiles = t; tilesNow(); }\n if (z !== zTarget && stage.isConnected) zAnim = requestAnimationFrame(zoomStep); else { zAnim = 0; zLast = 0; zTarget = state.zoom; }", 'step', p, True)
t = rep(t, "let zAnim = 0, zTarget = state.zoom, zAnchor = {x: 0, y: 0}, zLast = 0;", "let zAnim = 0, zTarget = state.zoom, zAnchor = {x: 0, y: 0}, zLast = 0, zTiles = 0;", 'vars', p, True)
# 2. a wheel notch and a button press are worth more
t = rep(t, "zoomTo(zoomNow() * Math.exp(-Math.max(-240, Math.min(240, dy)) * (e.ctrlKey ? 0.006 : 0.0018)), cx, cy);",
 "zoomTo(zoomNow() * Math.exp(-Math.max(-240, Math.min(240, dy)) * (e.ctrlKey ? 0.008 : 0.0032)), cx, cy); /* v7.56 */", 'wheel', p, True)
t = rep(t, "zoomTo(zoomNow() * (k === 'in' ? 1.6 : 1 / 1.6), SW / 2, SH / 2);", "zoomTo(zoomNow() * (k === 'in' ? 2 : 1 / 2), SW / 2, SH / 2); /* v7.56 */", 'buttons', p, True)
# 3. still sooner
t = rep(t, "const busy = () => { stage.classList.add('zooming'); clearTimeout(idleT); idleT = setTimeout(settle, 180); };",
 "const busy = () => { stage.classList.add('zooming'); clearTimeout(idleT); idleT = setTimeout(settle, 120); };", 'idle', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
