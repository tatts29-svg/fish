#!/usr/bin/env python3
"""Author: Andrew Fisher. v8.87 Map explorer, machine part: prepares the explorer files for the machine set from the EXACT
registered v8.64 files (set b469a99c, 231 files).

    python3 patch_explorer887.py <dir holding the live explorer files> <out dir>

Reads index.html, explorer.js, explorer-merge.js, fencing-map-explorer.js and explorer-fix864.js (every hash asserted),
applies exact-once text replacements, and writes those five files patched plus two new ones, explorer-fix887.js and
explorer-fix887.css, into <out dir>. explorer-merge.js keeps its name; every changed file gets a fresh content-hash cache
token in index.html. fencing-map-core.js, fencing-map.css and every other file of the set stay exactly as registered.
Nothing here uploads or registers anything.

What changes (Andrew, 7 Oct 2026: "maps need some work its very very clunky ... slow ... not smooth ... when you click on
example building nothing is clearly saying what has been done ... you need to tap fencing or close fencing to close that"):
  explorer.js             the fencing layer is painted only while Fencing is on; the per-frame log keeps 600 frames, not 30,000;
                          the Done poll and every repaint pause while the map is hidden or parked; moving frames stay sharp
                          until the device is measured slow (no resize hitch at every gesture); picks glide; a stale pointer
                          cannot survive a new gesture; layout is read once per gesture, not per move; any placed unit can be
                          tapped without a chip; cached ring gradients and label widths; Fencing un-presses the chip it clears.
  fencing-map-explorer.js the geometry on the map is worked out once per filter/selection/data change, not every frame, and
                          culled to the view; the overlay is cleared when Fencing closes; the 4 s poll becomes a 20 s idle
                          safety check (the dashboard nudges on every redraw, signature-checked, no forced rebuild); a tap on a
                          fence line no longer swallows the pointerup (the stuck pointer); a tap on the map closes the details;
                          a phone gets a bottom card instead of the drawer; Close clears the pick.
  explorer-merge.js       the unit card shows the Timeline's five-stage progress, who and when, the due day and what is left,
                          and it stays put on a pan or a zoom (a tap on the map closes it); a Progress button opens the
                          dashboard's delivery progress.
  explorer-fix864.js      Escape in Fencing closes Fencing in one press; cheap active/selected reads; the 700 ms heartbeat
                          pauses while the map is hidden.
  explorer-fix887.js/.css the "Fencing view · Close" bar on the map, the once-only tap hint, the card and phone-card styles.
"""
import hashlib, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = {   # the exact registered v8.64 files (machine set b469a99c43a30a6d165ce126c4983d0c92204c8f548f0636a008f43de60e95d8)
    'index.html': 'f75f8f4ff9b11cc7af0d373dc0484cdfb4874d0bca72ed6d85367ececb04a158',
    'explorer.js': '65749fbe601b1ae6cd2e99fc2c317e6cdcb985f10dac8c1b0b3ba98ff223a61c',
    'explorer-merge.js': '261238402f3c4bf3dc94a661b3dc8378bb789b01cdfd77b4cfc9810d1236b67c',
    'fencing-map-explorer.js': '31418b528009e4ec5e8eb23884f27fcf40b2114673f1b1bef297a1d7eeda3e53',
    'explorer-fix864.js': '2b0cfadb0b2b68b9516408e1458f22def3cb2100612579a63ad40a2206ad09f2',
    'explorer-fix864.css': 'c37afd30491161c7d2d50e792b8d96c022050a513abe93d5f4ef0c9f24303024',
    'fencing-map-core.js': '0c26c3b7777f99573326123e264d4fb4e53196ee0a1882aaa6dd6aa7ea5393ff',
    'fencing-map.css': 'a4f3e8688702c8dd80fc9522d039aab0c4ea4938f97b3384a8ae8134f18ced46',
}
sha = lambda b: hashlib.sha256(b).hexdigest()


def once(text, old, new, what):
    n = text.count(old)
    if n != 1: sys.exit(f'{what}: expected the anchor once, found {n}: {old[:80]!r}')
    return text.replace(old, new, 1)


