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
- The reference label stays (and still opens the card); the selected reference is outlined in orange.
- Tapping inside a shape selects it.
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
 const EXPLORER_BUILD = 'explorer.js?v=8586cb7d5008';
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
    const out = [];
    s.components.forEach(c => {
     if (!c || c.drawn_as || !Array.isArray(c.poly) || c.poly.length < 3) return;
     const poly = c.poly.map(pt).filter(Boolean); if (poly.length < 3) return;
     const tank = c.kind === 'waste_tank' || c.source === 'under_block' || !!c.under;
     const ds = (Array.isArray(c.doors) && c.doors.length ? c.doors : c.door ? [c.door] : []).map(d => {
      const sw = d && d.swing || {};
      return {mid: pt(d && d.mid), out: pt(d && d.outward), arcs: (sw.arcs || (sw.arc ? [sw.arc] : [])).map(line), leaves: (sw.leaves || (sw.leaf ? [sw.leaf] : [])).map(line), landing: line(sw.landing)};
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
  const need = ['drawMarks', 'markAt', 'itemAt887', 'done782List', 'tick897', 'badge1009', 'sheetToDevice', 'applyM', 'toGeo', 'currentView', 'mapStatus1009', 'label1009', 'requestPaint'];
  if (need.some(n => typeof window[n] !== 'function')) return;
  const host = window.parent, stageEl = document.getElementById('stage'), native = document.getElementById('marks');
  if (!stageEl || !native) return;
  let SNAP = null, SIG = '', CACHE = new Map(), drawn = 0, kept = 0, off = 0, failed = 0, frameDn = null, doneShaped = [];
  const nativeDraw = window.drawMarks, nativeMarkAt = window.markAt, nativeItemAt = window.itemAt887, nativeDone = window.done782List, nativeTick = window.tick897;
  const fencing = () => !!(window.GC500FencingMap && window.GC500FencingMap.active);
  const layer = document.createElement('canvas'); layer.id = 'shape1060'; layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  native.parentNode.insertBefore(layer, native);
  const css = document.createElement('style'); css.id = 'shape1060-style'; css.textContent = 'body.in3d #shape1060{visibility:hidden}body.fencing-map #shape1060{display:none!important}'; document.head.appendChild(css);
  const g = layer.getContext('2d');
  const MIN = 12, NEAR = 6;    /* px: the smallest a shape is drawn; sheet points (about 4 m): how far the marker may sit outside the shape */
  function pull(){
   try { const s = host && host !== window && typeof host.gc500MapShapes1060 === 'function' ? host.gc500MapShapes1060() : null;
    if (s && s.available && s.sig !== SIG) { SNAP = s; SIG = s.sig; CACHE = new Map(); requestPaint(); } } catch (e) { failed++; }
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
    ctx.font = '800 ' + Math.round(0.8 * u) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(0.18 * u, 3 * dpr); ctx.strokeStyle = '#0b0908'; ctx.strokeText(String(status.glyph || '?'), 0, 0); ctx.fillStyle = status.colour || '#e0e7ed'; ctx.fillText(String(status.glyph || '?'), 0, 0);
   }
   ctx.restore();
  }
  function paint(v, shaped){
   if (layer.width !== mcanvas.width || layer.height !== mcanvas.height) { layer.width = mcanvas.width; layer.height = mcanvas.height; }
   g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, layer.width, layer.height);
   if (!shaped.length) { if (layer.style.display !== 'none') layer.style.display = 'none'; drawn = 0; return; }
   if (layer.style.display === 'none') layer.style.display = '';
   const M = sheetToDevice(dpr * v.scale, canvas.width, canvas.height), s = dpr * v.scale, showText = marks.length <= 60 || s > 1.2;
   shaped.sort((a, b) => (a[0].it === selected) - (b[0].it === selected));
   let n = 0;
   for (const [m, sh] of shaped) {
    const sel = selected === m.it, col = sel ? '#ff821f' : m.c, status = mapStatus1009(m.it), L = project(sh, M, dpr);
    const b = L.box; if (b.x1 < -60 || b.y1 < -60 || b.x0 > layer.width + 60 || b.y0 > layer.height + 60) continue;
    n++;
    /* the status goes once, in the reference's main part (not the tank under it); on a run of like units, the one nearest the middle */
    let main = null, big = 0, near = Infinity;
    const sized = L.parts.filter(p => !p.c.tank).map(p => ({p, a: area(p.pts), at: mid(p.pts)}));
    sized.forEach(o => { big = Math.max(big, o.a); });
    sized.forEach(o => { if (o.a >= big * 0.8) { const d = Math.hypot(o.at.x - L.mx, o.at.y - L.my); if (d < near) { near = d; main = o.p; } } });
    for (const part of L.parts) {
     const {c, pts, P} = part;
     g.save();
     if (c.std) g.setLineDash([4 * dpr, 3 * dpr]);
     path(g, pts); g.fillStyle = c.tank ? '#9aa4ad80' : col + (sel ? 'b3' : '66'); g.fill();
     if (sel) { g.strokeStyle = '#1b1009'; g.lineWidth = 6 * dpr; g.stroke(); g.strokeStyle = '#ff9a4d'; g.lineWidth = 2.6 * dpr; g.stroke(); }
     else { g.strokeStyle = '#0b0908'; g.lineWidth = 3.4 * dpr; g.stroke(); g.strokeStyle = c.tank ? '#c9d1d8' : col; g.lineWidth = 1.7 * dpr; g.stroke(); }
     g.setLineDash([]);
     /* the door: the master's swing where it has one; for an FWF the chevron on its edge (its door) */
     const door = (ctx, w) => {
      for (const dr of c.doors) { [...dr.arcs, ...dr.leaves, dr.landing].forEach(l => { if (l && l.length > 1) { poly(ctx, l.map(P)); ctx.stroke(); } });
       if (!dr.arcs.length && !dr.leaves.length && dr.mid && dr.out) { const a = P(dr.mid), e = P([dr.mid[0] + dr.out[0] * 0.002, dr.mid[1] + dr.out[1] * 0.002 * SHEET_W / SHEET_H]); const ux = e.x - a.x, uy = e.y - a.y, l = Math.hypot(ux, uy) || 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + ux / l * 7 * dpr, a.y + uy / l * 7 * dpr); ctx.stroke(); } }
      for (const l of c.chev) if (l.length > 1) { poly(ctx, l.map(P)); ctx.stroke(); }
     };
     if (c.doors.length || c.chev.length) { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#0b0908'; g.lineWidth = 3.6 * dpr; door(g); g.strokeStyle = '#ffffff'; g.lineWidth = 1.7 * dpr; door(g); }
     /* the status, inside the shape */
     if (status && part === main) {
      const at = c.centroid ? P(c.centroid) : mid(pts), w = room(pts);
      if (w >= 11 * dpr) glyph(g, at, Math.min(Math.max(w * 0.62, 9 * dpr), 24 * dpr), status);
      else { path(g, pts); g.fillStyle = status.colour || '#2fd06a'; g.fill(); g.strokeStyle = '#0b0908'; g.lineWidth = 1.4 * dpr; g.stroke(); }
     }
     g.restore();
    }
    /* the label beside the shape's middle, kept close even on a long barrier run */
    if (sel || (showText && !m.done)) { const r = Math.min(Math.max(10 * dpr, Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2), 36 * dpr); label1009(g, m.it, {x: L.mx, y: L.my}, r, sel, m.c); }
   }
   drawn = n;
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
   marks = rest; frameDn = dnRest;
   try { nativeDraw(v); } finally { marks = all; frameDn = null; }
   try { paint(v, doneShaped.concat(shaped)); } catch (e) { failed++; }
  };
  window.drawMarks.__shape1060 = true;
  /* a reference with no traced shape keeps its marker, with the status inside it rather than beside it */
  window.tick897 = function(ctx, x, y, r, it){
   if (fencing()) return nativeTick(ctx, x, y, r, it);
   const st = mapStatus1009(it); if (!st) return;
   const k = Math.min(1, r * 0.8 / (17.5 * dpr)); ctx.save(); ctx.translate(x, y); ctx.scale(k, k); badge1009(ctx, 0, 0, st); ctx.restore();
  };
  /* tapping inside a shape (CSS pixels, the explorer's own camera) */
  function inside(x, y, pts){ let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
  function hit(x, y, list){
   const v = currentView(), M = sheetToDevice(v.scale, sw, sh); let best = null;
   for (const m of list) { const s = shapeFor(m.it); if (!s) continue; const L = project(s, M, 1);
    for (const p of L.parts) if (inside(x, y, p.pts)) { const d = Math.hypot(L.mx - x, L.my - y); if (!best || m.it === selected || d < best.d) best = {m, d}; } }
   return best && best.m;
  }
  const shapedItems = () => (Array.isArray(ITEMS) ? ITEMS : []).filter(it => it.cat && shapeFor(it)).map(it => ({it, c: it.cat.c}));
  window.markAt = function(x, y){ if (fencing() || !SNAP) return nativeMarkAt(x, y); return hit(x, y, marks) || nativeMarkAt(x, y); };
  window.itemAt887 = function(x, y){ if (fencing() || !SNAP) return nativeItemAt(x, y); const m = hit(x, y, marks) || hit(x, y, shapedItems()); return m ? {it: m.it, c: m.it.cat ? m.it.cat.c : m.c} : nativeItemAt(x, y); };
  window.GC500Shape1060 = Object.freeze({version: 'v10.60', pull,
   get state(){ return {available: !!SNAP, refs: SNAP ? SNAP.counts.refs : 0, drawn, kept, done: doneShaped.length, off, failed, wrapped: !!window.drawMarks.__shape1060}; },
   shaped: () => marks.filter(m => shapeFor(m.it)).map(m => m.it.code),
   done: () => doneShaped.map(p => p[0].it.code),
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
   if (!doc.querySelector('script[src="' + EXPLORER_BUILD + '"]')) return false;     /* a different explorer build: stand down */
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
