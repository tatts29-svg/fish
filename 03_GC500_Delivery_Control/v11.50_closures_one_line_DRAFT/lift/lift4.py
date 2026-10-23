"""Third pass: wider pink window (the marker over the plan's yellow road fill reads orange-pink), the centreline at 1/3
scale, spurs pruned, paths merged through junctions and joined across gaps only when they continue in the same direction,
mapped to sheet pt, simplified, near-collinear runs merged so each line is a few straight segments. Each line is named by
the v11.38 line it overlaps most. Writes lines4.json, check4_full.png and crops.
   HUE0=135 HUE1=175 SAT=45 VAL=110 EPS=6 PRUNE=7 JOIN=10 COLL=10 python3 -I lift4.py"""
import sys, os, json, math
import numpy as np, cv2
from PIL import Image, ImageDraw
S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/closures2'
E = os.environ.get
HUE0, HUE1, SAT, VAL = int(E('HUE0', '135')), int(E('HUE1', '175')), int(E('SAT', '45')), int(E('VAL', '110'))
EPS, RED, PRUNE, JOIN, COLL, MINLEN = float(E('EPS', '6')), 3, int(E('PRUNE', '7')), float(E('JOIN', '10')), float(E('COLL', '10')), float(E('MINLEN', '20'))
G = cv2.cvtColor(np.array(Image.open(S + '/transcript_img_173.webp').convert('RGB')), cv2.COLOR_RGB2BGR)
Hm = np.load(S + '/H_guidance_to_sheet.npy')
hsv = cv2.cvtColor(G, cv2.COLOR_BGR2HSV); H, Sa, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
pink = ((H >= HUE0) & (H <= HUE1) & (Sa >= SAT) & (V >= VAL)).astype(np.uint8) * 255
pink = cv2.morphologyEx(pink, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
pink = cv2.morphologyEx(pink, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
n, lab, stats, _ = cv2.connectedComponentsWithStats(pink, 8); keep = np.zeros_like(pink)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] >= 350: keep[lab == i] = 255
pink = keep; cv2.imwrite(S + '/pink_mask4.png', pink)
small = cv2.resize(pink.astype(np.float32) / 255.0, None, fx=1 / RED, fy=1 / RED, interpolation=cv2.INTER_AREA)
m = (small >= 0.45).astype(np.uint8); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
def thin(img):
    img = img.copy(); prev = np.zeros_like(img)
    while True:
        for step in (0, 1):
            P = np.pad(img, 1)
            p2 = P[:-2, 1:-1]; p3 = P[:-2, 2:]; p4 = P[1:-1, 2:]; p5 = P[2:, 2:]; p6 = P[2:, 1:-1]; p7 = P[2:, :-2]; p8 = P[1:-1, :-2]; p9 = P[:-2, :-2]
            nb = [p2, p3, p4, p5, p6, p7, p8, p9]; B = sum(nb)
            A = sum(((nb[i] == 0) & (nb[(i + 1) % 8] == 1)).astype(np.uint8) for i in range(8))
            if step == 0: c1 = (p2 * p4 * p6 == 0); c2 = (p4 * p6 * p8 == 0)
            else: c1 = (p2 * p4 * p8 == 0); c2 = (p2 * p6 * p8 == 0)
            img[(img == 1) & (B >= 2) & (B <= 6) & (A == 1) & c1 & c2] = 0
        if np.array_equal(img, prev): break
        prev = img.copy()
    return img
sk = thin(m)
def graph(sk):
    ys, xs = np.nonzero(sk); pts = set(zip(xs.tolist(), ys.tolist()))
    def nbrs(p): x, y = p; return [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and (x + dx, y + dy) in pts]
    return pts, nbrs
for it in range(8):
    pts, nbrs = graph(sk); removed = 0
    for e in [p for p in pts if len(nbrs(p)) == 1]:
        chain = [e]; cur = e; prev = None
        while True:
            nn = [q for q in nbrs(cur) if q != prev]
            if len(nn) != 1: break
            prev, cur = cur, nn[0]
            if len(nbrs(cur)) >= 3: break
            chain.append(cur)
            if len(chain) > PRUNE: break
        if len(chain) <= PRUNE and len(nbrs(cur)) >= 3:
            for p in chain: sk[p[1], p[0]] = 0; removed += 1
    if not removed: break
sk = thin(sk); pts, nbrs = graph(sk)
deg = {p: len(nbrs(p)) for p in pts}; nodes = {p for p in pts if deg[p] != 2}
visited = set(); paths = []
def walk(start, nxt):
    path = [start, nxt]; visited.add((start, nxt)); visited.add((nxt, start)); cur, prev = nxt, start
    while cur not in nodes:
        nn = [q for q in nbrs(cur) if q != prev and q not in path[-3:]]
        if not nn: break
        prev, cur = cur, nn[0]; path.append(cur); visited.add((prev, cur)); visited.add((cur, prev))
    return path
for p in sorted(nodes):
    for q in nbrs(p):
        if (p, q) not in visited: paths.append(walk(p, q))
for p in sorted(pts):
    if deg[p] == 2 and not any((p, q) in visited for q in nbrs(p)): paths.append(walk(p, nbrs(p)[0]))
def plen(path): return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(path, path[1:]))
paths = [p for p in paths if plen(p) >= 3]
def dirn(path, at_start, k=8):
    seg = path[:k] if at_start else path[-k:][::-1]; a, b = seg[0], seg[-1]; v = (b[0] - a[0], b[1] - a[1]); L = math.hypot(*v) or 1; return (v[0] / L, v[1] / L)
