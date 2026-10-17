// Author: Andrew Fisher. Shared steps for the v8.87 Map explorer checks: open the dashboard build read-only, show the Map tab,
// wait for the explorer, and find things on the screen. LOCAL=<folder> serves the explorer files from disk (xembed.js); every
// write the page tries is still aborted.
const {open} = require('./xembed');
const MOB = !!process.env.MOB;
async function openMap(opts = {}) {
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('map')); const fh = await p.waitForSelector('#pane-map iframe', {timeout: 30000}); const f = await fh.contentFrame();
  await f.waitForFunction(() => window.GC500Explorer && GC500Explorer.state && GC500Explorer.state.ready && window.__ready, null, {timeout: 120000});
  await p.waitForTimeout(opts.settle || 3000);
  return Object.assign(s, {f, fh, MOB});
}
/* the explorer frame's place in the page, and the stage's centre, so mouse events can be aimed */
async function stageBox(s) {
  const fb = await s.fh.boundingBox();
  const b = await s.f.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; });
  return {fx: fb.x, fy: fb.y, x: fb.x + b.x, y: fb.y + b.y, w: b.w, h: b.h, cx: fb.x + b.x + b.w / 2, cy: fb.y + b.y + b.h / 2};
}
/* the screen position (page coordinates) of a unit's ring, through the explorer's own camera */
async function unitScreen(s, code) {
  const fb = await s.fh.boundingBox();
  const q = await s.f.evaluate(code => { const it = ITEMS.find(x => x.code === norm(code)); if (!it || !it.places.length) return null; const bb = it.places[0], v = currentView(), M = sheetToDevice(v.scale, sw, sh), g0 = toGeo((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), c = applyM(M, g0.x, g0.y); const r = document.getElementById('stage').getBoundingClientRect(); return {x: c.x + r.left, y: c.y + r.top, inside: c.x > 0 && c.y > 0 && c.x < sw && c.y < sh}; }, code);
  return q && {x: fb.x + q.x, y: fb.y + q.y, inside: q.inside};
}
/* a unit the dashboard has progress for: P45 if it qualifies, else the first placed unit with a recorded delivery */
async function pickUnit(s, want) {
  return s.page.evaluate(want => { const placed = a => typeof MASTER_LOC !== 'undefined' && MASTER_LOC[a.key] && MASTER_LOC[a.key].pt;
    const rows = allAssets().filter(a => !a._cancelled && placed(a)).map(a => { const v = timeline841State(a), d = deliveryOf(a.key); return {key: a.key, label: v.label, stage: v.stage, why: v.why, recorded: !!d.recorded, hire: !!(d.recorded && d.where === 'rental' && !d.done), done: !!d.done}; });
    const by = k => rows.find(r => r.key === k);
    if (want === 'hire') return rows.find(r => r.hire) || null;
    if (want === 'done') return rows.find(r => r.done) || null;
    return (by('P45') && by('P45').recorded ? by('P45') : null) || rows.find(r => r.recorded && r.stage >= 2 && !r.hire) || rows.find(r => r.recorded) || rows[0] || null; }, want || '');
}
/* a point on the map (page coordinates) that is on no fence line and on no unit ring: tried from the stage centre outwards */
async function emptySpot(s) {
  const box = await stageBox(s); const fb = await s.fh.boundingBox();
  for (const [dx, dy] of [[0, 0], [60, 40], [-70, 50], [90, -60], [-110, -70], [130, 90], [-150, 100], [40, -120], [-40, 130], [170, 0], [-170, 0], [0, 150], [0, -150]]) {
    const x = box.cx + dx, y = box.cy + dy;
    const clear = await s.f.evaluate(([x, y]) => { const r = document.getElementById('stage').getBoundingClientRect(), sx = x - r.left, sy = y - r.top;
      const F = window.GC500FencingMap; if (F && F.active && typeof F.hits === 'function') { const h = F.hits(); const near = h.list.some(hit => hit.points.some(pt => Math.hypot(pt[0] / h.ratio - sx, pt[1] / h.ratio - sy) < 40)); if (near) return false; }
      const el = document.elementFromPoint(x, y); if (el && el.closest && el.closest('button,input,.mini,.console,.legend,#xcard,#fmCard887,#x887FenceBar,.hud,.rose,.qual,.attrib,#fenceMapBadge,.satban')) return false;
      if (typeof itemAt887 === 'function' && itemAt887(sx, sy)) return false; if (typeof markAt === 'function' && markAt(sx, sy)) return false; return true; }, [x - fb.x, y - fb.y]);
    if (clear) return {x, y};
  }
  return {x: box.cx, y: box.cy};
}
async function cameraOf(s) { return s.f.evaluate(() => ({cx: +camera.cx.toFixed(2), cy: +camera.cy.toFixed(2), z: +camera.z.toFixed(4), rot: +camera.rot.toFixed(2), pointers: pointers.size, gesture: !!gestureStart, pinch: !!pinch})); }
async function drag(p, from, to, steps = 12) { await p.mouse.move(from.x, from.y); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(from.x + (to.x - from.x) * i / steps, from.y + (to.y - from.y) * i / steps); await p.waitForTimeout(16); } await p.mouse.up(); }
/* a fence line's screen point (page coordinates) from the layer's own hit list, nearest the stage centre */
async function fenceHit(s) {
  const fb = await s.fh.boundingBox();
  const q = await s.f.evaluate(() => { const F = window.GC500FencingMap; if (!F || typeof F.hits !== 'function') return null; const h = F.hits(); if (!h.list.length) return null;
    const r = document.getElementById('stage').getBoundingClientRect(), cx = r.width / 2, cy = r.height / 2; let best = null;
    for (const hit of h.list) { if (hit.kind === 'anchor' || hit.kind === 'stockpile' || hit.points.length < 2) continue; for (let i = 1; i < hit.points.length; i++) { const a = hit.points[i - 1], b = hit.points[i], mx = (a[0] + b[0]) / 2 / h.ratio, my = (a[1] + b[1]) / 2 / h.ratio; if (mx < 30 || my < 80 || mx > r.width - 30 || my > r.height - 80) continue; const d = Math.hypot(mx - cx, my - cy); if (!best || d < best.d) best = {d, x: mx + r.left, y: my + r.top, id: hit.id}; } }
    return best; });
  return q && {x: fb.x + q.x, y: fb.y + q.y, id: q.id};
}
/* a legacy build (live v8.64 explorer) has no hits(): read the overlay's pixels for a drawn fence line instead */
async function fenceHitByPixels(s) {
  const fb = await s.fh.boundingBox();
  const q = await s.f.evaluate(() => { const o = document.getElementById('fenceOverlay'); if (!o || !o.width) return null; const g = o.getContext('2d'), r = o.getBoundingClientRect(), k = o.width / r.width; const d = g.getImageData(0, 0, o.width, o.height).data; let best = null; const cx = o.width / 2, cy = o.height / 2;
    for (let y = 90 * k; y < o.height - 90 * k; y += 3) for (let x = 40 * k; x < o.width - 40 * k; x += 3) { const i = (y * o.width + x) * 4; if (d[i + 3] > 200) { const dd = Math.hypot(x - cx, y - cy); if (!best || dd < best.d) best = {d: dd, x: x / k + r.left, y: y / k + r.top}; } }
    return best; });
  return q && {x: fb.x + q.x, y: fb.y + q.y};
}
async function focusHost(p) { await p.evaluate(() => { let b = document.getElementById('t887focus'); if (!b) { b = document.createElement('button'); b.id = 't887focus'; b.type = 'button'; b.textContent = 'focus'; b.style.cssText = 'position:fixed;left:-80px;top:0;width:1px;height:1px;opacity:0'; document.body.appendChild(b); } b.focus(); return document.activeElement === b; }); }
module.exports = {openMap, stageBox, unitScreen, pickUnit, emptySpot, cameraOf, drag, fenceHit, fenceHitByPixels, focusHost, MOB};
