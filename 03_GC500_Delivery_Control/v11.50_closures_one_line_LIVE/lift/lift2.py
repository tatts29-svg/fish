"""Lift the pink marker strokes off Andrew's marked 2026 plan (23 Oct 2026) onto the sheet (D001-26003-03) in sheet pt.
1. SIFT/RANSAC homography from the marked image to the sheet overview (explorer tiles, L0 = 1 px per pt), pink masked out.
2. Pink mask (HSV), opened so the plan's own thin purple/pink linework drops out, components kept by area.
3. Zhang-Suen thinning, skeleton traced into polylines between endpoints/junctions, spurs dropped.
4. Each polyline mapped to sheet pt and simplified (Douglas-Peucker). Writes lines2_raw.json and check images."""
import sys, os, json, math
import numpy as np, cv2
from PIL import Image, ImageDraw
sys.path.insert(0, '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/tiles')
from fetch_tiles import window
S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/closures2'
EPS = float(os.environ.get('EPS', '3.0'))
G = cv2.cvtColor(np.array(Image.open(S + '/transcript_img_173.webp').convert('RGB')), cv2.COLOR_RGB2BGR)
gh, gw = G.shape[:2]
# --- sheet overview at 1 px/pt
sheet_png = S + '/sheet_L0.png'
if not os.path.exists(sheet_png): window(0, 0, 0, 2384, 1684).convert('RGB').save(sheet_png)
SH = cv2.imread(sheet_png); sh, sw = SH.shape[:2]
print('guidance', gw, gh, 'sheet', sw, sh)
# --- pink mask on the guidance
hsv = cv2.cvtColor(G, cv2.COLOR_BGR2HSV)
H, Sa, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
pink = ((H >= 140) & (H <= 172) & (Sa >= 60) & (V >= 120)).astype(np.uint8) * 255
raw_pink = int(pink.sum() // 255)
k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)); k7 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
pink = cv2.morphologyEx(pink, cv2.MORPH_OPEN, k5)
pink = cv2.morphologyEx(pink, cv2.MORPH_CLOSE, k7)
n, lab, stats, _ = cv2.connectedComponentsWithStats(pink, 8)
keep = np.zeros_like(pink)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] >= 400: keep[lab == i] = 255
pink = keep
print('pink px raw', raw_pink, 'kept', int(pink.sum() // 255), 'components', sum(1 for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= 400))
cv2.imwrite(S + '/pink_mask.png', pink)
# --- registration (pink and its halo masked out of the features)
gray_g = cv2.cvtColor(G, cv2.COLOR_BGR2GRAY); gray_s = cv2.cvtColor(SH, cv2.COLOR_BGR2GRAY)
mask_g = cv2.bitwise_not(cv2.dilate(pink, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))))
sift = cv2.SIFT_create(nfeatures=12000)
kg, dg = sift.detectAndCompute(gray_g, mask_g); ks, ds = sift.detectAndCompute(gray_s, None)
flann = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=64))
matches = flann.knnMatch(dg, ds, k=2)
good = [m for m, nn in matches if m.distance < 0.72 * nn.distance]
src = np.float32([kg[m.queryIdx].pt for m in good]); dst = np.float32([ks[m.trainIdx].pt for m in good])
Hm, inl = cv2.findHomography(src, dst, cv2.RANSAC, 3.0)
inl = inl.ravel().astype(bool)
proj = cv2.perspectiveTransform(src[inl].reshape(-1, 1, 2), Hm).reshape(-1, 2)
err = np.linalg.norm(proj - dst[inl], axis=1)
print('sift kp', len(kg), len(ks), 'good', len(good), 'inliers', int(inl.sum()), 'median err px', round(float(np.median(err)), 2), 'p90', round(float(np.percentile(err, 90)), 2))
np.save(S + '/H_guidance_to_sheet.npy', Hm)
json.dump({'H': Hm.tolist(), 'inliers': int(inl.sum()), 'median_err_px': float(np.median(err)), 'p90_err_px': float(np.percentile(err, 90)), 'guidance_px': [gw, gh], 'sheet_px': [sw, sh]}, open(S + '/homography2.json', 'w'), indent=1)
# --- thinning (Zhang-Suen)
def thin(img):
    img = (img > 0).astype(np.uint8); prev = np.zeros_like(img)
    while True:
        for step in (0, 1):
            P = np.pad(img, 1)
            p2 = P[:-2, 1:-1]; p3 = P[:-2, 2:]; p4 = P[1:-1, 2:]; p5 = P[2:, 2:]; p6 = P[2:, 1:-1]; p7 = P[2:, :-2]; p8 = P[1:-1, :-2]; p9 = P[:-2, :-2]
            nb = [p2, p3, p4, p5, p6, p7, p8, p9]
            B = sum(nb)
            A = sum(((nb[i] == 0) & (nb[(i + 1) % 8] == 1)).astype(np.uint8) for i in range(8))
            if step == 0: c1 = (p2 * p4 * p6 == 0); c2 = (p4 * p6 * p8 == 0)
            else: c1 = (p2 * p4 * p8 == 0); c2 = (p2 * p6 * p8 == 0)
            rem = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & c1 & c2
            img[rem] = 0
        if np.array_equal(img, prev): break
        prev = img.copy()
    return img
