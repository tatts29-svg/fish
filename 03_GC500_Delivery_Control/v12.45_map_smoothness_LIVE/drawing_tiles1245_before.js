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
