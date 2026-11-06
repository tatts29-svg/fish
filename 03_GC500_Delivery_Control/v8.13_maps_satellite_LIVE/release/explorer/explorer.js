'use strict';
/* GC500 Satellite Plan Explorer — Coates Industrial Solutions | GC500 2026.
   ONE CAMERA. Everything is drawn in the drawing's own coordinate space (PDF points, 2384 x 1684, y down): the satellite
   tiles are pulled into that space through the registration affine, the drawing's vectors are rendered from source at
   the screen's resolution (the original viewer's renderer, kept), search highlights and the export use the same chain.
   The satellite is a basemap under the drawing. It is fetched only for the visible view, only in the satellite modes,
   through a bounded cache, and nothing is drawn unless something changed.
   v6.97 - FAST FIRST, SHARP ALWAYS (Andrew Fisher, 27 Sep 2026: "No load lag. When u zoom in. No lag ... No blur").
   - Opens from the pre-rendered pyramid, not the 13.3 MB scene: the pyramid now reaches down to L -3, so the first view
     (L -1.1 on a desktop, -1.6 on a phone) is a few small tiles. The scene loads in the worker only for zoom past the
     pyramid (over about 9.5 device pixels per sheet point) and the PNG export; search and chips use source-labels.json.
   - The key, Google's session, the manifest and the labels are asked for in the page's <head>, all at once.
   - Never blank: the whole sheet at a low level stays cached under everything; satellite tiles fall back to a cached
     parent or children; a glide's destination is fetched the moment the wheel turns, not when it lands.
   - Always crisp at rest: the level at or above the screen's own pixel density (downsampled, never stretched), the
     canvas at the true devicePixelRatio and exactly its device-pixel size, satellite tiles at the zoom the DPR needs.
   - Nothing decodes on the main thread (createImageBitmap throughout); DOM writes only when a value changes; the pick
     pulse is a CSS animation on the compositor, not a 60 fps canvas redraw. */
const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('display'), ctx = canvas.getContext('2d', {alpha: false}), mcanvas = $('marks'), mctx = mcanvas.getContext('2d');
mcanvas.style.display = 'none';   /* shown only while it has rings on it */
const SHEET_W = 2384, SHEET_H = 1684, MAX_Z = 640, MIN_Z = .5, NS = 'http://www.w3.org/2000/svg';
const PHONE = matchMedia('(max-width:900px)').matches || /Android|iPhone|iPad/.test(navigator.userAgent);
const PRE = window.GC500_PRE || {};   /* requests index.html started in <head>, before this script arrived */
const once = (k, f) => PRE[k] || (PRE[k] = f());
const getJSON = (u, opt) => fetch(u, opt).then(r => r.ok ? r.json() : null).catch(() => null);
let movW = 0, movH = 0;   /* the backing store while a phone's finger or glide is moving (see applyDpr) */
let P = null, preview = null, overview = null, ready = false, sw = 1, sh = 1, dpr = 1, dprFull = 1, fitScale = 1, interacting = false, restTimer = 0, devW = 0, devH = 0;
let BOOT = null, sceneReady = false, scenePromise = null, sceneRetryAt = 0, firstSharp = false, itemsReady = false;
let readyResolve; const readyPromise = new Promise(r => { readyResolve = r; });
window.__nativeProbe = true; window.__frames = window.__frames || [];      /* the stopwatch's per-frame record (see PERF.md) */
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
let lastQual = ''; function quality(type, text) { if (lastQual === type + '|' + text) return; lastQual = type + '|' + text; $('qual').className = 'qual ' + type; $('qualText').textContent = text; }
/* sheet -> device: centre the camera, rotate, scale, in that order; every layer uses this one chain */
function sheetToDevice(scaleDev, W, H, cx = camera.cx, cy = camera.cy, rot = camera.rot) { const r = rot * Math.PI / 180, c = Math.cos(r), si = Math.sin(r), a = scaleDev * c, b = scaleDev * si; return [a, b, -b, a, W / 2 - a * cx + b * cy, H / 2 - b * cx - a * cy]; }
function invertM(m) { const [a, b, c, d, e, f] = m, det = a * d - b * c; return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]; }
function applyM(m, x, y) { return {x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5]}; }
function currentView() { const scale = fitScale * camera.z, M = sheetToDevice(scale, sw, sh), I = invertM(M), cs = [applyM(I, 0, 0), applyM(I, sw, 0), applyM(I, 0, sh), applyM(I, sw, sh)];
  const x0 = Math.min(...cs.map(p => p.x)), y0 = Math.min(...cs.map(p => p.y)), x1 = Math.max(...cs.map(p => p.x)), y1 = Math.max(...cs.map(p => p.y)); return {x: x0, y: y0, w: x1 - x0, h: y1 - y0, scale, corners: cs}; }
function screenToSource(x, y) { return applyM(invertM(sheetToDevice(fitScale * camera.z, sw, sh)), x, y); }
function stagePoint(e) { const r = stage.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }
function setLabel(s) { $('viewName').textContent = s; }
/* v6.97 - the backing store is the canvas's exact size in device pixels (devicePixelContentBoxSize where the browser
   gives it), at the true devicePixelRatio up to 3: one canvas pixel per screen pixel, no resampling by the compositor */
function resize(entries) {
  const rect = stage.getBoundingClientRect(); sw = Math.max(1, rect.width); sh = Math.max(1, rect.height);
  const raw = window.devicePixelRatio || 1; let want = Math.min(raw, 3); const maxPixels = PHONE ? 9e6 : 16e6; if (sw * sh * want * want > maxPixels) want = Math.sqrt(maxPixels / (sw * sh));
  const e = entries && entries.find && entries.find(x => x.target === canvas), box = e && e.devicePixelContentBoxSize && e.devicePixelContentBoxSize[0];
  /* the device-pixel box only when it agrees with CSS size x devicePixelRatio (to snap to whole device pixels); some
     browsers (emulated devices among them) report it in CSS pixels, which would draw a 3x screen at a third of its detail */
  if (box && want === raw && Math.abs(box.inlineSize - sw * raw) <= 2 && Math.abs(box.blockSize - sh * raw) <= 2) { devW = box.inlineSize; devH = box.blockSize; } else { devW = Math.max(1, Math.round(sw * want)); devH = Math.max(1, Math.round(sh * want)); }
  dprFull = devW / sw;
  if (PHONE && dprFull > 2.05) { movW = Math.max(1, Math.round(sw * 2)); movH = Math.max(1, Math.round(sh * 2)); } else { movW = devW; movH = devH; }
  fitScale = Math.max(.025, Math.min((sw - 30) / SHEET_W, (sh - 30) / SHEET_H));
  applyDpr(); changeView(false);
}
/* ---------------------------------------------------------------- the satellite layer */
/* v6.90 - GOOGLE'S AERIAL PHOTOGRAPH (Andrew Fisher, 27 Sep 2026: "4K ultra clear ... sharp, clear"). Google's Map Tiles
   API satellite (Vexcel 2026 aerial at the circuit, to zoom 21) is used through the dashboard's own Google key, the one the
   3D proof uses; Mapbox stays as the fallback if Google's session cannot be had or stops answering. Same XYZ scheme and
   512 px tiles, so nothing else in the chain changes. Google's logo and its imagery credit are shown whenever its tiles are. */
let gKey = null, gSession = null, SOURCE = 'mapbox', gCopy = 'Imagery © Google', gState = 'unknown';
function tileMaxZ() { return SOURCE === 'google' ? 21 : 19; }
/* v6.97 - Google's session is kept in this browser until a day before it expires (a session is Google's own reusable
   token, valid about two weeks; only a fingerprint of the key is stored with it, never the key): a return visit asks
   for the key and goes straight to tiles. A stale session is dropped and a fresh one asked for once before Mapbox. */
const GS_KEY = 'gc500.explorer.gsession';
const keyPrint = k => { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
function storedSession() { try { const s = JSON.parse(localStorage.getItem(GS_KEY) || 'null'); if (s && s.k === keyPrint(gKey) && s.session && +s.exp > Date.now() / 1000 + 86400) return s.session; } catch (e) {} return null; }
let googleJob813 = null, googleRetryAt813 = 0;
async function ensureGoogle(fresh = false) {
  if (gSession) return gSession;
  if (googleJob813) return googleJob813;
  if (!gKey) { gState = 'no'; return null; }
  if (!fresh && (gState === 'no' || performance.now() < googleRetryAt813)) return null;
  const kept = !fresh && storedSession();
  if (kept) { gSession = kept; gState = 'ok'; gKept = true; useSource('google'); copyrightOnce(); return gSession; }
  const key = gKey, ac = new AbortController(); let timer;
  googleJob813 = (async () => {
    try {
      const request = fetch('https://tile.googleapis.com/v1/createSession?key=' + encodeURIComponent(key), {method: 'POST', signal: ac.signal, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mapType: 'satellite', language: 'en-AU', region: 'AU', scale: 'scaleFactor2x', highDpi: true})})
        .then(async r => { if (!r.ok) throw new Error('session ' + r.status); const j = await r.json(); if (!j.session || j.tileWidth !== 512) throw new Error('session shape'); return j; });
      const deadline = new Promise((_, reject) => { timer = setTimeout(() => { ac.abort(); reject(new Error('session timed out')); }, 20000); });
      const j = await Promise.race([request, deadline]);
      if (key !== gKey) return null;
      gSession = j.session; gState = 'ok'; googleRetryAt813 = 0; gKept = false;
      try { localStorage.setItem(GS_KEY, JSON.stringify({session: j.session, exp: j.expiry, k: keyPrint(key)})); } catch (_) {}
      useSource('google'); copyrightOnce(); return gSession;
    } catch (e) {
      if (key === gKey) { gState = /session (?:40[0-4]|shape)/.test(String(e)) ? 'no' : 'retry'; googleRetryAt813 = performance.now() + 15000; useSource('mapbox'); }
      return null;
    } finally { clearTimeout(timer); googleJob813 = null; }
  })();
  return googleJob813;
}
let gKept = false, copyrightAsked = false;
function copyrightOnce() { if (copyrightAsked) return; copyrightAsked = true;   /* the imagery credit, after the first tiles have had the line to themselves */
  setTimeout(() => fetch(`https://tile.googleapis.com/tile/v1/viewport?session=${gSession}&key=${encodeURIComponent(gKey)}&zoom=20&north=-27.972&south=-28.004&east=153.436&west=153.405`).then(r => r.ok ? r.json() : null).then(v => { if (v && v.copyright) { gCopy = v.copyright; setAttrib(); } }).catch(() => {}), 1500); }
function useSource(src) { if (src === SOURCE) return; SOURCE = src; for (const t of tiles.values()) if (t.bm) t.bm.close(); tiles.clear(); tileTries.clear(); cancelTiles(); mosaics.clear(); setAttrib(); requestPaint(); }
function setAttrib() { sourceProvider813();
  const a = $('attrib'); if (!a) return;
  if (mode === 'original') { a.innerHTML = 'Drawing © iEDM · D001 rev 03'; return; }
  a.innerHTML = SOURCE === 'google' ? `<img src="assets/google_logo_white.png" alt="Google" class="glogo"> ${esc(gCopy)} · Drawing © iEDM D001 rev 03`
    : '<a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">© Mapbox</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a> © Maxar · Drawing © iEDM D001 rev 03';
}
const TILE = 512, tiles = new Map(), TILE_CAP = PHONE ? 90 : 200, inflight = new Map(); let queue = new Map(), running = 0, tileGen = 0;
const satWanted = new Set(), goalWanted = new Set(), keepWanted = new Set();   /* what the last frame needed; where the glide lands; the PNG export's */
/* a tile that fails (404, 503, no network) is tried again after 2, 4, 8, 16, 30 s, then every 30 s while it is in view;
   the count survives eviction. satState says what the last frame saw: '' fine, 'partial' some failed, 'down' none arrived */
const tileTries = new Map(); let satState = '', satWhy = '', retryTimer = 0;
function tileRetryAt(key) { const n = tileTries.get(key) || 1; return performance.now() + Math.min(30000, 1000 * Math.pow(2, n)); }
function mat(m) { return m; }                                                    /* 3x3 row-major arrays from georeferencing.json */
function mul(a, b) { const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j]; return r; }
function inv(m) { const [[a, b, c], [d, e, f]] = m, det = a * e - b * d; return [[e / det, -b / det, (b * f - c * e) / det], [-d / det, a / det, (c * d - a * f) / det], [0, 0, 1]]; }
function ap(m, x, y) { return [m[0][0] * x + m[0][1] * y + m[0][2], m[1][0] * x + m[1][1] * y + m[1][2]]; }
/* v6.90 - THE SATELLITE IS THE MAP (Andrew Fisher, 27 Sep 2026: "not rotate the map itself ... look at different
   angles ... north east south west"). In the satellite modes the photograph fills the whole view at any angle, like a
   real map; the plan is laid on it where it belongs: the main plan inside its own frame (the legend, title block and the
   inset's box are not part of the ground and are left off), and the lower-right inset drawn at its true place north of
   Surfers Paradise, through its own registration, only where the main plan does not already draw the ground. */
let TIN = null, TIN_INV = null, GB = null;
function geoOn() { return mode !== 'original' && !!GEO && !!TIN; }
function geoSetup() { if (!GEO || !GEO.inset || !GEO.main) return; TIN = mul(inv(GEO.main.sheet_to_z18px), GEO.inset.sheet_to_z18px); TIN_INV = inv(TIN);
  const m = GEO.main.sheet_region_pts, r = GEO.inset.sheet_region_pts, c = [[r[0], r[1]], [r[2], r[1]], [r[0], r[3]], [r[2], r[3]]].map(([x, y]) => ap(TIN, x, y));
  GB = {x0: Math.min(m[0], ...c.map(p => p[0])), y0: Math.min(m[1], ...c.map(p => p[1])), x1: Math.max(m[2], ...c.map(p => p[0])), y1: Math.max(m[3], ...c.map(p => p[1])), inset: c}; }
