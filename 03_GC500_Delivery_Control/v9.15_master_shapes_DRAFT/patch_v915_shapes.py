# Author: Andrew Fisher. v9.15 - every item's shape and door side, as data and a drawing helper.
#
# The project manager, on site, ~16:40 AEST 8 Oct 2026, with two Arrange loads screenshots: "be good when we choose the
# loads the loads are the same shapes as what is on the maps and be even smarter by even as far as making it exactly the
# same shape so would even show the door side". 9 Oct ~00:05: "Remember every item has a shape even a fwf has a shape.
# Disabled toilet. Generator too." ~00:10-00:20: "Water barrier have shapes theirs is the white and yellow long lines." /
# "Waste tank almost need to be same shape as the toilet block greyed. Clearly to say waste tank." / "Waste tanks are under
# the toilets so u wont see on master." ~00:30: "Remember when we pick the loads we can select the driver to door selection
# here too. As we can see the door side on the pics."
#
# This patch only ADDS a read-only global, MasterShapes915 (and window.MasterShapes915), in two new blocks at the end of
# the page: the shapes (<script id="shapes915-data">, const MASTER_SHAPES915_DATA, its sha256 on the tag) and the helper
# (<script id="shapes915-script">). It changes nothing else: no DATA, no MASTER_LOC, no money, no record, no screen, no
# footer. Arrange loads (drops911) is not touched; whoever owns it wires svg() in, with the master's door as the door
# picker's default and the chosen side winning (the per-unit choice stays loading872Set on the record).
#
#   MasterShapes915.shape(ref)          -> {ref, placed, centroid, units, components:[{kind, source, standard, geometry, poly, size_m,
#                                           angle_deg, door, doors, door_note, marks, units, confirm, size_state, under, pieces}]} | null
#   MasterShapes915.units(ref)          -> every unit at the reference: {n, type, item, owner, number, loading_id, components, source}
#   MasterShapes915.unit(ref, key)      -> one unit, by n, loading id ('u1311341'), asset/supplier number or 'type#index'
#   MasterShapes915.reason(ref)         -> why a reference has no shape (cancelled), else null
#   MasterShapes915.footprint(key)      -> the footprint used for an item type: {size_m, size_state, confirm, why}
#   MasterShapes915.svg(ref, {number, selected, door, minPx, pxPerPt, rot, project, unit}) -> SVG marker string | null
#   MasterShapes915.layout(ref, opts)   -> the screen geometry svg() draws (for wiring and tests)
#   MasterShapes915.doorEdges(ref, {unit}) -> every outline edge, with the master's door marked: for a picker
#
# poly is in the SAME frame as MASTER_LOC[ref].pt (fractions of the 2384 x 1684 pt sheet, y down). A part the 2 Oct master
# draws (source "master") has every vertex a PDF path point of D001-26003-03, moved by the proven transform (main plan
# +25.50, +0.12 pt; inset 0, +0.06 pt). A part it does not draw (source "not drawn on the master - footprint from ...") is
# its catalogue footprint (footprints_v915.json), placed at the reference; it is drawn with a dashed outline. A waste tank
# takes its block's own outline and sits under it. The data is shapes_v915.json beside this file (built by build_all.py);
# the patch refuses if its checksum differs.
#
#   toolchain/build.sh v915_all v9.15_master_shapes_DRAFT/patch_v915_shapes.py
import hashlib, json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep  # noqa: F401 (shared helper; the one insertion here is at the page end, checked below)

SHAPES = here / 'shapes_v915.json'
FOOTPRINTS = here / 'footprints_v915.json'
SHAPES_SHA = '3671d30452645a4977dac6e8d5256e37cdf132c42d976c2908d512395db3db82'
FOOTPRINTS_SHA = 'c005d65560e14c0d48b2f091c3cf36eaf54ca2f4fc81258a829027368add80f0'
MASTER_SHA = '8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d'

p = Path(sys.argv[1]); raw = p.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); s = raw.decode('utf-8-sig')
s0 = s

# the base: v9.11 (Workers911) or later; never twice
assert 'window.Workers911=Workers911' in s, 'base must carry v9.11 (Workers911) - stopping'
assert 'MasterShapes915' not in s and 'shapes915-data' not in s, 'v9.15 master shapes are already applied - stopping'

