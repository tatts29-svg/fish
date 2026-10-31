/* Author: Andrew Fisher. The closure lines on the 2026 plan (v11.36, refined in v11.38, the imagery origin fixed in v11.39): the lines highlighted on the marked
   plan, drawn as clean neon lines along the footpath on the side of the road the pen marked, 2 pt off the kerb onto the
   footpath, on the 2026 master layout (D001-26003-03) or on satellite imagery through the explorer's georeferencing. Each
   colour runs unbroken until the next colour starts; where the pen crosses the road the line crosses with it (pink at
   Gate 7). No numbers. Zooms to 16000% on the explorer's own tiles. Shown on the Fence closures tab. */
(function (W) {
'use strict';
const SHEET = '/w/Coates-GC500-2026/explorer/assets/sheet-overview.webp';
const LINES = %LINES_JSON%;
const TILES = %TILES_JSON%;
const GEO = %GEO_JSON%;
const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';
const SW = 2384, SH = 1684, MAXZ = 160;   /* sheet pt; 16000% */
/* v11.39: the imagery is laid out from a local origin (the main plan's top-left corner in z18 px) - the browser draws SVG in
   single precision, and tiles placed at their world coordinates (about 1.2e8 px) landed millions of pixels off screen */
const NEON = {pink: {glow: '#ff2d95', core: '#ffe3f1'}, teal: {glow: '#00e0cf', core: '#defffc'}, orange: {glow: '#ff8a00', core: '#fff0d6'}};
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let view = null;   /* {cx, cy, w} in sheet pt; null = fit */
let base = 'plan';   /* plan | sat */
const cache = {}; let busy = 0; const queue = []; let timer = null;
function el(){ return document.querySelector('#pane-fenceclose .c1136-svg'); }
function fitW(svg){ return SW; }
function aspect(svg){ return svg && svg.clientWidth ? svg.clientHeight / svg.clientWidth : SH / SW; }
function box(svg){ const v = view || {cx: SW / 2, cy: SH / 2, w: SW}; const h = v.w * aspect(svg); return {x: v.cx - v.w / 2, y: v.cy - h / 2, w: v.w, h: h}; }
function pct(svg){ return Math.round(fitW(svg) / (view ? view.w : SW) * 100); }
function setView(cx, cy, w, svg){
 w = Math.max(SW / MAXZ, Math.min(SW, w)); const h = w * aspect(svg);
 cx = Math.max(w / 2, Math.min(SW - w / 2, cx)); cy = Math.max(Math.min(h / 2, SH / 2), Math.min(Math.max(SH - h / 2, SH / 2), cy));
 view = (w >= SW) ? null : {cx: cx, cy: cy, w: w};
}
function apply(svg){
 svg = svg || el(); if (!svg) return;
 const b = box(svg); svg.setAttribute('viewBox', [b.x, b.y, b.w, b.h].map(n => Math.round(n * 1000) / 1000).join(' '));
 const p = document.querySelector('#pane-fenceclose [data-c1136-pct]'); if (p) p.textContent = pct(svg) + '%';
 if (timer) clearTimeout(timer); timer = setTimeout(() => place(svg), 150);
}
function level(svg){ const b = box(svg); const pxPerPt = (svg.clientWidth || 360) * (window.devicePixelRatio || 1) / b.w; return Math.max(0, Math.min(3, Math.round(Math.log(pxPerPt) / Math.LN2))); }
function wanted(svg){
 const b = box(svg), L = level(svg), lv = TILES.levels.filter(l => l.L === L)[0]; if (!lv) return [];
 const span = TILES.tile / lv.scale, out = [];
 const x0 = Math.max(0, Math.floor(b.x / span)), x1 = Math.min(lv.nx - 1, Math.floor((b.x + b.w) / span)), y0 = Math.max(0, Math.floor(b.y / span)), y1 = Math.min(lv.ny - 1, Math.floor((b.y + b.h) / span));
 for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const k = tx + '_' + ty, e = lv.tiles[k]; if (e) out.push({key: L + '/' + k, L: L, file: lv.file, off: e[0], len: e[1], x: tx * span, y: ty * span, span: span}); }
 return out;
}
function pump(){
 while (busy < 4 && queue.length) {
  const t = queue.shift(); busy++;
  fetch(TILES.base + t.file, {headers: {Range: 'bytes=' + t.off + '-' + (t.off + t.len - 1)}, credentials: 'same-origin'})
   .then(r => { if (r.status !== 206 && r.status !== 200) throw new Error('tile ' + r.status); return r.arrayBuffer(); })
   .then(buf => { if (buf.byteLength !== t.len) throw new Error('tile short'); cache[t.key] = URL.createObjectURL(new Blob([buf], {type: 'image/webp'})); busy--; place(); pump(); })
   .catch(() => { delete cache[t.key]; busy--; pump(); });
 }
}
/* satellite: Esri World Imagery through the explorer's georeferencing (sheet pt -> Web Mercator z18 px, 512 px tiles);
   an Esri tile at zoom z covers 256 / 2^(z - 19) of those px */
function satZoom(svg){ const b = box(svg); const pxPerZ18 = (svg.clientWidth || 360) * (window.devicePixelRatio || 1) / (b.w * GEO.px_per_pt); return Math.max(15, Math.min(21, 19 + Math.round(Math.log(pxPerZ18) / Math.LN2))); }
function toZ18(x, y){ const A = GEO.A; return [A[0][0] * x + A[0][1] * y + A[0][2], A[1][0] * x + A[1][1] * y + A[1][2]]; }
const SO = (() => { const o = toZ18(GEO.main[0], GEO.main[1]); return [Math.floor(o[0]), Math.floor(o[1])]; })();
function satTiles(svg){
 const b = box(svg), z = satZoom(svg), span = 256 / Math.pow(2, z - 19);
 const cs = [toZ18(b.x, b.y), toZ18(b.x + b.w, b.y), toZ18(b.x, b.y + b.h), toZ18(b.x + b.w, b.y + b.h)];
 const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
 const x0 = Math.floor(Math.min(...xs) / span), x1 = Math.floor(Math.max(...xs) / span), y0 = Math.floor(Math.min(...ys) / span), y1 = Math.floor(Math.max(...ys) / span), out = [];
 if ((x1 - x0 + 1) * (y1 - y0 + 1) > 120) return {z: z, tiles: out};   /* too wide a view for this zoom: the view is clamped by zoom choice, this is a guard */
 for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) out.push({z: z, tx: tx, ty: ty, x: tx * span - SO[0], y: ty * span - SO[1], span: span, url: SAT + z + '/' + ty + '/' + tx});
 return {z: z, tiles: out};
}
function place(svg){
 svg = svg || el(); if (!svg) return;
 const g = svg.querySelector('g.tiles'), gs = svg.querySelector('g.satw');
 if (base === 'sat') {
  if (g) g.innerHTML = '';
  if (gs) { const t = satTiles(svg); gs.setAttribute('data-z', t.z); gs.innerHTML = t.tiles.map(t => '<image href="' + t.url + '" x="' + t.x + '" y="' + t.y + '" width="' + t.span + '" height="' + t.span + '" preserveAspectRatio="none"/>').join(''); }
  return;
 }
 if (gs) gs.innerHTML = '';
 if (!g) return; let h = '';
 wanted(svg).forEach(t => { const u = cache[t.key]; if (u) h += '<image href="' + u + '" x="' + t.x + '" y="' + t.y + '" width="' + t.span + '" height="' + t.span + '" preserveAspectRatio="none"/>'; else if (u === undefined && navigator.onLine !== false) { cache[t.key] = null; queue.push(t); } });
 g.innerHTML = h; pump();
}
function setBase(b){
 base = b === 'sat' ? 'sat' : 'plan'; const svg = el(); if (!svg) return;
 svg.classList.toggle('sat', base === 'sat');
 document.querySelectorAll('#pane-fenceclose [data-c1136-base]').forEach(x => x.classList.toggle('primary', x.dataset.c1136Base === base));
 const cr = document.querySelector('#pane-fenceclose .c1136-credit'); if (cr) cr.hidden = base !== 'sat';
 place(svg);
}
function pathsHtml(){
 return LINES.lines.map((l, i) => { const d = l.pts.map((p, j) => (j ? 'L' : 'M') + p[0] + ' ' + p[1]).join(''); const c = NEON[l.colour] || NEON.pink;
  return `<g class="c1136-line clo-${esc(l.colour)}" data-c1136-line="${i}" data-colour="${esc(l.colour)}"><title>${esc(l.name)}</title><path class="halo" d="${d}" stroke="${c.glow}"/><path class="glow" d="${d}" stroke="${c.glow}"/><path class="core" d="${d}" stroke="${c.core}"/></g>`; }).join('');
}
function legend(){
 const by = {pink: [], teal: [], orange: []};
 LINES.lines.forEach(l => { if (by[l.colour]) by[l.colour].push(l.name); });
 return ['pink', 'teal', 'orange'].map(col => `<li><i class="clodot clo-${col}" aria-hidden="true"></i><span>${col}</span><div>${by[col].map(n => esc(n)).join('<br>')}</div></li>`).join('');
}
function satMatrix(){ const M = GEO.Ai, e = M[0][2] + M[0][0] * SO[0] + M[0][1] * SO[1], f = M[1][2] + M[1][0] * SO[0] + M[1][1] * SO[1]; return 'matrix(' + [M[0][0], M[1][0], M[0][1], M[1][1], e, f].map(n => Number(n).toPrecision(12)).join(' ') + ')'; }
function clipPath(){ const m = GEO.main, e = (GEO.exclude || [])[0]; let d = `M${m[0]} ${m[1]}H${m[2]}V${m[3]}H${m[0]}Z`; if (e) d += `M${e[0]} ${e[1]}H${e[2]}V${e[3]}H${e[0]}Z`; return d; }
function html(){
 return `<section class="card c1136-map" aria-labelledby="c1136h"><h3 id="c1136h">The closure lines on the 2026 plan</h3>
 <p class="sub">The lines highlighted on the marked plan, drawn on the 2026 master layout (D001-26003-03) along the footpath on the side of the road the pen marked: one side at a time, crossing where the pen crosses (the pink at Main Beach Pde, Gate 7). Each colour runs unbroken until the next colour starts. No numbers. Plan or satellite under the lines; pinch, scroll or use the buttons to zoom to 16000%; drag to move; double-tap to zoom in.</p>
 <div class="c1136-bar"><button type="button" class="btn sm" data-c1136-zoom="out" data-ro aria-label="Zoom out">−</button><span class="c1136-pct" data-c1136-pct>100%</span><button type="button" class="btn sm" data-c1136-zoom="in" data-ro aria-label="Zoom in">+</button><button type="button" class="btn sm" data-c1136-zoom="fit" data-ro>Fit</button><span class="c1136-sep" aria-hidden="true"></span><button type="button" class="btn sm primary" data-c1136-base="plan" data-ro>Plan</button><button type="button" class="btn sm" data-c1136-base="sat" data-ro>Satellite</button><button type="button" class="btn sm" data-c1136-go="map" data-ro>Open the Map explorer</button></div>
 <div class="c1136-view" data-c1136-view><svg class="c1136-svg" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="closure lines on the 2026 plan"><defs><clipPath id="c1136clip" clipPathUnits="userSpaceOnUse"><path d="${clipPath()}" clip-rule="evenodd"/></clipPath></defs><image class="c1136-sheet" href="${SHEET}" x="0" y="0" width="${SW}" height="${SH}" preserveAspectRatio="none"/><g class="tiles"></g><g class="sat" clip-path="url(#c1136clip)"><rect class="satbg" x="${GEO.main[0]}" y="${GEO.main[1]}" width="${GEO.main[2] - GEO.main[0]}" height="${GEO.main[3] - GEO.main[1]}"/><g class="satw" transform="${satMatrix()}"></g></g><g class="lines">${pathsHtml()}</g></svg></div>
 <p class="c1136-credit" hidden>Satellite imagery: Esri World Imagery (Esri, Maxar, Earthstar Geographics and the GIS User Community), placed through the explorer's georeferencing of the plan (${esc(GEO.date)}; checked to about 1 m).</p>
 <ul class="c1136-legend">${legend()}</ul>
 <p class="norate">${esc(LINES.note || '')}</p></section>`;
}
function unit(svg){ const b = box(svg); return b.w / Math.max(1, svg.clientWidth); } /* pt per css px */
function zoomAt(svg, k, px, py){
 const b = box(svg), r = svg.getBoundingClientRect(), u = unit(svg);
 const sx = b.x + (px - r.left) * u, sy = b.y + (py - r.top) * u;   /* the sheet point under the pointer stays put */
 const w2 = Math.max(SW / MAXZ, Math.min(SW, b.w / k)), u2 = u * (w2 / b.w);
 setView(sx - (px - r.left) * u2 + w2 / 2, sy - (py - r.top) * u2 + w2 * aspect(svg) / 2, w2, svg); apply(svg);
}
function gestures(svg){
 const pts = new Map(); let st = null, lastTap = 0, moved = false;
 svg.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; svg.setPointerCapture(e.pointerId); pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (pts.size === 1) { st = {mode: 'pan', x: e.clientX, y: e.clientY, b: box(svg), u: unit(svg)}; moved = false; }
  else if (pts.size === 2) { const a = [...pts.values()]; st = {mode: 'pinch', d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2, b: box(svg), u: unit(svg)}; moved = true; }
  e.preventDefault(); });
 svg.addEventListener('pointermove', e => { if (!pts.has(e.pointerId) || !st) return; pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (st.mode === 'pan' && pts.size === 1) { const dx = e.clientX - st.x, dy = e.clientY - st.y; if (Math.hypot(dx, dy) > 4) moved = true; if (moved) { setView(st.b.x + st.b.w / 2 - dx * st.u, st.b.y + st.b.h / 2 - dy * st.u, st.b.w, svg); apply(svg); } }
  else if (st.mode === 'pinch' && pts.size === 2) { const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), k = d / Math.max(1, st.d), r = svg.getBoundingClientRect();
   const sx = st.b.x + (st.mx - r.left) * st.u, sy = st.b.y + (st.my - r.top) * st.u, w2 = Math.max(SW / MAXZ, Math.min(SW, st.b.w / k)), u2 = st.u * (w2 / st.b.w);
   setView(sx - (st.mx - r.left) * u2 + w2 / 2, sy - (st.my - r.top) * u2 + w2 * aspect(svg) / 2, w2, svg); apply(svg); }
  e.preventDefault(); });
 const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); try { svg.releasePointerCapture(e.pointerId); } catch (x) {}
  if (pts.size === 0) { if (st && st.mode === 'pan' && !moved && e.pointerType !== 'mouse') { const t = Date.now(); if (t - lastTap < 350) { zoomAt(svg, 2, e.clientX, e.clientY); lastTap = 0; } else lastTap = t; } st = null; }
  else if (pts.size === 1) { const a = [...pts.values()][0]; st = {mode: 'pan', x: a.x, y: a.y, b: box(svg), u: unit(svg)}; moved = true; } };
 svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
 svg.addEventListener('dblclick', e => { zoomAt(svg, 2, e.clientX, e.clientY); e.preventDefault(); });
 svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(svg, e.deltaY > 0 ? 0.8 : 1.25, e.clientX, e.clientY); }, {passive: false});
}
function inject(){
 const pane = document.getElementById('pane-fenceclose'); if (!pane || pane.querySelector('.c1136-map')) return;
 const head = pane.querySelector('.f1133-head'); if (!head) return;
 head.insertAdjacentHTML('afterend', html());
 const svg = pane.querySelector('.c1136-svg'); gestures(svg); setBase(base); apply(svg);
 if (!pane.__c1136) { pane.__c1136 = true;
  window.addEventListener('resize', () => { const s = el(); if (s) apply(s); });
  pane.addEventListener('click', ev => {
   const z = ev.target.closest('[data-c1136-zoom]'); if (z) { const s = el(); if (!s) return; const r = s.getBoundingClientRect();
    if (z.dataset.c1136Zoom === 'fit') view = null; else zoomAt(s, z.dataset.c1136Zoom === 'in' ? 1.6 : 1 / 1.6, r.left + r.width / 2, r.top + r.height / 2);
    apply(s); return; }
   const bb = ev.target.closest('[data-c1136-base]'); if (bb) { setBase(bb.dataset.c1136Base); return; }
   const g = ev.target.closest('[data-c1136-go]'); if (g && typeof go === 'function') go(g.dataset.c1136Go);
  }); }
}
if (typeof W.renderFenceClose1133 === 'function') { const r0 = W.renderFenceClose1133; W.renderFenceClose1133 = function(){ const r = r0.apply(this, arguments); try { inject(); } catch (e) {} return r; }; if (W.FenceClose1133) W.FenceClose1133.render = W.renderFenceClose1133; }
W.ClosureMap1136 = {LINES, TILES, GEO, html, inject, get view(){ return view; }, get base(){ return base; }, get pct(){ const s = el(); return s ? pct(s) : 100; }, box: () => box(el()),
 setZoom: (p, cx, cy) => { const s = el(); if (!s) return; const w = fitW(s) / (p / 100); setView(cx == null ? (view ? view.cx : SW / 2) : cx, cy == null ? (view ? view.cy : SH / 2) : cy, w, s); apply(s); },
 setBase, toZ18, SO, satZoom: () => satZoom(el()), fit: () => { view = null; apply(el()); }, tiles: () => { const s = el(); return s ? s.querySelectorAll('g.tiles image').length : 0; }, satTiles: () => { const s = el(); return s ? [...s.querySelectorAll('g.satw image')].map(i => i.getAttribute('href')) : []; }, level: () => level(el())};
})(window);