function inInset(x, y) { const r = GEO && GEO.inset.sheet_region_pts; return !!r && insetOn && x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]; }
/* a point printed on the sheet, put where it is on the ground (only the inset moves) */
function toGeo(x, y) { if (geoOn() && inInset(x, y)) { const q = ap(TIN, x, y); return {x: q[0], y: q[1]}; } return {x, y}; }
function geoRect(bb) { if (!geoOn() || !inInset((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)) return bb; const q = [[bb[0], bb[1]], [bb[2], bb[1]], [bb[0], bb[3]], [bb[2], bb[3]]].map(([x, y]) => ap(TIN, x, y)); return [Math.min(...q.map(p => p[0])), Math.min(...q.map(p => p[1])), Math.max(...q.map(p => p[0])), Math.max(...q.map(p => p[1]))]; }
function regionsForTiles(v) {
  if (!GEO) return [];
  /* the photograph for the view, out to about 1.8 km round the plan (v6.97, was 600 m: a phone's full view, taller than the
     sheet, showed black bands above and below it): enough to turn and look about, never the whole coast */
  if (geoOn() && v) { const M = 2600, x0 = Math.max(v.x - 2, GB.x0 - M), y0 = Math.max(v.y - 2, GB.y0 - M), x1 = Math.min(v.x + v.w + 2, GB.x1 + M), y1 = Math.min(v.y + v.h + 2, GB.y1 + M);
    return x1 > x0 && y1 > y0 ? [{key: 'geo', M: GEO.main.sheet_to_z18px, rect: [x0, y0, x1, y1], holes: []}] : []; }
  const out = [{key: 'main', M: GEO.main.sheet_to_z18px, rect: GEO.main.sheet_region_pts, holes: insetOn ? GEO.main.exclude_pts : []}];
  if (insetOn) out.push({key: 'inset', M: GEO.inset.sheet_to_z18px, rect: GEO.inset.sheet_region_pts, holes: []});
  return out;
}
/* v6.97 - the tile zoom the screen's own pixels need: at most 1.23 device px per photo px (was up to 1.41, soft on a
   phone); while the hand moves the zoom holds within a band so the picture is not rebuilt at every step */
const satZHeld = new Map();
function tileZoomFor(v, M, hold) {
  const k = Math.hypot(M[0][0], M[0][1]);                                        /* z18 px per sheet pt */
  const devPerPt = v.scale * dpr, want = 18 + Math.log2(devPerPt / k);           /* one device px per tile px */
  let z = clamp(Math.ceil(want - .3), 12, tileMaxZ());
  if (hold) { const h = satZHeld.get(hold); if (h != null && (interacting || zAnim) && want > h - 1 && want < h + .8) z = h; satZHeld.set(hold, z); }
  return {z, over: want > tileMaxZ() + .35};
}
function tileKey(z, x, y) { return z + '/' + x + '/' + y; }
function requestTile(z, x, y, prio, goal) {
  const key = tileKey(z, x, y); (goal === 'keep' ? keepWanted : goal ? goalWanted : satWanted).add(key); if (tiles.has(key) || inflight.has(key)) return;
  const q = queue.get(key); if (q) { q.prio = Math.min(q.prio, prio); return; }
  queue.set(key, {z, x, y, key, prio, gen: tileGen}); pumpSoon();
}
let pumpQueued = false; function pumpSoon() { if (pumpQueued) return; pumpQueued = true; queueMicrotask(() => { pumpQueued = false; pump(); }); }
function pump() {
  if (!queue.size || running >= 8) return;
  const order = [...queue.values()].sort((a, b) => a.prio - b.prio);
  for (const t of order) {
    if (running >= 8) break; queue.delete(t.key); if (t.gen !== tileGen || tiles.has(t.key) || inflight.has(t.key)) continue; running++;
    const ac = new AbortController(), source = SOURCE; inflight.set(t.key, ac);
    let finished = false, timer = 0;
    const owns = () => t.gen === tileGen && source === SOURCE && inflight.get(t.key) === ac && !ac.signal.aborted;
    const finish = () => { if (finished) return; finished = true; clearTimeout(timer); if (inflight.get(t.key) === ac) inflight.delete(t.key); running--; pumpSoon(); };
    ac.signal.addEventListener('abort', finish, {once: true});
    const g = source === 'google' && gSession;
    const fail = e => {
      if (!owns() || e.name === 'AbortError') return;
      const attempts = (tileTries.get(t.key) || 0) + 1; tileTries.delete(t.key); tileTries.set(t.key, attempts);
      tiles.set(t.key, {bm: null, at: performance.now(), err: String(e), retryAt: tileRetryAt(t.key)}); satWhy = String(e); evict(); requestPaint();
      if (g && /40[0-4]/.test(String(e))) {
        gSession = null; tiles.delete(t.key); tileTries.delete(t.key);
        if (gKept) { try { localStorage.removeItem(GS_KEY); } catch (_) {} gKept = false; ensureGoogle(true); return; }
        gState = 'no'; useSource('mapbox'); return;
      }
      if (/401|403/.test(String(e))) keyProblem();
    };
    timer = setTimeout(() => { if (owns()) fail(new Error('tile timed out')); ac.abort(); }, 20000);
    const url = g ? `https://tile.googleapis.com/v1/2dtiles/${t.z}/${t.x}/${t.y}?session=${encodeURIComponent(gSession)}&key=${encodeURIComponent(gKey)}` : `https://api.mapbox.com/v4/mapbox.satellite/${t.z}/${t.x}/${t.y}@2x.jpg90?access_token=${encodeURIComponent(mapKey)}`;
    fetch(url, {signal: ac.signal, cache: tileTries.has(t.key) ? 'reload' : 'force-cache'})
      .then(r => { if (!r.ok) throw new Error('tile ' + r.status); if (!owns()) throw new DOMException('View changed', 'AbortError'); perf.tileBytes += +(r.headers.get('content-length') || 0); return r.blob(); })
      .then(b => { if (!owns()) throw new DOMException('View changed', 'AbortError'); return createImageBitmap(b); })
      .then(bm => {
        if (!owns()) { bm.close(); return; }
        const old = tiles.get(t.key); if (old && old.bm && old.bm !== bm) old.bm.close();
        tiles.set(t.key, {bm, at: performance.now()}); tileTries.delete(t.key); perf.tilesFetched++; evict(); requestPaint();
      })
      .catch(fail).finally(finish);
  }
}
/* the cache keeps what is on screen and the coarse tiles under it longest (a tile drawn this frame has a fresh 'at') */
function evict() {
  if (tiles.size > TILE_CAP) {
    const arr = [...tiles.entries()].sort((a, b) => a[1].at - b[1].at);
    for (const [k, v] of arr.slice(0, tiles.size - TILE_CAP)) { if (v.bm) v.bm.close(); tiles.delete(k); }
  }
  /* Keep recent backoff history across bitmap eviction, with a separate finite bound. */
  while (tileTries.size > TILE_CAP * 2) tileTries.delete(tileTries.keys().next().value);
}
function cancelTiles() { tileGen++; queue.clear(); for (const ac of inflight.values()) ac.abort(); inflight.clear(); }
/* after a frame at rest: forget queued tiles nobody needs now, and stop downloads for views already left */
function pruneTiles(atRest) {
  const want = k => satWanted.has(k) || goalWanted.has(k) || keepWanted.has(k);
  for (const k of queue.keys()) if (!want(k)) queue.delete(k);
  if (atRest) for (const [k, ac] of inflight) if (!want(k)) { ac.abort(); inflight.delete(k); }
}
function keyProblem() { if (keyState === 'bad') return; keyState = 'bad'; toast('Mapbox refused the tiles for this address. The token is restricted to the dashboard address list; the drawing stays available.', 9000); }
/* the tiles of zoom z under a sheet-space rectangle (the view, or the view grown by a margin), for region R */
function satRange(R, z, x0v, y0v, x1v, y1v) {
  const f = Math.pow(2, z - 18), Mz = mul([[f, 0, 0], [0, f, 0], [0, 0, 1]], R.M);
  const [x0, y0, x1, y1] = R.rect, vx0 = Math.max(x0v, x0), vy0 = Math.max(y0v, y0), vx1 = Math.min(x1v, x1), vy1 = Math.min(y1v, y1);
  if (vx1 <= vx0 || vy1 <= vy0) return null;
  const c = [ap(Mz, vx0, vy0), ap(Mz, vx1, vy0), ap(Mz, vx0, vy1), ap(Mz, vx1, vy1)];
  return {Mz, tx0: Math.floor(Math.min(c[0][0], c[1][0], c[2][0], c[3][0]) / TILE), tx1: Math.floor(Math.max(c[0][0], c[1][0], c[2][0], c[3][0]) / TILE),
    ty0: Math.floor(Math.min(c[0][1], c[1][1], c[2][1], c[3][1]) / TILE), ty1: Math.floor(Math.max(c[0][1], c[1][1], c[2][1], c[3][1]) / TILE)};
}
function satCanFetch() { return SOURCE === 'google' ? !!gSession : !!mapKey; }
/* v6.97 - the coarse photograph two zooms up, over the view and half a view round it: a few tiles that stand in at once
   for a pan, a zoom out or a zoom in, so the satellite is never a black square while its sharp tiles come */
function requestCoarse(v, R, z) {
  const zc = Math.max(12, z - 2); if (zc === z) return; const mx = v.w * .5, my = v.h * .5, r = satRange(R, zc, v.x - mx, v.y - my, v.x + v.w + mx, v.y + v.h + my); if (!r) return;
  if ((r.tx1 - r.tx0 + 1) * (r.ty1 - r.ty0 + 1) > 36) return;
  for (let ty = r.ty0; ty <= r.ty1; ty++) for (let tx = r.tx0; tx <= r.tx1; tx++) { const t = tiles.get(tileKey(zc, tx, ty)); if (t) { if (t.bm) t.at = performance.now(); continue; } requestTile(zc, tx, ty, 500 + Math.hypot(tx - (r.tx0 + r.tx1) / 2, ty - (r.ty0 + r.ty1) / 2)); }
}
function drawTiles(v) {
  if (mode === 'original') return;
  if (!mapKey && SOURCE !== 'google') { if (keyState === 'none' || keyState === 'bad') setSatState('down'); return; }
  const S2D = sheetToDevice(dpr * v.scale, canvas.width, canvas.height), fetchOK = satCanFetch(), moving = interacting || !!zAnim;
  let anyOver = false, missing = 0, failed = 0, shown = 0, nextRetry = Infinity; const now = performance.now();
  for (const R of regionsForTiles(v)) {
    const {z, over} = tileZoomFor(v, R.M, R.key); anyOver = anyOver || over;
    const rg = satRange(R, z, v.x, v.y, v.x + v.w, v.y + v.h); if (!rg) continue;
    const {Mz, tx0, tx1, ty0, ty1} = rg, Minv = inv(Mz), [x0, y0, x1, y1] = R.rect;
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 120) continue;                       /* never a flood: the zoom choice keeps this small */
    if (fetchOK) requestCoarse(v, R, z);
    ctx.save(); ctx.setTransform(...S2D); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0);
    for (const h of R.holes) ctx.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]); ctx.clip('evenodd');
    ctx.transform(Minv[0][0], Minv[1][0], Minv[0][1], Minv[1][1], Minv[0][2], Minv[1][2]);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = moving ? 'low' : 'high';
    const cxT = (tx0 + tx1) / 2, cyT = (ty0 + ty1) / 2;
    /* v6.90 - ONE SEAMLESS PHOTOGRAPH. The tiles are laid edge to edge, pixel for pixel, on one picture, and that picture is
       turned and scaled once. Drawn one by one at an angle, every tile's edge was smoothed against nothing and left a dark
       hairline where tiles met; now the smoothing runs across the joins as if there were none (and it is one draw, not 30). */
    const nx = tx1 - tx0 + 1, ny = ty1 - ty0 + 1, mz = mosaicFor(R.key, z, tx0, ty0, nx, ny);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const t = tiles.get(tileKey(z, tx, ty));
      if (t && t.bm) { t.at = now; shown++; satWanted.add(tileKey(z, tx, ty)); mz.put(tx - tx0, ty - ty0, t, null, null); }
      else { missing++;
        if (t && t.err) { failed++; if (now >= t.retryAt) { tiles.delete(tileKey(z, tx, ty)); if (fetchOK) requestTile(z, tx, ty, Math.hypot(tx - cxT, ty - cyT)); } else nextRetry = Math.min(nextRetry, t.retryAt); }
        else if (!t) { if (tileTries.has(tileKey(z, tx, ty))) failed++; if (fetchOK && !zAnim) requestTile(z, tx, ty, Math.hypot(tx - cxT, ty - cyT)); else satWanted.add(tileKey(z, tx, ty)); }   /* mid-glide the levels flash past: ask only for where it lands */
        const p = parentTile(z, tx, ty), kids = childTiles(z, tx, ty);
        if (p || kids) { shown++; mz.put(tx - tx0, ty - ty0, null, p, kids); } else { if (probeF) probeF.satBlank++; mz.put(tx - tx0, ty - ty0, null, null, null); } }
    }
    ctx.drawImage(mz.canvas, 0, 0, nx * TILE, ny * TILE, tx0 * TILE, ty0 * TILE, nx * TILE, ny * TILE);
    if (bright !== 1) { ctx.setTransform(...S2D); ctx.fillStyle = bright < 1 ? `rgba(0,0,0,${1 - bright})` : `rgba(255,255,255,${(bright - 1) * .8})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
    ctx.restore();
  }
  show($('overzoom'), anyOver);
  if (probeF) probeF.satMiss += missing;
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
  cancelTiles(); clearTimeout(retryTimer); retryTimer = 0;
  for (const [k, t] of tiles) if (!t.bm) tiles.delete(k); tileTries.clear(); satWhy = '';
  /* Retry is explicit: release stuck slots and re-arm a failed session without discarding usable imagery. */
  if (gKey && !gSession) { gState = 'unknown'; googleRetryAt813 = 0; ensureGoogle(true).then(() => requestPaint()); }
  if (keyState === 'none' || keyState === 'bad') { mapKey = null; keyState = 'unknown'; ensureKey().then(() => requestPaint()); }
  satState = 'retry'; setSatState(''); changeView(false);
}
/* the picture the tiles are laid on: kept between frames; a cell is redrawn only when what belongs in it changes */
const mosaics = new Map();
function mosaicFor(key, z, x0, y0, nx, ny) {
  let m = mosaics.get(key); const W = nx * TILE, H = ny * TILE;
  if (!m) { m = {canvas: document.createElement('canvas'), cells: new Map()}; m.g = m.canvas.getContext('2d', {alpha: false}); mosaics.set(key, m); }
  if (m.z !== z || m.x0 !== x0 || m.y0 !== y0 || m.canvas.width < W || m.canvas.height < H) {
    const old = m.cells, sameZ = m.z === z, dx = (m.x0 - x0) * TILE, dy = (m.y0 - y0) * TILE;
    if (m.canvas.width < W || m.canvas.height < H) { m.canvas.width = Math.max(W, m.canvas.width); m.canvas.height = Math.max(H, m.canvas.height); m.g = m.canvas.getContext('2d', {alpha: false}); m.cells = new Map(); }
    else if (sameZ && (dx || dy)) { m.g.globalCompositeOperation = 'copy'; m.g.drawImage(m.canvas, dx, dy); m.g.globalCompositeOperation = 'source-over'; const moved = new Map(); for (const [k, v] of old) { const [cx, cy] = k.split(',').map(Number), nx2 = cx + m.x0 - x0, ny2 = cy + m.y0 - y0; if (nx2 >= 0 && ny2 >= 0) moved.set(nx2 + ',' + ny2, v); } m.cells = moved; }
    else m.cells = new Map();
    m.z = z; m.x0 = x0; m.y0 = y0;
  }
  m.put = (cx, cy, t, p, kids) => { const k = cx + ',' + cy, want = t ? t.bm : (p ? 'p' + p.d + '_' + p.sx + '_' + p.sy : '') + (kids ? 'k' + kids.map(q => q ? 1 : 0).join('') : '') || 'none';
    if (m.cells.get(k) === want) return;
    m.g.imageSmoothingEnabled = true; m.g.imageSmoothingQuality = 'high';
    if (t) m.g.drawImage(t.bm, cx * TILE, cy * TILE, TILE, TILE);
    else { if (!p || kids) { m.g.fillStyle = '#0b0908'; m.g.fillRect(cx * TILE, cy * TILE, TILE, TILE); }
      if (p) m.g.drawImage(p.bm, p.sx, p.sy, p.sw, p.sw, cx * TILE, cy * TILE, TILE, TILE);
      if (kids) kids.forEach((q, i) => { if (q) m.g.drawImage(q.bm, cx * TILE + (i & 1) * TILE / 2, cy * TILE + (i >> 1) * TILE / 2, TILE / 2, TILE / 2); }); }
    m.cells.set(k, want); };
  return m;
}
/* a missing tile's stand-ins: the nearest cached ancestor (up to six zooms up), and any of its four children already
   here from a closer look (zooming out) */
function parentTile(z, x, y) { for (let d = 1; d <= 6 && z - d >= 12; d++) { const t = tiles.get(tileKey(z - d, x >> d, y >> d)); if (t && t.bm) { t.at = performance.now(); const s = TILE >> d; return {bm: t.bm, d, sx: (x & ((1 << d) - 1)) * s, sy: (y & ((1 << d) - 1)) * s, sw: s}; } } return null; }
function childTiles(z, x, y) { if (z >= tileMaxZ()) return null; let any = false; const out = [0, 1, 2, 3].map(i => { const t = tiles.get(tileKey(z + 1, 2 * x + (i & 1), 2 * y + (i >> 1))); if (t && t.bm) { any = true; return t; } return null; }); return any ? out : null; }
/* ---------------------------------------------------------------- the drawing, as render tiles
   The drawing is shown in 512-device-pixel tiles at quantised scale levels (device px per sheet pt = 2^L). Levels -3 to
   3.25 (quarter octaves) are pre-rendered (assets/vt, read by byte range and decoded off the thread). Past the top of
   the pyramid the worker builds each tile's SVG from the source primitives at half octaves (L 3.5, 4, 4.5 ...) and the page
   rasterises it once. v6.97: the level is the first one AT OR ABOVE the screen's density, so a tile is only ever drawn
   the same size or smaller (sharp), never stretched (soft); the lowest level loaded stays cached for good, so the whole
   sheet is always there to stand in; a glide's destination is fetched first; nothing off screen is queued. */
const VT = 512, vtiles = new Map(), VT_CAP = PHONE ? 110 : 240, vtQueue = new Map(), vtInflight = new Map(), vtWanted = new Set(), vtGoal = new Set(); let vtBusy = 0, svgBusy = 0, PYR_LEVELS = [];
const pyrHas = L => !!PYR && PYR_LEVELS.includes(L);
function levelFor(v) { const need = Math.log2(v.scale * dpr);                                  /* device px per sheet pt = 2^L */
  if (!PYR) return Math.round(need * 4) / 4;
  for (const L of PYR_LEVELS) if (L >= need - .07) return L;                                   /* 5% stretch at most */
  return Math.max(PYR_MAX + .25, Math.ceil((need - .07) * 2) / 2); }                            /* past the pyramid: half octaves from the vectors */
function vtKey(m, L, tx, ty) { return m + '|' + L + '|' + tx + '|' + ty; }
function visibleVT(v, L) {
  const s = Math.pow(2, L), span = VT / s;                                                 /* sheet pts per tile at level L */
  const x0 = Math.max(0, Math.floor(v.x / span)), y0 = Math.max(0, Math.floor(v.y / span));
  const x1 = Math.min(Math.ceil(SHEET_W / span) - 1, Math.floor((v.x + v.w) / span)), y1 = Math.min(Math.ceil(SHEET_H / span) - 1, Math.floor((v.y + v.h) / span));
  return {s, span, x0, y0, x1, y1};
}
const covers = (ts, x, y) => ts.some(t => x >= t.x - .01 && x <= t.x + t.w + .01 && y >= t.y - .01 && y <= t.y + t.h + .01);
/* v6.97 - a picture drawn only inside a set of sheet rectangles, by cropping its source: no clip path, so no clip mask for
   the graphics chip to build every frame (the single biggest cost of a moving frame in the test browser) */
const SHEET_RECTS = [[0, 0, SHEET_W, SHEET_H]];
function drawCropped(t, rects) { const kx = (t.pw || t.canvas.width) / t.w, ky = (t.ph || t.canvas.height) / t.h;
  for (const r of rects) { const x0 = Math.max(r[0], t.x), y0 = Math.max(r[1], t.y), x1 = Math.min(r[2], t.x + t.w), y1 = Math.min(r[3], t.y + t.h); if (x1 - x0 < 1e-6 || y1 - y0 < 1e-6) continue;
    if (!t.pw && x0 === t.x && y0 === t.y && x1 === t.x + t.w && y1 === t.y + t.h) ctx.drawImage(t.canvas, t.x, t.y, t.w, t.h);
    else ctx.drawImage(t.canvas, (x0 - t.x) * kx, (y0 - t.y) * ky, (x1 - x0) * kx, (y1 - y0) * ky, x0, y0, x1 - x0, y1 - y0); } }
/* a rectangle less the rectangles cut out of it, as up to four rectangles per hole */
function subtractRects(rects, h) { const out = []; for (const r of rects) { const ix0 = Math.max(r[0], h[0]), iy0 = Math.max(r[1], h[1]), ix1 = Math.min(r[2], h[2]), iy1 = Math.min(r[3], h[3]);
    if (ix1 <= ix0 || iy1 <= iy0) { out.push(r); continue; }
    if (r[1] < iy0) out.push([r[0], r[1], r[2], iy0]); if (iy1 < r[3]) out.push([r[0], iy1, r[2], r[3]]);
    if (r[0] < ix0) out.push([r[0], iy0, ix0, iy1]); if (ix1 < r[2]) out.push([ix1, iy0, r[2], iy1]); } return out; }
/* v6.97 - ONE SEAMLESS DRAWING AT REST, as the photograph is: the tiles of the level are laid edge to edge, pixel for
   pixel, on one picture (a missing tile's cell painted from the stand-ins), and that picture is drawn once. Drawn one by
   one at a fraction of a pixel, each tile's edge let a hairline of what is underneath show through (seen at 9,000% on
   solid fills). A cell is repainted only when what belongs in it changes. While the hand moves the tiles are drawn one
   by one (cheaper there, and a hairline cannot be seen in motion) and the level holds within a band (never more than
   1.4x stretched), so nothing is rebuilt at every quarter step; the frame at rest is exact and seamless. */
const clipRects = (rects, c) => rects.map(r => [Math.max(r[0], c[0]), Math.max(r[1], c[1]), Math.min(r[2], c[2]), Math.min(r[3], c[3])]).filter(r => r[2] > r[0] && r[3] > r[1]);
const vmosaics = new Map(), vHeld = new Map();
function vLevel(v, key) { const L = levelFor(v); if (!(interacting || zAnim)) { vHeld.set(key, L); return L; }
  const h = vHeld.get(key), need = Math.log2(v.scale * dpr); if (h != null && need >= h - .6 && need <= h + .5 && (pyrHas(h) || sceneReady)) return h; vHeld.set(key, L); return L; }
function vMosaic(key, L, x0, y0, nx, ny) {
  let m = vmosaics.get(key); const W = nx * VT, H = ny * VT;
  if (!m) { m = {canvas: document.createElement('canvas'), cells: new Map()}; m.g = m.canvas.getContext('2d'); vmosaics.set(key, m); }
  if (m.L !== L || m.x0 !== x0 || m.y0 !== y0 || m.canvas.width < W || m.canvas.height < H) {
    if (m.canvas.width < W || m.canvas.height < H) { m.canvas.width = Math.max(W, m.canvas.width); m.canvas.height = Math.max(H, m.canvas.height); m.g = m.canvas.getContext('2d'); m.cells = new Map(); }
    else if (m.L === L) { const dx = (m.x0 - x0) * VT, dy = (m.y0 - y0) * VT; m.g.globalCompositeOperation = 'copy'; m.g.drawImage(m.canvas, dx, dy); m.g.globalCompositeOperation = 'source-over';
      const moved = new Map(); for (const [k, s] of m.cells) { const [a, b] = k.split(',').map(Number), a2 = a + m.x0 - x0, b2 = b + m.y0 - y0; if (a2 >= 0 && b2 >= 0 && a2 * VT < m.canvas.width && b2 * VT < m.canvas.height) moved.set(a2 + ',' + b2, s); } m.cells = moved; }
    else { m.g.clearRect(0, 0, m.canvas.width, m.canvas.height); m.cells = new Map(); }
    m.L = L; m.x0 = x0; m.y0 = y0;
  }
  return m;
}
/* paint part of tile t into mosaic cell (cx, cy) whose sheet rectangle is c */
function paintInto(m, t, c, cx, cy, span) { const ix0 = Math.max(c[0], t.x), iy0 = Math.max(c[1], t.y), ix1 = Math.min(c[2], t.x + t.w), iy1 = Math.min(c[3], t.y + t.h); if (ix1 - ix0 < 1e-6 || iy1 - iy0 < 1e-6) return;
  const kx = t.canvas.width / t.w, ky = t.canvas.height / t.h, k = VT / span;
  m.g.drawImage(t.canvas, (ix0 - t.x) * kx, (iy0 - t.y) * ky, (ix1 - ix0) * kx, (iy1 - iy0) * ky, cx * VT + (ix0 - c[0]) * k, cy * VT + (iy0 - c[1]) * k, (ix1 - ix0) * k, (iy1 - iy0) * k); }
function drawVectorTiles(v, rects = SHEET_RECTS, mkey = 'main') {
  if (mode === 'satellite') return {missing: 0, total: 0};
  const L = vLevel(v, mkey), T = visibleVT(v, L), moving = interacting || !!zAnim, now = performance.now(); let missing = 0, total = 0, blank = 0;
  const nx = T.x1 - T.x0 + 1, ny = T.y1 - T.y0 + 1; if (nx <= 0 || ny <= 0) return {missing: 0, total: 0};
  const direct = moving, m = direct ? null : vMosaic(mkey, L, T.x0, T.y0, nx, ny), cx = (T.x0 + T.x1) / 2, cy = (T.y0 + T.y1) / 2, dExact = [], dStand = [];
  let near = null;   /* cached tiles of other levels over the view, found once a frame, only if a cell needs a stand-in */
  for (let ty = T.y0; ty <= T.y1; ty++) for (let tx = T.x0; tx <= T.x1; tx++) { total++; const key = vtKey('vt', L, tx, ty), t = vtiles.get(key), k = (tx - T.x0) + ',' + (ty - T.y0);
    const c = [tx * T.span, ty * T.span, (tx + 1) * T.span, (ty + 1) * T.span], ox = tx - T.x0, oy = ty - T.y0;
    if (t) { t.at = now; vtWanted.add(key); if (direct) { if (!t.empty) dExact.push(t); } else if (m.cells.get(k) !== t) { m.g.clearRect(ox * VT, oy * VT, VT, VT); if (!t.empty) m.g.drawImage(t.canvas, ox * VT, oy * VT, VT, VT); m.cells.set(k, t); } continue; }
    missing++; if (!zAnim) requestVT(L, tx, ty, Math.hypot(tx - cx, ty - cy)); else vtWanted.add(key);
    /* the stand-in: the finest coarser level that covers the cell (coarser ones under it only if none does), and while at
       rest finer tiles already here from a closer look, on top */
    if (!near) { near = []; for (const q of vtiles.values()) if (q.L !== L && !(q.x + q.w < v.x || q.x > v.x + v.w || q.y + q.h < v.y || q.y > v.y + v.h)) near.push(q); }
    const cc = [Math.max(c[0], 0), Math.max(c[1], 0), Math.min(c[2], SHEET_W), Math.min(c[3], SHEET_H)], hit = q => q.x < c[2] && q.x + q.w > c[0] && q.y < c[3] && q.y + q.h > c[1];
    const coarse = near.filter(q => q.L < L && hit(q)), fine = near.filter(q => q.L > L && q.L <= L + (moving ? .6 : 1.5) && hit(q)).sort((p, q) => p.L - q.L), use = [];
    for (const Lc of [...new Set(coarse.map(q => q.L))].sort((p, q) => q - p)) { const ts = coarse.filter(q => q.L === Lc); use.unshift(...ts); if (covers(ts, cc[0], cc[1]) && covers(ts, cc[2], cc[1]) && covers(ts, cc[0], cc[3]) && covers(ts, cc[2], cc[3])) break; }
    const all = use.concat(fine).filter(q => !q.empty); if (!use.length && !fine.length) blank++;
    for (const q of use) q.at = now;
    if (direct) { for (const q of all) dStand.push([q, c]); continue; }
    const sig = 's' + all.map(q => q.L + ':' + q.x.toFixed(2) + ':' + q.y.toFixed(2)).join('|');
    if (m.cells.get(k) !== sig) { m.g.clearRect(ox * VT, oy * VT, VT, VT); m.g.imageSmoothingEnabled = true; m.g.imageSmoothingQuality = moving ? 'low' : 'high'; for (const q of all) paintInto(m, q, c, ox, oy, T.span); m.cells.set(k, sig); }
  }
  if (direct) { for (const [q, c] of dStand) drawCropped(q, clipRects(rects, c)); for (const t of dExact) drawCropped(t, rects); }
  else drawCropped({canvas: m.canvas, pw: nx * VT, ph: ny * VT, x: T.x0 * T.span, y: T.y0 * T.span, w: nx * T.span, h: ny * T.span}, rects);
  /* at rest and whole: the ring of tiles just outside the view, so a pan opens onto the drawing already here */
  if (!moving && !missing && (pyrHas(L) || sceneReady)) { const gx = Math.ceil(SHEET_W / T.span), gy = Math.ceil(SHEET_H / T.span);
    for (let ty = T.y0 - 1; ty <= T.y1 + 1; ty++) for (let tx = T.x0 - 1; tx <= T.x1 + 1; tx++) { if (tx < 0 || ty < 0 || tx >= gx || ty >= gy || (tx >= T.x0 && tx <= T.x1 && ty >= T.y0 && ty <= T.y1)) continue; const key = vtKey('vt', L, tx, ty); if (vtiles.has(key)) vtWanted.add(key); else requestVT(L, tx, ty, 300 + Math.hypot(tx - cx, ty - cy)); } }
  /* and one octave closer for the middle half of the view: a pinch opens onto sharp tiles (a glide's are asked for anyway) */
  if (!moving && !missing && mkey === 'main' && pyrHas(L)) { const L2 = PYR_LEVELS.find(x => x >= L + 1); if (L2 != null) { const q = {x: v.x + v.w / 4, y: v.y + v.h / 4, w: v.w / 2, h: v.h / 2}, T2 = visibleVT(q, L2);
    if ((T2.x1 - T2.x0 + 1) * (T2.y1 - T2.y0 + 1) <= 12) for (let ty = T2.y0; ty <= T2.y1; ty++) for (let tx = T2.x0; tx <= T2.x1; tx++) { const key = vtKey('vt', L2, tx, ty); if (vtiles.has(key)) vtWanted.add(key); else requestVT(L2, tx, ty, 400 + Math.hypot(tx - (T2.x0 + T2.x1) / 2, ty - (T2.y0 + T2.y1) / 2)); } } }
  if (probeF) { probeF.vtMiss += missing; probeF.vtTot += total; probeF.vtBlank += blank; }
  if (vtQueue.size) pumpVT();
  return {missing, total};
}
const vtRetry = new Map();   /* a drawing tile that failed is asked for again after 1, 2, 4 ... 30 s */
function requestVT(L, tx, ty, prio, goal) { const key = vtKey('vt', L, tx, ty); (goal ? vtGoal : vtWanted).add(key); if (vtiles.has(key) || vtInflight.has(key)) return;
  const rt = vtRetry.get(key); if (rt && performance.now() < rt.at) return;
  const q = vtQueue.get(key); if (q) { q.prio = Math.min(q.prio, prio); q.goal = q.goal || !!goal; return; } vtQueue.set(key, {key, L, tx, ty, prio, goal: !!goal}); }
function pumpVT() {
  if (!ready || !vtQueue.size) return; const moving = interacting || !!zAnim;
  const order = [...vtQueue.values()].sort((a, b) => (b.goal - a.goal) || a.prio - b.prio);
  for (const q of order) {
    const svg = !pyrHas(q.L);
    if (svg) { if (!sceneReady) { if (!moving) ensureScene().catch(() => {}); continue; } if (svgBusy >= (PHONE ? 1 : 3) || (moving && !q.goal)) continue; }
    else if (vtBusy >= 6) continue;
    vtQueue.delete(q.key); if (vtiles.has(q.key) || vtInflight.has(q.key)) continue;
    const s = Math.pow(2, q.L), span = VT / s, view = {x: q.tx * span, y: q.ty * span, w: span, h: span, scale: s / dpr}, t0 = performance.now();
    const put = bm => { vtiles.set(q.key, bm ? {canvas: bm, L: q.L, x: view.x, y: view.y, w: span, h: span, at: performance.now()} : {empty: true, L: q.L, x: view.x, y: view.y, w: span, h: span, at: performance.now()}); evictVT(); requestPaint(); };
    if (!svg) {                                     /* pre-rendered: a small lossless WebP, decoded off the thread */
      const ac = new AbortController(); vtBusy++; vtInflight.set(q.key, ac);
      fetchVT(q, ac.signal).then(r => r === null ? null : r.status === 404 && !(PYR && PYR.packed) ? null : r.ok ? r.blob() : Promise.reject(new Error('vt ' + r.status)))
        .then(b => b ? createImageBitmap(b) : null)
        .then(bm => { put(bm); vtRetry.delete(q.key); perf.vtFetched = (perf.vtFetched || 0) + 1; perf.lastRender = {ms: Math.round(performance.now() - t0), count: null, zoom: camera.z, from: 'pyramid'}; })
        .catch(e => { if (e.name === 'AbortError') return; console.warn('pyramid tile', e); if (/vt (404|410)|not honoured/.test(String(e))) return dropLevelFile(q.L);
          const n = ((vtRetry.get(q.key) || {}).n || 0) + 1, wait = Math.min(30000, 1000 * Math.pow(2, n - 1)); vtRetry.set(q.key, {n, at: performance.now() + wait}); setTimeout(requestPaint, wait + 20); }).finally(() => { vtBusy--; if (vtInflight.get(q.key) === ac) vtInflight.delete(q.key); pumpVT(); });
      continue;
    }
    svgBusy++; vtInflight.set(q.key, null);          /* past the pyramid: from the vectors, in the worker; one raster on the page */
    svgFromWorker(view, VT, VT, false, 'hybrid').then(res => rasterSvg(res.svg, VT).then(bm => { put(bm); perf.lastRender = {ms: Math.round(performance.now() - t0), count: res.count, zoom: camera.z}; perf.vtRendered = (perf.vtRendered || 0) + 1; }))
      .catch(e => { if (!/View changed/.test(String(e))) console.warn('tile render', e); })
      .finally(() => { svgBusy--; vtInflight.delete(q.key); pumpVT(); });
  }
}
/* a packed level file the server does not have (a half-finished deploy): its levels are dropped and the next ones used */
function dropLevelFile(L) { const lv = PYR && PYR.levels.find(l => l.L === L); if (!lv) return; const f = lv.file;
  PYR.levels = PYR.levels.filter(l => l.file !== f); PYR_LEVELS = PYR.levels.map(l => l.L).sort((a, b) => a - b); PYR_MAX = PYR_LEVELS[PYR_LEVELS.length - 1];
  for (const k of [...vtQueue.keys()]) if (!pyrHas(vtQueue.get(k).L) && vtQueue.get(k).L <= PYR_MAX) vtQueue.delete(k); console.warn('pyramid file missing, levels dropped:', f); requestPaint(); }
/* the lowest levels (the whole sheet in a few tiles) are never evicted: they are the stand-in of last resort */
function evictVT() { if (vtiles.size <= VT_CAP) return; const arr = [...vtiles.entries()].filter(e => e[1].L > -1).sort((a, b) => a[1].at - b[1].at); for (const [k, t] of arr.slice(0, vtiles.size - VT_CAP)) { if (t.canvas && t.canvas.close) t.canvas.close(); vtiles.delete(k); } }
/* a pyramid tile: from the packed level file by byte range when the manifest is packed (the hosted service keeps few
   files), else from its own file; a tile the manifest does not list is empty and costs no request */
function fetchVT(q, signal) {
  if (PYR && PYR.packed) { const lv = PYR.levels.find(l => l.L === q.L); const e = lv && lv.tiles[q.tx + '_' + q.ty]; if (!e) return Promise.resolve(null);
    return fetch(`assets/vt/${lv.file}`, {signal, headers: {Range: `bytes=${e[0]}-${e[0] + e[1] - 1}`}}).then(r => r.status === 206 ? r : r.status === 200 ? Promise.reject(new Error('vt range not honoured')) : r); }
  return fetch(`assets/vt/L${q.L}/${q.tx}_${q.ty}.webp`, {signal});
}
/* an SVG made into pixels once: decoded, then a bitmap, so the canvas never re-rasterises the vectors */
async function rasterSvg(svg, size) {
  const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml;charset=utf-8'}));
  try { const img = new Image(); img.src = url; await img.decode(); return await createImageBitmap(img, {resizeWidth: size, resizeHeight: size}); }
  finally { URL.revokeObjectURL(url); }
}
function dropVTQueue() { for (const [k, q] of vtQueue) if (!q.goal) vtQueue.delete(k); }
function pruneVT(atRest) {
  if (atRest) for (const [k, ac] of vtInflight) if (ac && !vtWanted.has(k) && !vtGoal.has(k)) { ac.abort(); vtInflight.delete(k); }
}
/* v6.97 - where a glide lands, asked for the moment it starts (drawing and photograph), ahead of anything else */
function prefetchView(v) {
  vtGoal.clear(); goalWanted.clear(); if (!ready || under3d()) return;
  if (mode !== 'satellite') { const L = levelFor(v), T = visibleVT(v, L), cx = (T.x0 + T.x1) / 2, cy = (T.y0 + T.y1) / 2;
    if ((T.x1 - T.x0 + 1) * (T.y1 - T.y0 + 1) <= 80) for (let ty = T.y0; ty <= T.y1; ty++) for (let tx = T.x0; tx <= T.x1; tx++) requestVT(L, tx, ty, -100 + Math.hypot(tx - cx, ty - cy), true); }
  if (mode !== 'original' && satCanFetch()) for (const R of regionsForTiles(v)) { const {z} = tileZoomFor(v, R.M), r = satRange(R, z, v.x, v.y, v.x + v.w, v.y + v.h); if (!r || (r.tx1 - r.tx0 + 1) * (r.ty1 - r.ty0 + 1) > 120) continue;
    for (let ty = r.ty0; ty <= r.ty1; ty++) for (let tx = r.tx0; tx <= r.tx1; tx++) requestTile(z, tx, ty, -100 + Math.hypot(tx - (r.tx0 + r.tx1) / 2, ty - (r.ty0 + r.ty1) / 2), true); }
  pumpVT(); pumpSoon();
}
let probeF = null, loaderAt = 0;
function show(el, on) { const d = on ? '' : 'none'; if (el && el.style.display !== d) el.style.display = d; }
function draw() {
  paintID = 0; const t0 = performance.now(); const v = currentView();
  probeF = {t: t0, vtMiss: 0, vtTot: 0, vtBlank: 0, satMiss: 0, satBlank: 0, underMiss: 0}; satWanted.clear(); vtWanted.clear();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b0908'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = interacting || zAnim ? 'low' : 'high';
  const S2D = sheetToDevice(dpr * v.scale, canvas.width, canvas.height);
  ctx.setTransform(...S2D);
  if (mode === 'original') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, SHEET_W, SHEET_H);
    if (UNDER.length && PYR) drawUnderlay(v); else { const pic = preview || overview; if (pic) ctx.drawImage(pic, 0, 0, SHEET_W, SHEET_H); if (!UNDER_DONE) probeF.underMiss++; } }
  else {
    if (!geoOn()) { ctx.fillStyle = '#17120f'; ctx.fillRect(0, 0, SHEET_W, SHEET_H); }                /* the sheet, dark: no white under the photograph */
    if (legendOn && !geoOn()) { const pic = preview || overview; ctx.save(); ctx.beginPath(); ctx.rect(0, 1466, SHEET_W, SHEET_H - 1466); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 1466, SHEET_W, SHEET_H - 1466); if (pic) ctx.drawImage(pic, 0, 0, SHEET_W, SHEET_H); ctx.restore(); }
    drawTiles(v); ctx.setTransform(...S2D);
    if (!satCanFetch() && keyState !== 'none' && keyState !== 'bad') probeF.satMiss++;   /* the key or the session is still on its way */
  }
  let vt = null;
  if (mode !== 'satellite') {
    if (geoOn()) vt = drawPlanOnGround(v, S2D);
    else { ctx.save(); ctx.globalAlpha = mode === 'hybrid' ? opacity : 1; vt = drawVectorTiles(v); ctx.restore(); }
  }
  drawMarks(v);
  if (highlight) { const [x0, y0, x1, y1] = geoRect(highlight), pad = 7 / v.scale; ctx.fillStyle = '#ffb60033'; ctx.strokeStyle = '#ff6a13'; ctx.lineWidth = 2 / v.scale; ctx.fillRect(x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad); ctx.strokeRect(x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); updateMini(v);
  if (ready) { if (mode !== 'original' && satState === 'down') quality('bad', 'Satellite imagery not loading' + (mode === 'hybrid' ? ' · plan shown on its own' : ''));
    else if (mode !== 'original' && satState === 'partial') quality('busy', 'Some satellite tiles did not load · retrying');
    else if (mode === 'satellite') quality(probeF.satMiss ? 'busy' : 'sharp', (probeF.satMiss ? 'Satellite only · sharpening' : 'Satellite only') + (tileZoomAny(v) ? ' · imagery enlarged beyond its detail' : ''));
    else if (vt && vt.missing) quality('busy', 'Sharpening the drawing… ' + (vt.total - vt.missing) + ' of ' + vt.total + ' tiles');
    else quality(tileZoomAny(v) ? 'over' : 'sharp', 'Drawing sharp at this zoom' + (tileZoomAny(v) ? ' · photograph enlarged beyond its detail' : '')); }
  const atRest = !interacting && !zAnim && !flingRAF; pruneTiles(atRest); pruneVT(atRest);
  const F = probeF; probeF = null; F.ms = Math.round((performance.now() - t0) * 10) / 10; F.t = Math.round(F.t); F.ready = ready; F.inter = !atRest; F.mode = mode; F.z = +camera.z.toFixed(3);
  const sharp = ready && !F.vtMiss && !F.satMiss && !F.underMiss;
  /* the loader goes as soon as the drawing is whole (the photograph fills in under it), or the photograph in Satellite only, or after 2.5 s whatever */
  if (ready && !loaderAt && (sharp || (mode !== 'satellite' ? F.vtTot && !F.vtMiss : !F.satBlank && satCanFetch()) || performance.now() - bootT0 > 2500)) hideLoader();
  F.loader = !!loaderAt; window.__frames.push(F); if (window.__frames.length > 30000) window.__frames.splice(0, 10000);
  if (sharp && atRest && loaderAt && !firstSharp) { firstSharp = true; perf.firstSharpMs = Math.round(performance.now()); afterFirstSharp(); }
  perf.frames++; perf.frameMs += performance.now() - t0; if (perf.frames % 30 === 0) perfText();
}
function hideLoader() { loaderAt = performance.now(); const l = $('loader'); l.classList.add('fade'); setTimeout(() => l.classList.add('done'), 180); maybeReady(); }
/* the plan on the ground: the main plan inside its frame less the inset's box; then the inset, through its own
   registration, where the main plan stops */
function drawPlanOnGround(v, S2D) {
  /* the frame lines and the corner ticks sit on the regions' edges; the clips stay a few points inside them */
  const E = 7, m0 = GEO.main.sheet_region_pts, m = [m0[0] + E, m0[1] + E, m0[2] - E, m0[3] - E], h = (GEO.main.exclude_pts || []).map(e => [e[0] - E, e[1] - E, e[2] + E, e[3] + E]), a = mode === 'hybrid' ? opacity : 1;
  let rects = [m]; if (insetOn) for (const e of h) rects = subtractRects(rects, e);
  ctx.save(); ctx.globalAlpha = a; const r1 = drawVectorTiles(v, rects); ctx.restore();
  if (!insetOn || !TIN) return r1;
  const ir = GEO.inset.sheet_region_pts, c = [[ir[0] + E, ir[1] + E], [ir[2] - E, ir[1] + E], [ir[0] + E, ir[3] - E], [ir[2] - E, ir[3] - E]].map(([x, y]) => ap(TIN, x, y)), vc = v.corners.map(p => ap(TIN_INV, p.x, p.y));
  const k = Math.sqrt(Math.abs(TIN[0][0] * TIN[1][1] - TIN[0][1] * TIN[1][0])), r = GEO.inset.sheet_region_pts;
  const vx0 = Math.max(r[0], Math.min(...vc.map(p => p[0]))), vy0 = Math.max(r[1], Math.min(...vc.map(p => p[1]))), vx1 = Math.min(r[2], Math.max(...vc.map(p => p[0]))), vy1 = Math.min(r[3], Math.max(...vc.map(p => p[1])));
  if (vx1 <= vx0 || vy1 <= vy0) return r1;
  ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); ctx.lineTo(c[1][0], c[1][1]); ctx.lineTo(c[3][0], c[3][1]); ctx.lineTo(c[2][0], c[2][1]); ctx.closePath(); ctx.clip();
  ctx.beginPath(); ctx.rect(GB.x0 - 1e4, GB.y0 - 1e4, GB.x1 - GB.x0 + 2e4, GB.y1 - GB.y0 + 2e4); ctx.rect(m[0], m[1], m[2] - m[0], m[3] - m[1]); ctx.clip('evenodd');
  ctx.transform(TIN[0][0], TIN[1][0], TIN[0][1], TIN[1][1], TIN[0][2], TIN[1][2]);
  const r2 = drawVectorTiles({x: vx0, y: vy0, w: vx1 - vx0, h: vy1 - vy0, scale: v.scale * k, corners: []}, SHEET_RECTS, 'inset'); ctx.restore();
  return {missing: (r1.missing || 0) + (r2.missing || 0), total: (r1.total || 0) + (r2.total || 0)};
}
/* Original plan: the sheet's own aerial patches, decoded off the thread; the big ones also at half and a quarter size, so
   an overview never scales a 4,760 px picture down on every frame. A patch not here yet shows the overview picture. */
function underPatch(u) { let im = underImgs.get(u.file); if (im) return im; im = {bm: {}}; underImgs.set(u.file, im);
  const w = (u.px && u.px[0]) || 0, h = (u.px && u.px[1]) || 0;
  im.p = fetch('assets/' + u.file).then(r => r.ok ? r.blob() : Promise.reject(new Error('underlay ' + r.status))).then(b => Promise.all([
      w > 1600 ? createImageBitmap(b, {resizeWidth: Math.round(w / 4), resizeHeight: Math.round(h / 4), resizeQuality: 'high'}).then(x => { im.bm[4] = x; requestPaint(); }) : null,
      w > 1600 ? createImageBitmap(b, {resizeWidth: Math.round(w / 2), resizeHeight: Math.round(h / 2), resizeQuality: 'high'}).then(x => { im.bm[2] = x; requestPaint(); }) : null,
      createImageBitmap(b).then(x => { im.bm[1] = x; requestPaint(); })]))
    .catch(e => { im.failed = true; console.warn('underlay', u.file, e); });
  return im; }
/* v6.97 - the patches inside the big aerial (all 64 of them) are drawn as ONE picture, made once in record order at full,
   half and a quarter of the big aerial's own size: one draw a frame instead of 64. The big aerial's own bitmaps are let
   go once it is made (the full-size picture holds the same pixels). Until then each patch is drawn on its own. */
let underComp = null, underCompAt = 0, underJob = null;
/* the worker way (any browser with OffscreenCanvas): one job fetches, decodes and composites the lot off this thread */
const OFFSCREEN_OK = typeof OffscreenCanvas === 'function' && typeof Worker === 'function' && (() => { try { return !!new OffscreenCanvas(1, 1).getContext('2d'); } catch (e) { return false; } })();
function underlayJob() {
  if (underJob || underComp || !UNDER.length) return underJob; const area = u => (u.bbox[2] - u.bbox[0]) * (u.bbox[3] - u.bbox[1]);
  let base = 0; UNDER.forEach((u, i) => { if (area(u) > area(UNDER[base])) base = i; });
  underJob = new Promise((res, rej) => { const w = new Worker('scene-worker.js'), timer = setTimeout(() => rej(new Error('underlay timed out')), 60000);
    w.onmessage = e => { const m = e.data; if (m.t !== 'underlay') { if (m.t === 'error') rej(new Error(m.message)); return; } clearTimeout(timer); w.terminate();
      underComp = {bbox: m.bbox, w: m.w, files: new Set(m.members), 1: m.comp[1], 2: m.comp[2], 4: m.comp[4], tiles1: m.tiles1 || null}; perf.underlay = m.ms;
      for (const [f, bm] of Object.entries(m.loose)) underImgs.set(f, {bm: {1: bm}, p: Promise.resolve()}); for (const f of m.failed) underImgs.set(f, {bm: {}, failed: true, p: Promise.resolve()});
      requestPaint(); res(true); };
    w.onerror = e => { e.preventDefault(); clearTimeout(timer); rej(new Error('underlay helper did not start')); };
    w.postMessage({t: 'underlay', id: 1, prefix: 'assets/', items: UNDER.map(u => ({file: u.file, bbox: u.bbox, px: u.px})), base, sizes: [1, 2, 4]}); })
    .catch(e => { console.warn('underlay in the worker failed; decoding on the page', e); underJob = null; underWorkerFailed = true; requestPaint(); });
  return underJob;
}
let underWorkerFailed = false;
function buildUnderComp() {
  if (underComp || !UNDER.length || performance.now() < underCompAt) return; const area = u => (u.bbox[2] - u.bbox[0]) * (u.bbox[3] - u.bbox[1]);
  const base = UNDER.reduce((a, b) => area(b) > area(a) ? b : a), bb = base.bbox, inside = u => u.bbox[0] >= bb[0] - .5 && u.bbox[1] >= bb[1] - .5 && u.bbox[2] <= bb[2] + .5 && u.bbox[3] <= bb[3] + .5;
  const members = UNDER.filter(inside); if (!members.every(u => { const im = underImgs.get(u.file); return im && (im.failed || im.bm[1]); })) return;
  underCompAt = performance.now() + 1e9; const idle = f => window.requestIdleCallback ? requestIdleCallback(f, {timeout: 1500}) : setTimeout(f, 50);
  idle(() => { const comp = {bbox: bb, w: base.px[0], files: new Set(members.map(u => u.file))};
    for (const f of [1, 2, 4]) { const c = document.createElement('canvas'); c.width = Math.round(base.px[0] / f); c.height = Math.round(base.px[1] / f); const g = c.getContext('2d'), sx = c.width / (bb[2] - bb[0]), sy = c.height / (bb[3] - bb[1]);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      for (const u of members) { const im = underImgs.get(u.file), b = im && (im.bm[f] || im.bm[1]); if (b) g.drawImage(b, (u.bbox[0] - bb[0]) * sx, (u.bbox[1] - bb[1]) * sy, (u.bbox[2] - u.bbox[0]) * sx, (u.bbox[3] - u.bbox[1]) * sy); }
      comp[f] = c; }
    const bi = underImgs.get(base.file); if (bi) { for (const k of Object.keys(bi.bm)) bi.bm[k].close && bi.bm[k].close(); bi.bm = {}; bi.inComp = true; }
    underComp = comp; requestPaint(); });
}
function drawUnderlay(v) {
  const k = v.scale * dpr;
  let skip = null; if (underComp) { const b = underComp.bbox, shown = (b[2] - b[0]) * k, c = shown <= underComp.w / 3.2 ? underComp[4] : shown <= underComp.w / 1.6 ? underComp[2] : underComp[1], vr = [[v.x, v.y, v.x + v.w, v.y + v.h]];
    if (c) drawCropped({canvas: c, x: b[0], y: b[1], w: b[2] - b[0], h: b[3] - b[1]}, vr);
    else { const T = underComp.tiles1, sx = (b[2] - b[0]) / T.pw, sy = (b[3] - b[1]) / T.ph; for (const q of T.tiles) drawCropped({canvas: q.bm, x: b[0] + q.x * sx, y: b[1] + q.y * sy, w: q.w * sx, h: q.h * sy}, vr); }
    skip = underComp.files; }
  else if (OFFSCREEN_OK && !underWorkerFailed) {   /* on its way from the worker: the overview picture stands in meanwhile */
    underlayJob(); if (probeF) probeF.underMiss++; if (overview) { ctx.save(); ctx.beginPath(); for (const u of UNDER) ctx.rect(u.bbox[0], u.bbox[1], u.bbox[2] - u.bbox[0], u.bbox[3] - u.bbox[1]); ctx.clip(); ctx.drawImage(overview, 0, 0, SHEET_W, SHEET_H); ctx.restore(); } return; }
  else buildUnderComp();
  for (const u of UNDER) { if (skip && skip.has(u.file)) continue; const [x0, y0, x1, y1] = u.bbox; if (x1 < v.x || x0 > v.x + v.w || y1 < v.y || y0 > v.y + v.h) continue;
    const im = underPatch(u), w = (u.px && u.px[0]) || 1, shown = (x1 - x0) * k, bm = (shown <= w / 3.2 && im.bm[4]) || (shown <= w / 1.6 && im.bm[2]) || im.bm[1] || im.bm[2] || im.bm[4];
    if (bm) ctx.drawImage(bm, x0, y0, x1 - x0, y1 - y0);
    else { if (!im.failed && probeF) probeF.underMiss++; if (overview) { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); ctx.drawImage(overview, 0, 0, SHEET_W, SHEET_H); ctx.restore(); } } }
}
/* the backing store follows the gesture: one device pixel per CSS pixel while the wheel turns or a finger moves,
   the full ratio 160 ms after the last input. Coarser tiles and a quarter of the pixel work while moving; the crisp
   frame lands when the hand stops. */
/* v6.90 - the canvas keeps its full sharpness while the hand moves (it used to drop to one pixel per point, which is
   the blur people saw while panning); the moving frames stay light by drawing the photograph with fast smoothing */
/* stage5 - on a phone over DPR 2 (2.6 to 3 on most Android phones), the frames drawn while a finger or a glide is moving
   use DPR 2, as the live page always did there: about half the pixels of the full ratio, so a mid-range phone's graphics
   chip keeps up with the finger. The moment the hand stops (160 ms) the full ratio comes back and the resting view is drawn
   at every one of the screen's pixels. Desktops and phones at DPR 2 or under are always at the full ratio. */
function applyDpr() { const mv = interacting && movW && (movW !== devW), W = mv ? movW : devW, H = mv ? movH : devH, want = W / sw;
  if (want === dpr && canvas.width === W && canvas.height === H) return; dpr = want; canvas.width = W; canvas.height = H; mcanvas.width = W; mcanvas.height = H; }
let lastInput = 0;
/* background work (the Original plan aerial, the scene) waits until the hand has been still for two seconds */
function whenQuiet(f, quiet = 2000) { const go = () => { const idle = performance.now() - lastInput; if (interacting || zAnim || flingRAF || idle < quiet || under3d()) return setTimeout(go, Math.max(250, quiet - idle)); (window.requestIdleCallback ? requestIdleCallback(f, {timeout: 2000}) : f()); }; setTimeout(go, 0); }
function touchInteraction() { lastInput = performance.now(); clearTimeout(restTimer); if (!interacting) { interacting = true; applyDpr(); } restTimer = setTimeout(() => { interacting = false; applyDpr(); if (!zAnim) { vtGoal.clear(); goalWanted.clear(); } dropVTQueue(); requestPaint(); }, 160); }
/* hosted under /w/<token>/explorer/ the page passes the link's own token to the service; anywhere else the stand-in answers */
function hostedToken() { const m = /^\/w\/([A-Za-z0-9_-]{16,128})\//.exec(location.pathname); return m ? '?t=' + encodeURIComponent(m[1]) : ''; }
function requestPaint() { if (!paintID && !document.hidden && !under3d()) paintID = requestAnimationFrame(draw); }
/* v6.99 - while the Map explorer's 3D mode (explorer-merge.js: body.in3d, the model over #stage) covers this map, the map
   underneath neither draws nor fetches nor starts background work: every frame and byte goes to the 3D model. The first
   view is still drawn (GC500Explorer.ready waits for it); leaving 3D repaints at once, at wherever a pick has moved to. */
function under3d() { return !!loaderAt && document.body.classList.contains('in3d'); }
new MutationObserver(() => { if (under3d()) { cancelTiles(); vtQueue.clear(); vtGoal.clear(); goalWanted.clear(); } else requestPaint(); }).observe(document.body, {attributes: true, attributeFilter: ['class']});
/* the overview map is kept north-up like every other map here; the sheet is turned inside its box once */
function miniNorthUp() { const rot = 0, box = $('mini'), inner = $('miniInner'); const r = rot * Math.PI / 180, c = Math.abs(Math.cos(r)), si = Math.abs(Math.sin(r)); const W = 200, H = W * SHEET_H / SHEET_W, bw = Math.ceil(W * c + H * si), bh = Math.ceil(W * si + H * c); box.style.width = bw + 'px'; box.style.height = bh + 'px'; inner.style.width = W + 'px'; inner.style.height = H + 'px'; inner.style.left = ((bw - W) / 2) + 'px'; inner.style.top = ((bh - H) / 2) + 'px'; inner.style.transform = 'rotate(' + rot + 'deg)'; }
let lastMini = ''; function updateMini(v) { const c = v.corners, pts = [c[0], c[1], c[3], c[2]].map(p => clamp(p.x, 0, SHEET_W).toFixed(1) + ',' + clamp(p.y, 0, SHEET_H).toFixed(1)).join(' '); if (pts !== lastMini) { lastMini = pts; $('miniRect').setAttribute('points', pts); } updateCompass(); }
/* the compass: north on the sheet comes from the registration (tile 'up' pulled back through the affine) */
function northOnSheet() { if (!GEO) return null; const M = GEO.main.sheet_to_z18px, a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1], det = a * d - b * c; const nx = (-b * -1) / det, ny = (a * -1) / det; const l = Math.hypot(nx, ny); return {x: nx / l, y: ny / l}; }
const FACE_WORDS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
let lastCompass = null;
function updateCompass() { const n = northOnSheet(), el = $('dial'); if (!n || !el) return; const ang = Math.atan2(n.y, n.x) * 180 / Math.PI + camera.rot + 90;
  if (lastCompass !== null && Math.abs(lastCompass - ang) < 0.05) return; lastCompass = ang;
  el.style.transform = 'rotate(' + ang + 'deg)'; document.querySelectorAll('#dial [data-face] b').forEach(b => { b.style.transform = 'rotate(' + (-(ang + +b.parentElement.dataset.face)) + 'deg)'; });
  const top = ((-ang) % 360 + 360) % 360, w = FACE_WORDS[Math.round(top / 45) % 8]; $('rotOut').textContent = 'Facing ' + w;
  $('rose').setAttribute('aria-label', 'Compass: the top of the view faces ' + w + ' (' + Math.round(top) + '°). Press N, E, S or W to face that way; drag the ring to turn.'); }
function face(b) { rotateTo(northRot() - b); }
function northRot() { const n = northOnSheet(); return n ? -90 - Math.atan2(n.y, n.x) * 180 / Math.PI : 0; }
function northUp(animate = true) { if (!GEO) return; rotateTo(northRot(), animate); }
function asDrawn(animate = true) { rotateTo(0, animate); }
/* the zoom that fits a sheet-space rectangle at a rotation: the rotated extents, not the sheet's own */
function fitZoomFor(w, h, rot, margin) { const r = rot * Math.PI / 180, c = Math.abs(Math.cos(r)), si = Math.abs(Math.sin(r)), ew = w * c + h * si, eh = w * si + h * c; return Math.min((sw - margin) / Math.max(1, ew), (sh - margin) / Math.max(1, eh)) / fitScale; }
let rotAnim = 0;
function rotateTo(deg, animate = true) { stopCameraMotion813(); const from = camera.rot, d = ((deg - from + 540) % 360) - 180; if (!animate || matchMedia('(prefers-reduced-motion:reduce)').matches) { camera.rot = from + d; changeView(false); return; }
  const t0 = performance.now(); (function step() { const k = Math.min(1, (performance.now() - t0) / 420), e = 1 - Math.pow(1 - k, 3); camera.rot = from + d * e; touchInteraction(); changeView(false); if (k < 1) rotAnim = requestAnimationFrame(step); })(); }
function clampCamera() { camera.z = clamp(camera.z, MIN_Z, MAX_Z);
  if (geoOn() && GB) { camera.cx = clamp(camera.cx, GB.x0 - 150, GB.x1 + 150); camera.cy = clamp(camera.cy, GB.y0 - 150, GB.y1 + 150); } else { camera.cx = clamp(camera.cx, 0, SHEET_W); camera.cy = clamp(camera.cy, 0, SHEET_H); } }
let lastZoomText = '';
function changeView(resetLabel = true) {
  revision++; clampCamera();
  const zt = Math.round(camera.z * 100).toLocaleString('en-AU') + '%'; if (zt !== lastZoomText && document.activeElement !== $('zoomInput')) { lastZoomText = zt; $('zoomInput').value = zt; }
  if (resetLabel) { setLabel('Custom close-up'); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); }
  dropVTQueue(); requestPaint();
}
/* v6.90 - THE GOOGLE MAPS FEEL. A wheel notch, a button, a double-click or a double tap sets where the zoom is going and
   the view glides there about the point under the cursor or finger (a quarter of a second, eased); a drag let go with
   speed coasts on and slows to a stop. Reduced motion gets the old instant steps. */
let zAnim = 0, zGoal = null, zAnchor = null, zLast = 0, flingRAF = 0;
const calm = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
function zoomBy(factor, x = sw / 2, y = sh / 2) {
  stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;
  if (calm()) { touchInteraction(); const a = screenToSource(x, y); camera.z = clamp(camera.z * factor, MIN_Z, MAX_Z); keepUnder(a, x, y); changeView(); return; }
  zGoal = clamp((zGoal || camera.z) * factor, MIN_Z, MAX_Z); zAnchor = {a: screenToSource(x, y), x, y};
  if (!zAnim) { zLast = 0; zAnim = requestAnimationFrame(zoomStep); }
  prefetchGoal();
}
/* the view the glide will land on (the same arithmetic as the glide's last step), asked for now */
function prefetchGoal() { if (!ready || zGoal == null) return; const save = {cx: camera.cx, cy: camera.cy, z: camera.z};
  camera.z = zGoal; keepUnder(zAnchor.a, zAnchor.x, zAnchor.y); clampCamera(); const v = currentView(); camera.cx = save.cx; camera.cy = save.cy; camera.z = save.z;
  for (const q of vtQueue.values()) q.goal = false; prefetchView(v); }
function zoomStep(t) {
  const dt = zLast ? Math.min(.2, (t - zLast) / 1000) : 1 / 60; zLast = t;   /* v6.97: wall time (was capped at 50 ms a frame, so a slow device glided in slow motion) */
  let z = Math.exp(Math.log(camera.z) + (Math.log(zGoal) - Math.log(camera.z)) * (1 - Math.exp(-dt * 20)));   /* v7.58: quicker close (was 13) */
  if (Math.abs(Math.log(zGoal / z)) < .003) z = zGoal;
  camera.z = z; keepUnder(zAnchor.a, zAnchor.x, zAnchor.y); touchInteraction(); changeView();
  if (z !== zGoal) zAnim = requestAnimationFrame(zoomStep); else { zAnim = 0; zGoal = null; }
}
function stopZoomAnim() { cancelAnimationFrame(zAnim); zAnim = 0; zGoal = null; }
function stopFling() { cancelAnimationFrame(flingRAF); flingRAF = 0; }
function fling(vx, vy) {
  stopFling(); if (calm()) return; let last = performance.now();
  const step = t => { const dt = Math.min(40, t - last); last = t; const k = Math.pow(.9955, dt); vx *= k; vy *= k;
    if (Math.hypot(vx, vy) < .03) { flingRAF = 0; changeView(false); return; }
    const s = fitScale * camera.z, r = camera.rot * Math.PI / 180, dx = vx * dt, dy = vy * dt;
    camera.cx -= (dx * Math.cos(r) + dy * Math.sin(r)) / s; camera.cy -= (-dx * Math.sin(r) + dy * Math.cos(r)) / s; touchInteraction(); changeView(); flingRAF = requestAnimationFrame(step); };
  flingRAF = requestAnimationFrame(step);
}
function stopCameraMotion813() {
  stopZoomAnim(); stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;
  goalWanted.clear(); vtGoal.clear(); for (const q of vtQueue.values()) q.goal = false;
}
let panTrail = [];
/* every map here starts the way D001 is drawn (beach along the top), the way the crew reads the printed plan and, from
   v5.90, the way the dashboard's satellite and 3D views open; the rose says where north is and N turns north-up */
function fit(asSheet = false) { stopCameraMotion813();clearSelection813(); highlight = null; const rot = 0;
  if (geoOn() && GB && !asSheet) camera = {cx: (GB.x0 + GB.x1) / 2, cy: (GB.y0 + GB.y1) / 2, z: clamp(fitZoomFor(GB.x1 - GB.x0, GB.y1 - GB.y0, rot, 30), MIN_Z, MAX_Z), rot};
  else camera = {cx: 1192, cy: 842, z: clamp(fitZoomFor(SHEET_W, SHEET_H, rot, 30), MIN_Z, MAX_Z), rot}; setLabel('Full master plan · as drawn'); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); changeView(false); }
function gotoRect(rect, label) { stopCameraMotion813(); document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active')); const [x0, y0, x1, y1] = geoRect(rect), rot = camera.rot || 0; camera = {cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z: clamp(fitZoomFor(x1 - x0, y1 - y0, rot, 65), MIN_Z, MAX_Z), rot}; setLabel(label); changeView(false); }
/* the drawing's geometry lives in a worker (scene-worker.js); the page asks it for the SVG of a view and never builds
   250,000 path strings on the thread that is answering the pointer */
let worker = null, svgSeq = 0; const svgWaiting = new Map();
function svgFromWorker(v, width, height, all = false, m = mode) {
  return new Promise((resolve, reject) => { const id = ++svgSeq; svgWaiting.set(id, {resolve, reject}); worker.postMessage({t: 'svg', id, view: {x: v.x, y: v.y, w: v.w, h: v.h, scale: v.scale}, width, height, mode: m, all}); });
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
  if (m === mode) return; const wasGeo790 = geoOn(); mode = m; /* v7.90 - see below */ document.querySelectorAll('.modes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  dropVTQueue(); setSatState('');
  if (m !== 'original') { ensureKey().then(() => requestPaint()); } else cancelTiles();
  setAttrib();
  /* v7.90 - the plan and the satellite views measure in different coordinates (sheet units against metres on the ground), so
     a camera carried from one into the other lands off the drawing - the project manager, 2 Oct 2026, saw the plan pushed into
     the bottom-right on black. Changing between the two now fits the whole view; within one family the view is kept. */
  if (geoOn() !== wasGeo790) {
    /* The old coordinate-space anchor must not move the newly fitted view on a later animation frame. */
    stopZoomAnim(); stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;
    fit();
  } else changeView(false);
}
/* v6.97 - one request for the key however many callers ask (the <head> may already have sent it) */
let keyPromise = null;
function ensureKey() { if (mapKey || gSession) return Promise.resolve(mapKey || 'google'); if (!keyPromise) keyPromise = keyOnce().finally(() => { keyPromise = null; }); return keyPromise; }
async function keyOnce() {
  try { const j = await once('key', () => fetch('/api/map-key' + hostedToken(), {cache: 'no-store'}).then(r => r.json())); PRE.key = null;
    if (j && j.google && /^AIza/.test(String(j.google.key || ''))) gKey = j.google.key;
    if (gKey) await ensureGoogle();                  /* Google first: Mapbox only if Google can't be had */
    if (j && /^pk\./.test(String(j.token || ''))) { mapKey = j.token; keyState = 'ok'; }
    if (ready && !zAnim && !interacting && (mapKey || gSession)) prefetchView(currentView());   /* the photograph's tiles go out as soon as the key is known */
    if (mapKey) return mapKey; if (gSession) { keyState = 'ok'; return 'google'; } }
  catch (e) { PRE.key = null; }
  keyState = 'none'; toast('No Mapbox token from the service: the satellite modes need the dashboard\'s key. The original plan is unaffected.', 9000); requestPaint(); return null;
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
/* Author: Andrew Fisher. Map selections stay on the map; opening a record is explicit. */
function clearSelection813() {
  selected = null; stopPulse(); highlight = null;
  document.querySelectorAll('.findlist button.sel').forEach(b => b.classList.remove('sel'));
  if (window.GC500Explorer && window.GC500Explorer.clearPick813) window.GC500Explorer.clearPick813();
}
function panel813(on, returnFocus = false) {
  document.body.classList.toggle('nav', !!on);
  $('navBtn').setAttribute('aria-expanded', String(!!on));
  if (!on && returnFocus && matchMedia('(max-width:900px)').matches) $('navBtn').focus({preventScroll: true});
}
function pickedLocation813() {
  panel813(false);
  if (matchMedia('(max-width:900px)').matches) stage.focus({preventScroll: true});
}
function closeLegend813(returnFocus = true) {
  $('legend').classList.remove('show');
  $('legendBtn').setAttribute('aria-expanded', 'false');
  if (returnFocus) (matchMedia('(max-width:900px)').matches && !document.body.classList.contains('nav') ? $('navBtn') : $('legendBtn')).focus({preventScroll: true});
}
function sourceProvider813() {
  const label = $('sourceProvider813');
  if (label) label.textContent = SOURCE === 'google' ? 'Google Satellite' : 'Mapbox Satellite';
}
if ($('about813')) $('about813').addEventListener('toggle', sourceProvider813);
$('navBtn').onclick = () => panel813(!document.body.classList.contains('nav'));
$('legendBtn').setAttribute('aria-controls', 'legend');
$('legendBtn').setAttribute('aria-expanded', 'false');
$('legendBtn').onclick = () => {
  const L = $('legend');
  if (L.classList.contains('show')) { closeLegend813(); return; }
  sourceProvider813(); L.innerHTML = legendHtml(); L.classList.add('show');
  L.setAttribute('role', 'dialog'); L.setAttribute('aria-label', 'Drawing legend and sources'); L.setAttribute('tabindex', '-1');
  $('legendBtn').setAttribute('aria-expanded', 'true');
  if (matchMedia('(max-width:900px)').matches) panel813(false);
  L.scrollTop = 0; L.querySelector('[data-closelegend813]').focus({preventScroll: true});
};
$('legend').addEventListener('click', e => { if (e.target.closest('[data-closelegend813]')) closeLegend813(); });
/* Escape dismisses the visible overlay even when its input has focus. A second Escape retains the map's own reset. */
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('legend').classList.contains('show')) { e.preventDefault(); e.stopImmediatePropagation(); closeLegend813(); }
  else if (matchMedia('(max-width:900px)').matches && document.body.classList.contains('nav')) { e.preventDefault(); e.stopImmediatePropagation(); panel813(false, true); }
}, true);
function legendHtml() {
  const close = '<button type="button" class="jump" data-closelegend813>Close sources</button>';
  if (!P) return close + '<h4>Drawing legend and sources</h4><p>The drawing information is loading. Close this panel and try again when the plan is ready.</p>';
  const cls = window.__cls || {}; const n = BOOT ? BOOT.images : cls.image_records ? cls.image_records.length : 0, u = BOOT ? BOOT.underlay.length : cls.image_records ? cls.image_records.filter(m => m.category === 'aerial_underlay').length : 0;
return close + `<h4>What the satellite modes keep and lift</h4><table><tr><td>Vector records (paths)</td><td>${(P.count - n).toLocaleString('en-AU')} kept, all modes</td></tr><tr><td>Raster symbols and lettering</td><td>${(n - u)} kept, all modes</td></tr><tr><td>Sheet's own aerial patches</td><td>${u} lifted in satellite modes (they are the old photograph)</td></tr><tr><td>Sheet-white backdrop</td><td>Original plan only</td></tr><tr><td>Legend, key plan, title block</td><td>Kept as document content (toggle)</td></tr><tr><td>Large white fills</td><td>none found; nothing removed by colour</td></tr></table>
  <h4>Source</h4><p>${esc(P.meta.title)} · ${esc(P.meta.drawing)} · project ${esc(P.meta.project)} · revision ${esc(P.meta.revision)}<br>PDF SHA-256 ${esc(P.meta.sha256)}</p><h4>Imagery</h4><p>${SOURCE === 'google' ? 'Google Satellite' : 'Mapbox Satellite'} tiles, fetched for the visible view only. Capture date and native resolution are not stated by the provider; the status line says when the photograph is enlarged beyond what it holds.</p><p><button type="button" class="jump" data-closelegend813>Close</button></p>`;
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
  {id: 'stands', name: 'Stands', c: '#f72585', pre: /^S\d{2}[A-Z]?$/}, {id: 'gates', name: 'Gates', c: '#b5e48c', pre: /^G\d{1,2}[A-Z]?$/},
  {id: 'screens', name: 'Big screens', c: '#c77dff', pre: /^BS\d{2}$/}, {id: 'bars', name: 'Bars', c: '#f4a261', pre: /^BAR ?\d{1,2}$/},
  {id: 'armco', name: 'Armco access', c: '#8ecae6', pre: /^A\d{1,2}$/}, {id: 'egress', name: 'Emergency egress', c: '#e63946', pre: /^EEP ?\d$/},
  {id: 'overtrack', name: 'Over-track signage', c: '#ffb703', pre: /^OT\d$/}, {id: 'bridges', name: 'Pedestrian bridges', c: '#adb5bd', pre: /^PB\d{1,2}$/}];
/* v6.96 - the master plan's own trades and layers, when the dashboard opened this page (see the header of patch_explorer696) */
const TRADE_C = {'Portable buildings': '#ff9a4d', 'Toilets & amenities': '#39e07a', 'Generators': '#ffd166', 'Lighting towers': '#ffffff', 'Water-filled barriers': '#4cc9f0', 'Access & plant': '#e27bd9', 'Furniture': '#d6b58c', 'Ground protection': '#9fb3c8'};
const LAYER_C = {vms: '#b98cf5', wb: '#ff8a3d', gate: '#6fdc8c', ep: '#3cc7e6', screen: '#7d9bff', gens: '#e27bd9', iface: '#ff6b5e', wcx: '#d9a05b'};
const LANDMARKS = new Set(['stands', 'bars', 'armco', 'egress', 'overtrack', 'bridges']);
let CATS_NOW = CATS, HOST = null, PLAN_SNAP = null;
/* live from the page that opened this one; in its own window, the snapshot taken from that same function when the set was built */
function hostPlan() { try { const w = window.parent; if (w && w !== window && typeof w.gc500PlanItems === 'function') { const h = w.gc500PlanItems(); if (h) return h; } } catch (e) {} return PLAN_SNAP && PLAN_SNAP.v === 1 ? PLAN_SNAP : null; }
const ptBox = pt => { const x = pt[0] * SHEET_W, y = pt[1] * SHEET_H; return [x - 1.2, y - .8, x + 1.2, y + .8]; };
function placeWord(it) { if (it.cat && it.cat.host) return it.places.length ? 'on the master plan' + (it.reg && it.reg.sec ? ' · ' + it.reg.sec : '') : 'no place on the master plan yet'; return it.places.length ? it.places.length + ' place' + (it.places.length === 1 ? '' : 's') + ' on D001' : 'not labelled on D001'; }
function catOf(code, product) { for (const c of CATS) { if (product && c.prod && c.prod.includes(product)) return c; if (c.pre.test(code)) return c; } return null; }
function buildItems() {
  const byCode = new Map(); const add = (code, o) => { const k = norm(code); if (!byCode.has(k)) byCode.set(k, {code: k, places: [], reg: null, cat: null, names: []}); return byCode.get(k); };
  if (P && P.labels) for (const l of P.labels) { const t = l[0].trim(); if (!/^[A-Z]{1,4} ?-?\d{1,3}[A-Z]?$/.test(t)) continue; const it = add(t); it.places.push([l[1], l[2], l[3], l[4]]); }
  HOST = hostPlan();
  if (REG && !HOST) for (const a of REG.assets) { const it = add(a.key); it.reg = a; }
  for (const it of byCode.values()) { it.cat = catOf(it.code.replace(' ', ''), it.reg && it.reg.product) || catOf(it.code, null); }
  let list = [...byCode.values()].filter(it => it.cat); CATS_NOW = CATS;
  if (HOST) {   /* the Map's numbers: the master plan's trades, then its layers, then the drawing's own landmarks */
    list = list.filter(it => LANDMARKS.has(it.cat.id)); const cats = [];
    HOST.trades.forEach(tr => { const c = {id: 't' + cats.length, name: tr.name, c: TRADE_C[tr.name] || '#ff6a13', count: tr.count, host: 'trade'}; cats.push(c);
      HOST.items.filter(i => i.trade === tr.name).forEach(i => list.push({code: norm(i.key), places: [ptBox(i.pt)], reg: {name: i.name, asset_numbers: i.assets, sec: i.sec}, cat: c, names: []}));
      HOST.unplaced.filter(i => i.trade === tr.name).forEach(i => list.push({code: norm(i.key), places: [], reg: {name: i.name, drawing: i.drawing}, cat: c, names: []})); });
    HOST.layers.forEach(l => {
      /* v6.96 - Andrew, 27 Sep 2026: "Merge barriers". The barrier runs drawn on the K-sheets join the water-filled barriers
         on our schedule under one chip, so barriers are found in one place: 12 locations and the 20 runs they make up. */
      const wfb = l.id === 'wb' ? cats.find(x => x.host === 'trade' && /water.filled barrier/i.test(x.name)) : null;
      const c = wfb || {id: 'l' + cats.length, name: l.name, c: LAYER_C[l.id] || '#ff6a13', count: String(l.n), host: 'layer', why: l.why};
      if (wfb) { wfb.count = wfb.count + ' · ' + l.n + ' runs'; wfb.merged = l.why; } else cats.push(c);
      const seen = {}; l.marks.forEach(m => { const f = norm(m.face || l.name), k = seen[f] = (seen[f] || 0) + 1, dup = l.marks.filter(x => norm(x.face || l.name) === f).length > 1;
        list.push({code: dup ? f + ' ' + k : f, places: [ptBox(m.pt)], reg: {name: m.name && norm(m.name) !== f ? m.name : '', note: m.note}, cat: c, names: []}); }); });
    CATS_NOW = cats.concat(CATS.filter(c => LANDMARKS.has(c.id)));
  }
  ITEMS = list.sort((x, y) => x.code.localeCompare(y.code, 'en', {numeric: true}));
  const counts = {}; for (const it of ITEMS) { const c = counts[it.cat.id] = counts[it.cat.id] || {n: 0, on: 0}; c.n++; if (it.places.length) c.on++; }
  $('chips').innerHTML = CATS_NOW.filter(c => counts[c.id]).map(c => `<button class="chip" data-cat="${c.id}" aria-pressed="false" style="--c:${c.c}"><i></i>${esc(c.name)} <small>${c.host ? esc(c.count) : counts[c.id].on + (counts[c.id].on !== counts[c.id].n ? ' of ' + counts[c.id].n : '')}</small></button>`).join('');
  done782Chip(); /* v7.82 */
  const fh =document.querySelector('#findCard h3, #findCard > summary'); if (fh) fh.textContent = HOST ? 'Find on the master plan' : 'Find on the drawing';
  const sh3 = $('q') && $('q').closest('div') && $('q').closest('div').parentElement.querySelector('h3'); if (sh3 && HOST) sh3.textContent = 'Search the master plan and the drawing';
  $('chips').onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; const on = b.getAttribute('aria-pressed') !== 'true'; document.querySelectorAll('#chips .chip').forEach(x => x.setAttribute('aria-pressed', 'false')); /* v7.82 - not the Done chip */ b.setAttribute('aria-pressed', String(on)); showCategory(on ? b.dataset.cat : null); };
}
function showCategory(id) {
if (!id || (selected && selected.cat.id !== id)) clearSelection813(); const L = $('findList');
  if (!id) { marks = []; L.classList.remove('show'); L.innerHTML = ''; requestPaint(); return; }
  const cat = CATS_NOW.find(c => c.id === id), items = ITEMS.filter(it => it.cat.id === id); marks = items.filter(it => it.places.length).map(it => ({it, c: cat.c}));
  const placed = items.filter(it => it.places.length), unplaced = items.filter(it => !it.places.length);
  const head = cat.host === 'trade' ? `${esc(cat.name)}: ${esc(cat.count)} on the master plan, the same count as the Map${cat.merged ? ' — the barrier locations on our schedule and the runs drawn on the barrier sheets (' + esc(cat.merged) + '), in one list' : ''}${unplaced.length ? ' · ' + unplaced.length + ' more in the register with no place on it yet' : ''}. A ring is where the master plan puts it, not a surveyed position.`
    : cat.host === 'layer' ? `${esc(cat.name)}: ${esc(cat.count)} on the master plan, the same count as the Map — ${esc(cat.why || '')}.`
    : `${cat.name}: ${placed.length} labelled on D001${unplaced.length ? ' · ' + unplaced.length + ' in the register but not labelled on D001' : ''}. A ring is where the sheet prints the code, not a surveyed position.`;
  L.innerHTML = `<div class="rh">${head}</div>` +
    placed.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>${it.reg && (it.reg.name || it.reg.product) ? ' · ' + esc(it.reg.name || it.reg.product) : ''}<small>${esc(placeWord(it))}${it.reg && it.reg.item_types ? ' · ' + esc(String(it.reg.item_types).replace(/[\[\]']/g, '')) : ''}${it.reg && it.reg.asset_numbers && String(it.reg.asset_numbers) !== '[]' && cat.host ? ' · asset ' + esc(String(it.reg.asset_numbers)) : ''}</small></button>`).join('') +
    unplaced.map(it => `<button data-code="${esc(it.code)}" class="dim"><b>${esc(it.code)}</b> · ${esc(it.reg.name || it.reg.product)}<small>${esc(placeWord(it))}${it.reg.drawing ? ' · keyed on ' + esc(it.reg.drawing) : ''}${it.reg.locations && String(it.reg.locations) !== '[]' ? ' · ' + esc(String(it.reg.locations).replace(/[\[\]']/g, '')) : ''}</small></button>`).join('');