def merge_once(paths):
    ends = {}
    for i, p in enumerate(paths): ends.setdefault(p[0], []).append((i, True)); ends.setdefault(p[-1], []).append((i, False))
    for node, lst in ends.items():
        if len(lst) < 2: continue
        best = None
        for a in range(len(lst)):
            for b in range(a + 1, len(lst)):
                (i, si), (j, sj) = lst[a], lst[b]
                if i == j: continue
                di = dirn(paths[i], si); dj = dirn(paths[j], sj); cos = -(di[0] * dj[0] + di[1] * dj[1])
                if best is None or cos > best[0]: best = (cos, i, si, j, sj)
        if best and best[0] > 0.3:
            cos, i, si, j, sj = best; pi = paths[i] if not si else paths[i][::-1]; pj = paths[j] if sj else paths[j][::-1]
            return [p for k, p in enumerate(paths) if k not in (i, j)] + [pi + pj[1:]]
    return None
while True:
    r = merge_once(paths)
    if r is None: break
    paths = r
def join_once(paths):
    best = None
    for i, p in enumerate(paths):
        for ei, e in ((True, p[0]), (False, p[-1])):
            for j, q in enumerate(paths):
                if i == j: continue
                for ej, f in ((True, q[0]), (False, q[-1])):
                    d = math.hypot(e[0] - f[0], e[1] - f[1])
                    if d <= JOIN:
                        di = dirn(p, ei); dj = dirn(q, ej); cos = -(di[0] * dj[0] + di[1] * dj[1])   # away-directions opposite = continuing
                        gap = ((f[0] - e[0]) / (d or 1), (f[1] - e[1]) / (d or 1)); along = -(di[0] * gap[0] + di[1] * gap[1])
                        if cos > 0.6 and along > 0.5 and (best is None or d < best[0]): best = (d, i, ei, j, ej)
    if best is None: return None
    d, i, ei, j, ej = best; p, q = paths[i], paths[j]; pi = p[::-1] if ei else p; pj = q if ej else q[::-1]
    return [x for k, x in enumerate(paths) if k not in (i, j)] + [pi + pj]
while True:
    r = join_once(paths)
    if r is None: break
    paths = r
