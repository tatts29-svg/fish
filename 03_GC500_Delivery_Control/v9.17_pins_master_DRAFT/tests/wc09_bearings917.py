# Author: Andrew Fisher. v9.17 r4 - WC09 on-site check: ground bearing and distance from the pin to its toilets and pee panels.
#   python3 -I tests/wc09_bearings917.py <D001-26003-03-MASTER.pdf> <georeferencing.json> <evidence/derive917.json>
# WC09: ground bearing and distance from the new pin to the middle of its 4 toilets and of its 6 pee panels (and the blocks)
import json, math, sys
import pymupdf as fitz
PDF, GEOP, DER = sys.argv[1:4]
GEO = json.load(open(GEOP)); N = 2 ** 18 * 512
def ll_of(x, y):
    x17, y17 = x + 25.50, y + 0.12; T = GEO['main']['sheet_to_z18px']
    px = T[0][0] * x17 + T[0][1] * y17 + T[0][2]; py = T[1][0] * x17 + T[1][1] * y17 + T[1][2]
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / N)))), px / N * 360 - 180
def hav(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b)); h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))
def brg(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b)); y = math.sin(lo2 - lo1) * math.cos(la2)
    x = math.cos(la1) * math.sin(la2) - math.sin(la1) * math.cos(la2) * math.cos(lo2 - lo1); return (math.degrees(math.atan2(y, x)) + 360) % 360
r = json.load(open(DER))['rows']['WC09']; pin = r['listed_ll']
DR = pg = fitz.open(PDF)[0].get_drawings()
groups = {}
for i in r['drawings']:
    d = DR[i]; it = d['items']
    if it[0][0] == 'qu': q = it[0][1]; P = [(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.lr.x, q.lr.y), (q.ll.x, q.ll.y)]
    elif it[0][0] == 're': rr = it[0][1]; P = [(rr.x0, rr.y0), (rr.x1, rr.y0), (rr.x1, rr.y1), (rr.x0, rr.y1)]
    else:
        P = [(x[1].x, x[1].y) for x in it]
        mx = sum(p[0] for p in P) / len(P); my = sum(p[1] for p in P) / len(P); P = sorted(P, key=lambda p: math.atan2(p[1] - my, p[0] - mx))
    A = cx = cy = 0.0
    for k in range(len(P)):
        x0, y0 = P[k]; x1, y1 = P[(k + 1) % len(P)]; c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    A /= 2; c = (cx / (6 * A), cy / (6 * A)); A = abs(A)
    sides = sorted(math.hypot(P[k][0] - P[(k + 1) % 4][0], P[k][1] - P[(k + 1) % 4][1]) for k in range(4))
    k = 'block' if sides[-1] > 6 else 'pee' if sides[0] < 1.2 else 'toilet'
    groups.setdefault(k, []).append((A, c, [round(s, 2) for s in sides]))
for k, g in groups.items():
    At = sum(a for a, _, _ in g); c = (sum(a * p[0] for a, p, _ in g) / At, sum(a * p[1] for a, p, _ in g) / At); ll = ll_of(*c)
    print('%-6s n=%d sides(pt) %s  middle %.7f, %.7f  from pin %.1f m, bearing %.0f deg' % (k, len(g), g[0][2], *ll, hav(pin, ll), brg(pin, ll)))
