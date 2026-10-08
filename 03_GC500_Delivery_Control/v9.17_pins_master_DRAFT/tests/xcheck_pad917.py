# Author: Andrew Fisher. v9.17 r4 - independent check of the 11 padded area pictures.
#   python3 -I tests/xcheck_pad917.py <D001-26003-03-MASTER.pdf> <georeferencing.json> <evidence/thumbs917.json> <evidence/media917>
# independent check of the padded pictures: put the sheet (or, for the inset, only the inset frame) on a larger white page
# with pymupdf's show_pdf_page, render the same window from it, and find the shift that best matches the made picture
import json, sys
import numpy as np, pymupdf as fitz
from PIL import Image
PDF, GEOP, TH, MEDIA = sys.argv[1:5]
GEO = json.load(open(GEOP)); INSET = fitz.Rect(*GEO['inset']['sheet_region_pts'])
T = json.load(open(TH)); src = fitz.open(PDF); Z = 2600 / 2384.0; PAD = 1000
big = fitz.open(); big.new_page(width=2384 + 2 * PAD, height=1684 + 2 * PAD); big[0].show_pdf_page(fitz.Rect(PAD, PAD, PAD + 2384, PAD + 1684), src, 0)
big2 = fitz.open(); big2.new_page(width=2384 + 2 * PAD, height=1684 + 2 * PAD); big2[0].show_pdf_page(INSET + (PAD, PAD, PAD, PAD), src, 0, clip=INSET)
for ref, v in T['padded_past_the_edge'].items():
    cx, cy = T['pins'][ref]['centre_paper_pt']; w, h = 571.0 / Z, 373.5 / Z; ow, oh = 937, 613
    clip = fitz.Rect(cx - w / 2 + PAD, cy - h / 2 + PAD, cx + w / 2 + PAD, cy + h / 2 + PAD)
    pg = big2[0] if v['context']['region'] == 'inset frame' else big[0]
    p = pg.get_pixmap(matrix=fitz.Matrix(ow / clip.width, oh / clip.height), clip=clip, alpha=False)
    ref_im = np.asarray(Image.frombytes('RGB', (p.width, p.height), p.samples), dtype=float)
    made = np.asarray(Image.open(MEDIA + '/' + T['pins'][ref]['img'][1] + '.webp').convert('RGB'), dtype=float)
    mask = np.ones((oh, ow), bool); yy, xx = np.ogrid[:oh, :ow]; mask[(yy - oh / 2) ** 2 + (xx - ow / 2) ** 2 < 30 ** 2] = False
    best = []
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            a = ref_im[max(0, dy):, max(0, dx):][:oh - 4, :ow - 4]; b = made[max(0, -dy):, max(0, -dx):][:oh - 4, :ow - 4]
            m = mask[:oh - 4, :ow - 4]; best.append((float(np.abs(a - b).mean(axis=2)[m].mean()), dx, dy))
    best.sort(); d0 = [x for x in best if x[1] == 0 and x[2] == 0][0]
    fr = (p.x / (ow / clip.width)) - clip.x0; print('frac origin px %.2f,%.2f' % (clip.x0 * ow / clip.width - p.x, clip.y0 * oh / clip.height - p.y), end=' '); print('%-5s ref %dx%d  best shift (%d,%d) diff %.2f | at (0,0) %.2f | made size %s' % (ref, p.width, p.height, best[0][1], best[0][2], best[0][0], d0[0], made.shape[1::-1]))