def patch_explorer(s):
    # layout is read once per gesture (and on resize), not on every pointer move
    s = once(s, "function stagePoint(e) { const r = stage.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }",
             "let stageRect887 = null;   /* v8.87 - the stage's place on the screen, read once per gesture and on resize, not on every move */\n"
             "function stagePoint(e) { const r = stageRect887 || (stageRect887 = stage.getBoundingClientRect()); return {x: e.clientX - r.left, y: e.clientY - r.top}; }\n"
             "window.addEventListener('scroll', () => { stageRect887 = null; }, true); if (window.visualViewport) { window.visualViewport.addEventListener('scroll', () => { stageRect887 = null; }); window.visualViewport.addEventListener('resize', () => { stageRect887 = null; }); }",
             'stagePoint')
    s = once(s, "  const rect = stage.getBoundingClientRect(); sw = Math.max(1, rect.width); sh = Math.max(1, rect.height);",
             "  const rect = stage.getBoundingClientRect(); stageRect887 = rect; sw = Math.max(1, rect.width); sh = Math.max(1, rect.height);", 'resize rect')
    # the per-frame governor: moving frames stay at full sharpness until this device is measured slow
    s = once(s, "  const F = probeF; probeF = null; F.ms = Math.round((performance.now() - t0) * 10) / 10; F.t = Math.round(F.t); F.ready = ready; F.inter = !atRest; F.mode = mode; F.z = +camera.z.toFixed(3);",
             "  const F = probeF; probeF = null; F.ms = Math.round((performance.now() - t0) * 10) / 10; F.t = Math.round(F.t); F.ready = ready; F.inter = !atRest; F.mode = mode; F.z = +camera.z.toFixed(3);\n"
             "  /* v8.87 - a gesture starts at full sharpness; only when three moving frames in a row average over 14 ms does this gesture drop to the\n"
             "     lighter backing store (and the next one starts there); every sixth light gesture tries full sharpness again */\n"
             "  if (interacting && !lightMoving887 && movW && movW !== devW) { slow887.push(F.ms); if (slow887.length > 4) slow887.shift();\n"
             "    if (slow887.length >= 3 && slow887.reduce((a, b) => a + b, 0) / slow887.length > 14) { lightMoving887 = true; lightWent887 = true; lightPending887 = true; requestPaint(); } }",
             'frame governor')
    # the backing store changes size at the START of a frame, never between two frames: no blank frame on the way down or back up
    s = once(s, "function draw() {\n  paintID = 0; const t0 = performance.now(); const v = currentView();",
             "function draw() {\n  paintID = 0; if (lightPending887) { lightPending887 = false; applyDpr(); }   /* v8.87 - see applyDpr */\n  const t0 = performance.now(); const v = currentView();", 'draw start')
    s = once(s, "F.loader = !!loaderAt; window.__frames.push(F); if (window.__frames.length > 30000) window.__frames.splice(0, 10000);",
             "F.loader = !!loaderAt; window.__frames.push(F); if (window.__frames.length > 600) window.__frames.splice(0, 300);   /* v8.87 - ten seconds of frames, not 30,000 */", 'frame log cap')
    s = once(s, "  if (window.GC500FencingMap) window.GC500FencingMap.paint({width:canvas.width,height:canvas.height,dpr,\n"
                "    project:(p,region)=>{ const q=geoOn()&&region==='inset'?ap(TIN,p[0],p[1]):p; const d=applyM(S2D,q[0],q[1]);return[d.x,d.y]; }});",
             "  { const FM887 = window.GC500FencingMap; if (FM887 && FM887.active) FM887.paint({width:canvas.width,height:canvas.height,dpr,   /* v8.87 - only while Fencing is on */\n"
             "    project:(p,region)=>{ const q=geoOn()&&region==='inset'?ap(TIN,p[0],p[1]):p; const d=applyM(S2D,q[0],q[1]);return[d.x,d.y]; }}); }", 'fencing paint hook')
    s = once(s, "function applyDpr() { const mv = interacting && movW && (movW !== devW), W = mv ? movW : devW, H = mv ? movH : devH, want = W / sw;",
             "/* v8.87 - MOVING FRAMES STAY SHARP UNTIL THIS DEVICE IS MEASURED SLOW. Every gesture used to start by shrinking the three canvases\n"
             "   and end by growing them back (the blurry-then-sharp jump, and a resize hitch at both ends). A gesture now starts at full sharpness;\n"
             "   only when three moving frames in a row average over 14 ms does it drop to the lighter store (and the next gesture starts there,\n"
             "   trying full sharpness again every sixth time). The size changes only at the start of a frame (lightPending887, applied in draw),\n"
             "   so no frame is ever shown blank. A fast laptop or phone never resizes at all. */\n"
             "let lightMoving887 = false, lightNext887 = false, lightWent887 = false, lightTrials887 = 0, lightPending887 = false; const slow887 = [];\n"
             "function applyDpr() { const mv = interacting && lightMoving887 && movW && (movW !== devW), W = mv ? movW : devW, H = mv ? movH : devH, want = W / sw;", 'applyDpr')
    s = once(s, "function touchInteraction() { lastInput = performance.now(); clearTimeout(restTimer); if (!interacting) { interacting = true; applyDpr(); } restTimer = setTimeout(() => { interacting = false; applyDpr(); if (!zAnim) { vtGoal.clear(); goalWanted.clear(); } dropVTQueue(); requestPaint(); }, 160); }",
             "function touchInteraction() { lastInput = performance.now(); clearTimeout(restTimer);\n"
             "  if (!interacting) { interacting = true; slow887.length = 0; lightWent887 = false; lightMoving887 = lightNext887 && (++lightTrials887 % 6 !== 0); lightPending887 = true; }\n"
             "  restTimer = setTimeout(() => { interacting = false; lightNext887 = lightMoving887 || lightWent887; lightMoving887 = false; lightPending887 = true; if (!zAnim) { vtGoal.clear(); goalWanted.clear(); } dropVTQueue(); requestPaint(); }, 160); }", 'touchInteraction')
    s = once(s, "function requestPaint() { if (!paintID && !document.hidden && !under3d()) paintID = requestAnimationFrame(draw); }",
             "/* v8.87 - nothing is drawn, and the Done list is not asked for, while the map is hidden or parked by the dashboard (the frame is\n"
             "   moved into a 1 px park when another tab is shown, where its frames and timers used to run on); the first sharp view is still\n"
             "   drawn out of sight so pressing Map shows it at once */\n"
             "let hostShown887 = true, paintWanted887 = false;\n"
             "function parked887() { try { const f = window.frameElement; return !!(f && f.closest && f.closest('#expPark')); } catch (e) { return false; } }\n"
             "function shown887() { return hostShown887 && !document.hidden && !parked887(); }\n"
             "function setHostShown887(on) { hostShown887 = on !== false; if (shown887()) { if (paintWanted887) { paintWanted887 = false; requestPaint(); } done782Loop(); } else { clearTimeout(done782Timer); done782Timer = 0; } }\n"
             "function requestPaint() { if (paintID || document.hidden || under3d()) return; if (firstSharp && !shown887()) { paintWanted887 = true; return; } paintID = requestAnimationFrame(draw); }", 'requestPaint')
    s = once(s, "function stopCameraMotion813() {\n  stopZoomAnim(); stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;",
             "function stopCameraMotion813() {\n  stopZoomAnim(); stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0; cancelAnimationFrame(gotoAnim887); gotoAnim887 = 0;", 'stopCameraMotion')
    s = once(s, "function fit(asSheet = false) { stopCameraMotion813();clearSelection813(); highlight = null; const rot = 0;\n"
                "  if (geoOn() && GB && !asSheet) camera = {cx: (GB.x0 + GB.x1) / 2, cy: (GB.y0 + GB.y1) / 2, z: clamp(fitZoomFor(GB.x1 - GB.x0, GB.y1 - GB.y0, rot, 30), MIN_Z, MAX_Z), rot};\n"
                "  else camera = {cx: 1192, cy: 842, z: clamp(fitZoomFor(SHEET_W, SHEET_H, rot, 30), MIN_Z, MAX_Z), rot}; setLabel('Full master plan · as drawn'); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); changeView(false); }\n"
                "function gotoRect(rect, label) { stopCameraMotion813(); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); const [x0, y0, x1, y1] = geoRect(rect), rot = camera.rot || 0; camera = {cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z: clamp(fitZoomFor(x1 - x0, y1 - y0, rot, 65), MIN_Z, MAX_Z), rot}; setLabel(label); changeView(false); }",
             "function fit(asSheet = false, animate = true) { stopCameraMotion813();clearSelection813(); highlight = null; const rot = 0; let to;\n"
             "  if (geoOn() && GB && !asSheet) to = {cx: (GB.x0 + GB.x1) / 2, cy: (GB.y0 + GB.y1) / 2, z: clamp(fitZoomFor(GB.x1 - GB.x0, GB.y1 - GB.y0, rot, 30), MIN_Z, MAX_Z), rot};\n"
             "  else to = {cx: 1192, cy: 842, z: clamp(fitZoomFor(SHEET_W, SHEET_H, rot, 30), MIN_Z, MAX_Z), rot}; setLabel('Full master plan · as drawn'); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active'));\n"
             "  if (animate) glideCamera887(to); else { camera = to; changeView(false); } }\n"
             "function gotoRect(rect, label) { stopCameraMotion813(); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); const [x0, y0, x1, y1] = geoRect(rect), rot = camera.rot || 0; setLabel(label); glideCamera887({cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z: clamp(fitZoomFor(x1 - x0, y1 - y0, rot, 65), MIN_Z, MAX_Z), rot}); }\n"
             "/* v8.87 - A PICK GLIDES, IT DOES NOT JUMP (Andrew, 7 Oct 2026: \"its not smooth\"). The camera eases to the new view over a third to two\n"
             "   thirds of a second, longer for a longer way, with the destination's tiles asked for first; before the plan is on screen, under 3D and\n"
             "   for anyone who asked their device for reduced motion it still lands at once. */\n"
             "let gotoAnim887 = 0;\n"
             "function glideCamera887(to) {\n"
             "  cancelAnimationFrame(gotoAnim887); gotoAnim887 = 0;\n"
             "  if (!ready || !loaderAt || calm() || under3d() || !shown887()) { camera = to; changeView(false); return; }\n"
             "  const save = camera; camera = Object.assign({}, to); clampCamera(); const dest = currentView(), end = {cx: camera.cx, cy: camera.cy, z: camera.z, rot: camera.rot}; camera = save; prefetchView(dest);\n"
             "  const from = {cx: camera.cx, cy: camera.cy, z: camera.z, rot: camera.rot}, dz = Math.abs(Math.log(end.z / from.z)), far = Math.hypot(end.cx - from.cx, end.cy - from.cy) * fitScale * Math.min(from.z, end.z);\n"
             "  if (dz < .002 && far < 1 && Math.abs(end.rot - from.rot) < .01) { camera = to; changeView(false); return; }\n"
             "  const dur = clamp(260 + dz * 110 + far * .22, 320, 680), t0 = performance.now(), dr = ((end.rot - from.rot + 540) % 360) - 180;\n"
             "  (function step() { const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3);\n"
             "    camera.cx = from.cx + (end.cx - from.cx) * e; camera.cy = from.cy + (end.cy - from.cy) * e; camera.z = Math.exp(Math.log(from.z) + Math.log(end.z / from.z) * e); camera.rot = from.rot + dr * e;\n"
             "    if (k < 1) { touchInteraction(); changeView(false); gotoAnim887 = requestAnimationFrame(step); } else { gotoAnim887 = 0; camera = to; changeView(false); } })();\n"
             "}", 'fit and gotoRect glide')
    # a change between the plan's and the ground's coordinate spaces still lands at once (v7.90): the two cannot be glided between
    s = once(s, "    stopZoomAnim(); stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;\n    fit();\n  } else changeView(false);",
             "    stopZoomAnim(); stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;\n    fit(false, false);   /* v8.87 - no glide across coordinate spaces */\n  } else changeView(false);", 'setMode fit')
    s = once(s, "setInterval(done782Pull, 4000); setTimeout(done782Pull, 600);",
             "/* v8.87 - every 4 s while the map is on screen and still; nothing while it is hidden, parked or moving */\n"
             "let done782Timer = 0;\n"
             "function done782Loop() { clearTimeout(done782Timer); done782Timer = 0; if (!shown887()) return; if (!(interacting || zAnim || flingRAF)) done782Pull(); done782Timer = setTimeout(done782Loop, 4000); }\n"
             "setTimeout(done782Loop, 600); document.addEventListener('visibilitychange', () => { if (!document.hidden) done782Loop(); });", 'done poll')
    s = once(s, "    const g = ctx.createRadialGradient(c.x, c.y, r * .55, c.x, c.y, r * 1.6); g.addColorStop(0, m.c + '00'); g.addColorStop(.45, m.c + (sel ? '66' : '3a')); g.addColorStop(1, m.c + '00');\n"
                "    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.6, 0, Math.PI * 2); ctx.fill();",
             "    const rk = Math.round(r * 2) / 2, gk = m.c + (sel ? 's' : 'n') + rk; let g = gradCache887.get(gk);   /* v8.87 - one gradient per colour and size, not one per ring per frame */\n"
             "    if (!g) { g = ctx.createRadialGradient(0, 0, rk * .55, 0, 0, rk * 1.6); g.addColorStop(0, m.c + '00'); g.addColorStop(.45, m.c + (sel ? '66' : '3a')); g.addColorStop(1, m.c + '00'); if (gradCache887.size > 400) gradCache887.clear(); gradCache887.set(gk, g); }\n"
             "    ctx.save(); ctx.translate(c.x, c.y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rk * 1.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();", 'ring gradient')
    s = once(s, "    if (showText || sel) { const txt = m.it.code, w = ctx.measureText(txt).width + 12 * dpr,",
             "    if (showText || sel) { const txt = m.it.code, w = textWidth887(ctx, txt) + 12 * dpr,", 'label width')
    s = once(s, "function markAt(x, y) {",
             "const gradCache887 = new Map(), textCache887 = new Map();\n"
             "function textWidth887(ctx, txt) { const k = ctx.font + '|' + txt; let w = textCache887.get(k); if (w == null) { w = ctx.measureText(txt).width; if (textCache887.size > 2000) textCache887.clear(); textCache887.set(k, w); } return w; }\n"
             "/* v8.87 - any placed unit can be tapped, chip or no chip (Andrew, 7 Oct 2026: \"when you click on example building nothing is clearly\n"
             "   saying what has been done\"): the nearest unit within a finger's reach, the master plan's own units first */\n"
             "function itemAt887(x, y) { if (!ITEMS || !ITEMS.length || (window.GC500FencingMap && window.GC500FencingMap.active)) return null; const v = currentView(), M = sheetToDevice(v.scale, sw, sh); let best = null;\n"
             "  for (const it of ITEMS) { if (!it.cat) continue; for (const bb of it.places) { const g0 = toGeo((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), c = applyM(M, g0.x, g0.y), r = Math.max(14, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) * v.scale * .7), d = Math.hypot(c.x - x, c.y - y), host = it.cat.host ? 0 : 1;\n"
             "    if (d <= Math.max(r * 1.2, 24) && (!best || host < best.host || (host === best.host && d < best.d))) best = {m: {it, c: it.cat.c}, d, host}; } }\n"
             "  return best && best.m; }\n"
             "function markAt(x, y) {", 'markAt helpers')
    s = once(s, "const m = markAt(t.x, t.y); if (m) selectCode(m.it.code, 0, true); });",
             "const m = markAt(t.x, t.y) || itemAt887(t.x, t.y); if (m) selectCode(m.it.code, 0, true); });", 'tap picks any unit')
    s = once(s, "stage.addEventListener('pointerdown', e => { if (onControls(e) || e.button > 0) return; e.preventDefault();stage.focus({preventScroll: true}); stopCameraMotion813(); panTrail = [];",
             "stage.addEventListener('pointerdown', e => { if (onControls(e) || e.button > 0) return; e.preventDefault();stage.focus({preventScroll: true}); stopCameraMotion813(); panTrail = [];\n"
             "  stageRect887 = null; if (e.isPrimary && pointers.size) { pointers.clear(); pinch = null; gestureStart = null; }   /* v8.87 - a new gesture never inherits a pointer whose release was lost */",
             'pointerdown guard')
    s = once(s, "    goto:gotoRect,setMode,toast,clearSelection:()=>{clearSelection813();showCategory(null);},panel:panel813}),ready: readyPromise,",
             "    goto:gotoRect,setMode,toast,clearSelection:()=>{clearSelection813();showCategory(null);document.querySelectorAll('#chips .chip').forEach(x=>x.setAttribute('aria-pressed','false'));},panel:panel813}),ready: readyPromise,\n"
             "  setHostShown: setHostShown887, shown: shown887, lightFrames: () => ({moving: lightMoving887, next: lightNext887}),", 'explorer api')
    return s


