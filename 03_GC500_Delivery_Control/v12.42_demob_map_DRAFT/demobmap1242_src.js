<style id="demobmap1241-style">
/* v12.41 - the Demob map: every asset on site as the icon of what it is, on satellite imagery, zoom to 16000%; tap anywhere for
   the 50 m × 50 m around it, what is in it, and send it */
#pane-demob .dmap1241{position:relative;display:grid;gap:10px;padding:14px;border:1px solid #18e8ff3a;border-radius:20px;background:radial-gradient(120% 140% at 100% 0%,#0f3340,#0b171c 60%);box-shadow:0 0 26px #18e8ff1c;color:#eef6f8;font-family:Inter,Arial,sans-serif}
#pane-demob .dmap1241 header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#pane-demob .dmap1241 header i{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:#0a161b;color:#18e8ff;box-shadow:0 0 0 1px #18e8ff66,0 0 14px #18e8ff66}
#pane-demob .dmap1241 header i svg{width:21px;height:21px}
#pane-demob .dmap1241 header b{font:900 17px/1.1 Inter,Arial,sans-serif}
#pane-demob .dmap1241 header span{color:#9fb6be;font:700 12px/1.3 Inter,Arial,sans-serif}
#pane-demob .dmap1241 .mb1241{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-left:auto}
#pane-demob .dmap1241 .mb1241 button{all:unset;box-sizing:border-box;display:grid;place-items:center;min-width:38px;height:38px;padding:0 11px;border:1px solid #ffffff26;border-radius:11px;background:#ffffff10;color:#fff;font:900 15px/1 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .dmap1241 .mb1241 button[aria-pressed="true"]{border-color:#18e8ff;background:#18e8ff22;color:#9ff6ff}
#pane-demob .dmap1241 .mb1241 .pc1241{min-width:76px;text-align:center;color:#9ff6ff;font:900 14px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-shadow:0 0 8px #18e8ff88}
#pane-demob .dmap1241 .mv1241{position:relative;height:min(62vh,560px);border-radius:16px;overflow:hidden;background:#0a1216;box-shadow:inset 0 0 0 1px #18e8ff33;touch-action:none}
#pane-demob .dmap1241 svg.ms1241{display:block;width:100%;height:100%;cursor:grab;user-select:none;-webkit-user-select:none}
#pane-demob .dmap1241 svg.ms1241:active{cursor:grabbing}
#pane-demob .dmap1241 .mk1241{cursor:pointer}
#pane-demob .dmap1241 .mk1241 .rg{fill:none;stroke-width:var(--w);filter:drop-shadow(0 0 3px currentColor)}
#pane-demob .dmap1241 .mk1241.not{color:#ff4d5e}#pane-demob .dmap1241 .mk1241.ready{color:#ffb020}#pane-demob .dmap1241 .mk1241.gone{color:#19d27a}
#pane-demob .dmap1241 .mk1241 .rg{stroke:currentColor}
#pane-demob .dmap1241 .mk1241.ready .rg{animation:mp1241 2s ease-in-out infinite}
@keyframes mp1241{0%,100%{stroke-opacity:1}50%{stroke-opacity:.45}}
#pane-demob .dmap1241 .mk1241 .ds{fill:#0b171c;stroke:#18e8ff;stroke-width:var(--t)}
#pane-demob .dmap1241 .mk1241 .ic{fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round}
#pane-demob .dmap1241 .mk1241 .ct{fill:#18e8ff;font-weight:900;text-anchor:middle}
#pane-demob .dmap1241 .lb1241{fill:#fff;font-weight:800;paint-order:stroke;stroke:#000c;pointer-events:none}
#pane-demob .dmap1241 .lb1241 tspan.d{fill:#bfe9f1;font-weight:600}
#pane-demob .dmap1241 .ar1241{fill:#18e8ff1a;stroke:#18e8ff;stroke-dasharray:var(--d);filter:drop-shadow(0 0 4px #18e8ff)}
#pane-demob .dmap1241 .mk1241.sel .ds{stroke:#fff;filter:drop-shadow(0 0 6px #fff)}
#pane-demob .dmap1241 .lg1241{display:flex;gap:12px;flex-wrap:wrap;color:#a9c1c9;font:700 11.5px/1.2 Inter,Arial,sans-serif}
#pane-demob .dmap1241 .lg1241 i{display:inline-block;width:10px;height:10px;margin-right:5px;border-radius:50%;vertical-align:-1px}
#pane-demob .dmap1241 .pn1241{display:grid;gap:9px;padding:12px;border-radius:16px;background:#0a161bcc;box-shadow:inset 0 0 0 1px #18e8ff44}
#pane-demob .dmap1241 .pn1241 > b{font:900 15px/1.2 Inter,Arial,sans-serif}
#pane-demob .dmap1241 .pn1241 > small{color:#9fb6be;font:600 12px/1.3 Inter,Arial,sans-serif}
#pane-demob .dmap1241 .pl1241{display:grid;gap:5px;max-height:260px;overflow:auto}
#pane-demob .dmap1241 .pl1241 button{all:unset;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;padding:7px 9px;border-radius:10px;background:#ffffff09;cursor:pointer;font:700 12.5px/1.25 Inter,Arial,sans-serif}
#pane-demob .dmap1241 .pl1241 button:hover{background:#18e8ff17}
#pane-demob .dmap1241 .pl1241 i{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#0b171c;color:#fff;box-shadow:0 0 0 1.5px #18e8ff}
#pane-demob .dmap1241 .pl1241 i svg{width:17px;height:17px}
#pane-demob .dmap1241 .pl1241 em{font-style:normal;padding:3px 8px;border-radius:999px;font-size:10.5px;font-weight:900}
#pane-demob .dmap1241 .pl1241 em.not{background:#ff4d5e22;color:#ff9aa4}#pane-demob .dmap1241 .pl1241 em.ready{background:#ffb02026;color:#ffd27a}#pane-demob .dmap1241 .pl1241 em.gone{background:#19d27a22;color:#7ff0b4}
#pane-demob .dmap1241 .pa1241{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#pane-demob .dmap1241 .pa1241 button{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:6px;min-height:40px;border:1px solid #ffffff22;border-radius:11px;background:#ffffff0c;color:#eef6f8;font:800 12px/1 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .dmap1241 .pa1241 button:first-child{border-color:#ff6a1399;background:linear-gradient(135deg,#ff6a1340,#ffb0201f);color:#ffd2b0}
#pane-demob .dmap1241 .pa1241 svg{width:15px;height:15px}
#pane-demob .dmap1241 .pp1241{width:100%;border-radius:12px;box-shadow:0 0 0 1px #18e8ff44}
@media (max-width:720px){#pane-demob .dmap1241{padding:10px}#pane-demob .dmap1241 .mv1241{height:62vh}#pane-demob .dmap1241 .mb1241{margin-left:0}}
@media (prefers-reduced-motion:reduce){#pane-demob .dmap1241 .mk1241.ready .rg{animation:none}}
@media print{#pane-demob .dmap1241{display:none}}
</style>
<script id="demobmap1241-script">
/* Author: Andrew Fisher. v12.41 - the Demob map. Andrew, 26 Oct 2026: "the demob map remember zoom 16000% and desciption icons
   please, tap and you can do a 50m x 50m radius of that and send to."
   Every asset card on the Demob tab (v12.38's singles) placed on satellite imagery (Esri World Imagery, as the VMS removals map)
   at its place on the record: the icon of what it is in a ring coloured by how it stands (red not ready, amber ready, green
   picked up). Zoomed out, the units at one place show as one icon with their count; zoomed in they fan out, each with its
   reference, description and asset number. Pinch, scroll or + / − to zoom, to 16000%; drag to move; Fit. Tap a unit for its
   card; tap anywhere else for the 50 m × 50 m around that spot: the square drawn on the map, every asset in it listed, and its
   picture (the page's own "on the map" picture of the spot with the square and the icons on it) to Send, Text or Email, with
   Navigate to the spot. Read only. */
(function (W) {
'use strict';
const D = W.document, SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';
const WPX = Math.pow(2, 18) * 512, MAXK = 160, AREA = 50;
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const SVGI = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
function z18(lat, lon) { const x = (lon + 180) / 360 * WPX, s = Math.sin(lat * Math.PI / 180); return [x, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WPX]; }
function unz(x, y) { const lon = x / WPX * 360 - 180, n = Math.PI - 2 * Math.PI * y / WPX; return {lat: 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))), lon}; }
const mPerPx = lat => 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, 18) / 2; /* metres per z18 (512) pixel */
let view = null, origin = null, items = [], groups = [], sel = null, showGone = false;
const S = () => W.Singles1238;
function build() {
 const sg = S(); if (!sg) return [];
 const out = []; sg.model().cards.forEach(c => { let L = null; try { L = sg.locOf(c); } catch (x) { L = null; } if (!L || !Number.isFinite(L.lat) || !Number.isFinite(L.lon)) return;
  out.push({c, lat: L.lat, lon: L.lon, p: z18(L.lat, L.lon), s: c.st.s, icon: c.icon, label: c.vms ? c.vms.label : c.key, desc: desc(c), no: c.no || ''}); });
 return out;
}
function desc(c) { const w = (S().WORD || {})[c.icon] || '', t = c.vms ? 'message board' : (c.item || c.what.split(' · ')[0]), last = w.split(' ').pop().replace(/s$/, ''); return t + (last && !new RegExp(last, 'i').test(t) ? ' ' + w : '') + (c.tankNo ? ' + waste tank' : ''); }
function group() {
 const by = new Map(); items.forEach(i => { if (i.s === 'gone' && !showGone) return; const k = i.p[0].toFixed(0) + ',' + i.p[1].toFixed(0); if (!by.has(k)) by.set(k, []); by.get(k).push(i); });
 groups = [...by.values()].map(list => ({list, p: list[0].p, lat: list[0].lat, lon: list[0].lon}));
}
function el() { return D.querySelector('#pane-demob svg.ms1241'); }
function bbox() { const xs = items.map(i => i.p[0]), ys = items.map(i => i.p[1]); return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)}; }
const aspect = svg => svg && svg.clientWidth ? svg.clientHeight / svg.clientWidth : 0.6;
function fitBox(svg) {
 /* the circuit and its surrounds: the 90% of assets nearest the middle, so a board out on the roads does not shrink the site */
 const xs = items.map(i => i.p[0]).sort((a, b) => a - b), ys = items.map(i => i.p[1]).sort((a, b) => a - b), q = (a, f) => a[Math.min(a.length - 1, Math.max(0, Math.round(f * (a.length - 1))))];
 const b = {x0: q(xs, 0.04), x1: q(xs, 0.96), y0: q(ys, 0.04), y1: q(ys, 0.96)}, a = aspect(svg);
 let w = (b.x1 - b.x0) * 1.25 + 600, h = (b.y1 - b.y0) * 1.25 + 600; if (h / w > a) w = h / a; else h = w * a;
 return {cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, w, h};
}
function box(svg) { const f = fitBox(svg), v = view || f, h = v.w * aspect(svg); return {x: v.cx - v.w / 2 - origin[0], y: v.cy - h / 2 - origin[1], w: v.w, h, cx: v.cx, cy: v.cy}; }
const pct = svg => Math.round(fitBox(svg).w / (view ? view.w : fitBox(svg).w) * 100);
const unit = svg => box(svg).w / Math.max(1, svg.clientWidth);
function setView(cx, cy, w, svg) { const f = fitBox(svg); w = Math.max(f.w / MAXK, Math.min(f.w * 2, w)); view = Math.abs(w - f.w) < 1 && Math.abs(cx - f.cx) < 1 && Math.abs(cy - f.cy) < 1 ? null : {cx, cy, w}; }
function satZoom(svg) { const b = box(svg), p = (svg.clientWidth || 360) * (W.devicePixelRatio || 1) / b.w; return Math.max(14, Math.min(21, 19 + Math.ceil(Math.log(p) / Math.LN2 - 0.1))); }
function tilesHtml(svg) {
 const b = box(svg), z = satZoom(svg), span = 256 / Math.pow(2, z - 19), ax = b.x + origin[0], ay = b.y + origin[1];
 const x0 = Math.floor(ax / span), x1 = Math.floor((ax + b.w) / span), y0 = Math.floor(ay / span), y1 = Math.floor((ay + b.h) / span); let h = '';
 if ((x1 - x0 + 1) * (y1 - y0 + 1) > 160) return '';
 for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) h += '<image href="' + SAT + z + '/' + ty + '/' + tx + '" x="' + (tx * span - origin[0]) + '" y="' + (ty * span - origin[1]) + '" width="' + span + '" height="' + span + '" preserveAspectRatio="none"/>';
 return h;
}
function iconG(k, x, y, s) { return '<g class="ic" transform="translate(' + (x - s / 2).toFixed(2) + ' ' + (y - s / 2).toFixed(2) + ') scale(' + (s / 24).toFixed(4) + ')" stroke-width="1.9">' + ((S().ICONS || {})[k] || '') + '</g>'; }
function markersHtml(svg) {
 const u = unit(svg), b = box(svg), r = 15 * u, fs = 11.5 * u, zoomed = pct(svg) >= 1200, pad = 40 * u; let h = '', labels = '';
 const inView = p => p[0] - origin[0] > b.x - pad && p[0] - origin[0] < b.x + b.w + pad && p[1] - origin[1] > b.y - pad && p[1] - origin[1] < b.y + b.h + pad;
 const mk = (i, x, y, count) => { const on = sel && sel.kind === 'unit' && sel.c === i.c;
  return '<g class="mk1241 ' + i.s + (on ? ' sel' : '') + '" data-mk1241="' + e(i.c.key) + '" data-u1241="' + e(i.c.uid) + '" style="--w:' + (3.2 * u).toFixed(3) + ';--t:' + (1.4 * u).toFixed(3) + '"><circle class="rg" cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + (r * 1.12).toFixed(2) + '"/><circle class="ds" cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + (r * 0.92).toFixed(2) + '"/>' + iconG(i.icon, x, y, r * 1.15)
   + (count > 1 ? '<circle cx="' + (x + r).toFixed(2) + '" cy="' + (y - r).toFixed(2) + '" r="' + (r * 0.62).toFixed(2) + '" fill="#18e8ff"/><text class="ct" x="' + (x + r).toFixed(2) + '" y="' + (y - r + fs * 0.36).toFixed(2) + '" font-size="' + (fs * 0.95).toFixed(2) + '" fill="#04131a">' + count + '</text>' : '') + '<title>' + e(i.label + ' · ' + i.desc + (i.no ? ' · ' + i.no : '')) + '</title></g>'; };
 groups.forEach(g => { if (!inView(g.p)) return; const cx = g.p[0] - origin[0], cy = g.p[1] - origin[1];
  if (!zoomed || g.list.length === 1) { const lead = g.list.slice().sort((a, b) => ({not: 0, ready: 1, gone: 2})[a.s] - ({not: 0, ready: 1, gone: 2})[b.s])[0];
   h += mk(lead, cx, cy, g.list.length);
   if (zoomed) labels += '<text class="lb1241" x="' + (cx + r * 1.5).toFixed(2) + '" y="' + (cy + fs * 0.35).toFixed(2) + '" font-size="' + fs.toFixed(2) + '" stroke-width="' + (fs * 0.3).toFixed(2) + '">' + e(lead.label) + ' <tspan class="d">' + e(lead.desc + (lead.no ? ' · ' + lead.no : '')) + '</tspan></text>';
   return; }
  const n = g.list.length, ring = Math.max(r * 2.6, r * 2.3 * n / (2 * Math.PI) * 1.2);
  g.list.forEach((i, k) => { const a = -Math.PI / 2 + k / n * Math.PI * 2, x = cx + ring * Math.cos(a), y = cy + ring * Math.sin(a);
   h += '<line x1="' + cx.toFixed(2) + '" y1="' + cy.toFixed(2) + '" x2="' + x.toFixed(2) + '" y2="' + y.toFixed(2) + '" stroke="#18e8ff66" stroke-width="' + (1.2 * u).toFixed(3) + '"/>' + mk(i, x, y, 1);
   if (pct(svg) >= 3000) labels += '<text class="lb1241" x="' + (x + r * 1.3).toFixed(2) + '" y="' + (y + fs * 0.35).toFixed(2) + '" font-size="' + (fs * 0.9).toFixed(2) + '" stroke-width="' + (fs * 0.28).toFixed(2) + '">' + e(i.no || i.label) + ' <tspan class="d">' + e(i.desc) + '</tspan></text>'; });
  h += '<circle cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="' + (3.5 * u).toFixed(2) + '" fill="#18e8ff"/>';
  labels += '<text class="lb1241" x="' + cx.toFixed(2) + '" y="' + (cy - ring - r * 1.4).toFixed(2) + '" text-anchor="middle" font-size="' + (fs * 1.05).toFixed(2) + '" stroke-width="' + (fs * 0.3).toFixed(2) + '">' + e(g.list[0].c.key) + ' <tspan class="d">' + n + ' assets</tspan></text>'; });
 return h + labels;
}
function areaHtml(svg) {
 if (!sel || sel.kind !== 'area') return '';
 const u = unit(svg), half = AREA / 2 / mPerPx(sel.lat), [x, y] = [sel.p[0] - origin[0], sel.p[1] - origin[1]];
 return '<rect class="ar1241" x="' + (x - half).toFixed(2) + '" y="' + (y - half).toFixed(2) + '" width="' + (half * 2).toFixed(2) + '" height="' + (half * 2).toFixed(2) + '" stroke-width="' + (2.5 * u).toFixed(3) + '" style="--d:' + (8 * u).toFixed(2) + ' ' + (5 * u).toFixed(2) + '"/><circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + (4 * u).toFixed(2) + '" fill="#18e8ff"/>';
}
function apply(svg) {
 svg = svg || el(); if (!svg || !origin) return;
 const b = box(svg); svg.setAttribute('viewBox', [b.x, b.y, b.w, b.h].map(n => Math.round(n * 1000) / 1000).join(' '));
 const p = D.querySelector('#pane-demob [data-pc1241]'); if (p) p.textContent = pct(svg) + '%';
 const gs = svg.querySelector('g.sat'); if (gs) gs.innerHTML = tilesHtml(svg);
 const ga = svg.querySelector('g.area'); if (ga) ga.innerHTML = areaHtml(svg);
 const gm = svg.querySelector('g.marks'); if (gm) gm.innerHTML = markersHtml(svg);
}
function zoomAt(svg, k, px, py) {
 const b = box(svg), r = svg.getBoundingClientRect(), u = unit(svg), f = fitBox(svg);
 const sx = b.x + origin[0] + (px - r.left) * u, sy = b.y + origin[1] + (py - r.top) * u, w2 = Math.max(f.w / MAXK, Math.min(f.w * 2, b.w / k)), u2 = u * (w2 / b.w);
 setView(sx - (px - r.left) * u2 + w2 / 2, sy - (py - r.top) * u2 + w2 * aspect(svg) / 2, w2, svg); apply(svg);
}
function tapAt(svg, px, py, target) {
 const m = target && target.closest && target.closest('[data-mk1241]');
 if (m) { const i = items.find(x => x.c.key === m.dataset.mk1241 && x.c.uid === m.dataset.u1241); if (i) { sel = {kind: 'unit', c: i.c, lat: i.lat, lon: i.lon, p: i.p}; apply(svg); panel(); } return; }
 const b = box(svg), r = svg.getBoundingClientRect(), u = unit(svg), x = b.x + origin[0] + (px - r.left) * u, y = b.y + origin[1] + (py - r.top) * u, ll = unz(x, y);
 sel = {kind: 'area', lat: ll.lat, lon: ll.lon, p: [x, y]}; apply(svg); panel();
}
function inArea(lat, lon) { const half = AREA / 2, dy = (lat - sel.lat) * 110574, dx = (lon - sel.lon) * 111320 * Math.cos(sel.lat * Math.PI / 180); return Math.abs(dx) <= half && Math.abs(dy) <= half; }
function areaList() { return items.filter(i => inArea(i.lat, i.lon)).sort((a, b) => ({not: 0, ready: 1, gone: 2})[a.s] - ({not: 0, ready: 1, gone: 2})[b.s] || String(a.label).localeCompare(String(b.label), 'en-AU', {numeric: true})); }
const SW = {not: 'Not ready', ready: 'Ready', gone: 'Picked up'};
const UIC = {nav: SVGI('<path d="M3 11 21 3l-8 18-2-8z"/>'), text: SVGI('<path d="M4 5h16v11H9l-5 4z"/>'), mail: SVGI('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>'), send: SVGI('<path d="M12 15V3M7 8l5-5 5 5M5 13v6h14v-6"/>')};
function panel() {
 const box2 = D.querySelector('#pane-demob .pn1241'); if (!box2) return;
 if (!sel) { box2.hidden = true; return; }
 box2.hidden = false;
 if (sel.kind === 'unit') { const c = sel.c, i = items.find(x => x.c === c);
  box2.innerHTML = '<b>' + e((c.vms ? c.vms.label + ' · ' : '') + c.key + ' · ' + i.desc) + '</b><small>' + e([c.no ? 'Asset no. ' + c.no : '', c.rego ? 'Rego ' + c.rego : '', SW[c.st.s], c.book ? 'Pick-up booked ' + S().wordsOf(c).lines.find(l => /^Pick-up booked/.test(l)).replace(/^Pick-up booked: /, '') : ''].filter(Boolean).join(' · ')) + '</small>'
   + '<div class="pa1241"><button type="button" data-pg1241="card">Open its card</button><button type="button" data-pg1241="nav">' + UIC.nav + 'Navigate</button><button type="button" data-pg1241="text">' + UIC.text + 'Text</button><button type="button" data-pg1241="send">' + UIC.send + 'Send</button></div>'; return; }
 const list = areaList();
 box2.innerHTML = '<b>50 m × 50 m around ' + sel.lat.toFixed(5) + ', ' + sel.lon.toFixed(5) + ' · ' + list.length + (list.length === 1 ? ' asset' : ' assets') + '</b><small>Tap an asset for its card. Send hands the picture of the area and the list to your phone\'s share menu.</small>'
  + (list.length ? '<div class="pl1241">' + list.map(i => '<button type="button" data-pi1241="' + e(i.c.key) + '" data-u1241="' + e(i.c.uid) + '"><i>' + SVGI((S().ICONS || {})[i.icon] || '') + '</i><span><b>' + e(i.label) + '</b> · ' + e(i.desc) + (i.no ? ' · ' + e(i.no) : '') + '</span><em class="' + i.s + '">' + SW[i.s] + '</em></button>').join('') + '</div>' : '<small>Nothing on the record stands in this square.</small>')
  + '<div class="pa1241"><button type="button" data-pa1241="send">' + UIC.send + 'Send</button><button type="button" data-pa1241="text">' + UIC.text + 'Text</button><button type="button" data-pa1241="email">' + UIC.mail + 'Email</button><button type="button" data-pa1241="nav">' + UIC.nav + 'Navigate</button></div>';
}
function areaWords() {
 const list = areaList(), nav = 'https://www.google.com/maps/dir/?api=1&destination=' + sel.lat.toFixed(6) + ',' + sel.lon.toFixed(6) + '&travelmode=driving';
 return {subject: 'GC500 demob · 50 m × 50 m at ' + sel.lat.toFixed(5) + ', ' + sel.lon.toFixed(5) + ' · ' + list.length + ' assets',
  lines: ['Coates GC500 demob · the 50 m × 50 m around ' + sel.lat.toFixed(5) + ', ' + sel.lon.toFixed(5), list.length + (list.length === 1 ? ' asset' : ' assets') + ':'].concat(list.map(i => '· ' + i.label + ' · ' + i.desc + (i.no ? ' · ' + i.no : '') + ' · ' + SW[i.s])).concat(['Navigate: ' + nav]), nav};
}
const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => rej(new Error('picture')); im.src = src; });
async function areaPicture() {
 const L = {kind: 'spot', label: '50 m × 50 m', tag: '50 m × 50 m', what: areaList().length + ' assets', lat: sel.lat, lon: sel.lon, how: 'tapped on the Demob map'}, V = {key: 'area', halfM: 40, bar: 10, word: 'Area 50 m × 50 m'};
 const pic = await Find1176.picture(L, V); if (!pic || !pic.dataUrl) return null;
 const im = await loadImg(pic.dataUrl), cv = D.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
 const Wd = 1000, H = 720, ppm = Wd / (pic.across || 80); let X = Wd / 2, Y = H / 2;
 try { if (pic.source === 'aerial') { const g = DATA.georef, fr = frameOf(sel.lat, sel.lon), FX = g.frame_px[0], FY = g.frame_px[1], pxm = 1 / g.m_per_frame_px_ground; let fw = 2 * V.halfM * pxm, fh = fw * H / Wd; const x0 = Math.max(0, Math.min(FX - fw, fr.ax * FX - fw / 2)), y0 = Math.max(0, Math.min(FY - fh, fr.ay * FY - fh / 2)); X = (fr.ax * FX - x0) / fw * Wd; Y = (fr.ay * FY - y0) / fh * H; } } catch (x) {}
 const half = AREA / 2 * ppm; c.save(); c.beginPath(); c.rect(0, 0, Wd, H); c.clip();
 c.strokeStyle = '#18e8ff'; c.lineWidth = 5; c.shadowColor = '#18e8ff'; c.shadowBlur = 14; c.setLineDash([22, 12]); c.strokeRect(X - half, Y - half, half * 2, half * 2); c.setLineDash([]); c.fillStyle = 'rgba(24,232,255,.08)'; c.fillRect(X - half, Y - half, half * 2, half * 2); c.shadowBlur = 0;
 const cos = Math.cos(sel.lat * Math.PI / 180), PATHS = k => (S().iconPaths ? S().iconPaths(k) : []);
 areaList().forEach(i => { const x = X + (i.lon - sel.lon) * 111320 * cos * ppm, y = Y - (i.lat - sel.lat) * 110574 * ppm, R = 22, col = i.s === 'ready' ? '#ffb020' : i.s === 'gone' ? '#19d27a' : '#ff4d5e';
  c.save(); c.shadowColor = col; c.shadowBlur = 12; c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.stroke(); c.restore();
  c.fillStyle = '#0b171c'; c.beginPath(); c.arc(x, y, R * 0.82, 0, Math.PI * 2); c.fill();
  const ps = PATHS(i.icon), s = R * 1.15; if (ps.length) { c.save(); c.translate(x - s / 2, y - s / 2); c.scale(s / 24, s / 24); c.strokeStyle = '#fff'; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round'; ps.forEach(p => c.stroke(p)); c.restore(); } });
 c.restore();
 return await new Promise(res => { try { cv.toBlob(b => res(b), 'image/jpeg', 0.86); } catch (x) { res(null); } });
}
function openUrl(u) { try { const a = D.createElement('a'); a.href = u; a.rel = 'noopener'; if (/^https?:/.test(u)) a.target = '_blank'; D.body.appendChild(a); a.click(); a.remove(); } catch (x) { W.location.href = u; } }
async function sendArea() {
 const w = areaWords(), txt = w.lines.join('\n'); let f = null;
 try { const b = await areaPicture(); if (b) f = new File([b], 'GC500-demob-area-' + sel.lat.toFixed(5) + '_' + sel.lon.toFixed(5) + '.jpg', {type: 'image/jpeg'}); } catch (x) { f = null; }
 try { if (navigator.share && f && (!navigator.canShare || navigator.canShare({files: [f]}))) { await navigator.share({title: w.subject, text: txt, files: [f]}); return 'shared'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 try { if (navigator.share) { await navigator.share({title: w.subject, text: txt}); return 'shared words'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 if (f) { const u = URL.createObjectURL(f), a = D.createElement('a'); a.href = u; a.download = f.name; D.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
 try { await navigator.clipboard.writeText(txt); } catch (x) {}
 try { flash((f ? 'The picture is saved and ' : '') + 'the list is copied: attach it to a text or email.'); } catch (x) {}
 return 'saved';
}
function gestures(svg) {
 const pts = new Map(); let st = null, moved = false;
 svg.addEventListener('pointerdown', ev => { if (ev.pointerType === 'mouse' && ev.button !== 0) return; try { svg.setPointerCapture(ev.pointerId); } catch (x) {} pts.set(ev.pointerId, {x: ev.clientX, y: ev.clientY, t: ev.target});
  if (pts.size === 1) { st = {mode: 'pan', x: ev.clientX, y: ev.clientY, b: box(svg), u: unit(svg), t: ev.target}; moved = false; }
  else if (pts.size === 2) { const a = [...pts.values()]; st = {mode: 'pinch', d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2, b: box(svg), u: unit(svg)}; moved = true; }
  ev.preventDefault(); });
 svg.addEventListener('pointermove', ev => { if (!pts.has(ev.pointerId) || !st) return; pts.set(ev.pointerId, {x: ev.clientX, y: ev.clientY});
  if (st.mode === 'pan' && pts.size === 1) { const dx = ev.clientX - st.x, dy = ev.clientY - st.y; if (Math.hypot(dx, dy) > 5) moved = true; if (moved) { setView(st.b.cx - dx * st.u, st.b.cy - dy * st.u, st.b.w, svg); apply(svg); } }
  else if (st.mode === 'pinch' && pts.size === 2) { const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), k = d / Math.max(1, st.d), r = svg.getBoundingClientRect(), f = fitBox(svg);
   const sx = st.b.x + origin[0] + (st.mx - r.left) * st.u, sy = st.b.y + origin[1] + (st.my - r.top) * st.u, w2 = Math.max(f.w / MAXK, Math.min(f.w * 2, st.b.w / k)), u2 = st.u * (w2 / st.b.w);
   setView(sx - (st.mx - r.left) * u2 + w2 / 2, sy - (st.my - r.top) * u2 + w2 * aspect(svg) / 2, w2, svg); apply(svg); }
  ev.preventDefault(); });
 const up = ev => { if (!pts.has(ev.pointerId)) return; pts.delete(ev.pointerId); try { svg.releasePointerCapture(ev.pointerId); } catch (x) {}
  if (pts.size === 0) { if (st && st.mode === 'pan' && !moved) tapAt(svg, ev.clientX, ev.clientY, st.t); st = null; }
  else if (pts.size === 1) { const a = [...pts.values()][0]; st = {mode: 'pan', x: a.x, y: a.y, b: box(svg), u: unit(svg)}; moved = true; } };
 svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
 svg.addEventListener('wheel', ev => { ev.preventDefault(); zoomAt(svg, ev.deltaY > 0 ? 0.8 : 1.25, ev.clientX, ev.clientY); }, {passive: false});
}
function html() {
 const n = items.filter(i => i.s !== 'gone').length;
 return '<section class="dmap1241" aria-labelledby="dmh1241"><header><i>' + SVGI('<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>') + '</i><div><b id="dmh1241">Demob map</b><br><span>' + n + ' assets on site, each the icon of what it is · tap an asset for its card, or anywhere for the 50 m × 50 m around it</span></div>'
  + '<div class="mb1241"><button type="button" data-z1241="out" data-ro aria-label="Zoom out">−</button><span class="pc1241" data-pc1241>100%</span><button type="button" data-z1241="in" data-ro aria-label="Zoom in">+</button><button type="button" data-z1241="fit" data-ro>Fit</button><button type="button" data-z1241="gone" data-ro aria-pressed="' + showGone + '">Picked up</button></div></header>'
  + '<div class="mv1241"><svg class="ms1241" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Every asset on site on the satellite map"><g class="sat"></g><g class="area"></g><g class="marks"></g></svg></div>'
  + '<div class="lg1241"><span><i style="background:#ff4d5e;box-shadow:0 0 6px #ff4d5e"></i>Not ready</span><span><i style="background:#ffb020;box-shadow:0 0 6px #ffb020"></i>Ready</span><span><i style="background:#19d27a;box-shadow:0 0 6px #19d27a"></i>Picked up</span><span>Pinch, scroll or + / − to zoom to 16000% · drag to move · imagery Esri World Imagery</span></div>'
  + '<div class="pn1241" hidden></div></section>';
}
let lastSig = '';
function inject() {
 const pane = D.getElementById('pane-demob'); if (!pane || typeof DM816 !== 'object' || DM816.view !== 'everything' || !S()) return;
 const host = pane.querySelector('.sgv1238[data-sgv1238="all"]'); if (!host) return;
 items = build(); if (!items.length) return; group();
 const sig = items.map(i => i.c.key + i.c.uid + i.s).join('|'), have = host.querySelector('.dmap1241');
 if (have && sig === lastSig) return;
 if (!origin) { const b = bbox(); origin = [Math.floor(b.x0 - 4000), Math.floor(b.y0 - 4000)]; }
 if (sel && sel.kind === 'unit') { const i = items.find(x => x.c.key === sel.c.key && x.c.uid === sel.c.uid); sel = i ? Object.assign(sel, {c: i.c}) : null; }
 if (have) { lastSig = sig; apply(); panel(); return; }
 const bar = host.querySelector('.tb1238'); if (!bar) return;
 bar.insertAdjacentHTML('afterend', html()); lastSig = sig;
 const svg = host.querySelector('svg.ms1241'); gestures(svg); apply(svg); panel();
}
D.addEventListener('click', ev => {
 const t = ev.target && ev.target.closest ? ev.target : null; if (!t || !t.closest('#pane-demob .dmap1241')) return;
 const z = t.closest('[data-z1241]'), svg = el(); let b;
 if (z && svg) { ev.preventDefault(); const r = svg.getBoundingClientRect(), k = z.dataset.z1241;
  if (k === 'fit') { view = null; apply(svg); } else if (k === 'gone') { showGone = !showGone; z.setAttribute('aria-pressed', String(showGone)); group(); apply(svg); } else zoomAt(svg, k === 'in' ? 1.8 : 1 / 1.8, r.left + r.width / 2, r.top + r.height / 2); return; }
 if ((b = t.closest('[data-pi1241]'))) { ev.preventDefault(); try { S().goCard(b.dataset.pi1241, b.dataset.u1241); } catch (x) {} return; }
 if ((b = t.closest('[data-pg1241]')) && sel && sel.kind === 'unit') { ev.preventDefault(); const c = sel.c, a = b.dataset.pg1241, L = S().locOf(c);
  if (a === 'card') S().goCard(c.key, c.uid); else if (a === 'nav' && L) openUrl(S().navOf(L)); else if (a === 'text') openUrl('sms:?&body=' + encodeURIComponent(S().wordsOf(c).lines.join('\n'))); else if (a === 'send') S().send(c); return; }
 if ((b = t.closest('[data-pa1241]')) && sel && sel.kind === 'area') { ev.preventDefault(); const a = b.dataset.pa1241, w = areaWords();
  if (a === 'send') sendArea(); else if (a === 'text') openUrl('sms:?&body=' + encodeURIComponent(w.lines.join('\n'))); else if (a === 'email') openUrl('mailto:?subject=' + encodeURIComponent(w.subject) + '&body=' + encodeURIComponent(w.lines.join('\n'))); else if (a === 'nav') openUrl(w.nav); return; }
}, true);
if (typeof renderDemob816 === 'function') { const before = renderDemob816; renderDemob816 = function () { const v = before.apply(this, arguments); try { inject(); } catch (x) {} return v; }; Object.assign(renderDemob816, before); }
W.addEventListener('resize', () => { const s = el(); if (s) apply(s); });
W.DemobMap1241 = Object.freeze({z18, unz, inject, apply, areaList: () => (sel && sel.kind === 'area' ? areaList() : []), areaWords: () => (sel && sel.kind === 'area' ? areaWords() : null), areaPicture: () => (sel && sel.kind === 'area' ? areaPicture() : null),
 tap: (lat, lon) => { const svg = el(); if (!svg) return false; sel = {kind: 'area', lat, lon, p: z18(lat, lon)}; apply(svg); panel(); return true; },
 setZoom: (p, lat, lon) => { const s = el(); if (!s) return; const f = fitBox(s), c = lat != null ? z18(lat, lon) : [view ? view.cx : f.cx, view ? view.cy : f.cy]; setView(c[0], c[1], f.w / (p / 100), s); apply(s); },
 get pct() { const s = el(); return s ? pct(s) : 100; }, get items() { return items; }, MAXK, AREA, release: 'v12.41'});
try { const p = D.getElementById('pane-demob'); if (p && !p.hidden) inject(); } catch (x) {}
})(window);
</script>
