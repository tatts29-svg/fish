#!/usr/bin/env python3
"""Author: Andrew Fisher. Gate 6 compound, 15 Oct 2026: the two "Master plan" pictures for each moved reference.

The live page shows two pictures on a reference's card and day print: a close crop of the master
(771 x 491 px, about 5.7 px per sheet point) and a wide one (937 x 613 px, about 0.95 px per point),
each with a red ring on the reference. The master D001-26003-03 still draws the old compound, so the
new pictures are the master's own vectors (the explorer's tiles) over its aerial, with the new Gate 6
layout drawn in Coates orange and a caption saying where the layout came from.

Run:  python3 make_crops_1020.py gate6_positions_1020.json <tiles dir with L3 x_y.bin and L0 x_y.bin> <sheet-overview.png>
Writes media/<ref>_close_1020.webp and media/<ref>_wide_1020.webp plus media/index.json (sha256 of each file).
"""
import hashlib, json, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SHEET = (2384, 1684)
CLOSE = (771, 491, 5.7)     # width px, height px, px per pt
WIDE = (937, 613, 0.95)
OR = (242, 98, 34); RED = (220, 30, 30)
CAPTION = 'Orange: Gate 6 compound as John Brett (iEDM) drew it, email 14 Oct 2026 · faded: the layout the master D001-26003-03 still shows'
OLD_COMPOUND = [(2087.0, 249.5), (2147.5, 243.0), (2148.0, 258.5), (2087.0, 259.0)]   # the compound fence the master draws (sheet pt)


def tiles_image(tdir, level, S, x0, y0, x1, y1):
    """Stitch explorer tiles (S px per pt, 512 px tiles) covering sheet pts [x0,x1] x [y0,y1]."""
    T = 512; span = T / S
    tx0, tx1 = int(x0 // span), int(x1 // span); ty0, ty1 = int(y0 // span), int(y1 // span)
    im = Image.new('RGBA', (int((tx1 - tx0 + 1) * T), int((ty1 - ty0 + 1) * T)), (0, 0, 0, 0))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            p = os.path.join(tdir, '%s_%d_%d.bin' % (level, tx, ty)) if level else os.path.join(tdir, '%d_%d.bin' % (tx, ty))
            if os.path.exists(p): im.alpha_composite(Image.open(p).convert('RGBA'), ((tx - tx0) * T, (ty - ty0) * T))
    return im, tx0 * span, ty0 * span


def render(out, overview, tdir, level, S, cx, cy, w, h, scale, ref, ring_r, line_w):
    """A picture w x h px centred on sheet pt (cx, cy) at `scale` px/pt."""
    pw, ph = w / scale, h / scale
    x0, y0, x1, y1 = cx - pw / 2, cy - ph / 2, cx + pw / 2, cy + ph / 2
    # aerial underlay from the overview (0.5 px/pt), faint like the live crops
    ov = overview.crop((int(x0 * 0.5), int(y0 * 0.5), int(x1 * 0.5) + 1, int(y1 * 0.5) + 1)).resize((w, h), Image.BICUBIC)
    base = Image.blend(Image.new('RGB', (w, h), (255, 255, 255)), ov, 0.45).convert('RGBA')
    vec, ox, oy = tiles_image(tdir, level, S, x0, y0, x1, y1)
    vec = vec.crop((int((x0 - ox) * S), int((y0 - oy) * S), int((x1 - ox) * S), int((y1 - oy) * S))).resize((w, h), Image.LANCZOS)
    base.alpha_composite(vec)
    def P(x, y): return ((x - x0) * scale, (y - y0) * scale)
    # fade the compound the master still draws (its fence corners, read off the master at 8 px/pt), so the old
    # P60/P62/P63/WC49/OP54 drawing reads as superseded under the orange layout
    veil = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ImageDraw.Draw(veil).polygon([P(*c) for c in OLD_COMPOUND], fill=(255, 255, 255, 170))
    base.alpha_composite(veil)
    d = ImageDraw.Draw(base)
    try:
        from PIL import ImageFont
        font = ImageFont.load_default(size=15 if scale > 2 else 11); cap_font = ImageFont.load_default(size=12)
    except Exception:
        font = cap_font = None
    f = out['fence']
    fence = [P(f['north_x'], f['east_y'][0]), P(f['south_x'], f['east_y'][1]), P(f['south_x'], f['west_y'][1]), P(f['north_x'], f['west_y'][0])]
    d.line(fence + [fence[0]], fill=OR, width=line_w)
    for r, o in out['refs'].items():
        for it in o['shape']['c']:
            pts = [P(q[0] * SHEET[0], q[1] * SHEET[1]) for q in it['p']]
            d.line(pts + [pts[0]], fill=OR, width=line_w)
        if scale > 2:
            lx, ly = P(*o['new']['sheet_pt'])
            d.text((lx - 14, ly - 34), r, fill=OR, font=font, stroke_width=2, stroke_fill=(255, 255, 255))
    rx, ry = P(cx, cy)
    d.ellipse((rx - ring_r, ry - ring_r, rx + ring_r, ry + ring_r), outline=RED, width=max(2, line_w))
    d.rectangle((0, h - 18, w, h), fill=(255, 255, 255)); d.text((6, h - 16), CAPTION, fill=(60, 60, 60), font=cap_font)
    return base.convert('RGB')


def main():
    pos, tdir, ovpath = sys.argv[1:4]
    out = json.load(open(pos)); overview = Image.open(ovpath).convert('RGB')
    os.makedirs(os.path.join(HERE, 'media'), exist_ok=True)
    index = {}
    for ref in ('P60', 'P62', 'P63', 'WC49'):
        cx, cy = out['refs'][ref]['new']['sheet_pt']
        for kind, (w, h, scale), level, S, rr, lw in (('close', CLOSE, 'L3', 8, 38, 3), ('wide', WIDE, 'L0', 1, 17, 2)):
            im = render(out, overview, tdir, level, S, cx, cy, w, h, scale, ref, rr, lw)
            name = '%s_%s_1020.webp' % (ref, kind); path = os.path.join(HERE, 'media', name)
            im.save(path, 'WEBP', quality=82, method=6)
            data = open(path, 'rb').read(); sha = hashlib.sha256(data).hexdigest()
            index.setdefault(ref, {})[kind] = {'file': name, 'sha256': sha, 'bytes': len(data), 'size': [w, h]}
            print(ref, kind, len(data), 'bytes', sha[:12])
    json.dump(index, open(os.path.join(HERE, 'media', 'index.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
