#!/usr/bin/env python3
# Author: Andrew Fisher. v8.90: the Map explorer's drawing scene and its small assets, rebuilt from the 2 Oct issue of
# D001-26003-03 and placed in the frame the explorer already has (the 17 Sep issue), so every georeference, fence line and
# unchanged label stays exactly where it was.
#
#   python3 build_scene890.py <17 Sep PDF> <2 Oct PDF> <live explorer assets dir> <out dir>
#
# Writes to <out dir>/assets: drawing-scene.bin, source-labels.json, classification.json, georeferencing.json,
# underlay/manifest.json + underlay/*.webp, vt/boot.json (the boot block for the tile manifest), and <out dir>/report.json
# (the alignment measurements and the label changes). The tile pyramid is rendered separately (render_tiles.cjs, pack890.py).
import sys, os, io, re, json, gzip, math, hashlib, collections, time
from pathlib import Path
import numpy as np
from PIL import Image
import pymupdf as fitz
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mupdf_scene as MS

OLD_PDF, NEW_PDF, LIVE, OUT = sys.argv[1:5]
OUT = Path(OUT); A = OUT / 'assets'; (A / 'underlay').mkdir(parents=True, exist_ok=True); (A / 'vt').mkdir(exist_ok=True)
for f in (A / 'underlay').glob('*.webp'): f.unlink()      # a clean set every run
OLD_SHA = '37792f0a9d32e829f34d28ab41197fd2cf689fb62cd60a755aa89106cb5a0a2f'
NEW_SHA = '8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d'
sha = lambda b: hashlib.sha256(b).hexdigest()
old_bytes, new_bytes = Path(OLD_PDF).read_bytes(), Path(NEW_PDF).read_bytes()
assert sha(old_bytes) == OLD_SHA, 'not the 17 Sep master'; assert sha(new_bytes) == NEW_SHA, 'not the 2 Oct master'
report = {'author': 'Andrew Fisher', 'old_pdf_sha256': OLD_SHA, 'new_pdf_sha256': NEW_SHA}
T0 = time.time()
def log(*a): print('[%5.1fs]' % (time.time() - T0), *a, flush=True)

# ------------------------------------------------------------------ 1. both sheets as MuPDF SVG, cut into records
old_doc, new_doc = fitz.open(OLD_PDF), fitz.open(NEW_PDF); old_pg, new_pg = old_doc[0], new_doc[0]
assert (round(new_pg.rect.width), round(new_pg.rect.height)) == (2384, 1684)
po = MS.parse_svg(old_pg.get_svg_image(text_as_path=True)); log('17 Sep issue:', len(po['records']), 'records')
pn = MS.parse_svg(new_pg.get_svg_image(text_as_path=True)); log('2 Oct issue:', len(pn['records']), 'records')
report['records'] = {'old': len(po['records']), 'new': len(pn['records'])}

# ------------------------------------------------------------------ 2. what each context is: the main viewport, the inset, the legend strip, the border, or a symbol clip
def clip_geom(parsed, ctx):
    clip = next((d for d in ctx[2] if d.startswith('clip')), None)
    return (clip, re.search(r' d="([^"]+)"', parsed['defs'][clip][0]).group(1)) if clip else (None, '')

def region_of(parsed):
    out = []
    for ctx in parsed['contexts']:
        clip, geom = clip_geom(parsed, ctx)
        if geom.startswith('M24244'): out.append('main')
        elif geom.startswith('M38667'): out.append('inset')
        elif geom.startswith('M591 2'): out.append('legend')
        elif geom.startswith('M42'): out.append('border')
        elif clip and 'matrix(1,0,0,-1,0,1684)' in parsed['defs'][clip][0]: out.append('icon')     # a small clip around a raster symbol: drawn content, moves with the main plan
        else: out.append('other')
    return out
ro, rn = region_of(po), region_of(pn)
report['contexts_by_region'] = {'old': dict(collections.Counter(ro)), 'new': dict(collections.Counter(rn))}
assert 'other' not in rn, 'an unexpected clip geometry in the 2 Oct issue'

