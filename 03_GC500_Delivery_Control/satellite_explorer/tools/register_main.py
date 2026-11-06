#!/usr/bin/env python3
"""Registration of the D001 main plan against Mapbox satellite, by matching the drawing's OWN embedded aerial
(PDF image xref 6, 4760 x 2965, placed at sheet points (49.46, 41.4)-(2334.08, 1464.24)) to a z16 @2x satellite mosaic.
The result is a similarity/affine transform from SHEET points (PDF user space, y down) to Web Mercator tile pixels at
z16 (and so to EPSG:3857 metres and WGS84). Everything is measured, nothing typed: inliers, fit residuals and a held-out
check set are reported in ground metres, and the file says it is image registration, not survey.
  python3 register_main.py  ->  georef_main_z16.json, match_main.png
"""
import cv2, numpy as np, json, math, random

Z = 16; TILE = 512
mos_meta = json.load(open(f'mosaic_z{Z}.json'))
mos = cv2.imread(f'mosaic_z{Z}.jpg', cv2.IMREAD_GRAYSCALE)
aer = cv2.imread('emb/x6_eq.png', cv2.IMREAD_GRAYSCALE)        # the sheet's aerial, contrast-restored
# the sheet's aerial: image px per sheet point, from the PDF placement (an axis-aligned scale, no rotation)
PL = {'x0': 49.46, 'y0': 41.4, 'w': 2284.62, 'h': 1422.84, 'pw': 4760, 'ph': 2965}
SX, SY = PL['pw'] / PL['w'], PL['ph'] / PL['h']              # ~2.083 px/pt both ways
# ground resolution: sheet is 1:2000 so 1 pt = 0.7056 m  ->  the aerial is ~0.339 m/px; z16 @2x at this latitude:
lat_c = -27.985
m_per_px_z16 = 156543.03392 * math.cos(math.radians(lat_c)) / (2 ** Z) / 2
m_per_px_aer = 2000 * 0.352778 / 1000 / SX
scale = m_per_px_aer / m_per_px_z16                            # aerial px -> mosaic px (approx, refined by the fit)
print('m/px aerial %.3f  mosaic %.3f  prescale %.3f' % (m_per_px_aer, m_per_px_z16, scale))
small = cv2.resize(aer, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
mosq = clahe.apply(mos)

sift = cv2.SIFT_create(nfeatures=40000, contrastThreshold=0.02)
k1, d1 = sift.detectAndCompute(small, None)
k2, d2 = sift.detectAndCompute(mosq, None)
print('features aerial', len(k1), 'mosaic', len(k2))
flann = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=64))
raw = flann.knnMatch(d1, d2, k=2)
good = [m for m, n in raw if m.distance < 0.75 * n.distance]
print('ratio-test matches', len(good))
p1 = np.float32([k1[m.queryIdx].pt for m in good]); p2 = np.float32([k2[m.trainIdx].pt for m in good])
M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=4.0, maxIters=20000, confidence=0.999)
inl = inl.ravel().astype(bool)
print('similarity inliers', int(inl.sum()), 'of', len(good))
# refine on inliers with a full affine, then hold out a quarter as independent checks
idx = np.where(inl)[0]; random.seed(7); random.shuffle(list(idx))
idx = list(idx); random.shuffle(idx); cut = len(idx) * 3 // 4
fit, chk = idx[:cut], idx[cut:]
A, _ = cv2.estimateAffine2D(p1[fit], p2[fit], method=cv2.LMEDS)
def apply(Mx, pts): return (np.hstack([pts, np.ones((len(pts), 1), np.float32)]) @ Mx.T)
r_fit = np.linalg.norm(apply(A, p1[fit]) - p2[fit], axis=1); r_chk = np.linalg.norm(apply(A, p1[chk]) - p2[chk], axis=1)
print('fit residual px  rms %.2f  p95 %.2f  (n=%d)' % (np.sqrt((r_fit ** 2).mean()), np.percentile(r_fit, 95), len(fit)))
print('check residual px rms %.2f  p95 %.2f  (n=%d)' % (np.sqrt((r_chk ** 2).mean()), np.percentile(r_chk, 95), len(chk)))
print('check residual m  rms %.2f  p95 %.2f' % (np.sqrt((r_chk ** 2).mean()) * m_per_px_z16, np.percentile(r_chk, 95) * m_per_px_z16))
# compose: sheet pt -> aerial px -> small px -> mosaic px -> global z16 tile px
S1 = np.array([[SX, 0, -PL['x0'] * SX], [0, SY, -PL['y0'] * SY], [0, 0, 1]])
S2 = np.array([[scale, 0, 0], [0, scale, 0], [0, 0, 1]])
A3 = np.vstack([A, [0, 0, 1]])
T = np.array([[1, 0, mos_meta['x0'] * TILE], [0, 1, mos_meta['y0'] * TILE], [0, 0, 1]])
sheet_to_z16px = T @ A3 @ S2 @ S1
# and z16 px -> EPSG:3857 metres / WGS84
n = 2 ** Z * TILE; R = 6378137.0
def px_to_lonlat(px, py):
    lon = px / n * 360 - 180; lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / n)))); return lon, lat
