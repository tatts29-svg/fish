# Author: Andrew Fisher. v9.17 - re-derive the 23 navigation pins from the 2 Oct master itself, before any is written.
#
#   python3 -I tests/derive917.py <D001-26003-03-MASTER.pdf> <georeferencing.json> <live page html> <out json>
#
# For each of the 23 references the audit lists, this reads the master PDF (pymupdf), not the audit's numbers:
#   1. the reference's tag on the master's text layer (CP1 is tagged P68 on the master; T0243's block carries "WC");
#   2. every closed unit-sized shape (toilet, accessible toilet, 3 x 6 m block, pee panel) drawn within 30 m of the tag;
#   3. the unit(s) the audit names, matched vertex for vertex (<= 0.3 pt) to shapes found here - a shape not in the PDF fails;
#   4. single unit = the centre of its outline; a group = the middle of its footprint (the area centre of all its parts);
#   5. 2 Oct paper -> the 17 Sep frame the registration was measured on (main +25.50/+0.12 pt, inset +0/+0.06 pt, the
#      georeferencing.json frame note) -> GPS through the main or the inset transform (never the 12-tag fit in the inset);
#   6. the page's pt frame: x17 / 2384, y17 x (2600/2384) / 1837 (as v8.89 / v8.93 wrote MASTER_LOC.pt).
# Then it checks the listed point (THE ASK) against this derivation: ll within 0.2 m, pt within 0.3 pt.
# It also lists every other unit-sized shape near the unit and the tag nearest to it, so a closer unit cannot hide.
import hashlib, json, math, re, sys
import pymupdf as fitz

PDF, GEOP, PAGE, OUT = sys.argv[1:5]
pdf_bytes = open(PDF, 'rb').read()
PDF_SHA = hashlib.sha256(pdf_bytes).hexdigest()
assert PDF_SHA.startswith('8753d875'), 'not the 2 Oct master: ' + PDF_SHA
GEO = json.load(open(GEOP))
assert GEO['pdf_sha256'].startswith('8753d875')

# THE ASK (project manager, 8 Oct 2026): the 23 pins and the points the audit gives them
LISTED = {
 'CP1': ((-27.997497, 153.428419), (0.90691, 0.74989)), 'WC09': ((-27.984717, 153.428026), (0.28309, 0.36190)),
 'WC81': ((-27.997509, 153.428455), (0.90777, 0.74687)), 'WC24': ((-27.991038, 153.429656), (0.69952, 0.22861)),
 'WC35': ((-27.981799, 153.427761), (0.09098, 0.38321)), 'WC65': ((-27.981478, 153.426408), (0.06965, 0.49494)),
 'T0243': ((-27.987534, 153.428271), (0.46865, 0.34230)), 'WC26': ((-27.988803, 153.429594), (0.55233, 0.23323)),
 'WC68': ((-27.981498, 153.424438), (0.07069, 0.65768)), 'WC86': ((-27.987704, 153.428229), (0.47980, 0.34581)),
 'WC25': ((-27.990061, 153.428838), (0.63504, 0.29600)), 'WC34': ((-27.982306, 153.425877), (0.12406, 0.53895)),
 'WC70': ((-27.981659, 153.424041), (0.08120, 0.69052)), 'WC19': ((-27.988240, 153.428267), (0.51508, 0.34275)),
 'WC16': ((-27.985938, 153.427692), (0.36349, 0.38981)), 'WC17': ((-27.986529, 153.428095), (0.40243, 0.35660)),
 'WC44': ((-27.988968, 153.428254), (0.56304, 0.34401)), 'WC39': ((-27.983626, 153.423993), (0.21069, 0.69494)),
 'WC62': ((-27.981667, 153.429218), (0.08252, 0.26278)), 'WC04': ((-27.983857, 153.426516), (0.22627, 0.48648)),
 'WC02': ((-27.983618, 153.425700), (0.21045, 0.55392)), 'WC28': ((-27.983401, 153.429161), (0.19664, 0.26785)),
 'WC50': ((-27.989786, 153.429821), (0.61709, 0.21476))}
# what the 2 Oct master draws for each (the schedule's items, checked against the shapes found)
EXPECT = {'CP1': {'block': 1}, 'WC09': {'block': 2, 'toilet': 4, 'pee': 6}, 'T0243': {'block': 1}, 'WC86': {'accessible': 1},
          'WC16': {'block': 2}, 'WC17': {'block': 2}, 'WC44': {'toilet': 2}, 'WC39': {'toilet': 2}, 'WC62': {'toilet': 2}}