# ------------------------------------------------------------------ 3. how far each region moved on the paper, from matched vectors
NUM = re.compile(r'-?(?:\d+\.?\d*|\.\d+)')
def strip_ef(s): return re.sub(r'matrix\(([^,]+),([^,]+),([^,]+),([^,]+),[^,]+,[^)]+\)', r'matrix(\1,\2,\3,\4)', s)
def signature(rec, ctxs):
    if rec['kind'] == 'path':
        pts = MS.path_points(rec['d']); x0, y0 = pts[0]
        return (strip_ef(rec['style']), tuple((round(x - x0, 3), round(y - y0, 3)) for x, y in pts))
    return (re.sub(r'xlink:href="[^"]*"', '', rec['d'])[:200], strip_ef(ctxs[rec['ctx']][0]))
def ctx_matrix(ctxs, ci):
    M = [1, 0, 0, 1, 0, 0]
    for g in ctxs[ci][0].split('><'):
        if 'transform=' in g: M = MS.mul(M, MS.matrix_of(g))
    return M
def anchor(rec, ctxs):
    M = ctx_matrix(ctxs, rec['ctx'])
    if rec['kind'] == 'path':
        if 'transform' in rec['attrs']: M = MS.mul(M, MS.matrix_of(rec['attrs']['transform']))
        p = MS.path_points(rec['d'])[0]; return MS.apply(M, p[0], p[1])
    return MS.apply(M, 0, 0)
def index(parsed, regs):
    idx = collections.defaultdict(list)
    for i, rec in enumerate(parsed['records']): idx[(regs[rec['ctx']], signature(rec, parsed['contexts']))].append(i)
    return idx
io_, in_ = index(po, ro), index(pn, rn)
offsets = collections.defaultdict(list)
for key, olds in io_.items():
    news = in_.get(key)
    if not news or len(news) != len(olds): continue
    for a, b in zip(olds, news):
        pa, pb = anchor(po['records'][a], po['contexts']), anchor(pn['records'][b], pn['contexts'])
        offsets[key[0]].append((round(pb[0] - pa[0], 2), round(pb[1] - pa[1], 2)))
OFF = {}
for reg in ('main', 'inset', 'legend', 'border'):
    c = collections.Counter(offsets[reg]); (dx, dy), n = c.most_common(1)[0]
    OFF[reg] = (-dx, -dy)       # what moves the 2 Oct content back onto the 17 Sep frame
    report.setdefault('shift_pt', {})[reg] = {'matched_records': len(offsets[reg]), 'mode_offset_new_minus_old': [dx, dy], 'mode_share': round(n / max(1, len(offsets[reg])), 3),
                                               'top': [[list(k), v] for k, v in c.most_common(6)], 'applied_translation': [-dx, -dy]}
OFF['icon'] = OFF['main']
log('shift (2 Oct minus 17 Sep), modal, pt:', {k: v['mode_offset_new_minus_old'] for k, v in report['shift_pt'].items()})
assert 25.3 <= OFF['main'][0] <= 25.8 and abs(OFF['main'][1]) < 0.3, OFF['main']
assert all(abs(OFF[r][0]) < 0.3 and abs(OFF[r][1]) < 0.3 for r in ('inset', 'legend', 'border')), OFF

# an independent check: phase correlation of the two sheets rendered at 2 px per pt over the main drawing area
def render_grey(pg, z=2):
    pix = pg.get_pixmap(matrix=fitz.Matrix(z, z), alpha=False, colorspace=fitz.csGRAY)
    return np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width).astype(np.float32)
def phase(a, b):
    a = a - a.mean(); b = b - b.mean(); F = np.fft.fft2(a) * np.conj(np.fft.fft2(b)); F /= np.abs(F) + 1e-9; r = np.fft.ifft2(F).real
    y, x = np.unravel_index(np.argmax(r), r.shape); x = x - a.shape[1] if x > a.shape[1] // 2 else x; y = y - a.shape[0] if y > a.shape[0] // 2 else y
    # sub-pixel: a parabola through the peak and its neighbours
    def sub(v0, v1, v2): d = v0 - 2 * v1 + v2; return 0.0 if d == 0 else 0.5 * (v0 - v2) / d
    yy, xx = int(y) % a.shape[0], int(x) % a.shape[1]
    fx = sub(r[yy, xx - 1], r[yy, xx], r[yy, (xx + 1) % a.shape[1]]); fy = sub(r[yy - 1, xx], r[yy, xx], r[(yy + 1) % a.shape[0], xx])
    return float(x + fx), float(y + fy), float(r.max())
