# Author: Andrew Fisher. v8.93: every overlay the page draws on the master, checked against the aligned 2 Oct drawing.
# The 17 Sep scene and the aligned 2 Oct scene are both rendered by the explorer's own renderer at the page picture's size
# (2600 x 1837, drawing only, white paper). Where the two renders differ the drawing changed; every overlay point is then
# read against that change map, and every pin's two thumbnail windows as well.
#   python3 audit_overlays893.py <page html> <old drawing-only png> <new drawing-only png> <out dir>
import json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

PAGE, OLD, NEW, OUT = sys.argv[1:5]
OUT = Path(OUT); OUT.mkdir(parents=True, exist_ok=True)
W, H = 2600, 1837                      # the page picture
PW, PH = 2384.0, 1684.0                # the sheet in points
STRONG = 64                            # grey levels: a real change, not the 0.06 pt plot-grid jitter (which moves a hairline's coverage by a few levels)
CLOSE, CONTEXT = (120.5, 76.7), (571.0, 373.5)   # make_master889's thumbnail windows on the picture
MAIN_LEFT_PT, STRIP_PT = 49.46, 25.5   # the main plan window's western edge and the strip the 2 Oct sheet no longer shows

old = np.asarray(Image.open(OLD).convert('L'), dtype=np.int16); new = np.asarray(Image.open(NEW).convert('L'), dtype=np.int16)
assert old.shape == (H, W) and new.shape == (H, W), (old.shape, new.shape)
d = np.abs(old - new); strong = d > STRONG
neigh = ndimage.uniform_filter(strong.astype(np.float32), size=3) * 9      # strong neighbours (incl. self)
mask = strong & (neigh >= 3)                                              # drop lone pixels
lab, n = ndimage.label(mask, structure=np.ones((3, 3)))
sizes = ndimage.sum(mask, lab, index=np.arange(1, n + 1))
boxes = ndimage.find_objects(lab)
comps = sorted(({'size': int(sizes[i]), 'x0': int(b[1].start), 'y0': int(b[0].start), 'x1': int(b[1].stop), 'y1': int(b[0].stop)}
                for i, b in enumerate(boxes) if sizes[i] >= 6), key=lambda c: -c['size'])
Image.fromarray((mask * 255).astype(np.uint8)).save(OUT / 'change_mask.png')
vis = np.stack([new, new, new], -1).astype(np.uint8); vis[mask] = (214, 40, 40)
Image.fromarray(vis).resize((1300, 919), Image.LANCZOS).save(OUT / 'change_map.png')
integral = np.pad(mask.astype(np.int64).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
def count(x0, y0, x1, y1):
    x0, y0 = max(0, int(np.floor(x0))), max(0, int(np.floor(y0))); x1, y1 = min(W, int(np.ceil(x1))), min(H, int(np.ceil(y1)))
    if x1 <= x0 or y1 <= y0: return 0
    return int(integral[y1, x1] - integral[y0, x1] - integral[y1, x0] + integral[y0, x0])
def around(px, py, r=12): return count(px - r, py - r, px + r + 1, py + r + 1)
def window(px, py, win): return count(px - win[0] / 2, py - win[1] / 2, px + win[0] / 2, py + win[1] / 2)
strip_px = ((MAIN_LEFT_PT) * W / PW, (MAIN_LEFT_PT + STRIP_PT) * W / PW)
def in_strip(px): return strip_px[0] - 1 <= px <= strip_px[1] + 1

s = Path(PAGE).read_text()
D = json.loads(re.search(r'const DATA = (\{.*?\});\n', s).group(1))
m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); ML, _ = json.JSONDecoder().raw_decode(s[m.end():])
m = re.search(r'const MASTER_LAYERS = ', s); LAYERS, _ = json.JSONDecoder().raw_decode(s[m.end():])
m = re.search(r'const VMS_TIPS = ', s); TIPS, _ = json.JSONDecoder().raw_decode(s[m.end():])
m = re.search(r'const PRIVATE_INPUT = ', s); PI, _ = json.JSONDecoder().raw_decode(s[m.end():])
d1 = next(x for x in D['sheets'] if x['key'] == 'D001'); d25 = next(x for x in D['sheets'] if x['key'] == 'D025')
media_shas = set(D['media'])

report = {'author': 'Andrew Fisher', 'what': 'overlays on the master read against the pixels that differ between the 17 Sep and the aligned 2 Oct drawing',
          'strong_threshold': STRONG, 'changed_pixels': int(mask.sum()), 'components_over_6px': len(comps), 'largest_components': comps[:60],
          'western_strip_px': [round(strip_px[0], 1), round(strip_px[1], 1)]}
