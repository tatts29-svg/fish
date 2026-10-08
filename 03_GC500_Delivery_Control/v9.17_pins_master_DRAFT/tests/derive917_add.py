# Author: Andrew Fisher. v9.17 (second round) - re-derive the 30 added pins from the 2 Oct master itself, before any is
# written: GN18 and GN13 (the project manager, 8 Oct about 18:05: "follow the master") and the 28 near moves toward 10/10.
#
#   python3 -I tests/derive917_add.py <D001-26003-03-MASTER.pdf> <georeferencing.json> <live page html> \
#        <near37.json (the verified list)> <rows.json (the audit's outlines, read only)> <out json>
#
# Reads the PDF with pymupdf, not the list's numbers:
#   toilets (28): the reference's tag on the text layer; every closed unit-sized shape on the sheet (as derive917.py);
#     each outline the audit names must be a shape in the PDF (<= 0.3 pt, vertex for vertex), all toilets, and as many
#     as the list says; the same-size shapes touching the group are counted too (a group cannot be cut short silently);
#     centre = the area centre of the group (one toilet = its centre).
#   generators (2): every orange generator symbol on the sheet (a closed rectangle with its diagonal, colour 1/0.5/0,
#     0.72 pt line); the one the list names is the symbol nearest the listed point; centre = the centre of its outline.
#     The master carries no generator tags: which symbol is GN18 / GN13 is the project manager's "follow the master".
#     Also listed: what is drawn at the old spot, and the nearest other generator pins to each symbol near the old pin.
# Then: 2 Oct paper -> 17 Sep frame -> GPS (main or inset transform), the page's pt frame (x17/2384, y17*(2600/2384)/1837),
# and the listed point checked against it: ll within 0.2 m, pt within 0.3 pt. Any that disagree are refused (listed in
# "fails"); the patch will not run while there is one.
import hashlib, json, math, re, sys
import pymupdf as fitz

PDF, GEOP, PAGE, NEAR, ROWS, OUT = sys.argv[1:7]
PDF_SHA = hashlib.sha256(open(PDF, 'rb').read()).hexdigest()
assert PDF_SHA.startswith('8753d875'), 'not the 2 Oct master: ' + PDF_SHA
GEO = json.load(open(GEOP)); assert GEO['pdf_sha256'].startswith('8753d875')

# THE ASK (the project manager, 8 Oct 2026): ll as the list gives it; pt in the page's MASTER_LOC frame
LISTED = {
 'GN18': ((-27.9836216, 153.4241707), (0.21044, 0.68025)), 'GN13': ((-27.9883915, 153.4300855), (0.52533, 0.19256)),
 'WC06': ((-27.9846989, 153.4265318), (0.28171, 0.48539)), 'WC10': ((-27.9844829, 153.4277142), (0.26767, 0.38765)),
 'WC11': ((-27.9848882, 153.4265754), (0.29418, 0.48183)), 'WC12': ((-27.9854611, 153.4273218), (0.33201, 0.42028)),
 'WC21': ((-27.9891589, 153.4286192), (0.57564, 0.31388)), 'WC23': ((-27.9895044, 153.4291988), (0.59847, 0.26607)),
 'WC29': ((-27.9835607, 153.4285729), (0.20708, 0.31650)), 'WC30': ((-27.9823908, 153.4278300), (0.12995, 0.37763)),
 'WC33': ((-27.9861074, 153.4295240), (0.37488, 0.23846)), 'WC38': ((-27.9835934, 153.4241296), (0.20859, 0.68364)),
 'WC40': ((-27.9836590, 153.4244496), (0.21295, 0.65721)), 'WC41': ((-27.9848352, 153.4260544), (0.29062, 0.52486)),
 'WC42': ((-27.9832804, 153.4248399), (0.18808, 0.62489)), 'WC43': ((-27.9863713, 153.4272242), (0.39192, 0.42854)),
 'WC45': ((-27.9907105, 153.4283913), (0.67776, 0.33305)), 'WC46': ((-27.9922233, 153.4293799), (0.77751, 0.25169)),
 'WC47': ((-27.9901828, 153.4283807), (0.64302, 0.33381)), 'WC48': ((-27.9937499, 153.4304576), (0.87818, 0.16297)),
 'WC49': ((-27.9939764, 153.4306756), (0.89312, 0.14501)), 'WC53': ((-27.9926637, 153.4302899), (0.80664, 0.17659)),
 'WC54': ((-27.9915876, 153.4304584), (0.73581, 0.16244)), 'WC55': ((-27.9912419, 153.4298320), (0.71296, 0.21412)),
 'WC56': ((-27.9898200, 153.4300769), (0.61938, 0.19358)), 'WC61': ((-27.9841222, 153.4298238), (0.24422, 0.21326)),
 'WC67': ((-27.9813908, 153.4241664), (0.06359, 0.68013)), 'WC71': ((-27.9812828, 153.4234837), (0.05638, 0.73651)),
 'WC72': ((-27.9821291, 153.4240067), (0.11217, 0.69347)), 'WC73': ((-27.9869615, 153.4281016), (0.43090, 0.35617))}