L.classList.add('show'); L.querySelectorAll('[data-code]').forEach(b => b.classList.toggle('sel', !!selected && b.dataset.code === selected.code)); L.onclick = e => { const b = e.target.closest('[data-code]'); if (b) selectCode(b.dataset.code, 0, true); };
  if (marks.length) { const gp = marks.flatMap(m => m.it.places.map(p => geoRect(p))), xs = gp.map(p => [p[0], p[2]]).flat(), ys = gp.map(p => [p[1], p[3]]).flat(); gotoRect([Math.min(...xs) - 40, Math.min(...ys) - 40, Math.max(...xs) + 40, Math.max(...ys) + 40], cat.name); }
  requestPaint();
}
/* byUser: a placed reference was chosen here; close phone Find, leaving its map card for explicit Open. */
function selectCode(code, place = 0, byUser = false) {
  const it = ITEMS.find(x => x.code === norm(code)); if (!it) return false; stopPulse(); selected = it; document.querySelectorAll('.findlist button').forEach(b => b.classList.toggle('sel', b.dataset.code === it.code));
  if (!marks.some(m => m.it === it)) marks = [{it, c: it.cat ? it.cat.c : '#ff6a13'}];
  if (it.places.length) { const bb = it.places[place % it.places.length], cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, aspect = sw / sh, h = Math.max(62, (bb[3] - bb[1]) * 9, (bb[2] - bb[0]) * 5 / aspect), w = h * aspect; highlight = null; gotoRect([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], it.code + (it.reg && it.reg.name ? ' · ' + it.reg.name : '')); startPulse(); }
  else toast(it.code + (it.cat && it.cat.host ? ' is in the register but has no place on the master plan yet' : ' is in the register but D001 does not label it') + (it.reg && it.reg.drawing ? '; it is keyed on ' + it.reg.drawing : '') + '.', 6000);
if (byUser && it.places.length) pickedLocation813();
  return true;
}
/* v6.97 - the pulse is a CSS animation on the compositor (two widening rings and a breathing one), placed on the pick
   when the view is drawn; it runs for 20 s after a pick, then the ring stays lit. No canvas is redrawn for it. */