# DATA and MASTER_LOC must round-trip and stay exactly as they are
m = re.search(r'const DATA = (\{.*?\});\n', s); assert m, 'DATA not found'
assert json.dumps(json.loads(m.group(1)), ensure_ascii=False, separators=(',', ':')) == m.group(1), 'DATA must round-trip exactly - stopping'
DATA_TEXT = m.group(1)
DATA = json.loads(DATA_TEXT)
dec = json.JSONDecoder()
i0 = s.index('const MASTER_LOC = ') + len('const MASTER_LOC = ')
ML, i1 = dec.raw_decode(s, i0)
ML_TEXT = s[i0:i1]

got = hashlib.sha256(SHAPES.read_bytes()).hexdigest()
assert got == SHAPES_SHA, f'shapes_v915.json checksum mismatch ({got[:16]}...) - stopping'
got = hashlib.sha256(FOOTPRINTS.read_bytes()).hexdigest()
assert got == FOOTPRINTS_SHA, f'footprints_v915.json checksum mismatch ({got[:16]}...) - stopping'
J = json.loads(SHAPES.read_text())
F = json.loads(FOOTPRINTS.read_text())
assert J['meta']['master']['sha256'] == MASTER_SHA

# every reference on the page and in MASTER_LOC has an entry (a shape, or null with the reason)
page_refs = {a['key'] for a in DATA['assets']}
missing = sorted((page_refs | set(ML)) - set(J['refs']))
assert not missing, f'no shape entry for {missing} - stopping'
for r, e in J['refs'].items():
    if r in ML:
        assert e['master_loc'] == ML[r]['pt'], f'{r}: MASTER_LOC moved since the shapes were built - rerun build_all.py on this base - stopping'
    if not e['shape']:
        assert e.get('cancelled') or r == 'T0265', f'{r}: no shape and not cancelled - stopping'

# ---- compact page copy of the data (the full provenance stays in shapes_v915.json) ----
SYM = []; NOTES = []; SRC = ['master']; TYPES = []; ITEMS = []
def code(table, text):
    if text not in table:
        table.append(text)
    return table.index(text)

def r7(v):
    return [round(v[0], 7), round(v[1], 7)]

UNIT_SRC = {'master': 'm', 'standard': 's', 'under its block': 't', 'cancelled': 'x'}
def units_compact(rows):
    out = []
    for u in rows:
        o = {'n': u['n'], 't': code(TYPES, u['type']), 'it': code(ITEMS, u['item']), 'c': u['components'], 's': UNIT_SRC[u['source']]}
        if u.get('type_index') is not None: o['x'] = u['type_index']
        if u.get('owner'): o['o'] = u['owner']
        if u.get('number'): o['no'] = str(u['number'])
        if u.get('loading_id'): o['l'] = u['loading_id']
        if u.get('pieces'): o['pc'] = u['pieces']
        if u.get('cancelled'): o['cx'] = 1
        if u.get('note'): o['nt'] = code(NOTES, u['note'])
        if u.get('under_block'): o['ub'] = u['under_block']
        out.append(o)
    return out

