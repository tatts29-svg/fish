# On-screen canvas vs the PNG export of the same view: both resampled to the canvas size, the export's 44 px caption
# strip and anything outside the sheet ignored. Reports mean absolute difference (0-255), the share of pixels that
# differ by more than 40, and the share of near-black pixels (luminance < 40) on screen and in the export.
import json, sys
from PIL import Image
import numpy as np
W = '/tmp/claude-0/stage/work/'
def run(tag, view):
    c = Image.open(W + tag + '_canvas.png').convert('RGB'); e = Image.open(W + tag + '_export.png').convert('RGB')
    v = json.load(open(W + tag + '_view.json')); cw, ch = c.size; ew, eh = e.size
    ex = e.resize((cw, round(eh * cw / ew)), Image.LANCZOS)  # the export covers the same view rectangle
    h = min(ch, ex.size[1]) - round(44 * cw / ew) - 2
    a = np.asarray(c, dtype=np.int16)[:h]; b = np.asarray(ex, dtype=np.int16)[:h]
    # sheet mask in canvas pixels (rotation 0 in these views)
    sx = cw / v['w']; x0 = max(0, int((0 - v['x']) * sx) + 2); x1 = min(cw, int((2384 - v['x']) * sx) - 2); y0 = max(0, int((0 - v['y']) * sx) + 2); y1 = min(h, int((1684 - v['y']) * sx) - 2)
    a = a[y0:y1, x0:x1]; b = b[y0:y1, x0:x1]
    d = np.abs(a - b).mean(axis=2); lum = lambda m: (m * [0.299, 0.587, 0.114]).sum(axis=2)
    print(f"{tag:22s} sheet area {x1-x0}x{y1-y0}px  mean|diff| {d.mean():6.2f}  >40 differ {100*(d>40).mean():5.1f}%  near-black: screen {100*(lum(a)<40).mean():5.1f}%  export {100*(lum(b)<40).mean():5.1f}%")
    Image.fromarray(np.hstack([a, b]).clip(0, 255).astype(np.uint8)).resize(((x1-x0), (y1-y0)//2)).save(W + tag + '_side_by_side.jpg', quality=80)
for v in ('before', 'after'):
    for t in ('fit', 'island'): run(v + '_' + t, None)
