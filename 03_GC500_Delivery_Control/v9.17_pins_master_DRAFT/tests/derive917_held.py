# Author: Andrew Fisher. v9.17 (third round) - re-derive the four pins the project manager answered on 8 Oct (about 23:20
# AEST: "the long row"; "Wc13 qty 2"; "Wc69 qty 12") from the 2 Oct master itself, before any is written.
#
#   python3 -I tests/derive917_held.py <D001-26003-03-MASTER.pdf> <georeferencing.json> <live page html> \
#        <geom.json (the audit's outlines, read only)> <out json>
#
# The same method as derive917.py: every closed unit-sized shape on the sheet (pymupdf); each outline the audit names must
# be a shape in the PDF (vertex for vertex, <= 0.3 pt), all 1.2 m toilet symbols and as many as expected; the same-size
# shapes touching the group are counted too (a group cannot be cut short); the point is the area centre of the toilets
# drawn; 2 Oct paper -> 17 Sep frame (main +25.50/+0.12 pt) -> GPS through the MAIN transform of georeferencing.json
# (none of the four is in the Cypress inset); the page's pt frame x17/2384, y17*(2600/2384)/1837.
#   WC59 -> the 7-toilet long row the master labels WC57 ("WC59's 7 toilets are the long row");
#   WC57 -> the 2-toilet pair inside the SUPPLY fence (its 2 toilets, due 13 Oct);
#   WC13 -> the middle of the drawn row of 3 (the schedule and the project manager: 2 toilets);
#   WC69 -> the middle of the row of 9 under the WC69 label (12 = the 9 + the column of 3 on the fence, measured below).
# Each derived point is checked against the audit's point: more than 0.3 pt (or 0.2 m) apart is refused (listed in
# "fails"; the patch will not run while there is one).
import hashlib, json, math, re, sys
import pymupdf as fitz

PDF, GEOP, PAGE, GEOMP, OUT = sys.argv[1:6]
PDF_SHA = hashlib.sha256(open(PDF, 'rb').read()).hexdigest()
assert PDF_SHA.startswith('8753d875'), 'not the 2 Oct master: ' + PDF_SHA
GEO = json.load(open(GEOP)); assert GEO['pdf_sha256'].startswith('8753d875')
GEOM = json.load(open(GEOMP))

# THE ASK: which drawn unit each goes to (the audit's outline, by the audit row that names it), how many toilets the master
# draws there, and the audit's point. WC59/WC57 points are as the audit gave them (pt in the y17/1684 frame); WC13/WC69
# are the audit's 2 Oct sheet points.
ASK = {
 'WC59': {'outline_of': 'WC57', 'toilets': 7, 'audit_ll': (-27.9881826, 153.4301687), 'audit_pt_y1684': (0.51159, 0.18568), 'said_m': 5.6},
 'WC57': {'outline_of': 'WC59', 'toilets': 2, 'audit_ll': (-27.9882058, 153.4300756), 'audit_pt_y1684': (0.51310, 0.19338), 'said_m': 11.8},
 'WC13': {'outline_of': 'WC13', 'toilets': 3, 'audit_paper_pt': (1629.283, 404.068), 'said_m': 2.0},
 'WC69': {'outline_of': 'WC69', 'toilets': 9, 'audit_paper_pt': (142.57, 1146.139), 'said_m': 2.3}}

W, H, PW, PH = 2600, 1837, 2384.0, 1684.0
Z = W / PW
N = 2 ** 18 * 512
INSET = GEO['inset']['sheet_region_pts']
def in_inset(x, y): return INSET[0] <= x <= INSET[2] and INSET[1] <= y <= INSET[3]
def to17(x, y): return (x + 25.50, y + 0.12)   # main plan only (asserted below)
def ll_of(x, y):
    assert not in_inset(x, y), 'a held pin in the inset'
    x17, y17 = to17(x, y); T = GEO['main']['sheet_to_z18px']
    px = T[0][0] * x17 + T[0][1] * y17 + T[0][2]; py = T[1][0] * x17 + T[1][1] * y17 + T[1][2]
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / N)))), px / N * 360 - 180
def frac_of(x, y):
    x17, y17 = to17(x, y); return (x17 / PW, y17 * Z / H)
