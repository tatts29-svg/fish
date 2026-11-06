"""Draw the detected runs over each zone sheet so the attribution can be checked by eye."""
import json, math, sys, os
import pymupdf
from PIL import Image, ImageDraw
# The drawing PDF stays private: GC500_WFB_IN names the folder holding k220_k231.pdf and words.json (as for zone_runs.py).
IN = os.environ.get('GC500_WFB_IN', '/tmp/gc500-scratch/wfb_in/k/').rstrip('/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
doc = pymupdf.open(IN + 'k220_k231.pdf')
import importlib.util
spec = importlib.util.spec_from_file_location('zr', HERE + 'zone_runs.py')
# reuse the detection by importing the module's functions without re-running its main block: simplest is to re-run detection here
zr = importlib.util.module_from_spec(spec)
import io, contextlib
with contextlib.redirect_stdout(io.StringIO()):
    spec.loader.exec_module(zr)
DPI = 55
for pg in [11, 12, 10, 2, 7, 9]:
    if pg not in zr.REG: continue
    pieces, piece_pt = zr.pieces_on(pg)
    runs = [r for r in zr.runs_from(pieces, gap=3.2 * piece_pt) if r['pieces'] >= 1]
    labs = zr.labels_on(pg)
    page = doc[pg - 1]
    pix = page.get_pixmap(dpi=DPI)
    img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    d = ImageDraw.Draw(img)
    k = DPI / 72
    cols = ['#ff00ff', '#00c0ff', '#ff4040', '#00c000', '#ff8000', '#8000ff', '#008080', '#c0c000']
    runs.sort(key=lambda r: -r['pieces'])
    for i, r in enumerate(runs):
        c = cols[i % len(cols)]
        pts = [(p[0] * k, p[1] * k) for p in r['poly']]
        if len(pts) > 1: d.line(pts, fill=c, width=4)
        for p in pts: d.ellipse([p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3], fill=c)
        cx, cy = r['centre'][0] * k, r['centre'][1] * k
        d.rectangle([cx - 14, cy - 22, cx + 44, cy - 6], fill='black')
        d.text((cx - 12, cy - 21), 'R%d:%dy' % (i + 1, r['pieces']), fill=c)
    for L in labs:
        x, y = L['pos'][0] * k, L['pos'][1] * k
        d.rectangle([x - 4, y - 4, x + 4, y + 4], outline='blue', width=2)
    out = IN + 'overlay_p%02d.png' % pg
    img.save(out)
    print('wrote', out, 'runs', [(i + 1, r['pieces']) for i, r in enumerate(runs)])
