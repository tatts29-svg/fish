"""Lift the highlighter strokes off the marked 2019 plate and lay them on the 2026 sheet (D001-26003-03) through the
SIFT/RANSAC homography. v3: printed colour is told from highlighter by the 2026 sheet itself - a plate pixel whose colour
the sheet also carries at the same spot (within 6 px) is the drawing, not the pen - so the thin, pale pen bands can be
kept whole without the printed Armco dashes and barrier lines. The circled numbers are taken off ("Forget the numbers"),
the strokes grouped by colour and nearness into areas, each named from the closures record by where it sits.
Writes overlay_2x.png (2384x1684 RGBA), composite2.png (a check), areas.json."""
import json, os
import cv2, numpy as np
from PIL import Image
S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/closures'
H = np.load(S + '/H_plate_to_sheet.npy'); H2 = np.diag([2.0, 2.0, 1.0]) @ H; Hi = np.linalg.inv(H)
plate = Image.open(S + '/plate.png').convert('RGB'); PW, PH = plate.size
hsv = np.asarray(plate.convert('HSV')).astype(int); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
# the 2026 sheet brought into plate space (so printed colour can be matched spot for spot)
sheet = cv2.imread(S + '/sheet.png'); sheet_p = cv2.warpPerspective(sheet, Hi, (PW, PH), flags=cv2.INTER_LINEAR)
shsv = cv2.cvtColor(sheet_p, cv2.COLOR_BGR2HSV).astype(int); sh, ss, sv = shsv[..., 0] * 255 // 180, shsv[..., 1], shsv[..., 2]
BANDS = {'pink': (218, 250), 'teal': (95, 150), 'orange': (3, 36)}   # pink narrowed clear of the printed purple barrier lines
def band(hh, sat, val, col, smin, vmin):
    lo, hi = BANDS[col]; return (hh >= lo) & (hh <= hi) & (sat >= smin) & (val >= vmin)
masks = {}
for col, smin, vmin in [('pink', 55, 110), ('teal', 35, 80), ('orange', 55, 140)]:
    pen = band(h, s, v, col, smin, vmin)
    printed = band(sh, ss, sv, col, 45, 60).astype(np.uint8) * 255
    printed = cv2.dilate(printed, np.ones((13, 13), np.uint8)) > 0
    masks[col] = pen if col == 'pink' else (pen & ~printed)   # the pen's pink follows the sheet's purple barrier lines, so pink is told by hue alone
RGB = {'pink': (232, 87, 155), 'teal': (40, 179, 168), 'orange': (240, 124, 34)}
def name_for(col, cx, cy):
    if col == 'pink': return ('3', 'north-east — Gate 6 / Pacific Plaza, Surfers Paradise') if cx > 1200 else ('5', 'west — Gate 8 / Aloha Lane')
    if col == 'teal': return ('2', 'Main Beach Pde at Mustang / Beachcrest') if cx > 1000 else ('4', 'Main Beach — Ocean Towers / Cable Beach')
    if cx > 800: return ('1', 'Main Beach Pde at Madison Point / Narrowneck Court')
    return ('6', 'Main Beach — Norfolk / Silverpoint') if cy < 560 else ('7', 'south-west — Main Beach Tower / Axis, toward Gate 10')
k3 = np.ones((3, 3), np.uint8)
def plate_pt(sx, sy):
    p = Hi @ np.array([sx, sy, 1.0]); return p[0] / p[2], p[1] / p[2]
