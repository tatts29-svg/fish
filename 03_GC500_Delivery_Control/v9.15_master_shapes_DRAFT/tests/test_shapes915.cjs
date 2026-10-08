// Author: Andrew Fisher. v9.15 master shapes, every item - tests.
//
//   node tests/test_shapes915.cjs static  <build.html> <base.html>          (no browser)
//   node tests/test_shapes915.cjs browser <build.html> <base.html> [laptop|phone]   (through browser_run.sh)
//
// static: the page is the base plus exactly the two new blocks (DATA, MASTER_LOC and everything else byte for byte);
//   the embedded data carries its checksums; every reference on the page has a shape or a reason, and only cancelled
//   references (and T0265, fridges with no footprint) have none; EVERY unit in inputs/inventory.json has exactly one shape;
//   every part traced from the master agrees with a fresh read of the PDF (evidence/pdf_check.json: outlines, door arcs,
//   barrier pieces and the barrier line through their ends); every part not drawn on the master cites its source and uses
//   the reconciled footprint (footprints_v915.json); each waste tank is its block's own outline, greyed and labelled;
//   svg() keeps aspect and rotation exactly, scales up uniformly under minPx, puts the door mark on the master's door edge
//   (and on the chosen edge when one is chosen), draws one unit on request, draws standard parts dashed, and the projected
//   mode matches the explorer camera.
// browser: the global is on the live-address page (laptop and phone), every marker and every unit's marker parses and
//   renders in the browser with the same geometry, no page or console errors beyond the base page's own, 0 blocked writes,
//   and the visible text of every tab is the same on the base page and the build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const HERE = path.resolve(__dirname, '..');
const [mode, PAGE, BASE, DEV] = process.argv.slice(2);
const results = []; let fails = 0;
const ok = (name, pass, info) => { results.push({name, pass: !!pass, info: info === undefined ? null : info}); if (!pass) fails++; };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const SHEET = [2384, 1684];
const toPdf = (f, inset) => [f[0] * 2384 - (inset ? 0 : 25.5), f[1] * 1684 - (inset ? 0.06 : 0.12)];
const readJ = f => JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8'));

function blocks(t) {
  const d = t.match(/\n<script id="shapes915-data" data-sha256="([0-9a-f]{64})">const MASTER_SHAPES915_DATA = ([\s\S]*?);<\/script>\n<script id="shapes915-script">([\s\S]*?)<\/script>/);
  return d ? {whole: d[0], sha: d[1], json: d[2], js: d[3]} : null;
}
function loadApi(t) {
  const b = blocks(t); if (!b) return null;
  const ctx = {window: {}, JSON, Math, Object, Number, String, Array, Set, Infinity, isNaN};
  vm.createContext(ctx); vm.runInContext('const MASTER_SHAPES915_DATA = ' + b.json + ';\n' + b.js + '\n;this.__api = MasterShapes915;', ctx);
  return ctx.__api;
}
const parsePts = s => s.trim().split(/\s+/).map(p => p.split(',').map(Number));
function svgParts(svg) {
  const comps = [...svg.matchAll(/<polygon class="ms915-comp" data-i="(\d+)" data-kind="[^"]*" points="([^"]+)"([^>]*)\/>/g)].map(m => ({i: +m[1], pts: parsePts(m[2]), dashed: /stroke-dasharray/.test(m[3])}));
  const tanks = [...svg.matchAll(/<polygon class="ms915-comp ms915-tank"( transform="translate\(([-\d.]+),([-\d.]+)\)")? data-i="(\d+)" points="([^"]+)"([^>]*)\/>/g)].map(m => ({i: +m[4], off: m[1] ? [+m[2], +m[3]] : null, pts: parsePts(m[5]), fill: (m[6].match(/fill="([^"]+)"/) || [])[1]}));
  const lines = [...svg.matchAll(/<polyline class="ms915-line" data-i="(\d+)" points="([^"]+)"([^>]*)\/>/g)].map(m => ({i: +m[1], pts: parsePts(m[2]), dashed: /stroke-dasharray/.test(m[3])}));
  const points = [...svg.matchAll(/<rect class="ms915-comp ms915-point" data-i="(\d+)"/g)].map(m => +m[1]);
  const parts = [...svg.matchAll(/<g class="ms915-part" data-i="(\d+)" data-kind="([^"]*)" data-source="(\w+)" data-role="([\w-]+)"/g)].map(m => ({i: +m[1], kind: m[2], source: m[3], role: m[4]}));
  const doors = [...svg.matchAll(/<g class="ms915-door" data-source="(\w+)" data-comp="(\d+)" data-edge="(\d+)"[^>]*>([\s\S]*?)<\/g><\/g>/g)].map(m => {
    const bar = m[4].match(/<line class="ms915-door-bar" x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/);
    const ar = m[4].match(/<g class="ms915-door-arrow"><line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/);
    return {source: m[1], comp: +m[2], edge: +m[3], bar: bar ? bar.slice(1).map(Number) : null, arrow: ar ? ar.slice(1).map(Number) : null, swing: /ms915-swing/.test(m[4])};
  });
  return {comps, tanks, lines, points, parts, doors, scale: +((svg.match(/data-ms915-scale="([\d.]+)"/) || [])[1]), door: (svg.match(/data-ms915-door="(\w+)"/) || [])[1],
    unit: (svg.match(/data-ms915-unit="(\d+)"/) || [])[1]};
}
function segDist(p, a, b) { const ab = [b[0] - a[0], b[1] - a[1]], L2 = ab[0] ** 2 + ab[1] ** 2; let t = L2 ? ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / L2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - ab[0] * t, p[1] - a[1] - ab[1] * t); }
function objEnd(t, i) { let d = 0, q = false; for (let j = i; j < t.length; j++) { const c = t[j]; if (q) { if (c === '\\') j++; else if (c === '"') q = false; continue; } if (c === '"') q = true; else if (c === '{') d++; else if (c === '}') { d--; if (!d) return j + 1; } } return -1; }
function centroid(poly) { let A = 0, cx = 0, cy = 0; for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length], c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c; } A /= 2; return [cx / (6 * A), cy / (6 * A)]; }
const nearest = (v, P) => Math.min(...P.map(q => Math.hypot(v[0] - q[0], v[1] - q[1])));