function startPulse() { pulseT0 = performance.now(); clearTimeout(pulseRAF); pulseRAF = setTimeout(() => { pulseRAF = 0; placePulse(null); }, 20000); requestPaint(); }
function stopPulse() { clearTimeout(pulseRAF); pulseRAF = 0; placePulse(null); }
let pulseAt = '';
function placePulse(p) { const el = $('pulse'); if (!el) return; const k = p ? p.x.toFixed(1) + ',' + p.y.toFixed(1) + ',' + p.r.toFixed(1) + p.c : '';
  if (k === pulseAt) return; pulseAt = k; if (!p) { el.hidden = true; return; } el.hidden = false; el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`; el.style.setProperty('--r', p.r.toFixed(1) + 'px'); el.style.setProperty('--pc', p.c); }
/* v7.82 - DONE. A finished unit (the dashboard's Complete tick) gets a green tick badge and a ring that beats twice and
   rests. One chip shows or hides the layer; the list is read from the dashboard every 4 s. */
let DONE782 = new Set(), done782Sig = '', DONE782_ON = (() => { try { return localStorage.getItem('gc500.done790') === 'on'; } catch (e) { return false; } })(); /* v7.90 - off until asked for: the project manager, 2 Oct 2026, "you are putting green ticks everywhere" */
(() => { const st = document.createElement('style'); st.textContent = '.d782{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:1}'
  + '.d782 i{position:absolute;left:-10px;top:-10px;width:20px;height:20px;border-radius:50%;border:2px solid #2bd46b;box-sizing:border-box;opacity:0;will-change:transform,opacity;animation:d782beat 3.2s ease-out infinite}'
  + '@keyframes d782beat{0%{transform:scale(1);opacity:.95}12%{transform:scale(2.1);opacity:0}13%{transform:scale(1);opacity:.95}27%{transform:scale(2.5);opacity:0}100%{transform:scale(2.5);opacity:0}}'
  + '.d782.moving{display:none}@media (prefers-reduced-motion:reduce){.d782 i{animation:none;opacity:0}}html.d782still .d782 i{animation:none;opacity:0}'
  + '.d782row{display:flex;align-items:center;gap:8px;margin:8px 0 2px;flex-wrap:wrap}.d782row small.k{color:var(--mute,#9aa3ad);font:500 11px Inter,sans-serif}'
  + '#done782 b{display:inline-grid;place-items:center;width:14px;height:14px;border-radius:50%;background:#1fae57;color:#fff;font:800 10px/1 Inter,sans-serif;box-shadow:0 0 0 1.5px #fff}';
  document.head.appendChild(st); })();
function done782Pull() { let keys = null; try { const w = window.parent && window.parent !== window ? window.parent : window; document.documentElement.classList.toggle('d782still', w !== window && w.document.documentElement.getAttribute('data-motion') === 'off'); if (typeof w.gc500DoneKeys === 'function') keys = w.gc500DoneKeys(); } catch (e) {}
  if (!Array.isArray(keys)) return; const sig = keys.slice().sort().join(','); if (sig === done782Sig) return; done782Sig = sig; DONE782 = new Set(keys.map(norm)); done782Chip(); requestPaint(); }
setInterval(done782Pull, 4000); setTimeout(done782Pull, 600);
function done782List() { if (!DONE782_ON || !DONE782.size || typeof ITEMS === 'undefined' || !ITEMS) return []; return ITEMS.filter(it => it.places.length && it.cat && it.cat.host === 'trade' && DONE782.has(it.code)); }
function done782Chip() { const card = $('findCard'), chips = $('chips'); if (!card || !chips) return; let row = $('done782row');
  if (!row) { row = document.createElement('div'); row.id = 'done782row'; row.className = 'd782row'; chips.insertAdjacentElement('afterend', row);
    row.onclick = e => { const b = e.target.closest('#done782'); if (!b) return; DONE782_ON = !DONE782_ON; try { localStorage.setItem('gc500.done790', DONE782_ON ? 'on' : 'off'); } catch (_) {} done782Chip(); requestPaint(); }; }
  const n = (typeof ITEMS !== 'undefined' && ITEMS ? ITEMS.filter(it => it.places.length && it.cat && it.cat.host === 'trade' && DONE782.has(it.code)).length : 0);
  row.innerHTML = `<button class="chip" id="done782" aria-pressed="${DONE782_ON}" style="--c:#2bd46b" title="Finished units: a green tick, and a ring that beats twice. Tap to ${DONE782_ON ? 'hide' : 'show'} them."><b>✓</b>Done <small>${n}</small></button><small class="k">${DONE782_ON ? 'green tick, double beat = finished' : 'finished units hidden - tap Done to show them'}</small>`; }
function done782Draw(ctx, M, dn) { const out = [];
  for (const it of dn) for (const bb of it.places) { const g0 = toGeo((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), c = applyM(M, g0.x, g0.y); if (c.x < -40 || c.y < -40 || c.x > canvas.width + 40 || c.y > canvas.height + 40) continue;
    const r = 8 * dpr; ctx.fillStyle = '#1fae57'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.2 * dpr; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(c.x - r * .45, c.y + r * .02); ctx.lineTo(c.x - r * .1, c.y + r * .38); ctx.lineTo(c.x + r * .5, c.y - r * .36); ctx.stroke();
    if (out.length < 240) out.push([c.x / dpr, c.y / dpr]); }
  done782Place(out); }
let done782At = '';
function done782Place(list) { let L = $('d782'); const host = $('pulse') && $('pulse').parentNode;
  if (!L && host) { L = document.createElement('div'); L.id = 'd782'; L.className = 'd782'; L.setAttribute('aria-hidden', 'true'); host.insertBefore(L, $('pulse')); }
  if (!L) return; L.classList.toggle('moving', !!interacting);
  const k = list.map(p => p[0].toFixed(0) + ',' + p[1].toFixed(0)).join(';'); if (k === done782At) return; done782At = k;
  while (L.children.length < list.length) L.appendChild(document.createElement('i')); while (L.children.length > list.length) L.lastChild.remove();
  list.forEach((p, i) => { L.children[i].style.transform = ''; L.children[i].style.left = (p[0] - 10).toFixed(1) + 'px'; L.children[i].style.top = (p[1] - 10).toFixed(1) + 'px'; }); }
let marksDrawn = false;
function drawMarks(v) {
  const dn = done782List(); /* v7.82 */
  const ctx = mctx; if (!marks.length && !dn.length && !marksDrawn) { placePulse(null); done782Place([]); return; } ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, mcanvas.width, mcanvas.height); marksDrawn = marks.length > 0 || dn.length > 0;
  show(mcanvas, marksDrawn);   /* an empty full-screen layer still costs a blend on every frame; it is taken out */
  if (!marks.length && !dn.length) { placePulse(null); done782Place([]); return; } const M = sheetToDevice(dpr * v.scale, canvas.width, canvas.height), s = dpr * v.scale; let pulse = null;
  done782Draw(ctx, M, dn);
  ctx.font = `600 ${Math.round(11 * dpr)}px Inter, sans-serif`; ctx.textBaseline = 'middle';
  const showText = marks.length <= 60 || s > 1.2;
  for (const m of marks) for (const bb of m.it.places) {
    const g0 = toGeo((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), c = applyM(M, g0.x, g0.y); if (c.x < -80 || c.y < -80 || c.x > canvas.width + 80 || c.y > canvas.height + 80) continue;
    const r = Math.max(14 * dpr, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) * s * .7), sel = selected === m.it;
    const g = ctx.createRadialGradient(c.x, c.y, r * .55, c.x, c.y, r * 1.6); g.addColorStop(0, m.c + '00'); g.addColorStop(.45, m.c + (sel ? '66' : '3a')); g.addColorStop(1, m.c + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = (sel ? 2.5 : 1.6) * dpr; ctx.strokeStyle = m.c; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    if (sel && pulseRAF && !pulse) pulse = {x: c.x / dpr, y: c.y / dpr, r: r / dpr, c: m.c};
    if (showText || sel) { const txt = m.it.code, w = ctx.measureText(txt).width + 12 * dpr, h = 18 * dpr, x = c.x + r * .75, y = c.y - r * .75 - h / 2; ctx.fillStyle = 'rgba(15,13,12,.85)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 5 * dpr); ctx.fill(); ctx.strokeStyle = m.c; ctx.lineWidth = dpr; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(txt, x + 6 * dpr, y + h / 2); }
  }
  placePulse(pulse);
}
function markAt(x, y) { const v = currentView(), M = sheetToDevice(v.scale, sw, sh); let best = null; for (const m of marks) for (const bb of m.it.places) { const g0 = toGeo((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), c = applyM(M, g0.x, g0.y), r = Math.max(14, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) * v.scale * .7), d = Math.hypot(c.x - x, c.y - y); if (d <= r * 1.2 && (!best || d < best.d)) best = {m, d}; } return best && best.m; }
/* search on the drawing's own labels */
function norm(s) { return s.toUpperCase().replace(/[\s\-_.]+/g, ' ').trim(); }
function locationName(r) { const x = (r[1] + r[3]) / 2, y = (r[2] + r[4]) / 2; return y > 1470 ? 'Legend / drawing details' : x > 1450 && y > 850 ? 'Inset plan' : 'Main plan'; }
function search() { if (!P) return; const q = $('q').value.trim(), n = norm(q); $('results').classList.toggle('show', !!q); if (!q) { $('results').replaceChildren(); highlight = null; requestPaint(); return; }
  const rank = it => it.code === n ? 0 : it.code === n.replace(' ', '') ? 0 : it.code.startsWith(n) ? 1 : it.code.includes(n) ? 2 : 3;
  const items = ITEMS.filter(it => it.code.includes(n) || (it.reg && (String(it.reg.asset_numbers || '').includes(q) || norm(it.reg.name || '').includes(n)))).sort((a, b) => rank(a) - rank(b) || a.code.length - b.code.length).slice(0, 20);
  const hits = P.labels.map((r, i) => ({r, i, n: norm(r[0])})).filter(o => o.n.includes(n) && !items.some(it => it.code === o.n)); hits.sort((a, b) => ((a.n === n ? 0 : a.n.startsWith(n) ? 1 : 2) - (b.n === n ? 0 : b.n.startsWith(n) ? 1 : 2)) || a.n.length - b.n.length || a.i - b.i); lastSearch = hits.slice(0, 40);
  $('results').innerHTML = (items.length ? items.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>${it.reg && it.reg.name && norm(it.reg.name) !== norm(it.cat.name) ? ' · ' + esc(it.reg.name) : ''}<small>${esc(it.cat.name)} · ${esc(placeWord(it))}${it.reg && String(it.reg.asset_numbers || '[]') !== '[]' ? ' · asset ' + esc(String(it.reg.asset_numbers).replace(/[\[\]']/g, '')) : ''}</small></button>`).join('') : '') +
    (hits.length ? `<div class="rh">${hits.length} other label${hits.length === 1 ? '' : 's'} on the drawing</div>` + lastSearch.map((o, i) => `<button data-result="${i}"><b>${esc(o.r[0])}</b><small>${locationName(o.r)} · jump to label</small></button>`).join('') : '') + (!items.length && !hits.length ? '<div class="rh">No match in the drawing\'s labels or the register.</div>' : ''); }