sk = thin(pink)
cv2.imwrite(S + '/skeleton.png', sk * 255)
# --- trace polylines
ys, xs = np.nonzero(sk); pts = set(zip(xs.tolist(), ys.tolist()))
def nbrs(p):
    x, y = p; return [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and (x + dx, y + dy) in pts]
deg = {p: len(nbrs(p)) for p in pts}
nodes = {p for p in pts if deg[p] != 2}
visited = set(); paths = []
def walk(start, nxt):
    path = [start, nxt]; visited.add((start, nxt)); visited.add((nxt, start)); cur, prev = nxt, start
    while cur not in nodes:
        nn = [q for q in nbrs(cur) if q != prev]
        # prefer a neighbour not already in the path (avoid 2x2 blobs looping)
        nn = [q for q in nn if q not in path[-3:]]
        if not nn: break
        prev, cur = cur, nn[0]; path.append(cur); visited.add((prev, cur)); visited.add((cur, prev))
    return path
for p in sorted(nodes):
    for q in nbrs(p):
        if (p, q) in visited: continue
        paths.append(walk(p, q))
# closed loops without nodes
for p in sorted(pts):
    if deg[p] == 2 and not any((p, q) in visited for q in nbrs(p)):
        paths.append(walk(p, nbrs(p)[0]))
def plen(path): return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(path, path[1:]))
paths = [p for p in paths if plen(p) >= 12]
print('skeleton px', len(pts), 'nodes', len(nodes), 'paths', len(paths), 'total px len', round(sum(plen(p) for p in paths)))
# --- to sheet pt, simplify
def to_sheet(path):
    a = np.float32(path).reshape(-1, 1, 2); b = cv2.perspectiveTransform(a, Hm).reshape(-1, 2); return b
def dp(pts, eps):
    if len(pts) < 3: return pts
    a = np.float32(pts).reshape(-1, 1, 2); r = cv2.approxPolyDP(a, eps, False).reshape(-1, 2); return r
out = []
for path in paths:
    b = to_sheet(path); s = dp(b, EPS)
    out.append({'pts': [[round(float(x), 1), round(float(y), 1)] for x, y in s], 'px_len': round(plen(path), 1)})
out.sort(key=lambda l: -l['px_len'])
json.dump({'sheet_px': [2384, 1684], 'eps_pt': EPS, 'lines': out, 'note': 'lifted off the marked plan of 23 Oct 2026 by homography; raw, unsnapped'}, open(S + '/lines2_raw.json', 'w'), indent=1)
print('lines', len(out), 'vertices', sum(len(l['pts']) for l in out), 'longest px', [l['px_len'] for l in out[:12]])
# --- check images: lines on the sheet (L0) and the guidance warped onto the sheet
chk = Image.fromarray(cv2.cvtColor(SH, cv2.COLOR_BGR2RGB)).convert('RGBA'); d = ImageDraw.Draw(chk)
for l in out:
    p = [tuple(x) for x in l['pts']]
    if len(p) > 1: d.line(p, fill=(255, 20, 220, 255), width=7, joint='curve')
chk.convert('RGB').save(S + '/check_lines_L0.png')
warped = cv2.warpPerspective(G, Hm, (sw, sh))
blend = cv2.addWeighted(SH, 0.5, warped, 0.5, 0); cv2.imwrite(S + '/check_blend.png', blend)
print('wrote', S + '/check_lines_L0.png', S + '/check_blend.png')