shapes = {}; nulls = {}; null_units = {}
for ref in J['meta']['refs_order']:
    e = J['refs'][ref]; sh = e['shape']
    if not sh:
        nulls[ref] = e['reason']
        if e.get('units'): null_units[ref] = units_compact(e['units'])
        continue
    comps = []
    for c in sh['components']:
        doors = []
        for d in c['doors']:
            sw = d['swing']
            doors.append({'e': d['edge_index'], 't': d['at'], 'm': r7(d['mid']), 'o': d['outward'], 'f': d['faces'],
                          'b': d['bearing_deg'], 'w': d['width_m'], 'y': code(SYM, d['symbol']), 'h': r7(sw['hinge']),
                          'q': [r7(x) for x in sw['arc']], 'v': [r7(x) for x in sw['leaf']],
                          'g': [[r7(a), r7(b)] for a, b in sw['landing']] if sw.get('landing') else None})
        di = -1
        if c['door'] is not None:
            di = next(k for k, d in enumerate(c['doors']) if (d.get('pdf') or {}).get('arc_drawing') == (c['door'].get('pdf') or {}).get('arc_drawing')
                      and d['edge_index'] == c['door']['edge_index'] and d['at'] == c['door']['at'])
        marks = []
        for mk in c['marks']:
            o = {'y': mk['type']}
            if mk.get('lines'):
                o['l'] = [[r7(a), r7(b)] for a, b in mk['lines']]
            if mk.get('poly'):
                o['p'] = [r7(x) for x in mk['poly']]
            if 'edge_index' in mk:
                o['e'] = mk['edge_index']
            if mk.get('colour'):
                o['co'] = mk['colour'][0]
            marks.append(o)
        o = {'k': c['kind'], 'l': c['label'], 'p': [r7(x) for x in c['poly']], 'c': r7(c['centroid']),
             'z': c['size_m'], 'a': c['angle_deg'], 'd': doors, 'di': di, 'n': code(NOTES, c['door_note']), 'm': marks, 'u': c['units']}
        if c.get('standard'): o['st'] = 1
        if c['source'] != 'master': o['s'] = code(SRC, c['source'])
        if c['geometry'] == 'polyline': o['g'] = 'l'
        if c['geometry'] == 'point': o['g'] = 'o'
        if c.get('confirm'): o['cf'] = 1
        if c.get('size_state'): o['ss'] = code(NOTES, c['size_state'])
        if c.get('under') is not None: o['un'] = c['under']
        if c.get('pieces'): o['pc'] = c['pieces']
        if c['geometry'] == 'polyline':
            o['pl'] = c.get('piece_len_m_drawn') or (c.get('piece_m') or [2.0])[0]
            o['pw'] = c.get('piece_width_m_drawn') or (c.get('piece_m') or [2.0, 0.5])[1]
        if (c.get('match') or {}).get('confidence'): o['mc'] = c['match']['confidence'][0]
        if c.get('drawn_as'): o['dup'] = c['drawn_as']['ref']
        if c.get('place_note'): o['pn'] = code(NOTES, c['place_note'])
        comps.append(o)
    rec = {'c': comps, 'k': r7(sh['centroid']), 's': sh['door_summary'], 'x': sh.get('note'), 'u': units_compact(e.get('units') or [])}
    if sh.get('placed') is False:
        rec['pl'] = 0; rec['pn'] = code(NOTES, sh.get('place_note') or 'not placed on the map')
    if e.get('cancelled'): rec['cx'] = code(NOTES, 'cancelled on the record: ' + str(e['cancelled']))
    shapes[ref] = rec
FOOT = {k: [v['size_m'], v['size_state'], 1 if v['confirm'] else 0, v['why']] for k, v in F['types'].items() if v.get('footprint')}
cnt = J['meta']['counts_9oct']
PAGE_DATA = {'v': 'v9.15', 'source_sha256': SHAPES_SHA, 'footprints_sha256': FOOTPRINTS_SHA, 'master_sha256': MASTER_SHA,
             'how': 'traced from D001-26003-03 vector, 2 Oct 2026 issue; parts it does not draw from their catalogue footprint',
             'sheet': [2384, 1684], 'm_per_pt': J['meta']['master']['m_per_pt'],
             'sym': SYM, 'notes': NOTES, 'src': SRC, 'types': TYPES, 'items': ITEMS, 'foot': FOOT,
             'counts': {'units': cnt['units'], 'units_by_source': cnt['units_by_source'],
                        'components_master': cnt['components_master_8oct'] + cnt['components_master_9oct'],
                        'components_standard': cnt['components_standard'], 'components_under_block': cnt['components_under_block']},
             'shapes': shapes, 'none': nulls, 'none_units': null_units}
blob = json.dumps(PAGE_DATA, ensure_ascii=True, separators=(',', ':'))
for bad in ('Andrew', 'Fisher', 'Claude', 'Codex', 'GPT', 'Opus'):
    assert bad not in blob, f'"{bad}" must not appear in the page data - stopping'
assert not re.search(r'\$\s?\d', blob), 'no dollar figures in the page data - stopping'
blob = blob.replace('</', '<\\/')
BLOB_SHA = hashlib.sha256(blob.encode('utf-8')).hexdigest()

