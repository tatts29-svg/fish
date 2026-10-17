"""Author: Andrew Fisher. v10.60 - the Map explorer shows every reference as the shape of what it is, with its door, and
the green tick inside it.

Andrew, 17 Oct 2026: "the circle should be the shape of the icon. Also with the fwf the door is where it points to";
"they need to be icons of what they are. With the green tick inside that equipment not outside it"; "when we see all
the references the references is the shape of what it is and how it looks on the map if it has a door it show the
door"; "And the green tick is inside the shape not outside".

What changes in the Map explorer (the separate map in its own frame):
- A reference with a traced shape on the 2 Oct master (window.MasterShapes926: 192 references) is drawn as that shape,
  turned the way it sits, in its category colour: buildings and toilet blocks their outline, FWFs their square. A
  catalogue footprint (not traced) is dashed. A waste tank under its block is grey.
- The door is drawn: the master's door swing (arc and leaf) where it has one; for an FWF the chevron on its edge, which
  is where its door is.
- The status sits inside the shape: the green tick when complete (amber dash or the other states the same way), once,
  in the reference's main part, sized to fit; a shape too small for it at that zoom is filled in the status colour
  instead. The large tick beside the item, the circle round it and its glow are not drawn for shaped references.
- Finished units shown by the Done chip are drawn the same way (their shape with the tick inside), not as a loose tick.
- The reference is written inside its shape, along it, beside the tick; no second box (Andrew, 17 Oct 2026: "Put the
  reference number inside the box too.. i dont want two boxes shown"). Selected, the status words go under it when
  they fit. A shape too small at that zoom keeps the tick or its status fill and the reference sits on it as plain
  text. Tapping the reference still opens the card; the selected reference is outlined in orange.
- Tapping inside a shape selects it.
- Glow and pulse (Andrew, 17 Oct 2026: "Glow and pulsate too"): every shape glows softly in its colour; the selected
  one ripples outward in its own outline; finished units beat twice when the Done chip shows them. Still while the map
  moves, and with reduced motion or the project's Motion Off.
- A reference keeps today's marker, so nothing disappears, when it has no traced shape, more than one place, an outline
  it shares with other references (the police block P26/P28/P34 - fridges and chairs inside it - PG01/03/05/29, shared
  barrier runs), is furniture, or its marker sits more than 6 sheet points (about 4 m) off its outline (area-label
  traces such as WB13, WB14, WB16, T0258, T0266). Its status now sits inside its circle rather than beside it.
- The FWF door is the edge its chevron points at, from Andrew's 17 Oct words; an FWF with no traced chevron shows no
  door rather than a guessed one.
- The fencing map and the 3D view are left as they are.

How: the page injects one inline script into the explorer frame on each load (same origin; the explorer's policy allows
inline scripts). It wraps the explorer's own drawMarks: shaped references are taken out of the native pass and drawn on
a canvas just under the native one, projected through the explorer's own camera chain (sheetToDevice, toGeo, applyM),
so they stay aligned while panning, zooming, rotating and in the satellite inset. It wraps markAt and itemAt887 for
tapping. The shapes come from a new read-only page function, gc500MapShapes1060(). It only runs on the reviewed
explorer build (explorer.js?v=8586cb7d5008); on any other build it stands down and the explorer is unchanged.

The explorer's own files, the record and every figure are unchanged. Footer v10.59 -> v10.60.

    python3 patch_v1060.py path/to/page.html   (on the v10.59 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"
LOAD_OLD = " f.addEventListener('load', () => { contrast1007Map(f); EXP.loaded = true;"
LOAD_NEW = " f.addEventListener('load', () => { contrast1007Map(f); try { if (window.gc500ShapeLayer1060) window.gc500ShapeLayer1060.mount(f); } catch (e) {} EXP.loaded = true;"

JS = r'''/* Author: Andrew Fisher. v10.60 - the Map explorer shows each reference as its own shape, with its door and the tick inside (Andrew, 17 Oct 2026: "the references is the shape of what it is and how it looks on the map if it has a door it show the door"). */
(function(W){
 'use strict';
 if (W.gc500ShapeLayer1060) return;
 /* the reviewed explorer build: every script it loads, in order (any other build and the layer stands down) */
 const EXPLORER_BUILD = ['explorer.js?v=8586cb7d5008', 'explorer-merge.js?v=97a4087210f3', 'fencing-map-core.js?v=0c26c3b7777f', 'fencing-map-explorer.js?v=e3a4bef6c17d', 'explorer-fix864.js?v=d7041320fc3f', 'explorer-fix887.js?v=6996471a6a0f'].join('|');
 const normRef = s => String(s || '').toUpperCase().replace(/[\s\-_.]+/g, ' ').trim();
 let memo = null;
 /* read-only: each placed reference's traced shape on the 2 Oct master, in sheet fractions, with doors and FWF chevrons */
 W.gc500MapShapes1060 = function(){
  if (memo) return memo;
  try {
   const M = W.MasterShapes926; if (!M || typeof M.shape !== 'function' || typeof M.placed !== 'function') return {available: false};
   const keys = typeof M.refs === 'function' ? M.refs() : [];
   const refs = {}; let comps = 0, doors = 0, chevrons = 0;
   const pt = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) ? [p[0], p[1]] : null;
   const line = l => Array.isArray(l) ? l.map(pt).filter(Boolean) : [];
   keys.forEach(ref => {
    if (!M.placed(ref)) return;
    const s = M.shape(ref); if (!s || s.cancelled || !Array.isArray(s.components)) return;
    if (s.components.some(c => c && !c.drawn_as && c.geometry && c.geometry !== 'polygon')) return;    /* barrier runs are lines, not shapes: they keep their marker */
    const out = [];
    s.components.forEach(c => {
     if (!c || c.drawn_as || !Array.isArray(c.poly) || c.poly.length < 3) return;
     const poly = c.poly.map(pt).filter(Boolean); if (poly.length < 3) return;
     const tank = c.kind === 'waste_tank' || c.source === 'under_block' || !!c.under;
     const ds = (Array.isArray(c.doors) && c.doors.length ? c.doors : c.door ? [c.door] : []).map(d => {
      const sw = d && d.swing || {};
      const land = Array.isArray(sw.landing) ? (sw.landing.length && pt(sw.landing[0]) ? [line(sw.landing)] : sw.landing.map(line)) : [];    /* a run of points, or a list of segments */
      return {mid: pt(d && d.mid), out: pt(d && d.outward), arcs: (sw.arcs || (sw.arc ? [sw.arc] : [])).map(line), leaves: (sw.leaves || (sw.leaf ? [sw.leaf] : [])).map(line), landing: land.filter(l => l.length > 1)};
     }).filter(d => d.mid);
     const chev = (Array.isArray(c.marks) ? c.marks : []).filter(k => k && k.type === 'chevron').flatMap(k => (k.lines || []).map(line));
     out.push({kind: String(c.kind || ''), poly, std: !!c.standard || c.source === 'standard', tank, doors: ds, chev, centroid: pt(c.centroid)});
     comps++; doors += ds.length; if (chev.length) chevrons++;
    });
    if (out.length) refs[normRef(ref)] = {ref, centroid: pt(s.centroid), comps: out};
   });
   /* references holding the identical outline set (the police block P26/P28/P34, PG01/03/05/29, shared barrier runs):
      nothing says which outline is whose, so each keeps its marker */
   const sigOf = r => r.comps.map(c => c.poly.map(p => p[0].toFixed(5) + ',' + p[1].toFixed(5)).join(';')).sort().join('|'), seen = new Map();
   Object.values(refs).forEach(r => { const k = sigOf(r); seen.set(k, (seen.get(k) || 0) + 1); });
   let shared = 0; Object.values(refs).forEach(r => { r.shared = seen.get(sigOf(r)) > 1; if (r.shared) shared++; });
   let meta = {}; try { meta = M.meta() || {}; } catch (e) {}
   memo = {available: true, version: 'v10.60', sig: [meta.source_sha256 || '', meta.master_sha256 || '', Object.keys(refs).length, comps, doors, chevrons, shared].join('|'), refs, counts: {refs: Object.keys(refs).length, comps, doors, chevrons, shared}};
   return memo;
  } catch (e) { return {available: false, reason: String(e && e.message || e)}; }
 };

 /* runs INSIDE the explorer frame (its own realm): no reference to anything in this page except through window.parent */
 function frameMain(){
  'use strict';
  if (window.GC500Shape1060) return;
  const need = ['drawMarks', 'markAt', 'itemAt887', 'done782List', 'tick897', 'badge1009', 'sheetToDevice', 'applyM', 'toGeo', 'currentView', 'mapStatus1009', 'label1009', 'fitReference1010', 'referenceQuantity1010', 'textWidth887', 'requestPaint'];
  if (need.some(n => typeof window[n] !== 'function')) return;
  const host = window.parent, stageEl = document.getElementById('stage'), native = document.getElementById('marks');
  if (!stageEl || !native) return;
  let LAYOUT = new Map(), PLAN = new Map(), hideText = false, SNAP = null, SIG = '', CACHE = new Map(), drawn = 0, kept = 0, off = 0, failed = 0, lastErr = '', frameDn = null, doneShaped = [];
  const nativeDraw = window.drawMarks, nativeMarkAt = window.markAt, nativeItemAt = window.itemAt887, nativeDone = window.done782List, nativeTick = window.tick897, nativeLabel = window.label1009;
  const fencing = () => !!(window.GC500FencingMap && window.GC500FencingMap.active);
  const layer = document.createElement('canvas'); layer.id = 'shape1060'; layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  native.parentNode.insertBefore(layer, native);
  const beatLayer = document.createElement('canvas'); beatLayer.id = 'shape1060beat'; beatLayer.setAttribute('aria-hidden', 'true'); beatLayer.style.cssText = layer.style.cssText + ';display:none';    /* shown only while it beats */
  native.parentNode.insertBefore(beatLayer, native);
  const css = document.createElement('style'); css.id = 'shape1060-style'; css.textContent = 'body.in3d #shape1060,body.in3d #shape1060beat{visibility:hidden}body.fencing-map #shape1060,body.fencing-map #shape1060beat{display:none!important}'; document.head.appendChild(css);
  const g = layer.getContext('2d'), bg = beatLayer.getContext('2d');
  const BEAT = {sel: null, selKey: '', selStart: 0, done: [], doneKey: '', doneStart: 0, raf: 0, wait: 0, frames: 0}; let paints = 0;
  const MIN = 12, NEAR = 6;    /* px: the smallest a shape is drawn; sheet points (about 4 m): how far the marker may sit outside the shape */
  function pull(){
   try { const s = host && host !== window && typeof host.gc500MapShapes1060 === 'function' ? host.gc500MapShapes1060() : null;
    if (s && s.available && s.sig !== SIG) { SNAP = s; SIG = s.sig; CACHE = new Map(); PLAN = new Map(); requestPaint(); } } catch (e) { failed++; }
  }
  /* how far a sheet point is from a reference's outlines (0 inside one) */
  function edgeDist(x, y, s){
   let best = Infinity;
   for (const c of s.comps) { const P = c.poly.map(p => [p[0] * SHEET_W, p[1] * SHEET_H]); let inside = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j];
     if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
     const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)) : 0;
     best = Math.min(best, Math.hypot(a[0] + t * dx - x, a[1] + t * dy - y)); }
    if (inside) return 0; }
   return best;
  }
  /* the shape for an item: one place, its own outline (not shared, not furniture held inside a building), and the marker on it */
  function shapeFor(it){
   if (!SNAP || !it || !it.code) return null;
   const key = it.code + '|' + (Array.isArray(it.places) ? it.places.map(b => b.join(',')).join(';') : '');    /* a pin that arrives or moves is looked at again */
   if (CACHE.has(key)) return CACHE.get(key);
   let s = SNAP.refs[it.code] || null;
   if (s && (s.shared || (it.cat && it.cat.name === 'Furniture') || !Array.isArray(it.places) || it.places.length !== 1)) s = null;
   if (s) { const bb = it.places[0]; if (edgeDist((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, s) > NEAR) { s = null; off++; } }
   if (CACHE.size > 4000) CACHE.clear(); CACHE.set(key, s); return s;
  }
  /* project a reference's parts; small shapes are drawn at least MIN px across, about their middle, turned as they sit */
  function project(sh, M, px){
   const P = f => { const q = toGeo(f[0] * SHEET_W, f[1] * SHEET_H); return applyM(M, q.x, q.y); };
   const parts = sh.comps.map(c => ({c, pts: c.poly.map(P)}));
   let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
   parts.forEach(p => p.pts.forEach(q => { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }));
   const ext = Math.max(x1 - x0, y1 - y0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2, min = MIN * px, k = ext > 0 && ext < min ? min / ext : 1;
   const T = q => k === 1 ? q : {x: mx + (q.x - mx) * k, y: my + (q.y - my) * k};
   parts.forEach(p => { p.pts = p.pts.map(T); p.P = f => T(P(f)); });
   return {parts, box: {x0: mx + (x0 - mx) * k, y0: my + (y0 - my) * k, x1: mx + (x1 - mx) * k, y1: my + (y1 - my) * k}, mx, my};
  }
  const path = (ctx, pts) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); };
  const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); };
  /* the shape's width across its own long side (a door notch or a chamfer does not shrink it) */
  const room = pts => { let L = 0, ux = 1, uy = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], d = Math.hypot(q.x - p.x, q.y - p.y); if (d > L) { L = d; ux = (q.x - p.x) / d; uy = (q.y - p.y) / d; } }
   let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity; for (const q of pts) { const a = q.x * ux + q.y * uy, b = q.y * ux - q.x * uy; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
   return Math.min(a1 - a0, b1 - b0); };
  const area = pts => { let s = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y); return Math.abs(s / 2); };
  const mid = pts => pts.reduce((s, q) => ({x: s.x + q.x / pts.length, y: s.y + q.y / pts.length}), {x: 0, y: 0});
  /* the status glyph inside the shape: the check for complete, the dash for unfinished, the letter for the rest */
  function glyph(ctx, at, size, status){
   const u = size;
   ctx.save(); ctx.translate(at.x, at.y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
   if (status.glyph === 'check' || status.glyph === 'dash') {
    const draw = () => { ctx.beginPath(); if (status.glyph === 'check') { ctx.moveTo(-0.42 * u, 0.02 * u); ctx.lineTo(-0.12 * u, 0.32 * u); ctx.lineTo(0.46 * u, -0.34 * u); } else { ctx.moveTo(-0.38 * u, 0); ctx.lineTo(0.38 * u, 0); } ctx.stroke(); };
    ctx.strokeStyle = '#0b0908'; ctx.lineWidth = Math.max(0.34 * u, 4 * dpr); draw();
    ctx.strokeStyle = status.colour || '#2fd06a'; ctx.lineWidth = Math.max(0.19 * u, 2.2 * dpr); draw();
   } else {
    const fz = Math.max(Math.round(0.8 * u), Math.round(8 * dpr));    /* a letter never smaller than 8 px */
    ctx.font = '800 ' + fz + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.min(Math.max(0.18 * u, 3 * dpr), 0.28 * fz); ctx.strokeStyle = '#0b0908'; ctx.strokeText(String(status.glyph || '?'), 0, 0); ctx.fillStyle = status.colour || '#e0e7ed'; ctx.fillText(String(status.glyph || '?'), 0, 0);
   }
   ctx.restore();
  }
  function paint(v, shaped){
   if (layer.width !== mcanvas.width || layer.height !== mcanvas.height) { layer.width = mcanvas.width; layer.height = mcanvas.height; }
   g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, layer.width, layer.height); paints++; BEAT.sel = null; BEAT.done = [];
   /* the Done chip's double beat restarts when its finished units change (worked out first, so hiding and showing it beats again) */
   const key = doneShaped.map(p => p[0].it.code).sort().join(',');
   if (key !== BEAT.doneKey) { BEAT.doneKey = key; BEAT.doneStart = key ? performance.now() : 0; }
   const sk = selected ? selected.code : ''; if (sk !== BEAT.selKey) { BEAT.selKey = sk; BEAT.selStart = sk ? performance.now() : 0; }    /* a new pick ripples at once */
   if (!shaped.length) { if (layer.style.display !== 'none') layer.style.display = 'none'; drawn = 0; return; }
   if (layer.style.display === 'none') layer.style.display = '';
   const M = sheetToDevice(dpr * v.scale, canvas.width, canvas.height), s = dpr * v.scale, showText = marks.length <= 60 || s > 1.2, moving = typeof interacting !== 'undefined' && !!interacting;
   const camKey = [v.scale.toFixed(6), typeof camera !== 'undefined' ? camera.rot : 0, dpr, typeof mode !== 'undefined' ? mode : ''].join('|');
   shaped.sort((a, b) => (a[0].it === selected) - (b[0].it === selected));
   let n = 0; const later = [];
   for (const [m, sh] of shaped) {    /* first pass: every shape, so no later fill covers another's tick or reference */
    const sel = selected === m.it, col = sel ? '#ff821f' : m.c, status = mapStatus1009(m.it), L = project(sh, M, dpr);
    const b = L.box; if (b.x1 < -60 || b.y1 < -60 || b.x0 > layer.width + 60 || b.y0 > layer.height + 60) continue;
    n++;
    /* the tick and the reference: laid out once per zoom, turn, selection, status and wording, then only moved while the map pans */
    const show = sel || (showText && !m.done), words = status ? status.glyph + status.label + (status.quantity1010 && status.quantity1010.summary || '') + '|' + referenceQuantity1010(m.it, status) : '-';
    const pk = m.it.code + '|' + camKey + '|' + (sel ? 1 : 0) + (show ? 1 : 0) + '|' + words + '|' + Math.round(b.x1 - b.x0) + 'x' + Math.round(b.y1 - b.y0);
    let plan = PLAN.get(pk);
    if (!plan) { plan = planFor(m, L, status, sel, show, s); plan.ax = L.mx; plan.ay = L.my; if (PLAN.size > 3000) PLAN.clear(); PLAN.set(pk, plan); }
    const dx = L.mx - plan.ax, dy = L.my - plan.ay;
    const keep = plan.ticks.map(tk => ({x: tk.x + dx, y: tk.y + dy, r: tk.size * 0.6 + 3 * dpr})), boxes = plan.labels.map(l => ({x: l.box.x + dx - 2 * dpr, y: l.box.y + dy - 2 * dpr, w: l.box.w + 4 * dpr, h: l.box.h + 4 * dpr}));
    const under = pts => pts.some(q => keep.some(k => Math.hypot(q.x - k.x, q.y - k.y) < k.r) || boxes.some(bx => q.x >= bx.x && q.x <= bx.x + bx.w && q.y >= bx.y && q.y <= bx.y + bx.h));
    for (const part of L.parts) {
     const {c, pts, P} = part;
     path(g, pts);
     if (!c.tank && !moving) { g.lineJoin = 'round'; g.strokeStyle = col + (sel ? '4d' : '2e'); g.lineWidth = (sel ? 16 : 10) * dpr; g.stroke(); g.strokeStyle = col + (sel ? '73' : '47'); g.lineWidth = (sel ? 9 : 5.5) * dpr; g.stroke(); }    /* the glow */
     if (c.std) g.setLineDash([4 * dpr, 3 * dpr]);
     g.fillStyle = c.tank ? '#9aa4ad80' : col + (sel ? 'b3' : '66'); g.fill();
     if (sel) { g.strokeStyle = '#1b1009'; g.lineWidth = 6 * dpr; g.stroke(); g.strokeStyle = '#ff9a4d'; g.lineWidth = 2.6 * dpr; g.stroke(); }
     else { g.strokeStyle = '#0b0908'; g.lineWidth = 3.4 * dpr; g.stroke(); g.strokeStyle = c.tank ? '#c9d1d8' : col; g.lineWidth = 1.7 * dpr; g.stroke(); }
     g.setLineDash([]);
     /* the door: the master's swing where it has one; for an FWF the chevron on its edge (its door) */
     const door = (ctx, w) => {
      for (const dr of c.doors) {
       dr.arcs.forEach(a => { if (a.length === 4) { const q = a.map(P); ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); ctx.bezierCurveTo(q[1].x, q[1].y, q[2].x, q[2].y, q[3].x, q[3].y); ctx.stroke(); } else if (a.length > 1) { poly(ctx, a.map(P)); ctx.stroke(); } });    /* the swing is a curve */
       [...dr.leaves, ...dr.landing].forEach(l => { if (l && l.length > 1) { poly(ctx, l.map(P)); ctx.stroke(); } });
       if (!dr.arcs.some(a => a.length > 1) && !dr.leaves.some(l => l.length > 1) && dr.mid && dr.out) { const a = P(dr.mid), e = P([dr.mid[0] + dr.out[0] * 0.002, dr.mid[1] + dr.out[1] * 0.002 * SHEET_W / SHEET_H]); const ux = e.x - a.x, uy = e.y - a.y, l = Math.hypot(ux, uy) || 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + ux / l * 7 * dpr, a.y + uy / l * 7 * dpr); ctx.stroke(); } }
      for (const l of c.chev) if (l.length > 1) { const q = l.map(P); ctx.globalAlpha = under(q) ? 0.3 : 1; poly(ctx, q); ctx.stroke(); ctx.globalAlpha = 1; }    /* a chevron under the tick or the reference fades */
     };
     if (c.doors.length || c.chev.length) { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#0b0908'; g.lineWidth = 3.6 * dpr; door(g); g.strokeStyle = '#ffffff'; g.lineWidth = 1.7 * dpr; door(g); }
     g.lineCap = 'butt'; g.lineJoin = 'miter';
    }
    later.push([plan, L, status, m, dx, dy]);
    if (sel || (m.done && BEAT.done.length < 160)) { const o = {parts: L.parts.filter(p => !p.c.tank).map(p => p.pts), mx: L.mx, my: L.my, r: Math.max(6 * dpr, Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2)}; if (sel) BEAT.sel = o; else BEAT.done.push(o); }
   }
   for (const [plan, L, status, m, dx, dy] of later) drawPlan(plan, L, status, m, dx, dy);    /* second pass: the ticks and references, the selected last */
   drawn = n;
   kick();
  }
  /* glow and pulse (Andrew, 17 Oct 2026: "Glow and pulsate too"): the selected shape ripples outward in its own outline;
     finished units shown by the Done chip beat twice every 3.2 s, like the explorer's own rings. Its own small canvas and
     loop, so the map is not redrawn for it; it stands down while the map is out of sight (another tab, hidden, 3D,
     fencing), is still while the map moves, and with reduced motion or the project's Motion Off. */
  const still = () => document.documentElement.classList.contains('d782still') || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const seen = () => !document.hidden && (typeof shown887 !== 'function' || shown887()) && !fencing() && !(typeof under3d === 'function' && under3d()) && layer.style.display !== 'none';
  function kick(){ if (BEAT.raf || !seen()) return; if (BEAT.sel || (BEAT.done.length && BEAT.doneStart)) { clearTimeout(BEAT.wait); beatLayer.style.display = ''; BEAT.raf = requestAnimationFrame(beat); } }
  function ripple(o, ph, colour, w){
   const k = 1 + 16 * dpr * ph / o.r; bg.save(); bg.globalAlpha = Math.max(0, 1 - ph) * 0.9; bg.lineJoin = 'round'; bg.strokeStyle = colour; bg.lineWidth = w * dpr;
   for (const pts of o.parts) { bg.beginPath(); pts.forEach((q, i) => { const x = o.mx + (q.x - o.mx) * k, y = o.my + (q.y - o.my) * k; if (i) bg.lineTo(x, y); else bg.moveTo(x, y); }); bg.closePath(); bg.stroke(); }
   bg.restore();
  }
  function beat(t){
   BEAT.raf = 0;
   if (beatLayer.width !== layer.width || beatLayer.height !== layer.height) { beatLayer.width = layer.width; beatLayer.height = layer.height; }
   bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, beatLayer.width, beatLayer.height);
   if (!seen()) { beatLayer.style.display = 'none'; return; }    /* the next paint, when the map is back in view, starts it again */
   const quiet = still(), moving = typeof interacting !== 'undefined' && !!interacting;
   if (quiet || moving) { beatLayer.style.display = 'none'; BEAT.wait = setTimeout(kick, quiet ? 1000 : 300); return; }    /* looks again when motion is back or the map stops */
   const c = BEAT.doneStart ? (((t - BEAT.doneStart) % 3200) + 3200) % 3200 : 9999;
   const cs = BEAT.sel && BEAT.selStart ? (((t - BEAT.selStart) % 6400) + 6400) % 6400 : 9999, selOn = cs < 3200;    /* two ripples, then a rest */
   if (selOn) { const ph = (cs % 1600) / 1600; ripple(BEAT.sel, ph, '#ff9a4d', 3); ripple(BEAT.sel, (ph + 0.5) % 1, '#ff821f', 2); }
   const doneOn = BEAT.done.length && c < 1300; if (doneOn) { const ph = (c % 650) / 650; for (const o of BEAT.done) ripple(o, ph, '#4aff9a', 2.4); }
   BEAT.frames++;
   if (selOn || doneOn) { BEAT.raf = requestAnimationFrame(beat); return; }
   beatLayer.style.display = 'none';
   const waits = [BEAT.sel ? 6400 - cs : Infinity, BEAT.done.length && BEAT.doneStart ? 3200 - c : Infinity].filter(Number.isFinite);
   if (waits.length) BEAT.wait = setTimeout(kick, Math.max(16, Math.min(...waits)));    /* rest without drawing */
  }
  /* the tick and the reference inside the shape, along its length, with no second box (Andrew, 17 Oct 2026: "Put the
     reference number inside the box too.. i dont want two boxes shown"). Laid out on the main part (the biggest, nearest the
     item's marker) and the parts touching it. In order: the tick and the reference side by side (the status words under
     it when selected and they fit); a smaller tick; the tick over the reference (a square FWF); the tick alone, the
     reference just under the shape; too small for a tick, the shape takes its status colour and the reference sits on it.
     A tick that fits is never dropped. Coordinates are kept as drawn, then shifted while the map pans. */
  function planFor(m, L, status, sel, show, scale){
   const P = {how: '', fill: false, ticks: [], labels: [], plain: [], tickIn: false, u: 0, along: 0, across: 0, parts: 0, of: 0};
   const solid = L.parts.filter(p => !p.c.tank); if (!solid.length) { P.how = 'shape only'; return P; }
   let main = null, big = 0, near = Infinity;
   const bb = Array.isArray(m.it.places) && m.it.places[0], pm = bb ? L.parts[0].P([(bb[0] + bb[2]) / 2 / SHEET_W, (bb[1] + bb[3]) / 2 / SHEET_H]) : {x: L.mx, y: L.my};
   const sized = solid.map(p => ({p, a: area(p.pts), at: mid(p.pts)}));
   sized.forEach(o => { big = Math.max(big, o.a); });
   sized.forEach(o => { if (o.a >= big * 0.8) { const d = Math.hypot(o.at.x - pm.x, o.at.y - pm.y); if (d < near) { near = d; main = o.p; } } });
   /* touching = the real gap between the outlines (a run of FWFs stays one block; a second, separate block does not) */
   const segD = (q, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy, k = l2 ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / l2)) : 0; return Math.hypot(a.x + k * dx - q.x, a.y + k * dy - q.y); };
   const gapTo = (A, B) => { let d = Infinity; for (const [X, Y] of [[A, B], [B, A]]) for (const q of X) for (let i = 0; i < Y.length; i++) { d = Math.min(d, segD(q, Y[i], Y[(i + 1) % Y.length])); if (d === 0) return 0; } return d; };
   const eps = Math.max(1.5 * dpr, 0.6 * (scale || 1));
   let group = [main];
   if (solid.length > 1) { let grew = true; while (grew) { grew = false; for (const p of solid) if (!group.includes(p) && group.some(o => gapTo(o.pts, p.pts) <= eps)) { group.push(p); grew = true; } } }
   /* the group's own frame: turned to the side giving the smallest box around it (a square reads along one of its edges) */
   const frame = grp => {
    const pts = []; grp.forEach(p => pts.push(...p.pts));
    let mx = 0, my = 0; pts.forEach(q => { mx += q.x / pts.length; my += q.y / pts.length; });
    let th = 0, bestA = Infinity, sq = false;
    for (const p of grp) { const Q = p.pts; for (let i = 0; i < Q.length; i++) { const a = Q[i], c2 = Q[(i + 1) % Q.length], d = Math.hypot(c2.x - a.x, c2.y - a.y); if (d < 1e-6) continue;
     const ex = (c2.x - a.x) / d, ey = (c2.y - a.y) / d; let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
     for (const r of pts) { const u1 = r.x * ex + r.y * ey, v1 = r.y * ex - r.x * ey; a0 = Math.min(a0, u1); a1 = Math.max(a1, u1); b0 = Math.min(b0, v1); b1 = Math.max(b1, v1); }
     const A = (a1 - a0) * (b1 - b0); if (A < bestA - 1e-6) { bestA = A; th = Math.atan2(ey, ex) + ((b1 - b0) > (a1 - a0) ? Math.PI / 2 : 0); sq = Math.abs((a1 - a0) - (b1 - b0)) < 0.06 * Math.max(a1 - a0, b1 - b0); } } }
    const norm = a => { while (a > Math.PI / 2) a -= Math.PI; while (a <= -Math.PI / 2) a += Math.PI; return a; };
    th = norm(th); if (sq) { const o = norm(th + Math.PI / 2); if (Math.abs(o) < Math.abs(th)) th = o; }    /* a square: whichever side reads closer to level */
    const ux = Math.cos(th), uy = Math.sin(th); let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    pts.forEach(q => { const a = (q.x - mx) * ux + (q.y - my) * uy, b = (q.y - my) * ux - (q.x - mx) * uy; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); });
    const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
    return {th, along: (a1 - a0) * 0.9, across: (b1 - b0) * 0.86, at: (a, b) => ({x: mx + (ca + a) * ux - (cb + b) * uy, y: my + (ca + a) * uy + (cb + b) * ux})};
   };
   const inGroup = q => group.some(part => inside(q.x, q.y, part.pts));
   let F = frame(group);
   if (group.length > 1 && !inGroup(F.at(0, 0))) { group = [main]; F = frame(group); }    /* the group's middle is open ground: lay out on the main part */
   const {th, along, across, at} = F;
   const q = status && status.quantity1010;
   const u = status && across >= 11 * dpr ? Math.min(Math.max(across * 0.62, 9 * dpr), 24 * dpr) : 0, gap = Math.max(4 * dpr, 0.25 * u);
   const f = Math.round(Math.min(Math.max(across * 0.36, 10 * dpr), 14 * dpr)), f2 = Math.round(Math.max(f * 0.78, 9 * dpr));
   const font = px => '800 ' + px + 'px Inter,sans-serif', W = (px, t2) => { g.font = font(px); return textWidth887(g, t2); };
   const space = Math.max(0, along - (u ? u + gap : 0));
   const ref = show ? fitReference1010(m.it, status, space, t2 => W(f, t2)) : '';
   const sub = sel && status ? status.label.toUpperCase() + (q && q.summary ? ' · ' + q.summary : '') : '';
   const tw = ref ? W(f, ref) : 0, sw2 = sub ? W(f2, sub) : 0;
   const lab = (lines, x0, b0) => {
    let wmax = 0; lines.forEach(l => { wmax = Math.max(wmax, W(l[1], l[0])); });
    const h = lines.reduce((s2, l) => s2 + l[1], 0) + (lines.length - 1) * 2 * dpr, c0 = at(0, b0);
    const cs = [at(x0, b0 - h / 2), at(x0 + wmax, b0 - h / 2), at(x0, b0 + h / 2), at(x0 + wmax, b0 + h / 2)], xs = cs.map(c => c.x), ys = cs.map(c => c.y);
    P.labels.push({lines, cx: c0.x, cy: c0.y, th, x0, h, level: Math.abs(Math.sin(th)) < 0.02, box: {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}});
   };
   const tick = (pt, size) => { P.ticks.push({x: pt.x, y: pt.y, size}); P.tickIn = inGroup(pt); };
   const done = how => { P.how = how; P.u = Math.round(u); P.along = Math.round(along); P.across = Math.round(across); P.parts = group.length; P.of = solid.length; return P; };
   /* the whole tick (its strokes and halo, drawn upright) and the whole label must sit inside the group, not just their middles */
   const tickFits = (tp, us) => { const r = Math.max(0.34 * us, 4 * dpr) / 2; return [[-0.42, 0.02], [-0.12, 0.32], [0.46, -0.34], [0.17, -0.01]].every(([a, b2]) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([ox, oy]) => inGroup({x: tp.x + a * us + ox, y: tp.y + b2 * us + oy}))); };
   const labFits = (x0, b0, w, h) => [0, 0.25, 0.5, 0.75, 1].every(k => [-0.5, 0.5].every(j2 => inGroup(at(x0 + w * k, b0 + h * j2))));
   /* how much further the upright tick's long arm reaches along a turned shape, so it never runs into the first letter */
   const reach = us => us * Math.max(0, 0.46 * Math.cos(th) - 0.34 * Math.sin(th) - 0.46);
   const code = String(m.it.code || ''), fs = Math.round(Math.max(8 * dpr, Math.min(f, across * 0.9)));
   /* 1: side by side */
   const lines = [];
   if (ref) lines.push([ref, f, '#ffffff']);
   const withSub = sub && Math.max(tw, sw2) <= space && f + f2 + 2 * dpr <= across;
   if (withSub) lines.push([sub, f2, status.colour || '#e0e7ed']);
   const textW = withSub ? Math.max(tw, sw2) : tw, textH = withSub ? f + f2 + 2 * dpr : (ref ? f : 0);
   if (u) { const rc = ref ? reach(u) : 0, total = u + (ref ? gap + rc : 0) + textW, x0 = -total / 2, tp = at(x0 + u / 2, 0);
    if (total <= along && Math.max(u, textH) <= across && (!ref || tw <= space) && tickFits(tp, u) && (!lines.length || labFits(x0 + u + gap + rc, 0, textW, textH))) { tick(tp, u); if (lines.length) lab(lines, x0 + u + gap + rc, 0); return done(ref ? 'tick and reference' : 'tick'); } }
   /* the tick over the reference (a square FWF), the font stepping down; worked out first so a bigger stacked tick wins */
   let st = null;
   if (u && show) for (let fz = fs; fz >= 8 * dpr; fz -= dpr) { const cz = W(fz, code), us = Math.min(u, across - 2 * dpr - fz); if (cz <= along && us >= 7 * dpr) { const h = us + 2 * dpr + fz, tp = at(0, -h / 2 + us / 2); if (tickFits(tp, us) && labFits(-cz / 2, h / 2 - fz / 2, cz, fz)) st = {fz, cz, us, h, tp}; break; } }
   /* 2: a smaller tick beside the reference, the font stepping down, when its tick is at least as big as the stacked one */
   if (u && show) { const gs = Math.max(3 * dpr, 0.25 * u);
    for (let fz = fs; fz >= 8 * dpr; fz -= dpr) { const cz = W(fz, code), us0 = Math.min(u, along - gs - cz), us = us0 - reach(us0);
     if (us >= 7 * dpr && Math.max(us, fz) <= across) { const rc = reach(us), total = us + gs + rc + cz, x0 = -total / 2, tp = at(x0 + us / 2, 0);
      if ((!st || us >= st.us) && tickFits(tp, us) && labFits(x0 + us + gs + rc, 0, cz, fz)) { tick(tp, us); lab([[code, fz, '#ffffff']], x0 + us + gs + rc, 0); return done('small tick and reference'); } break; } } }
   /* 3: the tick over the reference */
   if (st) { tick(st.tp, st.us); lab([[code, st.fz, '#ffffff']], -st.cz / 2, st.h / 2 - st.fz / 2); return done('tick over reference'); }
   /* the reference only ever inside its own shape; the selected one, when it cannot fit, as plain text just under it (drawn last, no tap box) */
   const under = () => { if (sel) { const px = fs; P.plain.push({text: code, x: L.mx, y: L.box.y1 + 3 * dpr, px, w: W(px, code), base: 'top'}); } };
   /* 4: the tick alone */
   if (u && tickFits(at(0, 0), u)) { tick(at(0, 0), u); under(); return done(sel ? 'tick, reference under it' : 'tick'); }
   /* 5: too small for a tick: the status colour, the reference on it when it fits inside */
   if (status) P.fill = true;
   if (show) {
    for (let fz = fs; fz >= 8 * dpr; fz -= dpr) { const cz = W(fz, code); if (cz <= along && fz <= across * 1.2 && labFits(-cz / 2, 0, cz, fz)) { lab([[code, fz, '#ffffff']], -cz / 2, 0); return done(status ? 'status colour and reference' : 'reference'); } }
    under(); return done(status ? (sel ? 'status colour, reference under it' : 'status colour') : (sel ? 'reference under it' : 'shape only'));
   }
   return done(status ? 'status colour' : 'shape only');
  }
  function drawPlan(P, L, status, m, dx, dy){
   if (P.fill && status) L.parts.forEach(p => { if (p.c.tank) return; path(g, p.pts); g.fillStyle = (status.colour || '#2fd06a') + 'd9'; g.fill(); g.strokeStyle = '#0b0908'; g.lineWidth = 1.4 * dpr; g.stroke(); });
   for (const tk of P.ticks) glyph(g, {x: tk.x + dx, y: tk.y + dy}, tk.size, status);
   const font = px => '800 ' + px + 'px Inter,sans-serif';
   for (const l of P.labels) {
    g.save(); g.translate(l.cx + dx, l.cy + dy); g.rotate(l.th); g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    let y = -l.h / 2;
    for (const [tx, px, colour] of l.lines) { g.font = font(px); y += px / 2; g.lineWidth = P.fill ? 1.2 * dpr : Math.max(3 * dpr, px * 0.28); g.strokeStyle = '#0b0908'; g.strokeText(tx, l.x0, y); g.fillStyle = colour; g.fillText(tx, l.x0, y); y += px / 2 + 2 * dpr; }
    g.restore();
    if (l.level) labelBounds1010.push({it: m.it, x: (l.box.x + dx) / dpr, y: (l.box.y + dy) / dpr, w: l.box.w / dpr, h: l.box.h / dpr});    /* a turned label is tapped through its shape */
   }
   for (const tx of P.plain) {
    g.save(); g.font = font(tx.px); g.textAlign = 'center'; g.textBaseline = tx.base; g.lineJoin = 'round'; g.lineWidth = 3.2 * dpr; g.strokeStyle = '#0b0908'; g.strokeText(tx.text, tx.x + dx, tx.y + dy); g.fillStyle = '#ffffff'; g.fillText(tx.text, tx.x + dx, tx.y + dy); g.restore();    /* the selected reference under its shape: no tap box over a neighbour */
   }
   const t0 = P.ticks[0];
   LAYOUT.set(m.it.code, {how: P.how, u: P.u, along: P.along, across: P.across, parts: P.parts, of: P.of, tick: t0 ? {x: (t0.x + dx) / dpr, y: (t0.y + dy) / dpr, size: t0.size / dpr, inPart: P.tickIn} : null});
  }
  /* the explorer's finished-units layer draws its own tick at each finished unit: a shaped one is drawn here instead */
  window.done782List = function(){ if (frameDn) return frameDn; const dn = nativeDone(); return fencing() || !SNAP ? dn : dn.filter(it => !shapeFor(it)); };
  window.drawMarks = function(v){
   if (fencing() || !SNAP) { doneShaped = []; try { paint(v, []); } catch (e) { failed++; } return nativeDraw(v); }
   const all = marks, shaped = [], rest = [], codes = new Set();
   for (const m of all) { codes.add(m.it.code); const sh = shapeFor(m.it); if (sh) shaped.push([m, sh]); else rest.push(m); }
   const dn = nativeDone(), dnRest = []; doneShaped = [];
   for (const it of dn) { const sh = shapeFor(it); if (!sh) dnRest.push(it); else if (!codes.has(it.code)) doneShaped.push([{it, c: it.cat && it.cat.c || '#2bd46b', done: true}, sh]); }
   kept = rest.length;
   marks = rest; frameDn = dnRest; hideText = !(all.length <= 60 || dpr * v.scale > 1.2);    /* the kept circles' references follow the whole chip's rule */
   try { nativeDraw(v); } finally { marks = all; frameDn = null; hideText = false; }
   try { paint(v, doneShaped.concat(shaped)); } catch (e) { failed++; lastErr = String(e && e.message || e).slice(0, 160); }
  };
  window.drawMarks.__shape1060 = true;
  /* a reference with no traced shape keeps its marker, with the status inside it rather than beside it */
  window.tick897 = function(ctx, x, y, r, it){
   if (fencing()) return nativeTick(ctx, x, y, r, it);
   const st = mapStatus1009(it); if (!st) return;
   const k = Math.min(1, r * 0.8 / (17.5 * dpr)); ctx.save(); ctx.translate(x, y); ctx.scale(k, k); badge1009(ctx, 0, 0, st); ctx.restore();
  };
  /* a kept circle's reference: plain text under it, no box (one shape, not two boxes) */
  window.label1009 = function(ctx, it, c, r, sel, colour){
   if (fencing()) return nativeLabel.apply(this, arguments);
   if (hideText && !sel) return;
   const st = mapStatus1009(it), q = sel && st && st.quantity1010, f = Math.round(12 * dpr), f2 = Math.round(10 * dpr);
   ctx.save(); ctx.font = '800 ' + f + 'px Inter,sans-serif';
   const ref = fitReference1010(it, st, Math.min(300 * dpr, canvas.width - 8 * dpr), t => textWidth887(ctx, t)), w = textWidth887(ctx, ref);
   const sub = sel && st ? st.label.toUpperCase() + (q && q.summary ? ' · ' + q.summary : '') : '';
   ctx.font = '800 ' + f2 + 'px Inter,sans-serif'; const w2 = sub ? textWidth887(ctx, sub) : 0, wm = Math.max(w, w2), h = f + (sub ? f2 + 2 * dpr : 0);
   const x = Math.min(Math.max(4 * dpr + wm / 2, c.x), canvas.width - 4 * dpr - wm / 2), y = Math.min(c.y + r + 4 * dpr, canvas.height - h - 4 * dpr);
   ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
   const put = (t, px, yy, fill) => { ctx.font = '800 ' + px + 'px Inter,sans-serif'; ctx.lineWidth = Math.max(3 * dpr, px * 0.28); ctx.strokeStyle = '#0b0908'; ctx.strokeText(t, x, yy); ctx.fillStyle = fill; ctx.fillText(t, x, yy); };
   put(ref, f, y, sel ? '#ffd2b0' : '#ffffff'); if (sub) put(sub, f2, y + f + 2 * dpr, st.colour || '#e0e7ed');
   ctx.restore();
   labelBounds1010.push({it, x: (x - wm / 2) / dpr, y: y / dpr, w: wm / dpr, h: h / dpr});
  };
  /* tapping inside a shape (CSS pixels, the explorer's own camera) */
  function inside(x, y, pts){ let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
  function hit(x, y, list){
   const v = currentView(), M = sheetToDevice(v.scale, sw, sh); let best = null;
   for (const m of list) { const s = shapeFor(m.it); if (!s) continue; const L = project(s, M, 1);
    for (const p of L.parts) if (inside(x, y, p.pts)) { const d = Math.hypot(L.mx - x, L.my - y), top = m.it === selected; if (!best || (top && !best.top) || (top === best.top && d < best.d)) best = {m, d, top}; } }
   return best && best.m;
  }
  window.markAt = function(x, y){    /* what is drawn on top wins: a kept circle or its text, then the selected shape, then a shape's own reference, then the shapes */
   if (fencing() || !SNAP) return nativeMarkAt(x, y);
   const all = marks, lb = labelBounds1010; let k = null;
   marks = all.filter(m => !shapeFor(m.it)); labelBounds1010 = lb.filter(b => !b.it || !shapeFor(b.it));
   try { k = nativeMarkAt(x, y); } finally { marks = all; labelBounds1010 = lb; }
   if (k) return k;
   const top = selected && shapeFor(selected) ? hit(x, y, [{it: selected, c: selected.cat ? selected.cat.c : '#fff'}]) : null;
   return top || labelHit1010(x, y) || hit(x, y, all);
  };
  window.itemAt887 = function(x, y){ if (fencing() || !SNAP) return nativeItemAt(x, y); const m = hit(x, y, marks) || hit(x, y, doneShaped.map(p => p[0]));    /* only shapes drawn now; otherwise the explorer's own pick */ return m ? {it: m.it, c: m.it.cat ? m.it.cat.c : m.c} : nativeItemAt(x, y); };
  window.GC500Shape1060 = Object.freeze({version: 'v10.60', pull,
   get state(){ return {available: !!SNAP, refs: SNAP ? SNAP.counts.refs : 0, drawn, kept, done: doneShaped.length, off, failed, lastErr, paints, beat: {selected: !!BEAT.sel, frames: BEAT.frames, still: still(), running: !!BEAT.raf}, wrapped: !!window.drawMarks.__shape1060}; },
   shaped: () => marks.filter(m => shapeFor(m.it)).map(m => m.it.code),
   done: () => doneShaped.map(p => p[0].it.code),
   layout: code => LAYOUT.get(code) || null,
   /* where a reference's shape sits now, in CSS pixels (for a check that taps it) */
   at: code => { const it = (Array.isArray(ITEMS) ? ITEMS : []).find(x => x.code === code), s = it && shapeFor(it); if (!s) return null; const v = currentView(), L = project(s, sheetToDevice(v.scale, sw, sh), 1); return {x: L.mx, y: L.my, box: L.box}; }});
  pull();
  setInterval(() => { if (!document.hidden) pull(); }, 10000);
  requestPaint();
 }

 const FRAME_JS = '/* Author: Andrew Fisher. v10.60 - Map explorer shapes (injected by the page). */\n(' + frameMain.toString() + ')();';
 function mount(frame){
  try {
   const doc = frame && frame.contentDocument, win = frame && frame.contentWindow;
   if (!doc || !win || !doc.head || doc.readyState !== 'complete') return false;
   const url = new URL(doc.URL, location.href);
   if (url.origin !== location.origin || !/\/explorer\/index\.html$/.test(url.pathname)) return false;
   if ([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join('|') !== EXPLORER_BUILD) return false;     /* a different explorer build: stand down */
   if (!doc.getElementById('stage') || !doc.getElementById('marks') || typeof win.drawMarks !== 'function') return false;
   if (win.GC500Shape1060) return true;
   const s = doc.createElement('script'); s.id = 'shape1060-script'; s.textContent = FRAME_JS; doc.head.appendChild(s);
   return !!win.GC500Shape1060;
  } catch (e) { return false; }
 }
 W.gc500ShapeLayer1060 = Object.freeze({version: 'v10.60', mount, frameScript: () => FRAME_JS});
 /* a frame already loaded before this script ran */
 try { const f = document.getElementById('expFrame'); if (f && f.contentDocument && f.contentDocument.readyState === 'complete') mount(f); } catch (e) {}
})(window);
'''

PATCHES = [
    ('map shapes: the page function and the frame layer', END, '</script>\n<script id="shapes1060-script">' + JS + '</script>\n</body>\n</html>'),
    ('map shapes: mount on each explorer frame load', LOAD_OLD, LOAD_NEW),
    ('Release footer', "+ ' · v10.59'", "+ ' · v10.60'"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'shapes1060-script' in t: sys.exit('patch_v1060 refuses a repeat')
    if 'arrivedon1059-script' not in t or "+ ' · v10.59'" not in t: sys.exit('patch_v1060 needs the v10.59 page')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1060 applied: Map explorer references drawn as their own shapes with doors and the tick inside; footer v10.59 -> v10.60')