function chooseResult(i, labelOnly = false) { const b = $('results').querySelector('[data-code]'); if (b && i === 0 && !labelOnly) { selectCode(b.dataset.code, 0, true); return; }const r = lastSearch[i]?.r; if (!r) return; clearSelection813(); const bb = r.slice(1), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2; highlight = bb; const aspect = sw / sh, h = Math.max(62, (bb[3] - bb[1]) * 9, (bb[2] - bb[0]) * 5 / aspect), w = h * aspect; gotoRect([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2],r[0]); pickedLocation813(); stage.focus({preventScroll: true}); }
$('q').addEventListener('input', search); $('q').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); chooseResult(0); } if (e.key === 'Escape') {$('q').value = ''; search(); panel813(false); stage.focus(); } });
$('results').onclick = e => { const c = e.target.closest('[data-code]'); if (c) {selectCode(c.dataset.code, 0, true); return; } const b = e.target.closest('[data-result]'); if (b) chooseResult(+b.dataset.result, true); };
$('jumps').onclick = e => { const b = e.target.closest('[data-region]'); if (!b) return;const r = regions[+b.dataset.region]; clearSelection813(); highlight = null;
  if (geoOn() && r.rect[1] > 1466) chooseMode('original');   /* the legend is on the sheet, not on the ground */ gotoRect(r.rect, r.name);b.classList.add('active'); pickedLocation813(); };
