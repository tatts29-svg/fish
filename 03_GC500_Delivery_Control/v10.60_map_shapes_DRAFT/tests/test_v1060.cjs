/* Author: Andrew Fisher. v10.60 checks: Map explorer references drawn as their own shape, with the door and the tick
   inside. GET only (every write is aborted); the record is compared before and after.
     PAGE=build/GC500_v10.60/GC500_Delivery_Control_hosted.html node tests/test_v1060.cjs        (desktop)
     MOB=1 PAGE=... node tests/test_v1060.cjs                                                      (phone)
     LIVE=1 node tests/test_v1060.cjs                                                              (the live page) */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', mobile = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence', (live ? 'live-' : '') + (mobile ? 'phone' : 'desktop'));
fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 600))); };
const KEEP = ['P26', 'P28', 'P34', 'PG01', 'PG03', 'PG05', 'PG29', 'T0258', 'T0266', 'WB13', 'WB14', 'WB16', 'WB04', 'WB07', 'WB15', 'WB17', 'WB18'];
const SHAPE = ['P37', 'P36', 'WC21', 'WC07', 'WC69', 'WC15', 'P10', 'AA'];
(async () => {
 const h = await open({pageFile, hash: '#sheet/__explorer', mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1});
 const p = h.page; let frame;
 const shot = async name => { await p.locator('#expFrame').scrollIntoViewIfNeeded(); await p.screenshot({path: path.join(out, (mobile ? 'phone-' : 'desktop-') + name + '.png')}); };
 const settle = async () => { await frame.waitForFunction(() => gotoAnim887 === 0 && zAnim === 0, null, {timeout: 15000}).catch(() => {}); await p.waitForTimeout(400); await frame.evaluate(() => drawMarks(currentView())); };
 const look = async (key, z, mode) => { await frame.evaluate(([k, z, mode]) => { const it = ITEMS.find(x => x.code === k), b = it.places[0]; if (mode) setMode(mode); camera = {...camera, cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, z}; changeView(false); requestPaint(); }, [key, z, mode || '']); await settle(); };
 const closeCard = () => frame.evaluate(() => { const c = document.getElementById('xcard'); if (c && !c.hidden) c.querySelector('[data-xclose]')?.click(); try { panel813(false); } catch (e) {} });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says v10.60', await p.evaluate(() => document.body.innerText.includes('v10.60')));
  await p.waitForFunction(() => typeof EXP !== 'undefined' && EXP.frame && EXP.frame.contentWindow && EXP.frame.contentWindow.__ready, null, {timeout: 180000});
  frame = p.frames().find(f => /\/explorer\/index\.html(?:\?|$)/.test(f.url()));
  await frame.evaluate(() => GC500Explorer.ready);
  await frame.waitForFunction(() => !!window.GC500Shape1060, null, {timeout: 20000}).catch(() => {});

  /* the page side */
  const pg = await p.evaluate(() => { const s = gc500MapShapes1060(); const r = k => s.refs[k];
   return {available: s.available, counts: s.counts, sameObject: gc500MapShapes1060() === s, p37: r('P37') && {comps: r('P37').comps.length, doors: r('P37').comps.reduce((n, c) => n + c.doors.length, 0)},
    wc21: r('WC21') && {comps: r('WC21').comps.length, chev: r('WC21').comps.filter(c => c.chev.length).length}, shared: Object.values(s.refs).filter(x => x.shared).map(x => x.ref).sort(),
    layer: !!window.gc500ShapeLayer1060 && gc500ShapeLayer1060.version, guard: gc500ShapeLayer1060.frameScript().includes('drawMarks') && ['explorer.js?v=8586cb7d5008', 'explorer-merge.js?v=97a4087210f3', 'fencing-map-explorer.js?v=e3a4bef6c17d', 'explorer-fix887.js?v=6996471a6a0f'].every(v => document.getElementById('shapes1060-script').textContent.includes(v)),
    barriers: ['WB04', 'WB07', 'WB15', 'WB17', 'WB18'].filter(k => s.refs[k])}; });
  check('page: shape data available from the 2 Oct master', pg.available && pg.counts.refs >= 150 && pg.counts.doors >= 100 && pg.counts.chevrons >= 200, pg.counts);
  check('page: shape data read once and kept', pg.sameObject);
  check('page: P37 has its door swing', pg.p37 && pg.p37.doors >= 1, pg.p37);
  check('page: WC21 is six FWFs, each with its chevron', pg.wc21 && pg.wc21.comps === 6 && pg.wc21.chev === 6, pg.wc21);
  check('page: shared outlines flagged (police block, PG, barrier runs)', ['P26', 'P28', 'P34', 'PG01', 'PG03', 'PG05', 'PG29'].every(k => pg.shared.includes(k)), pg.shared);
  check('page: layer loaded, pinned to the reviewed explorer build (all six scripts)', pg.layer === 'v10.60' && pg.guard);
  check('page: barrier runs (lines) are not turned into shapes', pg.barriers.length === 0, pg.barriers);

  /* the frame side */
  const fr = await frame.evaluate(() => { const L = document.getElementById('shape1060'), M = document.getElementById('marks');
   return {state: GC500Shape1060.state, layer: !!L, under: !!L && L.nextElementSibling && L.nextElementSibling.id === 'shape1060beat' && L.nextElementSibling.nextElementSibling === M, noTaps: !!L && getComputedStyle(L).pointerEvents === 'none', wrapped: !!drawMarks.__shape1060, oneScript: document.querySelectorAll('#shape1060-script').length}; });
  check('frame: layer mounted once, just under the native markers, not catching taps', fr.layer && fr.under && fr.noTaps && fr.wrapped && fr.oneScript === 1 && fr.state.available, fr);
  const again = await p.evaluate(() => gc500ShapeLayer1060.mount(document.getElementById('expFrame')));
  const other = await p.evaluate(() => { const d = document.getElementById('expFrame').contentDocument, s = d.querySelector('script[src="fencing-map-explorer.js?v=e3a4bef6c17d"]'); s.setAttribute('src', 'fencing-map-explorer.js?v=000000000000'); try { return gc500ShapeLayer1060.mount(document.getElementById('expFrame')); } finally { s.setAttribute('src', 'fencing-map-explorer.js?v=e3a4bef6c17d'); } });
  check('frame: another explorer build (one script changed) is refused', other === false, other);
  check('frame: a second mount does not inject twice', again === true && await frame.evaluate(() => document.querySelectorAll('#shape1060-script').length === 1 && document.querySelectorAll('#shape1060').length === 1));

  /* which references are shapes */
  const rule = await frame.evaluate(([KEEP, SHAPE]) => { const res = {}; const sv = marks;
   try { for (const k of [...KEEP, ...SHAPE]) { const it = ITEMS.find(x => x.code === k); if (!it) { res[k] = 'absent'; continue; } marks = [{it, c: '#fff'}]; res[k] = GC500Shape1060.shaped().length === 1 ? 'shape' : 'marker'; } } finally { marks = sv; }
   let n = 0; marks = ITEMS.filter(it => it.places.length).map(it => ({it, c: '#fff'})); try { n = GC500Shape1060.shaped().length; } finally { marks = sv; }
   const p37 = ITEMS.find(x => x.code === 'P37'), b = p37.places[0], nb = [b[0] + 1e-6, b[1], b[2] + 1e-6, b[3]];
   const one = it => { marks = [{it, c: '#fff'}]; try { return GC500Shape1060.shaped().length ? 'shape' : 'marker'; } finally { marks = sv; } };
   const furn = one({...p37, cat: {...p37.cat, name: 'Furniture'}, places: [nb]}), multi = one({...p37, places: [nb, b]});
   return {res, n, furn, multi}; }, [KEEP, SHAPE]);
  check('shapes: the item\'s own outline for P37, P36, WC21, WC07, WC69, WC15, P10, AA', SHAPE.every(k => rule.res[k] === 'shape'), rule.res);
  check('shapes: shared, area-label and barrier-run references keep their marker', KEEP.every(k => rule.res[k] === 'marker'), rule.res);
  check('shapes: furniture and a reference in two places keep their marker', rule.furn === 'marker' && rule.multi === 'marker', {furn: rule.furn, multi: rule.multi});
  check('shapes: at least 125 references drawn as their shape', rule.n >= 125, rule.n);
  const pin = await frame.evaluate(async () => { for (let i = 0; i < 40; i++) { const it = ITEMS.find(x => x.code === 'T0022'); if (it && it.places.length === 1) { const sv = marks; marks = [{it, c: '#fff'}]; try { return {placed: true, shaped: GC500Shape1060.shaped().length === 1}; } finally { marks = sv; } } await new Promise(r => setTimeout(r, 500)); } return {placed: false}; });
  check('pinned T0022: drawn as its shape once its pin has arrived', pin.placed && pin.shaped, pin);

  /* P37: shape, door, tick inside, no circle */
  await frame.evaluate(() => { if (DONE782_ON) document.getElementById('done782')?.click(); });
  await look('P37', 24, 'original');    /* the mode first: changing it clears the selection */
  await frame.evaluate(() => GC500Explorer.find('P37')); await settle(); await closeCard();
  await look('P37', 24);
  const p37 = await frame.evaluate(() => {
   const arcs = [], badges = []; const oa = mctx.arc, ob = window.badge1009;
   mctx.arc = function(...a){ arcs.push(a.slice(0, 3)); return oa.apply(this, a); };
   try { drawMarks(currentView()); } finally { mctx.arc = oa; }
   const st = mapStatus1009(selected), at = GC500Shape1060.at('P37'), L = document.getElementById('shape1060'), g = L.getContext('2d');
   const hex = st && st.colour || '#000', R = parseInt(hex.slice(1, 3), 16), G = parseInt(hex.slice(3, 5), 16), B = parseInt(hex.slice(5, 7), 16);
   const box = at.box, x0 = Math.max(0, Math.floor(box.x0 * dpr)), y0 = Math.max(0, Math.floor(box.y0 * dpr)), w = Math.ceil((box.x1 - box.x0) * dpr), hh = Math.ceil((box.y1 - box.y0) * dpr);
   const d = g.getImageData(x0, y0, w, hh).data; let tick = 0, ink = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 200) ink++; if (d[i + 3] > 200 && Math.abs(d[i] - R) < 40 && Math.abs(d[i + 1] - G) < 40 && Math.abs(d[i + 2] - B) < 40) tick++; }
   /* the old spot for the tick: down and to the right of the circle, outside the item */
   const r = 14 * dpr, k = Math.SQRT1_2 * (r + 22 * dpr), cx = at.x * dpr + k, cy = at.y * dpr + k, m = mctx.getImageData(Math.max(0, cx - 10), Math.max(0, cy - 10), 20, 20).data; let old = 0; for (let i = 3; i < m.length; i += 4) if (m[i] > 0) old++;
   return {sel: selected && selected.code, status: st && st.state, glyph: st && st.glyph, arcs: arcs.length, tick, ink, old, at, state: GC500Shape1060.state, w, hh};
  });
  check('P37: selected and drawn as its shape', p37.sel === 'P37' && p37.state.drawn >= 1 && p37.ink > 200, p37);
  check('P37: no circle drawn round it', p37.arcs === 0, p37.arcs);
  check('P37: the status is inside the shape (the tick, or the status colour when the shape is small)', p37.tick > 20, {tick: p37.tick, status: p37.status, glyph: p37.glyph});
  check('P37: nothing in the old tick spot outside the item', p37.old === 0, p37.old);
  /* the reference inside the shape, no second box (Andrew, 17 Oct: "i dont want two boxes shown") */
  const lab = await frame.evaluate(() => {
   const L = document.getElementById('shape1060'), g = L.getContext('2d'), rr = [], texts = [], nat = []; const or = g.roundRect, of = g.fillText, onr = mctx.roundRect, onf = mctx.fillText;
   g.roundRect = function(...a){ rr.push(a); return or.apply(this, a); };
   g.fillText = function(t, x, y){ const m = g.getTransform(); texts.push({t: String(t), x: (m.a * x + m.c * y + m.e) / dpr, y: (m.b * x + m.d * y + m.f) / dpr}); return of.apply(this, arguments); };
   mctx.roundRect = function(...a){ nat.push(a); return onr.apply(this, a); }; mctx.fillText = function(t){ nat.push(String(t)); return onf.apply(this, arguments); };
   try { drawMarks(currentView()); } finally { g.roundRect = or; g.fillText = of; mctx.roundRect = onr; mctx.fillText = onf; }
   const at = GC500Shape1060.at('P37'), b = at.box, ref = texts.find(x => x.t.startsWith('P37'));
   const lb = labelBounds1010.find(x => x.it && x.it.code === 'P37');
   return {boxes: rr.length, native: nat.length, ref, box: b, inBox: !!ref && ref.x >= b.x0 - 2 && ref.x <= b.x1 + 2 && ref.y >= b.y0 - 2 && ref.y <= b.y1 + 2, texts: texts.map(x => x.t), hit: !!lb && (() => { const h = labelHit1010(lb.x + lb.w / 2, lb.y + lb.h / 2); return h && h.it.code; })()};
  });
  check('P37: the reference is written inside its shape', lab.inBox, lab);
  check('P37: no label box beside the shape (one shape, not two boxes)', lab.boxes === 0 && lab.native === 0, {boxes: lab.boxes, native: lab.native});
  check('P37: tapping the reference text still picks P37', lab.hit === 'P37', lab.hit);
  /* glow and pulse (Andrew, 17 Oct: "Glow and pulsate too") */
  const glow = await frame.evaluate(() => { const g = document.getElementById('shape1060').getContext('2d'), ws = []; const os = g.stroke;
   g.stroke = function(){ ws.push({w: g.lineWidth / dpr, s: String(g.strokeStyle)}); return os.apply(this, arguments); };
   try { drawMarks(currentView()); } finally { g.stroke = os; } return ws.filter(x => x.w >= 9).map(x => x.w + ' ' + x.s); });
  check('P37: the shape glows (soft wide strokes in its colour under the outline)', glow.length >= 2, glow);
  const curve = await frame.evaluate(() => { const g = document.getElementById('shape1060').getContext('2d'); let n = 0; const ob = g.bezierCurveTo; g.bezierCurveTo = function(){ n++; return ob.apply(this, arguments); }; try { drawMarks(currentView()); } finally { g.bezierCurveTo = ob; } return n; });
  check('P37: the door swing is drawn as a curve', curve >= 2, curve);
  await frame.waitForFunction(() => /Drawing sharp/.test(document.getElementById('qualText')?.textContent || ''), null, {timeout: 45000}).catch(() => {});
  await p.waitForTimeout(3000);    /* past the explorer's own one-second pick animation, which redraws the map by itself */
  const rp = await frame.evaluate(() => { window.__rp1060 = {n: 0, ours: 0}; const o = window.requestPaint; window.__rpOrig1060 = o; window.requestPaint = function(){ __rp1060.n++; if (/\bbeat\b|ripple/.test(new Error().stack || '')) __rp1060.ours++; return o.apply(this, arguments); }; return true; });
  const p0 = await frame.evaluate(() => GC500Shape1060.state.paints);
  await p.waitForTimeout(1200);
  const pulse = await frame.evaluate(() => { const L = document.getElementById('shape1060beat'), g = L.getContext('2d'), d = g.getImageData(0, 0, L.width, L.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 30) n++;
   return {ink: n, state: GC500Shape1060.state.beat, paints: GC500Shape1060.state.paints, under: L.nextElementSibling === document.getElementById('marks')}; });
  check('P37: the selected shape pulses on its own layer', pulse.ink > 30 && pulse.state.frames > 10 && pulse.state.selected && pulse.under, pulse);
  await p.emulateMedia({reducedMotion: 'reduce'}); await p.waitForTimeout(400);
  const calm = await frame.evaluate(() => { const L = document.getElementById('shape1060beat'), d = L.getContext('2d').getImageData(0, 0, L.width, L.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 30) n++; return {ink: n, still: GC500Shape1060.state.beat.still}; });
  check('P37: with reduced motion the pulse stops', calm.still && calm.ink === 0, calm);
  const q0 = await frame.evaluate(() => GC500Shape1060.state.paints); await p.waitForTimeout(1200); const q1 = await frame.evaluate(() => GC500Shape1060.state.paints);
  const rq = await frame.evaluate(() => { const r = window.__rp1060; window.requestPaint = window.__rpOrig1060; return r; });
  check('P37: the pulse never asks the map to redraw (its own layer only)', rq.ours === 0 && (pulse.paints - p0) <= (q1 - q0) + 3, {pulseOn: pulse.paints - p0, pulseOff: q1 - q0, requestPaint: rq});
  await p.emulateMedia({reducedMotion: 'no-preference'});
  await look('P37', mobile ? 60 : 48);
  const tap = await frame.evaluate(() => { const at = GC500Shape1060.at('P37'), w = at.box.x1 - at.box.x0, it = ITEMS.find(x => x.code === 'P37'), bb = it.places[0], v = currentView(), M = sheetToDevice(v.scale, sw, sh), g0 = toGeo((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), c = applyM(M, g0.x, g0.y), rN = Math.max(14, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) * v.scale * .7) * 1.2;
   let deep = null; for (const f of [0.12, 0.2, 0.28]) { const x = at.box.x0 + w * f, y = at.y; if (Math.hypot(x - c.x, y - c.y) > Math.max(rN, 24)) { const hit = markAt(x, y); deep = {x, y, code: hit && hit.it && hit.it.code}; break; } }
   const m = markAt(at.x, at.y), i = itemAt887(at.x, at.y), off = markAt(at.box.x1 + 60, at.box.y1 + 60);
   return {m: m && m.it.code, i: i && i.it.code, deep, off: off && off.it && off.it.code, rN}; });
  check('P37: tapping inside the shape picks P37 (also beyond the old circle\'s reach)', tap.m === 'P37' && tap.i === 'P37' && (!tap.deep || tap.deep.code === 'P37'), tap);
  check('P37: tapping well outside the shape does not pick it', tap.off !== 'P37', tap.off);
  await shot('p37');

  /* the shape follows the camera: rotate and satellite */
  const rot = await frame.evaluate(() => { const a = GC500Shape1060.at('P37'); camera = {...camera, rot: (camera.rot + 90) % 360}; changeView(false); drawMarks(currentView()); const b = GC500Shape1060.at('P37'), m = markAt(b.x, b.y); camera = {...camera, rot: (camera.rot + 270) % 360}; changeView(false); return {a, b, m: m && m.it.code, drawn: GC500Shape1060.state.drawn}; });
  check('P37: turning the map turns the shape with it, and it can still be tapped', rot.m === 'P37' && rot.drawn >= 1 && Math.abs((rot.a.box.x1 - rot.a.box.x0) - (rot.b.box.y1 - rot.b.box.y0)) < 3, rot);
  await frame.evaluate(() => setMode('hybrid')); await frame.evaluate(() => GC500Explorer.find('P37')); await settle(); await closeCard(); await look('P37', 24);
  const sat = await frame.evaluate(() => ({drawn: GC500Shape1060.state.drawn, mode, failed: GC500Shape1060.state.failed}));
  check('P37: drawn in Satellite + plan too', sat.mode === 'hybrid' && sat.drawn >= 1 && sat.failed === 0, sat);
  await shot('p37-satellite');

  /* an FWF run: each unit's chevron (its door), one tick */
  await frame.evaluate(() => { const b = [...document.querySelectorAll('#chips [data-cat]')].find(x => x.textContent.includes('Toilets')); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
  await frame.evaluate(() => clearSelection813()); await look('WC21', 90, 'original');
  const wc21 = await frame.evaluate(() => { const strokes = []; const L = document.getElementById('shape1060'), g = L.getContext('2d'), os = g.stroke; let n = 0; g.stroke = function(...a){ n++; return os.apply(this, a); };
   try { drawMarks(currentView()); } finally { g.stroke = os; } return {strokes: n, drawn: GC500Shape1060.state.drawn, shaped: GC500Shape1060.shaped().includes('WC21'), status: mapStatus1009(ITEMS.find(x => x.code === 'WC21'))}; });
  check('WC21: drawn as six FWF squares with their chevrons', wc21.shaped && wc21.drawn >= 1 && wc21.strokes >= 6 * 2 + 6 * 2, wc21);
  await shot('wc21-fwf');
  const multi = {};
  for (const k of ['WC15', 'WC07', 'WC17']) { if (!(await frame.evaluate(k => !!ITEMS.find(x => x.code === k), k))) continue; await look(k, 40);
   multi[k] = await frame.evaluate(k => { drawMarks(currentView()); return GC500Shape1060.layout(k); }, k); }
  check('multi-part references: the tick is inside a part, never in the gap between parts', Object.values(multi).length >= 2 && Object.values(multi).every(l => l && (!l.tick || l.tick.inPart)), multi);
  await look('WC15', 40); await shot('wc15-two-blocks');

  /* all the toilets and buildings, with the Done chip: finished units are shapes with the tick inside, not loose ticks */
  await frame.evaluate(() => { const b = [...document.querySelectorAll('#chips [data-cat]')].find(x => x.textContent.includes('Portable buildings')); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); if (!DONE782_ON) document.getElementById('done782')?.click(); });
  await settle(); await p.waitForTimeout(1500); await settle();    /* the chip glides to its category first */
  await look('P37', mobile ? 22 : 14);
  const all = await frame.evaluate(() => { const dn = done782List(), shapedDone = dn.filter(it => { const sv = marks; marks = [{it, c: '#fff'}]; try { return GC500Shape1060.shaped().length === 1; } finally { marks = sv; } });
   return {marks: marks.length, drawn: GC500Shape1060.state.drawn, kept: GC500Shape1060.state.kept, done: GC500Shape1060.done().length, nativeDoneShaped: shapedDone.map(it => it.code), failed: GC500Shape1060.state.failed}; });
  check('all references (one chip): shapes drawn, the few without one keep a marker', all.marks >= 40 && all.drawn >= 5 && all.failed === 0, all);
  check('Done chip: shaped finished units are not also given a loose tick', all.nativeDoneShaped.length === 0, all.nativeDoneShaped);
  await shot('all-references');

  /* a reference that keeps its marker: the tick is inside its circle */
  await frame.evaluate(() => { if (DONE782_ON) document.getElementById('done782')?.click(); });
  await frame.evaluate(() => GC500Explorer.find('T0266')); await settle(); await closeCard();
  const t66 = await frame.evaluate(() => { const at = []; const ob = window.badge1009; window.badge1009 = function(ctx, x, y, s){ const t = ctx.getTransform(); at.push({x: t.e + x * t.a, y: t.f + y * t.d}); return ob.apply(this, arguments); };
   try { drawMarks(currentView()); } finally { window.badge1009 = ob; }
   const it = ITEMS.find(x => x.code === 'T0266'), b = it.places[0], v = currentView(), M = sheetToDevice(dpr * v.scale, canvas.width, canvas.height), g0 = toGeo((b[0] + b[2]) / 2, (b[1] + b[3]) / 2), c = applyM(M, g0.x, g0.y);
   return {sel: selected && selected.code, at, c, status: mapStatus1009(it) && mapStatus1009(it).state}; });
  const near = t66.at.some(q => Math.hypot(q.x - t66.c.x, q.y - t66.c.y) < 1.5);
  check('T0266 (keeps its marker): the status sits inside its circle, not beside it', t66.sel === 'T0266' && (!t66.status || near), t66);
  const t66b = await frame.evaluate(() => { let boxes = 0; const texts = []; const or = mctx.roundRect, of = mctx.fillText; mctx.roundRect = function(){ boxes++; return or.apply(this, arguments); }; mctx.fillText = function(t){ texts.push(String(t)); return of.apply(this, arguments); };
   try { drawMarks(currentView()); } finally { mctx.roundRect = or; mctx.fillText = of; } const lb = labelBounds1010.find(b => b.it && b.it.code === 'T0266'); const hit = lb && labelHit1010(lb.x + lb.w / 2, lb.y + lb.h / 2); return {boxes, texts, hit: hit && hit.it.code}; });
  check('T0266: its reference is plain text under the circle, no second box', t66b.boxes === 0 && t66b.texts.some(x => x.startsWith('T0266')) && t66b.hit === 'T0266', t66b);
  await shot('t0266-marker');

  /* fencing and 3D are left alone */
  const fence = await frame.evaluate(async () => { if (!window.GC500FencingMap || typeof GC500FencingMap.open !== 'function') return {skip: true};
   GC500FencingMap.open(); await new Promise(r => setTimeout(r, 600)); drawMarks(currentView());
   const L = document.getElementById('shape1060'), hidden = getComputedStyle(L).display === 'none', act = !!GC500FencingMap.active;
   GC500FencingMap.close(); await new Promise(r => setTimeout(r, 400)); return {hidden, act}; });
  check('fencing map: the shape layer stands down', fence.skip || (fence.act && fence.hidden), fence);
  const three = await frame.evaluate(() => { document.body.classList.add('in3d'); const v = getComputedStyle(document.getElementById('shape1060')).visibility; document.body.classList.remove('in3d'); return v; });
  check('3D view: the shape layer is hidden under it', three === 'hidden', three);

  /* nothing written, nothing broken */
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the checks', after === before);
  check('no page errors', h.errors.length === 0, h.errors);
  check('no writes attempted', h.counts.blocked === 0, h.counts);
 } catch (e) { check('test ran to the end', false, String(e && e.stack || e).slice(0, 800)); }
 finally {
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({author: 'Andrew Fisher', page: live ? 'live' : pageFile, mobile, passed: results.length - failed, failed, results}, null, 1));
  console.log((failed ? 'FAILED ' : 'ALL PASS ') + (results.length - failed) + '/' + results.length);
  await h.browser.close(); process.exitCode = failed ? 1 : 0;
 }
})();
