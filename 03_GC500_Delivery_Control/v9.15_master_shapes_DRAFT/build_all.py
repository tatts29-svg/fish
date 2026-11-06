# Author: Andrew Fisher. v9.15 "every item has a shape": builds footprints_v915.json and the extended shapes_v915.json.
#
# The project manager, 9 Oct 2026 ~00:05 AEST: "Remember every item has a shape even a fwf has a shape. Disabled toilet.
# Generator too." ~00:10-00:20: "Water barrier have shapes theirs is the white and yellow long lines." / "Waste tank almost
# need to be same shape as the toilet block greyed. Clearly to say waste tank." / "Waste tanks are under the toilets so u
# wont see on master."
#
#   python3 -I build_all.py <base_page.html>
#
# Inputs (all in this folder): shapes_v915_traced_8oct.json (the 8 Oct trace, kept unchanged), inputs/inventory.json (every
# unit on the ground), inputs/traced_new.json (parts the 2 Oct master draws that the 8 Oct trace had not given a reference),
# inputs/catalogue_drawings.json and inputs/catalogue_documents.json (footprints by item type), the base page (MASTER_LOC),
# the georeferencing of the 2 Oct master, and two record pins (T0022, T0023; record version 4581, read only).
# Outputs: footprints_v915.json and shapes_v915.json. Every existing traced component keeps its geometry and doors exactly;
# fields are only added (source, units, geometry). The door re-check (evidence/doors_check.json) found 0 disagreements in
# 117 doors, so no door is changed.
import hashlib, json, math, re, sys
from pathlib import Path

here = Path(__file__).resolve().parent
BASE = Path(sys.argv[1])
M = 0.705556                       # metres per PDF point at 1:2000 (title block)
SW, SH = 2384.0, 1684.0             # sheet points (frame divisor)
GEOREF = here.parent / 'v8.93_maps_aligned_DRAFT' / 'assets_small' / 'georeferencing.json'
MASTER_SHA = '8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d'
TRACED0_SHA = 'c53e21d530f0d614a0d3d2488fe00c6770a914245f6c971c2e9e6fedd5701374'
PM_TANK = 'the project manager, 9 Oct 2026 ~00:15-00:20 AEST: same shape as the toilet block, under it'

def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(p): return json.loads(Path(p).read_text())

assert sha(here / 'shapes_v915_traced_8oct.json') == TRACED0_SHA, 'the 8 Oct trace changed - stopping'
J = load(here / 'shapes_v915_traced_8oct.json')
INV = load(here / 'inputs' / 'inventory.json')
TN = load(here / 'inputs' / 'traced_new.json')
CD = load(here / 'inputs' / 'catalogue_drawings.json')
CW = load(here / 'inputs' / 'catalogue_documents.json')
G = load(GEOREF)
assert TN['_meta']['master']['sha256'] == MASTER_SHA and J['meta']['master']['sha256'] == MASTER_SHA

page = BASE.read_text(encoding='utf-8-sig')
i0 = page.index('const MASTER_LOC = ') + len('const MASTER_LOC = ')
ML, _ = json.JSONDecoder().raw_decode(page, i0)
DATA = json.loads(re.search(r'const DATA = (\{.*?\});\n', page).group(1))
DATA_REFS = {a['key'] for a in DATA['assets']}

r7 = lambda v: round(v, 7)
def fr(p): return [r7(p[0] / SW), r7(p[1] / SH)]
def pt(f): return (f[0] * SW, f[1] * SH)

# ---------------------------------------------------------------- record pins (read only, record version 4581)
# The page's Navigate uses the newest pin somebody stood at; these two references have no MASTER_LOC entry but do have one.
PINS = {'T0022': {'lat': -27.9832377, 'lon': 153.4264908, 'at': '2026-09-23', 'what': 'record pin T0022 (stood at it, 23 Sep 2026, accuracy 4.8 m)'},
        'T0023': {'lat': -27.983303, 'lon': 153.4263373, 'at': '2026-09-21', 'what': 'record pin T0023/u1257261 (stood at it, 21 Sep 2026, accuracy 5 m)'}}
