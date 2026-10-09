#!/usr/bin/env python3
"""Fine registration of the D001 main plan at z18 @2x (0.26 m/px). Starting from the coarse z16 fit, the sheet's own
aerial is warped into z18 mosaic space and matched patch by patch on a grid (normalised cross-correlation on
contrast-restored greys); every patch with a strong, unambiguous peak becomes a registration point. An affine is fitted
to three quarters of them and the remaining quarter is held out as an independent check. Residuals are reported in
ground metres. Then three proof composites are written: the aerial over the satellite as a checkerboard at the pit /
island, the beachfront and the south-east end.  python3 refine_main.py -> georef_main.json, proof_*.jpg"""
import cv2, numpy as np, json, math, random

coarse = json.load(open('georef_main_z16.json'))
M16 = np.array(coarse['sheet_to_z16px'])                 # sheet pt -> global z16 px (512 px tiles)
meta = json.load(open('mosaic_z18.json')); Z = 18; TILE = 512
mos = cv2.imread('mosaic_z18.jpg', cv2.IMREAD_GRAYSCALE)
aer = cv2.imread('emb/x6_eq.png', cv2.IMREAD_GRAYSCALE)
PL = coarse['sources']['placement_sheet_pts']; SX, SY = PL['pw'] / PL['w'], PL['ph'] / PL['h']
lat_c = -27.988; mpp = 156543.03392 * math.cos(math.radians(lat_c)) / (2 ** Z) / 2
# aerial px -> sheet pt -> global z16 px -> global z18 px -> mosaic px
A2S = np.array([[1 / SX, 0, PL['x0']], [0, 1 / SY, PL['y0']], [0, 0, 1]])
Z16_18 = np.diag([4.0, 4.0, 1.0])
T = np.array([[1, 0, -meta['x0'] * TILE], [0, 1, -meta['y0'] * TILE], [0, 0, 1]])
aer_to_mos = T @ Z16_18 @ M16 @ A2S
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(24, 24))
mosq = clahe.apply(mos)
warped = cv2.warpAffine(aer, aer_to_mos[:2], (mos.shape[1], mos.shape[0]), flags=cv2.INTER_AREA, borderValue=0)
valid = cv2.warpAffine(np.full(aer.shape, 255, np.uint8), aer_to_mos[:2], (mos.shape[1], mos.shape[0]), flags=cv2.INTER_NEAREST, borderValue=0)
cv2.imwrite('warped_coarse_z18.jpg', warped, [cv2.IMWRITE_JPEG_QUALITY, 80])
# grid of patches over the valid area
P, SEARCH, STEP = 192, 48, 224
pts_src, pts_dst, scores = [], [], []
H, W = mos.shape
for y in range(P + SEARCH, H - P - SEARCH, STEP):
    for x in range(P + SEARCH, W - P - SEARCH, STEP):
        if valid[y - P // 2:y + P // 2, x - P // 2:x + P // 2].min() == 0: continue
        tpl = warped[y - P // 2:y + P // 2, x - P // 2:x + P // 2]
        if tpl.std() < 12: continue                                   # flat water or sand carries nothing to match
        win = mosq[y - P // 2 - SEARCH:y + P // 2 + SEARCH, x - P // 2 - SEARCH:x + P // 2 + SEARCH]
        res = cv2.matchTemplate(win, tpl, cv2.TM_CCOEFF_NORMED)
        _, mx, _, loc = cv2.minMaxLoc(res)
        # unambiguous: the best peak must beat the best peak outside a 12 px ring around it by a margin
        r2 = res.copy(); cv2.circle(r2, loc, 12, -1, -1); _, mx2, _, _ = cv2.minMaxLoc(r2)
        if mx < 0.35 or mx - mx2 < 0.08: continue
        dx, dy = loc[0] - SEARCH, loc[1] - SEARCH
        pts_src.append((x, y)); pts_dst.append((x + dx, y + dy)); scores.append(float(mx))
pts_src = np.float32(pts_src); pts_dst = np.float32(pts_dst)
print('candidate points', len(pts_src))
D, inl = cv2.estimateAffine2D(pts_src, pts_dst, method=cv2.RANSAC, ransacReprojThreshold=6.0, maxIters=5000, confidence=0.999)
inl = inl.ravel().astype(bool); idx = list(np.where(inl)[0]); random.seed(11); random.shuffle(idx)
cut = len(idx) * 3 // 4; fit, chk = idx[:cut], idx[cut:]
D, _ = cv2.estimateAffine2D(pts_src[fit], pts_dst[fit], method=cv2.LMEDS)
ap = lambda pts: np.hstack([pts, np.ones((len(pts), 1), np.float32)]) @ D.T
r_fit = np.linalg.norm(ap(pts_src[fit]) - pts_dst[fit], axis=1); r_chk = np.linalg.norm(ap(pts_src[chk]) - pts_dst[chk], axis=1)
print('inliers %d of %d; fit n=%d rms %.2f m p95 %.2f m; check n=%d rms %.2f m p95 %.2f m max %.2f m' % (
    inl.sum(), len(pts_src), len(fit), np.sqrt((r_fit ** 2).mean()) * mpp, np.percentile(r_fit, 95) * mpp, len(chk),
    np.sqrt((r_chk ** 2).mean()) * mpp, np.percentile(r_chk, 95) * mpp, r_chk.max() * mpp))
# the refined chain: sheet pt -> mosaic px (coarse) -> corrected mosaic px -> global z18 px
D3 = np.vstack([D, [0, 0, 1]])
sheet_to_mos = D3 @ T @ Z16_18 @ M16
Tinv = np.array([[1, 0, meta['x0'] * TILE], [0, 1, meta['y0'] * TILE], [0, 0, 1]])
sheet_to_z18px = Tinv @ sheet_to_mos
n = 2 ** Z * TILE
def lonlat(px, py): return (px / n * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / n)))))
def sheet_ll(x, y): px, py, _ = sheet_to_z18px @ np.array([x, y, 1.0]); return lonlat(px, py)
# distribution of the points over the sheet (so the report can say they are spread, not clustered)
inv = np.linalg.inv(sheet_to_mos)
sheet_pts = [(float(a), float(b)) for a, b, _ in (inv @ np.array([p[0], p[1], 1.0]) for p in pts_src[inl])]
cols = sorted(set(int((sx - 49) // 457) for sx, sy in sheet_pts)); rows = sorted(set(int((sy - 41) // 356) for sx, sy in sheet_pts))
print('points fall in sheet columns', cols, 'rows', rows, '(5 x 4 cells over the plan)')
rot = math.degrees(math.atan2(sheet_to_z18px[1, 0], sheet_to_z18px[0, 0]))
out = {'status': 'image registration, main plan: the drawing\'s embedded aerial (xref 6) matched to Mapbox satellite z18 @2x by normalised cross-correlation on a grid, affine fit; not a survey',
       'coarse_stage': 'georef_main_z16.json (SIFT + RANSAC)', 'imagery': meta, 'imagery_capture_date': None, 'imagery_native_resolution': 'not stated by the provider; z18 @2x is 0.26 m per screen pixel here',
       'coordinate_conventions': {'sheet': 'PDF user space points, origin top-left of the 2384 x 1684 sheet, y down', 'target': 'global Web Mercator pixels at z18 with 512 px tiles; then EPSG:3857 / WGS84'},
       'model': 'affine, 6 parameters', 'sheet_to_z18px': sheet_to_z18px.tolist(), 'sheet_rotation_to_north_deg': rot,
       'registration_points': {'candidates': int(len(pts_src)), 'inliers': int(inl.sum()), 'used_for_fit': len(fit), 'held_out_checks': len(chk), 'sheet_cells_covered': {'cols': cols, 'rows': rows}},
       'fit_residuals_m': {'rms': float(np.sqrt((r_fit ** 2).mean()) * mpp), 'p95': float(np.percentile(r_fit, 95) * mpp)},
       'independent_check_m': {'rms': float(np.sqrt((r_chk ** 2).mean()) * mpp), 'p95': float(np.percentile(r_chk, 95) * mpp), 'max': float(r_chk.max() * mpp),
                               'method': 'a quarter of the inlier registration points held out of the fit; residual in z18 pixels x 0.264 m per pixel'},
       'points': [{'sheet': s, 'mosaic_src': [float(a), float(b)], 'mosaic_dst': [float(c), float(d)], 'ncc': sc, 'inlier': bool(i)} for s, (a, b), (c, d), sc, i in zip(
           [(float(a), float(b)) for a, b, _ in (inv @ np.array([p[0], p[1], 1.0]) for p in pts_src)], pts_src, pts_dst, scores, inl)],
       'corners_wgs84': {k: sheet_ll(*v) for k, v in {'plan_tl': (49.46, 41.4), 'plan_tr': (2334.08, 41.4), 'plan_bl': (49.46, 1464.24), 'plan_br': (2334.08, 1464.24)}.items()},
       'caveats': ['the registration is between two photographs of different dates; the drawing sits on its own aerial, so the drawing-to-satellite error also carries whatever error the drawing has to its aerial',
                   'the inset (lower right) is not covered by this file; it is registered separately', 'no ground-surveyed control points exist in the supplied material; not suitable for set-out'],
       'review_status': 'unreviewed', 'suitable_for_setout': False}
json.dump(out, open('georef_main.json', 'w'), indent=1)
# proofs: aerial (refined warp) over satellite as a checkerboard, at three places
refined = cv2.warpAffine(aer, (D3 @ aer_to_mos)[:2], (W, H), flags=cv2.INTER_AREA, borderValue=0)
def sheet_to_mos_px(x, y): px, py, _ = sheet_to_mos @ np.array([x, y, 1.0]); return int(px), int(py)
places = {'pit_island': (860, 700), 'beachfront': (1400, 340), 'south_east': (2000, 560)}
for name, (sx, sy) in places.items():
    cx, cy = sheet_to_mos_px(sx, sy); half = 400
    a = refined[cy - half:cy + half, cx - half:cx + half]; b = mos[cy - half:cy + half, cx - half:cx + half]
    if a.size == 0 or b.size == 0: continue
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]; chk_mask = ((yy // 100 + xx // 100) % 2 == 0)
    comp = np.where(chk_mask, a, b); pair = np.hstack([b, a, comp])
    cv2.imwrite(f'proof_{name}.jpg', pair, [cv2.IMWRITE_JPEG_QUALITY, 85])
print('written georef_main.json and proof_*.jpg; sheet rotation to north %.2f deg' % rot)
