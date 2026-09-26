#!/usr/bin/env python3
"""v6.71 - THE DRAWINGS ZOOM LIKE A MAP APP (Andrew, 26 Sep 2026: "maps zooming still clunky, needs work, needs improving").

What made it clunky, measured:
  * every marker carried `transition: transform .18s`, so each zoom step left all 66 pills sliding a fifth of a second
    behind the drawing - the pins swam and caught up after every notch;
  * the markers sat inside the drawing's own layer, so re-sizing them re-painted the whole 2,600-pixel sheet every step;
  * a wheel notch jumped 18 % in one frame, and the + / - buttons 50 %, with nothing in between;
  * a pinch and a drag painted on every finger event rather than once a frame.
Now: zoom is animated towards where you asked (a wheel notch, a button, a double-click or double-tap) and eases in over
about a tenth of a second, anchored on the point under the cursor or fingers; while the drawing moves the pills have no
transition and ride their own layers so the sheet is never re-painted; a pinch and a drag follow the fingers exactly,
once a frame; and when it settles the drawing is re-drawn sharp at the new size.

  python3 patch_v671_map.py <page.html> [builder.py]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

NEW_CTL = r"""/* v6.71 - SMOOTH ZOOM. A notch, a button, a double-click or a double-tap sets where the zoom is going; the drawing
    eases there over about a tenth of a second about the point under the cursor or finger, one step a frame. While the
    drawing moves the stage wears `zooming` (the pills lose their transition and ride their own layers); when it has
    been still for a moment the class comes off and the sheet is drawn sharp at its new size. */
 let zAnim = 0, zTarget = state.zoom, zAnchor = {x: 0, y: 0}, zLast = 0, idleT = 0;
 const busy = () => { stage.classList.add('zooming'); clearTimeout(idleT); idleT = setTimeout(() => stage.classList.remove('zooming'), 240); };
 const zoomStep = t => {
  const dt = zLast ? Math.min(0.05, (t - zLast) / 1000) : 1 / 60; zLast = t;
  const old = state.zoom; let z = old + (zTarget - old) * (1 - Math.exp(-dt * 17));
  if (Math.abs(zTarget - z) < 0.0015 * zTarget) z = zTarget;
  state.zoom = z; state.ox = zAnchor.x - (zAnchor.x - state.ox) * (z / old); state.oy = zAnchor.y - (zAnchor.y - state.oy) * (z / old);
  clamp(); apply(); busy();
  if (z !== zTarget && stage.isConnected) zAnim = requestAnimationFrame(zoomStep); else { zAnim = 0; zLast = 0; }
 };
 const zoomTo = (z, ax, ay) => {
  zTarget = Math.min(8, Math.max(1, z)); zAnchor = {x: ax, y: ay};
  if (motionOff()) { if (zAnim) cancelAnimationFrame(zAnim); zAnim = 0; const old = state.zoom; state.zoom = zTarget;
   state.ox = ax - (ax - state.ox) * (zTarget / old); state.oy = ay - (ay - state.oy) * (zTarget / old); clamp(); apply(); return; }
  if (!zAnim) { zLast = 0; zAnim = requestAnimationFrame(zoomStep); }
 };
 const zoomNow = () => zAnim ? zTarget : state.zoom;
 const stopZoom = () => { if (zAnim) cancelAnimationFrame(zAnim); zAnim = 0; zLast = 0; zTarget = state.zoom; };
 stage.querySelectorAll('[data-z]').forEach(b => b.onclick = () => {
 const k = b.dataset.z;
 if (k === 'reset') { stopZoom(); state.zoom = 1; zTarget = 1; state.ox = 0; state.oy = 0; state.rot = 0; clamp(); apply(); return; }
 const r = stage.getBoundingClientRect();
 zoomTo(zoomNow() * (k === 'in' ? 1.6 : 1 / 1.6), r.width / 2, r.height / 2);
 });
 stage.addEventListener('wheel', e => {
 e.preventDefault();
 if (e.shiftKey) { turnTo(state.rot + ((e.deltaY || e.deltaX) < 0 ? -5 : 5)); return; }
 const r = stage.getBoundingClientRect();
 const { x: cx, y: cy } = unturn(e.clientX - r.left, e.clientY - r.top, r);
 /* how far the wheel moved: a mouse notch is about 20 %, a trackpad's small steps are small, a trackpad pinch
    (ctrl + wheel) follows the fingers */
 const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
 zoomTo(zoomNow() * Math.exp(-Math.max(-240, Math.min(240, dy)) * (e.ctrlKey ? 0.006 : 0.0018)), cx, cy);
 }, {passive:false});
 /* a double-click zooms in on the spot; on the last step in it goes back out to the whole sheet */
 const dblAt = (clientX, clientY) => { const r = stage.getBoundingClientRect(); const p = unturn(clientX - r.left, clientY - r.top, r);
  const z = zoomNow(); zoomTo(z >= 7.5 ? 1 : z * 2, p.x, p.y); };
 stage.addEventListener('dblclick', e => { if (e.target.closest('.mk, .zoomctl, .rotctl, button, a')) return; e.preventDefault(); dblAt(e.clientX, e.clientY); });
 let tap = null, lastTap = null;"""

def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    a = t.find("stage.querySelectorAll('[data-z]').forEach(b => b.onclick = () => {")
    b = t.find("}, {passive:false});", a)
    if a < 0 or b < 0 or b - a > 3000:
        if need: sys.exit('zoom block not found')
        print('  skip zoom block in', os.path.basename(path)); return
    t = t[:a] + NEW_CTL + t[b + len("}, {passive:false});"):]
    # a new gesture stops a running zoom; a touch that goes down is remembered for the double-tap
    t = rep(t, """if (pts.size === 1) drag = {x:e.clientX, y:e.clientY, ox:state.ox, oy:state.oy};""",
            """if (pts.size === 1) { drag = {x:e.clientX, y:e.clientY, ox:state.ox, oy:state.oy}; stopZoom();
  tap = e.pointerType === 'touch' ? {x: e.clientX, y: e.clientY, t: performance.now()} : null; } else tap = null;""", 'down', path, need)
    # pinch and drag: once a frame, and the stage says it is moving
    t = rep(t, """state.oy = cy - (cy - state.oy) * (state.zoom/old);
 clamp(); apply();
 }
 drag = {d, ang};""", """state.oy = cy - (cy - state.oy) * (state.zoom/old);
 clamp(); applySoon(); busy(); zTarget = state.zoom;
 }
 drag = {d, ang};""", 'pinch', path, need)
    t = rep(t, """state.oy = drag.oy + m.y;
 clamp(); apply();""", """state.oy = drag.oy + m.y;
 if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap = null;
 clamp(); applySoon(); busy();""", 'pan', path, need)
    t = rep(t, """const up = e => { pts.delete(e.pointerId); if (pts.size < 2) drag = null; try { stage.releasePointerCapture(e.pointerId); } catch (err) {} };""",
            """const up = e => { pts.delete(e.pointerId); if (pts.size < 2) drag = null; try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
 /* v6.71 - a double-tap: two quick taps close together zoom in on the spot, as a double-click does */
 if (e.type === 'pointerup' && tap && !pts.size && performance.now() - tap.t < 260) {
  const now = performance.now();
  if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 34) { lastTap = null; dblAt(e.clientX, e.clientY); }
  else lastTap = {x: e.clientX, y: e.clientY, t: now};
 }
 tap = null; };""", 'up', path, need)
    # CSS: no swimming pills, no re-painting the sheet while it moves, sharp when it stops
    t = rep(t, ".mapinner{position:relative;transform-origin:0 0;will-change:transform}",
            ".mapinner{position:relative;transform-origin:0 0}\n"
            "/* v6.71 - while the drawing moves the pills ride their own layers with no transition, so nothing swims behind the\n"
            "   sheet and the sheet itself is never re-painted; still again, the class comes off and it is drawn sharp */\n"
            ".mapstage.zooming .mapinner{will-change:transform}\n"
            ".mapstage.zooming .mapinner img{will-change:transform}\n"
            ".mapstage.zooming .mk{transition:none !important;will-change:transform}", 'css', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))

if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
