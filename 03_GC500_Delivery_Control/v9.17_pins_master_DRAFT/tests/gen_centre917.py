# Author: Andrew Fisher. v9.17 r4 - GN18 / GN13: the generator symbol's centre three ways (area centre, vertex mean, bbox middle).
#   python3 -I tests/gen_centre917.py <D001-26003-03-MASTER.pdf> <georeferencing.json>
# independent: the orange generator symbols nearest GN18 / GN13's old pins, centre three ways, through the main transform
import json, math, sys
import pymupdf as fitz
PDF, GEOP = sys.argv[1:3]
GEO = json.load(open(GEOP)); N = 2 ** 18 * 512; PW, H, Z = 2384.0, 1837, 2600 / 2384.0
INSET = GEO['inset']['sheet_region_pts']
def in_inset(x, y): return INSET[0] <= x <= INSET[2] and INSET[1] <= y <= INSET[3]
def to17(x, y): return (x, y + 0.06) if in_inset(x, y) else (x + 25.50, y + 0.12)
def ll_of(x, y):
    i = in_inset(x, y); x17, y17 = to17(x, y); T = GEO['inset' if i else 'main']['sheet_to_z18px']
    px = T[0][0] * x17 + T[0][1] * y17 + T[0][2]; py = T[1][0] * x17 + T[1][1] * y17 + T[1][2]
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / N)))), px / N * 360 - 180
def frac(x, y): x17, y17 = to17(x, y); return x17 / PW, y17 * Z / H
def hav(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b)); h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))
pg = fitz.open(PDF)[0]
syms = []
for i, d in enumerate(pg.get_drawings()):
    c = d.get('color'); w = d.get('width')
    if not c or tuple(round(v, 2) for v in c) != (1.0, 0.5, 0.0) or not w or abs(w - 0.72) > 0.05: continue
    it = d['items']; r = d['rect']
    if r.width > 12 or r.height > 12: continue
    if it[0][0] == 'qu' and len(it) == 2: q = it[0][1]; P = [(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.lr.x, q.lr.y), (q.ll.x, q.ll.y)]
    elif len(it) == 5 and all(x[0] == 'l' for x in it): P = [(x[1].x, x[1].y) for x in it[1:]]
    else: continue
    # area centroid (shoelace), vertex mean, bbox middle
    A = cx = cy = 0.0
    for k in range(4):
        x0, y0 = P[k]; x1, y1 = P[(k + 1) % 4]; cr = x0 * y1 - x1 * y0; A += cr; cx += (x0 + x1) * cr; cy += (y0 + y1) * cr
    A /= 2; ac = (cx / (6 * A), cy / (6 * A)); vm = (sum(p[0] for p in P) / 4, sum(p[1] for p in P) / 4)
    syms.append(dict(i=i, ac=ac, vm=vm, bb=((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2), ops=''.join(x[0][0] for x in it)))
print('orange 0.72 pt symbols (2- or 5-item):', len(syms))
OLD = {'GN18': (-27.983493, 153.424075), 'GN13': (-27.988495, 153.430095)}
CHK = {'GN18': (-27.9836216, 153.4241707), 'GN13': (-27.9883916, 153.4300855)}
for ref, old in OLD.items():
    s = min(syms, key=lambda s: hav(ll_of(*s['ac']), old))
    ll = ll_of(*s['ac']); fr = frac(*s['ac'])
    print(ref, 'drawing', s['i'], s['ops'], 'area centre pt %.3f,%.3f' % s['ac'], 'vertex mean %.3f,%.3f' % s['vm'], 'bbox middle %.3f,%.3f' % s['bb'])
    print('   ll %.7f, %.7f  pt %.5f, %.5f  from old %.2f m  vs checker %.3f m' % (*ll, *fr, hav(old, ll), hav(ll, CHK[ref])))
