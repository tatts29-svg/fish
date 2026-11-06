#!/usr/bin/env python3
"""stage5 - the new pre-rendered assets for the explorer (all derived from files already on the live service; GET only).

1. Drawing pyramid levels L -1 to -3 (quarter octaves). The live pyramid starts at L -0.75, so every overview (the first
   view on a desktop is L -1.1, on a phone L -1.6, zoomed right out L -2.6) fell through to rasterising SVG of the whole
   254,316-record drawing from the 13.3 MB scene. These are made from the live L0 level (the sheet at 1 px per point) by
   area-correct downsampling in premultiplied alpha - a 2x to 8x supersample of the same raster - cut into the same
   512 px tiles, lossless WebP, packed into one file (assets/vt/Llow.bin) read by HTTP Range like the others.
2. assets/vt/manifest.json: the live manifest plus those levels, plus a small "boot" block (the drawing's metadata,
   record count and the aerial-underlay record ids) so the page can open without the 13.3 MB scene.
3. assets/sheet-overview.webp: the whole sheet at 1192 x 842 (half a pixel per point), lossy WebP, from the live
   original-preview.webp: the minimap picture, and the stand-in under Original plan while its tiles arrive. It replaces
   the 2.4 MB preview on the page's critical path.
   python3 build_assets.py <live assets dir> <out assets dir>"""
import gzip, io, json, math, os, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, 'vt'), exist_ok=True)
man = json.load(open(os.path.join(src, 'vt/manifest.json')))
TILE, SW, SH = man['tile'], man['sheet'][0], man['sheet'][1]

# ---- the L0 sheet, stitched from its tiles
L0 = next(l for l in man['levels'] if l['L'] == 0)
data = open(os.path.join(src, 'vt', L0['file']), 'rb').read()
sheet = Image.new('RGBA', (L0['nx'] * TILE, L0['ny'] * TILE), (0, 0, 0, 0))
for k, (o, n) in L0['tiles'].items():
    tx, ty = map(int, k.split('_'))
    sheet.paste(Image.open(io.BytesIO(data[o:o + n])).convert('RGBA'), (tx * TILE, ty * TILE))
sheet_p = sheet.convert('RGBa')   # premultiplied: no dark fringes where lines meet transparency

levels, blob = [], bytearray()
for q in range(4, 13):            # L -1.00 ... -3.00
    L = -q / 4
    s = 2 ** L
    W, H = math.ceil(SW * s), math.ceil(SH * s)
    # output pixel i covers sheet points [i/s, (i+1)/s]; L0 pixel j covers [j, j+1]
    im = sheet_p.resize((W, H), Image.Resampling.LANCZOS, box=(0, 0, W / s, H / s)).convert('RGBA')
    nx, ny = math.ceil(W / TILE), math.ceil(H / TILE)
    tiles, empty = {}, 0
    for ty in range(ny):
        for tx in range(nx):
            t = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
            t.paste(im.crop((tx * TILE, ty * TILE, min(W, (tx + 1) * TILE), min(H, (ty + 1) * TILE))), (0, 0))
            if t.getchannel('A').getbbox() is None:
                empty += 1; continue
            b = io.BytesIO(); t.save(b, 'WEBP', lossless=True, quality=100, method=6, exact=False)
            tiles['%d_%d' % (tx, ty)] = [len(blob), b.tell()]; blob += b.getvalue()
    levels.append({'L': L, 'scale': s, 'nx': nx, 'ny': ny, 'written': len(tiles), 'empty': empty, 'file': 'Llow.bin', 'from': 'L0 downsampled (Lanczos, premultiplied)', 'tiles': tiles})
    print('L %5.2f  %dx%d px  %d tiles  %d empty' % (L, W, H, len(tiles), empty))
open(os.path.join(out, 'vt/Llow.bin'), 'wb').write(blob)
print('Llow.bin', len(blob), 'bytes')

# ---- boot block, from the scene and the classification
P = json.loads(gzip.decompress(open(os.path.join(src, 'drawing-scene.bin'), 'rb').read()))
cls = json.load(open(os.path.join(src, 'classification.json')))
assert cls['source_pdf_sha256'] == P['meta']['sha256']
under = sorted(r['id'] for r in cls['image_records'] if r['category'] == 'aerial_underlay')
man2 = dict(man)
man2['levels'] = sorted(levels + man['levels'], key=lambda l: l['L'])
man2['boot'] = {'note': 'lets the explorer open without the 13.3 MB scene; regenerate with build_assets.py whenever drawing-scene.bin changes',
                'meta': P['meta'], 'count': len(P['r']), 'images': len(cls['image_records']), 'underlay': under}
json.dump(man2, open(os.path.join(out, 'vt/manifest.json'), 'w'), separators=(',', ':'))
print('manifest', os.path.getsize(os.path.join(out, 'vt/manifest.json')), 'bytes; underlay ids', len(under))

# ---- the sheet overview picture
pv = Image.open(os.path.join(src, 'original-preview.webp')).convert('RGB')
ov = pv.resize((1192, 842), Image.Resampling.LANCZOS)
ov.save(os.path.join(out, 'sheet-overview.webp'), 'WEBP', quality=86, method=6)
print('sheet-overview.webp', os.path.getsize(os.path.join(out, 'sheet-overview.webp')), 'bytes')