def patch_fencing(s):
    s = once(s, "let active=false,model=null,snapshot=null,selected=null,timer=0,previousMode=null,snapshotKey='',hits=[],pointer=null;",
             "let active=false,model=null,snapshot=null,selected=null,timer=0,previousMode=null,snapshotKey='',hits=[],pointer=null;\n"
             "let visCache=null,overlayDrawn=false,fcard=null;  /* v8.87 - the geometry on the map, worked out once per change; the phone's fencing card */", 'state')
    s = once(s, "catch(_){snapshotKey='';model=null;selected=null;", "catch(_){snapshotKey='';model=null;selected=null;visCache=null;", 'refresh failure')
    s = once(s, "conflicts:Array.isArray(incoming.conflicts)?incoming.conflicts.filter(x=>x&&typeof x==='object'):[]};model=next;",
             "conflicts:Array.isArray(incoming.conflicts)?incoming.conflicts.filter(x=>x&&typeof x==='object'):[]};model=next;visCache=null;", 'refresh model')
    s = once(s, "function render(){\n  if(!model)return;const rs=rows(),s=C.stats(rs),src=source(),overview=filters.source==='all';",
             "function render(){\n  visCache=null;if(!model)return;const rs=rows(),s=C.stats(rs),src=source(),overview=filters.source==='all';", 'render invalidates')
    s = once(s, "  renderDetails();adapter.requestPaint();\n}", "  renderDetails();if(fcard&&!fcard.hidden)fenceCard(selected);adapter.requestPaint();\n}", 'render phone card')
    s = once(s, "function visibleGeometry(){\n"
                " if(!model||!model.masterValid)return[];\n"
                " if(filters.source==='all')return [...overviewGeometry(),...areaMarkers()];\n"
                " const rs=rows(),ids=new Set(rs.map(r=>r.id));return [...model.geometry.filter(g=>g.role!=='area-signoff'&&(g.task_ids.some(id=>ids.has(id))&&geometryMatches(g,rs.find(r=>g.task_ids.includes(r.id)))||library().some(x=>x.id===g.id))),...areaMarkers()];\n"
                "}\n"
                "function paint(frame){\n"
                " if(overlay.width!==frame.width)overlay.width=frame.width;if(overlay.height!==frame.height)overlay.height=frame.height;\n"
                " ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);hits=[];drawGeometry(ctx,frame,true);\n"
                "}",
             "function visibleGeometryNow(){\n"
             " if(!model||!model.masterValid)return[];\n"
             " if(filters.source==='all')return [...overviewGeometry(),...areaMarkers()];\n"
             " const rs=rows(),ids=new Set(rs.map(r=>r.id)),lib=new Set(library().map(x=>x.id));return [...model.geometry.filter(g=>g.role!=='area-signoff'&&(g.task_ids.some(id=>ids.has(id))&&geometryMatches(g,rs.find(r=>g.task_ids.includes(r.id)))||lib.has(g.id))),...areaMarkers()];\n"
             "}\n"
             "/* v8.87 - THE GEOMETRY ON THE MAP IS WORKED OUT ONCE, NOT EVERY FRAME. It used to be rebuilt (filters, the duplicate check that turns\n"
             "   every line into text twice, the task lookups) on every frame of a pan or a zoom, Fencing on or off. Now it is kept until a filter,\n"
             "   a selection or the data changes (render and refresh clear it), with each line's task, colour and bounds worked out with it. */\n"
             "function visibleGeometry(){\n"
             " if(visCache)return visCache.list;\n"
             " const list=visibleGeometryNow(),drawn=list.map(g=>{const row=model.rows.find(r=>g.task_ids.includes(r.id))||null,complete=!!(row&&row.status.state==='complete');\n"
             "  const col=g.role==='area-signoff'?(g.areaRecords&&g.areaRecords.length?'#40db9a':'#ffad64'):complete?'#40db9a':g.role==='coverage'?'#f6be7b':colour[g.category||'unclassified'];\n"
             "  return {g,row,complete,col,bounds:g.bounds||C.bounds(g.points)};});\n"
             " visCache={list,drawn};return list;\n"
             "}\n"
             "function drawnGeometry(){visibleGeometry();return visCache?visCache.drawn:[];}\n"
             "function clearOverlay(){hits=[];if(!overlayDrawn)return;overlayDrawn=false;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);}\n"
             "function paint(frame){\n"
             " if(!active||!model){clearOverlay();return;}\n"
             " if(overlay.width!==frame.width)overlay.width=frame.width;if(overlay.height!==frame.height)overlay.height=frame.height;\n"
             " ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);hits=[];drawGeometry(ctx,frame,true);overlayDrawn=true;\n"
             "}", 'visibleGeometry and paint')
    s = once(s, " const ratio=frame.dpr;\n"
                " for(const g of visibleGeometry()){\n"
                "  const pts=g.points.map(p=>frame.project(p,g.region));if(!pts.length)continue;\n"
                "  const row=model.rows.find(r=>g.task_ids.includes(r.id));const complete=row&&row.status.state==='complete';\n"
                "  const picked=selected===g.id||g.task_ids.includes(selected);const col=g.role==='area-signoff'?(g.areaRecords&&g.areaRecords.length?'#40db9a':'#ffad64'):complete?'#40db9a':g.role==='coverage'?'#f6be7b':colour[g.category||'unclassified'];",
             " const ratio=frame.dpr,W=frame.width,H=frame.height,margin=130*ratio;\n"
             " for(const d of drawnGeometry()){\n"
             "  const g=d.g,b=d.bounds;\n"
             "  if(b){const c=[frame.project([b[0],b[1]],g.region),frame.project([b[2],b[1]],g.region),frame.project([b[0],b[3]],g.region),frame.project([b[2],b[3]],g.region)];let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const q of c){if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1];}if(x1<-margin||y1<-margin||x0>W+margin||y0>H+margin)continue;}  /* v8.87 - off the screen: not drawn, not a hit */\n"
             "  const pts=g.points.map(p=>frame.project(p,g.region));if(!pts.length)continue;\n"
             "  const row=d.row,complete=d.complete;\n"
             "  const picked=selected===g.id||g.task_ids.includes(selected),col=d.col;", 'drawGeometry loop')
    s = once(s, " if(best){ev.preventDefault();ev.stopImmediatePropagation();choose(best.id,false);adapter.panel(true);}\n}",
             " /* v8.87 - THE STUCK POINTER. This used to stop the pointerup here, so the map's own pointer handling never saw the release: the map\n"
             "    went on following the mouse, and the next finger read as a pinch. The release now reaches the map; the click that follows is\n"
             "    the one swallowed, so the tap does not also pick a ring. A tap on the map away from any line closes the details. */\n"
             " if(best){swallowClick();choose(best.id,false);if(matchMedia('(max-width:900px)').matches)fenceCard(best.id);else adapter.panel(true);}\n"
             " else if(selected!=null){selected=null;render();}\n"
             "}\n"
             "function swallowClick(){let t=0;const h=e=>{e.stopImmediatePropagation();e.preventDefault();window.removeEventListener('click',h,true);clearTimeout(t);};window.addEventListener('click',h,true);t=setTimeout(()=>window.removeEventListener('click',h,true),500);}\n"
             "/* v8.87 - on a phone a tapped fence line gets a card at the foot of the map, as a unit does, instead of the drawer over the map */\n"
             "function fenceCard(id){\n"
             " const phone=matchMedia('(max-width:900px)').matches;\n"
             " if(!fcard){fcard=document.createElement('div');fcard.id='fmCard887';fcard.setAttribute('role','dialog');fcard.setAttribute('aria-label','Fencing selection');fcard.hidden=true;$('stage').parentElement.append(fcard);\n"
             "  for(const ev of ['pointerdown','pointerup','click','dblclick'])fcard.addEventListener(ev,e=>e.stopPropagation());fcard.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});\n"
             "  fcard.addEventListener('click',e=>{if(e.target.closest('[data-fmcardx]')){selected=null;render();return;}if(e.target.closest('[data-fmcardmore]')){adapter.panel(true);revealDetails();}});}\n"
             " const r=id!=null&&model&&model.rows.find(r=>r.id===id),g=!r&&id!=null&&model&&(model.geometry.find(g=>g.id===id)||overviewGeometry().find(g=>g.id===id));\n"
             " if(!phone||(!r&&!g)){fcard.hidden=true;return;}\n"
             " const status=$('fmDetails').querySelector('.fm-status'),title=r?r.location:(g.label||'Source fence run');\n"
             " fcard.innerHTML=`<div class=\"fm-card-t\"><b>${e(title)}</b><button type=\"button\" class=\"fm-card-x\" data-fmcardx aria-label=\"Close fencing details\">×</button></div><div class=\"fm-card-s\">${status?e(status.textContent):''}</div>${r?`<div class=\"fm-card-s\">${e(r.description)}</div><div class=\"fm-card-s\">Planned ${e(dateText(r.date))}</div>`:''}<div class=\"fm-card-a\"><button type=\"button\" data-fmcardmore>Details and records</button></div>`;\n"
             " fcard.hidden=false;\n"
             "}", 'tap and phone card')
    s = once(s, " if(on){hostVisible=parentCall('gc500FencingMapIsActive')!==false;previousMode=A.state.mode;if(A.mode3d)A.mode3d(false);adapter.clearSelection();adapter.setMode('satellite');$('fmPlan').checked=false;adapter.panel(true);refresh(true);if(id&&model)revealTraceTarget837(id);schedule();}\n"
                " else{if(previousMode)adapter.setMode(previousMode);adapter.requestPaint();}",
             " if(on){hostVisible=parentCall('gc500FencingMapIsActive')!==false;previousMode=A.state.mode;if(A.mode3d)A.mode3d(false);adapter.clearSelection();adapter.setMode('satellite');$('fmPlan').checked=false;\n"
             "  /* v8.87 - on a phone the map stays in view: the list is a tap away (List) and a fence line gets its card at the foot of the map */\n"
             "  if(!matchMedia('(max-width:900px)').matches)adapter.panel(true);else adapter.toast('Fencing: tap a fence line for its details · List for the plan sources · Close or Escape to leave',5500);\n"
             "  refresh(true);if(id&&model)revealTraceTarget837(id);schedule();}\n"
             " else{selected=null;visCache=null;clearOverlay();if(fcard)fcard.hidden=true;if(matchMedia('(max-width:900px)').matches)adapter.panel(false);if(previousMode)adapter.setMode(previousMode);adapter.requestPaint();}  /* v8.87 - one press leaves Fencing whole: the pick goes with it */",
             'setActive')
    s = once(s, "function schedule(){clearTimeout(timer);timer=0;if(active&&hostVisible&&!document.hidden)timer=setTimeout(()=>{hostVisible=parentCall('gc500FencingMapIsActive')!==false;refresh(false);schedule();},4000);}",
             "/* v8.87 - the dashboard nudges this layer on every redraw (setHostVisible), and that nudge is signature-checked, so a full rebuild\n"
             "   happens only when the fencing data actually changed. The timer is now a 20 s safety check, run in idle time and never while a\n"
             "   hand or a glide is moving the map. */\n"
             "function schedule(){clearTimeout(timer);timer=0;if(active&&hostVisible&&!document.hidden)timer=setTimeout(pollTick,20000);}\n"
             "function pollTick(){timer=0;if(!active||!hostVisible||document.hidden)return;\n"
             " if(typeof interacting!=='undefined'&&(interacting||zAnim||flingRAF)){timer=setTimeout(pollTick,700);return;}\n"
             " const run=()=>{if(!active)return;hostVisible=parentCall('gc500FencingMapIsActive')!==false;refresh(false);schedule();};\n"
             " if(window.requestIdleCallback)requestIdleCallback(run,{timeout:3000});else run();}", 'schedule')
    s = once(s, "window.GC500FencingMap=Object.freeze({open:id=>setActive(true,id),close:()=>setActive(false),setHostVisible:on=>{hostVisible=!!on;clearTimeout(timer);timer=0;if(active&&hostVisible){refresh(true);schedule();}},refresh:()=>refresh(true),paint,exportLayer:(ctx,frame)=>{",
             "window.GC500FencingMap=Object.freeze({open:id=>setActive(true,id),close:()=>setActive(false),\n"
             " /* v8.87 - a nudge from the dashboard: signature-checked, never a forced rebuild; the map itself is told whether it is on screen */\n"
             " setHostVisible:on=>{hostVisible=!!on;if(typeof A.setHostShown==='function')A.setHostShown(hostVisible);clearTimeout(timer);timer=0;if(active&&hostVisible){refresh(false);schedule();}},\n"
             " get active(){return active;},get selected(){return selected;},hits:()=>({ratio:overlay.width/((overlay.getBoundingClientRect().width)||1),list:hits.map(h=>({id:h.id,kind:h.kind,points:h.points}))}),\n"
             " refresh:()=>refresh(true),paint,exportLayer:(ctx,frame)=>{", 'fencing api')
    return s


