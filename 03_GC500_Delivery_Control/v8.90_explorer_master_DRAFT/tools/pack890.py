#!/usr/bin/env python3
# Author: Andrew Fisher. v8.90: packs the rendered tile pyramid for the Map explorer the way the live one is packed
# (lossless WebP tiles, one file per level read by HTTP Range), adds the low levels L -1 .. -3 downsampled from L0 as
# v7.14 did, writes the manifest with the boot block, and makes the sheet overview and preview pictures.
#   python3 pack890.py <rendered tiles dir (L*/x_y.png + levels.json)> <assets dir (with drawing-scene.bin, vt/boot.json, underlay/)> [token]
# Level files are named L<level>-<token>.bin so a browser that still holds last hour's files can never mix the two issues.
import sys, os, io, json, math, hashlib
import numpy as np
from PIL import Image
REND, A = sys.argv[1], sys.argv[2]
TOKEN = sys.argv[3] if len(sys.argv) > 3 else hashlib.sha256(open(os.path.join(A, 'drawing-scene.bin'), 'rb').read()).hexdigest()[:12]   # the scene's own hash
VT, SW, SH = 512, 2384, 1684
levels_in = json.load(open(os.path.join(REND, 'levels.json')))
boot = json.load(open(os.path.join(A, 'vt', 'boot.json')))
vt = os.path.join(A, 'vt'); os.makedirs(vt, exist_ok=True)
for f in os.listdir(vt):
    if f.endswith('.bin'): os.remove(os.path.join(vt, f))
levels = []
def webp_lossless(im):
    b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, quality=100, method=4, exact=False); return b.getvalue()
total = 0
for lv in levels_in:
    L = lv['L']; Ln = ('L%g' % L); d = os.path.join(REND, Ln); names = sorted(n for n in os.listdir(d) if n.endswith('.png'))
    blob = bytearray(); idx = {}
    for n in names:
        im = Image.open(os.path.join(d, n)).convert('RGBA'); assert im.size == (VT, VT)
        b = webp_lossless(im); idx[n[:-4]] = [len(blob), len(b)]; blob += b
    fname = '%s-%s.bin' % (Ln, TOKEN); open(os.path.join(vt, fname), 'wb').write(blob); total += len(blob)
    levels.append({'L': L, 'scale': lv['scale'], 'nx': lv['nx'], 'ny': lv['ny'], 'written': len(idx), 'empty': lv['nx'] * lv['ny'] - len(idx), 'ms': lv['ms'], 'file': fname, 'bytes': len(blob), 'tiles': idx})
    print('%-7s %4d tiles %9d bytes' % (Ln, len(idx), len(blob)), flush=True)
# ---- the low levels, L -1.00 .. -3.00, from L0 by area-correct downsampling in premultiplied alpha (as v7.14's build_assets.py)
L0 = next(l for l in levels if l['L'] == 0); data = open(os.path.join(vt, L0['file']), 'rb').read()
sheet = Image.new('RGBA', (L0['nx'] * VT, L0['ny'] * VT), (0, 0, 0, 0))
for k, (o, n) in L0['tiles'].items():
    tx, ty = map(int, k.split('_')); sheet.paste(Image.open(io.BytesIO(data[o:o + n])).convert('RGBA'), (tx * VT, ty * VT))
sheet_p = sheet.convert('RGBa'); low = bytearray(); lowname = 'Llow-%s.bin' % TOKEN
for q in range(4, 13):
    L = -q / 4; s = 2 ** L; W, H = math.ceil(SW * s), math.ceil(SH * s)
    im = sheet_p.resize((W, H), Image.Resampling.LANCZOS, box=(0, 0, W / s, H / s)).convert('RGBA')
    nx, ny = math.ceil(W / VT), math.ceil(H / VT); tiles = {}; empty = 0
    for ty in range(ny):
        for tx in range(nx):
            t = Image.new('RGBA', (VT, VT), (0, 0, 0, 0)); t.paste(im.crop((tx * VT, ty * VT, min(W, (tx + 1) * VT), min(H, (ty + 1) * VT))), (0, 0))
            if t.getchannel('A').getbbox() is None: empty += 1; continue
            b = webp_lossless(t); tiles['%d_%d' % (tx, ty)] = [len(low), len(b)]; low += b
    levels.append({'L': L, 'scale': s, 'nx': nx, 'ny': ny, 'written': len(tiles), 'empty': empty, 'file': lowname, 'from': 'L0 downsampled (Lanczos, premultiplied)', 'tiles': tiles})
open(os.path.join(vt, lowname), 'wb').write(low); total += len(low); print('low levels', len(low), 'bytes')
man = {'tile': VT, 'sheet': [SW, SH], 'note': "transparent raster of the drawing's vectors, raster symbols and lettering; device px per sheet pt = 2^L; D001-26003-03 issued 2 Oct 2026, placed in the 17 Sep frame (see boot.meta)",
       'packed': True, 'levels': sorted(levels, key=lambda l: l['L']), 'boot': boot}
json.dump(man, open(os.path.join(vt, 'manifest.json'), 'w'), separators=(',', ':'))
print('manifest', os.path.getsize(os.path.join(vt, 'manifest.json')), 'bytes; pyramid', total, 'bytes in', len(set(l['file'] for l in levels)), 'files')
# ---- the sheet preview (Original plan: white sheet, the aerial underlay, the drawing) at the live preview's size, and the overview
PW, PH = 3815, 2695
L1 = next(l for l in levels if l['L'] == 1); d1 = open(os.path.join(vt, L1['file']), 'rb').read()
draw = Image.new('RGBA', (L1['nx'] * VT, L1['ny'] * VT), (0, 0, 0, 0))
for k, (o, n) in L1['tiles'].items():
    tx, ty = map(int, k.split('_')); draw.paste(Image.open(io.BytesIO(d1[o:o + n])).convert('RGBA'), (tx * VT, ty * VT))
draw = draw.crop((0, 0, SW * 2, SH * 2))
sheet_px = Image.new('RGBA', draw.size, (255, 255, 255, 255))
under = json.load(open(os.path.join(A, 'underlay', 'manifest.json')))
for u in under['items']:   # in record order, as the explorer draws them
    im = Image.open(os.path.join(A, u['file'])).convert('RGBA'); x0, y0, x1, y1 = [v * 2 for v in u['bbox']]
    w, h = max(1, round(x1 - x0)), max(1, round(y1 - y0)); im = im.resize((w, h), Image.Resampling.LANCZOS)
    sheet_px.alpha_composite(im, (round(x0), round(y0)))
sheet_px.alpha_composite(draw)
prev = sheet_px.convert('RGB').resize((PW, PH), Image.Resampling.LANCZOS)
prev.save(os.path.join(A, 'original-preview.webp'), 'WEBP', quality=80, method=6)
prev.resize((1192, 842), Image.Resampling.LANCZOS).save(os.path.join(A, 'sheet-overview.webp'), 'WEBP', quality=86, method=6)
print('original-preview.webp', os.path.getsize(os.path.join(A, 'original-preview.webp')), 'sheet-overview.webp', os.path.getsize(os.path.join(A, 'sheet-overview.webp')))