go, gn = render_grey(old_pg), render_grey(new_pg)
# the main drawing area without the inset: x 49..1468 pt, y 41..1464 pt (times 2)
sl = (slice(2 * 60, 2 * 1440), slice(2 * 60, 2 * 1450))
px, py, pk = phase(go[sl], gn[sl]); report['phase_correlation_main_2px_per_pt'] = {'new_minus_old_px': [round(px, 2), round(py, 2)], 'pt': [round(px / 2, 3), round(py / 2, 3)], 'peak': round(pk, 3)}
sl2 = (slice(2 * 880, 2 * 1460), slice(2 * 1490, 2 * 2330))
px2, py2, pk2 = phase(go[sl2], gn[sl2]); report['phase_correlation_inset_2px_per_pt'] = {'new_minus_old_px': [round(px2, 2), round(py2, 2)], 'pt': [round(px2 / 2, 3), round(py2 / 2, 3)], 'peak': round(pk2, 3)}
log('phase correlation, main drawing area (pt):', report['phase_correlation_main_2px_per_pt']['pt'], 'inset:', report['phase_correlation_inset_2px_per_pt']['pt'])
del go, gn

# ------------------------------------------------------------------ 4. place the 2 Oct content on the 17 Sep frame
def fmt(v):
    s = '%.8g' % v
    if 'e' in s: s = ('%.10f' % v).rstrip('0').rstrip('.')
    if s.startswith('0.'): s = s[1:]
    elif s.startswith('-0.'): s = '-' + s[2:]
    return s
def shift_matrix_text(text, dx, dy):
    """every matrix(a,b,c,d,e,f) in the text gets e+dx, f+dy, the other numbers untouched"""
    def rep(m):
        parts = m.group(1).split(','); e, f = float(parts[4]), float(parts[5])
        return 'matrix(' + ','.join(parts[:4] + [fmt(e + dx), fmt(f + dy)]) + ')'
    return re.sub(r'matrix\(([^)]*)\)', rep, text)
# the viewport clips stay where the paper has them (corrected for the plot's own 0.06-0.12 pt jitter only); the drawn
# content, its soft masks and the small symbol clips move back onto the 17 Sep frame
JITTER = {r: (0.0, OFF[r][1]) for r in ('main', 'inset', 'legend', 'border')}; JITTER['icon'] = OFF['icon']
shifted_defs = set()
for ci, ctx in enumerate(pn['contexts']):
    reg = rn[ci]; dx, dy = OFF[reg]
    if 'transform=' in ctx[0]: ctx[0] = shift_matrix_text(ctx[0], dx, dy)
    for did in ctx[2]:
        if did in shifted_defs: continue
        shifted_defs.add(did); text = pn['defs'][did][0]
        if did.startswith('mask'): pn['defs'][did][0] = shift_matrix_text(text, dx, dy)
        elif did.startswith('clip'): jx, jy = JITTER[reg]; pn['defs'][did][0] = shift_matrix_text(text, jx, jy)
for rec in pn['records']:
    dx, dy = OFF[rn[rec['ctx']]]
    if rec['kind'] == 'path':
        rec['style'] = shift_matrix_text(rec['style'], dx, dy); rec['attrs']['transform'] = shift_matrix_text(rec['attrs']['transform'], dx, dy)
    elif 'transform' in rec['attrs']:
        rec['d'] = shift_matrix_text(rec['d'], dx, dy); rec['attrs']['transform'] = shift_matrix_text(rec['attrs']['transform'], dx, dy)