def patch_merge(s):
    s = once(s, "    st.addEventListener('pointerdown', e => { if (outside(e)) hideCard(); }, true);\n"
                "    st.addEventListener('wheel', e => { if (outside(e)) hideCard(); }, {capture: true, passive: true});",
             "    /* v8.87 - the card stays through a pan or a zoom (Andrew, 7 Oct 2026); a tap on the map away from it closes it */\n"
             "    let down887 = null;\n"
             "    st.addEventListener('pointerdown', e => { down887 = outside(e) && e.isPrimary ? {x: e.clientX, y: e.clientY, t: performance.now()} : null; }, true);\n"
             "    st.addEventListener('pointerup', e => { const d = down887; down887 = null; if (d && outside(e) && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8 && performance.now() - d.t < 600) hideCard(); }, true);\n"
             "    st.addEventListener('pointercancel', () => { down887 = null; }, true);", 'card inputs')
    s = once(s, "        const o = e.target.closest('[data-xopen]'); if (o) { try { const h = host(); if (h && h.gc500ExplorerPicked) h.gc500ExplorerPicked(o.dataset.xopen); } catch (x) {} } });",
             "        const o = e.target.closest('[data-xopen]'); if (o) { try { const h = host(); if (h && h.gc500ExplorerPicked) h.gc500ExplorerPicked(o.dataset.xopen); } catch (x) {} }\n"
             "        const pr = e.target.closest('[data-xprog]'); if (pr) { try { const h = host(); if (h && h.gc500ExplorerProgress) h.gc500ExplorerProgress(pr.dataset.xprog); } catch (x) {} } });", 'card progress button')
    s = once(s, "    el.innerHTML = `${info && info.img ? `<img src=\"${escH(info.img)}\" alt=\"\" decoding=\"async\">` : ''}\n"
                "      <div class=\"xc-b\"><div class=\"xc-t\"><b>${escH(code)}</b>${name ? ` <span>${escH(name)}</span>` : ''}<button type=\"button\" class=\"xc-x\" data-xclose aria-label=\"Close\">×</button></div>\n"
                "      <div class=\"xc-m\"><i style=\"background:${escH(it.cat.c)}\"></i>${escH(it.cat.name)}${info && info.status ? ` <i style=\"background:${escH(info.statusColour || '#9aa3ad')};margin-left:8px\"></i>${escH(info.status)}` : ''}${it.reg && it.reg.sec ? ` · ${escH(it.reg.sec)}` : ''}</div>\n"
                "      ${info && info.pinned ? `<div class=\"xc-s\">${escH(info.pinned)}</div>` : ''}\n"
                "      ${info && info.assets ? `<div class=\"xc-s\">Asset ${escH(info.assets)}</div>` : ''}\n"
                "      ${!it.places.length ? '<div class=\"xc-s\">In the register, with no place on the master plan yet.</div>' : ''}\n"
                "      ${canOpen ? `<div class=\"xc-a\"><button type=\"button\" class=\"xc-open\" data-xopen=\"${escH(code)}\">Open record ${escH(code)}</button></div>` : ''}</div>`;",
             "    /* v8.87 - WHAT HAS BEEN DONE, CLEARLY (Andrew, 7 Oct 2026): the Timeline's own five-stage reading, who and when, the due day and\n"
             "       what is left, from the dashboard's gc500PlanCard. A card without a stage (an older dashboard) shows its one delivery word. */\n"
             "    const st887 = info && info.stage, tone887 = {green: '#39e07a', amber: '#ffb000', red: '#ff4d4d', none: '#9aa3ad', cx: '#9aa3ad'};\n"
             "    const lamps887 = st887 ? `<div class=\"xc-lamps\" role=\"img\" aria-label=\"${escH(st887.label)}\">${st887.lamps.map((l, i) => `<span class=\"${i < st887.n ? 'on ' + escH(st887.tone) : ''}\"><i></i>${escH(l)}</span>`).join('')}</div>` : '';\n"
             "    const lines887 = info && Array.isArray(info.lines) && info.lines.length ? `<ul class=\"xc-lines\">${info.lines.map(l => `<li class=\"${l.done ? 'done' : ''}\"><b>${l.done ? '✓' : '·'} ${escH(l.k)}</b><span>${escH(l.text)}</span></li>`).join('')}</ul>` : '';\n"
             "    el.innerHTML = `${info && info.img ? `<img src=\"${escH(info.img)}\" alt=\"\" decoding=\"async\">` : ''}\n"
             "      <div class=\"xc-b\"><div class=\"xc-t\"><b>${escH(code)}</b>${name ? ` <span>${escH(name)}</span>` : ''}<button type=\"button\" class=\"xc-x\" data-xclose aria-label=\"Close\">×</button></div>\n"
             "      <div class=\"xc-m\"><i style=\"background:${escH(it.cat.c)}\"></i>${escH(it.cat.name)}${!st887 && info && info.status ? ` <i style=\"background:${escH(info.statusColour || '#9aa3ad')};margin-left:8px\"></i>${escH(info.status)}` : ''}${it.reg && it.reg.sec ? ` · ${escH(it.reg.sec)}` : ''}</div>\n"
             "      ${st887 ? `<div class=\"xc-st\"><i style=\"background:${escH(tone887[st887.tone] || '#9aa3ad')}\"></i>${escH(st887.label)}</div>${lamps887}${st887.why ? `<div class=\"xc-why\">${escH(st887.why)}</div>` : ''}` : ''}\n"
             "      ${lines887}\n"
             "      ${info && info.due ? `<div class=\"xc-s\">${escH(info.due)}</div>` : ''}\n"
             "      ${info && info.left ? `<div class=\"xc-left\">${escH(info.left)}</div>` : ''}\n"
             "      ${info && info.pinned ? `<div class=\"xc-s\">${escH(info.pinned)}</div>` : ''}\n"
             "      ${info && info.assets ? `<div class=\"xc-s\">Asset ${escH(info.assets)}</div>` : ''}\n"
             "      ${!it.places.length ? '<div class=\"xc-s\">In the register, with no place on the master plan yet.</div>' : ''}\n"
             "      ${canOpen ? `<div class=\"xc-a\"><button type=\"button\" class=\"xc-open\" data-xopen=\"${escH(code)}\">Open record ${escH(code)}</button>${info && info.progress ? `<button type=\"button\" class=\"xc-prog\" data-xprog=\"${escH(code)}\">Progress</button>` : ''}</div>` : ''}</div>`;",
             'card template')
    return s


