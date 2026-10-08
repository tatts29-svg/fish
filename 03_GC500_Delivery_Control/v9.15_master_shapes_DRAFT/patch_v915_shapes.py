# Author: Andrew Fisher. v9.15 - the master's own shapes and door sides, as data and a drawing helper.
#
# The project manager, on site, ~16:40 AEST 8 Oct 2026, with two Arrange loads screenshots: "be good when we choose the
# loads the loads are the same shapes as what is on the maps and be even smarter by even as far as making it exactly the
# same shape so would even show the door side".
#
# This patch only ADDS a read-only global, MasterShapes915 (and window.MasterShapes915), in two new blocks at the end of
# the page: the traced shapes as JSON (<script type="application/json" id="shapes915-data">) and the helper
# (<script id="shapes915-script">). It changes nothing else: no DATA, no MASTER_LOC, no money, no record, no screen, no
# footer. Arrange loads (drops911) is not touched; whoever owns it wires svg() in, with the master's door as the door
# picker's default and the chosen side winning.
#
#   MasterShapes915.shape(ref)  -> {ref, components:[{kind, poly, size_m, angle_deg, door, doors, door_note, marks}], how} | null
#   MasterShapes915.reason(ref) -> why a reference has no shape (not drawn on the master), else null
#   MasterShapes915.refs()      -> references that have a shape
#   MasterShapes915.svg(ref, {number, selected, door, minPx, pxPerPt, rot, project}) -> SVG marker string | null
#   MasterShapes915.layout(ref, opts) -> the screen geometry svg() draws (for wiring and tests)
#
# poly is in the SAME frame as MASTER_LOC[ref].pt (fractions of the 2384 x 1684 pt sheet, y down). Every vertex is a
# PDF path point of D001-26003-03 (2 Oct issue), moved by the proven transform (main plan +25.50, +0.12 pt; inset 0,
# +0.06 pt). The data is shapes_v915.json beside this file; the patch refuses if its checksum differs.
#
#   toolchain/build.sh v915_shapes v9.15_master_shapes_DRAFT/patch_v915_shapes.py
import hashlib, json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

SHAPES = here / 'shapes_v915.json'
SHAPES_SHA = 'c53e21d530f0d614a0d3d2488fe00c6770a914245f6c971c2e9e6fedd5701374'
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
J = json.loads(SHAPES.read_text())
assert J['meta']['master']['sha256'] == MASTER_SHA

# every reference on the page and in MASTER_LOC has an entry (a shape, or null with the reason)
page_refs = {a['key'] for a in DATA['assets']}
missing = sorted((page_refs | set(ML)) - set(J['refs']))
assert not missing, f'no shape entry for {missing} - stopping'
for r, e in J['refs'].items():
    if r in ML:
        assert e['master_loc'] == ML[r]['pt'], f'{r}: MASTER_LOC moved since the shapes were traced - stopping'

# ---- compact page copy of the data (the full provenance stays in shapes_v915.json) ----
SYM = []; NOTES = []
def code(table, text):
    if text not in table:
        table.append(text)
    return table.index(text)

def r7(v):
    return [round(v[0], 7), round(v[1], 7)]

shapes = {}; nulls = {}
for ref in J['meta']['refs_order']:
    e = J['refs'][ref]; sh = e['shape']
    if not sh:
        nulls[ref] = e['reason']
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
            di = next(k for k, d in enumerate(c['doors']) if d['pdf'] == c['door']['pdf'])
        marks = []
        for mk in c['marks']:
            o = {'y': mk['type']}
            if mk.get('lines'):
                o['l'] = [[r7(a), r7(b)] for a, b in mk['lines']]
            if mk.get('poly'):
                o['p'] = [r7(x) for x in mk['poly']]
            if 'edge_index' in mk:
                o['e'] = mk['edge_index']
            marks.append(o)
        comps.append({'k': c['kind'], 'l': c['label'], 'p': [r7(x) for x in c['poly']], 'c': r7(c['centroid']),
                      'z': c['size_m'], 'a': c['angle_deg'], 'd': doors, 'di': di, 'n': code(NOTES, c['door_note']), 'm': marks})
    shapes[ref] = {'c': comps, 'k': r7(sh['centroid']), 's': sh['door_summary'], 'x': sh.get('note')}
