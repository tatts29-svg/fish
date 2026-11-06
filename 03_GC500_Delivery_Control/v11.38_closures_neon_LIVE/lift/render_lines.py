"""Draw lines.json over 2026 plan windows (L2, 4 px per pt) for a check."""
import sys, json; sys.path.insert(0, '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/tiles')
from fetch_tiles import window
from PIL import ImageDraw, ImageFont
L = json.load(open(sys.argv[1]))['lines']
RGB = {'pink': (255, 40, 160), 'teal': (0, 200, 190), 'orange': (255, 120, 0)}
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 13)
except Exception: font = ImageFont.load_default()
def g(name, x0, y0, x1, y1, lvl=2):
    s = 2 ** lvl; im = window(lvl, x0, y0, x1, y1).convert('RGB'); dr = ImageDraw.Draw(im)
    for x in range(x0 - x0 % 10, x1 + 1, 10):
        if x < x0: continue
        X = (x - x0) * s; maj = x % 50 == 0; dr.line([(X, 0), (X, im.height)], fill=(0, 0, 255) if maj else (190, 190, 255), width=1)
        if maj: dr.text((X + 2, 2), str(x), fill=(200, 0, 0), font=font)
    for y in range(y0 - y0 % 10, y1 + 1, 10):
        if y < y0: continue
        Y = (y - y0) * s; maj = y % 50 == 0; dr.line([(0, Y), (im.width, Y)], fill=(0, 0, 255) if maj else (190, 190, 255), width=1)
        if maj: dr.text((2, Y + 2), str(y), fill=(200, 0, 0), font=font)
    for l in L:
        pts = [((p[0] - x0) * s, (p[1] - y0) * s) for p in l['pts']]
        dr.line(pts, fill=RGB[l['colour']], width=3)
        for p in pts: dr.ellipse([p[0] - 2, p[1] - 2, p[0] + 2, p[1] + 2], fill=(0, 0, 0))
    im.save('r_' + name + '.png'); print(name, im.size)
for a in sys.argv[2:]:
    n, x0, y0, x1, y1 = a.split(','); g(n, int(x0), int(y0), int(x1), int(y1))