def patch_fix864(s):
    s = once(s, "|| !!(F() && F().state.active && F().state.selected); } catch (_) { return false; } };",
             "|| !!(F() && F().active && F().selected); } catch (_) { return false; } };   /* v8.87 - the cheap reads */", 'anySelected')
    s = once(s, "    if (F() && F().state.active && F().state.selected) { const s = $('fmStatus'); if (s && typeof s.onchange === 'function') s.onchange(); }",
             "    if (F() && F().active && F().selected) { const s = $('fmStatus'); if (s && typeof s.onchange === 'function') s.onchange(); }", 'clearAll fencing pick')
    s = once(s, "  setInterval(() => { if (!document.hidden) syncClear(); }, 700);",
             "  setInterval(() => { if (!document.hidden && !(window.GC500Explorer && typeof window.GC500Explorer.shown === 'function' && !window.GC500Explorer.shown())) syncClear(); }, 700);   /* v8.87 - not while hidden or parked */", 'heartbeat')
    s = once(s, "    if (anySelected()) { clearAll(); return; }\n"
                "    if (fencingOn() && F()) { e.preventDefault(); F().close(); }",
             "    if (fencingOn() && F()) { e.preventDefault(); F().close(); return; }   /* v8.87 - one press leaves Fencing, whatever is picked */\n"
             "    if (anySelected()) { clearAll(); return; }", 'escape order')
    return s


