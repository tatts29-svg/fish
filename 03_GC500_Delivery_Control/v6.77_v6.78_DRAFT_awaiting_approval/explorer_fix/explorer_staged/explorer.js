'use strict';
/* GC500 Satellite Plan Explorer — Coates Industrial Solutions | GC500 2026.
   ONE CAMERA. Everything is drawn in the drawing's own coordinate space (PDF points, 2384 x 1684, y down): the satellite
   tiles are pulled into that space through the registration affine, the drawing's vectors are rendered from source at
   the screen's resolution (the original viewer's renderer, kept), search highlights and the export use the same chain.
   The satellite is a basemap under the drawing. It is fetched only for the visible view, only in the satellite modes,
   through a bounded cache, and nothing is drawn unless something changed. */
const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('display'), ctx = canvas.getContext('2d', {alpha: false}), mcanvas = $('marks'), mctx = mcanvas.getContext('2d');
const SHEET_W = 2384, SHEET_H = 1684, MAX_Z = 640, MIN_Z = .5, NS = 'http://www.w3.org/2000/svg';
const PHONE = matchMedia('(max-width:900px)').matches || /Android|iPhone|iPad/.test(navigator.userAgent);
let P = null, preview = null, ready = false, sw = 1, sh = 1, dpr = 1, dprFull = 1, fitScale = 1, interacting = false, restTimer = 0;
let camera = {cx: 1192, cy: 842, z: 1, rot: 0}, highlight = null, mode = 'original', opacity = 1, bright = 1, insetOn = true, legendOn = true;
let paintID = 0, revision = 0, lastQueryCount = 0;
let exporting = false, boxMode = false, boxStart = null, pinch = null, pointers = new Map(), gestureStart = null, lastTap = null, toastTimer = 0, lastSearch = [];
let GEO = null, UNDERLAY = new Set(), mapKey = null, keyState = 'unknown';
let PYR = null, PYR_MAX = -Infinity, UNDER = [], REG = null, ITEMS = [], marks = [], selected = null, pulseT0 = 0, pulseRAF = 0;                       /* the pre-rendered drawing pyramid; the sheet's aerial patches */
const underImgs = new Map();
const perf = {sceneMs: 0, tilesFetched: 0, tileBytes: 0, frames: 0, frameMs: 0, lastRender: null, vtRendered: 0};
window.__perf = perf;
const regions = [
 {name: 'Macintosh Island', sub: 'Island facilities and event layout', rect: [380, 520, 1110, 1090]},
 {name: 'Pit lane and paddock', sub: 'Pit lane on the master', rect: [590, 525, 1320, 985]},
 {name: 'Main Beach', sub: 'Cable Street and Pacific Street', rect: [45, 300, 480, 990]},
 {name: 'Beachfront circuit', sub: 'Main Beach Parade', rect: [475, 250, 1760, 620]},
 {name: 'Surfers Paradise', sub: 'Right-hand side of the main plan', rect: [1580, 175, 2350, 810]},
 {name: 'Inset plan', sub: 'Original lower-right drawing', rect: [1455, 855, 2340, 1470]},
 {name: 'Legend and drawing details', sub: 'Symbols, credits and revision', rect: [44, 1473, 2340, 1645]}];
$('jumps').innerHTML = regions.map((r, i) => `<button class="jump" data-region="${i}"><span><b>${r.name}</b><small>${r.sub}</small></span></button>`).join('');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
function toast(s, ms = 4000) { $('toast').textContent = s; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), ms); }
function quality(type, text) { $('qual').className = 'qual ' + type; $('qualText').textContent = text; }
/* sheet -> device: centre the camera, rotate, scale, in that order; every layer uses this one chain */
function sheetToDevice(scaleDev, W, H, cx = camera.cx, cy = camera.cy, rot = camera.rot) { const r = rot * Math.PI / 180, c = Math.cos(r), si = Math.sin(r), a = scaleDev * c, b = scaleDev * si; return [a, b, -b, a, W / 2 - a * cx + b * cy, H / 2 - b * cx - a * cy]; }
function invertM(m) { const [a, b, c, d, e, f] = m, det = a * d - b * c; return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]; }
function applyM(m, x, y) { return {x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5]}; }
function currentView() { const scale = fitScale * camera.z, M = sheetToDevice(scale, sw, sh), I = invertM(M), cs = [applyM(I, 0, 0), applyM(I, sw, 0), applyM(I, 0, sh), applyM(I, sw, sh)];
  const x0 = Math.min(...cs.map(p => p.x)), y0 = Math.min(...cs.map(p => p.y)), x1 = Math.max(...cs.map(p => p.x)), y1 = Math.max(...cs.map(p => p.y)); return {x: x0, y: y0, w: x1 - x0, h: y1 - y0, scale, corners: cs}; }
function screenToSource(x, y) { return applyM(invertM(sheetToDevice(fitScale * camera.z, sw, sh)), x, y); }
function stagePoint(e) { const r = stage.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }
function setLabel(s) { $('viewName').textContent = s; }
function resize() {
  const rect = stage.getBoundingClientRect(); sw = Math.max(1, Math.round(rect.width)); sh = Math.max(1, Math.round(rect.height));
  dprFull = Math.min(window.devicePixelRatio || 1, PHONE ? 2 : 3);             /* crisp where the device can pay for it */
  const maxPixels = PHONE ? 6e6 : 14e6; dprFull = Math.min(dprFull, Math.sqrt(maxPixels / (sw * sh)));
  fitScale = Math.max(.025, Math.min((sw - 30) / SHEET_W, (sh - 30) / SHEET_H));
  applyDpr(); changeView(false);
}
/* ---------------------------------------------------------------- the satellite layer */
const TILE = 512, tiles = new Map(), TILE_CAP = PHONE ? 60 : 140, inflight = new Map(); let queue = [], running = 0, tileGen = 0;
/* a tile that fails (404, 503, no network) is tried again after 2, 4, 8, 16, 30 s, then every 30 s while it is in view;
   the count survives eviction. satState says what the last frame saw: '' fine, 'partial' some failed, 'down' none arrived */