# boxes again, from the moved transforms
for rec in pn['records']:
    M = ctx_matrix(pn['contexts'], rec['ctx'])
    if rec['kind'] == 'path':
        M = MS.mul(M, MS.matrix_of(rec['attrs']['transform'])); pts = MS.path_points(rec['d']) or [(0, 0)]
        x0, y0, x1, y1 = MS.transformed_bbox(pts, M); p = MS.pad_for(rec['attrs'], M)
    else:
        if 'transform' in rec['attrs']: M = MS.mul(M, MS.matrix_of(rec['attrs']['transform']))
        w, h = float(rec['attrs']['width']), float(rec['attrs']['height']); x0, y0, x1, y1 = MS.transformed_bbox([(0, 0), (w, h)], M); p = 0.08
    rec['bbox'] = [MS.r2(x0 - p), MS.r2(y0 - p), MS.r2(x1 + p), MS.r2(y1 + p)]
log('content placed on the 17 Sep frame: main', OFF['main'], 'inset', OFF['inset'], 'legend', OFF['legend'], 'border', OFF['border'])

# ------------------------------------------------------------------ 5. the search labels: the live list carried across, with the 2 Oct issue's changes
LIVE_LABELS = json.load(open(os.path.join(LIVE, 'source-labels.json')))
MAIN_X0, MAIN_X1, MAIN_Y0, MAIN_Y1, NOTCH_X, NOTCH_Y = 49.46, 2334.02, 41.46, 1464.24, 1468.64, 859.26
INSET = (1482.86, 873.42, 2334.02, 1464.24)
def region_pt(x, y):
    if INSET[0] <= x <= INSET[2] and INSET[1] <= y <= INSET[3]: return 'inset'
    if MAIN_X0 <= x <= MAIN_X1 and MAIN_Y0 <= y <= MAIN_Y1 and not (x > NOTCH_X and y > NOTCH_Y): return 'main'
    return 'legend'
def tr_bbox(bb, reg):
    dx, dy = OFF[reg]; return [round(bb[0] + dx, 3), round(bb[1] + dy, 3), round(bb[2] + dx, 3), round(bb[3] + dy, 3)]