document.querySelectorAll('#dial [data-face]').forEach(b => b.onclick = e => { e.stopPropagation(); if (performance.now() - dialTurned < 350) return; face(+b.dataset.face); }); $('sheetBtn').onclick = () => asDrawn();
/* the ring turns the view the way the hand goes round it */
/* a press that moves more than a few pixels is a turn (from anywhere on the dial, letters included); a press that does not is a tap */
let dialTurned = 0;
(() => { const d = $('dial'); let g = null;
  d.addEventListener('pointerdown', e => { if (e.button > 0) return; e.stopPropagation(); const r = d.getBoundingClientRect(); g = {cx: r.left + r.width / 2, cy: r.top + r.height / 2, rot: camera.rot, x: e.clientX, y: e.clientY, id: e.pointerId, on: false}; g.a0 = Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180 / Math.PI; });
  d.addEventListener('pointermove', e => { if (!g) return;
    if (!g.on) { if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return;g.on = true; stopCameraMotion813(); try { d.setPointerCapture(g.id); } catch (_) {} d.classList.add('turning'); }
    e.preventDefault(); const a = Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180 / Math.PI; camera.rot = g.rot + ((a - g.a0 + 540) % 360) - 180; touchInteraction(); changeView(false); });
  const end = () => { if (g && g.on) dialTurned = performance.now(); g = null; d.classList.remove('turning'); }; d.addEventListener('pointerup', end); d.addEventListener('pointercancel', end); })();