def patch_index(h, tokens):
    h = once(h, '<link rel="stylesheet" href="explorer-fix864.css?v=c37afd304911">',
             '<link rel="stylesheet" href="explorer-fix864.css?v=c37afd304911">\n<link rel="stylesheet" href="explorer-fix887.css?v=' + tokens['explorer-fix887.css'] + '">', 'index css')
    h = once(h, '<script src="explorer.js?v=65749fbe601b"></script>', '<script src="explorer.js?v=' + tokens['explorer.js'] + '"></script>', 'index explorer.js')
    h = once(h, '<script src="explorer-merge.js?v=261238402f3c"></script>', '<script src="explorer-merge.js?v=' + tokens['explorer-merge.js'] + '"></script>', 'index merge')
    h = once(h, '<script src="fencing-map-explorer.js?v=31418b528009"></script>', '<script src="fencing-map-explorer.js?v=' + tokens['fencing-map-explorer.js'] + '"></script>', 'index fencing')
    h = once(h, '<script src="explorer-fix864.js?v=2b0cfadb0b2b"></script>',
             '<script src="explorer-fix864.js?v=' + tokens['explorer-fix864.js'] + '"></script>\n<script src="explorer-fix887.js?v=' + tokens['explorer-fix887.js'] + '"></script>', 'index fix864')
    return h


