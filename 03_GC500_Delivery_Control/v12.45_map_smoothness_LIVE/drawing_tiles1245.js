 /* v12.45: a loading tile is not a ready replacement. Keep the last sharp layer
    until every tile wanted by the current view has decoded successfully. */
 let tileWant1245 = new Set(), tileKeep1245 = new Set(tiles.keys());
 const pruneTiles1245 = () => {
 tiles.forEach((t, k) => { if (!tileWant1245.has(k) && !tileKeep1245.has(k)) { t.el.remove(); tiles.delete(k); } });
 };
 const finishTiles1245 = () => {
 for (const k of tileWant1245) { const t = tiles.get(k); if (!t || !t.ready1245) return; }
 tileKeep1245 = new Set(tileWant1245); pruneTiles1245();
 };
 const tilesNow = () => {
 if (!TL || !TI || !SW) return;
 const dpr = Math.min(3, window.devicePixelRatio || 1), need = SW * state.zoom * dpr;
 const base = (im && im.naturalWidth) || 2600;
 let li = -1;
 if (need > base * 1.08) { li = TI.levels.findIndex(l => l.w >= need * 0.92); if (li < 0) li = TI.levels.length - 1; }
 if (li < 0) { tileWant1245 = new Set(); finishTiles1245(); return; }
 const L = TI.levels[li], T = TI.tile, W = SW * state.zoom, H = SW * ratio() * state.zoom, c = corners();
 const fx0 = Math.max(0, (Math.min(...c.map(p => p.x)) - state.ox) / W), fx1 = Math.min(1, (Math.max(...c.map(p => p.x)) - state.ox) / W);
 const fy0 = Math.max(0, (Math.min(...c.map(p => p.y)) - state.oy) / H), fy1 = Math.min(1, (Math.max(...c.map(p => p.y)) - state.oy) / H);
 const cols = L.rows[0].length, rows = L.rows.length;
 const c0 = Math.max(0, Math.floor(fx0 * L.w / T)), c1 = Math.min(cols - 1, Math.floor(fx1 * L.w / T));
 const r0 = Math.max(0, Math.floor(fy0 * L.h / T)), r1 = Math.min(rows - 1, Math.floor(fy1 * L.h / T));
 const want = new Set(); tileWant1245 = want;
 for (let r = r0; r <= r1; r++) for (let cc = c0; cc <= c1; cc++) {
 const k = li + ':' + r + ':' + cc; want.add(k);
 if (tiles.has(k)) continue;
 const url = DATA.media[L.rows[r][cc]]; if (typeof url !== 'string') continue;
 const tw = Math.min(T, L.w - cc * T), th = Math.min(T, L.h - r * T);
 const el = document.createElement('i'); el.className = 'mtile';
 el.style.cssText = `left:${cc * T / L.w * 100}%;top:${r * T / L.h * 100}%;width:${(tw + 0.75) / L.w * 100}%;height:${(th + 0.75) / L.h * 100}%;z-index:${li + 1}`;
 const entry1245 = {el, ready1245: false}; tiles.set(k, entry1245); TL.appendChild(el);
 const pic = new Image(); pic.decoding = 'async';
 const fin = ok => {
 if (tiles.get(k) !== entry1245) return; /* an obsolete load must not change the current tile */
 if (ok) { el.style.backgroundImage = `url("${url}")`; el.classList.add('on'); entry1245.ready1245 = true; }
 else { el.remove(); tiles.delete(k); } /* retry next time, retaining the last good layer */
 pruneTiles1245(); finishTiles1245();
 };
 pic.onload = () => (pic.decode ? pic.decode().catch(() => {}) : Promise.resolve()).then(() => fin(true));
 pic.onerror = () => fin(false);
 pic.src = url;
 }
 pruneTiles1245(); finishTiles1245();
 };