$('zoomIn').onclick = () => zoomBy(1.5); $('zoomOut').onclick = () => zoomBy(1 / 1.5); $('fitBtn').onclick = fit;
$('boxBtn').onclick = () => setBox(!boxMode); function setBox(on) { boxMode = on; stage.classList.toggle('box', on); $('boxBtn').setAttribute('aria-pressed', String(on)); if (on) toast('Drag a box around the area to inspect. Esc cancels.'); }
$('fullBtn').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch (_) {} };
document.addEventListener('fullscreenchange', () => setTimeout(resize, 50));
function applyZoomInput() { const n = Number($('zoomInput').value.replace(/[,\s%]/g, ''));if (Number.isFinite(n) && n > 0) { stopCameraMotion813(); camera.z = clamp(n / 100, MIN_Z, MAX_Z); changeView(); } else toast('Enter a zoom between 50 and 64,000 per cent.'); $('zoomInput').value = Math.round(camera.z * 100).toLocaleString('en-AU') + '%'; }
$('zoomInput').onfocus = () => { lastZoomText = ''; $('zoomInput').select(); }; $('zoomInput').onchange = applyZoomInput; $('zoomInput').onkeydown = e => { if (e.key === 'Enter') { applyZoomInput(); $('zoomInput').blur(); } e.stopPropagation(); };
let miniDown = false;function moveMini(e) { stopCameraMotion813(); const r = $('mini').getBoundingClientRect(), inner = $('miniInner'), W = inner.offsetWidth || 1, H = inner.offsetHeight || 1, rot = 0;
  const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), ux = dx * Math.cos(rot) + dy * Math.sin(rot), uy = -dx * Math.sin(rot) + dy * Math.cos(rot);   /* undo the box's turn */
  camera.cx = clamp(ux / W + .5, 0, 1) * SHEET_W; camera.cy = clamp(uy / H + .5, 0, 1) * SHEET_H; highlight = null; changeView(); }
$('mini').onpointerdown = e => { e.preventDefault(); miniDown = true; $('mini').setPointerCapture(e.pointerId); moveMini(e); }; $('mini').onpointermove = e => { if (miniDown) moveMini(e); }; $('mini').onpointerup = $('mini').onpointercancel = () => { miniDown = false; };
/* export: the same chain at 3840 px on the long edge; tiles awaited; attribution stamped; incomplete loads are said */
$('exportBtn').onclick = async () => {
  if (!ready || exporting) return; exporting = true; dropVTQueue(); $('exportBtn').disabled = true; toast('Preparing a fresh high-detail export…', 30000);
  try {
    if (mode !== 'satellite') await ensureScene();                 /* the export draws the view from the vectors */
    if (mode === 'original' && UNDER.length) { if (OFFSCREEN_OK && !underWorkerFailed) await underlayJob(); if (!underComp) await Promise.all(UNDER.map(u => underPatch(u).p)); }
    const v = currentView(); const edge = 3840; let width, height; if (v.w >= v.h) { width = edge; height = Math.round(edge * v.h / v.w); } else { height = edge; width = Math.round(edge * v.w / v.h); }
    const c = document.createElement('canvas'); c.width = width; c.height = height; const g = c.getContext('2d'); const s = width / v.w; let incomplete = 0;
    g.fillStyle = mode === 'original' ? '#fff' : '#17120f'; g.fillRect(0, 0, width, height); const EX = sheetToDevice(s, width, height);
    if (mode === 'original') { g.save(); g.setTransform(...EX); if (UNDER.length && PYR) { if (underComp) { const b = underComp.bbox; if (underComp[1]) g.drawImage(underComp[1], b[0], b[1], b[2] - b[0], b[3] - b[1]); else { const T = underComp.tiles1, sx = (b[2] - b[0]) / T.pw, sy = (b[3] - b[1]) / T.ph; for (const q of T.tiles) g.drawImage(q.bm, b[0] + q.x * sx, b[1] + q.y * sy, q.w * sx, q.h * sy); } } for (const u of UNDER) { if (underComp && underComp.files.has(u.file)) continue; const im = underImgs.get(u.file), bm = im && (im.bm[1] || im.bm[2] || im.bm[4]); if (bm) g.drawImage(bm, u.bbox[0], u.bbox[1], u.bbox[2] - u.bbox[0], u.bbox[3] - u.bbox[1]); } } else if (preview || overview) g.drawImage(preview || overview, 0, 0, SHEET_W, SHEET_H); g.restore(); }
    if (mode !== 'original') { for (const R of regionsForTiles(v)) { const {z} = tileZoomFor({scale: s / dpr, x: v.x, y: v.y, w: v.w, h: v.h}, R.M); const f = Math.pow(2, z - 18), Mz = mul([[f, 0, 0], [0, f, 0], [0, 0, 1]], R.M), Minv = inv(Mz);
        const [x0, y0, x1, y1] = R.rect, cs = [ap(Mz, Math.max(v.x, x0), Math.max(v.y, y0)), ap(Mz, Math.min(v.x + v.w, x1), Math.max(v.y, y0)), ap(Mz, Math.max(v.x, x0), Math.min(v.y + v.h, y1)), ap(Mz, Math.min(v.x + v.w, x1), Math.min(v.y + v.h, y1))];
        const tx0 = Math.floor(Math.min(...cs.map(p => p[0])) / TILE), tx1 = Math.floor(Math.max(...cs.map(p => p[0])) / TILE), ty0 = Math.floor(Math.min(...cs.map(p => p[1])) / TILE), ty1 = Math.floor(Math.max(...cs.map(p => p[1])) / TILE);
        if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 120) { incomplete++; continue; }
        const need = []; for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) { if (!tiles.has(tileKey(z, tx, ty))) requestTile(z, tx, ty, 0, 'keep'); keepWanted.add(tileKey(z, tx, ty)); need.push([tx, ty]); }
        const t1 = performance.now(); while (need.some(([tx, ty]) => !tiles.has(tileKey(z, tx, ty))) && performance.now() - t1 < 20000) await new Promise(r => setTimeout(r, 120));
        g.save(); g.setTransform(...EX); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); for (const h of R.holes) g.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]); g.clip('evenodd'); g.transform(Minv[0][0], Minv[1][0], Minv[0][1], Minv[1][1], Minv[0][2], Minv[1][2]);
        for (const [tx, ty] of need) { const t = tiles.get(tileKey(z, tx, ty)); if (t && t.bm) g.drawImage(t.bm, tx * TILE, ty * TILE, TILE + .5, TILE + .5); else incomplete++; } g.restore(); } }
    if (mode !== 'satellite') { const bw = Math.round(v.w * s), bh = Math.round(v.h * s); const {svg} = await svgFromWorker(v, bw, bh); const {img, url} = await loadSvg(svg).promise; g.save(); g.setTransform(...EX); g.globalAlpha = mode === 'hybrid' ? opacity : 1; g.drawImage(img, v.x, v.y, v.w, v.h); g.restore(); URL.revokeObjectURL(url); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '600 26px Inter, sans-serif'; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, height - 44, width, 44); g.fillStyle = '#fff';
    g.fillText((mode === 'original' ? '' : (SOURCE === 'google' ? 'Google · ' + gCopy : '© Mapbox © OpenStreetMap © Maxar') + ' · ') + 'Drawing © iEDM D001 rev 03 · raster export ' + width + ' × ' + height + ' px · ' + (mode === 'original' ? 'original plan' : mode === 'hybrid' ? 'satellite + plan (image registration, not survey)' : 'satellite only') + (incomplete ? ' · INCOMPLETE: ' + incomplete + ' tiles did not load' : ''), 16, height - 14);
    const blob = await new Promise(r => c.toBlob(r, 'image/png')); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'GC500_D001_Rev03_' + mode + '_' + Math.round(camera.z * 100) + 'pct_' + width + 'x' + height + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    toast(incomplete ? 'PNG saved but marked INCOMPLETE: some tiles did not load.' : 'PNG saved · ' + width + ' × ' + height + ' px.');
  } catch (e) { console.error(e); toast('Export could not finish.'); } finally { exporting = false; keepWanted.clear(); $('exportBtn').disabled = false; changeView(false); }
};
/* gestures: wheel, drag, pinch, double tap, box zoom, keyboard */
function onControls(e) { return !!e.target.closest('button,input,.mini,.console,.legend'); }
stage.addEventListener('wheel', e => { if (onControls(e)) return; e.preventDefault(); const p = stagePoint(e), delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? sh : 1); zoomBy(Math.exp(-clamp(delta, -500, 500) * (e.ctrlKey ? .008 : .0032)), p.x, p.y); }, {passive: false});   /* v7.58: a notch is worth more (was .0022) */
let tapPick = null;   /* set by endPointer when a pointer went down and up without moving: the click that follows may pick a ring */
stage.addEventListener('click', e => { const t = tapPick; tapPick = null; if (!t || onControls(e) || boxMode || performance.now() - t.t > 400) return; const m = markAt(t.x, t.y); if (m) selectCode(m.it.code, 0, true); });
stage.addEventListener('dblclick', e => { if (onControls(e) || boxMode) return; e.preventDefault(); const p = stagePoint(e); highlight = null; zoomBy(e.shiftKey ? .5 : 2, p.x, p.y); });
function startPinch() { const a = [...pointers.values()]; if (a.length < 2) { pinch = null; return; } const mid = {x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2}; pinch = {distance: Math.max(10, Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y)), z: camera.z, rot: camera.rot, angle: Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x) * 180 / Math.PI, anchor: screenToSource(mid.x, mid.y), mid}; }
stage.addEventListener('pointerdown', e => { if (onControls(e) || e.button > 0) return; e.preventDefault();stage.focus({preventScroll: true}); stopCameraMotion813(); panTrail = []; const p = stagePoint(e); pointers.set(e.pointerId, p); stage.setPointerCapture(e.pointerId); highlight = null;
  if (boxMode && pointers.size === 1) { boxStart = p; const s = $('sel'); s.style.display = 'block'; s.style.left = p.x + 'px'; s.style.top = p.y + 'px'; s.style.width = s.style.height = '0px'; return; }
  if (pointers.size === 2) { if (boxStart) { boxStart = null; $('sel').style.display = 'none'; setBox(false); } startPinch(); gestureStart = null; } else if (pointers.size === 1) { gestureStart = {p, cx: camera.cx, cy: camera.cy, rot: camera.rot, rotate: e.altKey || e.shiftKey, t: performance.now(), type: e.pointerType, moved: false}; stage.classList.add('dragging'); } });