GENS = ('GN18', 'GN13')
# the project manager's figures for the two generators (8 Oct, STATUS.md): move and direction
GEN_SAID = {'GN18': (17.1, 'south-east'), 'GN13': (11.6, 'north')}
NOT_MOVED = {'WC57', 'WC59', 'WC13', 'WC69', 'P08', 'P44', 'P51', 'WC20', 'P27', 'P29', 'P34', 'WC51', 'WC01', 'P26', 'P28', 'T0022', 'T0023', 'P47', 'WC32'}
assert not NOT_MOVED & set(LISTED)

W, H, PW, PH = 2600, 1837, 2384.0, 1684.0
Z = W / PW
N = 2 ** 18 * 512
INSET = GEO['inset']['sheet_region_pts']
def in_inset(x, y): return INSET[0] <= x <= INSET[2] and INSET[1] <= y <= INSET[3]
def to17(x, y): return (x, y + 0.06) if in_inset(x, y) else (x + 25.50, y + 0.12)
def reg_ll(x17, y17, inset):
    T = GEO['inset' if inset else 'main']['sheet_to_z18px']
    px = T[0][0] * x17 + T[0][1] * y17 + T[0][2]; py = T[1][0] * x17 + T[1][1] * y17 + T[1][2]
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / N)))), px / N * 360 - 180
def ll_of(x, y):
    i = in_inset(x, y); x17, y17 = to17(x, y); return reg_ll(x17, y17, i)
def frac_of(x, y):
    x17, y17 = to17(x, y); return (x17 / PW, y17 * Z / H)
def page_pt_to_paper(f):
    x17, y17 = f[0] * PW, f[1] * H / Z
    return (x17, y17 - 0.06) if in_inset(x17, y17 - 0.06) else (x17 - 25.50, y17 - 0.12)
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
def inside(p, P):
    c = False; x, y = p
    for i in range(len(P)):
        x0, y0 = P[i]; x1, y1 = P[i - 1]
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c

doc = fitz.open(PDF); pg = doc[0]
assert len(doc) == 1 and round(pg.rect.width) == 2384 and round(pg.rect.height) == 1684
WORDS = pg.get_text('words')
page = open(PAGE, encoding='utf-8').read(); PAGE_SHA = hashlib.sha256(page.encode('utf-8')).hexdigest()
m = re.search(r'const MASTER_LOC = ', page); ML, _ = json.JSONDecoder().raw_decode(page[m.end():])
NL = {x['ref']: x for x in json.load(open(NEAR))}
AUD = {r['ref']: r for r in json.load(open(ROWS))}