TAG = {'CP1': 'P68', 'T0243': 'WC'}   # CP1 is P68 (Signevent crib room) on the master; T0243 (WC-TV) is the block printed "WC"
# the audit's outlines (pins/geom/geom.json, read only) - the claim this script checks against the PDF's own shapes
CLAIM = {}

W, H, PW, PH = 2600, 1837, 2384.0, 1684.0
Z = W / PW
N = 2 ** 18 * 512
INSET = GEO['inset']['sheet_region_pts']
def in_inset(x, y): return INSET[0] <= x <= INSET[2] and INSET[1] <= y <= INSET[3]
def to17(x, y): return (x, y + 0.06) if in_inset(x, y) else (x + 25.50, y + 0.12)
def reg_ll(x17, y17, inset):
    T = GEO['inset' if inset else 'main']['sheet_to_z18px']
    px = T[0][0] * x17 + T[0][1] * y17 + T[0][2]; py = T[1][0] * x17 + T[1][1] * y17 + T[1][2]
    lon = px / N * 360 - 180; lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / N))))
    return lat, lon
def ll_of(x, y):
    i = in_inset(x, y); x17, y17 = to17(x, y); return reg_ll(x17, y17, i)
def frac_of(x, y):
    x17, y17 = to17(x, y); return (x17 / PW, y17 * Z / H)
