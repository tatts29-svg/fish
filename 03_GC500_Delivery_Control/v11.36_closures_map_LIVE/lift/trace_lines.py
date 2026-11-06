"""Trace the highlighter strokes on the marked 2019 plate into centrelines on the 2026 sheet (sheet pt, 1 pt = 1 px at 2x).
Step 1 of the neon lines: pen masks (as overlay_build3, lone-mark rule relaxed so the faint orange 6 piece survives) -> warp to the
sheet at 2x -> thin (Zhang-Suen) -> graph of skeleton pixels -> ordered paths (endpoint to endpoint, longest first) -> join same-colour
paths whose ends are near (the pen lifted; the line does not break) -> simplify. Writes lines_raw.json and a check image."""
import json, os, sys
import cv2, numpy as np
from PIL import Image
S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/closures'
H = np.load(S + '/H_plate_to_sheet.npy'); H2 = np.diag([2.0, 2.0, 1.0]) @ H; Hi = np.linalg.inv(H)
plate = Image.open(S + '/plate.png').convert('RGB'); PW, PH = plate.size
hsv = np.asarray(plate.convert('HSV')).astype(int); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
sheet = cv2.imread(S + '/sheet.png'); sheet_p = cv2.warpPerspective(sheet, Hi, (PW, PH), flags=cv2.INTER_LINEAR)
shsv = cv2.cvtColor(sheet_p, cv2.COLOR_BGR2HSV).astype(int); sh, ss, sv = shsv[..., 0] * 255 // 180, shsv[..., 1], shsv[..., 2]
BANDS = {'pink': (218, 250), 'teal': (95, 150), 'orange': (3, 36)}
def band(hh, sat, val, col, smin, vmin):
    lo, hi = BANDS[col]; return (hh >= lo) & (hh <= hi) & (sat >= smin) & (val >= vmin)
masks = {}
for col, smin, vmin in [('pink', 55, 110), ('teal', 35, 80), ('orange', 55, 140)]:
    pen = band(h, s, v, col, smin, vmin)
    printed = cv2.dilate(band(sh, ss, sv, col, 45, 60).astype(np.uint8) * 255, np.ones((13, 13), np.uint8)) > 0
    masks[col] = pen if col == 'pink' else (pen & ~printed)
def plate_pt(sx, sy):
    p = Hi @ np.array([sx, sy, 1.0]); return p[0] / p[2], p[1] / p[2]