const tileTries = new Map(); let satState = '', satWhy = '', retryTimer = 0;
function tileRetryAt(key) { const n = tileTries.get(key) || 1; return performance.now() + Math.min(30000, 1000 * Math.pow(2, n)); }
function mat(m) { return m; }                                                    /* 3x3 row-major arrays from georeferencing.json */
function mul(a, b) { const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j]; return r; }
function inv(m) { const [[a, b, c], [d, e, f]] = m, det = a * e - b * d; return [[e / det, -b / det, (b * f - c * e) / det], [-d / det, a / det, (c * d - a * f) / det], [0, 0, 1]]; }
function ap(m, x, y) { return [m[0][0] * x + m[0][1] * y + m[0][2], m[1][0] * x + m[1][1] * y + m[1][2]]; }
function regionsForTiles() {
  if (!GEO) return [];
  const out = [{key: 'main', M: GEO.main.sheet_to_z18px, rect: GEO.main.sheet_region_pts, holes: insetOn ? GEO.main.exclude_pts : []}];
  if (insetOn) out.push({key: 'inset', M: GEO.inset.sheet_to_z18px, rect: GEO.inset.sheet_region_pts, holes: []});
  return out;
}
function tileZoomFor(v, M) {
  const k = Math.hypot(M[0][0], M[0][1]);                                        /* z18 px per sheet pt */
  const devPerPt = v.scale * dpr, want = 18 + Math.log2(devPerPt / k);           /* one device px per tile px */
  return {z: clamp(Math.round(want), 12, 19), over: want > 19.35};
}
function tileKey(z, x, y) { return z + '/' + x + '/' + y; }
function requestTile(z, x, y, prio) {
  const key = tileKey(z, x, y); if (tiles.has(key) || inflight.has(key)) return;
  queue.push({z, x, y, key, prio, gen: tileGen}); pump();
}
function pump() {
  queue.sort((a, b) => a.prio - b.prio);
  while (running < 8 && queue.length) {
    const t = queue.shift(); if (t.gen !== tileGen) continue; running++;
    const ac = new AbortController(); inflight.set(t.key, ac);
    const url = `https://api.mapbox.com/v4/mapbox.satellite/${t.z}/${t.x}/${t.y}@2x.jpg90?access_token=${encodeURIComponent(mapKey)}`;
    fetch(url, {signal: ac.signal, cache: tileTries.has(t.key) ? 'reload' : 'force-cache'}).then(r => { if (!r.ok) throw new Error('tile ' + r.status); perf.tileBytes += +(r.headers.get('content-length') || 0); return r.blob(); })
      .then(b => createImageBitmap(b)).then(bm => { tiles.set(t.key, {bm, at: performance.now()}); tileTries.delete(t.key); perf.tilesFetched++; evict(); requestPaint(); })
      .catch(e => { if (e.name !== 'AbortError') { tileTries.set(t.key, (tileTries.get(t.key) || 0) + 1); const at = tileRetryAt(t.key); tiles.set(t.key, {bm: null, at: performance.now(), err: String(e), retryAt: at}); satWhy = String(e);
        requestPaint(); if (/401|403/.test(String(e))) keyProblem(); } })
      .finally(() => { inflight.delete(t.key); running--; pump(); });
  }
}
function evict() { if (tiles.size <= TILE_CAP) return; const arr = [...tiles.entries()].sort((a, b) => a[1].at - b[1].at); for (const [k, v] of arr.slice(0, tiles.size - TILE_CAP)) { if (v.bm) v.bm.close(); tiles.delete(k); } }
function cancelTiles() { tileGen++; queue = []; for (const ac of inflight.values()) ac.abort(); }
function keyProblem() { if (keyState === 'bad') return; keyState = 'bad'; toast('Mapbox refused the tiles for this address. The token is restricted to the dashboard address list; the drawing stays available.', 9000); }
function drawTiles(v) {
  if (mode === 'original') return;
  if (!mapKey) { if (keyState === 'none' || keyState === 'bad') setSatState('down'); return; }
  const S2D = sheetToDevice(dpr * v.scale, canvas.width, canvas.height);
  let anyOver = false, missing = 0, failed = 0, shown = 0, nextRetry = Infinity; const now = performance.now();
  for (const R of regionsForTiles()) {
    const {z, over} = tileZoomFor(v, R.M); anyOver = anyOver || over;
    const f = Math.pow(2, z - 18), Mz = mul([[f, 0, 0], [0, f, 0], [0, 0, 1]], R.M), Minv = inv(Mz);
    const [x0, y0, x1, y1] = R.rect, vx0 = Math.max(v.x, x0), vy0 = Math.max(v.y, y0), vx1 = Math.min(v.x + v.w, x1), vy1 = Math.min(v.y + v.h, y1);
    if (vx1 <= vx0 || vy1 <= vy0) continue;
    const c = [ap(Mz, vx0, vy0), ap(Mz, vx1, vy0), ap(Mz, vx0, vy1), ap(Mz, vx1, vy1)];
    const tx0 = Math.floor(Math.min(...c.map(p => p[0])) / TILE), tx1 = Math.floor(Math.max(...c.map(p => p[0])) / TILE);
    const ty0 = Math.floor(Math.min(...c.map(p => p[1])) / TILE), ty1 = Math.floor(Math.max(...c.map(p => p[1])) / TILE);
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 120) continue;                       /* never a flood: the zoom choice keeps this small */
    ctx.save(); ctx.setTransform(...S2D); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0);
    for (const h of R.holes) ctx.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]); ctx.clip('evenodd');
    ctx.transform(Minv[0][0], Minv[1][0], Minv[0][1], Minv[1][1], Minv[0][2], Minv[1][2]);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const cxT = (tx0 + tx1) / 2, cyT = (ty0 + ty1) / 2;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const t = tiles.get(tileKey(z, tx, ty));
      if (t && t.bm) { t.at = performance.now(); shown++; ctx.drawImage(t.bm, tx * TILE, ty * TILE, TILE + .5, TILE + .5); }
      else { missing++;
        if (t && t.err) { failed++; if (now >= t.retryAt) { tiles.delete(tileKey(z, tx, ty)); requestTile(z, tx, ty, Math.hypot(tx - cxT, ty - cyT)); } else nextRetry = Math.min(nextRetry, t.retryAt); }
        else if (!t) { if (tileTries.has(tileKey(z, tx, ty))) failed++; requestTile(z, tx, ty, Math.hypot(tx - cxT, ty - cyT)); }   /* a retry in flight still counts as failing */
        const p = parentTile(z, tx, ty); if (p) { shown++; ctx.drawImage(p.bm, p.sx, p.sy, p.sw, p.sw, tx * TILE, ty * TILE, TILE + .5, TILE + .5); } }
    }
    if (bright !== 1) { ctx.setTransform(...S2D); ctx.fillStyle = bright < 1 ? `rgba(0,0,0,${1 - bright})` : `rgba(255,255,255,${(bright - 1) * .8})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
    ctx.restore();
  }
  $('overzoom').style.display = anyOver ? '' : 'none';
  if (nextRetry < Infinity) { clearTimeout(retryTimer); retryTimer = setTimeout(requestPaint, Math.max(250, nextRetry - now + 30)); }
  setSatState(keyState === 'bad' ? 'down' : failed ? (shown ? 'partial' : 'down') : '');
  return missing;
}
/* the plain-English banner for the satellite layer: Retry clears the failures and asks again now; Show the plan only
   switches to Original plan (and remembers it, as a click on the mode button would) */
function setSatState(s) {
  if (mode === 'original') s = ''; if (s === satState) return; satState = s; const b = $('satBanner'); if (!b) return;
  b.hidden = !s; b.className = 'satban ' + s;
  $('satMsg').textContent = s === 'down' ? 'Satellite imagery isn\'t loading' : 'Some satellite imagery isn\'t loading';
  $('satWhy').textContent = keyState === 'none' ? 'The map service did not give this page a key.' : keyState === 'bad' ? 'The map service refused this address.' : /tile (\d+)/.test(satWhy) ? 'The imagery server answered ' + satWhy.match(/tile (\d+)/)[1] + '; trying again automatically.' : 'The connection to the imagery server failed; trying again automatically.';
}
function retrySatellite() {
  for (const [k, t] of tiles) if (!t.bm) tiles.delete(k); tileTries.clear(); satWhy = '';
  if (keyState === 'none' || keyState === 'bad') { mapKey = null; keyState = 'unknown'; ensureKey().then(() => requestPaint()); }
  satState = 'retry'; setSatState(''); changeView(false);
}
function parentTile(z, x, y) { for (let d = 1; d <= 4 && z - d >= 12; d++) { const t = tiles.get(tileKey(z - d, x >> d, y >> d)); if (t && t.bm) { const s = TILE >> d; return {bm: t.bm, sx: (x & ((1 << d) - 1)) * s, sy: (y & ((1 << d) - 1)) * s, sw: s}; } } return null; }
/* ---------------------------------------------------------------- the drawing */
/* ---------------------------------------------------------------- the drawing, as render tiles
   The drawing is rasterised in 512-device-pixel tiles at quantised scale levels (quarter-octave steps): the worker
   builds each tile's SVG from the source primitives, the page decodes it (a small, short job) and keeps it in a
   bounded cache. Panning reuses tiles; zooming shows the nearest cached level scaled while the exact level fills in,
   nearest-to-centre first, at most two decodes per frame. Nothing is rendered that is not on screen. */
const VT = 512, vtiles = new Map(), VT_CAP = PHONE ? 90 : 220, vtQueue = [], vtInflight = new Set(); let vtBusy = 0, vtGen = 0;
function levelFor(v) { return Math.round(Math.log2(v.scale * dpr) * 4) / 4; }         /* device px per sheet pt = 2^L */
function vtKey(m, L, tx, ty) { return m + '|' + L + '|' + tx + '|' + ty; }
function visibleVT(v, L) {
  const s = Math.pow(2, L), span = VT / s;                                                 /* sheet pts per tile at level L */
  const x0 = Math.max(0, Math.floor(v.x / span)), y0 = Math.max(0, Math.floor(v.y / span));
  const x1 = Math.min(Math.ceil(SHEET_W / span) - 1, Math.floor((v.x + v.w) / span)), y1 = Math.min(Math.ceil(SHEET_H / span) - 1, Math.floor((v.y + v.h) / span));
  return {s, span, x0, y0, x1, y1};
}
function drawVectorTiles(v) {
  const L = levelFor(v), T = visibleVT(v, L); let missing = 0, total = 0;
  const m = mode === 'satellite' ? null : (PYR && PYR.levels.some(l => l.L === L) ? 'vt' : mode); if (!m) return 0;
  /* coarser and finer cached levels first, as a stand-in under the exact level */
  const others = [];
  for (const [k, t] of vtiles) { if (t.empty || t.mode !== m || t.L === L) continue; if (Math.abs(t.L - L) > 2.5 || (interacting && t.L > L + 0.6)) continue; if (t.x + t.w < v.x || t.x > v.x + v.w || t.y + t.h < v.y || t.y > v.y + v.h) continue; others.push(t); }
  others.sort((p, q) => p.L - q.L);
  const exact = [];
  for (let ty = T.y0; ty <= T.y1; ty++) for (let tx = T.x0; tx <= T.x1; tx++) { total++; const t = vtiles.get(vtKey(m, L, tx, ty)); if (t) { t.at = performance.now(); if (!t.empty) exact.push(t); } else { missing++; requestVT(m, L, tx, ty, Math.hypot(tx - (T.x0 + T.x1) / 2, ty - (T.y0 + T.y1) / 2)); } }
  /* a stand-in only where the exact tile is missing, so nothing double-paints at partial alpha */
  if (missing) { ctx.save(); ctx.beginPath(); for (let ty = T.y0; ty <= T.y1; ty++) for (let tx = T.x0; tx <= T.x1; tx++) if (!vtiles.has(vtKey(m, L, tx, ty))) ctx.rect(tx * T.span, ty * T.span, T.span, T.span); ctx.clip();
    for (const t of others) ctx.drawImage(t.canvas, t.x, t.y, t.w, t.h); ctx.restore(); }
  for (const t of exact) ctx.drawImage(t.canvas, t.x, t.y, t.w, t.h);
  if (missing) pumpVT();
  return {missing, total};
}
function requestVT(m, L, tx, ty, prio) { const key = vtKey(m, L, tx, ty); if (vtiles.has(key) || vtInflight.has(key)) return; if (!vtQueue.some(q => q.key === key)) vtQueue.push({key, m, L, tx, ty, prio, gen: vtGen}); }
const EMPTY = {empty: true};
function pumpVT() {
  if (!ready) return; vtQueue.sort((a, b) => a.prio - b.prio);
  while (vtBusy < (PYR ? 6 : 2) && vtQueue.length) {
    const q = vtQueue.shift(); if (q.gen !== vtGen) continue; vtBusy++; vtInflight.add(q.key);
    const s = Math.pow(2, q.L), span = VT / s, view = {x: q.tx * span, y: q.ty * span, w: span, h: span, scale: s / dpr};
    if (PYR && PYR.levels.some(l => l.L === q.L)) {                                     /* pre-rendered: a small PNG, decoded off the thread */
      const t0 = performance.now();
      fetchVT(q).then(r => r === null ? null : r.status === 404 ? null : r.ok ? r.blob() : Promise.reject(new Error('vt ' + r.status)))
        .then(b => b ? createImageBitmap(b) : null)
        .then(bm => { vtiles.set(q.key, bm ? {canvas: bm, mode: q.m, L: q.L, x: view.x, y: view.y, w: span, h: span, at: performance.now()} : {empty: true, mode: q.m, L: q.L, x: view.x, y: view.y, w: 0, h: 0, at: performance.now()}); perf.vtFetched = (perf.vtFetched || 0) + 1; perf.lastRender = {ms: Math.round(performance.now() - t0), count: null, zoom: camera.z, from: 'pyramid'}; evictVT(); requestPaint(); })
        .catch(e => console.warn('pyramid tile', e)).finally(() => { vtBusy--; vtInflight.delete(q.key); pumpVT(); });
      continue;
    }
    const t0 = performance.now(); const savedMode = mode; mode = q.m === 'vt' ? 'hybrid' : q.m;   /* the worker renders for the tile's mode */
    const pr = svgFromWorker(view, VT, VT); mode = savedMode;
    pr.then(res => loadSvg(res.svg).promise.then(({img, url}) => { const c = document.createElement('canvas'); c.width = VT; c.height = VT; c.getContext('2d').drawImage(img, 0, 0, VT, VT); URL.revokeObjectURL(url);
        vtiles.set(q.key, {canvas: c, mode: q.m, L: q.L, x: view.x, y: view.y, w: span, h: span, at: performance.now()}); perf.lastRender = {ms: Math.round(performance.now() - t0), count: res.count, zoom: camera.z}; perf.vtRendered = (perf.vtRendered || 0) + 1; evictVT(); requestPaint(); }))
      .catch(e => { if (!/View changed/.test(String(e))) console.warn('tile render', e); })
      .finally(() => { vtBusy--; vtInflight.delete(q.key); pumpVT(); });
  }
}
function evictVT() { if (vtiles.size <= VT_CAP) return; const arr = [...vtiles.entries()].sort((a, b) => a[1].at - b[1].at); for (const [k, t] of arr.slice(0, vtiles.size - VT_CAP)) { if (t.canvas) { if (t.canvas.close) t.canvas.close(); else t.canvas.width = t.canvas.height = 1; } vtiles.delete(k); } }
/* a pyramid tile: from the packed level file by byte range when the manifest is packed (the hosted service keeps few
   files), else from its own file; a tile the manifest does not list is empty and costs no request */
function fetchVT(q) {
  if (PYR && PYR.packed) { const lv = PYR.levels.find(l => l.L === q.L); const e = lv && lv.tiles[q.tx + '_' + q.ty]; if (!e) return Promise.resolve(null);
    return fetch(`assets/vt/${lv.file}`, {headers: {Range: `bytes=${e[0]}-${e[0] + e[1] - 1}`}}).then(r => r.status === 206 ? r : r.status === 200 ? Promise.reject(new Error('vt range not honoured')) : r); }
  return fetch(`assets/vt/L${q.L}/${q.tx}_${q.ty}.webp`);
}
function dropVTQueue() { vtGen++; vtQueue.length = 0; }
function draw() {
  paintID = 0; const t0 = performance.now(); const v = currentView();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b0908'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const S2D = sheetToDevice(dpr * v.scale, canvas.width, canvas.height);
  ctx.setTransform(...S2D);
  if (mode === 'original') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, SHEET_W, SHEET_H);
    if (UNDER.length && PYR) drawUnderlay(v); else if (preview) ctx.drawImage(preview, 0, 0, SHEET_W, SHEET_H); }
  else {
    ctx.fillStyle = '#17120f'; ctx.fillRect(0, 0, SHEET_W, SHEET_H);                /* the sheet, dark: no white under the photograph */
    if (legendOn) { ctx.save(); ctx.beginPath(); ctx.rect(0, 1466, SHEET_W, SHEET_H - 1466); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 1466, SHEET_W, SHEET_H - 1466); if (preview) ctx.drawImage(preview, 0, 0, SHEET_W, SHEET_H); ctx.restore(); }
    drawTiles(v); ctx.setTransform(...S2D);
  }
  let vt = null;
  if (mode !== 'satellite' && !previewOnly(v)) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, SHEET_W, SHEET_H); ctx.clip(); ctx.globalAlpha = mode === 'hybrid' ? opacity : 1;
    vt = drawVectorTiles(v); ctx.restore();
  }
  drawMarks(v);
  if (highlight) { const [x0, y0, x1, y1] = highlight, pad = 7 / v.scale; ctx.fillStyle = '#ffb60033'; ctx.strokeStyle = '#ff6a13'; ctx.lineWidth = 2 / v.scale; ctx.fillRect(x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad); ctx.strokeRect(x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); updateMini(v);
  if (ready) { if (mode !== 'original' && satState === 'down') quality('bad', 'Satellite imagery not loading' + (mode === 'hybrid' ? ' · plan shown on its own' : ''));
    else if (mode !== 'original' && satState === 'partial') quality('busy', 'Some satellite tiles did not load · retrying');
    else if (mode === 'satellite') quality('sharp', 'Satellite only' + (tileZoomAny(v) ? ' · imagery enlarged beyond its detail' : ''));
    else if (previewOnly(v)) quality('', 'Full-sheet overview');
    else if (vt && vt.missing) quality('busy', 'Rendering source detail… ' + (vt.total - vt.missing) + ' of ' + vt.total + ' tiles');
    else quality(tileZoomAny(v) ? 'over' : 'sharp', 'Source detail rendered' + (perf.lastRender ? ' · last tile ' + perf.lastRender.ms + ' ms' : '')); }
  perf.frames++; perf.frameMs += performance.now() - t0; if (perf.frames % 30 === 0) perfText();
}
function drawUnderlay(v) {
  for (const u of UNDER) { const [x0, y0, x1, y1] = u.bbox; if (x1 < v.x || x0 > v.x + v.w || y1 < v.y || y0 > v.y + v.h) continue;
    let im = underImgs.get(u.file);
    if (!im) { im = {img: null}; underImgs.set(u.file, im); const el = new Image(); el.decoding = 'async'; el.onload = () => { im.img = el; requestPaint(); }; el.src = 'assets/' + u.file; }
    if (im.img) ctx.drawImage(im.img, x0, y0, x1 - x0, y1 - y0); }
}
/* the backing store follows the gesture: one device pixel per CSS pixel while the wheel turns or a finger moves,
   the full ratio 160 ms after the last input. Coarser tiles and a quarter of the pixel work while moving; the crisp
   frame lands when the hand stops. */
function applyDpr() { const want = interacting ? Math.min(dprFull, 1) : dprFull; if (want === dpr && canvas.width === Math.round(sw * want)) return; dpr = want; canvas.width = Math.round(sw * dpr); canvas.height = Math.round(sh * dpr); mcanvas.width = canvas.width; mcanvas.height = canvas.height; }
function touchInteraction() { clearTimeout(restTimer); if (!interacting) { interacting = true; applyDpr(); } restTimer = setTimeout(() => { interacting = false; applyDpr(); dropVTQueue(); requestPaint(); }, 160); }
/* hosted under /w/<token>/explorer/ the page passes the link's own token to the service; anywhere else the stand-in answers */
function hostedToken() { const m = /^\/w\/([A-Za-z0-9_-]{16,128})\//.exec(location.pathname); return m ? '?t=' + encodeURIComponent(m[1]) : ''; }
function requestPaint() { if (!paintID && !document.hidden) paintID = requestAnimationFrame(draw); }
/* the overview map is kept north-up like every other map here; the sheet is turned inside its box once */
function miniNorthUp() { const rot = 0, box = $('mini'), inner = $('miniInner'); const r = rot * Math.PI / 180, c = Math.abs(Math.cos(r)), si = Math.abs(Math.sin(r)); const W = 200, H = W * SHEET_H / SHEET_W, bw = Math.ceil(W * c + H * si), bh = Math.ceil(W * si + H * c); box.style.width = bw + 'px'; box.style.height = bh + 'px'; inner.style.width = W + 'px'; inner.style.height = H + 'px'; inner.style.left = ((bw - W) / 2) + 'px'; inner.style.top = ((bh - H) / 2) + 'px'; inner.style.transform = 'rotate(' + rot + 'deg)'; }
function updateMini(v) { const c = v.corners; $('miniRect').setAttribute('points', [c[0], c[1], c[3], c[2]].map(p => clamp(p.x, 0, SHEET_W) + ',' + clamp(p.y, 0, SHEET_H)).join(' ')); updateCompass(); }
/* the compass: north on the sheet comes from the registration (tile 'up' pulled back through the affine) */
function northOnSheet() { if (!GEO) return null; const M = GEO.main.sheet_to_z18px, a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1], det = a * d - b * c; const nx = (-b * -1) / det, ny = (a * -1) / det; const l = Math.hypot(nx, ny); return {x: nx / l, y: ny / l}; }
function updateCompass() { const n = northOnSheet(), el = $('compass'); if (!n || !el) return; const ang = Math.atan2(n.y, n.x) * 180 / Math.PI + camera.rot + 90; el.style.transform = 'rotate(' + ang + 'deg)'; $('rotOut').textContent = Math.round(((camera.rot % 360) + 360) % 360) + '°'; }
function northRot() { const n = northOnSheet(); return n ? -90 - Math.atan2(n.y, n.x) * 180 / Math.PI : 0; }
function northUp(animate = true) { if (!GEO) return; rotateTo(northRot(), animate); }
function asDrawn(animate = true) { rotateTo(0, animate); }
/* the zoom that fits a sheet-space rectangle at a rotation: the rotated extents, not the sheet's own */
function fitZoomFor(w, h, rot, margin) { const r = rot * Math.PI / 180, c = Math.abs(Math.cos(r)), si = Math.abs(Math.sin(r)), ew = w * c + h * si, eh = w * si + h * c; return Math.min((sw - margin) / Math.max(1, ew), (sh - margin) / Math.max(1, eh)) / fitScale; }
let rotAnim = 0;
function rotateTo(deg, animate = true) { cancelAnimationFrame(rotAnim); const from = camera.rot, d = ((deg - from + 540) % 360) - 180; if (!animate || matchMedia('(prefers-reduced-motion:reduce)').matches) { camera.rot = from + d; changeView(false); return; }
  const t0 = performance.now(); (function step() { const k = Math.min(1, (performance.now() - t0) / 320), e = 1 - Math.pow(1 - k, 3); camera.rot = from + d * e; changeView(false); if (k < 1) rotAnim = requestAnimationFrame(step); })(); }
function isPreviewEnough(v) { return v.scale * dpr <= 1.15; }
/* Original plan at overview scale is the preview picture alone, but only where there is no patch set (and a preview) */
function previewOnly(v) { return mode === 'original' && !!preview && isPreviewEnough(v) && !(UNDER.length && PYR); }
function changeView(resetLabel = true) {
  revision++; camera.z = clamp(camera.z, MIN_Z, MAX_Z); camera.cx = clamp(camera.cx, 0, SHEET_W); camera.cy = clamp(camera.cy, 0, SHEET_H);
  if (document.activeElement !== $('zoomInput')) $('zoomInput').value = Math.round(camera.z * 100).toLocaleString('en-AU') + '%';
  if (resetLabel) { setLabel('Custom close-up'); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); }
  dropVTQueue(); requestPaint();
}
function zoomBy(factor, x = sw / 2, y = sh / 2) { touchInteraction(); const a = screenToSource(x, y); camera.z = clamp(camera.z * factor, MIN_Z, MAX_Z); keepUnder(a, x, y); changeView(); }
/* every map here starts the way D001 is drawn (beach along the top), the way the crew reads the printed plan and, from
   v5.90, the way the dashboard's satellite and 3D views open; the rose says where north is and N turns north-up */
function fit() { highlight = null; const rot = 0; camera = {cx: 1192, cy: 842, z: clamp(fitZoomFor(SHEET_W, SHEET_H, rot, 30), MIN_Z, MAX_Z), rot}; setLabel('Full master plan · as drawn'); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); changeView(false); }
function gotoRect(rect, label) { document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); const [x0, y0, x1, y1] = rect, rot = camera.rot || 0; camera = {cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z: clamp(fitZoomFor(x1 - x0, y1 - y0, rot, 65), MIN_Z, MAX_Z), rot}; setLabel(label); changeView(false); }
/* the drawing's geometry lives in a worker (scene-worker.js); the page asks it for the SVG of a view and never builds
   250,000 path strings on the thread that is answering the pointer */
let worker = null, svgSeq = 0; const svgWaiting = new Map();
function svgFromWorker(v, width, height, all = false) {
  return new Promise((resolve, reject) => { const id = ++svgSeq; svgWaiting.set(id, {resolve, reject}); worker.postMessage({t: 'svg', id, view: {x: v.x, y: v.y, w: v.w, h: v.h, scale: v.scale}, width, height, mode, all}); });
}
function workerMessage(e) {
  const m = e.data;
  if (m.t === 'svg' || m.t === 'error') { const w = svgWaiting.get(m.id); if (!w) return; svgWaiting.delete(m.id); if (m.t === 'svg') { lastQueryCount = m.count; w.resolve(m); } else w.reject(new Error(m.message)); }
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[c]));
function loadSvg(svg) {
  const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml;charset=utf-8'})), img = new Image(); let rejectFn, settled = false;
  const promise = new Promise((resolve, reject) => { rejectFn = reject; img.onload = () => { if (settled) return; settled = true; resolve({img, url}); }; img.onerror = () => { if (settled) return; settled = true; URL.revokeObjectURL(url); reject(new Error('render failed')); }; img.src = url; });
  return {promise, cancel() { if (settled) return; settled = true; img.onload = img.onerror = null; img.src = ''; URL.revokeObjectURL(url); rejectFn(new DOMException('View changed', 'AbortError')); }};
}
function tileZoomAny(v) { return mode !== 'original' && GEO && tileZoomFor(v, GEO.main.sheet_to_z18px).over; }
function setMode(m) {
  if (m === mode) return; mode = m; document.querySelectorAll('.modes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  dropVTQueue(); setSatState('');
  if (m !== 'original') { ensureKey().then(() => requestPaint()); } else cancelTiles();
  $('attrib').innerHTML = m === 'original' ? 'Drawing © iEDM · D001 rev 03' : '<a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">© Mapbox</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a> © Maxar · Drawing © iEDM D001 rev 03';
  changeView(false);
}
async function ensureKey() {
  if (mapKey) return mapKey;
  try { const r = await fetch('/api/map-key' + hostedToken(), {cache: 'no-store'}); const j = await r.json(); if (j && /^pk\./.test(String(j.token || ''))) { mapKey = j.token; keyState = 'ok'; return mapKey; } }
  catch (e) {}
  keyState = 'none'; toast('No Mapbox token from the service: the satellite modes need the dashboard\'s key. The original plan is unaffected.', 9000); return null;
}
function alignmentPanel() {
  if (!GEO) { $('alText').textContent = 'Alignment pending'; return; }
  /* green only once someone has signed the registration off; until then amber, whatever the residuals say */
  const c = GEO.main.check, i = GEO.inset.check, signed = /^(reviewed|approved|signed[ _-]?off)$/i.test(String(GEO.main.review_status || '').trim());
  $('alDot').className = 'dot ' + (signed && c && c.rms_m < 1.5 ? 'ok' : '');
  $('alText').textContent = `${signed ? 'Image registration' : 'Alignment not yet signed off'} · main plan check ${c.rms_m.toFixed(2)} m rms over ${c.n} held-out points (worst ${c.max_m.toFixed(2)} m)`;
  $('alSub').textContent = `Inset: ${i.rms_m ? i.rms_m.toFixed(2) + ' m rms over ' + i.n + ' points' : i.note}. Fitted from the drawing's own embedded aerial matched to Mapbox satellite; not a survey and not for set-out. Sheet is rotated ${GEO.main.rotation_to_north_deg.toFixed(1)}° to north. Review status: ${GEO.main.review_status}.`;
}
function perfText() { const f = perf.frames ? (perf.frameMs / perf.frames).toFixed(1) : '—'; $('perfText').textContent = `Scene decode ${perf.sceneMs} ms · frames ${perf.frames} at ${f} ms avg · tiles fetched ${perf.tilesFetched} (${(perf.tileBytes / 1048576).toFixed(1)} MB) · cache ${tiles.size} · last tile ${perf.lastRender ? perf.lastRender.ms + ' ms' + (perf.lastRender.count != null ? ' for ' + perf.lastRender.count.toLocaleString('en-AU') + ' elements' : ' from the pyramid') : '—'} · drawing tiles rendered ${perf.vtRendered || 0} (cache ${vtiles.size}) · DPR ${dpr.toFixed(2)}`; }
/* the page opens in Satellite + plan; a #original / #hybrid / #satellite link wins, then the mode this browser last
   chose by hand (a click or the 1-3 keys), kept in localStorage */