function staticTests() {
  const t = fs.readFileSync(PAGE, 'utf8'), base = BASE ? fs.readFileSync(BASE, 'utf8') : null;
  const b = blocks(t);
  ok('S1 the two new blocks are on the page, once', b && t.split('id="shapes915-data"').length === 2 && t.split('id="shapes915-script"').length === 2);
  if (base) ok('S1 removing them gives the base page byte for byte (DATA, MASTER_LOC, money, footer, every screen unchanged)', t.replace(b.whole, '') === base, {build: t.length, base: base.length});
  ok('S2 embedded data matches its recorded sha256', sha(b.json) === b.sha, b.sha.slice(0, 16));
  const srcSha = sha(fs.readFileSync(path.join(HERE, 'shapes_v915.json'))), fSha = sha(fs.readFileSync(path.join(HERE, 'footprints_v915.json')));
  const data = JSON.parse(b.json.replace(/<\\\//g, '</'));
  ok('S2 page data names the source files it came from (shapes and footprints)', data.source_sha256 === srcSha && data.footprints_sha256 === fSha, {shapes: srcSha.slice(0, 16), footprints: fSha.slice(0, 16)});
  ok('S2 no agent or model names, no author name, no dollar figure in the page data', !/Claude|Codex|Opus|GPT|Andrew|Fisher/.test(b.json + b.js.replace(/^\s*\/\*[\s\S]*?\*\//, '')) && !/\$\s?\d/.test(b.json));
  const api = loadApi(t);
  ok('S3 MasterShapes915 loads, frozen, read only', api && Object.isFrozen(api) && ['shape', 'svg', 'units', 'unit', 'footprint', 'doorEdges', 'layout', 'reason', 'refs'].every(k => typeof api[k] === 'function'));
  const J = readJ('shapes_v915.json'), F = readJ('footprints_v915.json'), INV = readJ('inputs/inventory.json');
  const withShape = Object.keys(J.refs).filter(r => J.refs[r].shape);
  ok('S3 refs() lists every reference with a shape', JSON.stringify(api.refs()) === JSON.stringify(withShape.slice().sort()), api.refs().length);
  const dataM = t.match(/const DATA = (\{.*?\});\n/), dataObj = dataM ? JSON.parse(dataM[1]) : null;
  const mlI = t.indexOf('const MASTER_LOC = ') + 'const MASTER_LOC = '.length;
  let ML = null; try { ML = JSON.parse(t.slice(mlI, objEnd(t, mlI))); } catch (e) { ML = null; }
  const pageRefs = new Set([...(dataObj ? dataObj.assets.map(a => a.key) : []), ...Object.keys(ML || {})]);
  const unanswered = [...pageRefs].filter(r => !api.shape(r) && !(api.reason(r) && api.reason(r) !== 'not a reference on this page'));
  ok('S3 every reference on the page (DATA and MASTER_LOC) has a shape or a reason', pageRefs.size >= 180 && unanswered.length === 0, {refs: pageRefs.size, shapes: withShape.length, unanswered});
  const nulls = Object.keys(J.refs).filter(r => !J.refs[r].shape), badNull = nulls.filter(r => !J.refs[r].cancelled && r !== 'T0265');
  ok('S3 no reference is without a shape except cancelled ones (kept with a note) and T0265 (4 fridges, no footprint anywhere)', badNull.length === 0 && nulls.every(r => api.svg(r) === null && /\w/.test(api.reason(r))), {nulls, badNull});
  const m1 = api.shape('P67'); m1.components[0].poly[0][0] = 9; ok('S3 shape() hands out a copy (cannot change the data)', api.shape('P67').components[0].poly[0][0] !== 9);
  // S3b every inventory unit has exactly one shape
  const byRef = {}; INV.units.forEach(u => { (byRef[u.ref] = byRef[u.ref] || []).push(u); });
  let nUnits = 0, nShaped = 0; const unitBad = [], compShared = [];
  for (const [r, us] of Object.entries(byRef)) {
    const got = api.units(r);
    if (got.length !== us.length) { unitBad.push([r, 'count', us.length, got.length]); continue; }
    const used = {};
    us.forEach((u, k) => {
      nUnits++; const g = got[k];
      if (g.type !== u.type || g.type_index !== u.unit_index || String(g.number || '') !== String(u.asset_or_supplier_no || '')) unitBad.push([r, k + 1, 'identity']);
      const cancelledNoShape = !String(u.ref_state).startsWith('active') && !g.components.length;
      if (cancelledNoShape) { if (!g.cancelled) unitBad.push([r, k + 1, 'cancelled not marked']); return; }
      if (!g.components.length) { unitBad.push([r, k + 1, 'no shape']); return; }
      const sh = api.shape(r); if (!sh) { unitBad.push([r, k + 1, 'no shape for ref']); return; }
      g.components.forEach(i => { if (!sh.components[i]) unitBad.push([r, k + 1, 'bad index']); used[i] = (used[i] || 0) + 1; });
      const svgU = api.svg(r, {unit: g.n, pxPerPt: 7.75}); if (!svgU) unitBad.push([r, k + 1, 'no svg']);
      nShaped++;
    });
    Object.entries(used).forEach(([i, c]) => { if (c > 1) compShared.push([r, i]); });
  }
  const activeUnits = INV.units.filter(u => String(u.ref_state).startsWith('active')).length;
  ok('S3b every unit in inventory.json is answered, in order, with its own type, index and number', unitBad.length === 0 && nUnits === INV.units.length, {units: nUnits, bad: unitBad.slice(0, 8)});
  ok('S3b every active unit has exactly one shape (its own part, never shared), and draws on its own', nShaped >= activeUnits && compShared.length === 0, {shaped: nShaped, active: activeUnits, shared: compShared.slice(0, 5)});
  const bySrc = {}; Object.values(J.refs).forEach(e => (e.units || []).forEach(u => { if (!u.cancelled && u.source !== 'cancelled') bySrc[u.source] = (bySrc[u.source] || 0) + 1; }));
  ok('S3b meta counts the units by source', JSON.stringify(api.meta().counts.units_by_source) === JSON.stringify(J.meta.counts_9oct.units_by_source) && api.meta().counts.units === Object.values(bySrc).reduce((a, b) => a + b, 0), bySrc);
  ok('S3b a unit is found by its loading id and its number (for the Arrange loads door choice)', (() => { const u = api.unit('WC20', 'u1327228'); const v = api.unit('WC05', '1097377'); return u && u.type === 'waste_tank' && v && v.type === 'toilet_block_6m' && api.unit('WC09', 'fwf#2').type === 'fwf'; })());
  // S4 every traced part against a fresh read of the PDF
  const pc = readJ('evidence/pdf_check.json');
  const M = data.m_per_pt; let worstC = 0, worstV = 0, worstWhere = null, nPoly = 0, worstDoorM = 0, nDoors8 = 0, nDoorsAll = 0, worstEndM = 0, worstLeaf = 0;
  let nLines = 0, nPieces = 0, worstPiece = 0, worstLineV = 0, nLineV = 0; const missingRows = [];
  for (const r of withShape) {
    const s = api.shape(r), rows = pc.refs[r] || [];
    s.components.forEach((c, i) => {
      if (c.source !== 'master') return;
      const row = rows[i]; if (!row) { missingRows.push(r + '#' + i); return; }
      if (c.geometry === 'polyline') {
        nLines++;
        c.marks.filter(m => m.type === 'piece').forEach((m, k) => { nPieces++; const P = row.pieces[k].points_pt; m.poly.forEach(v => { worstPiece = Math.max(worstPiece, nearest(toPdf(v, row.inset), P)); }); });
        // a vertex is a piece-end mid point, or where two pieces meet, the mean of the two touching ends' mid points
        const E = row.end_mids_pt, cand = E.slice();
        for (let a = 0; a < E.length; a++) for (let b2 = a + 1; b2 < E.length; b2++) if (Math.hypot(E[a][0] - E[b2][0], E[a][1] - E[b2][1]) < 0.2) cand.push([(E[a][0] + E[b2][0]) / 2, (E[a][1] + E[b2][1]) / 2]);
        c.poly.forEach(v => { nLineV++; worstLineV = Math.max(worstLineV, nearest(toPdf(v, row.inset), cand)); });
        return;
      }
      nPoly++;
      const P = c.poly.map(f => toPdf(f, row.inset)), C = centroid(P), dC = Math.hypot(C[0] - row.centroid_pt[0], C[1] - row.centroid_pt[1]) * M;
      if (dC > worstC) { worstC = dC; worstWhere = r + '#' + i; }
      for (const v of P) worstV = Math.max(worstV, nearest(v, row.corners_pt));
      c.doors.forEach((d, k) => {
        nDoorsAll++; const q = row.doors[k], a = d.swing.arc.map(f => toPdf(f, row.inset));
        if (q.cubics === 1) { nDoors8++; a.forEach((v, j) => { worstDoorM = Math.max(worstDoorM, Math.hypot(v[0] - q.arc_pt[j][0], v[1] - q.arc_pt[j][1]) * M); }); }
        const e1 = Math.max(Math.hypot(a[0][0] - q.arc_ends_pt[0][0], a[0][1] - q.arc_ends_pt[0][1]), Math.hypot(a[3][0] - q.arc_ends_pt[1][0], a[3][1] - q.arc_ends_pt[1][1]));
        const e2 = Math.max(Math.hypot(a[0][0] - q.arc_ends_pt[1][0], a[0][1] - q.arc_ends_pt[1][1]), Math.hypot(a[3][0] - q.arc_ends_pt[0][0], a[3][1] - q.arc_ends_pt[0][1]));
        worstEndM = Math.max(worstEndM, Math.min(e1, e2) * M);
        d.swing.leaf.map(f => toPdf(f, row.inset)).forEach(v => { worstLeaf = Math.max(worstLeaf, nearest(v, q.leaf_pt)); });
      });
    });
  }
  ok('S4 every traced outline\'s centroid within 0.5 m of the PDF centroid after the transform', missingRows.length === 0 && nPoly >= 318 + 9 && worstC < 0.5, {outlines: nPoly, worst_m: +worstC.toFixed(4), at: worstWhere, missing: missingRows.slice(0, 5)});
  ok('S4 every traced vertex is a PDF corner (under 0.01 pt)', worstV < 0.01, {worst_pt: +worstV.toFixed(5)});
  ok('S4 every door swing is the PDF arc: the 117 of 8 Oct point for point, every arc end and leaf under 0.01 m / 0.01 pt', nDoors8 === 117 && nDoorsAll >= 117 && worstDoorM < 0.01 && worstEndM < 0.01 && worstLeaf < 0.01, {doors: nDoorsAll, of_8oct: nDoors8, worst_arc_m: +worstDoorM.toFixed(5), worst_end_m: +worstEndM.toFixed(5), worst_leaf_pt: +worstLeaf.toFixed(5)});
  ok('S4 every water-barrier piece is a PDF piece, and every barrier line vertex a piece-end mid point or the meeting of two (under 0.01 pt)', nLines >= 23 && nPieces >= 240 && worstPiece < 0.01 && worstLineV < 0.01, {lines: nLines, pieces: nPieces, vertices: nLineV, worst_piece_pt: +worstPiece.toFixed(5), worst_line_pt: +worstLineV.toFixed(5)});
  // S4b every part not drawn on the master cites its source and uses the reconciled footprint
  const stdBad = []; let nStd = 0, nConfirm = 0;
  for (const r of withShape) {
    const sh = J.refs[r].shape, s = api.shape(r);
    sh.components.forEach((c, i) => {
      if (!c.standard) return; nStd++;
      const pg = s.components[i];
      if (!pg.source || pg.source === 'master' || pg.source !== c.source) stdBad.push([r, i, 'source']);
      if (c.kind === 'waste_tank') { if (!/same shape as the toilet block, under it/.test(c.source)) stdBad.push([r, i, 'tank source']); return; }
      if (!/^not drawn on the master — footprint from (contract line |footprints_v915\.json "|no source \(size to confirm)/.test(c.source)) stdBad.push([r, i, 'cites', c.source.slice(0, 60)]);
      const f = F.types[c.footprint_key]; if (!f) { stdBad.push([r, i, 'no footprint', c.footprint_key]); return; }
      const want = c.size_written_for_unit ? c.size_written_for_unit.size_m : f.size_m;
      if (c.geometry === 'polyline') { if (Math.abs(c.size_m[0] - c.pieces * f.size_m[0]) > 0.01) stdBad.push([r, i, 'line length']); }
      else if (c.geometry === 'point') { if (f.size_m !== null || !c.confirm) stdBad.push([r, i, 'point']); }
      else if (JSON.stringify(c.size_m) !== JSON.stringify(want)) stdBad.push([r, i, 'size', c.size_m, want]);
      if (c.confirm) { nConfirm++; if (!pg.confirm || !/size to confirm/.test(c.source + ' ' + c.size_state)) stdBad.push([r, i, 'confirm flag']); }
      if (!c.door_note) stdBad.push([r, i, 'door note']);
    });
  }
  ok('S4b every part not drawn on the master cites its source, uses its reconciled footprint, and says "size to confirm" where it is', nStd > 80 && stdBad.length === 0, {standard_parts: nStd, size_to_confirm: nConfirm, bad: stdBad.slice(0, 6)});
  const fBad = Object.entries(F.types).filter(([k, v]) => v.footprint && (!v.why || (v.drawn && v.written && v.disagree_pct > 10 && !v.confirm && !(v.drawn.direct) && v.size_state !== 'the block it sits under')));
  ok('S4b footprints: where the catalogues disagree by more than 10% the drawn size is used only with direct drawing evidence, else "size to confirm"', fBad.length === 0, fBad.map(x => x[0]));
  // S4c waste tanks: their block's own outline, under it, greyed and labelled
  const tanks = []; for (const r of withShape) J.refs[r].shape.components.forEach((c, i) => { if (c.kind === 'waste_tank') tanks.push([r, i, c]); });
  const tankBad = [];
  for (const [r, i, c] of tanks) {
    const blk = J.refs[r].shape.components[c.under];
    if (!blk || blk.kind !== 'toilet_block' || JSON.stringify(blk.poly) !== JSON.stringify(c.poly)) tankBad.push([r, i, 'not the block outline']);
    const full = api.svg(r, {pxPerPt: 7.75}), solo = api.svg(r, {pxPerPt: 7.75, unit: c.units[0]}), sp = svgParts(full), so = svgParts(solo);
    const tk = sp.tanks.find(x => x.i === i); if (!tk || !tk.off || tk.fill !== '#c5ccd0') tankBad.push([r, i, 'map: not offset grey under the block']);
    if (!/>\+ WASTE TANK<\/text>/.test(full)) tankBad.push([r, i, 'map: no "+ WASTE TANK" tag']);
    const ts = so.tanks.find(x => x.i === i); if (!ts || ts.off || !/>WASTE TANK<\/text>/.test(solo) || so.comps.length) tankBad.push([r, i, 'loads: not its own greyed WASTE TANK item']);
    if (!/>\+ WASTE TANK<\/text>/.test(api.svg(r, {pxPerPt: 0.3}))) tankBad.push([r, i, 'label missing when zoomed out']);
  }
  ok('S4c every waste tank (6) is its block\'s own outline, drawn grey under the block with "+ WASTE TANK" on the map and as its own "WASTE TANK" item for loads', tanks.length === 6 && tankBad.length === 0, {tanks: tanks.length, bad: tankBad});
  // S4d water barriers: line shapes, every WB reference
  const wb = Object.keys(J.refs).filter(r => /^WB\d+$/.test(r)), wbBad = [];
  for (const r of wb) {
    const s = api.shape(r); if (!s) { wbBad.push([r, 'none']); continue; }
    if (!s.components.every(c => c.geometry === 'polyline' && c.kind === 'water_barrier')) wbBad.push([r, 'not lines']);
    const sv = svgParts(api.svg(r, {pxPerPt: 2})); if (sv.lines.length !== s.components.length || sv.comps.length) wbBad.push([r, 'svg']);
  }
  ok('S4d every water-barrier reference is a line shape (white-and-yellow pieces), traced where the master draws it', wb.length === 15 && wbBad.length === 0, {refs: wb.length, bad: wbBad});
  // S5-S9 svg geometry (outlines)
  let worstAng = 0, worstRatio = 0, nEdges = 0, minPxBad = [], doorBad = [], choiceBad = [], kSpread = 0, nDoorMarks = 0, wantMarks = 0;
  const cases = [{pxPerPt: 0.23, rot: 0, minPx: 18}, {pxPerPt: 7.75, rot: 0, minPx: 18}, {pxPerPt: 37, rot: 0.61, minPx: 18}, {pxPerPt: 2.5, rot: -2.2, minPx: 40}];
  for (const r of withShape) {
    const s = api.shape(r);
    for (const cs of cases) {
      const svg = api.svg(r, Object.assign({number: 3}, cs)), L = api.layout(r, cs), parts = svgParts(svg), k = parts.scale;
      const cos = Math.cos(cs.rot), sin = Math.sin(cs.rot), ks = [];
      parts.comps.concat(parts.tanks.map(x => Object.assign({}, x))).forEach(pc_ => {
        const src = s.components[pc_.i].poly.map(f => [f[0] * SHEET[0], f[1] * SHEET[1]]);
        for (let e = 0; e < src.length; e++) {
          const a = src[e], b = src[(e + 1) % src.length], v = [b[0] - a[0], b[1] - a[1]], want = [(cos * v[0] - sin * v[1]) * cs.pxPerPt * k, (sin * v[0] + cos * v[1]) * cs.pxPerPt * k];
          const A = pc_.pts[e], B = pc_.pts[(e + 1) % src.length], got = [B[0] - A[0], B[1] - A[1]], Lw = Math.hypot(...want), Lg = Math.hypot(...got);
          if (Lw < 4) continue;   // the page rounds to 0.01 px: compare edges of 4 px and up
          nEdges++;
          const ang = Math.abs(((Math.atan2(got[1], got[0]) - Math.atan2(want[1], want[0])) * 180 / Math.PI + 540) % 360 - 180);
          worstAng = Math.max(worstAng, ang); worstRatio = Math.max(worstRatio, Math.abs(Lg / Lw - 1)); ks.push(Lg / Math.hypot(v[0], v[1]) / cs.pxPerPt);
        }
      });
      if (ks.length > 1) kSpread = Math.max(kSpread, (Math.max(...ks) - Math.min(...ks)) / Math.min(...ks));
      if (L.components.some(c => c.geometry === 'polygon')) {
        const trueShort = L.shortPx / L.scale;
        if (trueShort < cs.minPx ? Math.abs(L.shortPx - cs.minPx) > 0.01 || !(L.scale > 1) : L.scale !== 1) minPxBad.push([r, cs.pxPerPt, L.shortPx, L.scale]);
      } else if (L.scale !== 1) minPxBad.push([r, 'lines scaled']);
      const want = []; s.components.forEach((c, i) => { if (!c.drawn_as) c.doors.forEach(d => want.push(i + ':' + d.edge_index)); });
      wantMarks += want.length;
      const got = parts.doors.filter(d => d.source === 'master');
      if (got.map(d => d.comp + ':' + d.edge).sort().join() !== want.sort().join() || parts.door !== 'master') doorBad.push([r, 'set', want, got.map(d => d.comp + ':' + d.edge)]);
      for (const d of got) {
        nDoorMarks++;
        const poly = parts.comps.find(c => c.i === d.comp).pts, a = poly[d.edge], b = poly[(d.edge + 1) % poly.length];
        const mid = [(d.bar[0] + d.bar[2]) / 2, (d.bar[1] + d.bar[3]) / 2], cen = centroid(poly), ev = [b[0] - a[0], b[1] - a[1]], el = Math.hypot(...ev);
        const ar = [d.arrow[2] - d.arrow[0], d.arrow[3] - d.arrow[1]], al = Math.hypot(...ar);
        const onEdge = segDist(mid, a, b), square = Math.abs((ar[0] * ev[0] + ar[1] * ev[1]) / (al * el)), outward = ((mid[0] - cen[0]) * ar[0] + (mid[1] - cen[1]) * ar[1]) > 0;
        if (onEdge > 0.06 || square > 0.02 || !outward) doorBad.push([r, d.comp, d.edge, +onEdge.toFixed(3), +square.toFixed(4), outward]);
      }
      // a chosen edge wins over the master's door (on the first drawn outline)
      const c0i = s.components.findIndex(c => c.geometry === 'polygon' && !c.drawn_as);
      if (c0i >= 0) {
        const c0 = s.components[c0i];
        for (let e = 0; e < c0.poly.length; e++) {
          const sv = api.svg(r, Object.assign({door: {component: c0i, edge: e}}, cs)), pp = svgParts(sv), dd = pp.doors;
          const pl = pp.comps.find(c => c.i === c0i) || pp.tanks.find(c => c.i === c0i), poly = pl.pts.map(q => pl.off ? q : q), a = poly[e], b = poly[(e + 1) % poly.length];
          const good = pp.door === 'choice' && dd.length === 1 && dd[0].source === 'choice' && dd[0].edge === e && !dd[0].swing && segDist([(dd[0].bar[0] + dd[0].bar[2]) / 2, (dd[0].bar[1] + dd[0].bar[3]) / 2], a, b) < 0.06;
          if (!good) choiceBad.push([r, e, cs.pxPerPt]);
        }
      }
      if (api.svg(r, Object.assign({door: 'none'}, cs)).includes('ms915-door"')) choiceBad.push([r, 'none']);
    }
  }
  ok('S5 svg keeps every edge\'s direction (rotation exact)', nEdges > 1000 && worstAng < 0.5, {edges: nEdges, worst_deg: +worstAng.toFixed(4)});
  ok('S5 svg keeps every edge\'s length ratio (aspect exact)', worstRatio < 0.01, {worst_relative: +worstRatio.toFixed(5)});
  ok('S6 scaling is uniform: one factor for every edge of every part', kSpread < 0.01, {spread: +kSpread.toFixed(5)});
  ok('S6 under minPx the shape is scaled up to exactly minPx, otherwise true size (barrier lines never scaled)', minPxBad.length === 0, minPxBad.slice(0, 5));
  ok('S7 the door mark sits on the master\'s door edge, square to it, pointing out', doorBad.length === 0 && nDoorMarks === wantMarks && nDoorMarks >= 117 * cases.length, {marks: nDoorMarks, bad: doorBad.slice(0, 5)});
  ok('S8 a chosen edge replaces the master\'s door; door:\'none\' draws none', choiceBad.length === 0, choiceBad.slice(0, 5));
  let worstProj = 0, unplacedBad = [];
  const cam = {s: 7.7508, rot: 0.37, W: 1032, H: 420, cx: 1200, cy: 300};
  const project = f => { const a = cam.s * Math.cos(cam.rot), b = cam.s * Math.sin(cam.rot), X = f[0] * 2384, Y = f[1] * 1684; return [a * X - b * Y + cam.W / 2 - a * cam.cx + b * cam.cy, b * X + a * Y + cam.H / 2 - b * cam.cx - a * cam.cy]; };
  for (const r of withShape) {
    const A = api.layout(r, {project, minPx: 18}), B = api.layout(r, {pxPerPt: cam.s, rot: cam.rot, minPx: 18});
    if (!api.placed(r)) { if (A !== null || api.shape(r).centroid !== null) unplacedBad.push(r); continue; }
    A.components.forEach((c, i) => c.poly.forEach((q, j) => { worstProj = Math.max(worstProj, Math.hypot(q[0] - B.components[i].poly[j][0], q[1] - B.components[i].poly[j][1])); }));
  }
  ok('S9 project() (the explorer camera) and pxPerPt + rot draw the same shape', worstProj < 1e-6, {worst_px: worstProj});
  ok('S9 a reference with no position on the master, MASTER_LOC or a record pin is never put on the map (shape for loads only)', unplacedBad.length === 0, unplacedBad);
  const big = api.layout('P01', {pxPerPt: 37, number: 1}), small = api.layout('WC24', {pxPerPt: 0.5, number: 12});
  ok('S10 the number badge stays readable (radius 11 px at any zoom)', big.badge.r === 11 && small.badge.r === 11 && big.badge.inside && !small.badge.inside);
  // S11 one unit at a time; S12 styles: traced solid, standard dashed, each kind recognisable
  const oneBad = [];
  for (const r of withShape) for (const u of api.units(r)) {
    if (!u.components.length) continue;
    const pp = svgParts(api.svg(r, {unit: u.n, pxPerPt: 7.75}));
    if (pp.unit !== String(u.n) || pp.parts.map(p => p.i).sort().join() !== u.components.slice().sort().join()) oneBad.push([r, u.n]);
  }
  ok('S11 svg(ref, {unit}) draws that unit and nothing else', oneBad.length === 0, oneBad.slice(0, 5));
  const styleBad = [];
  for (const r of withShape) {
    const s = api.shape(r), pp = svgParts(api.svg(r, {pxPerPt: 7.75}));
    pp.comps.forEach(c => { const sc = s.components[c.i]; if (!!sc.standard !== c.dashed) styleBad.push([r, c.i, 'dash']); });
    pp.lines.forEach(c => { const sc = s.components[c.i]; if (!!sc.standard !== c.dashed) styleBad.push([r, c.i, 'line dash']); });
    pp.parts.forEach(p => { if ((p.source === 'master') !== (s.components[p.i].source === 'master')) styleBad.push([r, p.i, 'source attr']); });
  }
  const glyph = (ref, g, o) => new RegExp('data-glyph="' + g + '"').test(api.svg(ref, Object.assign({pxPerPt: 12}, o || {})));
  ok('S12 traced parts are solid, parts not drawn on the master dashed (outlines and barrier lines)', styleBad.length === 0, styleBad.slice(0, 5));
  ok('S12 each kind is recognisable: FWF circle, accessible-toilet sign, generator diagonal, barrier white-and-yellow, tags', glyph('WC24', 'fwf') && glyph('PG01', 'fwf') && glyph('WC01', 'accessible') &&
    /data-type="line"/.test(api.svg('GN13', {pxPerPt: 12})) && glyph('GN25', 'generator') && /ms915-piece/.test(api.svg('WB14', {pxPerPt: 30})) && /ms915-piece-w/.test(api.svg('WB06', {pxPerPt: 0.5})) &&
    />VMS<\/text>/.test(api.svg('T0158', {pxPerPt: 12, unit: 1})) && />LT<\/text>/.test(api.svg('LTC01', {pxPerPt: 12})) && /ms915-point/.test(api.svg('GN23', {pxPerPt: 12})));
  return {api, J};
}

async function browserTests() {
  const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
  // MS915_CACHE_TRIM=1: keep the test rig's fetch cache (GC500_CACHE, a fresh temporary folder) small on a full disk by
  // dropping entries older than 20 s; a dropped entry is simply fetched again (GET only).
  if (process.env.MS915_CACHE_TRIM && process.env.GC500_CACHE) {
    const dir = process.env.GC500_CACHE;
    setInterval(() => { try { const now = Date.now(); for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.json')) continue; const j = path.join(dir, f);
      try { if (now - fs.statSync(j).mtimeMs > 20000) { fs.unlinkSync(j); try { fs.unlinkSync(j.slice(0, -5) + '.body'); } catch (_) {} } } catch (_) {} } } catch (_) {} }, 3000).unref();
  }
  const phone = DEV === 'phone', geo = phone ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900};
  const norm = t => t.replace(/\d{1,2}:\d{2}(:\d{2})?(\s?(am|pm|AEST))?/gi, '#:#').replace(/\b\d+\s?(s|sec|secs|seconds?|min|mins|minutes?|h|hrs?|hours?)\s+ago\b/gi, '# ago').replace(/\s+/g, ' ').trim();
  const runOne = async (file, label) => {
    const s = await open(Object.assign({pageFile: file}, geo)), p = s.page, cons = [];
    p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200) + ((m.location() || {}).url ? ' @ ' + m.location().url.replace(/[?#].*$/, '').slice(0, 120) : '')); });
    await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 180000});
    await p.waitForTimeout(4000);
    return {s, p, cons, label};
  };
  const tabText = async (P) => { const tabs = await P.evaluate(() => TABS.map(t => t[0])), out = {};
    for (const t of tabs) { await P.evaluate(k => { try { go(k); } catch (e) { window.__goerr = String(e && e.message); } }, t); await P.waitForTimeout(t === 'map' ? 6000 : 1800);
      out[t] = await P.evaluate(k => { const pane = document.getElementById('pane-' + k); return pane ? pane.innerText : ''; }, t); }
    return out; };
  const J = readJ('shapes_v915.json');
  const nShapes = Object.values(J.refs).filter(e => e.shape).length, nNone = Object.values(J.refs).filter(e => !e.shape).length;
  const B = await runOne(PAGE, 'build'); let textB, errsB, consB, countsB;
  try {
    const g = await B.p.evaluate(() => ({has: typeof window.MasterShapes915 === 'object' && window.MasterShapes915 === MasterShapes915, n: MasterShapes915.refs().length, meta: MasterShapes915.meta(), p67: MasterShapes915.shape('P67')}));
    ok('B1 window.MasterShapes915 is on the page, every item counted', g.has && g.n === nShapes && g.meta.shapes === nShapes && g.meta.none === nNone && g.meta.counts.units === J.meta.counts_9oct.units, {n: g.n, meta: g.meta});
    ok('B1 P67 is the master\'s 6 x 3 m building with its door', g.p67 && g.p67.components.length === 1 && g.p67.components[0].size_m[0] === 6 && g.p67.components[0].door && g.p67.components[0].door.faces === 'north');
    const r = await B.p.evaluate(() => {
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none'; document.body.appendChild(host);
      let bad = [], worst = 0, n = 0, markers = 0;
      const check = (ref, o) => {
        const str = MasterShapes915.svg(ref, o), doc = new DOMParser().parseFromString(str, 'image/svg+xml'); markers++;
        if (doc.querySelector('parsererror')) { bad.push(ref + ' parse'); return; }
        host.innerHTML = str; const svg = host.firstElementChild, L = MasterShapes915.layout(ref, o);
        svg.querySelectorAll('polygon.ms915-comp').forEach(pg => { const i = +pg.dataset.i, c = L.components.find(x => x.i === i), pts = pg.points; for (let j = 0; j < pts.numberOfItems; j++) { const q = pts.getItem(j); n++; worst = Math.max(worst, Math.hypot(q.x - c.poly[j][0], q.y - c.poly[j][1])); } });
        svg.querySelectorAll('polyline.ms915-line').forEach(pg => { const i = +pg.dataset.i, c = L.components.find(x => x.i === i), pts = pg.points; for (let j = 0; j < pts.numberOfItems; j++) { const q = pts.getItem(j); n++; worst = Math.max(worst, Math.hypot(q.x - c.poly[j][0], q.y - c.poly[j][1])); } });
        const bb = svg.getBoundingClientRect(); if (Math.abs(bb.width - L.width) > 1 || Math.abs(bb.height - L.height) > 1) bad.push(ref + ' size');
      };
      for (const ref of MasterShapes915.refs()) {
        for (const o of [{pxPerPt: 7.75, number: 1}, {pxPerPt: 0.3, number: 2, selected: true, rot: 1.1}, {pxPerPt: 30, number: 3, door: 0}]) check(ref, o);
        for (const u of MasterShapes915.units(ref)) if (u.components.length) check(ref, {pxPerPt: 7.75, unit: u.n, number: 4});
      }
      host.remove();
      return {bad, worst, n, markers, left: document.querySelectorAll('.ms915-marker').length};
    });
    ok('B2 every marker, and every unit\'s own marker, parses and renders in the browser with the computed geometry', r.bad.length === 0 && r.worst < 0.01 && r.n > 3000 && r.left === 0, r);
    const sheet = async (name, rows) => {
      const shot = path.join(HERE, 'evidence', 'markers_' + name + '_' + (phone ? 'phone' : 'laptop') + '.png');
      await B.p.evaluate(rows => {
        const host = document.createElement('div'); host.id = 'ms915-test-sheet';
        host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#e9eef0;overflow:auto;padding:10px;font:12px system-ui;display:flex;flex-wrap:wrap;gap:10px;align-content:flex-start';
        host.innerHTML = rows.map(([ref, cap, opts]) => '<div style="background:#fff;border:1px solid #ccd;padding:6px;border-radius:6px;max-width:100%"><b>' + ref + '</b> ' + cap + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          opts.map(o => MasterShapes915.svg(ref, o) || '').join('') + '</div></div>').join('');
        document.body.appendChild(host);
      }, rows);
      await B.p.waitForTimeout(300); await B.p.screenshot({path: shot, fullPage: false});
      await B.p.evaluate(() => document.getElementById('ms915-test-sheet').remove());
      return shot;
    };
    const s1 = await sheet('refs', [['P25', 'door', [{number: 1, selected: true, pxPerPt: 0.6}, {number: 1, pxPerPt: 7.75}, {number: 1, pxPerPt: 7.75, rot: 0.5}, {number: 1, pxPerPt: 7.75, door: 3}]],
      ['WC09', 'blocks, FWF, pee panels', [{number: 5, pxPerPt: 7.75}]], ['WC31', '16 pan + accessible', [{number: 8, pxPerPt: 7.75}]], ['GN20', 'generator', [{number: 7, pxPerPt: 7.75}]], ['P27', 'block, unit 1', [{number: 9, pxPerPt: 7.75, unit: 1}]]]);
    const s2 = await sheet('items', [['WC20', 'blocks + tanks under (map) and tank 1 alone (loads)', [{number: 1, pxPerPt: 7.75}, {number: 1, pxPerPt: 1.2}, {number: 1, pxPerPt: 7.75, unit: 3}]],
      ['WB06', 'barrier lines', [{number: 2, pxPerPt: 0.5}]], ['WB14', 'barrier pieces', [{number: 3, pxPerPt: 30}]], ['WB02', 'not drawn: standard line', [{number: 4, pxPerPt: 1.5}]],
      ['WC45', '7 traced + 1 standard', [{number: 5, pxPerPt: 7.75}]], ['GN23', 'generator + DB (no size)', [{number: 6, pxPerPt: 7.75}]], ['GN25', 'generator not drawn', [{number: 7, pxPerPt: 7.75}]],
      ['T0158', 'VMS (not placed)', [{number: 8, pxPerPt: 2}]], ['LTC01', 'light tower', [{number: 9, pxPerPt: 7.75}]], ['T0266', 'container + doors', [{number: 10, pxPerPt: 7.75}]], ['WC01', 'accessible + FWF', [{number: 11, pxPerPt: 12}]]]);
    ok('B3 marker pictures saved for review', fs.existsSync(s1) && fs.existsSync(s2), [s1, s2]);
    textB = await tabText(B.p);
  } finally { errsB = B.s.errors.slice(); consB = B.cons.slice(); countsB = Object.assign({}, B.s.counts); await B.s.browser.close(); }
  const A = await runOne(BASE, 'base'); let textA, errsA, consA, countsA;
  try {
    ok('B1 the base page has no MasterShapes915', !(await A.p.evaluate(() => typeof window.MasterShapes915 !== 'undefined')));
    textA = await tabText(A.p);
  } finally { errsA = A.s.errors.slice(); consA = A.cons.slice(); countsA = Object.assign({}, A.s.counts); await A.s.browser.close(); }
  const tabs = Object.keys(textB);
  ok('B4 same tabs', JSON.stringify(tabs) === JSON.stringify(Object.keys(textA)), tabs.length);
  const diffs = [];
  for (const t of tabs) {
    const tb = textB[t], ta = textA[t] || '';
    if (norm(tb) !== norm(ta)) {
      const lb = tb.split('\n').map(norm), la = ta.split('\n').map(norm);
      const onlyB = lb.filter(x => !la.includes(x)), onlyA = la.filter(x => !lb.includes(x));
      diffs.push({tab: t, build_len: tb.length, base_len: ta.length, only_build: onlyB.slice(0, 4), only_base: onlyA.slice(0, 4)});
    }
  }
  ok('B4 visible text of every tab is the same on base and build', diffs.length === 0, {tabs: tabs.length, diffs});
  ok('B5 no page errors on the build', errsB.length === 0, {build: errsB.slice(0, 5), base: errsA.slice(0, 5)});
  const newCons = consB.filter(c => !consA.includes(c));
  ok('B5 no console errors the base page does not also show', newCons.length === 0, {build: consB.length, base: consA.length, new: newCons.slice(0, 5)});
  ok('B6 0 blocked writes (nothing tried to change the record)', countsB.blocked === 0 && countsA.blocked === 0, {build: countsB, base: countsA});
}

(async () => {
  if (mode === 'static') staticTests();
  else if (mode === 'browser') { staticTests(); await browserTests(); }
  else { console.error('usage: node tests/test_shapes915.cjs static|browser <build.html> <base.html> [laptop|phone]'); process.exit(2); }
  const out = {mode, device: DEV || null, page: path.basename(PAGE), page_sha256: sha(fs.readFileSync(PAGE)), pass: results.filter(r => r.pass).length, total: results.length, results};
  console.log(JSON.stringify(out, null, 1));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
