#!/usr/bin/env python3
"""Round 2 after the first campaign: (1) past the pyramid, half-octave levels (L 3.5, 4, 4.5 ...) instead of whole octaves:
at most 1.4x the tiles of the screen's own need, not 2x, so a pan at street level renders half as many SVG tiles;
(2) the ring of tiles round the view is also prefetched past the pyramid once the scene is in; (3) three SVG renders at
once on a desktop (was two); (4) Original plan's aerial is prepared as soon as the first view is sharp, not after the
hand has been still for 1.5 s (it is all in a worker, in software).  python3 patch_round2.py explorer/explorer.js"""
import sys
p = sys.argv[1]; t = open(p, encoding='utf-8').read()
def R(o, n, c=1):
    global t
    if t.count(o) != c: sys.exit('%r: %d' % (o[:60], t.count(o)))
    t = t.replace(o, n)
R("""  return Math.max(Math.ceil(PYR_MAX), Math.ceil(need - .07)); }                                 /* past the pyramid: whole octaves from the vectors */""",
  """  return Math.max(PYR_MAX + .25, Math.ceil((need - .07) * 2) / 2); }                            /* past the pyramid: half octaves from the vectors */""")
R("""   3.25 (quarter octaves) are pre-rendered (assets/vt, read by byte range and decoded off the thread). Past the top of
   the pyramid the worker builds each tile's SVG from the source primitives at whole octaves (L 4, 5, 6 ...) and the page""",
  """   3.25 (quarter octaves) are pre-rendered (assets/vt, read by byte range and decoded off the thread). Past the top of
   the pyramid the worker builds each tile's SVG from the source primitives at half octaves (L 3.5, 4, 4.5 ...) and the page""")
R("""  if (!moving && !missing && pyrHas(L)) { const gx = Math.ceil(SHEET_W / T.span), gy = Math.ceil(SHEET_H / T.span);""",
  """  if (!moving && !missing && (pyrHas(L) || sceneReady)) { const gx = Math.ceil(SHEET_W / T.span), gy = Math.ceil(SHEET_H / T.span);""")
R("""if (svgBusy >= (PHONE ? 1 : 2) || (moving && !q.goal)) continue; }""", """if (svgBusy >= (PHONE ? 1 : 3) || (moving && !q.goal)) continue; }""")
R("""  whenQuiet(() => { if (mode !== 'original') { if (roomy && OFFSCREEN_OK) underlayJob(); else UNDER.forEach(u => fetch('assets/' + u.file, {priority: 'low'}).catch(() => {})); } }, 1500);""",
  """  if (mode !== 'original') { if (roomy && OFFSCREEN_OK) setTimeout(underlayJob, 200); else whenQuiet(() => UNDER.forEach(u => fetch('assets/' + u.file, {priority: 'low'}).catch(() => {})), 1500); }""")
open(p, 'w', encoding='utf-8').write(t); print('patched')
# (5) the full-size aerial picture comes back from the worker in 1024 px tiles: a close view uploads one or two to the
#     graphics chip, not 56 MB
t = open(p, encoding='utf-8').read()
R("""      underComp = {bbox: m.bbox, w: m.w, files: new Set(m.members), 1: m.comp[1], 2: m.comp[2], 4: m.comp[4]};""",
  """      underComp = {bbox: m.bbox, w: m.w, files: new Set(m.members), 1: m.comp[1], 2: m.comp[2], 4: m.comp[4], tiles1: m.tiles1 || null};""")
R("""  let skip = null; if (underComp) { const shown = (underComp.bbox[2] - underComp.bbox[0]) * k, c = shown <= underComp.w / 3.2 ? underComp[4] : shown <= underComp.w / 1.6 ? underComp[2] : underComp[1];
    drawCropped({canvas: c, x: underComp.bbox[0], y: underComp.bbox[1], w: underComp.bbox[2] - underComp.bbox[0], h: underComp.bbox[3] - underComp.bbox[1]}, [[v.x, v.y, v.x + v.w, v.y + v.h]]); skip = underComp.files; }""",
  """  let skip = null; if (underComp) { const b = underComp.bbox, shown = (b[2] - b[0]) * k, c = shown <= underComp.w / 3.2 ? underComp[4] : shown <= underComp.w / 1.6 ? underComp[2] : underComp[1], vr = [[v.x, v.y, v.x + v.w, v.y + v.h]];
    if (c) drawCropped({canvas: c, x: b[0], y: b[1], w: b[2] - b[0], h: b[3] - b[1]}, vr);
    else { const T = underComp.tiles1, sx = (b[2] - b[0]) / T.pw, sy = (b[3] - b[1]) / T.ph; for (const q of T.tiles) drawCropped({canvas: q.bm, x: b[0] + q.x * sx, y: b[1] + q.y * sy, w: q.w * sx, h: q.h * sy}, vr); }
    skip = underComp.files; }""")
R("""if (underComp) { const b = underComp.bbox; g.drawImage(underComp[1], b[0], b[1], b[2] - b[0], b[3] - b[1]); }""",
  """if (underComp) { const b = underComp.bbox; if (underComp[1]) g.drawImage(underComp[1], b[0], b[1], b[2] - b[0], b[3] - b[1]); else { const T = underComp.tiles1, sx = (b[2] - b[0]) / T.pw, sy = (b[3] - b[1]) / T.ph; for (const q of T.tiles) g.drawImage(q.bm, b[0] + q.x * sx, b[1] + q.y * sy, q.w * sx, q.h * sy); } }""")
R("""/* after the first sharp view, when the hand is still: Original plan's aerial, made ready off the thread (one tap away),
   then the scene for zoom past the pyramid.""", """/* after the first sharp view: Original plan's aerial, made ready off the thread at once (one tap away); then, when the
   hand is still, the scene for zoom past the pyramid.""")
open(p, 'w', encoding='utf-8').write(t); print('patched 5')
w = p.replace('explorer.js', 'scene-worker.js'); t = open(w, encoding='utf-8').read()
R("""    comp[f] = c.transferToImageBitmap(); transfer.push(comp[f]); }""",
  """    if (f === 1) { const T = 1024, tiles = []; for (let y = 0; y < c.height; y += T) for (let x = 0; x < c.width; x += T) { const bm = await createImageBitmap(c, x, y, Math.min(T, c.width - x), Math.min(T, c.height - y)); tiles.push({x, y, w: bm.width, h: bm.height, bm}); transfer.push(bm); }
      tiles1 = {pw: c.width, ph: c.height, tiles}; continue; }
    comp[f] = c.transferToImageBitmap(); transfer.push(comp[f]); }""")
R("""  const comp = {}, members = [], loose = {}, transfer = [];""", """  const comp = {}, members = [], loose = {}, transfer = []; let tiles1 = null;""")
R("""  return {msg: {t: 'underlay', id: m.id, bbox: bb, w: base.px[0], members, comp, loose,""", """  return {msg: {t: 'underlay', id: m.id, bbox: bb, w: base.px[0], members, comp, tiles1, loose,""")
R("""   {t:'underlay', id, items:[{file,bbox,px}], base, sizes} -> {t:'underlay', id, bbox, w, members, comp:{1,2,4}, loose:{file: bitmap}} */""",
  """   {t:'underlay', id, items:[{file,bbox,px}], base, sizes} -> {t:'underlay', id, bbox, w, members, comp:{2,4}, tiles1:{pw,ph,tiles:[{x,y,w,h,bm}]}, loose:{file: bitmap}}
   (the full size comes back in 1024 px tiles, so a close view sends only what it shows to the graphics chip) */""")
open(w, 'w', encoding='utf-8').write(t); print('patched worker')
