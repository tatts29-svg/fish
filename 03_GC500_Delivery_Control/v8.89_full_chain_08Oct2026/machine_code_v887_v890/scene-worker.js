'use strict';
/* The drawing lives here, off the page's main thread. The worker unpacks the preserved scene, answers spatial
   queries and builds the SVG for a view (the original viewer's renderer, order and dependencies kept) so the page
   never stalls while it is being dragged or zoomed. Messages: {t:'load', url} -> {t:'ready', meta, labels, count};
   {t:'svg', id, view, width, height, mode, all} -> {t:'svg', id, svg, count}. */
let P = null, seen = null, stamp = 0, UNDERLAY = new Set();
const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[c]));
function query(v, skip, padding = 4 / v.scale) {
  const x0 = v.x - padding, y0 = v.y - padding, x1 = v.x + v.w + padding, y1 = v.y + v.h + padding, out = []; stamp++; if (stamp >= 4294967290) { seen.fill(0); stamp = 1; }
  function add(i) { if (seen[i] === stamp) return; seen[i] = stamp; if (skip && UNDERLAY.has(i)) return; const r = P.r[i]; if (r[0] <= x1 && r[2] >= x0 && r[1] <= y1 && r[3] >= y0) out.push(i); }
  P.broad.forEach(add);
  const a = clamp(Math.floor(x0 / P.cell), 0, P.nx - 1), b = clamp(Math.floor(y0 / P.cell), 0, P.ny - 1), c = clamp(Math.floor(x1 / P.cell), 0, P.nx - 1), d = clamp(Math.floor(y1 / P.cell), 0, P.ny - 1);
  if (x1 >= 0 && y1 >= 0 && x0 <= P.w && y0 <= P.h) for (let iy = b; iy <= d; iy++) for (let ix = a; ix <= c; ix++) P.grid[iy * P.nx + ix].forEach(add);
  out.sort((p, q) => p - q); return out;
}
function makeSVG(v, width, height, mode, all) {
  const skip = mode !== 'original';
  const ids = all ? P.r.map((_, i) => i).filter(i => !skip || !UNDERLAY.has(i)) : query(v, skip);
  const needed = new Set(), parts = []; let group = -1, pendingStyle = -2, pending = [];
  function need(id) { if (needed.has(id)) return; const d = P.d[id]; if (!d) return; needed.add(id); d[1].forEach(need); }
  function flush() { if (!pending.length) return; const style = P.s[pendingStyle]; parts.push('<path ' + style[0] + ' d="' + pending.join('') + '"/>'); pending = []; pendingStyle = -2; }
  for (const id of ids) { const rec = P.r[id], cg = rec[4], st = rec[5], d = rec[6];
    if (cg !== group) { flush(); if (group !== -1) parts.push(P.c[group][1]); group = cg; P.c[cg][2].forEach(need); parts.push(P.c[cg][0]); }
    if (st === -1) { flush(); parts.push(d); continue; }
    const style = P.s[st]; style[2].forEach(need);
    if (style[1]) { if (pendingStyle !== st || pending.length > 1500) { flush(); pendingStyle = st; } pending.push(d); } else { flush(); parts.push('<path ' + style[0] + ' d="' + d + '"/>'); } }
  flush(); if (group !== -1) parts.push(P.c[group][1]);
  const defs = Array.from(needed, id => P.d[id][0]).join('');
  const title = esc(P.meta.title + ' | ' + P.meta.drawing + ' | revision ' + P.meta.revision);
  return {count: ids.length, svg: '<svg xmlns="' + NS + '" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + width + '" height="' + height + '" viewBox="' + [v.x, v.y, v.w, v.h].join(' ') + '" preserveAspectRatio="none"><title>' + title + '</title><defs>' + defs + '</defs>' + (mode === 'original' ? '<rect width="2384" height="1684" fill="white"/>' : '') + parts.join('') + '</svg>'};
}
/* v6.97 - Original plan's aerial patches, off the page's thread: fetched, decoded and laid in record order onto one
   picture per size (full, half, a quarter of the big aerial's own pixels); patches outside it come back on their own.
   {t:'underlay', id, items:[{file,bbox,px}], base, sizes} -> {t:'underlay', id, bbox, w, members, comp:{2,4}, tiles1:{pw,ph,tiles:[{x,y,w,h,bm}]}, loose:{file: bitmap}}
   (the full size comes back in 1024 px tiles, so a close view sends only what it shows to the graphics chip) */
async function underlay(m) {
  const t0 = performance.now(), blobs = await Promise.all(m.items.map(u => fetch((m.prefix || '') + u.file).then(r => r.ok ? r.blob() : null).catch(() => null))), t1 = performance.now();
  const bms = await Promise.all(blobs.map(b => b ? createImageBitmap(b).catch(() => null) : null)), t2 = performance.now();
  const base = m.items[m.base], bb = base.bbox, inside = u => u.bbox[0] >= bb[0] - .5 && u.bbox[1] >= bb[1] - .5 && u.bbox[2] <= bb[2] + .5 && u.bbox[3] <= bb[3] + .5;
  const comp = {}, members = [], loose = {}, transfer = []; let tiles1 = null;
  m.items.forEach((u, i) => { if (inside(u)) members.push(u.file); else if (bms[i]) { loose[u.file] = bms[i]; transfer.push(bms[i]); } });
  /* full size first, patch by patch in record order (at 1:1, a plain copy); then each smaller size by halving the one
     before (one draw each), in software so it never queues behind the page's own frames on the graphics chip */
  let prev = null;
  for (const f of [...m.sizes].sort((a, b) => a - b)) { const c = new OffscreenCanvas(Math.round(base.px[0] / f), Math.round(base.px[1] / f)), g = c.getContext('2d', {willReadFrequently: true}), sx = c.width / (bb[2] - bb[0]), sy = c.height / (bb[3] - bb[1]);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (prev) g.drawImage(prev, 0, 0, c.width, c.height);
    else m.items.forEach((u, i) => { if (bms[i] && inside(u)) g.drawImage(bms[i], (u.bbox[0] - bb[0]) * sx, (u.bbox[1] - bb[1]) * sy, (u.bbox[2] - u.bbox[0]) * sx, (u.bbox[3] - u.bbox[1]) * sy); });
    prev = c;
    if (f === 1) { const T = 1024, tiles = []; for (let y = 0; y < c.height; y += T) for (let x = 0; x < c.width; x += T) { const bm = await createImageBitmap(c, x, y, Math.min(T, c.width - x), Math.min(T, c.height - y)); tiles.push({x, y, w: bm.width, h: bm.height, bm}); transfer.push(bm); }
      tiles1 = {pw: c.width, ph: c.height, tiles}; continue; }
    comp[f] = await createImageBitmap(c); transfer.push(comp[f]); }
  m.items.forEach((u, i) => { if (bms[i] && inside(u)) bms[i].close(); }); const ms = {fetch: Math.round(t1 - t0), decode: Math.round(t2 - t1), composite: Math.round(performance.now() - t2)};
  return {msg: {t: 'underlay', id: m.id, bbox: bb, w: base.px[0], members, comp, tiles1, loose, ms, failed: m.items.filter((u, i) => !bms[i]).map(u => u.file)}, transfer};
}
self.onmessage = async e => {
  const m = e.data;
  try {
    if (m.t === 'underlay') { const {msg, transfer} = await underlay(m); self.postMessage(msg, transfer); return; }
    if (m.t === 'load') {
      const t0 = performance.now(); const r = await fetch(m.url); if (!r.ok) throw new Error('scene ' + r.status);
      P = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json(); seen = new Uint32Array(P.r.length);
      (m.underlay || []).forEach(i => UNDERLAY.add(i));
      self.postMessage({t: 'ready', meta: P.meta, labels: P.labels, count: P.r.length, ms: Math.round(performance.now() - t0)});
    } else if (m.t === 'svg') {
      const t0 = performance.now(); const {svg, count} = makeSVG(m.view, m.width, m.height, m.mode, m.all);
      self.postMessage({t: 'svg', id: m.id, svg, count, ms: Math.round(performance.now() - t0)});
    } else if (m.t === 'underlay') { UNDERLAY = new Set(m.ids); }
  } catch (err) { self.postMessage({t: 'error', id: m.id, message: String(err && err.message || err)}); }
};
