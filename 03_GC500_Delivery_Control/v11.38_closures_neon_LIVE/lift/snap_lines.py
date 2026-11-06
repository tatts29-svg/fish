"""Snap hand-set route waypoints (sheet pt, read off the marked plan laid on the 2026 sheet) onto the plan's own drawn lines:
each route is densified every 2 pt, the plan (explorer tiles at L2, 4 px per pt) is sampled along the normal at each step, dark
drawn-line crossings are the candidates, and a Viterbi pass picks the offsets that stay on one line (nearest line, least
jumping). A segment flagged as a road crossing is left straight. Writes lines.json and check crops at L3.
   python3 snap_lines.py routes.json"""
import json, sys, os, math
import numpy as np, cv2
from PIL import Image, ImageDraw
sys.path.insert(0, '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/tiles')
from fetch_tiles import window
S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/closures'
R0 = float(os.environ.get('R', '7')); STEP = 2.0; DT = 0.25
routes = json.load(open(sys.argv[1]))
RGB = {'pink': (232, 87, 155), 'teal': (40, 179, 168), 'orange': (240, 124, 34)}

def densify(a, b, step):
    n = max(1, int(math.ceil(math.hypot(b[0] - a[0], b[1] - a[1]) / step)))
    return [(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n) for i in range(n)]

def plan_canvas(x0, y0, x1, y1):
    im = window(2, x0, y0, x1, y1).convert('RGB'); a = np.asarray(im).astype(np.int16)
    grey = a.mean(axis=2); sat = a.max(axis=2) - a.min(axis=2)
    dark = (grey < 135) & (sat < 70)   # black / grey drawn lines, not colour fills, not the tan track
    return dark.astype(np.uint8), (x0, y0)

def sample_dark(dark, org, x, y):
    px, py = (x - org[0]) * 4, (y - org[1]) * 4
    ix, iy = int(round(px)), int(round(py))
    if 0 <= iy < dark.shape[0] and 0 <= ix < dark.shape[1]: return dark[iy, ix]
    return 0

