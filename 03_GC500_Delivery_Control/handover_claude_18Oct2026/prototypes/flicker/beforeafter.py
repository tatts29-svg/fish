"""Before/after sheet: the same moments of the load from a base run and a prototype run, one row each."""
import json, os, sys
from PIL import Image, ImageDraw
def frame_at(run, t):
    L = json.load(open(os.path.join(run, 'log.json'))); T0 = L['timeOrigin']
    best = None
    for f in L['frames']:
        if f['ts'] * 1000 - T0 <= t: best = f
    return Image.open(os.path.join(run, 'frames', best['fn'])).convert('RGB'), best['ts'] * 1000 - T0
out, rows = sys.argv[1], sys.argv[2:]
spec = [r.split('@') for r in rows]   # run@label@t1,t2,...
ims = []
for run, label, ts in spec:
    row = []
    for t in ts.split(','):
        im, at = frame_at(run, float(t) * 1000); im = im.crop((0, 0, 390, 560)); d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 390, 16], fill=(0, 0, 0)); d.text((4, 2), f"{label} {float(t):.1f}s", fill=(255, 255, 0)); row.append(im)
    ims.append(row)
w, h = 390, 560
sheet = Image.new('RGB', (w * max(len(r) for r in ims), h * len(ims)), (40, 40, 40))
for y, r in enumerate(ims):
    for x, im in enumerate(r): sheet.paste(im, (x * w, y * h))
sheet = sheet.resize((sheet.size[0] * 2 // 3, sheet.size[1] * 2 // 3)); sheet.save(out, quality=82); print(out, sheet.size)
