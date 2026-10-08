# Author: Andrew Fisher. v9.17 - the two pictures each moved pin carries (close up and the area), re-made from the 2 Oct
# master with the red ring on the unit (the new point), not on the label.
#
#   python3 -I tests/make_thumbs917.py <D001-26003-03-MASTER.pdf> <live page html> <media out dir> <evidence/thumbs917.json> \
#        <evidence/derive917.json> [<evidence/derive917_add.json> ...]
#
# Same windows, sizes, ring and encoding as the pictures on the page now (make_master889 / make_thumbs893): close up
# 120.5 x 76.7 picture px (2600 px across the sheet) rendered at 771 x 491, ring radius 46, width 6; the area 571 x 373.5
# rendered at 937 x 613, ring 20, width 4; colour (214, 40, 40); WebP quality 80, method 6. The crop is centred on the
# unit's point on the 2 Oct paper itself, so the inset (CP1, WC81) needs no shift. The PDF is opened read only.
# Second round (8 Oct): every pin in every derive file given - the first 23 (their pictures come out byte for byte as
# before), the 28 near moves and GN18 / GN13 (which had no pictures; they get the same two, ringed on the generator).
import hashlib, io, json, re, sys
from pathlib import Path
import pymupdf as fitz
from PIL import Image, ImageDraw

PDF, PAGE, MEDIA, OUTJ = sys.argv[1:5]; DERS = sys.argv[5:]
assert DERS, 'give at least one derive json'
MEDIA = Path(MEDIA); MEDIA.mkdir(parents=True, exist_ok=True)
assert hashlib.sha256(Path(PDF).read_bytes()).hexdigest().startswith('8753d875'), 'not the 2 Oct master'
ROWS = {}
for f in DERS:
    D = json.loads(Path(f).read_text()); assert not D['fails'], (f, D['fails']); assert D['pdf_sha256'].startswith('8753d875')
    assert not set(ROWS) & set(D['rows']), 'a pin is in two derive files'
    ROWS.update(D['rows'])
s = Path(PAGE).read_text(encoding='utf-8')
m = re.search(r'const MASTER_LOC = ', s); ML, _ = json.JSONDecoder().raw_decode(s[m.end():])
W, PW = 2600, 2384.0; Z = W / PW
SPECS = (('close', 120.5, 76.7, 771, 491, 46, 6), ('context', 571.0, 373.5, 937, 613, 20, 4))
pg = fitz.open(PDF)[0]
pins, media = {}, []
for ref, r in ROWS.items():
    cx, cy = r['paper_pt']; shas = []
    for name, ww, hh, ow, oh, ring, lw in SPECS:
        w, h = ww / Z, hh / Z
        clip = fitz.Rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
        p = pg.get_pixmap(matrix=fitz.Matrix(ow / clip.width, oh / clip.height), clip=clip, alpha=False)
        im = Image.frombytes('RGB', (p.width, p.height), p.samples)
        if im.size != (ow, oh): im = im.resize((ow, oh), Image.LANCZOS)
        d = ImageDraw.Draw(im); d.ellipse((ow / 2 - ring, oh / 2 - ring, ow / 2 + ring, oh / 2 + ring), outline=(214, 40, 40), width=lw)
        b = io.BytesIO(); im.save(b, 'WEBP', quality=80, method=6); data = b.getvalue(); sha = hashlib.sha256(data).hexdigest()
        (MEDIA / (sha + '.webp')).write_bytes(data); shas.append(sha)
        media.append({'file': sha + '.webp', 'sha256': sha, 'type': 'image/webp', 'bytes': len(data), 'scope': 'view'})
    pins[ref] = {'img': shas, 'old_img': ML[ref].get('img') or [], 'centre_paper_pt': [cx, cy]}
assert len(media) == 2 * len(ROWS) and len({x['sha256'] for x in media}) == len(media), 'expected two distinct pictures per pin'
Path(OUTJ).write_text(json.dumps({'author': 'Andrew Fisher', 'what': 'v9.17 pin pictures re-made from the 2 Oct master, ring on the unit',
                                  'pdf_sha256': hashlib.sha256(Path(PDF).read_bytes()).hexdigest(), 'pins': pins, 'media': media}, indent=1))
print(len(pins), 'pins,', len(media), 'pictures,', sum(x['bytes'] for x in media), 'bytes')
