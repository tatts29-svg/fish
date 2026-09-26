function wireMap(){
 const stage = $('#stage'), inner = $('#inner');
 if (!stage) return;
 const sh = DATA.sheets.find(s => s.key === state.sheet) || DATA.sheets[0];
 const rotEl = $('#maprot'), north = mapNorthDeg(sh);
 const im = inner.querySelector('img');
 const ZMAX = MAP_TILES && sh.master ? 16 : 8;
 /* v6.90 - NOTHING IS MEASURED WHILE THE MAP MOVES. The stage's size is kept by a ResizeObserver and its place on
    the screen is read when a finger or the wheel arrives, never inside a frame; each frame only writes transforms.
    (It used to measure the stage two or three times a frame, which made the browser lay the page out again every
    time - the stutter.) */
 let SW = stage.clientWidth || 1, SH = stage.clientHeight || 1;
 const ratio = () => (im && im.naturalWidth) ? im.naturalHeight / im.naturalWidth : (sh.master ? 1684 / 2384 : 1427 / 2020);
 const box = () => stage.getBoundingClientRect();
 const mapBar = () => {
 const bar = $('#mapbar');
 if (!bar || !sh.m_across) return;
 const mPerPx = sh.m_across / (SW * state.zoom);
 const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
 const target = 140 * mPerPx;
 const m = nice.reduce((a, b) => Math.abs(Math.log(b / target)) < Math.abs(Math.log(a / target)) ? b : a, nice[0]);
 bar.style.width = (m / mPerPx).toFixed(1) + 'px';
 bar.textContent = m >= 1000 ? (m / 1000) + ' km' : m + ' m';
 bar.title = 'Scale bar — ' + bar.textContent + ' on the ground at this zoom';
 };
 /* the compass: N, E, S and W sit round the ring where they really are on the screen, and the needle points north */
 const cmp = $('#mcompass'), cmpR = cmp ? cmp.querySelector('.mcring') : null, head = $('#mchead');
 const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], WORDS = {N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west'};
 const facing = () => north == null ? null : ((-(north + state.rot)) % 360 + 360) % 360;
 const compass = () => {
 if (!cmp || north == null) return;
 const a = north + state.rot;
 cmpR.style.transform = `rotate(${a}deg)`;
 cmp.querySelectorAll('[data-face]').forEach(b => { b.firstElementChild.style.transform = `rotate(${-(a + +b.dataset.face)}deg)`; });
 const f = facing(), p = POINTS[Math.round(f / 45) % 8];
 if (head) head.textContent = 'Facing ' + WORDS[p];
 cmp.setAttribute('aria-label', 'Compass — the top of the map faces ' + WORDS[p] + ' (' + Math.round(f) + '°). Press N, E, S or W to face that way.');
 };
 /* v6.90 - THE PILLS RIDE ABOVE THE DRAWING, NOT IN IT. Each pill, pin and the search ring is lifted out of the
    scaled, turned drawing into a flat layer over it and put where its point on the drawing lands on the screen.
    The drawing then only ever moves as one picture (the graphics card does that for nothing), the pills stay the
    same size and upright at any zoom and any angle without the browser restyling all 300 of them every frame, and
    anything well off the screen is not drawn at all. */
 const OV = $('#mkov'), floaters = [];
 if (OV) [...inner.children].forEach(el => {
 if (el.tagName === 'IMG' || el.classList.contains('mtiles')) return;
 const l = parseFloat(el.style.left), tp = parseFloat(el.style.top); if (isNaN(l) || isNaN(tp)) return;
 floaters.push({el, fx: l / 100, fy: tp / 100, off: false}); el.style.left = '0'; el.style.top = '0'; OV.appendChild(el); });
 /* a drag only slides the whole layer (one move, not three hundred); a zoom or a turn puts every pill again */
 let placed = null;
 const place = () => {
 const a = state.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
 if (placed && placed.z === state.zoom && placed.r === state.rot && placed.w === SW && placed.h === SH) {
 const dx = state.ox - placed.ox, dy = state.oy - placed.oy, X = dx * c - dy * s, Y = dx * s + dy * c;
 if (Math.abs(X) < SW * 0.5 && Math.abs(Y) < SH * 0.5) { OV.style.transform = `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px)`; return; }
 }
 OV.style.transform = '';
 const W = SW * state.zoom, H = SW * ratio() * state.zoom, mx = SW / 2, my = SH / 2, mX = SW * 0.6 + 80, mY = SH * 0.6 + 80;
 for (const f of floaters) {
 const x = state.ox + f.fx * W - mx, y = state.oy + f.fy * H - my, X = mx + x * c - y * s, Y = my + x * s + y * c;
 const off = X < -mX || Y < -mY || X > SW + mX || Y > SH + mY;
 if (off !== f.off) { f.off = off; f.el.style.visibility = off ? 'hidden' : ''; }
 if (!off) f.el.style.transform = `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px) translate(-50%,-50%) scale(var(--k,1))`;
 }
 placed = {z: state.zoom, r: state.rot, w: SW, h: SH, ox: state.ox, oy: state.oy}; };
 let lastR = null;
 const apply = () => {
 inner.style.transform = `translate3d(${state.ox}px,${state.oy}px,0) scale(${state.zoom})`;
 if (!OV) inner.style.setProperty('--z', state.zoom);
 if (rotEl && lastR !== state.rot) { rotEl.style.setProperty('--rot', state.rot + 'deg'); rotEl.style.transform = `rotate(${state.rot}deg)`; lastR = state.rot; compass(); }
 place(); mapBar(); };
 let applyRaf = 0;
 const applySoon = () => { if (!applyRaf) applyRaf = requestAnimationFrame(() => { applyRaf = 0; apply(); }); };
 /* v5.83 — the drawing turns about the middle of the stage; a point on the screen is turned back into the drawing's
    own frame before it is used, so drags, pinches and the wheel work the same whichever way it faces */
 const unturn = (x, y) => { const a = -state.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), mx = SW / 2, my = SH / 2;
 return {x: mx + (x - mx) * c - (y - my) * s, y: my + (x - mx) * s + (y - my) * c}; };
 const unturnD = (dx, dy) => { const a = -state.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return {x: dx * c - dy * s, y: dx * s + dy * c}; };
 /* v6.90 - THE FRAME STAYS STILL AND IS ALWAYS FULL. Turned any way, the drawing is held so that it covers the
    whole stage - the view turns, the sheet is never seen spinning as a tilted rectangle with empty corners. At the
    printed angle this is exactly the old rule. */
 const corners = () => [unturn(0, 0), unturn(SW, 0), unturn(0, SH), unturn(SW, SH)];
 const coverZ = () => { if (!state.rot && !stage.classList.contains('mfull')) return 1;
 const c = corners(), W = SW, H = SW * ratio();
 const sx = Math.max(...c.map(p => p.x)) - Math.min(...c.map(p => p.x)), sy = Math.max(...c.map(p => p.y)) - Math.min(...c.map(p => p.y));
 return Math.max(1, sx / W, sy / H); };
 const clamp = () => {
 const zc = coverZ();
 if (state.zoom < zc) { const old = state.zoom, z = zc; state.ox = SW / 2 - (SW / 2 - state.ox) * (z / old); state.oy = SH / 2 - (SH / 2 - state.oy) * (z / old); state.zoom = z; }
 const W = SW * state.zoom, H = SW * ratio() * state.zoom;
 if (!state.rot && !stage.classList.contains('mfull')) {
 state.ox = Math.min(0, Math.max(SW - W, state.ox));
 state.oy = Math.min(0, Math.max(Math.min(0, SH - H), state.oy));
 return;
 }
 const c = corners();
 const x0 = Math.min(...c.map(p => p.x)), x1 = Math.max(...c.map(p => p.x)), y0 = Math.min(...c.map(p => p.y)), y1 = Math.max(...c.map(p => p.y));
 state.ox = Math.min(x0, Math.max(x1 - W, state.ox));
 state.oy = Math.min(y0, Math.max(y1 - H, state.oy));
 };
 /* v6.90 - SHARP AT EVERY ZOOM. The master plan is also held as 512 px tiles cut from the vector PDF at three sizes;
    when the map comes to rest the tiles for what is on the screen are fetched at the size the screen needs and laid
    over the base picture. They are drawn as backgrounds so the picture-loading notices never touch them. */
 const TL = inner.querySelector('.mtiles'), TI = sh.master ? MAP_TILES : null, tiles = new Map();
 let tileGen = 0;
 const tilesNow = () => {
 if (!TL || !TI || !SW) return;
 const dpr = Math.min(3, window.devicePixelRatio || 1), need = SW * state.zoom * dpr;
 const base = (im && im.naturalWidth) || 2600;
 let li = -1;
 if (need > base * 1.08) { li = TI.levels.findIndex(l => l.w >= need * 0.92); if (li < 0) li = TI.levels.length - 1; }
 const gen = ++tileGen;
 if (li < 0) { tiles.forEach(t => t.el.remove()); tiles.clear(); return; }
 const L = TI.levels[li], T = TI.tile, W = SW * state.zoom, H = SW * ratio() * state.zoom, c = corners();
 const fx0 = Math.max(0, (Math.min(...c.map(p => p.x)) - state.ox) / W), fx1 = Math.min(1, (Math.max(...c.map(p => p.x)) - state.ox) / W);
 const fy0 = Math.max(0, (Math.min(...c.map(p => p.y)) - state.oy) / H), fy1 = Math.min(1, (Math.max(...c.map(p => p.y)) - state.oy) / H);
 const cols = L.rows[0].length, rows = L.rows.length;
 const c0 = Math.max(0, Math.floor(fx0 * L.w / T)), c1 = Math.min(cols - 1, Math.floor(fx1 * L.w / T));
 const r0 = Math.max(0, Math.floor(fy0 * L.h / T)), r1 = Math.min(rows - 1, Math.floor(fy1 * L.h / T));
 const want = new Set(); let pending = 0;
 const done = () => { if (gen !== tileGen || pending) return;
 tiles.forEach((t, k) => { if (!want.has(k)) { t.el.remove(); tiles.delete(k); } }); };
 for (let r = r0; r <= r1; r++) for (let cc = c0; cc <= c1; cc++) {
 const k = li + ':' + r + ':' + cc; want.add(k);
 if (tiles.has(k)) continue;
 const url = DATA.media[L.rows[r][cc]]; if (typeof url !== 'string') continue;
 const tw = Math.min(T, L.w - cc * T), th = Math.min(T, L.h - r * T);
 const el = document.createElement('i'); el.className = 'mtile';
 el.style.cssText = `left:${cc * T / L.w * 100}%;top:${r * T / L.h * 100}%;width:${(tw + 0.75) / L.w * 100}%;height:${(th + 0.75) / L.h * 100}%;z-index:${li + 1}`;
 tiles.set(k, {el}); TL.appendChild(el); pending++;
 const pic = new Image(); pic.decoding = 'async';
 const fin = ok => { if (ok) { el.style.backgroundImage = `url("${url}")`; el.classList.add('on'); } pending--; done(); };
 pic.onload = () => (pic.decode ? pic.decode().catch(() => {}) : Promise.resolve()).then(() => fin(true));
 pic.onerror = () => fin(false);
 pic.src = url;
 }
 done();
 };
 /* the map at rest: the pills stop riding their own layers, the sheet is drawn sharp and the tiles are brought in */
 let idleT = 0;
 const settle = () => { stage.classList.remove('zooming'); if (OV && OV.style.transform) { placed = null; place(); } tilesNow(); };
 const busy = () => { stage.classList.add('zooming'); clearTimeout(idleT); idleT = setTimeout(settle, 180); };
 /* v6.90 - TURNING IS AN EASED MOVE, not a jump: a letter on the compass, a press of a turn key or a flick of the
    wheel sets where the map should face, and it glides there about the middle of the stage */
 let rAnim = 0, rFrom = 0, rTo = 0, rT0 = 0;
 const norm = d => Math.round((((d % 360) + 540) % 360 - 180) * 10) / 10;
 const turnStep = t => {
 const k = Math.min(1, (t - rT0) / 420), e = 1 - Math.pow(1 - k, 3);
 state.rot = norm(rFrom + (rTo - rFrom) * e); clamp(); apply(); busy();
 rAnim = k < 1 && stage.isConnected ? requestAnimationFrame(turnStep) : 0;
 };
 const turnTo = deg => {
 const d = ((deg - state.rot) % 360 + 540) % 360 - 180;
 if (motionOff() || Math.abs(d) < 0.5) { state.rot = norm(state.rot + d); clamp(); apply(); busy(); return; }
 rFrom = state.rot; rTo = state.rot + d; rT0 = performance.now();
 if (!rAnim) rAnim = requestAnimationFrame(turnStep);
 };
 const stopTurn = () => { if (rAnim) cancelAnimationFrame(rAnim); rAnim = 0; };
 const face = b => { if (north != null) turnTo(-(north + b)); };
 if (cmp) {
 cmp.querySelectorAll('[data-face]').forEach(b => b.onclick = ev => { ev.stopPropagation(); face(+b.dataset.face); });
 const pr = cmp.querySelector('[data-printed]'); if (pr) pr.onclick = ev => { ev.stopPropagation(); turnTo(0); };
 /* drag the ring to turn the map freely */
 let cd = null;
 cmpR.addEventListener('pointerdown', e => { if (e.target.closest('[data-face]')) return; e.preventDefault(); e.stopPropagation(); stopTurn();
 const r = cmp.getBoundingClientRect(); cd = {cx: r.left + r.width / 2, cy: r.top + r.height / 2, rot: state.rot};
 cd.a0 = Math.atan2(e.clientY - cd.cy, e.clientX - cd.cx) * 180 / Math.PI; try { cmpR.setPointerCapture(e.pointerId); } catch (err) {} });
 cmpR.addEventListener('pointermove', e => { if (!cd) return; const a = Math.atan2(e.clientY - cd.cy, e.clientX - cd.cx) * 180 / Math.PI;
 state.rot = norm(cd.rot + a - cd.a0); clamp(); applySoon(); busy(); });
 const cup = () => { cd = null; }; cmpR.addEventListener('pointerup', cup); cmpR.addEventListener('pointercancel', cup);
 }
 stage.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
 const k = b.dataset.r;
 if (k === 'l') turnTo(state.rot - 45);
 else if (k === 'r') turnTo(state.rot + 45);
 else if (k === 'n') face(0);
 });
 /* v6.71 - SMOOTH ZOOM, eased about the point under the cursor or finger, one step a frame */
 let zAnim = 0, zTarget = state.zoom, zAnchor = {x: 0, y: 0}, zLast = 0;
 const zoomStep = t => {
 const dt = zLast ? Math.min(0.05, (t - zLast) / 1000) : 1 / 60; zLast = t;
 const old = state.zoom; let z = old + (zTarget - old) * (1 - Math.exp(-dt * 15));
 if (Math.abs(zTarget - z) < 0.0015 * zTarget) z = zTarget;
 state.zoom = z; state.ox = zAnchor.x - (zAnchor.x - state.ox) * (z / old); state.oy = zAnchor.y - (zAnchor.y - state.oy) * (z / old);
 clamp(); apply(); busy();
 if (z !== zTarget && stage.isConnected) zAnim = requestAnimationFrame(zoomStep); else { zAnim = 0; zLast = 0; zTarget = state.zoom; }
 };
 const zoomTo = (z, ax, ay) => {
 zTarget = Math.min(ZMAX, Math.max(coverZ(), z)); zAnchor = {x: ax, y: ay};
 if (motionOff()) { if (zAnim) cancelAnimationFrame(zAnim); zAnim = 0; const old = state.zoom; state.zoom = zTarget;
 state.ox = ax - (ax - state.ox) * (zTarget / old); state.oy = ay - (ay - state.oy) * (zTarget / old); clamp(); apply(); busy(); return; }
 if (!zAnim) { zLast = 0; zAnim = requestAnimationFrame(zoomStep); }
 };
 const zoomNow = () => zAnim ? zTarget : state.zoom;
 const stopZoom = () => { if (zAnim) cancelAnimationFrame(zAnim); zAnim = 0; zLast = 0; zTarget = state.zoom; };
 /* full screen: the stage takes the whole window (the drawer still opens over it); Esc or the button brings it back */
 const fullBtn = stage.querySelector('[data-mfull]');
 const setFull = on => {
 const fx = (SW / 2 - state.ox) / (SW * state.zoom), fy = (SH / 2 - state.oy) / (SW * ratio() * state.zoom), z = state.zoom;
 stage.classList.toggle('mfull', on); document.documentElement.classList.toggle('mapfull', on);
 if (fullBtn) { fullBtn.setAttribute('aria-pressed', on); fullBtn.title = on ? 'Leave full screen (Esc)' : 'Full screen'; }
 SW = stage.clientWidth || SW; SH = stage.clientHeight || SH;
 state.zoom = z; state.ox = SW / 2 - fx * SW * z; state.oy = SH / 2 - fy * SW * ratio() * z;
 lastR = null; clamp(); apply(); busy();
 };
 if (fullBtn) fullBtn.onclick = () => setFull(!stage.classList.contains('mfull'));
 const onKey = e => { if (!stage.isConnected) { document.removeEventListener('keydown', onKey); return; }
 if (e.key === 'Escape' && stage.classList.contains('mfull') && !document.querySelector('.drawer.on')) { e.preventDefault(); setFull(false); } };
 document.addEventListener('keydown', onKey);
 stage.querySelectorAll('[data-z]').forEach(b => b.onclick = () => {
 const k = b.dataset.z;
 if (k === 'reset') { stopZoom(); stopTurn(); state.rot = 0; state.zoom = 1; zTarget = 1; state.ox = 0; state.oy = 0; clamp(); apply(); busy(); return; }
 zoomTo(zoomNow() * (k === 'in' ? 1.6 : 1 / 1.6), SW / 2, SH / 2);
 });
 stage.addEventListener('wheel', e => {
 e.preventDefault();
 if (e.shiftKey) { stopTurn(); turnTo(state.rot + ((e.deltaY || e.deltaX) < 0 ? -10 : 10)); return; }
 const r = box();
 const { x: cx, y: cy } = unturn(e.clientX - r.left, e.clientY - r.top);
 const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
 zoomTo(zoomNow() * Math.exp(-Math.max(-240, Math.min(240, dy)) * (e.ctrlKey ? 0.006 : 0.0018)), cx, cy);
 }, {passive: false});
 const dblAt = (clientX, clientY) => { const r = box(); const p = unturn(clientX - r.left, clientY - r.top);
 const z = zoomNow(); zoomTo(z >= ZMAX * 0.94 ? 1 : z * 2, p.x, p.y); };
 stage.addEventListener('dblclick', e => { if (e.target.closest('.mk, .zoomctl, .rotctl, .mcompass, button, a')) return; e.preventDefault(); dblAt(e.clientX, e.clientY); });
 let tap = null, lastTap = null, drag = null, dragBox = null, lastTiles = 0;
 const pts = new Map();
 const skip = e => e.target.closest('.mk') || e.target.closest('.zoomctl') || e.target.closest('.rotctl') || e.target.closest('.mcompass');
 stage.addEventListener('pointerdown', e => {
 if (skip(e)) return;
 if (pts.size >= 2) { pts.clear(); drag = null; }
 pts.set(e.pointerId, e); try { stage.setPointerCapture(e.pointerId); } catch (err) {}
 dragBox = box();
 if (pts.size === 1) { drag = {x: e.clientX, y: e.clientY, ox: state.ox, oy: state.oy}; stopZoom(); stopTurn();
 tap = e.pointerType === 'touch' ? {x: e.clientX, y: e.clientY, t: performance.now()} : null; } else tap = null;
 });
 stage.addEventListener('pointermove', e => {
 if (!pts.has(e.pointerId)) return;
 pts.set(e.pointerId, e);
 if (pts.size === 2) {
 const [a, b] = [...pts.values()];
 const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
 const ang = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180 / Math.PI;
 if (drag && drag.d) {
 const r = dragBox || box(), old = state.zoom;
 let dAng = ang - drag.ang; dAng = ((dAng + 540) % 360) - 180;
 if (Math.abs(dAng) > 0.4) state.rot = norm(state.rot + dAng);
 state.zoom = Math.min(ZMAX, Math.max(1, state.zoom * (d / drag.d)));
 const { x: cx, y: cy } = unturn((a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top);
 state.ox = cx - (cx - state.ox) * (state.zoom / old);
 state.oy = cy - (cy - state.oy) * (state.zoom / old);
 clamp(); applySoon(); busy(); zTarget = state.zoom;
 }
 drag = {d, ang};
 } else if (drag && drag.x != null) {
 const m = unturnD(e.clientX - drag.x, e.clientY - drag.y);
 state.ox = drag.ox + m.x; state.oy = drag.oy + m.y;
 if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap = null;
 clamp(); applySoon(); busy();
 const now = performance.now(); if (now - lastTiles > 220) { lastTiles = now; requestAnimationFrame(tilesNow); }
 }
 });
 const up = e => { pts.delete(e.pointerId); if (pts.size < 2) drag = null; try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
 if (e.type === 'pointerup' && tap && !pts.size && performance.now() - tap.t < 260) {
 const now = performance.now();
 if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 34) { lastTap = null; dblAt(e.clientX, e.clientY); }
 else lastTap = {x: e.clientX, y: e.clientY, t: now};
 }
 tap = null; };
 const cancel = () => { pts.clear(); drag = null; };
 stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', cancel); stage.addEventListener('lostpointercapture', up);
 window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') cancel(); });
 /* the stage's size, kept without asking the browser for it inside a frame */
 if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (!stage.isConnected) { ro.disconnect(); return; }
 const w = stage.clientWidth, h = stage.clientHeight; if (w && (w !== SW || h !== SH)) { SW = w; SH = h; clamp(); apply(); busy(); } }); ro.observe(stage); }
 if (im && !im.complete) im.addEventListener('load', () => { SW = stage.clientWidth || SW; SH = stage.clientHeight || SH; clamp(); apply(); tilesNow(); }, {once: true});
 /* the view other code can move: the search's "take me there" and Show on map */
 MAPCTL = {sheet: sh.key, clamp, apply, settle, size: () => { SW = stage.clientWidth || SW; SH = stage.clientHeight || SH; return {w: SW, h: SH, ratio: ratio()}; }};
 lastR = null; clamp(); apply(); compass(); settle();
}