old_lines = MS.text_lines(old_pg); new_lines_raw = MS.text_lines(new_pg)
# the new lines, in old-frame coordinates (a line in the 2 Oct main plan sits 25.5 pt further left on its own paper)
new_lines = []
for t, bb, f, sz, dr, bi in new_lines_raw:
    cx, cy = (bb[0] + bb[2]) / 2 + OFF['main'][0], (bb[1] + bb[3]) / 2     # where it would be in the old frame if it is main-plan content
    reg = region_pt(cx, cy) if region_pt(cx, cy) == 'main' else region_pt((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)
    new_lines.append((t, tr_bbox(bb, reg), f, sz, dr, bi, reg))
near = lambda a, b, tol: all(abs(x - y) < tol for x, y in zip(a, b))
# live label -> old line(s)
by_text_old = collections.defaultdict(list)
for i, (t, bb, *_rest) in enumerate(old_lines): by_text_old[t.strip()].append(i)
lab_lines = {}        # live label index -> list of old line indices
for li, lab in enumerate(LIVE_LABELS):
    t, bb = lab[0], lab[1:]
    hits = [i for i in by_text_old.get(t, []) if near(old_lines[i][1][:2], bb[:2], 0.6)]
    if hits: lab_lines[li] = hits[:1]; continue
    # a label made of several lines (the live list joined stacked lines of one block): every word's line inside the box
    words = t.split(); group = []
    for w in words:
        c = [i for i in by_text_old.get(w, []) if old_lines[i][1][0] >= bb[0] - 0.6 and old_lines[i][1][1] >= bb[1] - 0.6 and old_lines[i][1][2] <= bb[2] + 0.6 and old_lines[i][1][3] <= bb[3] + 0.6 and i not in group]
        if c: group.append(c[0])
    lab_lines[li] = group
unresolved = [LIVE_LABELS[li][0] for li, g in lab_lines.items() if not g]
report['labels'] = {'live': len(LIVE_LABELS), 'live_without_a_text_line': unresolved}
# old line -> new line: same text, same place (in the old frame) within 0.5 pt
by_text_new = collections.defaultdict(list)
for j, (t, bb, *_r) in enumerate(new_lines): by_text_new[t.strip()].append(j)
old_to_new = {}; used_new = set()
for i, (t, bb, *_r) in enumerate(old_lines):
    cands = [j for j in by_text_new.get(t.strip(), []) if j not in used_new and near(new_lines[j][1], bb, 0.5)]
    if cands:
        j = min(cands, key=lambda j: sum(abs(x - y) for x, y in zip(new_lines[j][1], bb))); old_to_new[i] = j; used_new.add(j)
labels_out = []; removed = []; kept = 0
for li, lab in enumerate(LIVE_LABELS):
    g = lab_lines[li]
    if not g: continue
    if all(i in old_to_new for i in g):
        if len(g) == 1:
            nb = new_lines[old_to_new[g[0]]][1]; labels_out.append([lab[0]] + [round(v, 3) for v in nb])
        else:   # a joined label: the union of its lines' new boxes
            bbs = [new_lines[old_to_new[i]][1] for i in g]
            labels_out.append([lab[0], round(min(b[0] for b in bbs), 3), round(min(b[1] for b in bbs), 3), round(max(b[2] for b in bbs), 3), round(max(b[3] for b in bbs), 3)])
        kept += 1
    else: removed.append({'text': lab[0], 'box': lab[1:]})
old_line_is_label = {i for g in lab_lines.values() for i in g}
added = []
for j, (t, bb, f, sz, dr, bi, reg) in enumerate(new_lines):
    if j in used_new: continue
    # a line present on the 2 Oct issue with no counterpart on the 17 Sep issue: a label if the live list would have had it
    if MS.label_ok(t): labels_out.append([t.strip()] + [round(v, 3) for v in bb]); added.append({'text': t.strip(), 'box': [round(v, 3) for v in bb], 'region': reg})
# text cut by the viewport at the frame's edges (the 2 Oct sheet shows 9 mm less on the west, 9 mm more on the east): a
# fragment such as 'AIN BEACH TOWER' or 'GOLD CO' is not a label anyone would search for; dropped and reported
EDGE_W, EDGE_E = 49.46 + OFF['main'][0] + 1.0, MAIN_X1 + 0.5
def edge_fragment(box): return MAIN_Y0 <= (box[1] + box[3]) / 2 <= MAIN_Y1 and box[0] < MAIN_X1 and box[2] > MAIN_X0 and (box[0] < EDGE_W or box[2] > EDGE_E)
fragments = [a for a in added if edge_fragment(a['box'])]          # only new text; a 17 Sep label at an edge is kept as it was
frag_keys = {(a['text'], tuple(a['box'])) for a in fragments}
labels_out = [lab for lab in labels_out if (lab[0], tuple(lab[1:])) not in frag_keys]
added = [a for a in added if (a['text'], tuple(a['box'])) not in frag_keys]
# a label gone from one place and found at another with the same text: moved (nearest first, within 200 pt = 140 m)
moved = []; centre = lambda b: ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)
pairs = sorted(((math.hypot(centre(a['box'])[0] - centre(r['box'])[0], centre(a['box'])[1] - centre(r['box'])[1]), ri, ai) for ri, r in enumerate(removed) for ai, a in enumerate(added) if a['text'] == r['text']))
used_r, used_a = set(), set()
for d, ri, ai in pairs:
    if d > 200 or ri in used_r or ai in used_a: continue
    used_r.add(ri); used_a.add(ai); r, a = removed[ri], added[ai]; dxm, dym = centre(a['box'])[0] - centre(r['box'])[0], centre(a['box'])[1] - centre(r['box'])[1]
    moved.append({'text': r['text'], 'from': r['box'], 'to': a['box'], 'moved_pt': [round(dxm, 2), round(dym, 2)], 'moved_m_on_the_ground': round(math.hypot(dxm, dym) * 0.7056, 1)})
