#!/usr/bin/env python3
"""v6.32 - A REDUCED-MOTION DEVICE STILL GETS THE CIRCUIT AND THE CAR (Andrew Fisher, 26 Sep 2026, with a picture of his phone:
the Backdrop set to "The circuit in 3D - day", the flat key plan on the plate, the footer reading "Reduced motion · manual
scenes · countdown still running": "It use to work on my phone and all before. Now nothing").

The rule was that a device asking for reduced motion (the phone's own Reduce Motion / Remove animations setting, or
Motion: Off under Tools) never allocated the 3D scene at all - so the Backdrop chooser offered day and night and the
plate showed the flat drawing whatever was chosen, and the car was nowhere. Reduced motion means nothing moves; it does
not mean no picture. The scene now mounts on such a device and paints ONE STILL FRAME - the circuit in the chosen look,
the car standing on the track - and holds it: the render loop paints once while paused and then does nothing, the
scenes stay manual, the countdown keeps counting as it did. Motion: Subtle in Tools, or the phone's setting, brings the
lap back as before. The footer says what it is doing.

  python3 patch_v632.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

OLD_GUARD = """  if (!GC3D.S) {
    if (GC3D.failed || motionOff() || document.hidden || !SHOW.open) return;
    let r = '';
    try { r = GC3D.mount(DATA.surrounds, back3dLook(back)); } catch (e) { r = String(e && e.message || e); }"""
NEW_GUARD = """  if (!GC3D.S) {
    /* v6.32 - reduced motion is no longer a reason not to mount (Andrew Fisher, 26 Sep 2026: his phone asked for reduced
       motion, and the plate showed the flat drawing with no car whatever the Backdrop said). The scene mounts, paints one
       still frame in the chosen look with the car on the track, and holds it: `still` is true, so the loop paints once
       while paused and then nothing moves. Hidden and closed shows still avoid allocating a scene. */
    if (GC3D.failed || document.hidden || !SHOW.open) return;
    let r = '';
    try { r = GC3D.mount(DATA.surrounds, back3dLook(back)); } catch (e) { r = String(e && e.message || e); }"""

# the scene paints inside the lap-lights frame loop, and reduced motion stopped that loop before the scene could paint
# even once - so the canvas never reached the plate. With a 3D backdrop chosen the loop stays alive; the mounted scene's
# own frame does nothing while paused but paint the one still, and the flat ring never animates because the loop is
# stopped again the moment there is no scene to paint.
OLD_LAPS = """  const lc = plate.querySelector('canvas.shlaps');
  if (lc) { if (stillDecor) lapsStop(); else if (!LAPS.raf || LAPS.cv !== lc) lapsStart(lc); }"""
NEW_LAPS = """  const lc = plate.querySelector('canvas.shlaps');
  /* v6.32 - a reduced-motion device with a 3D backdrop chosen keeps the frame loop alive, because the scene paints its
     one still frame inside it; the loop is stopped again below if no scene mounted, so the flat ring never moves. */
  const backNow = $('#showcase') ? $('#showcase').getAttribute('data-back') : '';
  const still3d = motionOff() && !document.hidden && SHOW.open && is3dBack(backNow) && show3dAvailable();
  if (lc) { if (stillDecor && !still3d) lapsStop(); else if (!LAPS.raf || LAPS.cv !== lc) lapsStart(lc); }"""
OLD_SYNC = """  showLapSize();
  show3dSync(still);"""
NEW_SYNC = """  showLapSize();
  show3dSync(still);
  if (lc && stillDecor && LAPS.raf && !(window.GC3D && GC3D.S)) lapsStop();   /* v6.32 - no scene to paint: the ring holds still */"""

OLD_FOOT = """  if (st) st.textContent = SHOW.reduced ? 'Reduced motion · manual scenes · countdown still running'"""
NEW_FOOT = """  if (st) st.textContent = SHOW.reduced ? 'Reduced motion · manual scenes · the circuit holds a still frame · countdown still running'"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_GUARD, NEW_GUARD, 'mount guard')
    t = rep(t, OLD_LAPS, NEW_LAPS, 'laps loop')
    t = rep(t, OLD_SYNC, NEW_SYNC, 'after sync')
    t = rep(t, OLD_FOOT, NEW_FOOT, 'footer')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