const MODE_KEY = 'gc500.explorer.mode', MODES = ['original', 'hybrid', 'satellite']; let modeChosen = false;
function chooseMode(m) { modeChosen = true; try { localStorage.setItem(MODE_KEY, m); } catch (e) {} setMode(m); }
function startMode() { const h = location.hash.slice(1); if (MODES.includes(h)) return h; try { const s = localStorage.getItem(MODE_KEY); if (MODES.includes(s)) return s; } catch (e) {} return 'hybrid'; }
document.querySelectorAll('.modes button').forEach(b => b.onclick = () => chooseMode(b.dataset.mode));
$('satRetry').onclick = retrySatellite; $('satPlan').onclick = () => chooseMode('original');
$('op').oninput = e => { opacity = +e.target.value / 100; $('opOut').textContent = e.target.value + '%'; requestPaint(); };
$('br').oninput = e => { bright = +e.target.value / 100; $('brOut').textContent = e.target.value + '%'; requestPaint(); };
$('insetOn').onchange = e => { insetOn = e.target.checked; requestPaint(); }; $('legendOn').onchange = e => { legendOn = e.target.checked; requestPaint(); };
$('navBtn').onclick = () => document.body.classList.toggle('nav');
$('legendBtn').onclick = () => { const L = $('legend'); if (L.classList.contains('show')) { L.classList.remove('show'); return; } L.innerHTML = legendHtml(); L.classList.add('show'); };
function legendHtml() {
  const cls = window.__cls || {}; const n = cls.image_records ? cls.image_records.length : 0, u = cls.image_records ? cls.image_records.filter(m => m.category === 'aerial_underlay').length : 0;
  return `<h4>What the satellite modes keep and lift</h4><table><tr><td>Vector records (paths)</td><td>${(P.count - n).toLocaleString('en-AU')} kept, all modes</td></tr><tr><td>Raster symbols and lettering</td><td>${(n - u)} kept, all modes</td></tr><tr><td>Sheet's own aerial patches</td><td>${u} lifted in satellite modes (they are the old photograph)</td></tr><tr><td>Sheet-white backdrop</td><td>Original plan only</td></tr><tr><td>Legend, key plan, title block</td><td>Kept as document content (toggle)</td></tr><tr><td>Large white fills</td><td>none found; nothing removed by colour</td></tr></table>
  <h4>Source</h4><p>${esc(P.meta.title)} · ${esc(P.meta.drawing)} · project ${esc(P.meta.project)} · revision ${esc(P.meta.revision)}<br>PDF SHA-256 ${esc(P.meta.sha256)}</p><h4>Imagery</h4><p>Mapbox Satellite tiles, fetched for the visible view only. Capture date and native resolution are not stated by the provider; the status line says when the photograph is enlarged beyond what it holds.</p><p><button class="jump" onclick="document.getElementById('legend').classList.remove('show')">Close</button></p>`;
}
/* ---------------------------------------------------------------- find: categories and glowing rings
   A position is only ever where D001 prints the code (a label's box on the sheet). References the register knows but
   D001 does not label (generators, water barriers, light towers) are listed with the register's own words and no
   position. Nothing is inferred. Marks are soft rings, never pointers. */