out = []
for r in routes:
    pts = [tuple(p[:2]) for p in r['pts']]; flags = [str(p[2]) if len(p) > 2 else '' for p in r['pts']]; cross = ['c' in f for f in flags]; R = float(r.get('R', R0))
    # which hand the road is on, walking the route: the route's default, changed from a waypoint flagged L or R onward
    side = []; cur = r.get('road', 'L')
    for f in flags:
        if 'L' in f: cur = 'L'
        elif 'R' in f: cur = 'R'
        side.append(cur)
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    dark, org = plan_canvas(min(xs) - 12, min(ys) - 12, max(xs) + 12, max(ys) + 12)
    # dense samples with a flag: snap or not (a crossing is straight)
    dense = []; dside = []
    for i in range(len(pts) - 1):
        seg = densify(pts[i], pts[i + 1], STEP)
        for q in seg: dense.append((q, not cross[i + 1])); dside.append(side[i])
    dense.append((pts[-1], not cross[-1])); dside.append(side[-1])
    n = len(dense); ts = np.arange(-R, R + 1e-9, DT); K = len(ts)
    cand = np.zeros((n, K), bool); INF = 1e9
    for i, (q, snap) in enumerate(dense):
        if not snap: continue
        a = dense[max(0, i - 2)][0]; b = dense[min(n - 1, i + 2)][0]
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1.0; nx, ny = -dy / L, dx / L
        prof = np.array([sample_dark(dark, org, q[0] + nx * t, q[1] + ny * t) for t in ts])
        # a crossing = a run of dark samples; its centre is the candidate
        j = 0
        while j < K:
            if prof[j]:
                k = j
                while k + 1 < K and prof[k + 1]: k += 1
                if (k - j + 1) * DT <= 2.5: cand[i, (j + k) // 2] = True   # a line, not a filled block
                j = k + 1
            else: j += 1
    # Viterbi: state = offset index or 'none' (K)
    NONE = K; cost = np.full((n, K + 1), INF); back = np.zeros((n, K + 1), int)
    def emit(i, k):
        if k == NONE: return 5.0 if dense[i][1] else 0.0
        if not dense[i][1]: return INF
        return 0.25 * abs(ts[k]) if cand[i, k] else INF
    for k in range(K + 1): cost[0, k] = emit(0, k)
    for i in range(1, n):
        prev = cost[i - 1]
        for k in range(K + 1):
            e = emit(i, k)
            if e >= INF: continue
            if k == NONE: trans = prev + 0.0
            else: trans = np.array([prev[j] + (2.0 * abs(ts[k] - ts[j]) if j != NONE else 1.0) for j in range(K + 1)])
            j = int(np.argmin(trans)); cost[i, k] = trans[j] + e; back[i, k] = j
    k = int(np.argmin(cost[-1])); path = [k]
    for i in range(n - 1, 0, -1): k = back[i, k]; path.append(k)
    path = path[::-1]
    # apply offsets; a 'none' sample borrows the nearest chosen offset on its side (interpolated)
    offs = np.array([ts[k] if k != NONE else np.nan for k in path])
    idx = np.arange(n); good = ~np.isnan(offs)
    if good.any(): offs = np.interp(idx, idx[good], offs[good])
    else: offs = np.zeros(n)
    snapped = []
    for i, (q, snap) in enumerate(dense):
        a = dense[max(0, i - 2)][0]; b = dense[min(n - 1, i + 2)][0]
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1.0; nx, ny = -dy / L, dx / L
        t = offs[i] if snap else 0.0
        snapped.append((q[0] + nx * t, q[1] + ny * t))
    # onto the footpath: off the drawn kerb / fence line by OFF pt away from the road (the road's hand is per segment);
    # a crossing takes the offsets of the footpath points either side of it, interpolated, so it runs straight between them
    OFF = float(os.environ.get('OFF', '2.0')); vec = [None] * n
    for i, (q, snap) in enumerate(dense):
        if not snap: continue
        a = snapped[max(0, i - 2)]; b = snapped[min(n - 1, i + 2)]
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1.0; rx, ry = -dy / L, dx / L   # the right hand, walking
        s = OFF if dside[i] == 'L' else -OFF
        vec[i] = (rx * s, ry * s)
    idx = [i for i in range(n) if vec[i] is not None]
    if idx:
        for i in range(n):
            if vec[i] is None:
                lo = max([j for j in idx if j < i], default=None); hi = min([j for j in idx if j > i], default=None)
                if lo is None: vec[i] = vec[hi]
                elif hi is None: vec[i] = vec[lo]
                else: t = (i - lo) / float(hi - lo); vec[i] = (vec[lo][0] + (vec[hi][0] - vec[lo][0]) * t, vec[lo][1] + (vec[hi][1] - vec[lo][1]) * t)
        snapped = [(p[0] + v[0], p[1] + v[1]) for p, v in zip(snapped, vec)]
    # light smoothing along snapped runs, then simplify
    sm = []
    for i in range(n):
        if dense[i][1] and 0 < i < n - 1 and dense[i - 1][1] and dense[i + 1][1]:
            sm.append(((snapped[i - 1][0] + 2 * snapped[i][0] + snapped[i + 1][0]) / 4, (snapped[i - 1][1] + 2 * snapped[i][1] + snapped[i + 1][1]) / 4))
        else: sm.append(snapped[i])
    arr = np.array(sm, np.float32).reshape(-1, 1, 2)
    simp = cv2.approxPolyDP(arr, 0.7, False).reshape(-1, 2)
    none_n = int(sum(1 for k in path if k == NONE and dense[0][1]))
    print(f"{r['colour']:6s} {r['name']:44s} wp {len(pts):2d} dense {n:4d} unsnapped {int(np.isnan(np.array([ts[k] if k != NONE else np.nan for k in path])).sum()):3d} -> {len(simp)} vertices; median |offset| {np.nanmedian(np.abs([ts[k] if k != NONE else np.nan for k in path])):.2f} pt")
    out.append({'colour': r['colour'], 'name': r['name'], 'pts': [[round(float(x), 2), round(float(y), 2)] for x, y in simp]})
json.dump({'sheet_px': [2384, 1684], 'lines': out}, open(S + '/lines.json', 'w'), indent=1)
print('lines', len(out), 'vertices', sum(len(l['pts']) for l in out))
