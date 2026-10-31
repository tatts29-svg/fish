/* v7.53 part 2 - THE WORLD. The circuit ribbon from iEDM's ring, its kerbs, barriers, hoardings, fencing, gantries,
 lights and stands; Surfers Paradise round it from OpenStreetMap. Everything is built once at mount into a handful
 of merged meshes, so a frame is a few dozen draw calls whatever the quality. Units are metres; the sheet's points
 are converted here and nowhere else. */
(function(){
'use strict';
const G = window.GC3D; if (!G || !G.X) return;
const X = G.X, M = X.M;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const rng = seed => { let s = seed >>> 0 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

/* ---------- canvas textures: hoardings, banners, windows, asphalt, kerbs, fence, crowd ---------- */
X.tex = {};
function canvasTex(T, w, h, draw, opts){
 const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
 const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; if (opts && opts.srgb) t.colorSpace = T.SRGBColorSpace; t.needsUpdate = true; return t;
}
const OR = '#ff6a13', BLK = '#15181c', WH = '#f7f5f0';
function brandFont(px, weight){ return (weight || 800) + ' italic ' + px + 'px "Barlow Condensed","Arial Narrow",Impact,sans-serif'; }
/* one panel of hoarding, 8 m long by 0.9 m: the words are Coates' and the event's, never another company's */
const HOARD = [
 {bg: OR, fg: WH, text: 'COATES', sub: 'INDUSTRIAL SOLUTIONS'},
 {bg: WH, fg: '#c8102e', text: 'GOLD COAST 500', sub: '23 – 25 OCTOBER 2026'},
 {bg: BLK, fg: OR, text: 'GC500 · 2026', sub: 'SURFERS PARADISE STREET CIRCUIT'},
 {bg: '#c8102e', fg: WH, text: 'THE FINALS START HERE', sub: ''},
 {bg: '#8d949a', fg: '#8d949a', text: '', sub: ''},
 {bg: OR, fg: BLK, text: 'HIRE · INSTALL · DEMOB', sub: 'COATES'},
 {bg: '#2a2e33', fg: '#2a2e33', text: '', sub: ''},
 {bg: WH, fg: OR, text: 'COATES', sub: 'GC500 EVENT PARTNER'}
];
X.makeTextures = function(T){
 const t = X.tex;
 t.hoard = canvasTex(T, 4096, 128, (g, w, h) => { const pw = w / HOARD.length;
 HOARD.forEach((p, i) => { g.fillStyle = p.bg; g.fillRect(i * pw, 0, pw, h);
 if (p.text) { g.fillStyle = p.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = brandFont(p.sub ? 66 : 78); g.fillText(p.text, i * pw + pw / 2, p.sub ? h * .42 : h / 2);
 if (p.sub) { g.font = '700 22px Inter,system-ui,sans-serif'; g.fillText(p.sub, i * pw + pw / 2, h * .8); } }
 g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(i * pw - 2, 0, 4, h); }); }, {srgb: true});
 t.hoard.repeat.set(1, 1);
 t.concrete = canvasTex(T, 512, 128, (g, w, h) => { g.fillStyle = '#9ea4a8'; g.fillRect(0, 0, w, h); const r = rng(7); for (let i = 0; i < 1800; i++) { g.fillStyle = 'rgba(0,0,0,' + (r() * .12) + ')'; g.fillRect(r() * w, r() * h, 2, 2); } g.fillStyle = 'rgba(0,0,0,.35)'; for (let x = 0; x < w; x += 128) g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, w, 4); }, {srgb: true});
 /* asphalt: dark, with the grain and the rubbered-in darker band the racing line leaves */
 t.asphalt = canvasTex(T, 512, 512, (g, w, h) => { g.fillStyle = '#2b2e32'; g.fillRect(0, 0, w, h); const r = rng(11); for (let i = 0; i < 14000; i++) { const v = 30 + r() * 46; g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 3) + ',.6)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); } for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(0,0,0,' + (r() * .18) + ')'; g.fillRect(r() * w, r() * h, 2 + r() * 6, 1 + r() * 3); } }, {srgb: true});
 t.asphalt.repeat.set(4, 4);
 /* the road's own marks, in the ribbon's own UV: u along the lap (one repeat = 24 m), v across the road */
 /* as on the real road: solid white edge lines, white dashed lane lines (three lanes), the odd yellow no-stopping line inside the kerb */
 t.lines = canvasTex(T, 256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(0, 5, w, 4); g.fillRect(0, h - 9, w, 4); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, h * .333 - 1.5, w * .3, 3); g.fillRect(w * .5, h * .667 - 1.5, w * .3, 3); g.fillStyle = 'rgba(255,214,0,.55)'; g.fillRect(0, 12, w, 2); });
 t.kerb = canvasTex(T, 256, 32, (g, w, h) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#e8e4dc' : '#d0232e'; g.fillRect(i * w / 4, 0, w / 4, h); } }, {srgb: true});
 t.fence = canvasTex(T, 128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(60,66,72,.9)'; g.lineWidth = 1.1; g.beginPath(); for (let i = 0; i <= w; i += 8) { g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); } g.stroke(); }, {srgb: true});
 t.windows = canvasTex(T, 256, 256, (g, w, h) => { g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h); const r = rng(23); for (let y = 6; y < h; y += 16) for (let x = 4; x < w; x += 12) { const on = r() < .42; g.fillStyle = on ? (r() < .5 ? '#ffe9b0' : '#cfe3ff') : '#101826'; g.fillRect(x, y, 7, 9); } });
 t.windows.repeat.set(1, 1);
 t.facade = canvasTex(T, 256, 256, (g, w, h) => { g.fillStyle = '#c9cfd4'; g.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 16) for (let x = 4; x < w; x += 12) { g.fillStyle = '#5b7a97'; g.fillRect(x, y, 7, 9); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, 7, 2); } for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, y, w, 2); } }, {srgb: true});
 /* the crowd: one row of people per band, shoulders and heads, 1024 px across a 34 m stand (a person every 45 cm) */
 t.crowd = canvasTex(T, 1024, 64, (g, w, h) => { g.fillStyle = '#2f343b'; g.fillRect(0, 0, w, h); const r = rng(31), cols = ['#ff6a13', '#f2f0ea', '#1f6fd0', '#d0232e', '#2b2f36', '#f5c542', '#7bd1a0', '#ffffff', '#ff6a13', '#4a4f58'], skin = ['#e8b48a', '#c98a5e', '#8a5a3c', '#f1c9a5', '#5c3a26'];
 for (let x = 2; x < w; x += 13) { const dy = r() * 10; const bw = 11 + r() * 3; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.moveTo(x, h); g.lineTo(x, 30 + dy); g.quadraticCurveTo(x + bw / 2, 20 + dy, x + bw, 30 + dy); g.lineTo(x + bw, h); g.closePath(); g.fill(); g.fillStyle = skin[Math.floor(r() * skin.length)]; g.beginPath(); g.arc(x + bw / 2, 16 + dy, 5.2, 0, TAU); g.fill(); if (r() < .3) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x + bw / 2 - 5.5, 9 + dy, 11, 4); } } }, {srgb: true});
 t.gantry = {};
 const banner = (key, w, h, draw) => { t.gantry[key] = canvasTex(T, w, h, draw, {srgb: true}); t.gantry[key].wrapS = t.gantry[key].wrapT = T.ClampToEdgeWrapping; };
 banner('coates', 2048, 256, (g, w, h) => { g.fillStyle = BLK; g.fillRect(0, 0, w, h); g.fillStyle = OR; g.fillRect(0, 0, w * .3, h); g.fillRect(w * .7, 0, w * .3, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = WH; g.font = brandFont(150); g.fillText('COATES', w * .15, h / 2); g.fillText('GC500', w * .85, h / 2); g.font = brandFont(120); g.fillText('WORKS THE WHOLE EVENT', w / 2, h * .42); g.font = '700 40px Inter,system-ui,sans-serif'; g.fillStyle = OR; g.fillText('HIRE · INSTALL · SERVICE · DEMOB', w / 2, h * .78); });
 banner('finals', 2048, 256, (g, w, h) => { g.fillStyle = WH; g.fillRect(0, 0, w, h); const cols = ['#e63b7a', '#f5a623', '#3aa0e6', '#c8102e', '#ffd166']; for (let i = 0; i < 26; i++) { g.strokeStyle = cols[i % cols.length]; g.lineWidth = 6; g.beginPath(); g.arc(80 + (i % 5) * 60, 60 + Math.floor(i / 5) * 40, 20 + (i % 3) * 9, 0, TAU); g.stroke(); g.beginPath(); g.arc(w - 80 - (i % 5) * 60, 60 + Math.floor(i / 5) * 40, 20 + (i % 3) * 9, 0, TAU); g.stroke(); } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c8102e'; g.font = brandFont(120); g.fillText('GOLD COAST 500', w * .3, h * .45); g.font = brandFont(112); g.fillText('THE FINALS START HERE', w * .72, h * .4); g.fillStyle = '#1b1f23'; g.font = '800 56px Inter,system-ui,sans-serif'; g.fillText('23 – 25 OCT 2026', w * .72, h * .78); g.font = '700 36px Inter,system-ui,sans-serif'; g.fillText('SURFERS PARADISE STREET CIRCUIT', w * .3, h * .8); });
 banner('city', 2048, 256, (g, w, h) => { g.fillStyle = '#e2336b'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = WH; g.font = '900 190px Inter,Arial Black,sans-serif'; g.fillText('GOLD COAST.', w / 2, h / 2); });
 banner('start', 2048, 256, (g, w, h) => { g.fillStyle = BLK; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? WH : BLK; g.fillRect(i * 32, j * 32, 32, 32); g.fillRect(w - 512 + i * 32, j * 32, 32, 32); } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = WH; g.font = brandFont(170); g.fillText('START · FINISH', w / 2, h * .42); g.fillStyle = OR; g.font = '700 44px Inter,system-ui,sans-serif'; g.fillText('COATES INDUSTRIAL SOLUTIONS · GC500 2026', w / 2, h * .8); });
 t.livery = X.makeLivery ? X.makeLivery(T) : null;
};

/* ---------- the circuit: centreline, widths and racing line from the key plan's ring ---------- */
function ptsOf(ring){ return ring.map(p => [(p[0] - X.cx) * M, (p[1] - X.cy) * M]); }
function polyLen(P){ let L = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; }
function resample(P, step){ const out = []; const n = P.length; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(d / step)); for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]); } return out; }
function nearestOnPoly(P, x, y){ let best = 1e18, bx = 0, by = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L2, 0, 1), px = a[0] + dx * t, py = a[1] + dy * t, d = (px - x) * (px - x) + (py - y) * (py - y); if (d < best) { best = d; bx = px; by = py; } } return [bx, by, Math.sqrt(best)]; }
function smoothArr(a, w){ const n = a.length, out = new Array(n); for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -w; k <= w; k++) { const j = (i + k + n) % n, g = Math.exp(-(k * k) / (2 * (w / 2) * (w / 2))); s += a[j] * g; c += g; } out[i] = s / c; } return out; }
X.buildTrack = function(C){
 const box = C.ring.box; X.cx = (box[0] + box[2]) / 2; X.cy = (box[1] + box[3]) / 2;
 const outer = ptsOf(C.ring.outer), inner = ptsOf(C.ring.inner);
 /* which is which: the longer polygon is the outside */
 const O = polyLen(outer) >= polyLen(inner) ? outer : inner, I = O === outer ? inner : outer;
 const step = 3, Os = resample(O, step), N = Os.length, ctr = [];
 for (let i = 0; i < N; i++) { const p = Os[i], q = nearestOnPoly(I, p[0], p[1]); ctr.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]); }
 /* the centreline is re-sampled evenly and smoothed a little: a street circuit's edges are drawn in short straight segments */
 const ctr2 = resample(ctr, 2.0), n = ctr2.length; const xs = smoothArr(ctr2.map(p => p[0]), 3), zs = smoothArr(ctr2.map(p => p[1]), 3);
 let P = xs.map((x, i) => [x, zs[i]]);
 /* THE ROAD'S WIDTH IS MEASURED, NOT THE KEY PLAN'S LINE WEIGHT. The ring is a schematic drawn with a fat stroke:
 its two contours sit 35 m apart, and a 4.9 m car on a 35 m road is a toy. circuit.roadWidth.width_m is the
 carriageway measured off the 2022 aerial at 546 stations round the lap (median 18.6 m, 10.4 m through the
 tight stuff). It is sampled by position round the lap from the outer contour's first point, the same origin
 this centreline starts from. No profile: the median stands. */
 const RW = C.roadWidth && C.roadWidth.width_m && C.roadWidth.width_m.length > 8 ? C.roadWidth.width_m : null;
 const medW = (C.roadWidth && C.roadWidth.profile_median_m) || 18.56;
 let halfAt = P.map((p, i) => { if (!RW) return medW / 2; const u = i / n * RW.length, a = Math.floor(u) % RW.length, b = (a + 1) % RW.length, f = u - Math.floor(u); return clamp((RW[a] + (RW[b] - RW[a]) * f) / 2, 4.5, 13.4); });
 /* the lap runs anticlockwise on the page, as the race does: the outside wall on the driver's right */
 let area2 = 0; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; area2 += a[0] * b[1] - b[0] * a[1]; }
 if (area2 > 0) { P.reverse(); halfAt.reverse(); }
 const hw = smoothArr(halfAt, 4);
 const s = new Float64Array(n + 1); for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; s[i + 1] = s[i] + Math.hypot(b[0] - a[0], b[1] - a[1]); } const L = s[n];
 const tan = P.map((p, i) => { const a = P[(i - 1 + n) % n], b = P[(i + 1) % n]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; });
 /* signed curvature (left turn positive when travelling along +s, seen from above) */
 const kap = P.map((p, i) => { const a = tan[(i - 2 + n) % n], b = tan[(i + 2) % n], ds = (s[(i + 2) % n] - s[(i - 2 + n) % n] + L) % L || 8; const cross = a[0] * b[1] - a[1] * b[0], dot = a[0] * b[0] + a[1] * b[1]; return Math.atan2(cross, dot) / ds; });
 const kapS = smoothArr(kap, 5);
 /* the racing line: to the inside through a corner, to the outside before and after it, then smoothed so the car never jinks */
 const eTarget = kapS.map((k, i) => { const ahead = kapS[(i + 12) % n], behind = kapS[(i - 12 + n) % n]; const room = hw[i] - 2.2; const apex = -Math.sign(k) * Math.min(1, Math.abs(k) / .012); const setup = (Math.abs(ahead) > Math.abs(k) * 1.4 ? Math.sign(ahead) * Math.min(1, Math.abs(ahead) / .012) : 0) * .7 + (Math.abs(behind) > Math.abs(k) * 1.4 ? Math.sign(behind) * Math.min(1, Math.abs(behind) / .012) : 0) * .5; return room * clamp(apex + setup, -1, 1) * .85; });
 const e = smoothArr(smoothArr(eTarget, 14), 8);
 /* speed: what the corner allows, then braking backwards and acceleration forwards */
 const vmax = 76, aLat = 15.5, aBrake = 13.5, ds = L / n;
 const vc = kapS.map(k => Math.min(vmax, Math.sqrt(aLat / Math.max(Math.abs(k), 1e-4))));
 const v = vc.slice(); for (let pass = 0; pass < 2; pass++) { for (let i = n - 1; i >= 0; i--) { const j = (i + 1) % n; v[i] = Math.min(v[i], Math.sqrt(v[j] * v[j] + 2 * aBrake * ds)); } for (let i = 0; i < n; i++) { const j = (i + 1) % n; const acc = 9.2 * (1 - .78 * v[i] / vmax); v[j] = Math.min(v[j], Math.sqrt(v[i] * v[i] + 2 * Math.max(1.2, acc) * ds)); } }
 const T = {P, hw, s, L, n, tan, kap: kapS, e, v, vmax, outer: O, inner: I, ds};
 T.idx = ss => { let x = ss % L; if (x < 0) x += L; const i = Math.floor(x / ds); return [Math.min(i, n - 1), (x - i * ds) / ds]; };
 T.at = (ss, arr) => { const [i, f] = T.idx(ss); const j = (i + 1) % n; return arr[i] + (arr[j] - arr[i]) * f; };
 T.pos = (ss, off) => { const [i, f] = T.idx(ss); const j = (i + 1) % n; const x = P[i][0] + (P[j][0] - P[i][0]) * f, z = P[i][1] + (P[j][1] - P[i][1]) * f; const tx = tan[i][0] + (tan[j][0] - tan[i][0]) * f, tz = tan[i][1] + (tan[j][1] - tan[i][1]) * f; const l = Math.hypot(tx, tz) || 1; const nx = -tz / l, nz = tx / l; const o = off || 0; return {x: x + nx * o, z: z + nz * o, tx: tx / l, tz: tz / l, nx, nz}; };
 /* the start-finish: the longest straight's middle third */
 let bestI = 0, bestRun = 0, run = 0; for (let i = 0; i < 2 * n; i++) { if (Math.abs(kapS[i % n]) < .0025) run++; else { if (run > bestRun) { bestRun = run; bestI = i - run; } run = 0; } }
 T.straight = {s0: (bestI % n) * ds, len: bestRun * ds}; T.startS = (T.straight.s0 + T.straight.len * .35) % L;
 /* the corners, by peak curvature: cameras and grandstands go there */
 const corners = []; for (let i = 0; i < n; i++) { const k = Math.abs(kapS[i]); if (k > .011 && k >= Math.abs(kapS[(i - 1 + n) % n]) && k >= Math.abs(kapS[(i + 1) % n])) corners.push({i, s: i * ds, k, sign: Math.sign(kapS[i])}); }
 corners.sort((a, b) => b.k - a.k); const picked = []; corners.forEach(c => { if (!picked.some(p => Math.abs(((p.s - c.s) % L + L * 1.5) % L - L / 2) > L / 2 - 90)) picked.push(c); });
 T.corners = picked.sort((a, b) => a.s - b.s);
 X.track = T; return T;
};