const CATS = [
  {id: 'buildings', name: 'Portable buildings', c: '#ff9a4d', prod: ['Portable Building'], pre: /^(P\d{1,3}|AA|CP\d?|HRP)$/},
  {id: 'toilets', name: 'Toilets', c: '#39e07a', prod: ['Toilet'], pre: /^(WC\d{1,3}|PG\d{1,2})$/},
  {id: 'generators', name: 'Generators', c: '#ffd166', prod: ['Generator'], pre: /^GN\d{1,3}$/},
  {id: 'lights', name: 'Light towers', c: '#ffffff', prod: ['Light Tower'], pre: /^LTC?\d{1,3}$/},
  {id: 'barriers', name: 'Water barriers', c: '#4cc9f0', prod: ['WFB'], pre: /^WB\d{1,3}$/},
  {id: 'stands', name: 'Stands', c: '#f72585', pre: /^S\d{2}$/}, {id: 'gates', name: 'Gates', c: '#b5e48c', pre: /^G\d{1,2}[A-Z]?$/},
  {id: 'screens', name: 'Big screens', c: '#c77dff', pre: /^BS\d{2}$/}, {id: 'bars', name: 'Bars', c: '#f4a261', pre: /^BAR ?\d{1,2}$/},
  {id: 'armco', name: 'Armco access', c: '#8ecae6', pre: /^A\d{1,2}$/}, {id: 'egress', name: 'Emergency egress', c: '#e63946', pre: /^EEP ?\d$/},
  {id: 'overtrack', name: 'Over-track signage', c: '#ffb703', pre: /^OT\d$/}, {id: 'bridges', name: 'Pedestrian bridges', c: '#adb5bd', pre: /^PB\d{1,2}$/}];
