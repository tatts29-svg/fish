"""Find every visible change in a screencast run: diff each frame against the previous one, report bbox and size,
flag A->B->A flashes, and make side-by-side sheets. usage: analyse.py RUN_DIR [min_frac]"""
import json, sys, os
import numpy as np
from PIL import Image, ImageDraw
run = sys.argv[1]; MIN = float(sys.argv[2]) if len(sys.argv) > 2 else 0.004
L = json.load(open(os.path.join(run, 'log.json')))
T0 = L['timeOrigin']
fr = L['frames']
def load(f):
    im = Image.open(os.path.join(run, 'frames', f['fn'])).convert('L')
    w, h = im.size
    return np.asarray(im.resize((w // 3, h // 3)), dtype=np.int16), im.size
evs = []
prev = None; prevf = None; arrs = []
for f in fr:
    try: a, size = load(f)
    except Exception as e: continue
    t = f['ts'] * 1000 - T0
    if prev is not None and prev.shape == a.shape:
        d = np.abs(a - prev); m = d > 24; frac = m.mean()
        if frac >= MIN:
            ys, xs = np.where(m)
            bb = [int(xs.min() * 3), int(ys.min() * 3), int(xs.max() * 3), int(ys.max() * 3)]
            evs.append({'i': len(arrs), 't': round(t), 'frac': round(float(frac), 4), 'bb': bb, 'fn': f['fn'], 'prev': prevf['fn'], 'sy': f.get('sy')})
    arrs.append((t, f, a)); prev = a; prevf = f
# flashes: change at i that is (mostly) undone within 1.5 s
idx = {e['fn']: e for e in evs}
for k, (t, f, a) in enumerate(arrs):
    e = idx.get(f['fn'])
    if not e or k == 0: continue
    base = arrs[k - 1][2]
    for j in range(k + 1, len(arrs)):
        t2, f2, a2 = arrs[j]
        if t2 - t > 1500: break
        if a2.shape != base.shape: continue
        back = (np.abs(a2 - base) > 24).mean()
        if back < e['frac'] * 0.25:
            e['flash_undone_at'] = round(t2); e['flash_ms'] = round(t2 - t); break
json.dump(evs, open(os.path.join(run, 'events.json'), 'w'), indent=0)
fl = L['fl'] or {}
print('frames', len(fr), 'events', len(evs))
for e in evs:
    print(f"{e['t']/1000:7.2f}s frac={e['frac']:.3f} bb={e['bb']} {'FLASH '+str(e.get('flash_ms'))+'ms' if 'flash_ms' in e else ''} {e['fn']}")
# sheets: prev | new for each event, 4 events per sheet row
os.makedirs(os.path.join(run, 'sheets'), exist_ok=True)
def thumb(fn, label, bb=None):
    im = Image.open(os.path.join(run, 'frames', fn)).convert('RGB')
    if bb:
        d = ImageDraw.Draw(im); d.rectangle(bb, outline=(255, 0, 255), width=2)
    d = ImageDraw.Draw(im); d.rectangle([0, 0, im.size[0], 14], fill=(0, 0, 0)); d.text((3, 1), label, fill=(255, 255, 0))
    return im
pairs = []
for e in evs:
    pt = next((x[0] for x in arrs if x[1]['fn'] == e['prev']), 0)
    pairs.append((thumb(e['prev'], f"{pt/1000:.2f}s before"), thumb(e['fn'], f"{e['t']/1000:.2f}s {e['frac']:.3f}{' FLASH' if 'flash_ms' in e else ''}", e['bb'])))
per = 3
for s in range(0, len(pairs), per):
    chunk = pairs[s:s + per]
    w, h = chunk[0][0].size
    sheet = Image.new('RGB', (w * 2 * len(chunk) + 10 * (len(chunk) - 1), h), (40, 40, 40))
    for k, (a, b) in enumerate(chunk):
        x = k * (2 * w + 10); sheet.paste(a, (x, 0)); sheet.paste(b, (x + w, 0))
    sheet.save(os.path.join(run, 'sheets', f'ev_{s:03d}.jpg'), quality=80)
