# Author: Andrew Fisher. v8.89: the 2 Oct master D001-26003-03 laid over the live picture's frame, and the pins it moves.
# python3 make_master889.py <2 Oct master PDF> <live D001 webp> <built page> <out dir>
# Writes the aligned sheet picture, the new pin thumbnails and changes889.json. Reads nothing from the record.
import hashlib, io, json, math, re, sys
from pathlib import Path
import numpy as np
import pymupdf as fitz
from PIL import Image, ImageDraw

PDF, OLD, PAGE, OUT = sys.argv[1:5]
OUT = Path(OUT); OUT.mkdir(parents=True, exist_ok=True)
NEW_SHA, OLD_SHA = '8753d875cf90682e', '37792f0a9d32e829f34d28ab41197fd2cf689fb62cd60a755aa89106cb5a0a2f'
W, H, SHIFT = 2600, 1837, 28          # the 2 Oct drawing sits 9 mm (28 px) further left on the paper
pdf_bytes = Path(PDF).read_bytes(); pdf_sha = hashlib.sha256(pdf_bytes).hexdigest()
assert pdf_sha.startswith(NEW_SHA), 'not the 2 Oct master'
doc = fitz.open(PDF); pg = doc[0]; z = W / pg.rect.width
assert len(doc) == 1 and round(pg.rect.width) == 2384 and round(pg.rect.height) == 1684

def phase(a, b):
    a = a - a.mean(); b = b - b.mean(); F = np.fft.fft2(a) * np.conj(np.fft.fft2(b)); F /= np.abs(F) + 1e-9
    r = np.fft.ifft2(F).real; y, x = np.unravel_index(np.argmax(r), r.shape)
    return int(x - a.shape[1] if x > a.shape[1] // 2 else x), int(y - a.shape[0] if y > a.shape[0] // 2 else y)

# 1. the sheet picture, shifted so the drawing sits exactly where the live picture has it
pix = pg.get_pixmap(matrix=fitz.Matrix(z, z), alpha=False)
raw = Image.frombytes('RGB', (pix.width, pix.height), pix.samples); assert raw.size == (W, H)
sheet = Image.new('RGB', (W, H), 'white'); sheet.paste(raw, (SHIFT, 0))
old = np.asarray(Image.open(OLD).convert('L'), dtype=np.float32)
assert phase(old[150:1650, 150:1950], np.asarray(sheet.convert('L'), dtype=np.float32)[150:1650, 150:1950]) == (0, 0), 'alignment'
def webp(im, q):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); d = b.getvalue(); s = hashlib.sha256(d).hexdigest()
    (OUT / (s + '.webp')).write_bytes(d); return {'file': s + '.webp', 'sha256': s, 'type': 'image/webp', 'bytes': len(d), 'scope': 'view'}
sheet_media = webp(sheet, 82)

# 2. pins: the live table, the labels on the 2 Oct sheet, and the plan's own satellite registration
page = Path(PAGE).read_text()
m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', page); ML, _ = json.JSONDecoder().raw_decode(page[m.end():])
labels = {}
for x0, y0, x1, y1, w, *_ in pg.get_text('words'):
    labels.setdefault(w.strip().upper(), []).append((((x0 + x1) / 2 * z + SHIFT) / W, ((y0 + y1) / 2 * z) / H))
lat0, lon0 = -27.988, 153.427; kx, ky = 111320 * math.cos(math.radians(lat0)), 110574
xy = lambda ll: ((ll[1] - lon0) * kx, (ll[0] - lat0) * ky)
tags = [(k, v['pt'], v['ll']) for k, v in ML.items() if v.get('pt') and v.get('ll') and str(v.get('how', '')).startswith('tag on the unit')]
def to_ll(pt, skip=()):
    # as v7.82: through the 12 nearest unit tags (an affine fit), refusing any tag the fit cannot hold within 0.5 m
    near = sorted((t for t in tags if t[0] not in skip), key=lambda t: (t[1][0] - pt[0]) ** 2 + (t[1][1] - pt[1]) ** 2)
    pool = near[:30]
    for _ in range(3):
        use = pool[:12]; A = np.array([[t[1][0] * W, t[1][1] * H, 1] for t in use]); B = np.array([xy(t[2]) for t in use])
        cx = np.linalg.lstsq(A, B[:, 0], rcond=None)[0]; cy = np.linalg.lstsq(A, B[:, 1], rcond=None)[0]
        res = [math.hypot(a @ cx - b[0], a @ cy - b[1]) for a, b in zip(A, B)]
        bad = {use[i][0] for i, r in enumerate(res) if r > 0.5}
        if not bad: break
        pool = [t for t in pool if t[0] not in bad]
    a = np.array([pt[0] * W, pt[1] * H, 1]); x, y = a @ cx, a @ cy
    return [round(lat0 + y / ky, 7), round(lon0 + x / kx, 7)], round(max(res), 2)
def metres(a, b): return math.hypot(*(np.subtract(xy(a), xy(b))))