removed_only = [r for ri, r in enumerate(removed) if ri not in used_r]; added_only = [a for ai, a in enumerate(added) if ai not in used_a]
# the 17 Sep labels that sat in the western 9 mm the 2 Oct sheet no longer shows (old-frame x under 75 pt)
lost_strip = [r for r in removed_only if r['box'][0] < 75 + 25.5 and r['box'][0] < 100]
report['labels'].update({'kept': kept, 'moved': moved, 'removed': removed_only, 'added': added_only, 'removed_in_the_western_strip': [r['text'] for r in lost_strip],
                         'edge_fragments_dropped': fragments, 'out': len(labels_out)})
log('labels: kept', kept, 'moved', len(moved), 'removed', len(removed_only), 'added', len(added_only))
json.dump(labels_out, open(A / 'source-labels.json', 'w'), ensure_ascii=False, separators=(',', ':'))

# ------------------------------------------------------------------ 6. the scene
meta = {'file': os.path.basename(NEW_PDF), 'drawing': 'D001', 'project': '26003', 'revision': '03', 'title': 'Master Layout Plan — General Arrangement', 'sha256': NEW_SHA,
        'issued': '2 Oct 2026', 'frame_sha256': OLD_SHA,
        'frame_note': 'The 2 Oct issue, placed in the frame of the 17 Sep issue: its main plan sits %.2f pt (%.1f mm) further left on its own paper, so it is moved back by (%.2f, %.2f) pt; the inset by (%.2f, %.2f); the legend by (%.2f, %.2f). Fencing lines traced on the 17 Sep issue and both satellite registrations therefore still hold.' % (
            OFF['main'][0], OFF['main'][0] * 25.4 / 72, OFF['main'][0], OFF['main'][1], OFF['inset'][0], OFF['inset'][1], OFF['legend'][0], OFF['legend'][1])}
S = MS.build_scene(pn, labels_out, meta)
js = MS.dumps(S).encode('utf-8'); gz = gzip.compress(js, 9, mtime=0)
(A / 'drawing-scene.bin').write_bytes(gz)
report['scene'] = {'records': len(S['r']), 'styles': len(S['s']), 'contexts': len(S['c']), 'defs': len(S['d']), 'labels': len(S['labels']), 'broad': len(S['broad']), 'json_bytes': len(js), 'gzip_bytes': len(gz), 'sha256': sha(gz)}
log('scene written:', report['scene'])

# ------------------------------------------------------------------ 7. the images: which are the sheet's own aerial patches, and the underlay files
LIVE_CLS = json.load(open(os.path.join(LIVE, 'classification.json')))
old_aer = [r for r in LIVE_CLS['image_records'] if r['category'] == 'aerial_underlay']
def overlap(a, b):
    w = max(0, min(a[2], b[2]) - max(a[0], b[0])); h = max(0, min(a[3], b[3]) - max(a[1], b[1])); return w * h / max(1e-9, (a[2] - a[0]) * (a[3] - a[1]))
# the placed images of the 2 Oct PDF: bbox on its own paper -> xref
placed = []
for inf in new_pg.get_image_info(xrefs=True):
    placed.append((inf['xref'], list(inf['bbox'])))
smask_of = {i[0]: i[1] for i in new_pg.get_images(full=True)}
img_records = [(i, r) for i, r in enumerate(pn['records']) if r['kind'] == 'image']
# pair the 2 Oct images with the 17 Sep aerial patches one to one: the two boxes cover each other, the pixel sizes agree
# (a patch at the viewport's western edge is narrower now, the sheet shows 9 mm less there); best score first, each used once
def opx(o): m = re.search(r'\((\d+)x(\d+) px\)', o['evidence']); return int(m.group(1)), int(m.group(2))
# the same patch, one of three ways: at the same place; re-rasterised over the same paper rectangle (so 25.5 pt to the right
# once the content is moved back); or cut at the viewport's western edge (left edge further right, the rest the same).
# Top and bottom edges always match. The closest fit wins, each 17 Sep patch used once.
DXM = OFF['main'][0]
def pair_score(bb, ob):
    v = abs(bb[1] - ob[1]) + abs(bb[3] - ob[3])
    same = abs(bb[0] - ob[0]) + abs(bb[2] - ob[2]); paper = abs(bb[0] - DXM - ob[0]) + abs(bb[2] - DXM - ob[2])
    cut = abs(bb[2] - ob[2]) + max(0.0, bb[0] - ob[0]) * 0.1 if bb[0] >= ob[0] - 1.5 else 1e9
    return v + min(same, paper, cut)