function catOf(code, product) { for (const c of CATS) { if (product && c.prod && c.prod.includes(product)) return c; if (c.pre.test(code)) return c; } return null; }
function buildItems() {
  const byCode = new Map(); const add = (code, o) => { const k = norm(code); if (!byCode.has(k)) byCode.set(k, {code: k, places: [], reg: null, cat: null, names: []}); return byCode.get(k); };
  if (P && P.labels) for (const l of P.labels) { const t = l[0].trim(); if (!/^[A-Z]{1,4} ?-?\d{1,3}[A-Z]?$/.test(t)) continue; const it = add(t); it.places.push([l[1], l[2], l[3], l[4]]); }
  if (REG) for (const a of REG.assets) { const it = add(a.key); it.reg = a; }
  for (const it of byCode.values()) { it.cat = catOf(it.code.replace(' ', ''), it.reg && it.reg.product) || catOf(it.code, null); }
  ITEMS = [...byCode.values()].filter(it => it.cat).sort((x, y) => x.code.localeCompare(y.code, 'en', {numeric: true}));
  const counts = {}; for (const it of ITEMS) { const c = counts[it.cat.id] = counts[it.cat.id] || {n: 0, on: 0}; c.n++; if (it.places.length) c.on++; }
  $('chips').innerHTML = CATS.filter(c => counts[c.id]).map(c => `<button class="chip" data-cat="${c.id}" aria-pressed="false" style="--c:${c.c}"><i></i>${c.name} <small>${counts[c.id].on}${counts[c.id].on !== counts[c.id].n ? ' of ' + counts[c.id].n : ''}</small></button>`).join('');
  $('chips').onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; const on = b.getAttribute('aria-pressed') !== 'true'; document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', String(on)); showCategory(on ? b.dataset.cat : null); };
}
function showCategory(id) {
  selected = null; stopPulse(); const L = $('findList');
  if (!id) { marks = []; L.classList.remove('show'); L.innerHTML = ''; requestPaint(); return; }
  const cat = CATS.find(c => c.id === id), items = ITEMS.filter(it => it.cat.id === id); marks = items.filter(it => it.places.length).map(it => ({it, c: cat.c}));
  const placed = items.filter(it => it.places.length), unplaced = items.filter(it => !it.places.length);
  L.innerHTML = `<div class="rh">${cat.name}: ${placed.length} labelled on D001${unplaced.length ? ' · ' + unplaced.length + ' in the register but not labelled on D001' : ''}. A ring is where the sheet prints the code, not a surveyed position.</div>` +
    placed.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>${it.reg ? ' · ' + esc(it.reg.name || it.reg.product) : ''}<small>${it.places.length} place${it.places.length === 1 ? '' : 's'} on D001${it.reg && it.reg.item_types ? ' · ' + esc(String(it.reg.item_types).replace(/[\[\]']/g, '')) : ''}</small></button>`).join('') +
    unplaced.map(it => `<button data-code="${esc(it.code)}" class="dim"><b>${esc(it.code)}</b> · ${esc(it.reg.name || it.reg.product)}<small>not labelled on D001${it.reg.drawing ? ' · keyed on ' + esc(it.reg.drawing) : ''}${it.reg.locations && String(it.reg.locations) !== '[]' ? ' · ' + esc(String(it.reg.locations).replace(/[\[\]']/g, '')) : ''}</small></button>`).join('');
  L.classList.add('show'); L.onclick = e => { const b = e.target.closest('[data-code]'); if (b) selectCode(b.dataset.code); };
  if (marks.length) { const xs = marks.flatMap(m => m.it.places.map(p => [p[0], p[2]])).flat(), ys = marks.flatMap(m => m.it.places.map(p => [p[1], p[3]])).flat(); gotoRect([Math.min(...xs) - 40, Math.min(...ys) - 40, Math.max(...xs) + 40, Math.max(...ys) + 40], cat.name); }
  requestPaint();
}
function selectCode(code, place = 0) {
  const it = ITEMS.find(x => x.code === norm(code)); if (!it) return; stopPulse(); selected = it; document.querySelectorAll('.findlist button').forEach(b => b.classList.toggle('sel', b.dataset.code === it.code));
  if (!marks.some(m => m.it === it)) marks = [{it, c: it.cat ? it.cat.c : '#ff6a13'}];
  if (it.places.length) { const bb = it.places[place % it.places.length], cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, aspect = sw / sh, h = Math.max(62, (bb[3] - bb[1]) * 9, (bb[2] - bb[0]) * 5 / aspect), w = h * aspect; highlight = null; gotoRect([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], it.code + (it.reg && it.reg.name ? ' · ' + it.reg.name : '')); startPulse(); }
  else toast(it.code + ' is in the register but D001 does not label it' + (it.reg && it.reg.drawing ? '; it is keyed on ' + it.reg.drawing : '') + '.', 6000);
}
/* the pulse repaints only the overlay canvas (one ring and a halo), never the map; it runs for 20 s after a pick, then the
   ring stays lit; it stops when the tab is hidden */
function startPulse() { pulseT0 = performance.now(); cancelAnimationFrame(pulseRAF); const loop = () => { if (!selected || document.hidden || performance.now() - pulseT0 > 20000) { pulseRAF = 0; if (!paintID) drawMarks(currentView()); return; } if (!paintID) drawMarks(currentView()); pulseRAF = requestAnimationFrame(loop); }; pulseRAF = requestAnimationFrame(loop); }
function stopPulse() { cancelAnimationFrame(pulseRAF); pulseRAF = 0; }
function drawMarks(v) {
  const ctx = mctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, mcanvas.width, mcanvas.height);
  if (!marks.length) return; const M = sheetToDevice(dpr * v.scale, canvas.width, canvas.height), s = dpr * v.scale, now = performance.now();
  ctx.font = `600 ${Math.round(11 * dpr)}px Inter, sans-serif`; ctx.textBaseline = 'middle';
  const showText = marks.length <= 60 || s > 1.2;
  for (const m of marks) for (const bb of m.it.places) {
    const c = applyM(M, (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2); if (c.x < -80 || c.y < -80 || c.x > canvas.width + 80 || c.y > canvas.height + 80) continue;
    const r = Math.max(14 * dpr, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) * s * .7), sel = selected === m.it;
    const g = ctx.createRadialGradient(c.x, c.y, r * .55, c.x, c.y, r * 1.6); g.addColorStop(0, m.c + '00'); g.addColorStop(.45, m.c + (sel ? '66' : '3a')); g.addColorStop(1, m.c + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = (sel ? 2.5 : 1.6) * dpr; ctx.strokeStyle = m.c; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    if (sel && pulseRAF) { const breathe = .5 + .5 * Math.sin((now - pulseT0) / 260); ctx.globalAlpha = .35 + .45 * breathe; ctx.lineWidth = 3 * dpr; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke(); for (let k = 0; k < 2; k++) { const t = (((now - pulseT0) / 1500) + k * .5) % 1; ctx.globalAlpha = (1 - t) * .9; ctx.lineWidth = (3 - 2 * t) * dpr; ctx.beginPath(); ctx.arc(c.x, c.y, r * (1 + t * 1.8), 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1; }
    if (showText || sel) { const txt = m.it.code, w = ctx.measureText(txt).width + 12 * dpr, h = 18 * dpr, x = c.x + r * .75, y = c.y - r * .75 - h / 2; ctx.fillStyle = 'rgba(15,13,12,.85)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 5 * dpr); ctx.fill(); ctx.strokeStyle = m.c; ctx.lineWidth = dpr; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(txt, x + 6 * dpr, y + h / 2); }
  }
}
function markAt(x, y) { const v = currentView(), M = sheetToDevice(v.scale, sw, sh); let best = null; for (const m of marks) for (const bb of m.it.places) { const c = applyM(M, (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), r = Math.max(14, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) * v.scale * .7), d = Math.hypot(c.x - x, c.y - y); if (d <= r * 1.2 && (!best || d < best.d)) best = {m, d}; } return best && best.m; }
/* search on the drawing's own labels */
function norm(s) { return s.toUpperCase().replace(/[\s\-_.]+/g, ' ').trim(); }
function locationName(r) { const x = (r[1] + r[3]) / 2, y = (r[2] + r[4]) / 2; return y > 1470 ? 'Legend / drawing details' : x > 1450 && y > 850 ? 'Inset plan' : 'Main plan'; }
function search() { if (!P) return; const q = $('q').value.trim(), n = norm(q); $('results').classList.toggle('show', !!q); if (!q) { $('results').replaceChildren(); highlight = null; requestPaint(); return; }
  const rank = it => it.code === n ? 0 : it.code === n.replace(' ', '') ? 0 : it.code.startsWith(n) ? 1 : it.code.includes(n) ? 2 : 3;
  const items = ITEMS.filter(it => it.code.includes(n) || (it.reg && (String(it.reg.asset_numbers || '').includes(q) || norm(it.reg.name || '').includes(n)))).sort((a, b) => rank(a) - rank(b) || a.code.length - b.code.length).slice(0, 20);
  const hits = P.labels.map((r, i) => ({r, i, n: norm(r[0])})).filter(o => o.n.includes(n) && !items.some(it => it.code === o.n)); hits.sort((a, b) => ((a.n === n ? 0 : a.n.startsWith(n) ? 1 : 2) - (b.n === n ? 0 : b.n.startsWith(n) ? 1 : 2)) || a.n.length - b.n.length || a.i - b.i); lastSearch = hits.slice(0, 40);
  $('results').innerHTML = (items.length ? items.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>${it.reg && it.reg.name && norm(it.reg.name) !== norm(it.cat.name) ? ' · ' + esc(it.reg.name) : ''}<small>${it.cat.name}${it.places.length ? ' · ' + it.places.length + ' place' + (it.places.length === 1 ? '' : 's') + ' on D001' : ' · not labelled on D001'}${it.reg && String(it.reg.asset_numbers || '[]') !== '[]' ? ' · asset ' + esc(String(it.reg.asset_numbers).replace(/[\[\]']/g, '')) : ''}</small></button>`).join('') : '') +
    (hits.length ? `<div class="rh">${hits.length} other label${hits.length === 1 ? '' : 's'} on the drawing</div>` + lastSearch.map((o, i) => `<button data-result="${i}"><b>${esc(o.r[0])}</b><small>${locationName(o.r)} · jump to label</small></button>`).join('') : '') + (!items.length && !hits.length ? '<div class="rh">No match in the drawing\'s labels or the register.</div>' : ''); }
function chooseResult(i) { const b = $('results').querySelector('[data-code]'); if (b && i === 0) { selectCode(b.dataset.code); document.body.classList.remove('nav'); return; } const r = lastSearch[i]?.r; if (!r) return; const bb = r.slice(1), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2; highlight = bb; const aspect = sw / sh, h = Math.max(62, (bb[3] - bb[1]) * 9, (bb[2] - bb[0]) * 5 / aspect), w = h * aspect; gotoRect([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], r[0]); document.body.classList.remove('nav'); stage.focus({preventScroll: true}); }
$('q').addEventListener('input', search); $('q').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); chooseResult(0); } if (e.key === 'Escape') { $('q').value = ''; search(); stage.focus(); } });
$('results').onclick = e => { const c = e.target.closest('[data-code]'); if (c) { selectCode(c.dataset.code); document.body.classList.remove('nav'); return; } const b = e.target.closest('[data-result]'); if (b) chooseResult(+b.dataset.result); };
$('jumps').onclick = e => { const b = e.target.closest('[data-region]'); if (!b) return; const r = regions[+b.dataset.region]; highlight = null; gotoRect(r.rect, r.name); b.classList.add('active'); document.body.classList.remove('nav'); };
$('northBtn').onclick = () => northUp(); $('sheetBtn').onclick = () => asDrawn(); $('rotL').onclick = () => rotateTo(camera.rot - 15); $('rotR').onclick = () => rotateTo(camera.rot + 15);
$('zoomIn').onclick = () => zoomBy(1.5); $('zoomOut').onclick = () => zoomBy(1 / 1.5); $('fitBtn').onclick = fit;
$('boxBtn').onclick = () => setBox(!boxMode); function setBox(on) { boxMode = on; stage.classList.toggle('box', on); $('boxBtn').setAttribute('aria-pressed', String(on)); if (on) toast('Drag a box around the area to inspect. Esc cancels.'); }
$('fullBtn').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch (_) {} };
document.addEventListener('fullscreenchange', () => setTimeout(resize, 50));
function applyZoomInput() { const n = Number($('zoomInput').value.replace(/[,\s%]/g, '')); if (Number.isFinite(n) && n > 0) { camera.z = clamp(n / 100, MIN_Z, MAX_Z); changeView(); } else toast('Enter a zoom between 50 and 64,000 per cent.'); $('zoomInput').value = Math.round(camera.z * 100).toLocaleString('en-AU') + '%'; }
$('zoomInput').onfocus = () => $('zoomInput').select(); $('zoomInput').onchange = applyZoomInput; $('zoomInput').onkeydown = e => { if (e.key === 'Enter') { applyZoomInput(); $('zoomInput').blur(); } e.stopPropagation(); };
let miniDown = false; function moveMini(e) { const r = $('mini').getBoundingClientRect(), inner = $('miniInner'), W = inner.offsetWidth || 1, H = inner.offsetHeight || 1, rot = 0;
  const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), ux = dx * Math.cos(rot) + dy * Math.sin(rot), uy = -dx * Math.sin(rot) + dy * Math.cos(rot);   /* undo the box's turn */
  camera.cx = clamp(ux / W + .5, 0, 1) * SHEET_W; camera.cy = clamp(uy / H + .5, 0, 1) * SHEET_H; highlight = null; changeView(); }
$('mini').onpointerdown = e => { e.preventDefault(); miniDown = true; $('mini').setPointerCapture(e.pointerId); moveMini(e); }; $('mini').onpointermove = e => { if (miniDown) moveMini(e); }; $('mini').onpointerup = $('mini').onpointercancel = () => { miniDown = false; };
/* export: the same chain at 3840 px on the long edge; tiles awaited; attribution stamped; incomplete loads are said */
$('exportBtn').onclick = async () => {
  if (!ready || exporting) return; exporting = true; dropVTQueue(); $('exportBtn').disabled = true; toast('Preparing a fresh high-detail export…', 30000);
  try {
    const v = currentView(); const edge = 3840; let width, height; if (v.w >= v.h) { width = edge; height = Math.round(edge * v.h / v.w); } else { height = edge; width = Math.round(edge * v.w / v.h); }
    const c = document.createElement('canvas'); c.width = width; c.height = height; const g = c.getContext('2d'); const s = width / v.w; let incomplete = 0;
    g.fillStyle = mode === 'original' ? '#fff' : '#17120f'; g.fillRect(0, 0, width, height); const EX = sheetToDevice(s, width, height);
    if (mode === 'original') { g.save(); g.setTransform(...EX); if (UNDER.length && PYR) { for (const u of UNDER) { const im = underImgs.get(u.file); if (im && im.img) g.drawImage(im.img, u.bbox[0], u.bbox[1], u.bbox[2] - u.bbox[0], u.bbox[3] - u.bbox[1]); } } else if (preview) g.drawImage(preview, 0, 0, SHEET_W, SHEET_H); g.restore(); }
    if (mode !== 'original') { for (const R of regionsForTiles()) { const {z} = tileZoomFor({scale: s / dpr, x: v.x, y: v.y, w: v.w, h: v.h}, R.M); const f = Math.pow(2, z - 18), Mz = mul([[f, 0, 0], [0, f, 0], [0, 0, 1]], R.M), Minv = inv(Mz);
        const [x0, y0, x1, y1] = R.rect, cs = [ap(Mz, Math.max(v.x, x0), Math.max(v.y, y0)), ap(Mz, Math.min(v.x + v.w, x1), Math.max(v.y, y0)), ap(Mz, Math.max(v.x, x0), Math.min(v.y + v.h, y1)), ap(Mz, Math.min(v.x + v.w, x1), Math.min(v.y + v.h, y1))];
        const tx0 = Math.floor(Math.min(...cs.map(p => p[0])) / TILE), tx1 = Math.floor(Math.max(...cs.map(p => p[0])) / TILE), ty0 = Math.floor(Math.min(...cs.map(p => p[1])) / TILE), ty1 = Math.floor(Math.max(...cs.map(p => p[1])) / TILE);
        if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 120) { incomplete++; continue; }
        const need = []; for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) { if (!tiles.has(tileKey(z, tx, ty))) requestTile(z, tx, ty, 0); need.push([tx, ty]); }
        const t1 = performance.now(); while (need.some(([tx, ty]) => !tiles.has(tileKey(z, tx, ty))) && performance.now() - t1 < 20000) await new Promise(r => setTimeout(r, 120));
        g.save(); g.setTransform(...EX); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); for (const h of R.holes) g.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]); g.clip('evenodd'); g.transform(Minv[0][0], Minv[1][0], Minv[0][1], Minv[1][1], Minv[0][2], Minv[1][2]);
        for (const [tx, ty] of need) { const t = tiles.get(tileKey(z, tx, ty)); if (t && t.bm) g.drawImage(t.bm, tx * TILE, ty * TILE, TILE + .5, TILE + .5); else incomplete++; } g.restore(); } }
    if (mode !== 'satellite') { const bw = Math.round(v.w * s), bh = Math.round(v.h * s); const {svg} = await svgFromWorker(v, bw, bh); const {img, url} = await loadSvg(svg).promise; g.save(); g.setTransform(...EX); g.globalAlpha = mode === 'hybrid' ? opacity : 1; g.drawImage(img, v.x, v.y, v.w, v.h); g.restore(); URL.revokeObjectURL(url); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '600 26px Inter, sans-serif'; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, height - 44, width, 44); g.fillStyle = '#fff';
    g.fillText((mode === 'original' ? '' : '© Mapbox © OpenStreetMap © Maxar · ') + 'Drawing © iEDM D001 rev 03 · raster export ' + width + ' × ' + height + ' px · ' + (mode === 'original' ? 'original plan' : mode === 'hybrid' ? 'satellite + plan (image registration, not survey)' : 'satellite only') + (incomplete ? ' · INCOMPLETE: ' + incomplete + ' tiles did not load' : ''), 16, height - 14);
    const blob = await new Promise(r => c.toBlob(r, 'image/png')); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'GC500_D001_Rev03_' + mode + '_' + Math.round(camera.z * 100) + 'pct_' + width + 'x' + height + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    toast(incomplete ? 'PNG saved but marked INCOMPLETE: some tiles did not load.' : 'PNG saved · ' + width + ' × ' + height + ' px.');
  } catch (e) { console.error(e); toast('Export could not finish.'); } finally { exporting = false; $('exportBtn').disabled = false; changeView(false); }
};
/* gestures: wheel, drag, pinch, double tap, box zoom, keyboard */
function onControls(e) { return !!e.target.closest('button,input,.mini,.console,.legend'); }
stage.addEventListener('wheel', e => { if (onControls(e)) return; e.preventDefault(); const p = stagePoint(e), delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? sh : 1); zoomBy(Math.exp(-clamp(delta, -500, 500) * .0018), p.x, p.y); }, {passive: false});
let tapPick = null;   /* set by endPointer when a pointer went down and up without moving: the click that follows may pick a ring */
stage.addEventListener('click', e => { const t = tapPick; tapPick = null; if (!t || onControls(e) || boxMode || performance.now() - t.t > 400) return; const m = markAt(t.x, t.y); if (m) selectCode(m.it.code); });
stage.addEventListener('dblclick', e => { if (onControls(e) || boxMode) return; e.preventDefault(); const p = stagePoint(e); highlight = null; zoomBy(e.shiftKey ? .5 : 2, p.x, p.y); });
function startPinch() { const a = [...pointers.values()]; if (a.length < 2) { pinch = null; return; } const mid = {x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2}; pinch = {distance: Math.max(10, Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y)), z: camera.z, rot: camera.rot, angle: Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x) * 180 / Math.PI, anchor: screenToSource(mid.x, mid.y), mid}; }
stage.addEventListener('pointerdown', e => { if (onControls(e) || e.button > 0) return; e.preventDefault(); stage.focus({preventScroll: true}); const p = stagePoint(e); pointers.set(e.pointerId, p); stage.setPointerCapture(e.pointerId); highlight = null;
  if (boxMode && pointers.size === 1) { boxStart = p; const s = $('sel'); s.style.display = 'block'; s.style.left = p.x + 'px'; s.style.top = p.y + 'px'; s.style.width = s.style.height = '0px'; return; }
  if (pointers.size === 2) { if (boxStart) { boxStart = null; $('sel').style.display = 'none'; setBox(false); } startPinch(); gestureStart = null; } else if (pointers.size === 1) { gestureStart = {p, cx: camera.cx, cy: camera.cy, rot: camera.rot, rotate: e.altKey || e.shiftKey, t: performance.now(), type: e.pointerType, moved: false}; stage.classList.add('dragging'); } });
