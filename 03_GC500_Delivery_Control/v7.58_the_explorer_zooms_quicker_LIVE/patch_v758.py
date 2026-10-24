#!/usr/bin/env python3
"""v7.58 - the Plan on satellite explorer zooms quicker. Andrew, 1 Oct 2026: "Maps revisit ... Zooming in and out
quicker, accurate. Faultless." The Map tab's default view is this explorer, a file in the Coates Way machine
(explorer/explorer.js, live since v7.14), not the page.

What it did: a wheel notch grew the zoom by x1.25 a hundred pixels and the glide closed on its target with a 77 ms
time constant (about a quarter of a second to settle). The destination's tiles are already fetched as the wheel
turns (v7.14), so it never zooms blurry. Now:
  - a wheel notch is worth x1.38 a hundred pixels (Ctrl+wheel x2.2), as the page's drawing viewer is from v7.56;
  - the glide closes in about two thirds of the time (time constant 50 ms), still eased, still about the point under
    the cursor or between the fingers.
Nothing else in the file changes: double-tap x2, pinch, drag, fling, reduced motion, the prefetch.
    python3 patch_v758.py <explorer.js>"""
import sys
p = sys.argv[1]
t = open(p, encoding='utf-8').read()
if 'v7.58' in t: sys.exit('v7.58 already applied')
def rep(text, old, new, what):
    if text.count(old) != 1: sys.exit(what + ': expected exactly one match, found ' + str(text.count(old)))
    return text.replace(old, new)
t = rep(t, "let z = Math.exp(Math.log(camera.z) + (Math.log(zGoal) - Math.log(camera.z)) * (1 - Math.exp(-dt * 13)));",
           "let z = Math.exp(Math.log(camera.z) + (Math.log(zGoal) - Math.log(camera.z)) * (1 - Math.exp(-dt * 20)));   /* v7.58: quicker close (was 13) */", 'ease')
t = rep(t, "zoomBy(Math.exp(-clamp(delta, -500, 500) * (e.ctrlKey ? .006 : .0022)), p.x, p.y); }, {passive: false});",
           "zoomBy(Math.exp(-clamp(delta, -500, 500) * (e.ctrlKey ? .008 : .0032)), p.x, p.y); }, {passive: false});   /* v7.58: a notch is worth more (was .0022) */", 'wheel')
open(p, 'w', encoding='utf-8').write(t); print('ok', p)
