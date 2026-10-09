#!/usr/bin/env python3
"""v6.69f - A PAGE DRAWN ON ITS OWN IS STILL DRAWN FROM ONE LIST, AND THE WHEEL ZOOMS SMOOTHLY.
  * Pressing a drawing on the Map (and any other button that redraws just its own page) drew outside render(), so every
    marker asked for the asset list afresh - the list built sixty times over, 0.8-1.3 s per sheet. Every page's draw now
    holds one list for itself, the same way render() does.
  * The wheel zoomed a fixed 18 % per event, so a trackpad (dozens of small events) shot to full zoom in a flick and a
    mouse stepped. It now zooms by how far the wheel actually moved, and the drawing is moved once per frame, not once per
    event.
  python3 patch_v669f.py <page.html> [builder.py]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep
NAMES = ['renderToday', 'renderProgress', 'renderMap', 'renderRegister', 'renderPlant', 'renderVariances', 'renderFencing',
         'renderPrestarts', 'renderCoatesWay', 'renderJournal', 'renderBreakdowns', 'renderCosts', 'renderAdd', 'renderEdit',
         'renderPricing', 'renderTimeline', 'renderAbout', 'renderSatBoard']
def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    for n in NAMES:
        t = rep(t, f"function {n}(){{", f"function {n}(){{ return holdAssets({n}_held); }} /* v6.69 - one asset list for the whole draw */\nfunction {n}_held(){{", n, path, need)
    t = rep(t, "function renderDocs(keep){", "function renderDocs(keep){ return holdAssets(() => renderDocs_held(keep)); } /* v6.69 */\nfunction renderDocs_held(keep){", 'renderDocs', path, need)
    t = rep(t, """const r = stage.getBoundingClientRect(), old = state.zoom;
 const { x: cx, y: cy } = unturn(e.clientX - r.left, e.clientY - r.top, r);
 state.zoom = Math.min(8, Math.max(1, state.zoom * (e.deltaY < 0 ? 1.18 : 1/1.18)));
 state.ox = cx - (cx - state.ox) * (state.zoom/old);
 state.oy = cy - (cy - state.oy) * (state.zoom/old);
 clamp(); apply();""", """const r = stage.getBoundingClientRect(), old = state.zoom;
 const { x: cx, y: cy } = unturn(e.clientX - r.left, e.clientY - r.top, r);
 /* v6.69 - zoom by how far the wheel moved: a mouse notch is the same 18 % it always was, a trackpad's small
    steps are small, and a pinch on a trackpad (ctrl + wheel) follows the fingers */
 const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
 state.zoom = Math.min(8, Math.max(1, state.zoom * Math.exp(-Math.max(-240, Math.min(240, dy)) * (e.ctrlKey ? 0.006 : 0.00138))));
 state.ox = cx - (cx - state.ox) * (state.zoom/old);
 state.oy = cy - (cy - state.oy) * (state.zoom/old);
 clamp(); applySoon();""", 'wheel', path, need)
    t = rep(t, """ mapBar(); };
 mapBar();""", """ mapBar(); };
 /* v6.69 - a burst of wheel events moves the drawing once per frame */
 let applyRaf = 0;
 const applySoon = () => { if (!applyRaf) applyRaf = requestAnimationFrame(() => { applyRaf = 0; apply(); }); };
 mapBar();""", 'applySoon', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
patch(sys.argv[1], True)
if len(sys.argv) > 2: patch(sys.argv[2], False)