/* ---------- mesh helpers: a ribbon along the centreline with UVs (u along the lap, v across) ---------- */
function ribbon(T3, Tk, offA, offB, y, uScale, closed, ySlope){
 const n = Tk.n, pos = [], uv = [], idx = [];
 for (let i = 0; i <= n; i++) { const k = i % n, ss = i * Tk.ds; const a = typeof offA === 'function' ? offA(k) : offA, b = typeof offB === 'function' ? offB(k) : offB; const p = Tk.pos(ss, 0);
 const ya = typeof y === 'function' ? y(k, 0) : y, yb = typeof y === 'function' ? y(k, 1) : (ySlope != null ? y + ySlope : y);
 pos.push(p.x + p.nx * a, ya, p.z + p.nz * a, p.x + p.nx * b, yb, p.z + p.nz * b); uv.push(ss / uScale, 0, ss / uScale, 1);
 if (i < n) { const q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
 const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function wallBox(T3, Tk, off, y0, y1, thick, uScale, every){
 /* a run of concrete blocks along one edge: top and both faces, u along the lap so a hoarding repeats every `uScale` metres */
 const n = Tk.n, pos = [], uv = [], nor = [], idx = []; let vi = 0;
 const push = (x, y, z, u, v, nx, ny, nz) => { pos.push(x, y, z); uv.push(u, v); nor.push(nx, ny, nz); return vi++; };
 for (let i = 0; i <= n; i++) { const k = i % n, ss = i * Tk.ds, o = typeof off === 'function' ? off(k) : off, p = Tk.pos(ss, 0), sgn = o < 0 ? -1 : 1;
 const ix = p.x + p.nx * o, iz = p.z + p.nz * o, ox = p.x + p.nx * (o + sgn * thick), oz = p.z + p.nz * (o + sgn * thick), u = ss / uScale;
 /* the words read left to right from where they are seen: on the outside wall's track face the lap runs to the
 viewer's left, so u runs backwards there (and forwards on its back face); the inside wall is the reverse */
 const uT = sgn > 0 ? -u : u, uB = -uT;
 /* track face */ push(ix, y0, iz, uT, 0, -p.nx * sgn, 0, -p.nz * sgn); push(ix, y1, iz, uT, 1, -p.nx * sgn, 0, -p.nz * sgn);
 /* top */ push(ix, y1, iz, u, 0, 0, 1, 0); push(ox, y1, oz, u, 1, 0, 1, 0);
 /* back face */ push(ox, y1, oz, uB, 1, p.nx * sgn, 0, p.nz * sgn); push(ox, y0, oz, uB, 0, p.nx * sgn, 0, p.nz * sgn);
 if (i < n) { const q = i * 6; for (let f = 0; f < 3; f++) { const a = q + f * 2, b = a + 1, c = a + 6, d = a + 7; if ((f === 0) === (sgn > 0)) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); } } }
 const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
function mergeGeoms(T3, list){
 let np = 0, ni = 0; list.forEach(g => { np += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
 const pos = new Float32Array(np * 3), nor = new Float32Array(np * 3), uv = new Float32Array(np * 2), col = new Float32Array(np * 3), idx = new Uint32Array(ni); let po = 0, io = 0, base = 0;
 list.forEach(g => { const P = g.attributes.position, Nn = g.attributes.normal, U = g.attributes.uv, Cc = g.attributes.color, c = P.count;
 pos.set(P.array.subarray(0, c * 3), po * 3); if (Nn) nor.set(Nn.array.subarray(0, c * 3), po * 3); if (U) uv.set(U.array.subarray(0, c * 2), po * 2);
 if (Cc) col.set(Cc.array.subarray(0, c * 3), po * 3); else for (let i = 0; i < c * 3; i++) col[po * 3 + i] = 1;
 if (g.index) { const I = g.index.array; for (let i = 0; i < I.length; i++) idx[io + i] = I[i] + base; io += I.length; } else { for (let i = 0; i < c; i++) idx[io + i] = i + base; io += c; }
 po += c; base += c; });
 const out = new T3.BufferGeometry(); out.setAttribute('position', new T3.BufferAttribute(pos, 3)); out.setAttribute('normal', new T3.BufferAttribute(nor, 3)); out.setAttribute('uv', new T3.BufferAttribute(uv, 2)); out.setAttribute('color', new T3.BufferAttribute(col, 3)); out.setIndex(new T3.BufferAttribute(idx, 1)); return out;
}
function box(T3, w, h, d, x, y, z, ry, color){ const g = new T3.BoxGeometry(w, h, d); g.rotateY(ry || 0); g.translate(x, y, z); if (color) { const c = new T3.Color(color), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new T3.BufferAttribute(a, 3)); } return g; }
function colorGeom(T3, g, color){ const c = new T3.Color(color), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new T3.BufferAttribute(a, 3)); return g; }
/* a flat polygon on the ground from sheet points */
function flatPoly(T3, pts, y, color){ if (pts.length < 3) return null; const shape = new T3.Shape(pts.map(p => new T3.Vector2(p[0], -p[1]))); const g = new T3.ShapeGeometry(shape); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return colorGeom(T3, g, color); }
function packPts(pk, a, from){ const o = []; for (let i = from || 0; i + 1 < a.length; i += 2) o.push([((a[i] * pk.unit + pk.ox) - X.cx) * M, ((a[i + 1] * pk.unit + pk.oy) - X.cy) * M]); return o; }
function polyRibbon(T3, pts, width, y, color){ const n = pts.length; if (n < 2) return null; const pos = [], idx = []; for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const nx = -dz * width / 2, nz = dx * width / 2; pos.push(pts[i][0] + nx, y, pts[i][1] + nz, pts[i][0] - nx, y, pts[i][1] - nz); if (i < n - 1) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } } const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return colorGeom(T3, g, color); }

/* ---------- build everything ---------- */
X.buildWorld = function(S){
 const T3 = X.THREE, C = DATA.circuit, pk = S.pack, look = S.look, Q = S.quality;
 X.makeTextures(T3);
 const Tk = X.buildTrack(C), W = {group: new T3.Group(), lamps: [], gantries: [], cams: [], floods: []};
 const add = (geom, mat, name, opts) => { if (!geom) return null; const m = new T3.Mesh(geom, mat); m.name = name; if (opts && opts.shadow) { m.castShadow = true; } m.receiveShadow = !(opts && opts.noReceive); W.group.add(m); return m; };
 const std = (o) => new T3.MeshStandardMaterial(Object.assign({vertexColors: true, roughness: .85, metalness: .05}, o || {}));
 /* the ground: a wide plane, then park, beach and water from OpenStreetMap */
 add(colorGeom(T3, new T3.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2).translate(0, -.12, 0), '#6e7a63'), std({roughness: 1}), 'ground');
 if (pk) {
 const flats = [];
 (pk.park || []).forEach(a => { const g = flatPoly(T3, packPts(pk, a), -.08, '#5e8a4a'); if (g) flats.push(g); });
 (pk.beach || []).forEach(a => { const g = flatPoly(T3, packPts(pk, a), -.06, '#e9d8a6'); if (g) flats.push(g); });
 if (flats.length) add(mergeGeoms(T3, flats), std({roughness: 1}), 'parks');
 const water = []; (pk.water || []).forEach(a => { const g = flatPoly(T3, packPts(pk, a), -.05, '#2b6f9e'); if (g) water.push(g); });
 if (water.length) { W.water = add(mergeGeoms(T3, water), new T3.MeshStandardMaterial({vertexColors: true, roughness: .12, metalness: .55, transparent: true, opacity: .96}), 'water', {noReceive: true}); }
 const roads = []; const RW = [12, 9, 7.5, 6, 4.5]; (pk.roads || []).forEach(a => { const g = polyRibbon(T3, packPts(pk, a, 1), RW[a[0]] || 6, -.02, '#4a4d52'); if (g) roads.push(g); });
 if (roads.length) add(mergeGeoms(T3, roads), std({roughness: .95, side: T3.DoubleSide}), 'roads');
 (pk.pit || []).forEach(a => { const g = polyRibbon(T3, packPts(pk, a, 1), 10, .01, '#5a5e64'); if (g) add(g, std({roughness: .9, side: T3.DoubleSide}), 'pit'); });
 }
 /* the circuit itself: asphalt with lane marks, in the ribbon's own UVs */
 const road = ribbon(T3, Tk, k => -Tk.hw[k], k => Tk.hw[k], .02, 24);
 const roadMat = new T3.MeshStandardMaterial({map: X.tex.asphalt, roughness: .78, metalness: .06, color: 0xffffff, side: T3.DoubleSide});
 W.road = add(road, roadMat, 'circuit'); W.road.receiveShadow = true;
 /* second UV set for the line overlay: u along the lap (one repeat = 24 m), v across (0..1) */
 const lines = ribbon(T3, Tk, k => -Tk.hw[k], k => Tk.hw[k], .035, 24);
 add(lines, new T3.MeshBasicMaterial({map: X.tex.lines, transparent: true, depthWrite: false, opacity: .9, side: T3.DoubleSide}), 'lines', {noReceive: true});
 /* kerbs through the corners, both edges */
 const kerbs = []; const kerbOn = k => Math.abs(Tk.kap[k]) > .0075; let runStart = -1;
 for (let side = -1; side <= 1; side += 2) { for (let i = 0; i <= Tk.n; i++) { const on = i < Tk.n && kerbOn(i); if (on && runStart < 0) runStart = i; if (!on && runStart >= 0) { const a = runStart, b = i; runStart = -1; if (b - a < 6) continue; const pos = [], uv = [], idx = []; for (let j = a; j <= b; j++) { const k = j % Tk.n, p = Tk.pos(j * Tk.ds, 0), o1 = side * (Tk.hw[k] - .05), o2 = side * (Tk.hw[k] + 1.1); pos.push(p.x + p.nx * o1, .045, p.z + p.nz * o1, p.x + p.nx * o2, .09, p.z + p.nz * o2); uv.push(j * Tk.ds / 2.4, 0, j * Tk.ds / 2.4, 1); if (j < b) { const q = (j - a) * 2; if (side > 0) idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); else idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } } const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); kerbs.push(g); } } }
 if (kerbs.length) add(mergeGeoms(T3, kerbs), new T3.MeshStandardMaterial({map: X.tex.kerb, roughness: .7, side: T3.DoubleSide}), 'kerbs');
 /* concrete barriers both sides, the hoarding on the track face; the outside wall carries the words, the inside is plain grey and black */
 const wallOut = wallBox(T3, Tk, k => Tk.hw[k] + 1.35, 0, 1.0, .55, 64), wallIn = wallBox(T3, Tk, k => -(Tk.hw[k] + 1.35), 0, 1.0, .55, 8);
 add(wallOut, new T3.MeshStandardMaterial({map: X.tex.hoard, roughness: .6, side: T3.DoubleSide}), 'wall-outer', {shadow: Q.shadows});
 add(wallIn, new T3.MeshStandardMaterial({map: X.tex.concrete, roughness: .95, color: 0x8a8f94, side: T3.DoubleSide}), 'wall-inner', {shadow: Q.shadows});
 /* debris fencing on top of both walls: posts every 4 m, mesh between */
 if (Q.fence) {
 const fenceOut = ribbon(T3, Tk, k => Tk.hw[k] + 1.6, k => Tk.hw[k] + 1.6, (k, side) => side ? 3.9 : 1.0, 4), fenceIn = ribbon(T3, Tk, k => -(Tk.hw[k] + 1.6), k => -(Tk.hw[k] + 1.6), (k, side) => side ? 3.9 : 1.0, 4);
 const fm = new T3.MeshStandardMaterial({map: X.tex.fence, transparent: true, alphaTest: .15, side: T3.DoubleSide, roughness: .5, metalness: .6, color: 0xffffff, depthWrite: false});
 add(fenceOut, fm, 'fence-outer', {noReceive: true}); add(fenceIn, fm, 'fence-inner', {noReceive: true});
 const posts = []; for (let ss = 0; ss < Tk.L; ss += 4) { for (let side = -1; side <= 1; side += 2) { const p = Tk.pos(ss, side * (Tk.at(ss, Tk.hw) + 1.6)); posts.push(box(T3, .09, 3.0, .09, p.x, 2.5, p.z, Math.atan2(p.tx, p.tz), '#a7adb3')); } }
 /* the top rail the panels hang from */
 posts.push(colorGeom(T3, ribbon(T3, Tk, k => Tk.hw[k] + 1.57, k => Tk.hw[k] + 1.63, 4.9, 4), '#eef1f3')); posts.push(colorGeom(T3, ribbon(T3, Tk, k => -(Tk.hw[k] + 1.63), k => -(Tk.hw[k] + 1.57), 4.9, 4), '#eef1f3'));
 add(mergeGeoms(T3, posts), std({metalness: .25, roughness: .5, side: T3.DoubleSide}), 'posts');
 }
 /* the gantries over the straights, the start-finish gantry, the pink city bridge */
 /* yaw so a box's own x runs along the lap (yawAlong) or across it (yawAcross); three.js rotateY sends local +x to (cos, -sin) */
 const yawAlong = p => Math.atan2(-p.tz, p.tx), yawAcross = p => Math.atan2(-p.tx, -p.tz);
 const gantryAt = (ss, key, h) => { const hw = Tk.at(ss, Tk.hw) + 2.4, p = Tk.pos(ss, 0), ry = yawAcross(p); const parts = []; const H = h || 7.2;
 /* white truss towers each side, as the real gantries are built: two legs a metre apart along the lap, rungs and diagonals between */
 for (let side = -1; side <= 1; side += 2) { const q = Tk.pos(ss, side * hw); for (let d = -1; d <= 1; d += 2) parts.push(box(T3, .22, H, .22, q.x + p.tx * d * .55, H / 2, q.z + p.tz * d * .55, yawAlong(p), '#e6e9eb'));
 for (let y = .8; y < H - .3; y += 1.0) { parts.push(box(T3, 1.1, .07, .07, q.x, y, q.z, yawAlong(p), '#cfd4d8')); const dg = box(T3, 1.3, .06, .06, q.x, y + .5, q.z, yawAlong(p), '#cfd4d8'); parts.push(dg); } }
 const beam = box(T3, hw * 2 + 1, .35, .8, p.x, H - .2, p.z, ry, '#d9dde0'); parts.push(beam);
 add(mergeGeoms(T3, parts), std({metalness: .35, roughness: .5}), 'gantry-frame', {shadow: Q.shadows});
 /* the banner: one face towards the cars coming at it, a second on the back so it also reads once passed */
 const mat = new T3.MeshStandardMaterial({map: X.tex.gantry[key], roughness: .55, side: T3.FrontSide, emissive: 0xffffff, emissiveMap: X.tex.gantry[key], emissiveIntensity: look.day ? 0 : .35});
 const bm = new T3.Mesh(new T3.PlaneGeometry(hw * 2, 2.2), mat); bm.position.set(p.x - p.tx * .05, H - 1.5, p.z - p.tz * .05); bm.rotation.y = ry; bm.name = 'gantry-banner'; W.group.add(bm);
 const bb = new T3.Mesh(new T3.PlaneGeometry(hw * 2, 2.2), mat); bb.position.set(p.x + p.tx * .05, H - 1.5, p.z + p.tz * .05); bb.rotation.y = ry + Math.PI; bb.name = 'gantry-banner-back'; W.group.add(bb);
 W.gantries.push({s: ss, mesh: bm}); return bm; };
 const st = Tk.straight; gantryAt(Tk.startS, 'start', 8);
 const others = [['finals', .82], ['coates', .12]]; others.forEach(([key, f]) => gantryAt((st.s0 + st.len * f) % Tk.L, key));
 /* other straights get the Coates banner too, and one gets the city bridge */
 { let n2 = 0; let run = 0, cnt = 0; for (let i = 0; i < Tk.n; i++) { if (Math.abs(Tk.kap[i]) < .003) run++; else { if (run * Tk.ds > 140) { const mid = (i - run / 2) * Tk.ds; const inStart = Math.abs(((mid - Tk.straight.s0 - Tk.straight.len / 2) % Tk.L + Tk.L * 1.5) % Tk.L - Tk.L / 2) < Tk.straight.len; if (!inStart) { gantryAt(mid, cnt % 2 ? 'coates' : 'city', cnt % 2 ? 7.2 : 6.4); cnt++; n2++; } } run = 0; } if (n2 >= 3) break; } }
 /* street lights along the outside every 45 m, floodlights at the corners */
 { const poles = []; for (let ss = 12; ss < Tk.L; ss += 45) { const p = Tk.pos(ss, Tk.at(ss, Tk.hw) + 3.2), ry = Math.atan2(p.tx, p.tz); poles.push(box(T3, .22, 10, .22, p.x, 5, p.z, 0, '#9aa1a8')); const ax = p.x - p.nx * 2.2, az = p.z - p.nz * 2.2; poles.push(box(T3, 4.4, .12, .12, (p.x + ax) / 2, 9.9, (p.z + az) / 2, Math.atan2(p.nx, p.nz) + Math.PI / 2, '#9aa1a8')); W.lamps.push([ax, 9.8, az]); }
 Tk.corners.slice(0, 8).forEach(c => { const p = Tk.pos(c.s, -c.sign * (Tk.at(c.s, Tk.hw) + 6)); poles.push(box(T3, .5, 22, .5, p.x, 11, p.z, 0, '#8b939a')); poles.push(box(T3, 4, 1.2, .6, p.x, 22, p.z, yawAlong(p), '#2a2e33')); W.floods.push({pos: [p.x, 22.3, p.z], at: [Tk.pos(c.s, 0).x, 0, Tk.pos(c.s, 0).z]}); });
 add(mergeGeoms(T3, poles), std({metalness: .4, roughness: .5}), 'poles');
 const heads = new T3.InstancedMesh(new T3.SphereGeometry(.28, 8, 6), new T3.MeshStandardMaterial({color: 0xfff3d0, emissive: 0xffe6a8, emissiveIntensity: look.day ? .1 : 2.2, roughness: .3}), W.lamps.length + W.floods.length * 3);
 const mtx = new T3.Matrix4(); let hi = 0; W.lamps.forEach(l => { mtx.makeTranslation(l[0], l[1], l[2]); heads.setMatrixAt(hi++, mtx); }); W.floods.forEach(f => { for (let k = -1; k <= 1; k++) { mtx.makeTranslation(f.pos[0] + k * 1.2, f.pos[1], f.pos[2]); heads.setMatrixAt(hi++, mtx); } }); heads.name = 'lamp-heads'; W.group.add(heads); W.lampHeads = heads; }
 /* grandstands at the corners, named by the fencing schedule; marquees in the paddock; palms along the outside */
 { const stands = [], names = (C.stands && C.stands.names) || []; Tk.corners.slice(0, Math.max(4, Math.min(8, names.length))).forEach((c, i) => { const off = Tk.at(c.s, Tk.hw) + 9 + 6; const p0 = Tk.pos(c.s, -c.sign * off); const ry = yawAlong(p0); for (let row = 0; row < 7; row++) { const p = Tk.pos(c.s, -c.sign * (off + row * 1.5)); stands.push(colorGeom(T3, new T3.BoxGeometry(34, .5 + row * .45, 1.5).rotateY(ry).translate(p.x, (.5 + row * .45) / 2, p.z), row % 2 ? '#3a4048' : '#464c55')); } const roofP = Tk.pos(c.s, -c.sign * (off + 6)); stands.push(colorGeom(T3, new T3.BoxGeometry(36, .25, 13).rotateY(ry).translate(roofP.x, 5.2, roofP.z), '#e8e8e6')); for (let k = -1; k <= 1; k += 2) { const q = Tk.pos(c.s + k * 17, -c.sign * (off + 9)); stands.push(box(T3, .3, 5.2, .3, q.x, 2.6, q.z, 0, '#c9ced2')); } W.cams.push({s: c.s, side: -c.sign, name: names[i] || ('S' + (i + 1))}); });
 if (stands.length) add(mergeGeoms(T3, stands), std({roughness: .8}), 'stands', {shadow: Q.shadows});
 /* the crowd on the stands: a band of people per row, leaning back a little, facing the track */
 const crowd = []; Tk.corners.slice(0, Math.max(4, Math.min(8, names.length))).forEach(c => { const off = Tk.at(c.s, Tk.hw) + 15; for (let row = 0; row < 7; row++) { const p = Tk.pos(c.s, -c.sign * (off + row * 1.5)); const g = new T3.PlaneGeometry(34, 1.1); g.rotateX(-.3); g.rotateY(yawAlong(p) + (c.sign < 0 ? Math.PI : 0)); g.translate(p.x, .5 + row * .45 + .6, p.z); crowd.push(g); } });
 if (crowd.length) add(mergeGeoms(T3, crowd), new T3.MeshStandardMaterial({map: X.tex.crowd, roughness: 1, side: T3.DoubleSide}), 'crowd', {noReceive: true});
 const tents = []; const r = rng(5); for (let i = 0; i < 14; i++) { const ss = (Tk.straight.s0 + 60 + i * 22) % Tk.L, p = Tk.pos(ss, -(Tk.at(ss, Tk.hw) + 14 + r() * 6)); const g = new T3.ConeGeometry(4.2, 3.2, 4); g.rotateY(Math.PI / 4 + yawAlong(p)); g.translate(p.x, 4.6, p.z); tents.push(colorGeom(T3, g, '#f4f4f0')); tents.push(box(T3, 6, 3, 6, p.x, 1.5, p.z, yawAlong(p), '#f0f0ec')); }
 add(mergeGeoms(T3, tents), std({roughness: .9}), 'marquees', {shadow: Q.shadows});
 if (Q.palms) { const trunks = [], fronds = []; const r2 = rng(9); for (let ss = 30; ss < Tk.L; ss += 26) { if (r2() < .35) continue; const side = r2() < .6 ? 1 : -1; const p = Tk.pos(ss, side * (Tk.at(ss, Tk.hw) + 7 + r2() * 4)); const h = 7 + r2() * 5; trunks.push(colorGeom(T3, new T3.CylinderGeometry(.18, .3, h, 6).translate(p.x, h / 2, p.z), '#7a6a52')); for (let f = 0; f < 7; f++) { const g = new T3.PlaneGeometry(4.2, 1.1); g.translate(2.1, 0, 0); g.rotateZ(-.55); g.rotateY(f * TAU / 7 + r2()); g.translate(p.x, h, p.z); fronds.push(colorGeom(T3, g, '#3e7a3a')); } }
 if (trunks.length) { add(mergeGeoms(T3, trunks), std({roughness: 1}), 'palm-trunks', {shadow: Q.shadows}); add(mergeGeoms(T3, fronds), new T3.MeshStandardMaterial({vertexColors: true, side: T3.DoubleSide, roughness: 1}), 'palm-fronds', {noReceive: true}); } } }
 /* Surfers Paradise: the real buildings, walls with a window texture (lit at night), flat roofs; two cranes on the tallest under construction */
 if (pk && pk.b && pk.b.length) {
 const walls = [], roofs = []; let tallest = null; const rr = rng(17);
 pk.b.forEach((b, bi) => { const hm = Math.max(3.5, b[0] * pk.unit * M); const pts = packPts(pk, b, 2); if (pts.length < 3) return; const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length; if (Math.hypot(cx, cz) > 2600) return;
 const tone = .72 + rr() * .28, col = [tone, tone * (.97 + rr() * .03), tone * (.94 + rr() * .06)];
 const pos = [], uv = [], nor = [], idx = [], cols = []; let vi = 0, per = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], c = pts[(i + 1) % pts.length]; const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1; const nx = dz / l, nz = -dx / l; const u0 = per / 3.2, u1 = (per + l) / 3.2, v1 = hm / 3.4; per += l;
 pos.push(a[0], 0, a[1], c[0], 0, c[1], c[0], hm, c[1], a[0], hm, a[1]); uv.push(u0, 0, u1, 0, u1, v1, u0, v1); for (let k = 0; k < 4; k++) { nor.push(nx, 0, nz); cols.push(col[0], col[1], col[2]); } idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4; }
 const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(cols, 3)); g.setIndex(idx); walls.push(g);
 const roof = flatPoly(T3, pts, hm, '#' + [Math.round(tone * 130).toString(16).padStart(2, '0'), Math.round(tone * 132).toString(16).padStart(2, '0'), Math.round(tone * 136).toString(16).padStart(2, '0')].join('')); if (roof) roofs.push(roof);
 if (!tallest || hm > tallest.h) tallest = {h: hm, cx, cz}; });
 /* the walls are split into a few meshes so frustum culling can drop the far side of town */
 const chunk = 360; for (let i = 0; i < walls.length; i += chunk) { const m = add(mergeGeoms(T3, walls.slice(i, i + chunk)), new T3.MeshStandardMaterial({vertexColors: true, map: X.tex.facade, emissiveMap: X.tex.windows, emissive: 0xffffff, emissiveIntensity: look.windows * .9, roughness: .55, metalness: .15}), 'buildings-' + i, {shadow: Q.shadows && Q.name !== 'balanced'}); W.buildings = W.buildings || []; W.buildings.push(m); }
 if (roofs.length) add(mergeGeoms(T3, roofs), std({roughness: .9}), 'roofs');
 if (tallest) { const cr = []; for (let k = 0; k < 2; k++) { const x = tallest.cx + (k ? 26 : -18), z = tallest.cz + (k ? -14 : 20), h = tallest.h + 38 + k * 12; cr.push(box(T3, 1.6, h, 1.6, x, h / 2, z, 0, '#d8d3c4')); cr.push(box(T3, 46, 1.2, 1.4, x + 12, h, z, k * .9, '#d8d3c4')); cr.push(box(T3, .12, h * .55, .12, x + 30, h - h * .28, z, 0, '#555')); } add(mergeGeoms(T3, cr), std({roughness: .8}), 'cranes'); }
 }
 /* the sky: a big dome with a vertical gradient, stars by night; the sun as a soft disc */
 { const skyG = new T3.SphereGeometry(4200, 24, 12), skyM = new T3.ShaderMaterial({side: T3.BackSide, depthWrite: false, uniforms: {top: {value: new T3.Color(look.sky[0])}, mid: {value: new T3.Color(look.sky[1])}, bot: {value: new T3.Color(look.sky[2])}, stars: {value: look.stars}, sunDir: {value: new T3.Vector3(0, 1, 0)}, sunCol: {value: new T3.Color(look.sun.col)}},
 vertexShader: 'varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
 fragmentShader: 'uniform vec3 top, mid, bot, sunDir, sunCol; uniform float stars; varying vec3 vW; float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); } void main(){ vec3 d = normalize(vW); float h = clamp(d.y, -0.05, 1.0); vec3 c = h < 0.18 ? mix(bot, mid, smoothstep(-0.05, 0.18, h)) : mix(mid, top, smoothstep(0.18, 1.0, h)); float sd = max(0.0, dot(d, normalize(sunDir))); c += sunCol * (pow(sd, 900.0) * 3.0 + pow(sd, 18.0) * 0.18); if (stars > 0.0) { vec2 g = floor(d.xz / max(0.02, d.y + 0.2) * 90.0); float st = step(0.995, hash(g)) * smoothstep(0.05, 0.3, d.y); c += vec3(st) * stars * 0.9; } gl_FragColor = vec4(c, 1.0); }'});
 W.sky = new T3.Mesh(skyG, skyM); W.sky.name = 'sky'; W.group.add(W.sky); }
 S.world = W; S.scene.add(W.group);
 return W;
};
})();