DR = pg.get_drawings()
SHAPES, GEN = [], []
for idx, d in enumerate(DR):
    items = d['items']; P = None
    if items and items[0][0] == 'qu' and all(it[0] == 'l' for it in items[1:]) and len(items) <= 2:
        q = items[0][1]; P = order([(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.ll.x, q.ll.y), (q.lr.x, q.lr.y)])
    elif len(items) == 1 and items[0][0] == 're':
        r = items[0][1]; P = [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
    elif all(it[0] == 'l' for it in items) and 3 <= len(items) <= 5:
        starts = [(it[1].x, it[1].y) for it in items]; end = (items[-1][2].x, items[-1][2].y)
        if len(items) == 4 and math.hypot(starts[0][0] - end[0], starts[0][1] - end[1]) <= 0.05: P = starts
        elif len(items) == 3 and d.get('closePath'): P = starts + [end]
        elif len(items) == 5:   # a rectangle drawn as its diagonal, then round its four sides (the generator symbol)
            pts = starts[1:]
            if math.hypot(pts[0][0] - end[0], pts[0][1] - end[1]) <= 0.05: P = order(pts); P_diag = True
    if P is None: continue
    r = d['rect']
    if r.width > 12 or r.height > 12 or (r.width < 0.3 and r.height < 0.3): continue
    A, c = poly_area_centroid(P)
    if A <= 0.05: continue
    col = tuple(round(v, 2) for v in d['color']) if d.get('color') else None
    rec = {'i': idx, 'P': [(round(x, 3), round(y, 3)) for x, y in P], 'A': A, 'c': c, 'color': col, 'w': d.get('width'), 'n_items': len(items), 'ops': ''.join(it[0][0] for it in items)}
    if len(items) <= 4 and items[0][0] != 'qu' or items[0][0] == 'qu' and len(items) == 1: SHAPES.append(rec)
    if col == (1.0, 0.5, 0.0) and d.get('width') and abs(d['width'] - 0.72) < 0.05 and len(items) in (2, 5): GEN.append(rec)

def sides_m(P):
    k = m_per_pt(*P[0])
    s = sorted(math.hypot(P[i][0] - P[(i + 1) % 4][0], P[i][1] - P[(i + 1) % 4][1]) * k for i in range(4))
    return (s[0] + s[1]) / 2, (s[2] + s[3]) / 2
def kind_of(P):
    if len(P) != 4: return None
    a, b = sides_m(P)
    if 1.0 <= a <= 1.9 and 1.0 <= b <= 1.9: return 'toilet'
    if 1.9 < a <= 3.0 and 1.9 < b <= 3.2: return 'accessible'
    if 2.4 <= a <= 3.6 and 5.0 <= b <= 7.0: return 'block'
    if 0.4 <= a <= 0.9 and 2.0 <= b <= 2.8: return 'pee'
    return None
UNITS = [dict(s, kind=kind_of(s['P'])) for s in SHAPES]
UNITS = [u for u in UNITS if u['kind']]
GEN = [dict(g, sides_m=[round(v, 2) for v in sides_m(g['P'])]) for g in GEN]
GEN = [g for g in GEN if 1.0 <= g['sides_m'][0] <= 1.8 and 2.2 <= g['sides_m'][1] <= 3.5]   # generator-sized: about 2.9 x 1.2 m

def match(Pc):
    best = None
    cxm = sum(p[0] for p in Pc) / len(Pc); cym = sum(p[1] for p in Pc) / len(Pc)
    for u in UNITS:
        if abs(u['c'][0] - cxm) > 3 or abs(u['c'][1] - cym) > 3: continue
        dmax = max(min(math.hypot(p[0] - q[0], p[1] - q[1]) for q in u['P']) for p in Pc)
        if best is None or dmax < best[0]: best = (dmax, u)
    return best
def touch(P, Q, tol=0.35): return any(min(math.hypot(a[0] - b[0], a[1] - b[1]) for b in Q) < tol for a in P)
GNPINS = {k: v for k, v in ML.items() if re.fullmatch(r'GN\d+', k)}

rows, fails, notes = {}, [], []
for ref, (lst_ll, lst_pt) in LISTED.items():
    cur = ML[ref]
    if ref in GENS:
        tx, ty = page_pt_to_paper(lst_pt)
        g = min(GEN, key=lambda g: math.hypot(g['c'][0] - tx, g['c'][1] - ty))
        found = [g]; kinds = {'generator': 1}
        cx, cy = g['c']
    else:
        nl = NL[ref]
        if nl['verdict'] != 'MOVE': fails.append(ref + ': the list does not say MOVE'); continue
        if [round(v, 7) for v in nl['to_ll']] != [round(v, 7) for v in lst_ll] or [round(v, 5) for v in nl['to_pt_page_convention']] != [round(v, 5) for v in lst_pt]:
            fails.append(ref + ': the point written here is not the list\'s to_ll / to_pt (page frame)')
        found = []
        for c in AUD[ref]['unit']['components']:
            mt = match([tuple(p) for p in c['polygon_pt']])
            if not mt or mt[0] > 0.3: fails.append(f'{ref}: claimed outline not found in the PDF (best {mt and round(mt[0], 3)} pt)'); continue
            found.append(mt[1])
        ids = {u['i'] for u in found}
        if len(ids) != len(found): fails.append(ref + ': two claimed outlines are the same PDF shape')
        kinds = {}
        for u in found: kinds[u['kind']] = kinds.get(u['kind'], 0) + 1
        if kinds != {'toilet': nl['parts']}: fails.append(f'{ref}: shapes found {kinds}, the list says {nl["parts"]} toilets')
        # second method: same-kind shapes touching the group (an edge shared within 0.35 pt), transitively
        grp = list(found); extra = []
        cand = [u for u in UNITS if u['kind'] == 'toilet' and u['i'] not in ids]
        changed = True
        while changed:
            changed = False
            for u in list(cand):
                if any(touch(u['P'], v['P']) for v in grp): grp.append(u); extra.append(u); cand.remove(u); changed = True
        # a shape drawn twice (same outline, a second paint of it) is the same toilet, not another one
        same = lambda u, v: max(min(math.hypot(p[0] - q[0], p[1] - q[1]) for q in v['P']) for p in u['P']) <= 0.05
        dupes = [u for u in extra if any(same(u, v) for v in found)]
        extra = [u for u in extra if u not in dupes]
        if extra: fails.append(f'{ref}: {len(extra)} more toilet(s) touch the group on the PDF')
        At = sum(u['A'] for u in found)
        cx = sum(u['A'] * u['c'][0] for u in found) / At; cy = sum(u['A'] * u['c'][1] for u in found) / At
        if math.hypot(cx - nl['unit_centre_pt_2oct'][0], cy - nl['unit_centre_pt_2oct'][1]) > 0.3:
            fails.append(f'{ref}: the PDF centre is {math.hypot(cx - nl["unit_centre_pt_2oct"][0], cy - nl["unit_centre_pt_2oct"][1]):.2f} pt from the list\'s unit centre')
    ll = ll_of(cx, cy); fr = frac_of(cx, cy); inset = in_inset(cx, cy); k = m_per_pt(cx, cy)
    d_ll = hav(ll, lst_ll); d_pt = math.hypot((fr[0] - lst_pt[0]) * PW, (fr[1] - lst_pt[1]) * H / Z)
    ok = d_ll <= 0.2 and d_pt <= 0.3
    if not ok: fails.append(f'{ref}: listed point is {d_ll:.3f} m / {d_pt:.3f} pt from the PDF derivation - refused')
    if cur['ll'] != (NL[ref]['from_ll'] if ref in NL else cur['ll']): fails.append(ref + ': the page pin is not where the list found it')
    moved = hav(cur['ll'], lst_ll); b, word = bearing(cur['ll'], lst_ll)
    row = {'kind': 'generator' if ref in GENS else 'toilet', 'unit_kinds': kinds, 'n_parts': len(found), 'drawings': sorted(u['i'] for u in found),
           'paper_pt': [round(cx, 3), round(cy, 3)], 'inset': inset, 'derived_ll': [round(ll[0], 7), round(ll[1], 7)], 'derived_pt': [round(fr[0], 5), round(fr[1], 5)],
           'listed_ll': list(lst_ll), 'listed_pt': list(lst_pt), 'listed_vs_derived_m': round(d_ll, 3), 'listed_vs_derived_pt': round(d_pt, 3), 'within_tolerance': ok,
           'page_now_ll': cur['ll'], 'page_now_pt': cur['pt'], 'page_now_how': cur.get('how'), 'page_now_img': cur.get('img'),
           'moves_m': round(moved, 2), 'moves_dir': word, 'moves_bearing': round(b), 'm_per_pt': round(k, 4)}
    if ref not in GENS: row.update(touching_extra=len(extra), drawn_twice=len(dupes))
    if ref in GENS:
        g = found[0]
        old = page_pt_to_paper(cur['pt'])
        row.update(symbol_sides_m=g['sides_m'], symbol_ops=g['ops'], symbol_vs_listed_pt=round(math.hypot(g['c'][0] - tx, g['c'][1] - ty), 3),
                   said=GEN_SAID[ref], said_ok=abs(moved - GEN_SAID[ref][0]) <= 0.1 and word == GEN_SAID[ref][1])
        if not row['said_ok']: fails.append(f'{ref}: moves {moved:.2f} m {word}, the project manager was told {GEN_SAID[ref]}')
        # the generator symbols within 25 m of the old pin, each with the generator pin nearest it (none may be another's)
        near = []
        for s in GEN:
            dm = math.hypot(s['c'][0] - old[0], s['c'][1] - old[1]) * k
            if dm > 25: continue
            sll = ll_of(*s['c']); pins = sorted(((hav(sll, v['ll']), kk) for kk, v in GNPINS.items()), key=lambda x: x[0])[:2]
            near.append({'paper_pt': [round(s['c'][0], 2), round(s['c'][1], 2)], 'm_from_old_pin': round(dm, 1), 'is_this': s['i'] == g['i'], 'nearest_gn_pins': [[kk, round(m_, 1)] for m_, kk in pins]})
        row['generator_symbols_within_25m_of_old_pin'] = sorted(near, key=lambda x: x['m_from_old_pin'])
        oth = [x for x in near if not x['is_this'] and x['nearest_gn_pins'][0][0] == ref]
        sym_ll = ll_of(*g['c'])
        claimed = [(kk, round(hav(sym_ll, v['ll']), 1)) for kk, v in GNPINS.items() if kk != ref and hav(sym_ll, v['ll']) < 5]
        if claimed: fails.append(f'{ref}: another generator pin sits on this symbol: {claimed}')
        row['old_pin_to_nearest_generator_symbol_m'] = round(min(math.hypot(s['c'][0] - old[0], s['c'][1] - old[1]) for s in GEN) * k, 1)
        # what the master draws at the old spot (closed shapes around the old pin, with their size in metres)
        at_old = []
        for d in SHAPES:
            if len(d['P']) == 4 and inside(old, d['P']):
                s_ = sides_m(d['P']); at_old.append({'sides_m': [round(s_[0], 1), round(s_[1], 1)], 'color': d['color'], 'drawing': d['i']})
        row['drawn_at_old_pin'] = at_old
    else:
        tags = [((w[0] + w[2]) / 2, (w[1] + w[3]) / 2) for w in WORDS if w[4].strip().upper() == ref]
        tag = min(tags, key=lambda t: math.hypot(t[0] - cx, t[1] - cy)) if tags else None
        row['tag_to_unit_m'] = None if tag is None else round(math.hypot(tag[0] - cx, tag[1] - cy) * k, 1)
        row['list_metres'] = NL[ref]['metres']; row['list_to_pt_other_frame'] = NL[ref]['to_pt']
        row['list_to_pt_other_frame_vs_derived_pt'] = round(math.hypot((fr[0] - NL[ref]['to_pt'][0]) * PW, (fr[1] - NL[ref]['to_pt'][1]) * PH), 3)
        if abs(round(moved, 1) - NL[ref]['metres']) > 0.1: fails.append(f'{ref}: moves {moved:.2f} m, the list says {NL[ref]["metres"]} m')
        if tag is None: fails.append(ref + ': no tag on the master')
    rows[ref] = row
json.dump({'author': 'Andrew Fisher', 'what': 'v9.17 second round - the 30 added pins re-derived from the 2 Oct master PDF',
           'pdf_sha256': PDF_SHA, 'page_sha256': PAGE_SHA, 'georeferencing': {'main_rms_m': GEO['main']['check']['rms_m'], 'inset_rms_m': GEO['inset']['check']['rms_m']},
           'frame': '2 Oct paper -> 17 Sep frame (main +25.50/+0.12 pt, inset +0/+0.06 pt) -> main or inset sheet_to_z18px; pt = x17/2384, y17*(2600/2384)/1837',
           'rule': 'toilets: area centre of the drawn group (one toilet = its centre); generator: centre of the symbol outline; tolerance ll 0.2 m, pt 0.3 pt',
           'shapes_scanned': len(SHAPES), 'unit_shapes': len(UNITS), 'generator_symbols': len(GEN), 'rows': rows, 'fails': fails}, open(OUT, 'w'), indent=1)
for ref, r in rows.items():
    print(f"{ref:5s} {str(r['unit_kinds']):18s} {r['listed_vs_derived_m']:6.3f} m {r['listed_vs_derived_pt']:6.3f} pt  moves {r['moves_m']:5.2f} m {r['moves_dir']:10s} "
          + (f"tag {r.get('tag_to_unit_m')} m  (list's to_pt in its own y-frame: {r['list_to_pt_other_frame_vs_derived_pt']} pt)" if r['kind'] == 'toilet' else f"symbol {r['symbol_sides_m']} m  old pin->nearest symbol {r['old_pin_to_nearest_generator_symbol_m']} m  at old pin {r['drawn_at_old_pin']}"))
print('generator symbols on the sheet:', len(GEN))
print('FAILS' if fails else 'PASS', len(fails), fails[:12])
