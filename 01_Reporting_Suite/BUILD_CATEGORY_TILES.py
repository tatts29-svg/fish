#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | BUILD THE CATEGORY TILES - the catalogue illustrates itself
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew, 6 Aug 2026, on the visual-store integration: "What about
#  pics." Exactly the right question. The 21 category tiles are
#  composited from THIS MACHINE'S OWN thumbs folder - so on the work
#  laptop, where 1,057 codes carry real photographs, the tiles feature
#  Andrew's actual gear; on a renders-only machine they feature the
#  approved renders. One rule everywhere: the tile shows the best
#  picture this machine holds, and no flat icons, ever.
#
#  Re-run any time the thumbs change (RUN_THIS_UPDATE and the My Gear
#  build both may call it). Output: Gear_Lookup\art\cats\cat-*.jpg,
#  bottom third faded dark for the name plate the page draws.
# =====================================================================
import collections
import csv
import hashlib
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
CATMAP = os.path.join(HERE, 'Coates_K2_Visual_Categories_1171.csv')
THUMBS = os.path.join(HERE, 'Gear_Lookup', 'thumbs')
OUT = os.path.join(HERE, 'Gear_Lookup', 'art', 'cats')


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def main():
    print('=' * 66)
    print(' COATES | BUILD THE CATEGORY TILES')
    print('=' * 66)
    try:
        from PIL import Image, ImageDraw, ImageFilter
    except ImportError:
        print(' No Pillow on this machine - tiles unchanged.')
        return 0
    if not os.path.isfile(CATMAP):
        print(' No category map (Coates_K2_Visual_Categories_1171.csv).')
        return 1
    cat = collections.defaultdict(list)
    with io.open(CATMAP, encoding='utf-8-sig') as fh:
        for r in csv.DictReader(fh):
            cat[r['category']].append(r['output_filename'])
    os.makedirs(OUT, exist_ok=True)
    made = 0
    for c, files in sorted(cat.items()):
        seen, picks = set(), []
        for f in files:
            p = os.path.join(THUMBS, f)
            if not os.path.isfile(p):
                continue
            with open(p, 'rb') as fh:
                h = hashlib.sha256(fh.read()).hexdigest()
            if h in seen:
                continue
            seen.add(h)
            picks.append(p)
            if len(picks) == 4:
                break
        if not picks:
            print('   %-22s no pictures on this machine yet' % c)
            continue
        tile = Image.new('RGB', (800, 800), (10, 14, 20))
        glow = Image.new('L', (800, 800), 0)
        gd = ImageDraw.Draw(glow)
        gd.ellipse((100, 520, 700, 900), fill=90)
        glow = glow.filter(ImageFilter.GaussianBlur(80))
        tile.paste(Image.new('RGB', (800, 800), (242, 98, 34)), (0, 0),
                   glow)
        if len(picks) == 1:
            im = Image.open(picks[0]).convert('RGB').resize((640, 640))
            tile.paste(im, (80, 60))
        else:
            pos = [(60, 40, 420), (380, 90, 360), (100, 340, 380),
                   (400, 380, 340)]
            for p, (x, y, s) in zip(picks, pos):
                im = Image.open(p).convert('RGB').resize((s, s))
                tile.paste(im, (x, y))
        fade = Image.new('L', (800, 800), 0)
        fd = ImageDraw.Draw(fade)
        for i in range(220):
            fd.line([(0, 580 + i), (800, 580 + i)],
                    fill=int(200 * i / 220))
        tile.paste(Image.new('RGB', (800, 800), (8, 11, 16)), (0, 0),
                   fade)
        tile.save(os.path.join(OUT, 'cat-' + slug(c) + '.jpg'),
                  quality=82)
        made += 1
    print(' %d tile(s) composited from THIS machine\'s own pictures.'
          % made)
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