paths.sort(key=lambda p: -plen(p))
def to_sheet(path):
    a = np.float32([[x * RED + RED / 2, y * RED + RED / 2] for x, y in path]).reshape(-1, 1, 2); return cv2.perspectiveTransform(a, Hm).reshape(-1, 2)
def dp(p, eps):
    if len(p) < 3: return np.float32(p)
    return cv2.approxPolyDP(np.float32(p).reshape(-1, 1, 2), eps, False).reshape(-1, 2)
def collinear(p, deg_tol):
    p = [tuple(x) for x in p]
    if len(p) < 3: return p
    out = [p[0]]
    for k in range(1, len(p) - 1):
        a, b, c = out[-1], p[k], p[k + 1]
        v1 = (b[0] - a[0], b[1] - a[1]); v2 = (c[0] - b[0], c[1] - b[1]); L1 = math.hypot(*v1) or 1; L2 = math.hypot(*v2) or 1
        ang = math.degrees(math.acos(max(-1, min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (L1 * L2)))))
        if ang > deg_tol: out.append(b)
    out.append(p[-1]); return out
old = json.load(open('/home/user/fish/03_GC500_Delivery_Control/v11.38_closures_neon_LIVE/closures_lines.json'))['lines']
def seg_dist(P, A, B):
    ax, ay = A; bx, by = B; px, py = P; dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy or 1e-9
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2)); return math.hypot(px - (ax + t * dx), py - (ay + t * dy))
def near_old(pts):
    best = None
    for o in old:
        op = o['pts']; hits = 0
        for P in pts:
            if min(seg_dist(P, op[k], op[k + 1]) for k in range(len(op) - 1)) <= 30: hits += 1
        f = hits / len(pts)
        if best is None or f > best[0]: best = (f, o['name'])
    return best
out = []
for path in paths:
    b = to_sheet(path); s = collinear(dp(b, EPS), COLL)
    L = float(sum(math.hypot(s[k + 1][0] - s[k][0], s[k + 1][1] - s[k][1]) for k in range(len(s) - 1)))
    if L < MINLEN: continue
    f, name = near_old(s)
    out.append({'name': name if f >= 0.5 else 'closure line', 'overlap': round(f, 2), 'pts': [[round(float(x), 1), round(float(y), 1)] for x, y in s], 'len_pt': round(L, 1)})
json.dump({'sheet_px': [2384, 1684], 'eps_pt': EPS, 'collinear_deg': COLL, 'lines': out, 'note': 'lifted off the marked plan of 23 Oct 2026 by homography (SIFT/RANSAC): the centreline of the marker, simplified to straight runs; one colour'}, open(S + '/lines4.json', 'w'), indent=1)
print('pink px', int(pink.sum() // 255), 'skeleton px', len(pts), 'paths', len(paths), '-> lines', len(out), 'vertices', sum(len(l['pts']) for l in out), 'total pt', round(sum(l['len_pt'] for l in out)))
for l in out: print(f"  {len(l['pts']):3d} v {l['len_pt']:7.1f} pt  overlap {l['overlap']:.2f}  {l['name'][:60]}")
SH = Image.open(S + '/sheet_L0.png').convert('RGBA'); d = ImageDraw.Draw(SH)
for l in out:
    p = [tuple(x) for x in l['pts']]
    if len(p) > 1: d.line(p, fill=(255, 20, 220, 255), width=6, joint='curve')
    for x, y in p: d.ellipse([x - 2.5, y - 2.5, x + 2.5, y + 2.5], fill=(0, 0, 0, 255))
SH.convert('RGB').save(S + '/check4_full.png')
for name, box in {'west': (0, 280, 520, 1000), 'north': (330, 260, 1250, 460), 'ne': (1150, 240, 1810, 520), 'east': (1600, 200, 2384, 560), 'hill': (40, 520, 400, 1000)}.items():
    SH.crop(box).convert('RGB').save(S + f'/check4_{name}.png')