def hav(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))
def bearing(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    y = math.sin(lo2 - lo1) * math.cos(la2); x = math.cos(la1) * math.sin(la2) - math.sin(la1) * math.cos(la2) * math.cos(lo2 - lo1)
    d = (math.degrees(math.atan2(y, x)) + 360) % 360
    return d, ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][int((d + 22.5) // 45) % 8]
def m_per_pt(x, y):
    a = ll_of(x, y); return (hav(a, ll_of(x + 10, y)) / 10 + hav(a, ll_of(x, y + 10)) / 10) / 2
def poly_area_centroid(P):
    A = cx = cy = 0.0
    for i in range(len(P)):
        x0, y0 = P[i]; x1, y1 = P[(i + 1) % len(P)]; c = x0 * y1 - x1 * y0
        A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    A /= 2
    if abs(A) < 1e-9: return 0.0, (0.0, 0.0)
    return abs(A), (cx / (6 * A), cy / (6 * A))
def order(P):
    mx = sum(p[0] for p in P) / len(P); my = sum(p[1] for p in P) / len(P)
    return sorted(P, key=lambda p: math.atan2(p[1] - my, p[0] - mx))

doc = fitz.open(PDF); pg = doc[0]
assert len(doc) == 1 and round(pg.rect.width) == 2384 and round(pg.rect.height) == 1684
WORDS = pg.get_text('words')
page = open(PAGE, encoding='utf-8').read(); PAGE_SHA = hashlib.sha256(page.encode('utf-8')).hexdigest()
m = re.search(r'const MASTER_LOC = ', page); ML, _ = json.JSONDecoder().raw_decode(page[m.end():])

# every closed shape on the sheet, once (derive917.py's scan)
SHAPES = []
for idx, d in enumerate(pg.get_drawings()):
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
        elif d.get('closePath'): P = starts + [end]
        else: continue
    else:
        continue
    r = d['rect']
    if r.width > 12 or r.height > 12 or (r.width < 0.3 and r.height < 0.3): continue
    A, c = poly_area_centroid(P)
    if A <= 0.05: continue
    SHAPES.append({'i': idx, 'P': [(round(x, 3), round(y, 3)) for x, y in P], 'A': A, 'c': c})
def sides_m(P):
    k = m_per_pt(*P[0])
    s = sorted(math.hypot(P[i][0] - P[(i + 1) % 4][0], P[i][1] - P[(i + 1) % 4][1]) * k for i in range(4))
    return (s[0] + s[1]) / 2, (s[2] + s[3]) / 2
def kind_of(P):
    if len(P) != 4 or in_inset(*P[0]): return None
    a, b = sides_m(P)
    if 1.0 <= a <= 1.9 and 1.0 <= b <= 1.9: return 'toilet'
    if 1.9 < a <= 3.0 and 1.9 < b <= 3.2: return 'accessible'
    if 2.4 <= a <= 3.6 and 5.0 <= b <= 7.0: return 'block'
    if 0.4 <= a <= 0.9 and 2.0 <= b <= 2.8: return 'pee'
    return None
UNITS = [dict(s, kind=kind_of(s['P'])) for s in SHAPES]
UNITS = [u for u in UNITS if u['kind']]
def match(Pc):
    best = None; cxm = sum(p[0] for p in Pc) / len(Pc); cym = sum(p[1] for p in Pc) / len(Pc)
    for u in UNITS:
        if abs(u['c'][0] - cxm) > 3 or abs(u['c'][1] - cym) > 3: continue
        dmax = max(min(math.hypot(p[0] - q[0], p[1] - q[1]) for q in u['P']) for p in Pc)
        if best is None or dmax < best[0]: best = (dmax, u)
    return best
def touch(P, Q, tol=0.35): return any(min(math.hypot(a[0] - b[0], a[1] - b[1]) for b in Q) < tol for a in P)
same = lambda u, v: max(min(math.hypot(p[0] - q[0], p[1] - q[1]) for q in v['P']) for p in u['P']) <= 0.05
def centre(us):
    At = sum(u['A'] for u in us); return (sum(u['A'] * u['c'][0] for u in us) / At, sum(u['A'] * u['c'][1] for u in us) / At)

rows, fails = {}, []
for ref, ask in ASK.items():
    cur = ML[ref]
    found = []
    for c in GEOM['refs'][ask['outline_of']]['unit']['components']:
        mt = match([tuple(p) for p in c['polygon_pt']])
        if not mt or mt[0] > 0.3: fails.append(f'{ref}: claimed outline not found in the PDF (best {mt and round(mt[0], 3)} pt)'); continue
        found.append(mt[1])
    ids = {u['i'] for u in found}
    if len(ids) != len(found): fails.append(ref + ': two claimed outlines are the same PDF shape')
    kinds = {}
    for u in found: kinds[u['kind']] = kinds.get(u['kind'], 0) + 1
    if kinds != {'toilet': ask['toilets']}: fails.append(f'{ref}: shapes found {kinds}, the master draws {ask["toilets"]} toilets there')
    # same-kind shapes touching the group, transitively (a group cannot be cut short); a second paint of one outline is the same toilet
    grp = list(found); extra = []; cand = [u for u in UNITS if u['kind'] == 'toilet' and u['i'] not in ids]; changed = True
    while changed:
        changed = False
        for u in list(cand):
            if any(touch(u['P'], v['P']) for v in grp): grp.append(u); extra.append(u); cand.remove(u); changed = True
    dupes = [u for u in extra if any(same(u, v) for v in found)]; extra = [u for u in extra if u not in dupes]
    if extra: fails.append(f'{ref}: {len(extra)} more toilet(s) touch the group on the PDF')
    cx, cy = centre(found)
    ll = ll_of(cx, cy); fr = frac_of(cx, cy); k = m_per_pt(cx, cy)
    # what is written: the derived point (ll 7 decimals, pt 5 decimals in the page frame)
    lst_ll = (round(ll[0], 7), round(ll[1], 7)); lst_pt = (round(fr[0], 5), round(fr[1], 5))
    # against the audit
    if 'audit_paper_pt' in ask:
        apx, apy = ask['audit_paper_pt']
    else:
        apx, apy = ask['audit_pt_y1684'][0] * PW - 25.50, ask['audit_pt_y1684'][1] * PH - 0.12
    a_ll = ask.get('audit_ll') or ll_of(apx, apy)
    d_pt = math.hypot(cx - apx, cy - apy); d_ll = hav(ll, a_ll)
    ok = d_pt <= 0.3 and d_ll <= 0.2
    if not ok: fails.append(f'{ref}: the PDF derivation is {d_ll:.3f} m / {d_pt:.3f} pt from the audit point - refused')
    l_m = hav(ll, lst_ll); l_pt = math.hypot((fr[0] - lst_pt[0]) * PW, (fr[1] - lst_pt[1]) * H / Z)
    moved = hav(cur['ll'], lst_ll); b, word = bearing(cur['ll'], lst_ll)
    if abs(moved - ask['said_m']) > 0.15: fails.append(f'{ref}: moves {moved:.2f} m, the audit says about {ask["said_m"]} m')
    tags = [((w[0] + w[2]) / 2, (w[1] + w[3]) / 2) for w in WORDS if w[4].strip().upper() == ref]
    tag = min(tags, key=lambda t: math.hypot(t[0] - cx, t[1] - cy)) if tags else None
    row = {'kind': 'toilet', 'unit_kinds': kinds, 'n_parts': len(found), 'drawings': sorted(ids), 'outline_of_audit_row': ask['outline_of'],
           'paper_pt': [round(cx, 3), round(cy, 3)], 'inset': False, 'derived_ll': [round(ll[0], 7), round(ll[1], 7)], 'derived_pt': [round(fr[0], 5), round(fr[1], 5)],
           'listed_ll': list(lst_ll), 'listed_pt': list(lst_pt), 'listed_vs_derived_m': round(l_m, 3), 'listed_vs_derived_pt': round(l_pt, 3),
           'within_tolerance': ok and l_m <= 0.2 and l_pt <= 0.3,
           'audit_paper_pt': [round(apx, 3), round(apy, 3)], 'audit_ll': [round(a_ll[0], 7), round(a_ll[1], 7)], 'derived_vs_audit_pt': round(d_pt, 3), 'derived_vs_audit_m': round(d_ll, 3),
           'page_now_ll': cur['ll'], 'page_now_pt': cur['pt'], 'page_now_how': cur.get('how'), 'page_now_img': cur.get('img'),
           'moves_m': round(moved, 2), 'moves_dir': word, 'moves_bearing': round(b), 'audit_moves_m': ask['said_m'], 'm_per_pt': round(k, 4),
           'touching_extra': len(extra), 'drawn_twice': len(dupes),
           'tag_to_unit_m': None if tag is None else round(math.hypot(tag[0] - cx, tag[1] - cy) * k, 1)}
    if ref == 'WC13':   # the two pairs inside the drawn row of 3, and how far each pair's middle is from the row's middle
        srt = sorted(found, key=lambda u: (u['c'][1], u['c'][0]))
        row['pairs_middle_to_row_middle_m'] = [round(math.hypot(centre(p)[0] - cx, centre(p)[1] - cy) * k, 2) for p in (srt[:2], srt[1:])]
    if ref == 'WC69':   # the 3 more toilets in a column on the fence (12 = 9 + 3), measured on the ground, not on the paper
        # the sheet is not drawn north-up (up the page is east), so a direction is read off the GPS points, never the paper
        near = [u for u in UNITS if u['kind'] == 'toilet' and u['i'] not in ids and math.hypot(u['c'][0] - cx, u['c'][1] - cy) * k <= 10]
        groups = []
        for u in near:   # touching groups among them
            g = [x for x in groups if any(touch(u['P'], v['P']) for v in x)]
            merged = [u] + [v for x in g for v in x]; groups = [x for x in groups if x not in g] + [merged]
        three = [x for x in groups if len(x) == 3]
        if len(three) != 1: fails.append(f'WC69: expected one column of 3 touching toilets within 10 m of the row, found groups of {sorted(len(x) for x in groups)}')
        else:
            col = three[0]; fx, fy = centre(col); fll = ll_of(fx, fy); fb, fw = bearing(lst_ll, fll)
            ends = sorted(found, key=lambda u: min(hav(ll_of(*u['c']), ll_of(*v['c'])) for v in col))[0]
            reft = [(w[4], (w[0] + w[2]) / 2, (w[1] + w[3]) / 2) for w in WORDS if re.fullmatch(r'WC[-\w]*', w[4].strip())]
            nt = sorted(((t[0], round(math.hypot(t[1] - fx, t[2] - fy) * k, 1)) for t in reft), key=lambda x: x[1])[:2]
            row['fence_three'] = {'n': 3, 'drawings': sorted(u['i'] for u in col), 'paper_pt': [round(fx, 3), round(fy, 3)], 'll': [round(fll[0], 7), round(fll[1], 7)],
                                  'middle_to_row_middle_m': round(hav(lst_ll, fll), 2), 'direction_from_row_middle': fw, 'bearing': round(fb),
                                  'nearest_to_row_end_toilet_m': round(min(hav(ll_of(*ends['c']), ll_of(*v['c'])) for v in col), 2),
                                  'edge_gap_to_row_m': round(min(math.hypot(p[0] - q[0], p[1] - q[1]) for u in found for v in col for p in u['P'] for q in v['P']) * k, 2),
                                  'nearest_wc_labels': nt, 'other_lone_toilets_within_10m': [{'drawing': u['i'], 'm': round(math.hypot(u['c'][0] - cx, u['c'][1] - cy) * k, 1)} for x in groups if len(x) != 3 for u in x],
                                  'question_said': 'about 6.5 m north-west (written off the paper; the paper is not north-up)'}
    rows[ref] = row
json.dump({'author': 'Andrew Fisher', 'what': 'v9.17 third round - WC59, WC57, WC13 and WC69 (the project manager, 8 Oct about 23:20) re-derived from the 2 Oct master PDF',
           'pdf_sha256': PDF_SHA, 'page_sha256': PAGE_SHA, 'georeferencing': {'main_rms_m': GEO['main']['check']['rms_m']},
           'frame': '2 Oct paper -> 17 Sep frame (main +25.50/+0.12 pt) -> main sheet_to_z18px; pt = x17/2384, y17*(2600/2384)/1837',
           'rule': 'area centre of the toilets drawn; checked against the audit point: 0.3 pt and 0.2 m',
           'shapes_scanned': len(SHAPES), 'unit_shapes': len(UNITS), 'rows': rows, 'fails': fails}, open(OUT, 'w'), indent=1)
for ref, r in rows.items():
    print(f"{ref:5s} {str(r['unit_kinds']):14s} derived {r['listed_ll']} pt {r['listed_pt']} | vs audit {r['derived_vs_audit_m']:.3f} m / {r['derived_vs_audit_pt']:.3f} pt"
          f" | moves {r['moves_m']:5.2f} m {r['moves_dir']} (audit ~{r['audit_moves_m']}) | tag {r['tag_to_unit_m']} m"
          + (f" | pairs {r['pairs_middle_to_row_middle_m']} m" if 'pairs_middle_to_row_middle_m' in r else '')
          + (f" | fence 3: middle {r['fence_three']['middle_to_row_middle_m']} m {r['fence_three']['direction_from_row_middle']} of the row's middle,"
             f" {r['fence_three']['nearest_to_row_end_toilet_m']} m from its end toilet, labels {r['fence_three']['nearest_wc_labels']}" if 'fence_three' in r else ''))
print('FAILS' if fails else 'PASS', len(fails), fails[:12])