stage.addEventListener('pointermove', e => { if (!pointers.has(e.pointerId)) return; e.preventDefault(); const p = stagePoint(e); pointers.set(e.pointerId, p);
  if (boxStart) { const s = $('sel'); s.style.left = Math.min(boxStart.x, p.x) + 'px'; s.style.top = Math.min(boxStart.y, p.y) + 'px'; s.style.width = Math.abs(boxStart.x - p.x) + 'px'; s.style.height = Math.abs(boxStart.y - p.y) + 'px'; return; }
  if (pointers.size >= 2 && pinch) { touchInteraction(); const a = [...pointers.values()], mid = {x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2}, dist = Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y), ang = Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x) * 180 / Math.PI;
    camera.z = clamp(pinch.z * dist / pinch.distance, MIN_Z, MAX_Z); const dA = ((ang - pinch.angle + 540) % 360) - 180; if (Math.abs(dA) > 4 || pinch.turning) { pinch.turning = true; camera.rot = pinch.rot + dA; }
    keepUnder(pinch.anchor, mid.x, mid.y); changeView(); }
  else if (gestureStart) { touchInteraction(); const dx = p.x - gestureStart.p.x, dy = p.y - gestureStart.p.y; gestureStart.moved = gestureStart.moved || Math.hypot(dx, dy) > 5;
    if (gestureStart.rotate) { const a0 = Math.atan2(gestureStart.p.y - sh / 2, gestureStart.p.x - sw / 2), a1 = Math.atan2(p.y - sh / 2, p.x - sw / 2); camera.rot = gestureStart.rot + (a1 - a0) * 180 / Math.PI; changeView(false); return; }
    const s = fitScale * camera.z, r = camera.rot * Math.PI / 180; camera.cx = gestureStart.cx - (dx * Math.cos(r) + dy * Math.sin(r)) / s; camera.cy = gestureStart.cy - (-dx * Math.sin(r) + dy * Math.cos(r)) / s; changeView(); } });
