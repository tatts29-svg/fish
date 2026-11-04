/* Author: Andrew Fisher. Read-only Demob equipment marks over the existing map pictures. */
(function (W) {
'use strict';
if (W.DemobShapes1297) return;
const VERSION = 'v12.97', RENDER_REV = 'plan-outlines-2', NEUTRAL = '#c6d4dc', own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
const finite = Number.isFinite, point = p => Array.isArray(p) && p.length === 2 && p.every(finite);
const copyLine = a => Array.isArray(a) && a.every(point) ? a.map(p => p.slice()) : [];
const norm = s => String(s || '').toUpperCase().replace(/[\s\-_.]+/g, ' ').trim();
const BODIES = Object.freeze({
 gen: ['generator'], tower: ['light_tower'], vms: ['vms_board'], fwf: ['toilet', 'fwf_trailer'],
 access: ['accessible_toilet'], urinal: ['pee_panel'], block: ['toilet_block'], tank: ['waste_tank'],
 bld: ['building'], kiosk: ['building'], container: ['container'], forklift: ['forklift'],
 barrier: ['water_barrier'], mat: ['trakmat']
});
function attempt(fn, fallback = null) { try { const value = fn(); return value == null ? fallback : value; } catch (_) { return fallback; } }
function dataNow() { return typeof DATA !== 'undefined' ? DATA : W.DATA; }
function sheetPoint(L) {
 return attempt(() => {
  const sheet = (dataNow()?.sheets || []).find(s => s.key === 'D001'), fit = W.sheetFitOf(sheet), fr = W.frameOf(L.lat, L.lon);
  const p = [fit.fx.k * fr.ax + fit.fx.c, fit.fy.k * fr.ay + fit.fy.c];
  return point(p) ? p : null;
 });
}
function distance(p, comps, sheet) {
 let best = Infinity;
 const x = p[0] * sheet[0], y = p[1] * sheet[1];
 for (const c of comps) {
  const ps = c.poly.map(q => [q[0] * sheet[0], q[1] * sheet[1]]); let inside = false;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
   const a = ps[j], b = ps[i];
   if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
   const dx = b[0] - a[0], dy = b[1] - a[1], n = dx * dx + dy * dy;
   const t = n ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / n)) : 0;
   best = Math.min(best, Math.hypot(a[0] + t * dx - x, a[1] + t * dy - y));
  }
  if (inside) return 0;
 }
 return best;
}
function component(c) {
 const poly = copyLine(c?.poly); if (poly.length < 3) return null;
 const lines = a => (Array.isArray(a) ? a : []).map(copyLine).filter(l => l.length > 1);
 return {kind: String(c.kind || ''), standard: !!c.std, tank: !!c.tank, poly,
  doors: (Array.isArray(c.doors) ? c.doors : []).map(d => ({arcs: lines(d.arcs), leaves: lines(d.leaves), landing: lines(d.landing)})),
  chevrons: lines(c.chev)};
}
function state(c) {
 const review = !!(c.unk || c.st?.rv || c.G?.issues?.length || c.st?.s === 'review');
 const complete = c.st?.s === 'gone';
 const partial = !complete && !!(c.half || c.part?.collected > 0 || c.G?.collected > 0 && !c.G?.complete);
 return {complete, partial, review, colour: review ? '#ffaaa3' : complete || partial ? '#7fffc1' : '#18e8ff',
  label: review ? 'Review' : complete ? 'Picked up' : partial ? 'Part picked up' : ''};
}
/* A card's existing location remains untouched. This context contains only drawing facts.
 * Supply destination:null for a historically resolved location whose current destination is inapplicable.
 * The adapter may also provide a precomputed sheetPoint and the existing snapshot during a render batch. */