def build(src, out):
    raw = {}
    for name, h in BASE.items():
        b = (src / name).read_bytes()
        if sha(b) != h: sys.exit(f'{name} is not the registered v8.64 file: {sha(b)}')
        raw[name] = b
    files = {
        'explorer.js': patch_explorer(raw['explorer.js'].decode('utf-8')).encode('utf-8'),
        'fencing-map-explorer.js': patch_fencing(raw['fencing-map-explorer.js'].decode('utf-8')).encode('utf-8'),
        'explorer-merge.js': patch_merge(raw['explorer-merge.js'].decode('utf-8')).encode('utf-8'),
        'explorer-fix864.js': patch_fix864(raw['explorer-fix864.js'].decode('utf-8')).encode('utf-8'),
        'explorer-fix887.js': (HERE / 'source' / 'explorer-fix887.js').read_bytes(),
        'explorer-fix887.css': (HERE / 'source' / 'explorer-fix887.css').read_bytes(),
    }
    tokens = {k: sha(v)[:12] for k, v in files.items()}
    files['index.html'] = patch_index(raw['index.html'].decode('utf-8'), tokens).encode('utf-8')
    out.mkdir(parents=True, exist_ok=True)
    for name, b in files.items(): (out / name).write_bytes(b)
    for name in ('index.html', 'explorer.js', 'explorer-merge.js', 'fencing-map-explorer.js', 'explorer-fix864.js', 'explorer-fix887.js', 'explorer-fix887.css'):
        b = files[name]; print(f'{name:26} {len(b):>7} {sha(b)}')
    return files


if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit(__doc__)
    build(Path(sys.argv[1]), Path(sys.argv[2]))
    print('Seven explorer files prepared; nothing uploaded or registered.')
