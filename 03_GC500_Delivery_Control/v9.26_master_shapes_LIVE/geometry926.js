/* Author: Andrew Fisher. v9.26 master shapes, every item: each unit's footprint and door side, as the 2 Oct master
   (D001-26003-03) draws it where it is drawn, else its catalogue footprint (dashed), in the MASTER_LOC.pt frame, plus a
   drawing helper for map markers and Arrange loads. Read only: it reads its own data block (MASTER_SHAPES926_DATA) and
   nothing else, and writes nothing. */
const MasterShapes926 = (() => {
  'use strict';
  const SHEET = [2384, 1684];
  let D = null;
  function data() {
    if (D) return D;
    try { D = typeof MASTER_SHAPES926_DATA === 'object' && MASTER_SHAPES926_DATA ? MASTER_SHAPES926_DATA : {}; } catch (e) { D = {}; }
    ['shapes', 'none', 'none_units', 'foot', 'counts'].forEach(k => { D[k] = D[k] || {}; });
    ['sym', 'notes', 'src', 'types', 'items'].forEach(k => { D[k] = D[k] || []; });
    return D;
  }
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const cp = v => JSON.parse(JSON.stringify(v));
  const sp = f => [f[0] * SHEET[0], f[1] * SHEET[1]];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const r2 = v => Math.round(v * 100) / 100;
  const MPT = () => data().m_per_pt || 0.705556;
  function rec(ref) { const d = data(); return own(d.shapes, ref) ? d.shapes[ref] : null; }
  const geom = c => c.g === 'l' ? 'polyline' : c.g === 'o' ? 'point' : 'polygon';
  const isPoly = c => !c.g;
  const SRCU = {m: 'master', s: 'standard', t: 'under its block', x: 'cancelled'};
  function door(c, d) {
    const n = c.p.length;
    return {edge_index: d.e, edge: [c.p[d.e], c.p[(d.e + 1) % n]], at: d.t, mid: d.m, outward: d.o, faces: d.f, bearing_deg: d.b,
      width_m: d.w, opens: 'outward', symbol: data().sym[d.y] || '', swing: {hinge: d.h, arc: d.q, leaf: d.v, arcs: d.arcs || [d.q], leaves: d.leaves || [d.v], landing: d.g || null}};
  }
  function unitOut(ref, s, u) {
    const d = data(), cs = (u.c || []).map(i => s && s.c[i]).filter(Boolean), c0 = cs[0];
    const doors = [];
    cs.forEach(c => c.d.forEach(x => doors.push({faces: x.f, bearing_deg: x.b, edge_index: x.e, at: x.t})));
    return {ref, n: u.n, type: d.types[u.t] || '', item: d.items[u.it] || '', type_index: u.x == null ? null : u.x, owner: u.o || null,
      number: u.no || null, loading_id: u.l || null, components: (u.c || []).slice(), source: SRCU[u.s] || u.s, cancelled: !!u.cx,
      pieces: u.pc || null, note: u.nt == null ? null : d.notes[u.nt], under_block_unit: u.ub || null,
      kind: c0 ? c0.k : null, standard: c0 ? !!c0.st : null, size_m: c0 ? c0.z : null, confirm: cs.some(c => c.cf),
      size_state: c0 && c0.ss != null ? d.notes[c0.ss] : (c0 ? 'traced on the master' : null),
      component_source: c0 ? (c0.s == null ? 'master' : d.src[c0.s]) : null,
      door: doors.length ? doors[0] : null, doors, door_note: c0 ? d.notes[c0.n] || '' : ''};
  }
  function shape(ref) {
    const s = rec(ref); if (!s) return null; const d = data();
    return cp({ref, how: d.how || '', placed: s.pl !== 0, place_note: s.pn == null ? null : d.notes[s.pn], cancelled: s.cx == null ? null : d.notes[s.cx],
      centroid: s.pl === 0 ? null : s.k, door_summary: s.s, note: s.x || null, units: (s.u || []).map(u => unitOut(ref, s, u)),
      components: s.c.map(c => ({kind: c.k, label: c.l, source: c.s == null ? 'master' : d.src[c.s], standard: !!c.st, geometry: geom(c),
        poly: c.p, centroid: c.c, size_m: c.z, angle_deg: c.a, confirm: !!c.cf, size_state: c.ss == null ? (c.st ? null : 'traced on the master') : d.notes[c.ss],
        units: c.u || [], under: c.un == null ? null : c.un, pieces: c.pc || null, match_confidence: {h: 'high', m: 'medium', l: 'low'}[c.mc] || null,
        drawn_as: c.dup || null, place_note: c.pn == null ? null : d.notes[c.pn],
        door: c.di >= 0 ? door(c, c.d[c.di]) : null, doors: c.d.map(x => door(c, x)), door_note: d.notes[c.n] || '',
        marks: c.m.map(m => ({type: m.y, lines: m.l || null, poly: m.p || null, edge_index: m.e == null ? null : m.e, colour: m.co === 'y' ? 'yellow' : m.co === 'w' ? 'white' : null}))}))});
  }
  function findUnit(s, key) {
    if (!s || key == null || key === '') return null; const us = s.u || [], d = data();
    if (typeof key === 'number') return us.find(u => u.n === key) || null;
    const k = String(key).trim();
    if (/^\d+$/.test(k) && us.some(u => u.n === +k) && !us.some(u => u.no === k)) return us.find(u => u.n === +k);
    return us.find(u => u.l === k) || us.find(u => u.no === k) || us.find(u => u.no && String(u.no).split(/[\s(]/)[0] === k.replace(/^u/, '')) ||
      us.find(u => (d.types[u.t] + '#' + u.x) === k) || null;
  }
  function units(ref) {
    const s = rec(ref), d = data();
    if (s) return (s.u || []).map(u => unitOut(ref, s, u));
    if (own(d.none_units, ref)) return d.none_units[ref].map(u => unitOut(ref, null, u));
    return [];
  }
  function unit(ref, key) {
    const s = rec(ref); if (s) { const u = findUnit(s, key); return u ? unitOut(ref, s, u) : null; }
    const d = data(); if (!own(d.none_units, ref)) return null;
    const u = findUnit({u: d.none_units[ref]}, key); return u ? unitOut(ref, null, u) : null;
  }
  function reason(ref) {
    const d = data();
    if (rec(ref)) return null;
    if (own(d.none, ref)) return d.none[ref];
    return 'not a reference on this page';
  }
  function footprint(key) { const f = data().foot[key]; return f ? {key, size_m: f[0], size_state: f[1], confirm: !!f[2], why: f[3]} : null; }
  const refs = () => Object.keys(data().shapes).sort();
  function areaPt(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const p = sp(poly[i]), q = sp(poly[(i + 1) % poly.length]); a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  // what to draw: every unit's part (never a part drawn under another reference twice), or one unit
  function pick(s, o) {
    if (Array.isArray(o.components)) {
      const idx = [...new Set(o.components)].filter(i => Number.isInteger(i) && i >= 0 && i < s.c.length);
      return idx.length ? {idx, unit:null, solo:!o.context} : null;
    }
    if (o.unit != null && o.unit !== '') {
      const u = findUnit(s, o.unit); if (!u || !u.c || !u.c.length) return null;
      return {idx: u.c.slice(), unit: u, solo: true};
    }
    const idx = []; s.c.forEach((c, i) => { if (!c.dup) idx.push(i); });
    return {idx, unit: null, solo: false};
  }
  // which component the picker's "edge n" means: the first drawn part with a door, else the largest outline
  function primary(s, idx) {
    idx = idx || s.c.map((c, i) => i);
    const i = idx.find(k => s.c[k].d.length && isPoly(s.c[k])); if (i != null) return i;
    let b = -1; idx.forEach(k => { if (isPoly(s.c[k]) && (b < 0 || areaPt(s.c[k].p) > areaPt(s.c[b].p))) b = k; }); return b < 0 ? idx[0] : b;
  }
  function layout(ref, o) {
    o = o || {}; const s = rec(ref); if (!s) return null;
    const sel = pick(s, o); if (!sel) return null;
    if (typeof o.project === 'function' && s.pl === 0) return null;   // not placed: no position on the map
    const inSel = new Set(sel.idx);
    // the anchor: the shape's centroid (whole reference) or the unit's own centre
    let K = s.k;
    if (sel.solo) { let x = 0, y = 0; sel.idx.forEach(i => { x += s.c[i].c[0]; y += s.c[i].c[1]; }); K = [x / sel.idx.length, y / sel.idx.length]; }
    let proj, ppt = +o.pxPerPt, rot = o.rot != null ? +o.rot : (o.rotDeg != null ? +o.rotDeg * Math.PI / 180 : 0);
    if (typeof o.project === 'function') {
      const pc = o.project(K); proj = f => { const q = o.project(f); return [q[0] - pc[0], q[1] - pc[1]]; };
    } else {
      if (!(ppt > 0)) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; sel.idx.forEach(i => s.c[i].p.forEach(f => { const q = sp(f); x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }));
        ppt = (+o.sizePx > 0 ? +o.sizePx : 56) / Math.max(x1 - x0, y1 - y0, 4 / MPT()); }
      const C = sp(K), cs = Math.cos(rot), sn = Math.sin(rot);
      proj = f => { const q = sp(f), x = (q[0] - C[0]) * ppt, y = (q[1] - C[1]) * ppt; return [cs * x - sn * y, sn * x + cs * y]; };
    }
    // the minimum size: the short side of the largest drawn outline, on screen; below minPx the whole shape is scaled up
    // uniformly about its anchor (never squashed). Barrier lines and markers keep their true place (lines get a minimum stroke).
    const polys = sel.idx.filter(i => isPoly(s.c[i]));
    let shortPx = null;
    if (polys.length) {
      let big = polys[0]; polys.forEach(k => { if (areaPt(s.c[k].p) > areaPt(s.c[big].p)) big = k; });
      const bp = s.c[big].p.map(proj);
      if (bp.length === 4) shortPx = Math.min((len(bp[0], bp[1]) + len(bp[2], bp[3])) / 2, (len(bp[1], bp[2]) + len(bp[3], bp[0])) / 2);
      else { shortPx = 1e9; for (let i = 0; i < bp.length; i++) shortPx = Math.min(shortPx, len(bp[i], bp[(i + 1) % bp.length])); }
    }
    const minPx = o.minPx == null ? 18 : +o.minPx;
    const k = shortPx != null && shortPx > 1e-9 && shortPx < minPx ? minPx / shortPx : 1;
    const P = f => { const q = proj(f); return [q[0] * k, q[1] * k]; };
    // pixels per metre on screen (uniform for pxPerPt + rot; measured along x for a projection)
    const pxPerM = (() => { const a = P(K), b = P([K[0] + 1 / SHEET[0], K[1]]); return len(a, b) / MPT(); })();
    const hasUnits = (s.u || []).some(u => u.c && u.c.length);
    const comps = sel.idx.map(i => {
      const c = s.c[i];
      const role = c.k === 'waste_tank' ? (sel.solo ? 'tank' : 'tank-under') : (!sel.solo && hasUnits && !(c.u && c.u.length) ? 'context' : 'unit');
      return {i, kind: c.k, geometry: geom(c), standard: !!c.st, confirm: !!c.cf, role, units: c.u || [], poly: c.p.map(P), centroid: P(c.c),
        source: c.s == null ? 'master' : data().src[c.s], pieces: c.pc || null, under: c.un == null ? null : c.un,
        lineWidthPx: c.g === 'l' ? Math.max(3, (c.pw || 0.5) * pxPerM) : null, pieceLenPx: c.g === 'l' ? (c.pl || 2.0) * pxPerM : null,
        marks: c.m.map(m => ({type: m.y, colour: m.co || null, lines: (m.l || []).map(l => [P(l[0]), P(l[1])]), poly: m.p ? m.p.map(P) : null})),
        doors: c.d.map(d => ({edge: d.e, at: d.t, mid: P(d.m), out: (() => { const a = P(d.m), q0 = sp(d.m), b = P([(q0[0] + d.o[0]) / SHEET[0], (q0[1] + d.o[1]) / SHEET[1]]); const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; })(),
          widthPx: d.w / MPT() * (len(P(c.p[d.e]), P(c.p[(d.e + 1) % c.p.length])) / (len(sp(c.p[d.e]), sp(c.p[(d.e + 1) % c.p.length])) || 1)),
          hinge: P(d.h), arc: d.q.map(P), leaf: d.v.map(P), arcs:(d.arcs||[d.q]).map(q=>q.map(P)), leaves:(d.leaves||[d.v]).map(q=>q.map(P)), landing: d.g ? d.g.map(l => [P(l[0]), P(l[1])]) : null, faces: d.f}))};
    });
    const byI = {}; comps.forEach(c => { byI[c.i] = c; });
    // which door marks to draw: the master's, none, or the chosen edge
    let pk = o.door == null ? 'master' : o.door, chosen = null;
    if (typeof pk === 'number' || (pk && typeof pk === 'object')) {
      const ci = typeof pk === 'number' ? primary(s, sel.idx) : (+pk.component || 0), ei = typeof pk === 'number' ? pk : +pk.edge;
      const c = byI[ci];
      if (c && c.geometry === 'polygon' && ei >= 0 && ei < c.poly.length && Number.isInteger(ei)) {
        const a = c.poly[ei], b = c.poly[(ei + 1) % c.poly.length], t = pk.at == null ? 0.5 : Math.max(0, Math.min(1, +pk.at));
        const mid = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], L = len(a, b) || 1; let out = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
        if ((mid[0] - c.centroid[0]) * out[0] + (mid[1] - c.centroid[1]) * out[1] < 0) out = [-out[0], -out[1]];
        chosen = {component: ci, edge: ei, at: t, mid, out, along: [(b[0] - a[0]) / L, (b[1] - a[1]) / L], edgeLen: L,
          pxPerM: L / ((len(sp(s.c[ci].p[ei]), sp(s.c[ci].p[(ei + 1) % c.poly.length])) || 1) * MPT())};
        pk = 'choice';
      } else pk = 'master';
    } else if (pk !== 'none') pk = 'master';
    // bounds (shapes, lines, markers, swings, door arrows, the waste-tank offset and tag) and the number badge
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const grow = q => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); };
    const tankOff = 0; // Tanks share the exact block position; the label identifies the layer below.
    const tags = [];
    comps.forEach(c => {
      if (c.geometry === 'point') { grow([c.centroid[0] - 12, c.centroid[1] - 10]); grow([c.centroid[0] + 12, c.centroid[1] + 10]); return; }
      const w = c.geometry === 'polyline' ? c.lineWidthPx / 2 + 2 : 0;
      c.poly.forEach(q => { grow([q[0] - w, q[1] - w]); grow([q[0] + w, q[1] + w]); });
      if (c.role === 'tank-under') c.poly.forEach(q => grow([q[0] + tankOff, q[1] + tankOff]));
      if (pk === 'master') c.doors.forEach(d => { d.arcs.flat().forEach(grow); d.leaves.flat().forEach(grow); grow([d.mid[0] + d.out[0] * 20, d.mid[1] + d.out[1] * 20]); });
    });
    // "+ WASTE TANK" under each block that has its tank under it (map view); "WASTE TANK" on the tank drawn alone (Arrange loads):
    // along the tank, inside it, when it fits and the number badge is not in its middle, else in a tag just below it
    const badgeR = +o.badgeR > 0 ? +o.badgeR : 11, shortNow = shortPx == null ? 0 : shortPx * k;
    const badgeIn = o.number != null && o.number !== '' && shortNow >= 2 * badgeR + 6;
    comps.forEach(c => {
      if (c.role !== 'tank-under' && c.role !== 'tank') return;
      const off = c.role === 'tank-under' ? tankOff : 0, Q = c.poly.map(q => [q[0] + off, q[1] + off]);
      const text = c.role === 'tank' ? 'WASTE TANK' : '+ WASTE TANK', fs = 10, w = text.length * fs * 0.72 + 10, h = fs + 6;
      const cx = c.centroid[0] + off, cy = c.centroid[1] + off;
      if (c.role === 'tank' && Q.length === 4 && !badgeIn) {
        const e0 = len(Q[0], Q[1]), e1 = len(Q[1], Q[2]), E = e0 >= e1 ? [Q[0], Q[1]] : [Q[1], Q[2]], lng = Math.max(e0, e1), sht = Math.min(e0, e1);
        let ang = Math.atan2(E[1][1] - E[0][1], E[1][0] - E[0][0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
        const fsi = Math.min(11, sht * 0.42);
        if (fsi >= 7 && text.length * fsi * 0.62 <= lng * 0.88) { tags.push({x: cx, y: cy, rot: Math.round(ang * 100) / 100, fs: Math.round(fsi * 100) / 100, text, inside: true, of: c.i}); return; }
      }
      let x = cx - w / 2, y = Math.max(...Q.map(q => q[1])) + 3;
      while (tags.some(t => !t.inside && x < t.x + t.w && x + w > t.x && y < t.y + t.h && y + h > t.y)) y += h + 2;
      tags.push({x, y, w, h, text, fs, inside: false, of: c.i}); grow([x, y]); grow([x + w, y + h]);
    });
    if (chosen) grow([chosen.mid[0] + chosen.out[0] * 16, chosen.mid[1] + chosen.out[1] * 16]);
    let badge = null;
    if (o.number != null && o.number !== '') {
      const inside = shortNow >= 2 * badgeR + 6;
      badge = inside ? {x: 0, y: 0, r: badgeR, inside: true} : {x: x1 + badgeR * 0.7, y: y0 - badgeR * 0.7, r: badgeR, inside: false};
      grow([badge.x - badge.r - 2, badge.y - badge.r - 2]); grow([badge.x + badge.r + 2, badge.y + badge.r + 2]);
    }
    const pad = 3; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    return {ref, unit: sel.unit ? sel.unit.n : null, at: K, placed: s.pl !== 0, scale: k, minPx, shortPx: shortNow, pxPerM,
      pxPerPt: typeof o.project === 'function' ? null : ppt, rot: typeof o.project === 'function' ? null : rot,
      box: [x0, y0, x1, y1], width: x1 - x0, height: y1 - y0, anchor: [-x0, -y0], components: comps, door: pk, chosen, badge, tags, tankOff};
  }
  const pts = a => a.map(q => r2(q[0]) + ',' + r2(q[1])).join(' ');
  function arrow(mid, out, len_, color, cls, attrs) {
    const tip = [mid[0] + out[0] * len_, mid[1] + out[1] * len_], n = [-out[1], out[0]], hb = [tip[0] - out[0] * 5, tip[1] - out[1] * 5];
    const head = pts([tip, [hb[0] + n[0] * 3.6, hb[1] + n[1] * 3.6], [hb[0] - n[0] * 3.6, hb[1] - n[1] * 3.6]]);
    return '<g class="' + cls + '"' + attrs + '><line x1="' + r2(mid[0]) + '" y1="' + r2(mid[1]) + '" x2="' + r2(hb[0]) + '" y2="' + r2(hb[1]) + '" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>' +
      '<polygon points="' + head + '" fill="#ffffff" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<line x1="' + r2(mid[0]) + '" y1="' + r2(mid[1]) + '" x2="' + r2(hb[0]) + '" y2="' + r2(hb[1]) + '" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<polygon points="' + head + '" fill="' + color + '"/></g>';
  }
  const TAG = {toilet: 'FWF', accessible_toilet: '', generator: 'GEN', light_tower: 'LT', vms_board: 'VMS', forklift: 'FL', fwf_trailer: 'FWF TRL',
    container: 'CONT', trakmat: 'MAT', distribution_board: 'DB', pee_panel: '', building: '', toilet_block: '', waste_tank: ''};
  function words(c) {
    const d = data(), parts = [];
    parts.push(c.kind === 'waste_tank' ? 'WASTE TANK' : c.kind.replace(/_/g, ' '));
    parts.push(c.source === 'master' ? 'traced from the 2 Oct master' : c.source);
    if (c.confirm) parts.push('size to confirm');
    return parts.join(' · ');
  }
  function svg(ref, o) {
    o = o || {}; const L = layout(ref, o); if (!L) return null;
    const sel = !!o.selected, fill = sel ? '#ff852f' : '#183541', ink = sel ? '#142d36' : '#ffffff', doorInk = '#d62d20', edge = sel ? '#142d36' : '#ffffff';
    const s = rec(ref), sc = L.scale;
    const drawnDoors=L.components.flatMap(c=>c.doors), doorSummary=L.door==='none'?'unit shape reference; door position not assigned':drawnDoors.length?(drawnDoors.length+' master door'+(drawnDoors.length===1?'':'s')+', facing '+[...new Set(drawnDoors.map(d=>d.faces))].join(' / ')):'No door drawn for this shape';
    let out = '<svg xmlns="http://www.w3.org/2000/svg" class="ms926-marker' + (sel ? ' selected' : '') + '" width="' + r2(L.width) + '" height="' + r2(L.height) +
      '" viewBox="' + r2(L.box[0]) + ' ' + r2(L.box[1]) + ' ' + r2(L.width) + ' ' + r2(L.height) + '" data-ms926-ref="' + esc(ref) + '" data-ms926-scale="' + (Math.round(sc * 10000) / 10000) +
      '" data-ms926-anchor="' + r2(L.anchor[0]) + ',' + r2(L.anchor[1]) + '" data-ms926-at="' + L.at[0] + ',' + L.at[1] + '" data-ms926-placed="' + L.placed + '"' +
      (L.unit != null ? ' data-ms926-unit="' + L.unit + '"' : '') + ' data-ms926-door="' + L.door + '" role="img" aria-label="' +
      esc(ref + (L.unit != null ? ' unit ' + L.unit : '') + (o.number != null ? ', load ' + o.number : '') + ': ' + (L.door === 'choice' ? 'door side chosen' : doorSummary) +
        (L.components.some(c => c.confirm) ? '; size to confirm' : '') + (L.components.some(c => c.standard && c.kind !== 'waste_tank') ? '; dashed = not drawn on the master' : '')) + '" style="overflow:visible">';
    out += '<g class="ms926-shape">';
    const order = L.components.slice().sort((a, b) => (a.role === 'tank-under' ? 0 : a.geometry === 'polyline' ? 1 : 2) - (b.role === 'tank-under' ? 0 : b.geometry === 'polyline' ? 1 : 2));
    order.forEach(c => {
      const attrs = ' data-i="' + c.i + '" data-kind="' + esc(c.kind) + '" data-source="' + (c.source === 'master' ? 'master' : 'standard') + '" data-role="' + c.role + '"' +
        (c.confirm ? ' data-confirm="1"' : '') + ' data-units="' + c.units.join(' ') + '"';
      out += '<g class="ms926-part"' + attrs + '><title>' + esc(words(c)) + '</title>';
      const dash = c.standard ? ' stroke-dasharray="4 3"' : '';
      if (c.geometry === 'polygon') {
        if (c.kind === 'waste_tank') {
          const off = c.role === 'tank-under' ? ' transform="translate(' + r2(L.tankOff) + ',' + r2(L.tankOff) + ')"' : '';
          out += '<polygon class="ms926-comp ms926-tank"' + off + ' data-i="' + c.i + '" points="' + pts(c.poly) + '" fill="#c5ccd0" fill-opacity="0.95" stroke="' + (sel ? '#ff852f' : '#6b767c') + '" stroke-width="1.4"' + dash + ' stroke-linejoin="round"/>';
        } else {
          const ctx = c.role === 'context';
          out += '<polygon class="ms926-comp" data-i="' + c.i + '" data-kind="' + esc(c.kind) + '" points="' + pts(c.poly) + '" fill="' + fill + '" fill-opacity="' + (ctx ? 0.35 : c.standard ? 0.62 : 0.9) +
            '" stroke="' + edge + '" stroke-width="' + (ctx ? 0.8 : 1.4) + '"' + dash + ' stroke-linejoin="round"/>';
        }
      } else if (c.geometry === 'polyline') {
        const w = c.lineWidthPx, pl = Math.max(2, c.pieceLenPx);
        out += '<polyline class="ms926-line" data-i="' + c.i + '" points="' + pts(c.poly) + '" fill="none" stroke="' + (sel ? '#ff852f' : '#183541') + '" stroke-width="' + r2(w + 2.4) + '" stroke-linejoin="round"' + (c.standard ? ' stroke-dasharray="6 3"' : '') + '/>';
        const big = (c.marks.length && c.marks[0].poly && (() => { const q = c.marks[0].poly; return Math.min(len(q[0], q[1]), len(q[1], q[2])) >= 4; })());
        if (big) c.marks.forEach(m => { if (m.type === 'piece' && m.poly) out += '<polygon class="ms926-piece" points="' + pts(m.poly) + '" fill="' + (m.colour === 'w' ? '#fafafa' : '#ffbf00') + '" stroke="#1d1d1b" stroke-width="0.5"/>'; });
        else out += '<polyline class="ms926-piece-y" points="' + pts(c.poly) + '" fill="none" stroke="#ffbf00" stroke-width="' + r2(w) + '" stroke-linejoin="round"/>' +
          '<polyline class="ms926-piece-w" points="' + pts(c.poly) + '" fill="none" stroke="#fafafa" stroke-width="' + r2(w) + '" stroke-dasharray="' + r2(pl) + ' ' + r2(pl) + '" stroke-dashoffset="' + r2(pl) + '"/>';
      } else {
        const q = c.centroid;
        out += '<rect class="ms926-comp ms926-point" data-i="' + c.i + '" x="' + r2(q[0] - 11) + '" y="' + r2(q[1] - 9) + '" width="22" height="18" rx="2" fill="' + fill + '" fill-opacity="0.62" stroke="' + edge + '" stroke-width="1.4" stroke-dasharray="3 2"/>' +
          '<text x="' + r2(q[0]) + '" y="' + r2(q[1]) + '" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="7.5" font-weight="800" fill="' + ink + '">' + esc(TAG[c.kind] || '') + '?</text>';
      }
      // the master's own marks (chevrons, generator diagonals and triangles, container doors)
      c.marks.forEach(m => {
        if (m.type === 'piece') return;
        m.lines.forEach(l => { out += '<line class="ms926-mark" data-type="' + esc(m.type) + '" x1="' + r2(l[0][0]) + '" y1="' + r2(l[0][1]) + '" x2="' + r2(l[1][0]) + '" y2="' + r2(l[1][1]) + '" stroke="' + ink + '" stroke-width="1" stroke-linecap="round"/>'; });
        if (m.poly) out += '<polygon class="ms926-mark" data-type="' + esc(m.type) + '" points="' + pts(m.poly) + '" fill="' + ink + '" fill-opacity="0.85"/>';
      });
      // what kind of thing it is, readable at a glance: the FWF circle, the accessible-toilet sign, the generator diagonal, a short tag
      if (c.geometry === 'polygon' && c.kind !== 'waste_tank' && c.role !== 'context') {
        const P = c.poly, sd = P.length === 4 ? Math.min(len(P[0], P[1]), len(P[1], P[2])) : 0, ld = P.length === 4 ? Math.max(len(P[0], P[1]), len(P[1], P[2])) : 0, q = c.centroid;
        if (c.kind === 'toilet' && sd >= 9) out += '<circle class="ms926-glyph" data-glyph="fwf" cx="' + r2(q[0]) + '" cy="' + r2(q[1]) + '" r="' + r2(sd * 0.26) + '" fill="none" stroke="' + ink + '" stroke-width="1"/>';
        else if (c.kind === 'accessible_toilet' && sd >= 12) {
          const u = sd * 0.3, X = q[0], Y = q[1];
          out += '<g class="ms926-glyph" data-glyph="accessible" fill="none" stroke="' + ink + '" stroke-width="' + r2(Math.max(1, u * 0.16)) + '" stroke-linecap="round">' +
            '<circle cx="' + r2(X + u * 0.1) + '" cy="' + r2(Y - u * 0.85) + '" r="' + r2(u * 0.16) + '" fill="' + ink + '" stroke="none"/>' +
            '<path d="M' + r2(X + u * 0.05) + ' ' + r2(Y - u * 0.55) + 'L' + r2(X) + ' ' + r2(Y + u * 0.05) + 'L' + r2(X + u * 0.5) + ' ' + r2(Y + u * 0.05) + 'L' + r2(X + u * 0.7) + ' ' + r2(Y + u * 0.6) + '"/>' +
            '<path d="M' + r2(X - u * 0.25) + ' ' + r2(Y - u * 0.2) + 'A' + r2(u * 0.55) + ' ' + r2(u * 0.55) + ' 0 1 0 ' + r2(X + u * 0.45) + ' ' + r2(Y + u * 0.5) + '"/></g>';
        }
        if (c.kind === 'generator' && c.standard) out += '<line class="ms926-glyph" data-glyph="generator" x1="' + r2(P[0][0]) + '" y1="' + r2(P[0][1]) + '" x2="' + r2(P[2][0]) + '" y2="' + r2(P[2][1]) + '" stroke="#ff7f00" stroke-width="1.2"/>';
        let tg = TAG[c.kind] || '';
        if (c.kind === 'trakmat' && c.pieces) tg = 'MAT x' + c.pieces;
        if (c.kind === 'generator' && !c.standard) tg = '';   // the master's own generator marks already say what it is
        if (tg && c.kind !== 'toilet') {
          const fs = Math.min(10, sd * 0.55);
          if (fs >= 6 && tg.length * fs * 0.62 <= ld * 0.9) out += '<text class="ms926-glyph" data-glyph="tag" x="' + r2(q[0]) + '" y="' + r2(q[1]) + '" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="' + r2(fs) + '" font-weight="800" fill="' + ink + '">' + esc(tg) + '</text>';
        }
      }
      out += '</g>';
    });
    out += '</g>';
    // WASTE TANK in clear text wherever a tank is drawn
    L.tags.forEach(t => {
      const font = '" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="' + t.fs + '" font-weight="800" fill="#2f3a40">';
      out += '<g class="ms926-tank-tag" data-of="' + t.of + '" data-inside="' + t.inside + '">' + (t.inside
        ? '<text x="' + r2(t.x) + '" y="' + r2(t.y) + '" transform="rotate(' + t.rot + ' ' + r2(t.x) + ' ' + r2(t.y) + ')' + font + esc(t.text) + '</text></g>'
        : '<rect x="' + r2(t.x) + '" y="' + r2(t.y) + '" width="' + r2(t.w) + '" height="' + r2(t.h) + '" rx="3" fill="#eef1f2" stroke="#6b767c" stroke-width="1"/>' +
          '<text x="' + r2(t.x + t.w / 2) + '" y="' + r2(t.y + t.h / 2) + font + esc(t.text) + '</text></g>');
    });
    if (L.door === 'master') {
      L.components.forEach(c => c.doors.forEach(d => {
        const q = d.arc;
        out += '<g class="ms926-door" data-source="master" data-comp="' + c.i + '" data-edge="' + d.edge + '" data-at="' + d.at + '" data-faces="' + esc(d.faces) + '">';
        const curvePath=d.arcs.map(q=>'M'+r2(q[0][0])+' '+r2(q[0][1])+'C'+q.slice(1).map(p=>r2(p[0])+' '+r2(p[1])).join(' ')).join('');
        const leafPath=d.leaves.map(l=>'M'+r2(l[0][0])+' '+r2(l[0][1])+'L'+r2(l[1][0])+' '+r2(l[1][1])).join('');
        out += '<path class="ms926-swing" d="'+leafPath+curvePath+
          (d.landing ? d.landing.map(l => 'M' + r2(l[0][0]) + ' ' + r2(l[0][1]) + 'L' + r2(l[1][0]) + ' ' + r2(l[1][1])).join('') : '') + '" fill="none" stroke="' + fill + '" stroke-width="1.4" stroke-linecap="round"/>';
        const w = Math.max(d.widthPx, 6) / 2, edgeDir = [-d.out[1], d.out[0]];
        out += '<line class="ms926-door-bar" x1="' + r2(d.mid[0] - edgeDir[0] * w) + '" y1="' + r2(d.mid[1] - edgeDir[1] * w) + '" x2="' + r2(d.mid[0] + edgeDir[0] * w) + '" y2="' + r2(d.mid[1] + edgeDir[1] * w) + '" stroke="' + doorInk + '" stroke-width="3" stroke-linecap="round"/>';
        out += arrow(d.mid, d.out, Math.max(10, Math.min(18, w * 2.2)), doorInk, 'ms926-door-arrow', '') + '</g>';
      }));
    } else if (L.door === 'choice') {
      const c = L.chosen, w = Math.max(Math.min(c.edgeLen * 0.3, 0.9 * c.pxPerM), 6) / 2;
      out += '<g class="ms926-door" data-source="choice" data-comp="' + c.component + '" data-edge="' + c.edge + '" data-at="' + c.at + '">' +
        '<line class="ms926-door-bar" x1="' + r2(c.mid[0] - c.along[0] * w) + '" y1="' + r2(c.mid[1] - c.along[1] * w) + '" x2="' + r2(c.mid[0] + c.along[0] * w) + '" y2="' + r2(c.mid[1] + c.along[1] * w) + '" stroke="' + doorInk + '" stroke-width="3" stroke-linecap="round"/>' +
        arrow(c.mid, c.out, 14, doorInk, 'ms926-door-arrow', '') + '</g>';
    }
    if (L.badge) {
      const b = L.badge;
      out += '<g class="ms926-badge" data-inside="' + b.inside + '"><circle cx="' + r2(b.x) + '" cy="' + r2(b.y) + '" r="' + b.r + '" fill="' + fill + '" stroke="#ffffff" stroke-width="2"/>' +
        '<text x="' + r2(b.x) + '" y="' + r2(b.y) + '" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="' + Math.round(b.r * 1.15) + '" font-weight="800" fill="' + ink + '">' + esc(o.number) + '</text></g>';
    }
    return out + '</svg>';
  }
  // door edges for a picker: every outline edge of every drawn part (or of one unit), with the master's door marked
  function doorEdges(ref, o) {
    o = o || {}; const s = rec(ref); if (!s) return [];
    const sel = pick(s, o); if (!sel) return [];
    const out = [], pri = primary(s, sel.idx);
    sel.idx.forEach(ci => {
      const c = s.c[ci]; if (!isPoly(c)) return;
      c.p.forEach((f, ei) => {
        const a = sp(f), b = sp(c.p[(ei + 1) % c.p.length]), cc = sp(c.c), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; let n = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
        if ((m[0] - cc[0]) * n[0] + (m[1] - cc[1]) * n[1] < 0) n = [-n[0], -n[1]];
        const ds = c.d.filter(d => d.e === ei);
        out.push({component: ci, kind: c.k, units: (c.u || []).slice(), standard: !!c.st, edge: ei, length_m: Math.round(L * MPT() * 100) / 100, outward: [Math.round(n[0] * 1e4) / 1e4, Math.round(n[1] * 1e4) / 1e4],
          master_doors: ds.length, faces: ds.length ? ds[0].f : null, primary: ci === pri, door_note: data().notes[c.n] || ''});
      });
    });
    return out;
  }
  const api = {version: 'v9.26', shape, units, unit, reason, footprint, refs, svg, layout, doorEdges, has: ref => !!rec(ref),
    placed: ref => { const s = rec(ref); return s ? s.pl !== 0 : false; },
    meta: () => { const d = data(); return {version: d.v, how: d.how, source_sha256: d.source_sha256, footprints_sha256: d.footprints_sha256, master_sha256: d.master_sha256,
      sheet: d.sheet, m_per_pt: d.m_per_pt, shapes: Object.keys(d.shapes).length, none: Object.keys(d.none).length, counts: cp(d.counts)}; }};
  return Object.freeze(api);
})();
if (typeof window !== 'undefined') window.MasterShapes926 = MasterShapes926;
if (typeof module !== 'undefined' && module.exports) module.exports = MasterShapes926;
