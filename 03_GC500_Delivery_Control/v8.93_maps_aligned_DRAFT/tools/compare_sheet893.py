# Author: Andrew Fisher. v8.93: the page picture of the master, proved against the live 17 Sep picture region by region.
# Regions are the paper's own windows (the clip paths on the sheet): the main plan (an L shape), the inset, the legend
# strip and the border. A phase correlation of (0, 0) in every region means the new picture sits in the live picture's
# frame everywhere; the v8.89 picture is measured the same way for the record.
#   python3 compare_sheet893.py <live 17 Sep webp> <new picture webp> <v8.89 picture webp> <17 Sep render png> <out json>
import json, sys
import numpy as np
from PIL import Image
LIVE, NEW, V889, OLDR, OUT = sys.argv[1:6]
W, H, PW, PH = 2600, 1837, 2384.0, 1684.0
sx, sy = W / PW, H / PH
def px(x0, y0, x1, y1): return (slice(int(round(y0 * sy)), int(round(y1 * sy))), slice(int(round(x0 * sx)), int(round(x1 * sx))))
# the paper's windows in points (clip paths, plot grid 0.06 pt, origin (14, 1656), y up)
MAIN_L = (49.46, 41.46, 1468.64, 1464.24)      # the left arm of the main L
MAIN_T = (1468.64, 41.46, 2334.02, 859.26)     # the top arm over the inset
INSET = (1473.0, 866.0, 2334.02, 1464.24)      # the inset window
LEGEND = (49.46, 1468.0, 2334.02, 1656.0)      # legend, key plan and title strip
BORDER_T = (0, 0, PW, 41.46)                   # the paper above the main window (border line, crop marks)
BORDER_L = (0, 0, 49.46, PH)
REGIONS = {'main_left': MAIN_L, 'main_top': MAIN_T, 'inset': INSET, 'legend_title': LEGEND, 'border_top': BORDER_T, 'border_left': BORDER_L}
def L(p): return np.asarray(Image.open(p).convert('L'), dtype=np.float32)
def phase(a, b):
    a = a - a.mean(); b = b - b.mean(); F = np.fft.fft2(a) * np.conj(np.fft.fft2(b)); F /= np.abs(F) + 1e-9
    r = np.fft.ifft2(F).real; y, x = np.unravel_index(np.argmax(r), r.shape)
    dx = int(x - a.shape[1] if x > a.shape[1] // 2 else x); dy = int(y - a.shape[0] if y > a.shape[0] // 2 else y)
    return [dx, dy], round(float(r.max()), 3)
live, new, v889, oldr = (L(p) for p in (LIVE, NEW, V889, OLDR))
assert all(a.shape == (H, W) for a in (live, new, v889, oldr))
out = {'author': 'Andrew Fisher', 'picture_px': [W, H], 'regions_pt': REGIONS, 'phase_correlation_px': {}}
for name, box in REGIONS.items():
    sl = px(*box); row = {}
    for label, img in (('17_sep_render_vs_live', oldr), ('v893_picture_vs_live', new), ('v889_picture_vs_live', v889)):
        shift, peak = phase(live[sl], img[sl]); row[label] = {'shift': shift, 'peak': peak}
    row['mean_abs_diff_v893_vs_live'] = round(float(np.abs(new[sl] - live[sl]).mean()), 2)
    out['phase_correlation_px'][name] = row
# the 9 mm strip the 2 Oct sheet no longer shows: blank paper in the new picture, drawing in the live one
strip = px(49.46 + 0.6, 41.46 + 0.6, 49.46 + 25.5 - 0.6, 1464.24 - 0.6)
out['western_strip'] = {'px_box': [strip[1].start, strip[0].start, strip[1].stop, strip[0].stop],
                        'v893_min_grey': int(new[strip].min()), 'v893_non_white_px': int((new[strip] < 250).sum()), 'live_non_white_px': int((live[strip] < 250).sum()),
                        'v889_non_white_px': int((v889[strip] < 250).sum())}
json.dump(out, open(OUT, 'w'), indent=1)
for name, row in out['phase_correlation_px'].items():
    print('%-13s' % name, ' | '.join('%s %s peak %.2f' % (k[:22], v['shift'], v['peak']) for k, v in row.items() if isinstance(v, dict)), '| mad', row['mean_abs_diff_v893_vs_live'])
print('western strip', out['western_strip'])