function context(c, L, opts = {}) {
 c = c || {}; L = L || {};
 const a = L.a || c.r?.a || attempt(() => W.assetOf(c.key));
 const destination = own(opts, 'destination') ? opts.destination : attempt(() => W.dest782(a));
 const locationPoint = own(opts, 'sheetPoint') ? opts.sheetPoint : sheetPoint(L);
 const source = own(opts, 'source') ? opts.source : attempt(() => W.gc500MapShapes1060());
 // The shared snapshot already excludes cancelled and unplaced source shapes.
 const raw = own(opts, 'rawShape') ? opts.rawShape : null;
 const meta = attempt(() => W.MasterShapes926.meta(), {}), sheet = opts.sheetSize || meta.sheet || [2384, 1684];
 const st = state(c), key = String(c.key || L.key || L.label || ''), icon = String(c.icon || 'other');
 const report = destination?.kind === 'report' || /report here|no drop-off|driver reports/i.test([L.tag, L.how, L.warn].join(' '));
 const approximate = !!(destination?.approx || L.warn);
 const m = {version: VERSION, key, uid: String(c.uid || ''), icon, ...st,
  kind: 'unassigned', reason: '', qualification: '', provenance: '', parts: [],
  lat: finite(L.lat) ? L.lat : null, lon: finite(L.lon) ? L.lon : null,
  approximate, scope: c.of > 1 || c.group ? 'reference' : 'unit',
  sourceSignature: String(source?.sig || ''), locationSignature: String(opts.locationSignature || '')};
 const fallback = why => { m.reason = why; m.colour = NEUTRAL; m.label = ''; if (/individual|shared|paired tank|reference outline/.test(why)) m.scope = 'reference';
  m.qualification = approximate ? 'Approximate recorded position; equipment outline unrecorded' : 'Recorded position; equipment outline unrecorded'; return m; };
 if (report || !finite(L.lat) || !finite(L.lon) || L.none) {
  m.kind = 'unlocated'; m.reason = report ? 'report point is not equipment location' : 'equipment location unavailable';
  m.qualification = report ? 'Report point only; equipment location unrecorded' : 'Equipment location unrecorded'; return m;
 }
 if (c.vms) return fallback('board location; reference outline unassigned');
 if (c.cat === 'furn' || /furniture/i.test(String(a?.discipline || ''))) return fallback('contents; separate outline unassigned');
 if (a?._cancelled || raw?.cancelled || raw?.placed === false) return fallback('source outline unavailable');
 if (destination?.andrew || destination?.nt?.andrew || /Andrew[’']s pin/i.test(String(L.how || ''))) return fallback('recorded pin; old plan outline unassigned');
 if (approximate || ['area', 'report', 'revised', 'unverified'].includes(destination?.kind)) return fallback('exact equipment location unconfirmed');
 if (opts.locationCount > 1) return fallback('individual outline not assigned across separate locations');
 const sh = source?.available && source.refs?.[norm(key)];
 if (!sh) return fallback('source outline unavailable');
 if (sh.shared) return fallback('shared plan outline');
 const comps = (sh.comps || []).map(component).filter(Boolean), wanted = BODIES[icon] || [], wholeReference = opts.wholeReference === true && c.group === true;
 let body = wholeReference ? comps.slice() : comps.filter(p => wanted.includes(p.kind));
 if (!body.length) return fallback('equipment type has no assigned source outline');
 // Multiple source bodies remain a neutral reference layout. A unit card never
 // chooses the first polygon, nor colours every possible slot as that unit.
 let reference = !!c.group || body.length !== 1 || c.of > 1 && opts.sameKindCount !== 1 || Number(opts.sameKindCount) > 1;
 if (c.tank && icon !== 'tank') {
  const tanks = comps.filter(p => p.tank || p.kind === 'waste_tank');
  if (tanks.length > 1) reference = true;
  body = body.concat(tanks.filter(p => !body.includes(p)));
 }
 if (!point(locationPoint) || !point(sheet) || sheet.some(n => n <= 0)) return fallback('source position comparison unavailable');
 // Same six-sheet-point tolerance as Map Explorer. Geometry is never translated to this point.
 if (distance(locationPoint, body, sheet) > 6) return fallback('recorded location outside source outline');
 m.kind = reference ? 'reference' : 'footprint'; m.parts = body;
 const standard = body.filter(p => p.standard).length;
 m.provenance = standard === body.length ? 'catalogue' : standard ? 'mixed' : 'master';
 m.scope = reference ? 'reference' : 'unit';
 if(reference){m.colour=NEUTRAL;m.label='';}
 m.qualification = [reference ? 'Reference layout; individual unit position not recorded' : '',
  m.provenance === 'catalogue' ? 'Catalogue outline' : m.provenance === 'mixed' ? 'Includes catalogue outline' : ''].filter(Boolean).join(' · ');
 return m;
}
function signature(m) {
 if (!m) return '';
 return JSON.stringify([VERSION, RENDER_REV, m.key, m.uid, m.icon, m.kind, m.lat, m.lon, m.complete, m.partial, m.review,
  m.approximate, m.scope, m.reason, m.qualification, m.provenance, m.sourceSignature, m.locationSignature, m.parts]);
}
const xy = p => point(p) ? {x: p[0], y: p[1]} : p && finite(p.x) && finite(p.y) ? {x: p.x, y: p.y} : null;
function projected(m, projection) {
 if (!['footprint','reference'].includes(m.kind) || typeof projection.projectSheet !== 'function') return null;
 return attempt(() => m.parts.map(c => {
  const line = ps => ps.map(p => { const q = xy(projection.projectSheet(p[0], p[1])); if (!q) throw new Error('Invalid projection'); return q; });
  return {...c, points: line(c.poly), doors: c.doors.map(d => ({arcs: d.arcs.map(line), leaves: d.leaves.map(line), landing: d.landing.map(line)})), chevrons: c.chevrons.map(line)};
 }));
}
function polygon(g, points, close) { g.beginPath(); points.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); if (close) g.closePath(); }
function label(g, m, p, at, note) {
 const width = p.width, height = p.height, quiet = m.kind === 'unassigned' || m.kind === 'unlocated', font = Math.max(16, Math.min(quiet ? 22 : 29, width * (quiet ? .022 : .029))), small = font * .67, pad = font * .4;
 const main = [m.key, m.label].filter(Boolean).join(' · '), details = String(note || '');
 g.save(); g.textAlign = 'left'; g.textBaseline = 'middle';
 g.font = '700 ' + font + 'px system-ui,sans-serif'; const a = g.measureText(main).width;
 g.font = '500 ' + small + 'px system-ui,sans-serif'; const b = g.measureText(details).width;
 const w = Math.min(width - 16, Math.max(a, b) + 2 * pad), h = font + 2 * pad + (details ? small * 1.4 : 0);
 const x = Math.max(8, Math.min(width - w - 8, at.x + 16)), y = Math.max(8, Math.min(height - h - 8, at.y - h - 16));
 g.fillStyle = quiet ? 'rgba(15,27,33,.7)' : 'rgba(15,27,33,.9)'; g.fillRect(x, y, w, h);
 g.font = '700 ' + font + 'px system-ui,sans-serif'; g.fillStyle = m.colour; g.fillText(main, x + pad, y + pad + font / 2, w - 2 * pad);
 if (details) { g.font = '500 ' + small + 'px system-ui,sans-serif'; g.fillStyle = '#e4edf0'; g.fillText(details, x + pad, y + pad + font + small * .75, w - 2 * pad); }
 g.restore(); return {x, y, w, h};
}
/* Exact image projection supplied by Find1176. The map/aerial, scale and north are not redrawn.
 * projectSheet(fx,fy) maps master-sheet fractions to this image's map pixels.
 * x/y are the canonical location in those pixels; width/height exclude the caption band. */
function paint(g, m, projection) {
 if (!g || !m || !projection || ![projection.x, projection.y, projection.width, projection.height].every(finite) || projection.width <= 0 || projection.height <= 0) return {painted: false, kind: 'unavailable'};
 const p = projection, at = {x: p.x, y: p.y};
 if (m.kind === 'unlocated') {
  label(g, {...m, label: ''}, p, {x: 0, y: 0}, m.qualification); return {painted: false, kind: 'unlocated', reason: m.reason};
 }
 const parts = projected(m, p);
 g.save(); g.beginPath(); g.rect(0, 0, p.width, p.height); g.clip();
 let anchor = at, rendered = 'unassigned', note = m.qualification;
 if (parts?.length) {
  rendered = m.kind; const neutral = m.kind === 'reference', all = parts.flatMap(c => c.points);
  anchor = {x: Math.max(...all.map(q => q.x)), y: Math.min(...all.map(q => q.y))};
  for (const c of parts) {
   polygon(g, c.points, true); g.lineJoin = 'round';
   g.globalAlpha = neutral ? .18 : .3; g.strokeStyle = m.colour; g.lineWidth = neutral ? 7 : 10; g.stroke(); g.globalAlpha = 1;
   g.setLineDash(c.standard || !neutral && m.partial ? [7, 5] : []);
   g.globalAlpha = neutral ? .055 : m.partial ? .08 : .18; g.fillStyle = m.colour; g.fill(); g.globalAlpha = 1;
   g.lineWidth = 5; g.strokeStyle = '#0b151c'; g.stroke(); g.lineWidth = 2.8; g.strokeStyle = m.colour; g.stroke(); g.setLineDash([]);
  }
  // Source door leaves, curves and landings only. No inferred door side or synthetic arrow.
  for (const c of parts) {
   const ink = () => {
    for (const d of c.doors) {
     for (const a of d.arcs) { if (a.length === 4) { g.beginPath(); g.moveTo(a[0].x, a[0].y); g.bezierCurveTo(a[1].x, a[1].y, a[2].x, a[2].y, a[3].x, a[3].y); } else polygon(g, a, false); g.stroke(); }
     for (const a of d.leaves.concat(d.landing)) { polygon(g, a, false); g.stroke(); }
    }
    for (const a of c.chevrons) { polygon(g, a, false); g.stroke(); }
   };
   g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = '#0b151c'; ink(); g.lineWidth = 2.6; g.strokeStyle = '#e8f7ff'; ink();
  }
 } else {
  if (['footprint','reference'].includes(m.kind)) note = 'Recorded position; source outline projection unavailable';
  // No substitute front-view icon, circle or pin. The unchanged map remains at
  // its recorded position, with a small qualification beside it.
  const box = label(g, {...m,kind:'unassigned',label:'',colour:NEUTRAL}, p, at, note); g.restore();
  return {painted:false,kind:'unassigned',at,box,provenance:'',qualification:note,reason:m.reason||'source projection unavailable'};
 }
 const box = label(g, m, p, anchor, note); g.restore();
 return {painted: true, kind: rendered, at, box, provenance: m.provenance, qualification: note};
}
W.DemobShapes1297 = Object.freeze({version: VERSION, context, signature, paint, projected});
})(window);