PAGE_DATA = {'v': 'v9.15', 'source_sha256': SHAPES_SHA, 'master_sha256': MASTER_SHA,
             'how': 'traced from D001-26003-03 vector, 2 Oct 2026 issue',
             'sheet': [2384, 1684], 'm_per_pt': J['meta']['master']['m_per_pt'],
             'sym': SYM, 'notes': NOTES, 'shapes': shapes, 'none': nulls}
blob = json.dumps(PAGE_DATA, ensure_ascii=True, separators=(',', ':'))
for bad in ('Andrew', 'Fisher', 'Claude', 'Codex', 'GPT', 'Opus', 'agent'):
    assert bad not in blob, f'"{bad}" must not appear in the page data - stopping'
blob = blob.replace('</', '<\\/')
BLOB_SHA = hashlib.sha256(blob.encode('utf-8')).hexdigest()

JS = r'''
/* Author: Andrew Fisher. v9.15 master shapes: each reference's footprint and door side exactly as the 2 Oct master
   (D001-26003-03) draws it, in the MASTER_LOC.pt frame, plus a drawing helper for map markers. Read only: it reads its
   own JSON block and nothing else, and writes nothing. */
const MasterShapes915 = (() => {
  'use strict';
  const SHEET = [2384, 1684];
  let D = null;
  function data() {
    if (D) return D;
    try { const el = document.getElementById('shapes915-data'); D = JSON.parse(el ? el.textContent : '{}') || {}; } catch (e) { D = {}; }
    D.shapes = D.shapes || {}; D.none = D.none || {}; D.sym = D.sym || []; D.notes = D.notes || [];
    return D;
  }
  const cp = v => JSON.parse(JSON.stringify(v));
  const sp = f => [f[0] * SHEET[0], f[1] * SHEET[1]];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const r2 = v => Math.round(v * 100) / 100;
  function rec(ref) { const d = data(); return Object.prototype.hasOwnProperty.call(d.shapes, ref) ? d.shapes[ref] : null; }
  function door(c, d) {
    const n = c.p.length;
    return {edge_index: d.e, edge: [c.p[d.e], c.p[(d.e + 1) % n]], at: d.t, mid: d.m, outward: d.o, faces: d.f, bearing_deg: d.b,
      width_m: d.w, opens: 'outward', symbol: data().sym[d.y] || '', swing: {hinge: d.h, arc: d.q, leaf: d.v, landing: d.g || null}};
  }
  function shape(ref) {
    const s = rec(ref); if (!s) return null;
    return cp({ref, how: data().how || '', centroid: s.k, door_summary: s.s, note: s.x || null,
      components: s.c.map(c => ({kind: c.k, label: c.l, poly: c.p, centroid: c.c, size_m: c.z, angle_deg: c.a,
        door: c.di >= 0 ? door(c, c.d[c.di]) : null, doors: c.d.map(d => door(c, d)), door_note: data().notes[c.n] || '',
        marks: c.m.map(m => ({type: m.y, lines: m.l || null, poly: m.p || null, edge_index: m.e == null ? null : m.e}))}))});
  }
  function reason(ref) {
    const d = data();
    if (rec(ref)) return null;
    if (Object.prototype.hasOwnProperty.call(d.none, ref)) return d.none[ref];
    return 'not a reference on this page';
  }
  const refs = () => Object.keys(data().shapes).sort();
  function areaPt(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const p = sp(poly[i]), q = sp(poly[(i + 1) % poly.length]); a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
  // which component the picker's "edge n" means: the first with a door drawn, else the largest
  function primary(s) {
    const i = s.c.findIndex(c => c.d.length); if (i >= 0) return i;
    let b = 0; s.c.forEach((c, k) => { if (areaPt(c.p) > areaPt(s.c[b].p)) b = k; }); return b;
  }
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  function layout(ref, o) {
    o = o || {}; const s = rec(ref); if (!s) return null;
    let proj, ppt = +o.pxPerPt, rot = o.rot != null ? +o.rot : (o.rotDeg != null ? +o.rotDeg * Math.PI / 180 : 0);
    if (typeof o.project === 'function') {
      const pc = o.project(s.k); proj = f => { const q = o.project(f); return [q[0] - pc[0], q[1] - pc[1]]; };
    } else {
      if (!(ppt > 0)) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; s.c.forEach(c => c.p.forEach(f => { const q = sp(f); x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }));
        ppt = (+o.sizePx > 0 ? +o.sizePx : 56) / Math.max(x1 - x0, y1 - y0, 1e-6); }
      const C = sp(s.k), cs = Math.cos(rot), sn = Math.sin(rot);
      proj = f => { const q = sp(f), x = (q[0] - C[0]) * ppt, y = (q[1] - C[1]) * ppt; return [cs * x - sn * y, sn * x + cs * y]; };
    }
    // the minimum size: the short side of the largest drawn part, on screen; below minPx the whole shape is scaled up
    // uniformly about its centroid (never squashed), so the shape and its door side stay recognisable at any zoom
    let big = 0; s.c.forEach((c, k) => { if (areaPt(c.p) > areaPt(s.c[big].p)) big = k; });
    const bp = s.c[big].p.map(proj);
    let shortPx;
    if (bp.length === 4) shortPx = Math.min((len(bp[0], bp[1]) + len(bp[2], bp[3])) / 2, (len(bp[1], bp[2]) + len(bp[3], bp[0])) / 2);
    else { shortPx = 1e9; for (let i = 0; i < bp.length; i++) shortPx = Math.min(shortPx, len(bp[i], bp[(i + 1) % bp.length])); }
    const minPx = o.minPx == null ? 18 : +o.minPx;
    const k = shortPx > 1e-9 && shortPx < minPx ? minPx / shortPx : 1;
    const P = f => { const q = proj(f); return [q[0] * k, q[1] * k]; };
    const comps = s.c.map((c, i) => ({i, kind: c.k, poly: c.p.map(P), centroid: P(c.c),
      marks: c.m.map(m => ({type: m.y, lines: (m.l || []).map(l => [P(l[0]), P(l[1])]), poly: m.p ? m.p.map(P) : null})),
      doors: c.d.map(d => ({edge: d.e, at: d.t, mid: P(d.m), out: (() => { const a = P(d.m), q0 = sp(d.m), b = P([(q0[0] + d.o[0]) / SHEET[0], (q0[1] + d.o[1]) / SHEET[1]]); const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; })(),
        widthPx: d.w / (data().m_per_pt || 0.7056) * (len(P(c.p[d.e]), P(c.p[(d.e + 1) % c.p.length])) / (len(sp(c.p[d.e]), sp(c.p[(d.e + 1) % c.p.length])) || 1)),
        hinge: P(d.h), arc: d.q.map(P), leaf: d.v.map(P), landing: d.g ? d.g.map(l => [P(l[0]), P(l[1])]) : null, faces: d.f}))}));
    // which door marks to draw: the master's, none, or the chosen edge
    let pick = o.door == null ? 'master' : o.door, chosen = null;
    if (typeof pick === 'number' || (pick && typeof pick === 'object')) {
      const ci = typeof pick === 'number' ? primary(s) : (+pick.component || 0), ei = typeof pick === 'number' ? pick : +pick.edge;
      const c = comps[ci];
      if (c && ei >= 0 && ei < c.poly.length && Number.isInteger(ei)) {
        const a = c.poly[ei], b = c.poly[(ei + 1) % c.poly.length], t = pick.at == null ? 0.5 : Math.max(0, Math.min(1, +pick.at));
        const mid = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], L = len(a, b) || 1; let out = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
        if ((mid[0] - c.centroid[0]) * out[0] + (mid[1] - c.centroid[1]) * out[1] < 0) out = [-out[0], -out[1]];
        chosen = {component: ci, edge: ei, at: t, mid, out, along: [(b[0] - a[0]) / L, (b[1] - a[1]) / L], edgeLen: L,
          pxPerM: L / ((len(sp(s.c[ci].p[ei]), sp(s.c[ci].p[(ei + 1) % c.poly.length])) || 1) * (data().m_per_pt || 0.7056))};
        pick = 'choice';
      } else pick = 'master';
    } else if (pick !== 'none') pick = 'master';
    // bounds (shape, swings, door arrows) and the number badge
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const grow = q => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); };
    comps.forEach(c => { c.poly.forEach(grow); if (pick === 'master') c.doors.forEach(d => { d.arc.forEach(grow); d.leaf.forEach(grow); grow([d.mid[0] + d.out[0] * 20, d.mid[1] + d.out[1] * 20]); }); });
    if (chosen) grow([chosen.mid[0] + chosen.out[0] * 16, chosen.mid[1] + chosen.out[1] * 16]);
    const badgeR = +o.badgeR > 0 ? +o.badgeR : 11, shortNow = shortPx * k;
    let badge = null;
    if (o.number != null && o.number !== '') {
      const inside = shortNow >= 2 * badgeR + 6;
      badge = inside ? {x: 0, y: 0, r: badgeR, inside: true} : {x: x1 + badgeR * 0.7, y: y0 - badgeR * 0.7, r: badgeR, inside: false};
      grow([badge.x - badge.r - 2, badge.y - badge.r - 2]); grow([badge.x + badge.r + 2, badge.y + badge.r + 2]);
    }
    const pad = 3; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    return {ref, scale: k, minPx, shortPx: shortNow, pxPerPt: typeof o.project === 'function' ? null : ppt, rot: typeof o.project === 'function' ? null : rot,
      box: [x0, y0, x1, y1], width: x1 - x0, height: y1 - y0, anchor: [-x0, -y0], components: comps, door: pick, chosen, badge};
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
  function svg(ref, o) {
    o = o || {}; const L = layout(ref, o); if (!L) return null;
    const sel = !!o.selected, fill = sel ? '#ff852f' : '#183541', ink = sel ? '#142d36' : '#ffffff', doorInk = '#d62d20';
    const s = rec(ref), sc = L.scale;
    let out = '<svg xmlns="http://www.w3.org/2000/svg" class="ms915-marker' + (sel ? ' selected' : '') + '" width="' + r2(L.width) + '" height="' + r2(L.height) +
      '" viewBox="' + r2(L.box[0]) + ' ' + r2(L.box[1]) + ' ' + r2(L.width) + ' ' + r2(L.height) + '" data-ms915-ref="' + esc(ref) + '" data-ms915-scale="' + (Math.round(sc * 10000) / 10000) +
      '" data-ms915-anchor="' + r2(L.anchor[0]) + ',' + r2(L.anchor[1]) + '" data-ms915-door="' + L.door + '" role="img" aria-label="' + esc(ref + (o.number != null ? ', load ' + o.number : '') + ': ' + (L.door === 'choice' ? 'door side chosen' : s.s)) + '" style="overflow:visible">';
    out += '<g class="ms915-shape">';
    L.components.forEach(c => {
      out += '<polygon class="ms915-comp" data-i="' + c.i + '" data-kind="' + esc(c.kind) + '" points="' + pts(c.poly) + '" fill="' + fill + '" fill-opacity="0.9" stroke="' + (sel ? '#142d36' : '#ffffff') + '" stroke-width="1.4" stroke-linejoin="round"/>';
      c.marks.forEach(m => {
        m.lines.forEach(l => { out += '<line class="ms915-mark" data-type="' + esc(m.type) + '" x1="' + r2(l[0][0]) + '" y1="' + r2(l[0][1]) + '" x2="' + r2(l[1][0]) + '" y2="' + r2(l[1][1]) + '" stroke="' + ink + '" stroke-width="1" stroke-linecap="round"/>'; });
        if (m.poly) out += '<polygon class="ms915-mark" data-type="' + esc(m.type) + '" points="' + pts(m.poly) + '" fill="' + ink + '" fill-opacity="0.85"/>';
      });
    });
    out += '</g>';
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
  // door edges for a picker: every outline edge of every part, with the master's door marked
  function doorEdges(ref) {
    const s = rec(ref); if (!s) return [];
    const out = [];
    s.c.forEach((c, ci) => c.p.forEach((f, ei) => {
      const a = sp(f), b = sp(c.p[(ei + 1) % c.p.length]), cc = sp(c.c), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; let n = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
      if ((m[0] - cc[0]) * n[0] + (m[1] - cc[1]) * n[1] < 0) n = [-n[0], -n[1]];
      const ds = c.d.filter(d => d.e === ei);
      out.push({component: ci, kind: c.k, edge: ei, length_m: Math.round(L * (data().m_per_pt || 0.7056) * 100) / 100, outward: [Math.round(n[0] * 1e4) / 1e4, Math.round(n[1] * 1e4) / 1e4],
        master_doors: ds.length, faces: ds.length ? ds[0].f : null, primary: ci === primary(s)});
    }));
    return out;
  }
  const api = {version: 'v9.15', shape, reason, refs, svg, layout, doorEdges, has: ref => !!rec(ref),
    meta: () => { const d = data(); return {version: d.v, how: d.how, source_sha256: d.source_sha256, master_sha256: d.master_sha256, sheet: d.sheet, m_per_pt: d.m_per_pt, shapes: Object.keys(d.shapes).length, none: Object.keys(d.none).length}; }};
  return Object.freeze(api);
})();
if (typeof window !== 'undefined') window.MasterShapes915 = MasterShapes915;
'''
assert 'Claude' not in JS and 'Codex' not in JS