stage.addEventListener('pointermove', e => { if (!pointers.has(e.pointerId)) return; e.preventDefault(); const p = stagePoint(e); pointers.set(e.pointerId, p);
  if (boxStart) { const s = $('sel'); s.style.left = Math.min(boxStart.x, p.x) + 'px'; s.style.top = Math.min(boxStart.y, p.y) + 'px'; s.style.width = Math.abs(boxStart.x - p.x) + 'px'; s.style.height = Math.abs(boxStart.y - p.y) + 'px'; return; }
  if (pointers.size >= 2 && pinch) { touchInteraction(); const a = [...pointers.values()], mid = {x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2}, dist = Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y), ang = Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x) * 180 / Math.PI;
    camera.z = clamp(pinch.z * dist / pinch.distance, MIN_Z, MAX_Z); const dA = ((ang - pinch.angle + 540) % 360) - 180; if (Math.abs(dA) > 4 || pinch.turning) { pinch.turning = true; camera.rot = pinch.rot + dA; }
    keepUnder(pinch.anchor, mid.x, mid.y); changeView(); }
  else if (gestureStart) { touchInteraction(); const dx = p.x - gestureStart.p.x, dy = p.y - gestureStart.p.y; gestureStart.moved = gestureStart.moved || Math.hypot(dx, dy) > 5;
    if (gestureStart.rotate) { const a0 = Math.atan2(gestureStart.p.y - sh / 2, gestureStart.p.x - sw / 2), a1 = Math.atan2(p.y - sh / 2, p.x - sw / 2); camera.rot = gestureStart.rot + (a1 - a0) * 180 / Math.PI; changeView(false); return; }
    panTrail.push({t: performance.now(), x: p.x, y: p.y}); if (panTrail.length > 12) panTrail.shift();
    const s = fitScale * camera.z, r = camera.rot * Math.PI / 180; camera.cx = gestureStart.cx - (dx * Math.cos(r) + dy * Math.sin(r)) / s; camera.cy = gestureStart.cy - (-dx * Math.sin(r) + dy * Math.cos(r)) / s; changeView(); } });
/* keep a sheet point under a screen point after a zoom or a turn */
function keepUnder(sheetPt, sx, sy) { const M = sheetToDevice(fitScale * camera.z, sw, sh); const d = applyM(M, sheetPt.x, sheetPt.y); const r = camera.rot * Math.PI / 180, s = fitScale * camera.z, ex = sx - d.x, ey = sy - d.y; camera.cx -= (ex * Math.cos(r) + ey * Math.sin(r)) / s; camera.cy -= (-ex * Math.sin(r) + ey * Math.cos(r)) / s; }
function endPointer(e) { if (!pointers.has(e.pointerId)) return;
  if (e.type === 'pointercancel') {
    for (const id of pointers.keys()) { try { if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id); } catch (_) {} }
    pointers.clear(); pinch = null; gestureStart = null; panTrail = []; tapPick = null; lastTap = null; boxStart = null;
    $('sel').style.display = 'none'; if (boxMode) setBox(false); stage.classList.remove('dragging'); changeView(false); return;
  }
  const p = stagePoint(e);
  let flick = null; if (e.type === 'pointerup' && pointers.size === 1 && gestureStart && gestureStart.moved && !gestureStart.rotate && !boxStart && panTrail.length > 1) {
    const now = performance.now(), recent = panTrail.filter(q => now - q.t < 160); if (recent.length > 1) { const a = recent[0], b = recent[recent.length - 1], dt = Math.max(8, b.t - a.t); flick = {vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt}; if (Math.hypot(flick.vx, flick.vy) < .25) flick = null; } } tapPick = (gestureStart && !gestureStart.moved && !boxStart && pointers.size === 1) ? {x: p.x, y: p.y, t: performance.now()} : null;
  if (boxStart) { const a = screenToSource(boxStart.x, boxStart.y), b = screenToSource(p.x, p.y); if (Math.abs(p.x - boxStart.x) > 8 && Math.abs(p.y - boxStart.y) > 8) gotoRect([Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)], 'Selected detail'); boxStart = null; $('sel').style.display = 'none'; setBox(false); }
  else if (gestureStart && gestureStart.type === 'touch' && !gestureStart.moved && performance.now() - gestureStart.t < 280) { if (lastTap && performance.now() - lastTap.t < 330 && Math.hypot(lastTap.x - p.x, lastTap.y - p.y) < 28) { zoomBy(2, p.x, p.y); lastTap = null; } else lastTap = {x: p.x, y: p.y, t: performance.now()}; }
  pointers.delete(e.pointerId); pinch = null; gestureStart = null; if (flick) fling(flick.vx, flick.vy); if (pointers.size === 1) { const one = [...pointers.values()][0]; gestureStart = {p: one, cx: camera.cx, cy: camera.cy, t: performance.now(), moved: true, type: e.pointerType}; } if (!pointers.size) { stage.classList.remove('dragging'); changeView(false); } }
stage.addEventListener('pointerup', endPointer); stage.addEventListener('pointercancel', e => { lastTap = null; endPointer(e); });
window.addEventListener('keydown', e => { if (e.target.matches('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey) return; const key = e.key.toLowerCase();
  if (!['+', '=', '-', '_', 'home', '0', 'z', '/', 'escape', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', '1', '2', '3', 'r', 'n', 'd'].includes(key)) return; e.preventDefault();
  if (key === '+' || key === '=') zoomBy(1.5); else if (key === '-' || key === '_') zoomBy(1 / 1.5); else if (key === 'home' || key === '0') fit(); else if (key === 'z') setBox(!boxMode); else if (key === '/') {panel813(true); $('q').focus(); }
  else if (key === '1') chooseMode('original'); else if (key === '2') chooseMode('hybrid'); else if (key === '3') chooseMode('satellite');
  else if (key === 'escape') {setBox(false); clearSelection813(); marks = []; document.querySelectorAll('#chips .chip').forEach(x => x.setAttribute('aria-pressed', 'false')); /* v7.82 - not the Done chip */ $('findList').classList.remove('show'); $('sel').style.display = 'none'; boxStart = null;closeLegend813(false); panel813(false); requestPaint(); }
  else if (key === 'r') rotateTo(camera.rot + (e.shiftKey ? -15 : 15)); else if (key === 'n') northUp(); else if (key === 'd') asDrawn();
  else { stopCameraMotion813(); const amount = (e.shiftKey ? 240 : 90) / (fitScale * camera.z), r = camera.rot * Math.PI / 180, dx = key === 'arrowleft' ? -1 : key === 'arrowright' ? 1 : 0, dy = key === 'arrowup' ? -1 : key === 'arrowdown' ? 1 : 0;
    camera.cx += amount * (dx * Math.cos(r) + dy * Math.sin(r)); camera.cy += amount * (-dx * Math.sin(r) + dy * Math.cos(r)); changeView(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelTiles(); dropVTQueue(); } else requestPaint(); });
{ const ro = new ResizeObserver(resize); try { ro.observe(canvas, {box: 'device-pixel-content-box'}); } catch (e) { ro.observe(stage); } }
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
/* v8.13 - the source scene, in the worker, only when needed: zoom past the pyramid, the PNG export, or missing boot/labels. A failure is said once and tried again later; the pyramid carries on. */
function ensureScene() {
  if (sceneReady) return Promise.resolve(true);
  if (scenePromise) return scenePromise;
  if (performance.now() < sceneRetryAt) return Promise.reject(new Error('scene: trying again shortly'));
  if (!('DecompressionStream' in window) || !('Worker' in window)) return Promise.reject(new Error('This browser cannot unpack the drawing. Use a current Edge, Chrome, Firefox or Safari.'));
  if (!worker) { worker = new Worker('scene-worker.js'); worker.onmessage = workerMessage; }
  scenePromise = loadScene().then(msg => {
    sceneReady = true; perf.sceneMs = msg.ms;
    worker.onerror = e => { for (const w of svgWaiting.values()) w.reject(new Error('drawing helper stopped')); svgWaiting.clear(); toast('The drawing helper stopped. Reload the page to carry on.', 9000); };
    if (!P) P = {meta: msg.meta, labels: msg.labels, count: msg.count};
    else { if (msg.meta && P.meta && msg.meta.sha256 !== P.meta.sha256) toast('The drawing file and its pre-rendered tiles are from different revisions; tell the dashboard owner.', 9000); P.count = msg.count; if (!P.labels.length) P.labels = msg.labels; }
    requestPaint(); pumpVT(); return true;
  }).catch(e => { scenePromise = null; sceneRetryAt = performance.now() + 15000; if (worker) { worker.terminate(); worker = null; } if (ready) toast(friendly(e) + ' The pre-rendered drawing is still shown.', 8000); throw e; });
  return scenePromise;
}
let UNDER_DONE = false; const bootT0 = performance.now();
async function boot() {
  try {
    resize(); $('bar').style.width = '25%';
    const startM = startMode();
    /* everything the first view needs, at once (index.html's <head> has usually asked already) */
    const pGeo = once('geo', () => getJSON('assets/georeferencing.json')), pPyr = once('pyr', () => getJSON('assets/vt/manifest.json'));
    const pLabels = once('labels', () => getJSON('assets/source-labels.json')), pUnder = getJSON('assets/underlay/manifest.json');
    const pReg = getJSON('assets/register.json'), pSnap = getJSON('assets/plan_items.json', {cache: 'no-cache'});
    if (startM !== 'original') ensureKey();
    /* the whole sheet in one small picture: the minimap, and the stand-in under Original plan */
    once('ov', () => fetch('assets/sheet-overview.webp').then(r => r.ok ? r.blob() : null)).then(async b => { if (!b) throw new Error('no overview'); $('miniImg').src = URL.createObjectURL(b); overview = await createImageBitmap(b); requestPaint(); })
      .catch(() => { $('mini').style.visibility = 'hidden'; });
    /* the aerial patches carry their soft masks as alpha; a set exported without it (RGB, black where masked) is not used */
    pUnder.then(under => { if (under && under.items && under.items.every(u => u.alpha)) UNDER = under.items; else if (under) console.warn('underlay patches have no alpha; using the overview instead'); UNDER_DONE = true; if (mode === 'original') requestPaint(); });
    const [geo, pyr] = await Promise.all([pGeo, pPyr]);
    if (pyr && pyr.levels && pyr.levels.length) { PYR = pyr; PYR_LEVELS = pyr.levels.map(l => l.L).sort((a, b) => a - b); PYR_MAX = PYR_LEVELS[PYR_LEVELS.length - 1]; }
    BOOT = pyr && pyr.boot && pyr.boot.meta ? pyr.boot : null;
    if (BOOT) { P = {meta: BOOT.meta, labels: [], count: BOOT.count}; BOOT.underlay.forEach(i => UNDERLAY.add(i)); }
    else {   /* a manifest without the boot block (an older build): the scene first, as before */
      $('loadText').textContent = 'Unpacking the source geometry…';
      const cls = await getJSON('assets/classification.json'); window.__cls = cls; if (cls) cls.image_records.forEach(m => { if (m.category === 'aerial_underlay') UNDERLAY.add(m.id); });
      await ensureScene();
    }
    GEO = geo; geoSetup();
    if (GEO && GEO.pdf_sha256 !== P.meta.sha256) { GEO = null; toast('The georeferencing file is for a different revision of the drawing; satellite alignment is off until it is redone.', 9000); }
    if (!modeChosen) setMode(startM);
    alignmentPanel(); ready = true; $('bar').style.width = '60%'; $('loadText').textContent = 'Drawing the plan…'; fit(true); miniNorthUp(); setAttrib();
    prefetchView(currentView());       /* the first view's tiles go out now, not a frame later (the first frame waits on the page's first paint) */
    /* search and the Find chips: the drawing's labels, the register and the master plan's own numbers (v6.96) */
    const [labels, reg, snap] = await Promise.all([pLabels, pReg, pSnap]);
    if (labels) P.labels = labels; else await ensureScene().catch(() => {});
    REG = reg; PLAN_SNAP = snap; buildItems(); itemsReady = true; $('q').disabled = false; window.__ready = true; perfText(); maybeReady();
    /* v6.20 - opened on a reference from the delivery page's banner: ?find=<GC500 ID> selects it as a search would */
    const fq = new URLSearchParams(location.search).get('find'); if (fq) { const q = $('q'); if (q) q.value = fq; selectCode(fq); }
  } catch (e) { console.error(e); $('loader').classList.remove('done', 'fade'); loaderAt = 0; $('loadText').textContent = friendly(e); $('bootRetry').hidden = false; $('bar').style.background = 'var(--bad)'; window.__bootError = String(e); if (worker) worker.terminate(); }
}
/* v8.13 - keep first view and ordinary zooms on the pre-rendered pyramid. The source scene is
   loaded by ensureScene only for detail beyond that pyramid, export, or a missing boot/label source.
   Original plan's aerial is requested by drawUnderlay when that mode is actually visible. */
function afterFirstSharp() { maybeReady(); }
function maybeReady() { if (itemsReady && ready && loaderAt && readyResolve) { const r = readyResolve; readyResolve = null; r({mode, firstViewMs: Math.round(loaderAt), items: ITEMS.length}); } }
$('bootRetry').onclick = () => location.reload();
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (ready && MODES.includes(h)) setMode(h); });
boot();
window.__marksCount = () => ({marks: marks.length, places: marks.reduce((n, m) => n + m.it.places.length, 0), selected: selected && selected.code, pulsing: !!pulseRAF});
/* v6.97 - for the dashboard that embeds this page: GC500Explorer.ready (a Promise, settles when the plan is on screen and
   search and the Find chips work) and GC500Explorer.find(code) (select and fly to a reference, as ?find= does; resolves
   true if found).A person's pick stays on this map; the reference card's explicit Open action opens its dashboard record. */
window.GC500Explorer = {ready: readyPromise, find: code => readyPromise.then(() => { const q = $('q'); if (q) q.value = String(code || ''); return selectCode(String(code || '')); }),
  get state() { return {ready, mode, zoom: camera.z, view: currentView(), records: P?.count, tiles: tiles.size, perf, sceneReady}; }, fit, goto: (r, l = 'Selected detail') => gotoRect(r, l),zoom: z => { stopCameraMotion813(); camera.z = clamp(z, MIN_Z, MAX_Z); changeView(); }, setMode, render: () => pumpVT()};