JS = r'''
/* Author: Andrew Fisher. v9.15 master shapes, every item: each unit's footprint and door side, as the 2 Oct master
   (D001-26003-03) draws it where it is drawn, else its catalogue footprint (dashed), in the MASTER_LOC.pt frame, plus a
   drawing helper for map markers and Arrange loads. Read only: it reads its own data block (MASTER_SHAPES915_DATA) and
   nothing else, and writes nothing. */
const MasterShapes915 = (() => {
  'use strict';
  const SHEET = [2384, 1684];
  let D = null;
  function data() {
    if (D) return D;
    try { D = typeof MASTER_SHAPES915_DATA === 'object' && MASTER_SHAPES915_DATA ? MASTER_SHAPES915_DATA : {}; } catch (e) { D = {}; }
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
      width_m: d.w, opens: 'outward', symbol: data().sym[d.y] || '', swing: {hinge: d.h, arc: d.q, leaf: d.v, landing: d.g || null}};
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
          hinge: P(d.h), arc: d.q.map(P), leaf: d.v.map(P), landing: d.g ? d.g.map(l => [P(l[0]), P(l[1])]) : null, faces: d.f}))};
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
    const tankOff = shortPx != null ? Math.max(3, Math.min(6, shortPx * k * 0.18)) : 4;
    const tags = [];
    comps.forEach(c => {
      if (c.geometry === 'point') { grow([c.centroid[0] - 12, c.centroid[1] - 10]); grow([c.centroid[0] + 12, c.centroid[1] + 10]); return; }
      const w = c.geometry === 'polyline' ? c.lineWidthPx / 2 + 2 : 0;
      c.poly.forEach(q => { grow([q[0] - w, q[1] - w]); grow([q[0] + w, q[1] + w]); });
      if (c.role === 'tank-under') c.poly.forEach(q => grow([q[0] + tankOff, q[1] + tankOff]));
      if (pk === 'master') c.doors.forEach(d => { d.arc.forEach(grow); d.leaf.forEach(grow); grow([d.mid[0] + d.out[0] * 20, d.mid[1] + d.out[1] * 20]); });
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
    let out = '<svg xmlns="http://www.w3.org/2000/svg" class="ms915-marker' + (sel ? ' selected' : '') + '" width="' + r2(L.width) + '" height="' + r2(L.height) +
      '" viewBox="' + r2(L.box[0]) + ' ' + r2(L.box[1]) + ' ' + r2(L.width) + ' ' + r2(L.height) + '" data-ms915-ref="' + esc(ref) + '" data-ms915-scale="' + (Math.round(sc * 10000) / 10000) +
      '" data-ms915-anchor="' + r2(L.anchor[0]) + ',' + r2(L.anchor[1]) + '" data-ms915-at="' + L.at[0] + ',' + L.at[1] + '" data-ms915-placed="' + L.placed + '"' +
      (L.unit != null ? ' data-ms915-unit="' + L.unit + '"' : '') + ' data-ms915-door="' + L.door + '" role="img" aria-label="' +
      esc(ref + (L.unit != null ? ' unit ' + L.unit : '') + (o.number != null ? ', load ' + o.number : '') + ': ' + (L.door === 'choice' ? 'door side chosen' : s.s) +
        (L.components.some(c => c.confirm) ? '; size to confirm' : '') + (L.components.some(c => c.standard && c.kind !== 'waste_tank') ? '; dashed = not drawn on the master' : '')) + '" style="overflow:visible">';
    out += '<g class="ms915-shape">';
    const order = L.components.slice().sort((a, b) => (a.role === 'tank-under' ? 0 : a.geometry === 'polyline' ? 1 : 2) - (b.role === 'tank-under' ? 0 : b.geometry === 'polyline' ? 1 : 2));
    order.forEach(c => {
      const attrs = ' data-i="' + c.i + '" data-kind="' + esc(c.kind) + '" data-source="' + (c.source === 'master' ? 'master' : 'standard') + '" data-role="' + c.role + '"' +
        (c.confirm ? ' data-confirm="1"' : '') + ' data-units="' + c.units.join(' ') + '"';
      out += '<g class="ms915-part"' + attrs + '><title>' + esc(words(c)) + '</title>';
      const dash = c.standard ? ' stroke-dasharray="4 3"' : '';
      if (c.geometry === 'polygon') {
        if (c.kind === 'waste_tank') {
          const off = c.role === 'tank-under' ? ' transform="translate(' + r2(L.tankOff) + ',' + r2(L.tankOff) + ')"' : '';
          out += '<polygon class="ms915-comp ms915-tank"' + off + ' data-i="' + c.i + '" points="' + pts(c.poly) + '" fill="#c5ccd0" fill-opacity="0.95" stroke="' + (sel ? '#ff852f' : '#6b767c') + '" stroke-width="1.4"' + dash + ' stroke-linejoin="round"/>';
        } else {
          const ctx = c.role === 'context';
          out += '<polygon class="ms915-comp" data-i="' + c.i + '" data-kind="' + esc(c.kind) + '" points="' + pts(c.poly) + '" fill="' + fill + '" fill-opacity="' + (ctx ? 0.35 : c.standard ? 0.62 : 0.9) +
            '" stroke="' + edge + '" stroke-width="' + (ctx ? 0.8 : 1.4) + '"' + dash + ' stroke-linejoin="round"/>';
        }
      } else if (c.geometry === 'polyline') {
        const w = c.lineWidthPx, pl = Math.max(2, c.pieceLenPx);
        out += '<polyline class="ms915-line" data-i="' + c.i + '" points="' + pts(c.poly) + '" fill="none" stroke="' + (sel ? '#ff852f' : '#183541') + '" stroke-width="' + r2(w + 2.4) + '" stroke-linejoin="round"' + (c.standard ? ' stroke-dasharray="6 3"' : '') + '/>';
        const big = (c.marks.length && c.marks[0].poly && (() => { const q = c.marks[0].poly; return Math.min(len(q[0], q[1]), len(q[1], q[2])) >= 4; })());
        if (big) c.marks.forEach(m => { if (m.type === 'piece' && m.poly) out += '<polygon class="ms915-piece" points="' + pts(m.poly) + '" fill="' + (m.colour === 'w' ? '#fafafa' : '#ffbf00') + '" stroke="#1d1d1b" stroke-width="0.5"/>'; });
        else out += '<polyline class="ms915-piece-y" points="' + pts(c.poly) + '" fill="none" stroke="#ffbf00" stroke-width="' + r2(w) + '" stroke-linejoin="round"/>' +
          '<polyline class="ms915-piece-w" points="' + pts(c.poly) + '" fill="none" stroke="#fafafa" stroke-width="' + r2(w) + '" stroke-dasharray="' + r2(pl) + ' ' + r2(pl) + '" stroke-dashoffset="' + r2(pl) + '"/>';
      } else {
        const q = c.centroid;
        out += '<rect class="ms915-comp ms915-point" data-i="' + c.i + '" x="' + r2(q[0] - 11) + '" y="' + r2(q[1] - 9) + '" width="22" height="18" rx="2" fill="' + fill + '" fill-opacity="0.62" stroke="' + edge + '" stroke-width="1.4" stroke-dasharray="3 2"/>' +
          '<text x="' + r2(q[0]) + '" y="' + r2(q[1]) + '" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="7.5" font-weight="800" fill="' + ink + '">' + esc(TAG[c.kind] || '') + '?</text>';
      }
      // the master's own marks (chevrons, generator diagonals and triangles, container doors)
      c.marks.forEach(m => {
        if (m.type === 'piece') return;
        m.lines.forEach(l => { out += '<line class="ms915-mark" data-type="' + esc(m.type) + '" x1="' + r2(l[0][0]) + '" y1="' + r2(l[0][1]) + '" x2="' + r2(l[1][0]) + '" y2="' + r2(l[1][1]) + '" stroke="' + ink + '" stroke-width="1" stroke-linecap="round"/>'; });
        if (m.poly) out += '<polygon class="ms915-mark" data-type="' + esc(m.type) + '" points="' + pts(m.poly) + '" fill="' + ink + '" fill-opacity="0.85"/>';
      });
      // what kind of thing it is, readable at a glance: the FWF circle, the accessible-toilet sign, the generator diagonal, a short tag
      if (c.geometry === 'polygon' && c.kind !== 'waste_tank' && c.role !== 'context') {
        const P = c.poly, sd = P.length === 4 ? Math.min(len(P[0], P[1]), len(P[1], P[2])) : 0, ld = P.length === 4 ? Math.max(len(P[0], P[1]), len(P[1], P[2])) : 0, q = c.centroid;
        if (c.kind === 'toilet' && sd >= 9) out += '<circle class="ms915-glyph" data-glyph="fwf" cx="' + r2(q[0]) + '" cy="' + r2(q[1]) + '" r="' + r2(sd * 0.26) + '" fill="none" stroke="' + ink + '" stroke-width="1"/>';
        else if (c.kind === 'accessible_toilet' && sd >= 12) {
          const u = sd * 0.3, X = q[0], Y = q[1];
          out += '<g class="ms915-glyph" data-glyph="accessible" fill="none" stroke="' + ink + '" stroke-width="' + r2(Math.max(1, u * 0.16)) + '" stroke-linecap="round">' +
            '<circle cx="' + r2(X + u * 0.1) + '" cy="' + r2(Y - u * 0.85) + '" r="' + r2(u * 0.16) + '" fill="' + ink + '" stroke="none"/>' +
            '<path d="M' + r2(X + u * 0.05) + ' ' + r2(Y - u * 0.55) + 'L' + r2(X) + ' ' + r2(Y + u * 0.05) + 'L' + r2(X + u * 0.5) + ' ' + r2(Y + u * 0.05) + 'L' + r2(X + u * 0.7) + ' ' + r2(Y + u * 0.6) + '"/>' +
            '<path d="M' + r2(X - u * 0.25) + ' ' + r2(Y - u * 0.2) + 'A' + r2(u * 0.55) + ' ' + r2(u * 0.55) + ' 0 1 0 ' + r2(X + u * 0.45) + ' ' + r2(Y + u * 0.5) + '"/></g>';
        }
        if (c.kind === 'generator' && c.standard) out += '<line class="ms915-glyph" data-glyph="generator" x1="' + r2(P[0][0]) + '" y1="' + r2(P[0][1]) + '" x2="' + r2(P[2][0]) + '" y2="' + r2(P[2][1]) + '" stroke="#ff7f00" stroke-width="1.2"/>';
        let tg = TAG[c.kind] || '';
        if (c.kind === 'trakmat' && c.pieces) tg = 'MAT x' + c.pieces;
        if (c.kind === 'generator' && !c.standard) tg = '';   // the master's own generator marks already say what it is
        if (tg && c.kind !== 'toilet') {
          const fs = Math.min(10, sd * 0.55);
          if (fs >= 6 && tg.length * fs * 0.62 <= ld * 0.9) out += '<text class="ms915-glyph" data-glyph="tag" x="' + r2(q[0]) + '" y="' + r2(q[1]) + '" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="' + r2(fs) + '" font-weight="800" fill="' + ink + '">' + esc(tg) + '</text>';
        }
      }
      out += '</g>';
    });
    out += '</g>';
    // WASTE TANK in clear text wherever a tank is drawn
    L.tags.forEach(t => {
      const font = '" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="' + t.fs + '" font-weight="800" fill="#2f3a40">';
      out += '<g class="ms915-tank-tag" data-of="' + t.of + '" data-inside="' + t.inside + '">' + (t.inside
        ? '<text x="' + r2(t.x) + '" y="' + r2(t.y) + '" transform="rotate(' + t.rot + ' ' + r2(t.x) + ' ' + r2(t.y) + ')' + font + esc(t.text) + '</text></g>'
        : '<rect x="' + r2(t.x) + '" y="' + r2(t.y) + '" width="' + r2(t.w) + '" height="' + r2(t.h) + '" rx="3" fill="#eef1f2" stroke="#6b767c" stroke-width="1"/>' +
          '<text x="' + r2(t.x + t.w / 2) + '" y="' + r2(t.y + t.h / 2) + font + esc(t.text) + '</text></g>');
    });
    if (L.door === 'master') {
      L.components.forEach(c => c.doors.forEach(d => {
        const q = d.arc;
        out += '<g class="ms915-door" data-source="master" data-comp="' + c.i + '" data-edge="' + d.edge + '" data-at="' + d.at + '" data-faces="' + esc(d.faces) + '">';
        out += '<path class="ms915-swing" d="M' + r2(d.leaf[0][0]) + ' ' + r2(d.leaf[0][1]) + 'L' + r2(d.leaf[1][0]) + ' ' + r2(d.leaf[1][1]) + 'M' + r2(q[0][0]) + ' ' + r2(q[0][1]) + 'C' + r2(q[1][0]) + ' ' + r2(q[1][1]) + ' ' + r2(q[2][0]) + ' ' + r2(q[2][1]) + ' ' + r2(q[3][0]) + ' ' + r2(q[3][1]) +
          (d.landing ? d.landing.map(l => 'M' + r2(l[0][0]) + ' ' + r2(l[0][1]) + 'L' + r2(l[1][0]) + ' ' + r2(l[1][1])).join('') : '') + '" fill="none" stroke="' + fill + '" stroke-width="1.4" stroke-linecap="round"/>';
        const w = Math.max(d.widthPx, 6) / 2, edgeDir = [-d.out[1], d.out[0]];
        out += '<line class="ms915-door-bar" x1="' + r2(d.mid[0] - edgeDir[0] * w) + '" y1="' + r2(d.mid[1] - edgeDir[1] * w) + '" x2="' + r2(d.mid[0] + edgeDir[0] * w) + '" y2="' + r2(d.mid[1] + edgeDir[1] * w) + '" stroke="' + doorInk + '" stroke-width="3" stroke-linecap="round"/>';
        out += arrow(d.mid, d.out, Math.max(10, Math.min(18, w * 2.2)), doorInk, 'ms915-door-arrow', '') + '</g>';
      }));
    } else if (L.door === 'choice') {
      const c = L.chosen, w = Math.max(Math.min(c.edgeLen * 0.3, 0.9 * c.pxPerM), 6) / 2;
      out += '<g class="ms915-door" data-source="choice" data-comp="' + c.component + '" data-edge="' + c.edge + '" data-at="' + c.at + '">' +
        '<line class="ms915-door-bar" x1="' + r2(c.mid[0] - c.along[0] * w) + '" y1="' + r2(c.mid[1] - c.along[1] * w) + '" x2="' + r2(c.mid[0] + c.along[0] * w) + '" y2="' + r2(c.mid[1] + c.along[1] * w) + '" stroke="' + doorInk + '" stroke-width="3" stroke-linecap="round"/>' +
        arrow(c.mid, c.out, 14, doorInk, 'ms915-door-arrow', '') + '</g>';
    }
    if (L.badge) {
      const b = L.badge;
      out += '<g class="ms915-badge" data-inside="' + b.inside + '"><circle cx="' + r2(b.x) + '" cy="' + r2(b.y) + '" r="' + b.r + '" fill="' + fill + '" stroke="#ffffff" stroke-width="2"/>' +
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
  const api = {version: 'v9.15', shape, units, unit, reason, footprint, refs, svg, layout, doorEdges, has: ref => !!rec(ref),
    placed: ref => { const s = rec(ref); return s ? s.pl !== 0 : false; },
    meta: () => { const d = data(); return {version: d.v, how: d.how, source_sha256: d.source_sha256, footprints_sha256: d.footprints_sha256, master_sha256: d.master_sha256,
      sheet: d.sheet, m_per_pt: d.m_per_pt, shapes: Object.keys(d.shapes).length, none: Object.keys(d.none).length, counts: cp(d.counts)}; }};
  return Object.freeze(api);
})();
if (typeof window !== 'undefined') window.MasterShapes915 = MasterShapes915;
'''
assert 'Claude' not in JS and 'Codex' not in JS

