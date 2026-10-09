#!/usr/bin/env python3
# Author: Andrew Fisher. Pixel differences between two renders of the same views (old issue vs new issue, or live scene vs
# reproduced scene), premultiplied, per view: differing pixels, max difference, and a side-by-side picture.
#   python3 compare_views.py <views dir A> <views dir B> <out dir> <label A> <label B>
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw
A, B, OUT, LA, LB = sys.argv[1:6]; os.makedirs(OUT, exist_ok=True); rows = {}
for n in sorted(os.listdir(A)):
    if not n.endswith('.png') or not os.path.exists(os.path.join(B, n)): continue
    a = np.asarray(Image.open(os.path.join(A, n)).convert('RGBA'), np.float32); b = np.asarray(Image.open(os.path.join(B, n)).convert('RGBA'), np.float32)
    if a.shape != b.shape: rows[n] = {'shape_mismatch': [a.shape, b.shape]}; continue
    pa = np.dstack([a[:, :, :3] * a[:, :, 3:4] / 255, a[:, :, 3:4]]); pb = np.dstack([b[:, :, :3] * b[:, :, 3:4] / 255, b[:, :, 3:4]])
    d = np.rint(np.abs(pa - pb)).max(axis=2); nz = d > 0
    rows[n[:-4]] = {'pixels': int(a.shape[0] * a.shape[1]), 'differing': int(nz.sum()), 'share': round(float(nz.mean()), 5), 'max_abs': int(d.max())}
    side = Image.new('RGB', (a.shape[1] * 2 + 12, a.shape[0] + 26), (30, 30, 30)); draw = ImageDraw.Draw(side)
    side.paste(Image.open(os.path.join(A, n)).convert('RGB'), (0, 26)); side.paste(Image.open(os.path.join(B, n)).convert('RGB'), (a.shape[1] + 12, 26))
    draw.text((6, 6), LA, fill=(255, 200, 120)); draw.text((a.shape[1] + 18, 6), LB + '   differing pixels: %d (%.2f%%)' % (int(nz.sum()), 100 * nz.mean()), fill=(120, 220, 255))
    side.save(os.path.join(OUT, n[:-4] + '_side_by_side.png'))
json.dump(rows, open(os.path.join(OUT, 'compare_views.json'), 'w'), indent=1)
for k, v in rows.items(): print('%-28s %s' % (k, v))