N18 = 512 * 2 ** 18
def ll2frame(lat, lon):
    x = (lon + 180) / 360 * N18; s = math.sin(math.radians(lat)); y = (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * N18
    (a, b, c), (d, e, f), _ = G['main']['sheet_to_z18px']; det = a * e - b * d; X, Y = x - c, y - f
    return [r7(((e * X - b * Y) / det) / SW), r7(((-d * X + a * Y) / det) / SH)]
# the inverse is checked against every MASTER_LOC entry that carries both a lat/lon and a frame point
_err = []
for r, e in ML.items():
    if e.get('ll') and e.get('pt'):
        q = pt(e['pt'])
        if 1482.86 <= q[0] <= 2334.08 and 873.42 <= q[1] <= 1464.24: continue   # inset: own registration
        g = pt(ll2frame(*e['ll'])); _err.append(math.hypot(g[0] - q[0], g[1] - q[1]) * M)
assert _err and max(_err) < 0.5, f'georeferencing inverse off by {max(_err):.2f} m - stopping'

# ---------------------------------------------------------------- footprints: reconcile the two catalogues
CHOSEN = {   # closest sourced evidence, used as the drawn shape where both catalogues say "size to confirm"
    '200kva & cables': ([4.2, 1.6], 'coates_lrg_2023.pdf page 50, text lines 38-45: CUMMINS Generator - 200kVA 4200 x 1600 mm (the larger of the two Coates 200 kVA models; ATLAS COPCO 3470 x 1440 mm is the other; the contract does not say which)'),
    'Generator 200kva': ([4.2, 1.6], 'coates_lrg_2023.pdf page 50, text lines 38-45: CUMMINS Generator - 200kVA 4200 x 1600 mm (the larger of the two Coates 200 kVA models)'),
    '100KVA TRAILER': ([3.42, 1.45], 'coates_lrg_2023.pdf page 45, text lines 438-445: CUMMINS Generator - 100kVA 3420 x 1450 mm (a skid unit, the largest Coates 100 kVA footprint; no trailer-mounted 100 kVA row)'),
    'Light Tower': ([2.5, 1.75], 'coates_lrg_2023.pdf page 36, text lines 105-112: JLG Lighting Tower 6000W Hydraulic 2500 x 1750 mm (a different model from the LED Metro / Hybrid / POD towers on the contract)'),
    'Forklift 5T': ([4.24, 2.26], 'coates_lrg_2023.pdf page 15, text lines 173-180: CLARK Forklift 5t Diesel 4240 x 2260 mm (with 1.8 m tynes the length is more)'),
    'Forklift 2.5T RT': ([2.95, 1.45], 'coates_lrg_2023.pdf page 12, text lines 138-145: MANITOU Forktruck Rt Container 2.5t 4wd 2950 x 1450 mm (closest row; the contract models are not in the guide)'),
    '3.5T Forklift Std': ([4.24, 2.26], 'coates_lrg_2023.pdf page 15, text lines 173-180: CLARK Forklift 5t Diesel 4240 x 2260 mm (the contract calls asset 1272166 a 5.0t forklift)'),
}
NOT_FOOTPRINT = {'Fridge Lge', 'Fridge', 'Pad Chair', 'fencing', 'Steel Plate'}

def disagree(a, b):
    if not a or not b: return None
    return round(max(abs(a[0] - b[0]) / max(a[0], b[0]), abs(a[1] - b[1]) / max(a[1], b[1])) * 100, 1)

def drawn_direct(d):
    """the drawing catalogue size was measured on the master from instances of this type (not taken from an item name)"""
    if not d or not d.get('size_m') or not d.get('n_instances'): return False
    da = d.get('drawn_as_m')
    if da and disagree(da, d['size_m']) > 1: return False
    return True

def reconcile(key, d, w, unit_written=None):
    """returns (size_m, state, confirm, why)"""
    ds = d.get('size_m') if d else None
    ws = unit_written or (w.get('size_m') if w else None)
    direct = drawn_direct(d)
    if key == 'Waste tank':
        return (ds, 'the block it sits under', False, PM_TANK + '; each tank takes its own block\'s traced outline (the contract writes the tank 6.0 x 2.4 m, inside the block\'s 6.0 x 3.0 m)')
    w_confirm = (not ws) or (w and str(w.get('size_state', '')).startswith('size to confirm') and not unit_written)
    d_confirm = (not ds) or (d and d.get('status') == 'size to confirm')
    dis = disagree(ds, ws)
    if ds and ws and dis is not None and dis <= 10 and not w_confirm and not d_confirm:
        return ((ds if direct else ws), 'agreed', False, f'drawn and written agree within {dis}%; ' + ('the size measured on the master is used' if direct else 'the written size is used (the drawing catalogue size is not measured on the master)'))
    if direct:
        return (ds, 'drawn on the master', False, ('the written size differs by ' + str(dis) + '%; ' if dis is not None else 'no written size; ') + 'the drawing evidence is direct (measured on the master), so the drawn size is used')
    # not direct: size to confirm, but still a shape at the best sourced size
    if ws:
        return (ws, 'size to confirm', True, 'size to confirm: the written size is used as the best sourced size' + (f' (it differs from the drawing catalogue by {dis}%)' if dis else ''))
    if key in CHOSEN:
        return (CHOSEN[key][0], 'size to confirm', True, 'size to confirm: closest sourced evidence ' + CHOSEN[key][1])
    if ds:
        return (ds, 'size to confirm', True, 'size to confirm: the drawing catalogue size is used as the best sourced size')
    return (None, 'size to confirm', True, 'size to confirm: no drawing or document gives a size')

def short_src(srcs, n=4):
    out = []
    for s in (srcs or [])[:n]:
        if isinstance(s, dict):
            out.append(' '.join(str(s.get(k)) for k in ('file', 'where', 'page') if s.get(k) not in (None, '')) + (': ' + str(s.get('says') or s.get('how_measured') or ''))[:260])
        else:
            out.append(str(s)[:260])
    return out

FOOT = {}
for key in sorted(set(CD['types']) | set(CW['types'])):
    d = CD['types'].get(key); w = CW['types'].get(key)
    if key in NOT_FOOTPRINT:
        FOOT[key] = {'key': key, 'footprint': False, 'why': (w or d or {}).get('door_rule') or 'not a footprint item (contents of a building)',
                     'drawn': d and {'size_m': d.get('size_m'), 'status': d.get('status')}, 'written': w and {'size_m': w.get('size_m'), 'size_state': w.get('size_state')}}
        continue
    size, state, confirm, why = reconcile(key, d, w)
    FOOT[key] = {
        'key': key, 'footprint': True,
        'size_m': size, 'size_state': state, 'confirm': confirm, 'why': why,
        'drawn': d and {'size_m': d.get('size_m'), 'drawn_as_m': d.get('drawn_as_m'), 'n_instances': d.get('n_instances'), 'direct': drawn_direct(d),
                        'status': d.get('status'), 'closest_evidence': d.get('closest_evidence'), 'note': d.get('note') or d.get('conflict'), 'sources': short_src(d.get('sources'))},
        'written': w and {'size_m': w.get('size_m'), 'size_state': w.get('size_state'), 'size_basis': w.get('size_basis'), 'conflicts': w.get('conflicts'),
                          'variants': w.get('variants'), 'sources': short_src(w.get('sources'))},
        'disagree_pct': disagree(d and d.get('size_m'), w and w.get('size_m')),
        'door_rule': {'drawings': d and d.get('door_rule'), 'documents': w and w.get('door_rule')},
        'closest_evidence': CHOSEN[key][1] if key in CHOSEN else None,
    }
for k, v in FOOT.items():
    if v.get('footprint') and v['size_m'] is None:
        v['geometry'] = 'point'   # no size anywhere: drawn as a marker, never as an invented outline

def written_for_unit(key, ref, idx):
    w = CW['types'].get(key) or {}
    for r in w.get('per_reference') or []:
        if r and r.get('ref') == ref and (r.get('unit') == idx or (idx is None and r.get('unit') is None)) and r.get('size_m'):
            return r['size_m'], (r.get('contract_2026') or {}).get('cell') or r.get('size_from')
    return None, None

# ---------------------------------------------------------------- geometry helpers
def rect(c, L, W, ang):
    """L x W metres, centred at frame point c, long axis at ang degrees (drawing: 0 = right, clockwise, y down)"""
    cx, cy = pt(c); hl, hw = L / 2 / M, W / 2 / M; a = math.radians(ang)
    u = (math.cos(a), math.sin(a)); v = (-math.sin(a), math.cos(a))
    P = [(cx - hl * u[0] - hw * v[0], cy - hl * u[1] - hw * v[1]), (cx + hl * u[0] - hw * v[0], cy + hl * u[1] - hw * v[1]),
         (cx + hl * u[0] + hw * v[0], cy + hl * u[1] + hw * v[1]), (cx - hl * u[0] + hw * v[0], cy - hl * u[1] + hw * v[1])]
    return [fr(p) for p in P]

def centroid(poly):
    P = [pt(f) for f in poly]
    if len(P) < 3: return fr((sum(p[0] for p in P) / len(P), sum(p[1] for p in P) / len(P)))
    A = cx = cy = 0.0
    for i in range(len(P)):
        x0, y0 = P[i]; x1, y1 = P[(i + 1) % len(P)]; c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    A /= 2
    return fr((cx / (6 * A), cy / (6 * A)))

def move(c, ang, metres):
    p = pt(c); a = math.radians(ang); return fr((p[0] + math.cos(a) * metres / M, p[1] + math.sin(a) * metres / M))

def line_pieces(c, n, piece_m, width_m, ang):
    """a straight run of n pieces centred at c: the line (piece end mid points) and the pieces alternating yellow/white"""
    a = math.radians(ang); u = (math.cos(a), math.sin(a)); L = n * piece_m / M; p0 = pt(c)
    start = (p0[0] - u[0] * L / 2, p0[1] - u[1] * L / 2)
    pts_ = [(start[0] + u[0] * k * piece_m / M, start[1] + u[1] * k * piece_m / M) for k in range(n + 1)]
    marks = []
    for k in range(n):
        mid = ((pts_[k][0] + pts_[k + 1][0]) / 2, (pts_[k][1] + pts_[k + 1][1]) / 2)
        marks.append({'type': 'piece', 'colour': 'yellow' if k % 2 == 0 else 'white', 'what': 'one TL2 piece (standard, not drawn)',
                      'poly': rect(fr(mid), piece_m, width_m, ang)})
    return [fr(p) for p in pts_], marks

# ---------------------------------------------------------------- units per reference
UNITS = {}
for u in INV['units']:
    UNITS.setdefault(u['ref'], []).append(u)
CANCELLED = {r for r, us in UNITS.items() if all(not str(x['ref_state']).startswith('active') for x in us)}

TYPE_KIND = {'fwf': 'toilet', 'accessible_toilet': 'accessible_toilet', 'pee_panel': 'pee_panel', 'toilet_block_6m': 'toilet_block',
             'toilet_block_16pan': 'toilet_block', 'waste_tank': 'waste_tank', 'light_tower': 'light_tower', 'vms_board': 'vms_board',
             'water_barrier_tl2': 'water_barrier', 'forklift': 'forklift', 'fwf_trailer': 'fwf_trailer', 'trakmat': 'trakmat',
             'distribution_board': 'distribution_board', 'container_3m': 'container', 'refrigerated_container': 'container', 'other': 'container'}
def kind_of(t):
    if t in TYPE_KIND: return TYPE_KIND[t]
    if t.startswith('generator'): return 'generator'
    if t.startswith('building') or t == 'ticket_box': return 'building'
    return t
KIND_LABEL = {'toilet': 'FWF (single toilet)', 'accessible_toilet': 'accessible (disabled) toilet', 'generator': 'generator',
              'light_tower': 'light tower', 'vms_board': 'VMS board', 'water_barrier': 'water-filled barrier line (TL2 pieces)',
              'forklift': 'forklift', 'fwf_trailer': 'FWF toilet trailer', 'trakmat': 'trakmat', 'distribution_board': 'distribution board',
              'container': 'container', 'building': 'building', 'waste_tank': 'WASTE TANK'}
DOOR_STD = {
    'building': 'door side not on the master. The drawing rule (catalogue): one door on a long side, about a quarter of the way along, 0.78 m swing, opening outward; which long side and which end is per unit, to choose in the picker',
    'container': 'door side not on the master. The legend STORAGE CONTAINERS draws double doors on one short end; which end is to choose in the picker',
    'toilet': 'door side not on the master: no single toilet has a door drawn (the chevron on drawn ones is not explained by the legend); to choose in the picker',
    'fwf_trailer': 'door side not on the master (no drawn or written rule); to choose in the picker',
    'waste_tank': 'no door (a tank, under its block)',
}
def door_note_std(kind): return DOOR_STD.get(kind, 'no door')

def number_of(u):
    s = u.get('asset_or_supplier_no')
    if not s: return None
    m = re.match(r'\s*([0-9A-Za-z]+)', str(s)); return m.group(1) if m else None

def loading_hint(u):
    n = number_of(u)
    return ('u' + n) if n else ('item:' + u['item_as_written'])

# ---------------------------------------------------------------- build
refs = J['refs']; order = list(J['meta']['refs_order'])
for r in UNITS:
    if r not in refs:
        u0 = UNITS[r][0]
        refs[r] = {'ref': r, 'on_page': r in DATA_REFS, 'ref_kind': u0['ref_kind'], 'master_loc': None, 'master_loc_how': None,
                   'status': 'not_on_master', 'shape': None, 'reason': None}
        order.append(r)
# MASTER_LOC from the base page (the trace does not depend on it; standard parts are placed at it)
for r, e in refs.items():
    if r in ML:
        e['master_loc'] = ML[r]['pt']; e['master_loc_how'] = ML[r].get('how')

counts = {'components_master_8oct': 0, 'components_master_9oct': 0, 'components_standard': 0, 'components_under_block': 0,
          'duplicates_not_drawn_twice': 0, 'units': 0, 'units_by_source': {}, 'units_by_type': {}, 'cancelled_units': 0}
NEW_HOW = TN['_meta']['how']

for r in order:
    e = refs[r]; units = UNITS.get(r, [])
    sh = e.get('shape')
    comps = sh['components'] if sh else []
    for c in comps:   # the 8 Oct trace: geometry and doors unchanged, fields added
        c.setdefault('source', 'master'); c.setdefault('standard', False); c.setdefault('geometry', 'polygon'); c['units'] = []
        counts['components_master_8oct'] += 1
    first_new = len(comps)
    for c in TN.get(r, []):
        c = json.loads(json.dumps(c)); c['source'] = 'master'; c['standard'] = False
        c['geometry'] = 'polyline' if c.get('geometry') == 'polyline' else 'polygon'; c['units'] = []; c['traced'] = NEW_HOW
        comps.append(c); counts['components_master_9oct'] += 1
    # unit -> component
    unit_rows = []
    by_kind_used = set()
    def master_index(u):
        v = u.get('v915')
        if u['status'] == 'TRACED' and v:
            assert v['ref'] == r; return v['index']
        return None
    new_by_kind = {}
    for k in range(first_new, len(comps)):
        new_by_kind.setdefault(comps[k]['kind'], []).append(k)
    std_needed = []
    for n, u in enumerate(units, 1):
        row = {'n': n, 'type': u['type'], 'item': u['item_as_written'], 'type_index': u['unit_index'], 'owner': u.get('owner'),
               'number': u.get('asset_or_supplier_no'), 'loading_id': loading_hint(u), 'status': u['status'], 'ref_state': u['ref_state'],
               'components': [], 'source': None, 'note': u.get('note')}
        if u.get('pieces'): row['pieces'] = u['pieces']
        mi = master_index(u)
        if r in CANCELLED:
            row['cancelled'] = True; counts['cancelled_units'] += 1
            if mi is None:
                row['source'] = 'cancelled'; row['note'] = 'cancelled or deleted on the record; kept and marked, no shape'
                unit_rows.append(row); continue
            row['note'] = 'cancelled on the record; the 2 Oct master still draws it, so its traced shape is kept'
        if mi is not None:
            row['components'] = [mi]; row['source'] = 'master'
        elif u['type'] == 'water_barrier_tl2' and new_by_kind.get('water_barrier'):
            row['components'] = list(new_by_kind['water_barrier']); row['source'] = 'master'
            drawn = sum(comps[k].get('pieces_drawn') or 0 for k in row['components'])
            row['pieces_drawn'] = drawn
            conf = sorted({comps[k]['match']['confidence'] for k in row['components']})
            row['note'] = f'{drawn} pieces drawn on the master against {u.get("pieces")} on the contract; match confidence {"/".join(conf)}'
        elif new_by_kind.get(kind_of(u['type'])):   # drawn on the master, traced 9 Oct
            k = new_by_kind[kind_of(u['type'])].pop(0); row['components'] = [k]; row['source'] = 'master'
            mt = comps[k].get('match') or {}
            row['note'] = mt.get('basis')
        else:
            std_needed.append((row, u))
        unit_rows.append(row)

    # ---- P27 / P29: one tag covers the four buildings of the block; give each its own building (tag order), to confirm
    if r in ('P27', 'P29') and unit_rows and unit_rows[0]['components'] == [0]:
        j = 0 if r == 'P27' else 1
        unit_rows[0]['components'] = [j]
        unit_rows[0]['note'] = ('one tag "P34/24/26/27/28/29" covers the block\'s four buildings and the master does not say which is which: '
                                f'{r} is given building {j + 1} of 4 in tag order, to confirm')

    # ---- standard parts (not drawn on the master)
    placed = True; anchor_how = None
    if std_needed:
        if any(not c.get('standard') and c['geometry'] == 'polygon' for c in comps):
            anchor = None
        elif r in ML:
            anchor = ML[r]['pt']; anchor_how = 'MASTER_LOC (the page\'s own position for this reference: ' + str(ML[r].get('how')) + ')'
        elif r in PINS:
            anchor = ll2frame(PINS[r]['lat'], PINS[r]['lon']); anchor_how = PINS[r]['what'] + ', the point Navigate uses'
        else:
            anchor = [0.5, 0.5]; placed = False
            anchor_how = 'not placed: no position on the master, MASTER_LOC or a record pin (the shape is for Arrange loads; it is not drawn on the map)'
        drawn_polys = [c for c in comps if not c.get('standard') and c['geometry'] == 'polygon']
        groups = {}
        for row, u in std_needed:
            groups.setdefault(u['type'], []).append((row, u))
        for t, items in groups.items():
            kind = kind_of(t)
            for gi, (row, u) in enumerate(items):
                key = u['item_as_written']
                fk = FOOT.get(key) or {}
                uw, ucell = written_for_unit(key, r, u['unit_index'])
                size, state, confirm, why = reconcile(key, CD['types'].get(key), CW['types'].get(key), uw) if fk.get('footprint') else (None, 'size to confirm', True, 'no footprint')
                if t == 'waste_tank':
                    ub = u.get('under_block') or {}
                    blocks = [x for x in unit_rows if x['type'] == 'toilet_block_6m']
                    blk = None
                    if ub.get('block_asset'):
                        blk = next((x for x in blocks if number_of({'asset_or_supplier_no': x['number']}) == ub['block_asset']), None)
                    if blk is None and r == 'WC60':   # record delivery/WC60 note, 1 Oct 2026: 1119489 with 1328980; 1087500 with 1328981
                        pair = {'1328980': '1119489', '1328981': '1087500'}[number_of(u)]
                        blk = next(x for x in blocks if number_of({'asset_or_supplier_no': x['number']}) == pair)
                        ub = dict(ub, block_asset=pair, pairing_basis='record delivery/WC60 note, 1 Oct 2026 (block 1119489 with tank 1328980; block 1087500 with tank 1328981)')
                    if blk is None and len(blocks) == 1: blk = blocks[0]
                    assert blk and blk['components'], f'{r}: no block for waste tank {u.get("asset_or_supplier_no")}'
                    bi = blk['components'][0]; B = comps[bi]
                    c = {'kind': 'waste_tank', 'label': 'WASTE TANK (under toilet block ' + str(blk['number'] or blk['n']) + ')',
                         'poly': [list(p) for p in B['poly']], 'centroid': list(B['centroid']), 'size_m': list(B['size_m']),
                         'angle_deg': B['angle_deg'], 'area_m2': B.get('area_m2'), 'inset': B.get('inset', False),
                         'doors': [], 'door': None, 'door_note': door_note_std('waste_tank'), 'marks': [],
                         'source': PM_TANK + '; the master does not draw tanks (expected)', 'standard': True, 'geometry': 'polygon',
                         'under': bi, 'size_state': 'the block it sits under', 'confirm': False, 'footprint_key': 'Waste tank',
                         'written_tank_size_m': [6.0, 2.4], 'units': [],
                         'pairing': ub.get('pairing_basis') or 'record', 'block_drawing_note': ('which drawn block carries which asset number is not on any source; the tank follows its block' if len(blocks) > 1 else None)}
                    comps.append(c); row['components'] = [len(comps) - 1]; row['source'] = 'under its block'; row['under_block'] = blk['n']
                    counts['components_under_block'] += 1
                    continue
                geom = 'polyline' if kind == 'water_barrier' else ('point' if size is None else 'polygon')
                # where: continue a drawn row of the same kind, else beside the largest drawn part, else at the anchor
                same = [k for k, c in enumerate(comps) if c['kind'] == kind and not c.get('standard') and c['geometry'] == 'polygon']
                if geom == 'polyline':
                    n_p = int(u.get('pieces') or 0); assert n_p > 0
                    line, marks = line_pieces(anchor, n_p, size[0], size[1], 0.0)
                    c = {'kind': kind, 'label': 'water-filled barrier line (TL2 pieces), not drawn on the master', 'poly': line,
                         'centroid': fr(pt(anchor)), 'size_m': [round(n_p * size[0], 2), size[1]], 'angle_deg': 0.0, 'inset': False,
                         'doors': [], 'door': None, 'door_note': 'barrier: no door', 'marks': marks, 'pieces': n_p, 'piece_m': size,
                         'place_note': 'not drawn on the 2 Oct master: the run is shown straight, square to the sheet, centred on MASTER_LOC; its line and direction are to confirm'}
                elif same:
                    last = comps[same[-1]]; ang = last['angle_deg']
                    if len(same) >= 2:
                        a0, a1 = pt(comps[same[-2]]['centroid']), pt(comps[same[-1]]['centroid'])
                        d_ = (a1[0] - a0[0], a1[1] - a0[1]); dl = math.hypot(*d_) or 1
                        step = dl * M; dirn = math.degrees(math.atan2(d_[1], d_[0]))
                        step = min(max(step, size[1] + 0.1), size[0] * 3)
                    else:
                        dirn = ang; step = size[0] + 0.3
                    k_ = sum(1 for x in comps if x.get('row_of') == r + ':' + kind)
                    cc = move(last['centroid'], dirn, step * (k_ + 1))
                    c = {'kind': kind, 'poly': rect(cc, size[0], size[1], ang), 'centroid': cc, 'size_m': size, 'angle_deg': round(ang, 2),
                         'row_of': r + ':' + kind, 'place_note': 'not drawn on the master: placed after the drawn row of this kind, same rotation and spacing (to confirm on site)'}
                elif drawn_polys:
                    big = max(drawn_polys, key=lambda c: c['size_m'][0] * c['size_m'][1])
                    k_ = sum(1 for x in comps if x.get('beside') == r)
                    off = big['size_m'][0] / 2 + 1.0 + ((size[0] if size else 0) / 2) + k_ * ((size[0] if size else 1.0) + 0.5)
                    cc = move(big['centroid'], big['angle_deg'], off)
                    c = {'kind': kind, 'centroid': cc, 'angle_deg': round(big['angle_deg'], 2), 'beside': r,
                         'place_note': 'not drawn on the master: shown beside the drawn ' + big['kind'] + ' at this reference (place to confirm)'}
                    if size: c.update({'poly': rect(cc, size[0], size[1], big['angle_deg']), 'size_m': size})
                    else: c.update({'poly': [cc], 'size_m': None})
                else:
                    n_t = len(items); W_ = (size[1] if size else 1.0) + 0.6
                    cc = move(anchor, 90.0, (gi - (n_t - 1) / 2) * W_)   # a tidy row side by side, square to the sheet
                    c = {'kind': kind, 'centroid': cc, 'angle_deg': 0.0,
                         'place_note': ('not drawn on the master: ' + (f'unit {gi + 1} of {n_t} in a tidy row, ' if n_t > 1 else '') +
                                        ('square to the sheet at ' + anchor_how if placed else
                                         'not placed on the map (no position on the master, MASTER_LOC or a record pin); laid out for the picture only'))}
                    if size: c.update({'poly': rect(cc, size[0], size[1], 0.0), 'size_m': size})
                    else: c.update({'poly': [cc], 'size_m': None})
                if 'poly' not in c: c['poly'] = [c['centroid']]
                c.setdefault('label', KIND_LABEL.get(kind, kind) + ' (' + key + '), not drawn on the master')
                c.setdefault('inset', False); c.setdefault('marks', [])
                c.update({'doors': [], 'door': None, 'door_note': door_note_std(kind) if kind != 'water_barrier' else 'barrier: no door',
                          'standard': True, 'geometry': geom, 'size_state': state, 'confirm': confirm, 'size_why': why, 'footprint_key': key,
                          'units': []})
                if uw: c['size_written_for_unit'] = {'size_m': uw, 'where': ucell}
                if geom == 'polygon': c['area_m2'] = round(size[0] * size[1], 1)
                srcname = (ucell and ('contract line ' + ucell)) or ('footprints_v915.json "' + key + '"')
                c['source'] = 'not drawn on the master — footprint from ' + (
                    (srcname + (' (size to confirm)' if confirm else '')) if size else 'no source (size to confirm; drawn as a marker, no outline)')
                if kind == 'trakmat' and u.get('pieces'): c['pieces'] = u['pieces']; c['label'] = f'trakmat {size[0]} x {size[1]} m, x{u["pieces"]} (laid layout not drawn)'
                if not placed: c['placed'] = False
                comps.append(c); row['components'] = [len(comps) - 1]; row['source'] = 'standard'
                counts['components_standard'] += 1
    # WC57 parts 2-6 are the same drawn symbols as WC59 units 3-7 (the master puts 7 under the WC57 tag; the schedule and
    # the record give WC59 7): each toilet is drawn once, as WC59 (tag swap to confirm)
    if r == 'WC57':
        for k in (2, 3, 4, 5, 6):
            comps[k]['drawn_as'] = {'ref': 'WC59', 'note': 'same drawn symbol as WC59 unit (the WC57/WC59 tags look swapped: to confirm); drawn once, as WC59'}
            counts['duplicates_not_drawn_twice'] += 1
    for row in unit_rows:
        for k in row['components']:
            comps[k]['units'].append(row['n'])
    e['units'] = unit_rows
    for row in unit_rows:
        if row['source'] == 'cancelled' or row.get('cancelled'): continue
        counts['units'] += 1
        counts['units_by_source'][row['source']] = counts['units_by_source'].get(row['source'], 0) + 1
        tb = counts['units_by_type'].setdefault(row['type'], {})
        tb[row['source']] = tb.get(row['source'], 0) + 1
    if r in CANCELLED:
        e['cancelled'] = units[0]['ref_state']
    if r in CANCELLED and not comps:
        e['shape'] = None
        e['reason'] = 'cancelled or deleted on the record (' + str(units[0]['ref_state']) + '); kept with its units, no shape'
        e['status'] = 'cancelled'
        continue
    if not comps:
        if r == 'T0265':
            e['reason'] = ('no placed unit: the 4 fridges ("OP42 Fridge") are contents, not placed outside as far as any source says; '
                           'no drawing or document gives a fridge footprint (size to confirm)')
        continue
    if sh is None:
        cs = [pt(c['centroid']) for c in comps]
        sh = {'ref': r, 'components': comps, 'centroid': fr((sum(p[0] for p in cs) / len(cs), sum(p[1] for p in cs) / len(cs))),
              'how': (NEW_HOW if any(not c['standard'] for c in comps) else 'standard footprints (not drawn on the 2 Oct master)'),
              'door_summary': 'no door drawn'}
        e['shape'] = sh; e['reason'] = None
        e['status'] = 'drawn_on_master_9oct' if any(not c['standard'] for c in comps) else 'standard_not_on_master'
        nd = sum(len(c['doors']) for c in comps)
        if nd:
            f = sorted({d['faces'] for c in comps for d in c['doors']})
            sh['door_summary'] = f'{nd} door{"s" if nd > 1 else ""} drawn, facing ' + ' / '.join(f)
    sh['components'] = comps
    sh['kinds'] = {}
    for c in comps: sh['kinds'][c['kind']] = sh['kinds'].get(c['kind'], 0) + 1
    sh['placed'] = placed if not any(not c['standard'] for c in comps) else True
    if not sh['placed']: sh['place_note'] = anchor_how
    elif anchor_how and std_needed: sh['standard_anchor'] = anchor_how

# every inventory unit is accounted for, once
n_inv = len(INV['units']); n_rows = sum(len(e.get('units') or []) for e in refs.values())
assert n_rows == n_inv, (n_rows, n_inv)
for r, e in refs.items():
    if e['shape'] is None:
        assert r in CANCELLED or r == 'T0265', f'{r} has no shape'
        continue
    used = {}
    for row in e['units']:
        if row['source'] == 'cancelled': continue
        assert row['components'], f'{r} unit {row["n"]} has no component'
        for k in row['components']: used[k] = used.get(k, 0) + 1
    assert all(v == 1 for v in used.values()), f'{r}: a component carries two units'

J['meta'].update({
    'built': '9 Oct 2026',
    'what': 'v9.15 master shapes, every item: every unit on the ground has a shape. Traced from the 2 Oct master where it is drawn '
            '(source "master"); otherwise its catalogue footprint, placed at the reference (source "not drawn on the master - footprint from ...")',
    'refs_order': order,
    'base_page_for_master_loc': {'sha256': hashlib.sha256(BASE.read_bytes()).hexdigest(), 'MASTER_LOC_entries': len(ML)},
    'counts_9oct': counts,
    'inputs': {'shapes_v915_traced_8oct.json': TRACED0_SHA, **{f'inputs/{n}': sha(here / 'inputs' / n) for n in
               ('inventory.json', 'traced_new.json', 'catalogue_drawings.json', 'catalogue_documents.json')},
               'georeferencing.json': sha(GEOREF), 'evidence/doors_check.json': sha(here / 'evidence' / 'doors_check.json')},
    'doors_fixed': [],
    'doors_check': '117 of 117 door arcs agree with an independent read of the master (evidence/doors_check.json): no door changed',
    'styles': {'master': 'solid outline (traced from the 2 Oct master)', 'standard': 'dashed outline (footprint from a cited source, not drawn on the master)',
               'waste_tank': 'grey, lighter than the block, labelled WASTE TANK; on the map its outline sits offset under the block with a "+ WASTE TANK" tag'},
})
J['meta']['counts'].update({'refs_total': len(refs), 'shapes': sum(1 for e in refs.values() if e['shape']),
                            'components': sum(len(e['shape']['components']) for e in refs.values() if e['shape'])})
for k in ('null_identity_unproven', 'null_not_on_master'):
    J['meta']['counts'].pop(k, None)
J['meta']['counts']['null'] = sorted(r for r, e in refs.items() if not e['shape'])

FOOT_OUT = {'meta': {'author': 'Andrew Fisher', 'built': '9 Oct 2026',
                     'what': 'footprint by item type: the size used for a unit the master does not draw, reconciled from the drawings catalogue and the documents catalogue',
                     'rule': 'agree within 10%: the size measured on the master where the drawing evidence is direct, else the written size. '
                             'Disagree by more than 10%, or one says "size to confirm": both recorded; the drawn size is used only where the drawing evidence is direct; '
                             'otherwise "size to confirm", with the best sourced size still drawn and flagged. A traced unit always uses its own traced outline.',
                     'direct': 'the drawings catalogue size was measured on the master from instances of that type (not from an item name, not a symbol)',
                     'inputs': {'inputs/catalogue_drawings.json': sha(here / 'inputs' / 'catalogue_drawings.json'),
                                'inputs/catalogue_documents.json': sha(here / 'inputs' / 'catalogue_documents.json')}},
            'types': FOOT}
(here / 'footprints_v915.json').write_text(json.dumps(FOOT_OUT, indent=1, ensure_ascii=False) + '\n')
(here / 'shapes_v915.json').write_text(json.dumps(J, ensure_ascii=False, separators=(',', ':')) + '\n')
print('footprints_v915.json', sha(here / 'footprints_v915.json'))
print('shapes_v915.json', sha(here / 'shapes_v915.json'))
print(json.dumps(counts, indent=1))
print('null:', J['meta']['counts']['null'])

# the patch carries both checksums and refuses any other file
pp = here / 'patch_v915_shapes.py'; pt_ = pp.read_text()
pt_ = re.sub(r"SHAPES_SHA = '[^']*'", f"SHAPES_SHA = '{sha(here / 'shapes_v915.json')}'", pt_, count=1)
pt_ = re.sub(r"FOOTPRINTS_SHA = '[^']*'", f"FOOTPRINTS_SHA = '{sha(here / 'footprints_v915.json')}'", pt_, count=1)
pp.write_text(pt_)