INSERT = ('\n<script id="shapes915-data" data-sha256="' + BLOB_SHA + '">const MASTER_SHAPES915_DATA = ' + blob + ';</script>\n'
          '<script id="shapes915-script">' + JS + '</script>')
# the two blocks go at the very end of the page, after its last script and before </body></html>
mt = re.search(r'</script>(\n</body></html>\s*)$', s)
assert mt, 'page end not as expected - stopping'
s = s[:mt.start(1)] + INSERT + s[mt.start(1):]

# nothing else moved
m2 = re.search(r'const DATA = (\{.*?\});\n', s); assert m2 and m2.group(1) == DATA_TEXT, 'DATA changed - stopping'
j0 = s.index('const MASTER_LOC = ') + len('const MASTER_LOC = '); _, j1 = dec.raw_decode(s, j0)
assert s[j0:j1] == ML_TEXT, 'MASTER_LOC changed - stopping'
assert s.replace(INSERT, '', 1) == s0, 'something other than the two new blocks changed - stopping'
p.write_bytes((b'\xef\xbb\xbf' if bom else b'') + s.encode('utf-8'))
print(f'v9.15 master shapes, every item: {len(shapes)} references with a shape, {len(nulls)} without (reason given); '
      f'{cnt["units"]} units ({cnt["units_by_source"]}); data {len(blob):,} bytes sha256 {BLOB_SHA[:16]}..., source {SHAPES_SHA[:16]}...')