cands = []
for i, rec in img_records:
    if 'image/jpeg' not in rec['d'][:120]: continue
    bb = rec['bbox']
    for o in old_aer:
        if min(overlap(bb, o['bbox']), overlap(o['bbox'], bb)) < 0.4: continue
        sc = pair_score(bb, o['bbox'])
        if sc < 60: cands.append((sc, i, o['id']))
twin_of = {}; taken = set()
for score, i, oid in sorted(cands):
    if i in twin_of or oid in taken: continue
    twin_of[i] = oid; taken.add(oid)
old_by_id = {o['id']: o for o in old_aer}
cls_records = []; under_items = []; aer_ids = []
for i, rec in img_records:
    bb = rec['bbox']; w, h = int(rec['attrs']['width']), int(rec['attrs']['height']); reg = rn[rec['ctx']]
    dx, dy = OFF[reg]; paper_bb = [bb[0] + 0.08 - dx, bb[1] + 0.08 - dy, bb[2] - 0.08 - dx, bb[3] - 0.08 - dy]
    xref = min(placed, key=lambda p: sum(abs(a - b) for a, b in zip(p[1], paper_bb)))
    close = sum(abs(a - b) for a, b in zip(xref[1], paper_bb)); xref = xref[0]
    twin = old_by_id.get(twin_of.get(i)); aerial = twin is not None
    if aerial:
        cls_records.append({'id': i, 'bbox': bb, 'category': 'aerial_underlay', 'confidence': 'high', 'evidence': 'bbox matches PDF image xref %d (%dx%d px) which is a placed aerial photograph patch; the 17 Sep issue has the same patch here (its record %d, %dx%d px)' % (xref, w, h, twin['id'], *opx(twin)), 'context': rec['ctx'], 'svg_bytes': len(rec['d'])})
        aer_ids.append(i); under_items.append((i, rec, xref, w, h, reg))
    else:
        cls_records.append({'id': i, 'bbox': bb, 'category': 'raster_symbol', 'confidence': 'medium', 'evidence': 'small image (%d x %d pt): a symbol or lettering rendered as raster in the source; kept' % (round(bb[2] - bb[0]), round(bb[3] - bb[1])), 'context': rec['ctx'], 'svg_bytes': len(rec['d'])})