def thumbs(pt):
    # the two pictures every unit carries: close (120 x 76 sheet px at 6.4x) and context (571 x 373 at 1.64x), red ring on the tag
    out = []
    for win_w, win_h, out_w, out_h, ring, lw in ((120.5, 76.7, 771, 491, 46, 6), (571, 373.5, 937, 613, 20, 4)):
        cx, cy = pt[0] * W - SHIFT, pt[1] * H            # back to the paper's own coordinates
        clip = fitz.Rect((cx - win_w / 2) / z, (cy - win_h / 2) / z, (cx + win_w / 2) / z, (cy + win_h / 2) / z)
        p = pg.get_pixmap(matrix=fitz.Matrix(out_w / clip.width, out_h / clip.height), clip=clip, alpha=False)
        im = Image.frombytes('RGB', (p.width, p.height), p.samples).resize((out_w, out_h), Image.LANCZOS)
        d = ImageDraw.Draw(im); r = ring; d.ellipse((out_w / 2 - r, out_h / 2 - r, out_w / 2 + r, out_h / 2 + r), outline=(214, 40, 40), width=lw)
        out.append(webp(im, 80)['sha256'])
    return out

media = [sheet_media]; changes = {}; notes = []
def moved(ref, how_note):
    v = dict(ML.get(ref) or {}); old_pt = v.get('pt')
    cand = labels.get(ref.upper(), [])
    assert cand, ref + ' has no label on the 2 Oct sheet'
    pt = min(cand, key=lambda c: 0 if not old_pt else (c[0] - old_pt[0]) ** 2 + (c[1] - old_pt[1]) ** 2)
    pt = [round(pt[0], 5), round(pt[1], 5)]
    ll, fit = to_ll(pt, skip=(ref,))
    away = round(metres(v['ll'], ll)) if v.get('ll') else None
    v.update({'pt': pt, 'll': ll, 'how': 'tag on the unit, master D001 issued 2 Oct' + how_note(away), 'prec': 'unit'})
    v.pop('pts', None)
    imgs = thumbs(pt); v['img'] = imgs; media.extend({'file': s + '.webp', 'sha256': s, 'type': 'image/webp', 'bytes': (OUT / (s + '.webp')).stat().st_size, 'scope': 'view'} for s in imgs)
    changes[ref] = v; notes.append({'ref': ref, 'moved_m': away, 'fit_worst_m': fit, 'pt': pt, 'll': ll})
for ref in ('P45', 'WC38', 'WC39', 'WC51'):
    moved(ref, lambda d: '' if d is None else ' (moved about %d m from the 17 Sep issue)' % d)
moved('WC10', lambda d: ' (new on this issue)')
# the bottom-right inset stayed on the paper while the drawing moved: its tags move 28 px on the picture, not on the ground
for ref in ('WC81', 'CP1', 'T0265'):
    v = dict(ML[ref]); v['pt'] = [round(v['pt'][0] + SHIFT / W, 5), v['pt'][1]]; changes[ref] = v
    notes.append({'ref': ref, 'inset_shift_px': SHIFT})
# one tag where there were two
for ref in ('WC69', 'WC40'):
    v = dict(ML[ref]); keep = v['ll']; assert any(abs(p[0] - keep[0]) < 1e-7 and abs(p[1] - keep[1]) < 1e-7 for p in v.get('pts', []))
    v.pop('pts', None); v['how'] = str(v['how']) + ('; one tag on the 2 Oct issue' if ref == 'WC69' else '; the 2 Oct issue drops the second tag (WC40a)')
    changes[ref] = v
# drawn on the 17 Sep issue only; the pin stays until Andrew says otherwise
v = dict(ML['WC32']); v['how'] = 'tag on the unit, master D001 issued 17 Sep (not drawn on the 2 Oct issue)'; changes['WC32'] = v
# the sector words for the new reference, by the nearest sector label (checked against the table below)
st = re.search(r'const DATA = (\{.*?\});\n', page); D = json.loads(st.group(1))
sectors = [(x['label'], x['fx'], x['fy']) for x in next(s for s in D['sheets'] if s['key'] == 'D001')['markers'] if x['kind'] == 'circuit_sector']
def sector(pt): return min(sectors, key=lambda s: (s[1] - pt[0]) ** 2 + (s[2] - pt[1]) ** 2)[0]
agree = [k for k, v in ML.items() if v.get('sec') and v.get('pt') and sector(v['pt']) == v['sec']]
with_sec = [k for k, v in ML.items() if v.get('sec') and v.get('pt')]
if len(agree) / max(1, len(with_sec)) >= 0.9: changes['WC10']['sec'] = sector(changes['WC10']['pt'])
json.dump({'pdf_sha256': pdf_sha, 'pdf_bytes': len(pdf_bytes), 'old_master_sha256': OLD_SHA, 'shift_px': SHIFT,
           'sheet_media': sheet_media, 'media': media, 'master_loc': changes, 'notes': notes,
           'sector_check': {'agree': len(agree), 'with_sec': len(with_sec)}},
          open(OUT / 'changes889.json', 'w'), indent=1, ensure_ascii=False)
print(json.dumps({'sheet': sheet_media['sha256'][:16], 'sheet_bytes': sheet_media['bytes'], 'media': len(media), 'notes': notes,
                  'sector_check': [len(agree), len(with_sec)]}, indent=1))