/* keep a sheet point under a screen point after a zoom or a turn */
function keepUnder(sheetPt, sx, sy) { const M = sheetToDevice(fitScale * camera.z, sw, sh); const d = applyM(M, sheetPt.x, sheetPt.y); const r = camera.rot * Math.PI / 180, s = fitScale * camera.z, ex = sx - d.x, ey = sy - d.y; camera.cx -= (ex * Math.cos(r) + ey * Math.sin(r)) / s; camera.cy -= (-ex * Math.sin(r) + ey * Math.cos(r)) / s; }
function endPointer(e) { if (!pointers.has(e.pointerId)) return; const p = stagePoint(e); tapPick = (gestureStart && !gestureStart.moved && !boxStart && pointers.size === 1) ? {x: p.x, y: p.y, t: performance.now()} : null;
  if (boxStart) { const a = screenToSource(boxStart.x, boxStart.y), b = screenToSource(p.x, p.y); if (Math.abs(p.x - boxStart.x) > 8 && Math.abs(p.y - boxStart.y) > 8) gotoRect([Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)], 'Selected detail'); boxStart = null; $('sel').style.display = 'none'; setBox(false); }
  else if (gestureStart && gestureStart.type === 'touch' && !gestureStart.moved && performance.now() - gestureStart.t < 280) { if (lastTap && performance.now() - lastTap.t < 330 && Math.hypot(lastTap.x - p.x, lastTap.y - p.y) < 28) { zoomBy(2, p.x, p.y); lastTap = null; } else lastTap = {x: p.x, y: p.y, t: performance.now()}; }
  pointers.delete(e.pointerId); pinch = null; gestureStart = null; if (pointers.size === 1) { const one = [...pointers.values()][0]; gestureStart = {p: one, cx: camera.cx, cy: camera.cy, t: performance.now(), moved: true, type: e.pointerType}; } if (!pointers.size) { stage.classList.remove('dragging'); changeView(false); } }