def sheet_to_lonlat(x, y):
    px, py, _ = sheet_to_z16px @ np.array([x, y, 1.0]); return px_to_lonlat(px, py)
corners = {k: sheet_to_lonlat(*v) for k, v in {'plan_tl': (49.46, 41.4), 'plan_tr': (2334.08, 41.4), 'plan_bl': (49.46, 1464.24), 'plan_br': (2334.08, 1464.24)}.items()}
print('corners', json.dumps(corners))
# rotation and scale of the fitted affine, as a sanity statement
a, b = A[0, 0], A[0, 1]; rot = math.degrees(math.atan2(A[1, 0], A[0, 0])); sc = math.hypot(a, b)
print('fitted rotation %.3f deg, scale %.4f (expected ~%.4f)' % (rot, sc, 1.0))
out = {'status': 'image registration by feature matching (SIFT + RANSAC) between the drawing\'s embedded aerial and Mapbox satellite z16 @2x; not a survey',
       'sources': {'pdf_sha256': '37792f0a9d32e829f34d28ab41197fd2cf689fb62cd60a755aa89106cb5a0a2f', 'aerial_xref': 6, 'placement_sheet_pts': PL,
                   'imagery': mos_meta, 'imagery_capture_date': None, 'imagery_native_resolution': None},
       'coordinate_conventions': {'sheet': 'PDF user space points, origin top-left of the 2384 x 1684 sheet, y down (the viewer\'s drawing space)',
                                  'target': 'Web Mercator tile pixels at z16 with 512 px tiles (global), then EPSG:3857 / WGS84'},
       'model': 'affine (6 parameter), LMEDS on RANSAC inliers of a similarity fit', 'sheet_to_z16px': sheet_to_z16px.tolist(),
       'fit': {'matches': len(good), 'inliers': int(inl.sum()), 'n_fit': len(fit), 'rms_px': float(np.sqrt((r_fit ** 2).mean())), 'p95_px': float(np.percentile(r_fit, 95))},
       'independent_check': {'n': len(chk), 'rms_m': float(np.sqrt((r_chk ** 2).mean()) * m_per_px_z16), 'p95_m': float(np.percentile(r_chk, 95) * m_per_px_z16),
                             'method': 'a quarter of the inlier matches held out of the affine fit; residual in z16 pixels x ground metres per pixel at lat -27.985'},
       'rotation_deg': rot, 'scale_check': sc, 'corners_wgs84': corners, 'review_status': 'unreviewed', 'suitable_for_setout': False}
json.dump(out, open(f'georef_main_z{Z}.json', 'w'), indent=1)
# a picture of the inlier matches for the eye
vis = cv2.drawMatches(small, k1, cv2.resize(mosq, None, fx=1, fy=1), k2, [g for g, ok in zip(good, inl) if ok][:300], None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
cv2.imwrite('match_main.jpg', cv2.resize(vis, None, fx=0.35, fy=0.35), [cv2.IMWRITE_JPEG_QUALITY, 80])
print('written georef_main_z%d.json, match_main.jpg' % Z)