keep = np.zeros((PH, PW), np.uint8)
cv2.fillPoly(keep, [np.array([plate_pt(20, 20), plate_pt(1180, 20), plate_pt(1180, 355), plate_pt(615, 355), plate_pt(615, 618), plate_pt(20, 618)], np.int32)], 255)
cv2.fillPoly(keep, [np.array([plate_pt(20, 20), plate_pt(150, 20), plate_pt(150, 195), plate_pt(20, 195)], np.int32)], 0)
prepared = {}
for col, m in masks.items():
    mm = cv2.bitwise_and(m.astype(np.uint8) * 255, keep)
    mm = cv2.morphologyEx(mm, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    mm = cv2.morphologyEx(mm, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    prepared[col] = mm
all_rings = []
for col, mm in prepared.items():
    closed = cv2.morphologyEx(mm, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
    cs, hier = cv2.findContours(closed, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hier is not None:
        hier = hier[0]
        for i, c in enumerate(cs):
            if hier[i][3] != -1: continue
            child = hier[i][2]
            while child != -1:
                x, y, w, hh = cv2.boundingRect(cs[child])
                if 10 <= w <= 50 and 10 <= hh <= 50 and 0.5 <= w / float(hh) <= 2.0: all_rings.append((x + w / 2.0, y + hh / 2.0, max(w, hh) + 20))
                child = hier[child][0]
    n0, lab0, st0, ce0 = cv2.connectedComponentsWithStats(mm, 8)
    for i in range(1, n0):
        x, y, w, hh, area = st0[i]
        if 22 <= w <= 90 and 22 <= hh <= 90 and 0.55 <= w / float(hh) <= 1.8 and area < 1600: all_rings.append((float(ce0[i][0]), float(ce0[i][1]), max(w, hh)))
LONE = int(os.environ.get('LONE', '500'))
warped = {}
for col in prepared:
    mm = prepared[col].copy()
    for (cx, cy, d) in all_rings: cv2.circle(mm, (int(cx), int(cy)), int(d / 2 + 16), 0, -1)
    n, lab, stats, cents = cv2.connectedComponentsWithStats(mm, 8)
    strokes = np.zeros_like(mm)
    comps = [(i,) + tuple(stats[i]) for i in range(1, n) if stats[i][4] >= 70]
    for (i, x, y, w, hh, area) in comps:
        if area > 1500 and area / float(w * hh) > 0.45: continue
        if area < LONE:
            near = any(j != i and abs(cents[i][0] - cents[j][0]) < 80 + (w + w2) / 2 and abs(cents[i][1] - cents[j][1]) < 80 + (hh + h2) / 2 for (j, x2, y2, w2, h2, a2) in comps)
            if not near: continue
        strokes[lab == i] = 255
    wm = cv2.warpPerspective(strokes, H2, (2384, 1684), flags=cv2.INTER_LINEAR)
    wm = (wm > 100).astype(np.uint8) * 255
    wm = cv2.morphologyEx(wm, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    wm = cv2.morphologyEx(wm, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    warped[col] = wm

def thin(img):
    """Zhang-Suen thinning on a 0/1 array."""
    img = (img > 0).astype(np.uint8); changed = True
    while changed:
        changed = False
        for step in (0, 1):
            P = np.pad(img, 1)
            p2 = P[:-2, 1:-1]; p3 = P[:-2, 2:]; p4 = P[1:-1, 2:]; p5 = P[2:, 2:]; p6 = P[2:, 1:-1]; p7 = P[2:, :-2]; p8 = P[1:-1, :-2]; p9 = P[:-2, :-2]
            B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
            seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(np.uint8) for i in range(8))
            if step == 0: c1 = (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
            else: c1 = (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)
            m = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & c1
            if m.any(): img[m] = 0; changed = True
    return img

def paths_from_skeleton(sk):
    """Order skeleton pixels into paths: walk from endpoints (degree 1), then from any remaining pixel (loops)."""
    ys, xs = np.nonzero(sk); pts = set(zip(xs.tolist(), ys.tolist()))
    def nbrs(p):
        x, y = p; return [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and (x + dx, y + dy) in pts]
    deg = {p: len(nbrs(p)) for p in pts}
    # junction pixels (deg >= 3) are removed so branches become separate paths; short spurs are dropped later
    junctions = {p for p, d in deg.items() if d >= 3}
    for j in junctions: pts.discard(j)
    deg = {p: len(nbrs(p)) for p in pts}
    unvisited = set(pts); paths = []
    def walk(start):
        path = [start]; unvisited.discard(start); cur = start
        while True:
            nx = [q for q in nbrs(cur) if q in unvisited]
            if not nx: break
            # prefer 4-connected neighbour to avoid zigzag doubling
            nx.sort(key=lambda q: abs(q[0] - cur[0]) + abs(q[1] - cur[1]))
            cur = nx[0]; path.append(cur); unvisited.discard(cur)
        return path
    for p in sorted(pts, key=lambda p: (deg[p] != 1, p)):
        if p in unvisited and deg[p] == 1: paths.append(walk(p))
    for p in sorted(pts):
        if p in unvisited: paths.append(walk(p))
    return paths, junctions

def simplify(path, eps):
    if len(path) < 3: return path
    arr = np.array(path, np.float32).reshape(-1, 1, 2)
    out = cv2.approxPolyDP(arr, eps, False).reshape(-1, 2)
    return [tuple(map(float, p)) for p in out]

def join_paths(paths, gap):
    """Join paths end to end while the nearest free ends of two paths lie within gap px."""
    paths = [list(p) for p in paths]
    changed = True
    while changed and len(paths) > 1:
        changed = False; best = None
        for i in range(len(paths)):
            for j in range(i + 1, len(paths)):
                for ei, pi in ((0, paths[i][0]), (1, paths[i][-1])):
                    for ej, pj in ((0, paths[j][0]), (1, paths[j][-1])):
                        d = float(np.hypot(pi[0] - pj[0], pi[1] - pj[1]))
                        if d <= gap and (best is None or d < best[0]): best = (d, i, j, ei, ej)
        if best:
            d, i, j, ei, ej = best; a, b = paths[i], paths[j]
            if ei == 0: a = a[::-1]       # a ends at the joint
            if ej == 1: b = b[::-1]       # b starts at the joint
            paths[i] = a + b; del paths[j]; changed = True
    return paths

MINLEN = int(os.environ.get('MINLEN', '24'))
JOIN = int(os.environ.get('JOIN', '70'))
lines = []; check = Image.open(S + '/sheet.png').convert('RGB').resize((2384, 1684), Image.LANCZOS)
import PIL.ImageDraw as ImageDraw
dr = ImageDraw.Draw(check)
RGB = {'pink': (232, 87, 155), 'teal': (40, 179, 168), 'orange': (240, 124, 34)}
for col, wm in warped.items():
    sk = thin(wm)
    paths, junctions = paths_from_skeleton(sk)
    paths = [p for p in paths if len(p) >= MINLEN]
    paths = join_paths(paths, JOIN)
    paths = [p for p in paths if len(p) >= MINLEN * 2]
    for p in paths:
        sp = simplify(p, 2.0)
        lines.append({'colour': col, 'pts': [[round(x, 1), round(y, 1)] for x, y in sp], 'n_skel': len(p)})
        dr.line([tuple(q) for q in sp], fill=RGB[col], width=3)
        for q in sp: dr.ellipse([q[0] - 2, q[1] - 2, q[0] + 2, q[1] + 2], outline=(0, 0, 0))
    print(col, 'skeleton px', int(sk.sum()), 'paths', len(paths), [len(p) for p in paths])
check.save(S + '/lines_raw_check.png')
json.dump({'sheet_px': [2384, 1684], 'lines': lines}, open(S + '/lines_raw.json', 'w'), indent=1)
print('lines', len(lines), 'vertices', sum(len(l['pts']) for l in lines))
