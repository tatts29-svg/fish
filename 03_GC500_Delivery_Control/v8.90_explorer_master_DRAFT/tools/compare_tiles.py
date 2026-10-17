#!/usr/bin/env python3
# Author: Andrew Fisher. Compares a freshly rendered tile level (PNG files) with the live pyramid (packed level files),
# pixel for pixel. Prints identical / differing / missing counts per level and the sheet rectangle the differences
# fall in; optionally writes a difference map per level.
#   python3 compare_tiles.py <live manifest.json> <dir with live L*.bin> <rendered dir> [levels] [diffmap dir]
import sys, os, io, json, math
import numpy as np
from PIL import Image
man = json.load(open(sys.argv[1])); BIN = sys.argv[2]; REND = sys.argv[3]
levels = [float(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 and sys.argv[4] else [l['L'] for l in man['levels'] if l['file'] != 'Llow.bin']
DIFF = sys.argv[5] if len(sys.argv) > 5 else None
out = {}
for L in levels:
    lv = next(l for l in man['levels'] if abs(l['L'] - L) < 1e-9); data = open(os.path.join(BIN, lv['file']), 'rb').read()
    s = lv['scale']; span = 512 / s; nx, ny = lv['nx'], lv['ny']
    Ln = ('L%g' % L) if L != int(L) else 'L%d' % L
    rdir = os.path.join(REND, Ln)
    same = diff = only_live = only_new = 0; boxes = []; maxd = 0; changed_px = 0; shifts = []; strong_share = []; changed_tiles = []
    dm = np.zeros((ny, nx), np.uint8)
    for ty in range(ny):
        for tx in range(nx):
            k = '%d_%d' % (tx, ty); live = lv['tiles'].get(k); fp = os.path.join(rdir, k + '.png'); new = os.path.exists(fp)
            if live and not new: only_live += 1; dm[ty, tx] = 2; continue
            if new and not live: only_new += 1; dm[ty, tx] = 3; continue
            if not live and not new: continue
            a = np.asarray(Image.open(io.BytesIO(data[live[0]:live[0] + live[1]])).convert('RGBA'), np.float32)
            b = np.asarray(Image.open(fp).convert('RGBA'), np.float32)
            # premultiplied: the colour of a fully transparent pixel is not a difference anyone can see
            pa = np.dstack([a[:, :, :3] * a[:, :, 3:4] / 255, a[:, :, 3:4]]); pb = np.dstack([b[:, :, :3] * b[:, :, 3:4] / 255, b[:, :, 3:4]])
            d = np.rint(np.abs(pa - pb)).max(axis=2).astype(np.int16)
            if d.max() == 0: same += 1; continue
            diff += 1; dm[ty, tx] = 1; maxd = max(maxd, int(d.max())); changed_px += int((d > 0).sum())
            # how far the drawing sits from where it was: sub-pixel phase correlation of the two alpha channels; and how
            # much of the tile changed strongly (new or gone content, not a plot-grid jitter of 0.06 pt)
            A, B = pa[:, :, 3], pb[:, :, 3]
            if A.std() > 0 and B.std() > 0:
                F = np.fft.fft2(A - A.mean()) * np.conj(np.fft.fft2(B - B.mean())); F /= np.abs(F) + 1e-9; r = np.fft.ifft2(F).real; y, x = np.unravel_index(np.argmax(r), r.shape)
                def sub(v0, v1, v2): dd = v0 - 2 * v1 + v2; return 0.0 if dd == 0 else 0.5 * (v0 - v2) / dd
                sx = (x if x < 256 else x - 512) + sub(r[y, x - 1], r[y, x], r[y, (x + 1) % 512]); sy = (y if y < 256 else y - 512) + sub(r[y - 1, x], r[y, x], r[(y + 1) % 512, x])
                shifts.append((sx / s, sy / s))   # in sheet pt
            strong = float((d > 64).mean()); strong_share.append(strong)
            if strong > 0.01: dm[ty, tx] = 4; changed_tiles.append([k, round(strong, 4)])
            ys, xs = np.nonzero(d); boxes.append([tx * span + xs.min() / s, ty * span + ys.min() / s, tx * span + (xs.max() + 1) / s, ty * span + (ys.max() + 1) / s])
    rect = [round(min(b[0] for b in boxes), 1), round(min(b[1] for b in boxes), 1), round(max(b[2] for b in boxes), 1), round(max(b[3] for b in boxes), 1)] if boxes else None
    sh = np.array(shifts) if shifts else np.zeros((0, 2)); ab = np.hypot(sh[:, 0], sh[:, 1]) if len(sh) else np.zeros(0)
    stats = {'tiles_measured': int(len(sh)), 'median_shift_pt': [round(float(np.median(sh[:, 0])), 3), round(float(np.median(sh[:, 1])), 3)] if len(sh) else None,
             'p95_shift_pt': round(float(np.percentile(ab, 95)), 3) if len(ab) else None, 'max_shift_pt': round(float(ab.max()), 3) if len(ab) else None,
             'tiles_with_over_1pct_strong_change': len(changed_tiles), 'median_strong_share': round(float(np.median(strong_share)), 5) if strong_share else None}
    out[str(L)] = {'identical': same, 'different': diff, 'only_live': only_live, 'only_new': only_new, 'max_abs_diff': maxd, 'changed_pixels': changed_px, 'alignment': stats, 'changed_tiles': changed_tiles, 'difference_boxes_pt': [[round(v, 1) for v in b] for b in boxes]}
    print('L%-6g identical %4d  different %4d  only-live %3d  only-new %3d  changed px %8d | drawing offset median %s pt, p95 %s pt, max %s pt | tiles with >1%% strong change %d' % (L, same, diff, only_live, only_new, changed_px, stats['median_shift_pt'], stats['p95_shift_pt'], stats['max_shift_pt'], len(changed_tiles)), flush=True)
    if DIFF:
        os.makedirs(DIFF, exist_ok=True)
        pal = {0: (235, 235, 235, 255), 1: (255, 214, 160, 255), 2: (60, 120, 255, 255), 3: (60, 200, 90, 255), 4: (220, 40, 30, 255)}   # pale: jitter only; red: content changed
        im = Image.new('RGBA', (nx * 8, ny * 8)); px = im.load()
        for ty in range(ny):
            for tx in range(nx):
                for yy in range(8):
                    for xx in range(8): px[tx * 8 + xx, ty * 8 + yy] = pal[int(dm[ty, tx])]
        im.save(os.path.join(DIFF, 'diffmap_%s.png' % Ln))
json.dump(out, open(os.path.join(REND, 'compare_with_live.json'), 'w'), indent=1)