def hav(a, b):  # the page's haversineKm (R = 6371 km), metres
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))
def bearing(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    y = math.sin(lo2 - lo1) * math.cos(la2); x = math.cos(la1) * math.sin(la2) - math.sin(la1) * math.cos(la2) * math.cos(lo2 - lo1)
    d = (math.degrees(math.atan2(y, x)) + 360) % 360
    return d, ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][int((d + 22.5) // 45) % 8]
def m_per_pt(x, y):
    a = ll_of(x, y); return hav(a, ll_of(x + 10, y)) / 10, hav(a, ll_of(x, y + 10)) / 10

def poly_area_centroid(P):
    A = cx = cy = 0.0
    for i in range(len(P)):
        x0, y0 = P[i]; x1, y1 = P[(i + 1) % len(P)]; c = x0 * y1 - x1 * y0
        A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    A /= 2
    return abs(A), (cx / (6 * A), cy / (6 * A))
def order(P):  # a quad's corners in ring order
    mx = sum(p[0] for p in P) / len(P); my = sum(p[1] for p in P) / len(P)
    return sorted(P, key=lambda p: math.atan2(p[1] - my, p[0] - mx))

doc = fitz.open(PDF); pg = doc[0]
assert len(doc) == 1 and round(pg.rect.width) == 2384 and round(pg.rect.height) == 1684
WORDS = pg.get_text('words')
# the live page's current pins (the base)
page = open(PAGE, encoding='utf-8').read()
m = re.search(r'const MASTER_LOC = ', page); ML, _ = json.JSONDecoder().raw_decode(page[m.end():])
PAGE_SHA = hashlib.sha256(page.encode('utf-8')).hexdigest()
def page_pt_to_paper(f):  # current MASTER_LOC.pt -> 2 Oct paper pt (inverse of frac_of)
    x17, y17 = f[0] * PW, f[1] * H / Z
    return (x17, y17 - 0.06) if in_inset(x17, y17 - 0.06) else (x17 - 25.50, y17 - 0.12)

# every closed shape on the sheet, once (about 20 s)
DR = pg.get_drawings()
SHAPES = []
for idx, d in enumerate(DR):
    items = d['items']
    if len(items) == 1 and items[0][0] == 'qu':
        q = items[0][1]; P = order([(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.ll.x, q.ll.y), (q.lr.x, q.lr.y)])
    elif len(items) == 1 and items[0][0] == 're':
        r = items[0][1]; P = [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
    elif all(it[0] == 'l' for it in items) and 3 <= len(items) <= 4:
        starts = [(it[1].x, it[1].y) for it in items]; end = (items[-1][2].x, items[-1][2].y)
        if len(items) == 4:
            if math.hypot(starts[0][0] - end[0], starts[0][1] - end[1]) > 0.05: continue
            P = starts
        elif d.get('closePath'):
            P = starts + [end]
        else:
            continue
    else:
        continue
    r = d['rect']
    if r.width > 12 or r.height > 12 or (r.width < 0.3 and r.height < 0.3):
        continue
    A, c = poly_area_centroid(P)
    if A <= 0.05: continue
    SHAPES.append({'i': idx, 'P': [(round(x, 3), round(y, 3)) for x, y in P], 'A': A, 'c': c, 'fill': d.get('fill'), 'color': d.get('color'), 'w': d.get('width')})

def sides_m(P):
    k = m_per_pt(*P[0]); kk = (k[0] + k[1]) / 2
    s = sorted(math.hypot(P[i][0] - P[(i + 1) % 4][0], P[i][1] - P[(i + 1) % 4][1]) * kk for i in range(4))
    return (s[0] + s[1]) / 2, (s[2] + s[3]) / 2
def kind_of(P):
    a, b = sides_m(P)  # short, long sides in metres
    if 1.0 <= a <= 1.9 and 1.0 <= b <= 1.9: return 'toilet'
    if 1.9 < a <= 3.0 and 1.9 < b <= 3.2: return 'accessible'
    if 2.4 <= a <= 3.6 and 5.0 <= b <= 7.0: return 'block'
    if 0.4 <= a <= 0.9 and 2.0 <= b <= 2.8: return 'pee'
    return None
UNITS = [dict(s, kind=kind_of(s['P'])) for s in SHAPES]
UNITS = [u for u in UNITS if u['kind']]

def match(Pc):  # the PDF shape whose corners are the claimed outline's corners
    best = None
    for u in UNITS:
        if abs(u['c'][0] - sum(p[0] for p in Pc) / len(Pc)) > 3 or abs(u['c'][1] - sum(p[1] for p in Pc) / len(Pc)) > 3: continue
        dmax = max(min(math.hypot(p[0] - q[0], p[1] - q[1]) for q in u['P']) for p in Pc)
        if best is None or dmax < best[0]: best = (dmax, u)
    return best

GEOM = json.load(open(sys.argv[5])) if len(sys.argv) > 5 else None
assert GEOM, 'give the audit geometry (pins/geom/geom.json, read only) as the 5th argument'
rows, fails = {}, []
for ref, (lst_ll, lst_pt) in LISTED.items():
    g = GEOM['refs'][ref]; comps = g['unit']['components']
    found = []
    for c in comps:
        mt = match([tuple(p) for p in c['polygon_pt']])
        if not mt or mt[0] > 0.3:
            fails.append(f'{ref}: claimed outline {c["source"]} not found in the PDF (best {mt and round(mt[0], 3)} pt)'); continue
        found.append(mt[1])
    kinds = {}
    for u in found: kinds[u['kind']] = kinds.get(u['kind'], 0) + 1
    want = EXPECT.get(ref, {'toilet': 1})
    if kinds != want: fails.append(f'{ref}: shapes found {kinds}, expected {want}')
    # the centre: one unit = its outline's centre; a group = the area centre of the whole footprint
    At = sum(u['A'] for u in found)
    cx = sum(u['A'] * u['c'][0] for u in found) / At; cy = sum(u['A'] * u['c'][1] for u in found) / At
    xs = [p[0] for u in found for p in u['P']]; ys = [p[1] for u in found for p in u['P']]
    bbox_mid = ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2)
    ll = ll_of(cx, cy); fr = frac_of(cx, cy); inset = in_inset(cx, cy)
    # the tag on the master
    tagtxt = TAG.get(ref, ref)
    tags = [((w[0] + w[2]) / 2, (w[1] + w[3]) / 2) for w in WORDS if w[4].strip().upper() == tagtxt]
    tag = min(tags, key=lambda t: math.hypot(t[0] - cx, t[1] - cy)) if tags else None
    k = m_per_pt(cx, cy); kk = (k[0] + k[1]) / 2
    tag_m = math.hypot(tag[0] - cx, tag[1] - cy) * kk if tag else None
    # other unit-sized shapes near this one, and the reference tag nearest each
    reftags = [(w[4].strip().upper(), (w[0] + w[2]) / 2, (w[1] + w[3]) / 2) for w in WORDS if re.fullmatch(r'(WC\d{2}[A-Z]?|P\d{2}|GN\d{2}|T\d{4}|WC)', w[4].strip().upper())]
    ids = {u['i'] for u in found}
    near = []
    for u in UNITS:
        if u['i'] in ids: continue
        dm = min(math.hypot(u['c'][0] - f['c'][0], u['c'][1] - f['c'][1]) for f in found) * kk
        if dm <= 10:
            nt = min(reftags, key=lambda t: math.hypot(t[1] - u['c'][0], t[2] - u['c'][1]))
            near.append({'kind': u['kind'], 'm_from_unit': round(dm, 1), 'nearest_tag': nt[0], 'tag_m': round(math.hypot(nt[1] - u['c'][0], nt[2] - u['c'][1]) * kk, 1), 'drawing': u['i']})
    # the tag nearest the derived unit should be this reference's own (or a same-name tag)
    own_tags = sorted(((t[0], round(math.hypot(t[1] - cx, t[2] - cy) * kk, 1)) for t in reftags), key=lambda x: x[1])[:3]
    d_ll = hav(ll, lst_ll)
    d_pt = math.hypot((fr[0] - lst_pt[0]) * PW, (fr[1] - lst_pt[1]) * H / Z)
    cur = ML[ref]; moved = hav(cur['ll'], ll); b, word = bearing(cur['ll'], ll)
    back_m = hav(cur['ll'], ll_of(*page_pt_to_paper(cur['pt'])))
    ok = d_ll <= 0.2 and d_pt <= 0.3
    if not ok: fails.append(f'{ref}: listed point is {d_ll:.2f} m / {d_pt:.2f} pt from the PDF derivation')
    rows[ref] = {'unit_kinds': kinds, 'n_parts': len(found), 'drawings': sorted(ids), 'paper_pt': [round(cx, 3), round(cy, 3)],
                 'bbox_middle_pt': [round(bbox_mid[0], 3), round(bbox_mid[1], 3)],
                 'bbox_middle_vs_area_centre_m': round(math.hypot(bbox_mid[0] - cx, bbox_mid[1] - cy) * kk, 2),
                 'inset': inset, 'derived_ll': [round(ll[0], 7), round(ll[1], 7)], 'derived_pt': [round(fr[0], 5), round(fr[1], 5)],
                 'listed_ll': list(lst_ll), 'listed_pt': list(lst_pt), 'listed_vs_derived_m': round(d_ll, 3), 'listed_vs_derived_pt': round(d_pt, 3),
                 'within_tolerance': ok, 'tag_text': tagtxt, 'tag_to_unit_m': None if tag_m is None else round(tag_m, 1),
                 'nearest_tags_to_unit': own_tags, 'other_units_within_10m': near,
                 'page_now_ll': cur['ll'], 'page_now_pt': cur['pt'], 'page_now_how': cur.get('how'),
                 'page_now_pt_vs_ll_m': round(back_m, 2), 'moves_m': round(moved, 2), 'moves_dir': word, 'moves_bearing': round(b)}
json.dump({'author': 'Andrew Fisher', 'what': 'v9.17 - the 23 pins re-derived from the 2 Oct master PDF',
           'pdf_sha256': PDF_SHA, 'page_sha256': PAGE_SHA, 'georeferencing': {'main_rms_m': GEO['main']['check']['rms_m'], 'inset_rms_m': GEO['inset']['check']['rms_m']},
           'frame': '2 Oct paper -> 17 Sep frame (main +25.50/+0.12 pt, inset +0/+0.06 pt) -> main or inset sheet_to_z18px; pt = x17/2384, y17*(2600/2384)/1837',
           'rule': 'single unit = centre of its outline; group = area centre of its footprint; tolerance ll 0.2 m, pt 0.3 pt',
           'shapes_scanned': len(SHAPES), 'unit_shapes': len(UNITS), 'rows': rows, 'fails': fails}, open(OUT, 'w'), indent=1)
for ref, r in rows.items():
    print(f"{ref:6s} {str(r['unit_kinds']):40s} {r['listed_vs_derived_m']:6.3f} m {r['listed_vs_derived_pt']:6.3f} pt  moves {r['moves_m']:5.2f} m {r['moves_dir']:10s} tag {r['tag_to_unit_m']} m  near:{[(n['kind'], n['m_from_unit'], n['nearest_tag']) for n in r['other_units_within_10m']]}")
print('FAILS' if fails else 'PASS', len(fails), fails[:10])
