"""pairs.py RUN out.jpg t1 t2 ... : for each time (s) show the frame just before and the first frame at/after it"""
import json, sys, os
from PIL import Image, ImageDraw
run, out = sys.argv[1], sys.argv[2]; ts = [float(x) for x in sys.argv[3:]]
L = json.load(open(os.path.join(run, 'log.json'))); T0 = L['timeOrigin']; fr = L['frames']
tl = [(f['ts']*1000 - T0, f) for f in fr]
def lab(im, s):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, im.size[0], 14], fill=(0, 0, 0)); d.text((3, 1), s, fill=(255, 255, 0)); return im
ims = []
for t in ts:
    t *= 1000
    before = [x for x in tl if x[0] < t]; after = [x for x in tl if x[0] >= t]
    for x, tag in ((before[-1] if before else None, 'before'), (after[0] if after else None, 'after')):
        if x: ims.append(lab(Image.open(os.path.join(run, 'frames', x[1]['fn'])).convert('RGB'), f"{x[0]/1000:.2f}s {tag}"))
w, h = ims[0].size
sheet = Image.new('RGB', (w * len(ims), h), (40, 40, 40))
for k, im in enumerate(ims): sheet.paste(im, (k * w, 0))
sheet.save(out, quality=80); print(out, len(ims))