stage.addEventListener('pointerup', endPointer); stage.addEventListener('pointercancel', e => { lastTap = null; endPointer(e); });
window.addEventListener('keydown', e => { if (e.target.matches('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey) return; const key = e.key.toLowerCase();
  if (!['+', '=', '-', '_', 'home', '0', 'z', '/', 'escape', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', '1', '2', '3', 'r', 'n', 'd'].includes(key)) return; e.preventDefault();
  if (key === '+' || key === '=') zoomBy(1.5); else if (key === '-' || key === '_') zoomBy(1 / 1.5); else if (key === 'home' || key === '0') fit(); else if (key === 'z') setBox(!boxMode); else if (key === '/') { document.body.classList.add('nav'); $('q').focus(); }
  else if (key === '1') chooseMode('original'); else if (key === '2') chooseMode('hybrid'); else if (key === '3') chooseMode('satellite');
  else if (key === 'escape') { setBox(false); highlight = null; marks = []; selected = null; stopPulse(); document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', 'false')); $('findList').classList.remove('show'); $('sel').style.display = 'none'; boxStart = null; $('legend').classList.remove('show'); document.body.classList.remove('nav'); requestPaint(); }
  else if (key === 'r') rotateTo(camera.rot + (e.shiftKey ? -15 : 15)); else if (key === 'n') northUp(); else if (key === 'd') asDrawn();
  else { const amount = (e.shiftKey ? 240 : 90) / (fitScale * camera.z), r = camera.rot * Math.PI / 180, dx = key === 'arrowleft' ? -1 : key === 'arrowright' ? 1 : 0, dy = key === 'arrowup' ? -1 : key === 'arrowdown' ? 1 : 0;
    camera.cx += amount * (dx * Math.cos(r) + dy * Math.sin(r)); camera.cy += amount * (-dx * Math.sin(r) + dy * Math.cos(r)); changeView(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelTiles(); dropVTQueue(); } else requestPaint(); });
new ResizeObserver(resize).observe(stage);
/* ---------------------------------------------------------------- boot: the original drawing first, from the preserved scene */
/* a load that fails says so in plain words and offers Try again; nothing waits forever (45 s at most for the scene) */
const BOOT_TIMEOUT = 45000;
function friendly(e) {
  const s = String(e && e.message || e || ''), m = /scene (\d+)/.exec(s);
  if (m) return m[1] === '404' ? 'The drawing file is missing from the server (it answered 404). Please tell the dashboard owner; the page cannot show the plan without it.' : 'The server could not send the drawing file (it answered ' + m[1] + '). Please try again in a minute.';
  if (/timed out/.test(s)) return 'The drawing is taking too long to load (over 45 seconds). The connection may be slow or interrupted.';
  if (/helper/.test(s)) return 'Part of the viewer (its drawing helper) did not load. Check the connection and try again.';
  if (/Failed to fetch|NetworkError|network/i.test(s)) return 'The drawing could not be downloaded. Check the connection and try again.';
  if (/browser cannot/.test(s)) return s;
  return 'The drawing could not be loaded (' + s.slice(0, 120) + ').';
}
function loadScene() {
  return new Promise((res, rej) => {
    const done = f => x => { clearTimeout(timer); worker.removeEventListener('message', h); f(x); }, ok = done(res), fail = done(rej);
    const timer = setTimeout(() => fail(new Error('scene load timed out')), BOOT_TIMEOUT);
    const h = e => { if (e.data.t === 'ready') ok(e.data); else if (e.data.t === 'error') fail(new Error(e.data.message)); };
    worker.onerror = e => { e.preventDefault(); fail(new Error('the drawing helper (scene-worker.js) did not start' + (e.message ? ': ' + e.message : ''))); };
    worker.addEventListener('message', h); worker.postMessage({t: 'load', url: new URL('assets/drawing-scene.bin', location.href).href, underlay: [...UNDERLAY]});
  });
}
async function boot() {
  try {
    resize(); $('bar').style.width = '10%';
    /* the preview is a convenience (overview picture, minimap); the page works without it */
    preview = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/original-preview.webp'; });
    if (preview) { $('miniImg').src = preview.src; requestPaint(); } else $('mini').style.visibility = 'hidden';
    $('loadText').textContent = 'Unpacking the source geometry…'; $('bar').style.width = '30%';
    if (!('DecompressionStream' in window) || !('Worker' in window)) throw new Error('This browser cannot unpack the drawing. Use a current Edge, Chrome, Firefox or Safari.');
    const json = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
    const [geo, cls] = await Promise.all([json('assets/georeferencing.json'), json('assets/classification.json')]);
    GEO = geo; window.__cls = cls; if (cls) cls.image_records.forEach(m => { if (m.category === 'aerial_underlay') UNDERLAY.add(m.id); });
    worker = new Worker('scene-worker.js'); worker.onmessage = workerMessage;
    const readyMsg = await loadScene();
    worker.onerror = e => { for (const w of svgWaiting.values()) w.reject(new Error('drawing helper stopped')); svgWaiting.clear(); toast('The drawing helper stopped. Reload the page to carry on.', 9000); };
    P = {meta: readyMsg.meta, labels: readyMsg.labels, count: readyMsg.count}; perf.sceneMs = readyMsg.ms;
    const [pyr, under] = await Promise.all([json('assets/vt/manifest.json'), json('assets/underlay/manifest.json')]);
    if (pyr && pyr.levels && pyr.levels.length) { PYR = pyr; PYR_MAX = Math.max(...pyr.levels.map(l => l.L)); }
    /* the aerial patches carry their soft masks as alpha; a set exported without it (RGB, black where masked) is not used */
    if (under && under.items && under.items.every(u => u.alpha)) UNDER = under.items; else if (under) console.warn('underlay patches have no alpha; using the preview instead');
    REG = await fetch('assets/register.json').then(r => r.ok ? r.json() : null).catch(() => null); buildItems();
    $('bar').style.width = '80%'; $('loadText').textContent = 'Building the detail index…';
    if (GEO && GEO.pdf_sha256 !== P.meta.sha256) { GEO = null; toast('The georeferencing file is for a different revision of the drawing; satellite alignment is off until it is redone.', 9000); }
    alignmentPanel(); ready = true; $('q').disabled = false; $('bar').style.width = '100%'; fit(); miniNorthUp(); await frame(); $('loader').classList.add('done'); window.__ready = true; perfText();
    if (!modeChosen) setMode(startMode());
    /* v6.20 - opened on a reference from the delivery page's banner: ?find=<GC500 ID> selects it as a search would */
    const fq = new URLSearchParams(location.search).get('find'); if (fq) { const q = $('q'); if (q) q.value = fq; selectCode(fq); }
  } catch (e) { console.error(e); $('loadText').textContent = friendly(e); $('bootRetry').hidden = false; $('bar').style.background = 'var(--bad)'; window.__bootError = String(e); if (worker) worker.terminate(); }
}
$('bootRetry').onclick = () => location.reload();
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (ready && MODES.includes(h)) setMode(h); });
boot();
window.__marksCount = () => ({marks: marks.length, places: marks.reduce((n, m) => n + m.it.places.length, 0), selected: selected && selected.code, pulsing: !!pulseRAF});
window.GC500Explorer = {get state() { return {ready, mode, zoom: camera.z, view: currentView(), records: P?.count, tiles: tiles.size, perf}; }, fit, goto: (r, l = 'Selected detail') => gotoRect(r, l), zoom: z => { camera.z = clamp(z, MIN_Z, MAX_Z); changeView(); }, setMode, render: () => pumpVT()};