INSERT = ('\n<script type="application/json" id="shapes915-data" data-sha256="' + BLOB_SHA + '">' + blob + '</script>\n'
          '<script id="shapes915-script">' + JS + '</script>')
ANCHOR = "if(typeof module!=='undefined'&&module.exports)module.exports=Workers911;\n\n</script>\n</body></html>"
assert s.count(ANCHOR) == 1, 'end-of-page anchor not found exactly once - stopping'
s = rep(s, "if(typeof module!=='undefined'&&module.exports)module.exports=Workers911;\n\n</script>\n</body></html>",
        "if(typeof module!=='undefined'&&module.exports)module.exports=Workers911;\n\n</script>" + INSERT + "\n</body></html>",
        'v9.15 master shapes blocks', str(p))

# nothing else moved
m2 = re.search(r'const DATA = (\{.*?\});\n', s); assert m2 and m2.group(1) == DATA_TEXT, 'DATA changed - stopping'
j0 = s.index('const MASTER_LOC = ') + len('const MASTER_LOC = '); _, j1 = dec.raw_decode(s, j0)
assert s[j0:j1] == ML_TEXT, 'MASTER_LOC changed - stopping'
assert s.replace(INSERT, '', 1) == s0, 'something other than the two new blocks changed - stopping'
p.write_bytes((b'\xef\xbb\xbf' if bom else b'') + s.encode('utf-8'))
print(f'v9.15 master shapes: {len(shapes)} references with a shape, {len(nulls)} without (reason given); '
      f'data {len(blob):,} bytes sha256 {BLOB_SHA[:16]}..., source {SHAPES_SHA[:16]}...')