pins = []
for ref, v in ML.items():
    px, py = v['pt'][0] * W, v['pt'][1] * H
    pins.append({'ref': ref, 'pt': v['pt'], 'px': [round(px, 1), round(py, 1)], 'how': v.get('how'), 'prec': v.get('prec'),
                 'near_change': around(px, py), 'close_window': window(px, py, CLOSE), 'context_window': window(px, py, CONTEXT),
                 'in_western_strip': in_strip(px), 'img': v.get('img') or [], 'img_in_media': all(x in media_shas for x in (v.get('img') or []))})
report['pins'] = pins
markers = []
for x in d1['markers']:
    px, py = x['fx'] * W, x['fy'] * H
    markers.append({'label': x['label'], 'kind': x['kind'], 'fx': x['fx'], 'fy': x['fy'], 'px': [round(px, 1), round(py, 1)],
                    'near_change': around(px, py), 'bubble_change': count(px - x.get('bub', 0.008) * W - 2, py - x.get('bub', 0.008) * W - 2, px + x.get('bub', 0.008) * W + 2, py + x.get('bub', 0.008) * W + 2),
                    'in_western_strip': in_strip(px)})
report['d001_markers'] = markers
vms = []
for x in d25['markers']:
    if x['kind'] != 'vms' or x.get('context') != 'Source callout': continue
    t = TIPS.get(x['label']); fx = t[0] if t else (x['fx'] * 2384 - 43.8) / 2384; fy = t[1] if t else x['fy']
    px, py = fx * W, fy * H
    vms.append({'label': 'VMS ' + x['label'], 'tip': bool(t), 'fx': fx, 'fy': fy, 'px': [round(px, 1), round(py, 1)], 'near_change': around(px, py), 'in_western_strip': in_strip(px)})
report['master_vms'] = vms
layers = []
for i, l in enumerate(LAYERS):
    px, py = l['fx'] * W, l['fy'] * H
    layers.append({'i': i, 'layer': l['layer'], 'label': l['label'], 'face': l.get('face'), 'src': l.get('src'), 'fx': l['fx'], 'fy': l['fy'], 'px': [round(px, 1), round(py, 1)],
                   'near_change': around(px, py), 'in_western_strip': in_strip(px)})
report['master_layers'] = layers
geos = []
for g in PI.get('geometry', []):
    pts = g.get('points') or []
    hits = [p for p in pts if around(p[0] * W / PW, p[1] * H / PH, 4) > 0]
    geos.append({'id': g['id'], 'kind': g.get('kind'), 'region': g.get('region'), 'points': len(pts), 'points_on_changed_pixels': len(hits),
                 'in_western_strip': any(in_strip(p[0] * W / PW) for p in pts), 'master_sha256': g.get('master_sha256', '')[:12]})
report['fencing_geometry'] = geos
(OUT / 'overlay_audit893.json').write_text(json.dumps(report, ensure_ascii=False, indent=1))

def summary(items, key, name):
    hot = [x for x in items if x[key] > 0]
    print('%-18s %4d items, %3d on changed pixels: %s' % (name, len(items), len(hot), ', '.join(str(x.get('ref') or x.get('label') or x.get('id')) + '(%d)' % x[key] for x in hot)[:1500]))
print('changed pixels', int(mask.sum()), '| components >= 6 px', len(comps), '| western strip px', report['western_strip_px'])
summary(pins, 'near_change', 'MASTER_LOC pins')
print('  close window touched:', sum(1 for p in pins if p['close_window'] > 0), '| context window touched:', sum(1 for p in pins if p['context_window'] > 0), '| in strip:', [p['ref'] for p in pins if p['in_western_strip']])
print('  pictures missing from the media list:', [p['ref'] for p in pins if not p['img_in_media']])
summary(markers, 'near_change', 'D001 markers'); print('  in strip:', [x['label'] for x in markers if x['in_western_strip']])
summary(vms, 'near_change', 'MASTER VMS'); print('  in strip:', [x['label'] for x in vms if x['in_western_strip']])
summary(layers, 'near_change', 'MASTER_LAYERS'); print('  in strip:', [x['label'] + '@' + str(x['i']) for x in layers if x['in_western_strip']])
summary(geos, 'points_on_changed_pixels', 'fencing geometry'); print('  in strip:', [g['id'] for g in geos if g['in_western_strip']], '| not on the 17 Sep master:', [g['id'] for g in geos if not g['master_sha256'].startswith('37792f0a')])
