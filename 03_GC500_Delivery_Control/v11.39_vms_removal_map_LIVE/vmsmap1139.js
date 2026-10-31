/* Author: Andrew Fisher. VMS removals map (v11.39): the five end-of-session boards on satellite imagery, each in its own
   colour, a dotted line in that colour from the board's position on the track to where it goes when it comes off, with the
   distance; tap a pin or use the links to navigate. Andrew, 23 Oct 2026: "Vms removals boards lets colour code lets have a
   map with the colour have a dotted line on where they go. They get taken off track first thing this morning." Positions
   are the page's own (the VMS plan with Andrew's pins); the spots are the tab's rules where a spot was named with a position
   (VMS 16 behind 2 Breaker St, VMS 15 the T2 runoff), the T10 label on the 2026 plan through the explorer's georeferencing
   (VMS 17), and Cypress Ave, Surfers Paradise, geocoded, standing in for the Altus compound until its spot is pinned (VMS 13
   and 14). Imagery: Esri World Imagery. Shown on the VMS removals tab. */
(function (W) {
'use strict';
const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';
const WPX = Math.pow(2, 18) * 512;   /* Web Mercator world width at z18 in 512 px tiles */
const COL = {'13': '#ff3b3b', '14': '#ff9f1a', '15': '#ffe600', '16': '#00e5ff', '17': '#ff4fd8'};
const SPOTS = {
 '13': {lat: -27.9967487, lon: 153.4273317, name: 'Altus compound, Cypress Ave', how: 'Cypress Ave, Surfers Paradise (the street, geocoded 23 Oct 2026); the compound’s spot on it is not pinned yet', approx: true},
 '14': {lat: -27.9967487, lon: 153.4273317, name: 'Altus compound, Cypress Ave', how: 'Cypress Ave, Surfers Paradise (the street, geocoded 23 Oct 2026); the compound’s spot on it is not pinned yet', approx: true},
 '17': {lat: -27.984903, lon: 153.429735, name: 'T10 runoff', how: 'the T10 label on the 2026 master layout, placed through the explorer’s georeferencing (about 1 m)'}};
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nav = (lat, lon) => 'https://www.google.com/maps/dir/?api=1&destination=' + Number(lat) + ',' + Number(lon);
function z18(lat, lon){ const x = (lon + 180) / 360 * WPX, s = Math.sin(lat * Math.PI / 180); return [x, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WPX]; }
function metres(a, b){ const R = 6371000, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180, la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
let view = null, origin = null, items = [];
function el(){ return document.querySelector('#pane-vmsoff .v1139-svg'); }
function build(){
 const v = W.VmsOff1132; if (!v || typeof v.boards !== 'function') return [];
 return v.boards().map(b => { const sp = (Number.isFinite(b.storeLat) && Number.isFinite(b.storeLon)) ? {lat: b.storeLat, lon: b.storeLon, name: b.store, how: b.storeBy ? 'pinned by ' + b.storeBy : 'the tab’s rule'} : SPOTS[b.pos] || null;
  const d = sp ? Math.round(metres({lat: b.lat, lon: b.lon}, sp)) : null;
  return {pos: b.pos, label: b.label || ('VMS ' + b.pos), from: b.from, must: b.must, where: b.where, lat: b.lat, lon: b.lon, how: b.how, colour: COL[b.pos] || '#ffffff', spot: sp, m: d, bp: z18(b.lat, b.lon), sp: sp ? z18(sp.lat, sp.lon) : null}; });
}
function bbox(){
 const ps = []; items.forEach(i => { ps.push(i.bp); if (i.sp) ps.push(i.sp); });
 const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
 return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)};
}
function aspect(svg){ return svg && svg.clientWidth ? svg.clientHeight / svg.clientWidth : 1; }
function fitBox(svg){
 const b = bbox(), a = aspect(svg); let w = (b.x1 - b.x0) * 1.3 + 400, h = (b.y1 - b.y0) * 1.3 + 400;
 if (h / w > a) w = h / a; else h = w * a;
 return {cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, w: w, h: h};
}
function box(svg){ const f = fitBox(svg); const v = view || f; const h = v.w * aspect(svg); return {x: v.cx - v.w / 2 - origin[0], y: v.cy - h / 2 - origin[1], w: v.w, h: h, cx: v.cx, cy: v.cy}; }
function pct(svg){ const f = fitBox(svg); return Math.round(f.w / (view ? view.w : f.w) * 100); }
function unit(svg){ return box(svg).w / Math.max(1, svg.clientWidth); } /* z18 px per css px */
function setView(cx, cy, w, svg){ const f = fitBox(svg); w = Math.max(f.w / 64, Math.min(f.w, w)); view = w >= f.w ? null : {cx: cx, cy: cy, w: w}; }
function satZoom(svg){ const b = box(svg); const p = (svg.clientWidth || 360) * (window.devicePixelRatio || 1) / b.w; return Math.max(15, Math.min(21, 19 + Math.ceil(Math.log(p) / Math.LN2 - 0.1))); } /* the sharper of the two zooms either side */
function tilesHtml(svg){
 const b = box(svg), z = satZoom(svg), span = 256 / Math.pow(2, z - 19), ax = b.x + origin[0], ay = b.y + origin[1];
 const x0 = Math.floor(ax / span), x1 = Math.floor((ax + b.w) / span), y0 = Math.floor(ay / span), y1 = Math.floor((ay + b.h) / span); let h = '';
 if ((x1 - x0 + 1) * (y1 - y0 + 1) > 150) return {z: z, html: ''};
 for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) h += '<image href="' + SAT + z + '/' + ty + '/' + tx + '" x="' + (tx * span - origin[0]) + '" y="' + (ty * span - origin[1]) + '" width="' + span + '" height="' + span + '" preserveAspectRatio="none"/>';
 return {z: z, html: h};
}
function pinsHtml(svg){
 const u = unit(svg), r = 13 * u, f = 12 * u, lw = 2.5 * u; let h = '';
 items.forEach(i => { const [bx, by] = [i.bp[0] - origin[0], i.bp[1] - origin[1]];
  if (i.sp) { const [sx, sy] = [i.sp[0] - origin[0], i.sp[1] - origin[1]];
   h += `<line class="v1139-route" x1="${bx}" y1="${by}" x2="${sx}" y2="${sy}" stroke="${i.colour}"/>`;
   h += `<g class="v1139-spot" data-v1139-nav="${esc(i.spot.lat)},${esc(i.spot.lon)}"><rect x="${sx - r * 0.8}" y="${sy - r * 0.8}" width="${r * 1.6}" height="${r * 1.6}" rx="${r * 0.25}" fill="${i.colour}" fill-opacity="${i.spot.approx ? 0.35 : 0.9}" stroke="${i.colour}" stroke-width="${lw}" ${i.spot.approx ? `stroke-dasharray="${3 * u} ${2 * u}"` : ''}/><text x="${sx + r * 1.1}" y="${sy + f * 0.38}" font-size="${f}" fill="#fff" stroke="#000" stroke-width="${f * 0.28}" paint-order="stroke" class="v1139-lbl">${esc(i.label)} → ${esc(i.spot.name)}${i.m != null ? ' · ' + i.m + ' m' : ''}</text></g>`; }
  h += `<g class="v1139-pin" data-v1139-nav="${esc(i.lat)},${esc(i.lon)}"><circle cx="${bx}" cy="${by}" r="${r * 1.7}" fill="${i.colour}" fill-opacity=".18"/><circle cx="${bx}" cy="${by}" r="${r}" fill="${i.colour}" stroke="#101418" stroke-width="${lw}"/><text x="${bx}" y="${by + f * 0.36}" text-anchor="middle" font-size="${f}" font-weight="700" fill="#101418" class="v1139-num">${esc(i.pos)}</text><text x="${bx + r * 1.2}" y="${by - r * 0.6}" font-size="${f}" fill="#fff" stroke="#000" stroke-width="${f * 0.28}" paint-order="stroke" class="v1139-lbl">${esc(i.label)} · ${i.must ? 'not before ' : 'from '}${esc(i.from)}</text></g>`; });
 return h;
}
function apply(svg){
 svg = svg || el(); if (!svg) return;
 const b = box(svg); svg.setAttribute('viewBox', [b.x, b.y, b.w, b.h].map(n => Math.round(n * 1000) / 1000).join(' '));
 const p = document.querySelector('#pane-vmsoff [data-v1139-pct]'); if (p) p.textContent = pct(svg) + '%';
 const t = tilesHtml(svg), gs = svg.querySelector('g.sat'); if (gs) { gs.setAttribute('data-z', t.z); gs.innerHTML = t.html; }
 const gp = svg.querySelector('g.pins'); if (gp) gp.innerHTML = pinsHtml(svg);
}
function legend(){
 return items.map(i => `<li><i class="v1139-chip" style="background:${esc(i.colour)}"></i><div><b>${esc(i.label)}</b> · ${i.must ? 'not before' : 'from'} ${esc(i.from)} · ${esc(i.where)}<br><span>goes to <b>${esc(i.spot ? i.spot.name : '—')}</b>${i.m != null ? ' · ' + i.m + ' m' : ''}${i.spot && i.spot.approx ? ' <em>(street only; the compound’s spot not pinned yet)</em>' : ''}</span><br><a class="btn sm" href="${esc(nav(i.lat, i.lon))}" target="_blank" rel="noopener noreferrer">Navigate to the board ↗</a> ${i.spot ? `<a class="btn sm" href="${esc(nav(i.spot.lat, i.spot.lon))}" target="_blank" rel="noopener noreferrer">Navigate to its spot ↗</a>` : ''}</div></li>`).join('');
}
function html(){
 return `<section class="card v1139-map" aria-labelledby="v1139h"><h3 id="v1139h">Where each board goes when it comes off</h3>
 <p class="sub">Each board in its own colour on satellite imagery: the solid pin is the board on the track, the dotted line runs to the square where it goes, with the distance. VMS 16 behind 2 Breaker St and VMS 15 to the T2 runoff are pinned spots; VMS 17 to the T10 runoff is placed from the 2026 plan; VMS 13 and 14 go to the Altus compound on Cypress Ave, shown at the street (dashed square) until the compound’s spot is pinned. Tap a pin to navigate; pinch or scroll to zoom; drag to move.</p>
 <div class="v1139-bar"><button type="button" class="btn sm" data-v1139-zoom="out" data-ro aria-label="Zoom out">−</button><span class="v1139-pct" data-v1139-pct>100%</span><button type="button" class="btn sm" data-v1139-zoom="in" data-ro aria-label="Zoom in">+</button><button type="button" class="btn sm" data-v1139-zoom="fit" data-ro>Fit</button></div>
 <div class="v1139-view"><svg class="v1139-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label="VMS boards and where they go"><g class="sat"></g><g class="pins"></g></svg></div>
 <ul class="v1139-legend">${legend()}</ul>
 <p class="norate">Imagery: Esri World Imagery (Esri, Maxar, Earthstar Geographics and the GIS User Community). Positions are the page’s own pins; distances are straight-line.</p></section>`;
}
function zoomAt(svg, k, px, py){
 const b = box(svg), r = svg.getBoundingClientRect(), u = unit(svg), f = fitBox(svg);
 const sx = b.x + origin[0] + (px - r.left) * u, sy = b.y + origin[1] + (py - r.top) * u;
 const w2 = Math.max(f.w / 64, Math.min(f.w, b.w / k)), u2 = u * (w2 / b.w);
 setView(sx - (px - r.left) * u2 + w2 / 2, sy - (py - r.top) * u2 + w2 * aspect(svg) / 2, w2, svg); apply(svg);
}
function gestures(svg){
 const pts = new Map(); let st = null, moved = false;
 svg.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; svg.setPointerCapture(e.pointerId); pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (pts.size === 1) { st = {mode: 'pan', x: e.clientX, y: e.clientY, b: box(svg), u: unit(svg)}; moved = false; }
  else if (pts.size === 2) { const a = [...pts.values()]; st = {mode: 'pinch', d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2, b: box(svg), u: unit(svg)}; moved = true; }
  e.preventDefault(); });
 svg.addEventListener('pointermove', e => { if (!pts.has(e.pointerId) || !st) return; pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (st.mode === 'pan' && pts.size === 1) { const dx = e.clientX - st.x, dy = e.clientY - st.y; if (Math.hypot(dx, dy) > 4) moved = true; if (moved) { setView(st.b.cx - dx * st.u, st.b.cy - dy * st.u, st.b.w, svg); apply(svg); } }
  else if (st.mode === 'pinch' && pts.size === 2) { const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), k = d / Math.max(1, st.d), r = svg.getBoundingClientRect(), f = fitBox(svg);
   const sx = st.b.x + origin[0] + (st.mx - r.left) * st.u, sy = st.b.y + origin[1] + (st.my - r.top) * st.u, w2 = Math.max(f.w / 64, Math.min(f.w, st.b.w / k)), u2 = st.u * (w2 / st.b.w);
   setView(sx - (st.mx - r.left) * u2 + w2 / 2, sy - (st.my - r.top) * u2 + w2 * aspect(svg) / 2, w2, svg); apply(svg); }
  e.preventDefault(); });
 const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); try { svg.releasePointerCapture(e.pointerId); } catch (x) {}
  if (pts.size === 0) { if (st && st.mode === 'pan' && !moved) { const t = e.target.closest('[data-v1139-nav]'); if (t) { const ll = t.dataset.v1139Nav.split(','); window.open(nav(ll[0], ll[1]), '_blank', 'noopener'); } } st = null; }
  else if (pts.size === 1) { const a = [...pts.values()][0]; st = {mode: 'pan', x: a.x, y: a.y, b: box(svg), u: unit(svg)}; moved = true; } };
 svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
 svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(svg, e.deltaY > 0 ? 0.8 : 1.25, e.clientX, e.clientY); }, {passive: false});
}
function inject(){
 const pane = document.getElementById('pane-vmsoff'); if (!pane || pane.querySelector('.v1139-map')) return;
 const head = pane.querySelector('.v1132-head'); if (!head) return;
 items = build(); if (!items.length) return;
 const b = bbox(); origin = [Math.floor(b.x0 - 2000), Math.floor(b.y0 - 2000)];
 head.insertAdjacentHTML('afterend', html());
 const svg = pane.querySelector('.v1139-svg'); gestures(svg); apply(svg);
 if (!pane.__v1139) { pane.__v1139 = true;
  window.addEventListener('resize', () => { const s = el(); if (s) apply(s); });
  pane.addEventListener('click', ev => { const z = ev.target.closest('[data-v1139-zoom]'); if (!z) return; const s = el(); if (!s) return; const r = s.getBoundingClientRect();
   if (z.dataset.v1139Zoom === 'fit') view = null; else zoomAt(s, z.dataset.v1139Zoom === 'in' ? 1.6 : 1 / 1.6, r.left + r.width / 2, r.top + r.height / 2);
   apply(s); }); }
}
if (typeof W.renderVmsOff1132 === 'function') { const r0 = W.renderVmsOff1132; W.renderVmsOff1132 = function(){ const r = r0.apply(this, arguments); try { inject(); } catch (e) {} return r; }; if (W.VmsOff1132) W.VmsOff1132.render = W.renderVmsOff1132; }
W.VmsMap1139 = {COL, SPOTS, z18, metres, html, inject, get items(){ return items; }, get view(){ return view; }, get origin(){ return origin; }, get pct(){ const s = el(); return s ? pct(s) : 100; }, satZoom: () => satZoom(el()), tiles: () => { const s = el(); return s ? [...s.querySelectorAll('g.sat image')].map(i => i.getAttribute('href')) : []; },
 setZoom: (p, lat, lon) => { const s = el(); if (!s) return; const f = fitBox(s), w = f.w / (p / 100); const c = (lat != null && lon != null) ? z18(lat, lon) : [view ? view.cx : f.cx, view ? view.cy : f.cy]; setView(c[0], c[1], w, s); apply(s); }, fit: () => { view = null; apply(el()); }};
})(window);