keep = np.zeros((PH, PW), np.uint8)
cv2.fillPoly(keep, [np.array([plate_pt(20, 20), plate_pt(1180, 20), plate_pt(1180, 355), plate_pt(615, 355), plate_pt(615, 618), plate_pt(20, 618)], np.int32)], 255)
cv2.fillPoly(keep, [np.array([plate_pt(20, 20), plate_pt(150, 20), plate_pt(150, 195), plate_pt(20, 195)], np.int32)], 0)   # the Main Beach SLSC corner: beach, no closure; the printed gate marks there are orange
overlay = np.zeros((1684, 2384, 4), np.uint8); areas = []; rings_found = {}
prepared = {}
for col, m in masks.items():
    mm = m.astype(np.uint8) * 255
    mm = cv2.bitwise_and(mm, keep)
    mm = cv2.morphologyEx(mm, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    mm = cv2.morphologyEx(mm, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    prepared[col] = mm
all_rings = []
for col, mm in prepared.items():
    # the circled numbers: rings (a hole 10-50 px across) on a well-closed copy, and compact blobs 22-90 px across
    closed = cv2.morphologyEx(mm, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
    cs, hier = cv2.findContours(closed, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    rings = []
    if hier is not None:
        hier = hier[0]
        for i, c in enumerate(cs):
            if hier[i][3] != -1: continue
            child = hier[i][2]
            while child != -1:
                x, y, w, hh = cv2.boundingRect(cs[child])
                if 10 <= w <= 50 and 10 <= hh <= 50 and 0.5 <= w / float(hh) <= 2.0: rings.append((x + w / 2.0, y + hh / 2.0, max(w, hh) + 20))
                child = hier[child][0]
    n0, lab0, st0, ce0 = cv2.connectedComponentsWithStats(mm, 8)
    for i in range(1, n0):
        x, y, w, hh, area = st0[i]
        if 22 <= w <= 90 and 22 <= hh <= 90 and 0.55 <= w / float(hh) <= 1.8 and area < 1600: rings.append((float(ce0[i][0]), float(ce0[i][1]), max(w, hh)))
    rings_found[col] = len(rings); all_rings += rings
for col in prepared:
    mm = prepared[col]
    for (cx, cy, d) in all_rings: cv2.circle(mm, (int(cx), int(cy)), int(d / 2 + 16), 0, -1)   # a circled number is erased from every colour: its edge photographs in more than one
    n, lab, stats, cents = cv2.connectedComponentsWithStats(mm, 8)
    strokes = np.zeros_like(mm)
    comps = [(i,) + tuple(stats[i]) for i in range(1, n) if stats[i][4] >= 70]
    for (i, x, y, w, hh, area) in comps:
        if area > 1500 and area / float(w * hh) > 0.45: continue   # a solid printed fill, not a pen line
        if area < 900:   # a small piece on its own (no other piece of this colour within 80 px) is a printed mark, not the pen
            near = any(j != i and abs(cents[i][0] - cents[j][0]) < 80 + (w + w2) / 2 and abs(cents[i][1] - cents[j][1]) < 80 + (hh + h2) / 2 for (j, x2, y2, w2, h2, a2) in comps)
            if not near: continue
        strokes[lab == i] = 255
    wm = cv2.warpPerspective(strokes, H2, (2384, 1684), flags=cv2.INTER_LINEAR)
    wm = (wm > 100).astype(np.uint8) * 255
    wm = cv2.morphologyEx(wm, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    grp = cv2.dilate(wm, np.ones((81, 81), np.uint8))
    ng, glab, gst, gce = cv2.connectedComponentsWithStats(grp, 8)
    for g in range(1, ng):
        px = (glab == g) & (wm > 0)
        area = int(px.sum())
        if area < 350: continue
        ys, xs = np.nonzero(px); cx, cy = float(xs.mean()), float(ys.mean())
        num, where = name_for(col, cx, cy)
        areas.append({'colour': col, 'mark': num, 'where': where, 'bbox': [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)], 'centroid': [round(cx, 1), round(cy, 1)], 'area_px': area})
        r, gg, b = RGB[col]
        overlay[px] = [r, gg, b, 150]
        edge = cv2.morphologyEx(px.astype(np.uint8) * 255, cv2.MORPH_GRADIENT, k3) > 0
        overlay[edge] = [max(r - 60, 0), max(gg - 60, 0), max(b - 60, 0), 230]
Image.fromarray(overlay, 'RGBA').save(S + '/overlay_2x.png', optimize=True)
sheet2 = Image.open(S + '/sheet.png').convert('RGBA').resize((2384, 1684), Image.LANCZOS)
Image.alpha_composite(sheet2, Image.fromarray(overlay, 'RGBA')).convert('RGB').save(S + '/composite2.png')
json.dump({'sheet_px': [2384, 1684], 'note': 'areas lifted off the marked 2019 plate onto the 2026 sheet D001-26003-03 by homography (SIFT/RANSAC, 122 inliers, median 1.1 px); printed colour told from the pen by the sheet itself; coordinates in 2x sheet pixels (1 px = 0.5 sheet pt)', 'areas': areas}, open(S + '/areas.json', 'w'), indent=1)
print('rings erased:', rings_found, '| areas:', len(areas))
for a in areas: print(' ', a['colour'], a['mark'], a['where'], a['bbox'], a['area_px'])
print('overlay bytes', os.path.getsize(S + '/overlay_2x.png'))
