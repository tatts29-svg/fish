#!/usr/bin/env python3
"""The lap for the real-city showcase: the show scene's own centreline (GC3D.S.CL, every 0.5 key-plan points, about
   3 m), put on the ground through the circuit's registration (gc3d_registration.json: W = s.R(th).K + t, metres
   east/north of -27.9880, 153.4270), with a speed at each point from simple car limits. The limits are a stand-in
   for a Supercar, not telemetry: 14 m/s2 across (about 1.4 g), 20 m/s2 braking, 6 m/s2 accelerating, 72 m/s top."""
import json, math, sys
d = json.load(open(sys.argv[1])); g = json.load(open(sys.argv[2])); out = sys.argv[3]
s = g['s']; th = math.radians(g['th_deg']); tx, ty = g['t']; lat0, lon0 = g['lat0'], g['lon0']
CX, CY = d['geoFrame']['ring_centre_pt']; M = 5.937552372855356
def en(p):
    K = (p[0] + CX, -(p[1] + CY)); return (s * (math.cos(th) * K[0] - math.sin(th) * K[1]) + tx, s * (math.sin(th) * K[0] + math.cos(th) * K[1]) + ty)
P = [en(p) for p in d['cl']]; W = [p[2] * M for p in d['cl']]; n = len(P)
# ONTO THE REAL ROAD. The scene's centreline follows the key plan's drawn ring, which sits up to ~20 m off the kerbs in
# places (The Esplanade). Each point is pulled onto the nearest OpenStreetMap road centre line (trunk to residential,
# the page's own surroundings pack, same registration) running the same way (within 35 degrees) and within 40 m; the
# pull is median-filtered and smoothed over ~25 m so the line cannot kink at a junction. No match: the neighbours' pull.
if len(sys.argv) > 4:
    sur = json.load(open(sys.argv[4]))['surrounds']; U, OX, OY = float(sur['unit']), float(sur['ox']), float(sur['oy'])
    def enk(kx, ky): return en((kx - CX, ky - CY))
    segs = []
    for r in sur['roads']:
        if r[0] > 2: continue
        q = [enk(r[i] * U + OX, r[i + 1] * U + OY) for i in range(1, len(r) - 1, 2)]
        segs += [(q[i], q[i + 1]) for i in range(len(q) - 1)]
    off = []
    for i in range(n):
        a, b = P[(i - 2) % n], P[(i + 2) % n]; tx_, ty_ = b[0] - a[0], b[1] - a[1]; tl = math.hypot(tx_, ty_) or 1; tx_ /= tl; ty_ /= tl
        best = None
        for (p0, p1) in segs:
            sx, sy = p1[0] - p0[0], p1[1] - p0[1]; sl = math.hypot(sx, sy)
            if sl < .5 or abs(sx / sl * tx_ + sy / sl * ty_) < math.cos(math.radians(35)): continue
            u = max(0, min(1, ((P[i][0] - p0[0]) * sx + (P[i][1] - p0[1]) * sy) / (sl * sl))); qx, qy = p0[0] + sx * u, p0[1] + sy * u
            dd = math.hypot(qx - P[i][0], qy - P[i][1])
            if dd < 40 and (best is None or dd < best[0]): best = (dd, qx - P[i][0], qy - P[i][1])
        off.append(best[1:] if best else None)
    got = [i for i in range(n) if off[i]]
    for i in range(n):
        if off[i] is None:
            j = min(got, key=lambda g: min(abs(g - i), n - abs(g - i))); off[i] = off[j]
    med = []
    for i in range(n):
        w = sorted(range(-4, 5), key=lambda k: 0)
        xs = sorted(off[(i + k) % n][0] for k in range(-4, 5)); ys = sorted(off[(i + k) % n][1] for k in range(-4, 5)); med.append((xs[4], ys[4]))
    sm = []
    for i in range(n):
        ws = [math.exp(-(k * k) / (2 * 4.0 ** 2)) for k in range(-12, 13)]; sw = sum(ws)
        sm.append((sum(ws[k + 12] * med[(i + k) % n][0] for k in range(-12, 13)) / sw, sum(ws[k + 12] * med[(i + k) % n][1] for k in range(-12, 13)) / sw))
    mags = [math.hypot(*o) for o in sm]; print('pulled onto OSM: matched', len(got), 'of', n, '| pull median', round(sorted(mags)[n // 2], 1), 'm, max', round(max(mags), 1), 'm, at index', mags.index(max(mags)))
    P = [(P[i][0] + sm[i][0], P[i][1] + sm[i][1]) for i in range(n)]
seg = [math.hypot(P[(i + 1) % n][0] - P[i][0], P[(i + 1) % n][1] - P[i][1]) for i in range(n)]
# curvature over +-4 samples (about 24 m), so the key plan's small wobbles do not read as corners
k = []
for i in range(n):
    a, b, c = P[(i - 4) % n], P[i], P[(i + 4) % n]
    ab = math.hypot(b[0] - a[0], b[1] - a[1]); bc = math.hypot(c[0] - b[0], c[1] - b[1]); ca = math.hypot(a[0] - c[0], a[1] - c[1])
    cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); k.append(2 * abs(cr) / max(1e-6, ab * bc * ca))
k = [sum(k[(i + j) % n] for j in range(-2, 3)) / 5 for i in range(n)]
ALAT, ABRK, AACC, VMAX = 14.0, 20.0, 6.0, 72.0
v = [min(VMAX, math.sqrt(ALAT / max(k[i], 1e-5))) for i in range(n)]
for _ in range(3):
    for i in range(1, 2 * n):   # accelerating out of each corner
        j = i % n; p = (i - 1) % n; v[j] = min(v[j], math.sqrt(v[p] ** 2 + 2 * AACC * seg[p]))
    for i in range(2 * n, 0, -1):   # braking into it
        j = i % n; q = (i + 1) % n; v[j] = min(v[j], math.sqrt(v[q] ** 2 + 2 * ABRK * seg[j]))
lap = sum(seg[i] / max(1, (v[i] + v[(i + 1) % n]) / 2) for i in range(n))
cosl = math.cos(math.radians(lat0))
pts = [[round(lat0 + e_n[1] / 111320.0, 7), round(lon0 + e_n[0] / (111320.0 * cosl), 7), round(W[i], 1), round(v[i], 2)] for i, e_n in enumerate(P)]
grid = int(d['gridS'] / 0.5) % n
json.dump({'what': 'GC500 lap: [lat, lon, road width m, speed m/s] every ~3 m, from the show scene centreline and the circuit registration; speeds are modelled, not telemetry',
           'lap_m': round(sum(seg), 1), 'lap_s': round(lap, 1), 'grid': grid, 'pts': pts}, open(out, 'w'), separators=(',', ':'))
print('points', n, 'lap m', round(sum(seg)), 'lap s', round(lap, 1), 'v min/max km/h', round(min(v) * 3.6), round(max(v) * 3.6), 'grid', grid)