log('images:', len(img_records), 'aerial patches', len(aer_ids), '(17 Sep had', len(old_aer), ')')
twins = collections.Counter(re.search(r'its record (\d+)', c['evidence']).group(1) for c in cls_records if c['category'] == 'aerial_underlay')
assert len(aer_ids) == len(old_aer) and all(v == 1 for v in twins.values()) and len(twins) == len(old_aer), ('aerial patches do not pair one to one with the 17 Sep set', len(aer_ids), twins.most_common(3))
# the underlay files: the photograph with its soft mask, and the viewport clip, as alpha; placed in the old frame
def inside_main(xs, ys): return (xs >= MAIN_X0) & (xs <= MAIN_X1) & (ys >= MAIN_Y0) & (ys <= MAIN_Y1) & ~((xs > NOTCH_X) & (ys > NOTCH_Y))
def inside_inset(xs, ys): return (xs >= INSET[0]) & (xs <= INSET[2]) & (ys >= INSET[1]) & (ys <= INSET[3])
def inside_legend(xs, ys): return (xs >= 49.46) & (xs <= 1175.48) & (ys >= 1478.4) & (ys <= 1640)
manifest_items = []
for i, rec, xref, w, h, reg in under_items:
    b = new_doc.extract_image(xref); im = Image.open(io.BytesIO(b['image'])).convert('RGB')
    if im.size != (w, h): im = im.resize((w, h), Image.Resampling.LANCZOS)
    sm = smask_of.get(xref)
    if sm:
        a = Image.open(io.BytesIO(new_doc.extract_image(sm)['image'])).convert('L')
        if a.size != (w, h): a = a.resize((w, h), Image.Resampling.BILINEAR)
        alpha = np.asarray(a, dtype=np.float32)
    else: alpha = np.full((h, w), 255, np.float32)
    bb = [rec['bbox'][0] + 0.08, rec['bbox'][1] + 0.08, rec['bbox'][2] - 0.08, rec['bbox'][3] - 0.08]
    xs = bb[0] + (np.arange(w) + 0.5) / w * (bb[2] - bb[0]); ys = bb[1] + (np.arange(h) + 0.5) / h * (bb[3] - bb[1])
    X, Y = np.meshgrid(xs, ys)
    inside = inside_main(X, Y) if reg in ('main', 'icon') else inside_inset(X, Y) if reg == 'inset' else inside_legend(X, Y) if reg == 'legend' else np.ones_like(X, bool)
    alpha = np.where(inside, alpha, 0).astype(np.uint8)
    rgba = Image.fromarray(np.dstack([np.asarray(im, np.uint8), alpha]), 'RGBA')
    name = 'underlay/x%d-02oct.webp' % xref; buf = io.BytesIO(); rgba.save(buf, 'WEBP', quality=80, method=6); data = buf.getvalue()
    (A / name).write_bytes(data)
    manifest_items.append({'file': name, 'xref': xref, 'bbox': [round(v, 2) for v in bb], 'px': [w, h], 'bytes': len(data), 'record_id': i, 'alpha': True})
json.dump({'note': "the drawing's own aerial photograph, as placed on the sheet; drawn in Original plan mode only, in record order; exported from the 2 Oct issue with the soft mask and the viewport clip as the alpha channel (lossy WebP with alpha), placed in the 17 Sep frame",
           'items': manifest_items}, open(A / 'underlay' / 'manifest.json', 'w'), indent=1)
cls = {'source_pdf_sha256': NEW_SHA, 'frame_pdf_sha256': OLD_SHA, 'records_total': len(S['r']), 'image_records': cls_records, 'large_white_fills_review': [], 'rule': LIVE_CLS['rule']}
json.dump(cls, open(A / 'classification.json', 'w'), indent=1)
report['images'] = {'total': len(img_records), 'aerial_underlay': len(aer_ids), 'raster_symbol': len(img_records) - len(aer_ids), 'underlay_bytes': sum(m['bytes'] for m in manifest_items)}

# ------------------------------------------------------------------ 8. the boot block for the tile manifest, georeferencing, review notes
boot = {'note': 'lets the explorer open without the scene; regenerated with build_scene890.py for the 2 Oct issue (drawing-scene.bin %s)' % sha(gz)[:12],
        'meta': meta, 'count': len(S['r']), 'images': len(img_records), 'underlay': sorted(aer_ids)}
json.dump(boot, open(A / 'vt' / 'boot.json', 'w'))
geo = json.load(open(os.path.join(LIVE, 'georeferencing.json')))
assert geo['pdf_sha256'] == OLD_SHA
geo['pdf_sha256'] = NEW_SHA
geo['frame'] = {'pdf_sha256': OLD_SHA, 'issued': '17 Sep 2026', 'note': 'Both registrations were measured on the 17 Sep issue. The 2 Oct issue is drawn in that frame (its main plan moved back by (%.2f, %.2f) pt, the inset by (%.2f, %.2f) pt), so the sheet_to_z18px transforms are unchanged and still exact.' % (OFF['main'][0], OFF['main'][1], OFF['inset'][0], OFF['inset'][1]), 'measured_by': 'matched vectors of both issues (mode of the per-record offsets) and phase correlation of the two renders'}
geo['date_frame_note'] = '7 Oct 2026'
json.dump(geo, open(A / 'georeferencing.json', 'w'), indent=1)
report['georeferencing'] = {'main_transform_unchanged': True, 'inset_transform_unchanged': True}
json.dump(report, open(OUT / 'report.json', 'w'), indent=1, ensure_ascii=False)
log('done; report at', OUT / 'report.json')
