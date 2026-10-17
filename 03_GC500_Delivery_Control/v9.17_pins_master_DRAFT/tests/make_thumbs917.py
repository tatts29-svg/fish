# Author: Andrew Fisher. v9.17 - the two pictures each moved pin carries (close up and the area), re-made from the 2 Oct
# master with the red ring on the unit (the new point), not on the label.
#
#   python3 -I tests/make_thumbs917.py <D001-26003-03-MASTER.pdf> <live page html> <media out dir> <evidence/thumbs917.json> \
#        <georeferencing.json> <evidence/derive917.json> [<evidence/derive917_add.json> ...]
#
# Same windows, sizes, ring and encoding as the pictures on the page now (make_master889 / make_thumbs893): close up
# 120.5 x 76.7 picture px (2600 px across the sheet) rendered at 771 x 491, ring radius 46, width 6; the area 571 x 373.5
# rendered at 937 x 613, ring 20, width 4; colour (214, 40, 40); WebP quality 80, method 6. The crop is centred on the
# unit's point on the 2 Oct paper itself, so the inset (CP1, WC81) needs no shift. The PDF is opened read only.
# Second round (8 Oct): every pin in every derive file given - the first 23, the 28 near moves, GN18 / GN13 (which had no
# pictures; they get the same two, ringed on the generator) and the four answered.
#
# The edge (9 Oct, after the independent check): a window may run past what its drawing covers. A main-plan window is
# bounded by the sheet (0..2384 x 0..1684 pt); an inset window (CP1, WC81) by the inset's own frame on the sheet
# (georeferencing.json inset.sheet_region_pts) - past it is the sheet margin or the main plan at another scale, not the
# inset. pymupdf renders only the part inside, so stretching that part to the full picture size moved the ring off the unit
# (11 area pictures, 7-54 m). Now: a window wholly inside is rendered exactly as before (so those pictures are byte for byte
# the same); a window that runs past has its inside part rendered at the full window's scale and pasted onto a white
# canvas of the full picture size at its own offset - no resize - so the paper keeps its shape and the ring, at the
# picture's centre, is on the unit. The live page's own pictures are padded white past the edge the same way.
import hashlib, io, json, re, sys
from pathlib import Path
import pymupdf as fitz
from PIL import Image, ImageDraw

PDF, PAGE, MEDIA, OUTJ, GEOP = sys.argv[1:6]; DERS = sys.argv[6:]
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
GEO = json.loads(Path(GEOP).read_text()); assert GEO['pdf_sha256'].startswith('8753d875')
INSET = fitz.Rect(*GEO['inset']['sheet_region_pts'])
SPECS = (('close', 120.5, 76.7, 771, 491, 46, 6), ('context', 571.0, 373.5, 937, 613, 20, 4))
pg = fitz.open(PDF)[0]; SHEET = fitz.Rect(pg.rect); assert (SHEET.width, SHEET.height) == (2384, 1684)
def render(clip, region, ow, oh):
    """the window `clip` (pt) as an ow x oh picture; only what lies inside `region` is drawn, white past it"""
    # wholly inside (compared in Python floats: pymupdf's intersection comes back in single precision): exactly as before
    if region.x0 <= clip.x0 and clip.x1 <= region.x1 and region.y0 <= clip.y0 and clip.y1 <= region.y1:
        p = pg.get_pixmap(matrix=fitz.Matrix(ow / clip.width, oh / clip.height), clip=clip, alpha=False)
        im = Image.frombytes('RGB', (p.width, p.height), p.samples)
        if im.size != (ow, oh): im = im.resize((ow, oh), Image.LANCZOS)
        return im, None
    sx, sy = ow / clip.width, oh / clip.height   # the full window's scale, both ways
    inner = fitz.Rect(max(clip.x0, region.x0), max(clip.y0, region.y0), min(clip.x1, region.x1), min(clip.y1, region.y1))
    im = Image.new('RGB', (ow, oh), 'white')
    if inner.is_empty: return im, {'inside_frac': 0.0}
    p = pg.get_pixmap(matrix=fitz.Matrix(sx, sy), clip=inner, alpha=False)
    part = Image.frombytes('RGB', (p.width, p.height), p.samples)
    off = (round(p.x - clip.x0 * sx), round(p.y - clip.y0 * sy))   # where the inside part sits in the full window
    im.paste(part, off)
    return im, {'inside_frac': round(inner.get_area() / clip.get_area(), 3), 'offset_px': list(off), 'part_px': [p.width, p.height],
                'scale_px_per_pt': [round(sx, 5), round(sy, 5)]}
pins, media, padded = {}, [], {}
for ref, r in ROWS.items():
    cx, cy = r['paper_pt']; shas = []
    inset = bool(r.get('inset')); assert inset == INSET.contains(fitz.Point(cx, cy)), ref + ': inset flag disagrees with the inset frame'
    region = INSET if inset else SHEET
    for name, ww, hh, ow, oh, ring, lw in SPECS:
        w, h = ww / Z, hh / Z
        clip = fitz.Rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
        # a main-plan window must not take in the inset (another scale): none of the 57 does; refuse if one ever would
        assert inset or not (clip & INSET).get_area() > 0, ref + ' ' + name + ': the window runs into the inset'
        im, pad = render(clip, region, ow, oh)
        if pad: padded.setdefault(ref, {})[name] = dict(pad, region='inset frame' if inset else 'sheet')
        d = ImageDraw.Draw(im); d.ellipse((ow / 2 - ring, oh / 2 - ring, ow / 2 + ring, oh / 2 + ring), outline=(214, 40, 40), width=lw)
        b = io.BytesIO(); im.save(b, 'WEBP', quality=80, method=6); data = b.getvalue(); sha = hashlib.sha256(data).hexdigest()
        (MEDIA / (sha + '.webp')).write_bytes(data); shas.append(sha)
        media.append({'file': sha + '.webp', 'sha256': sha, 'type': 'image/webp', 'bytes': len(data), 'scope': 'view'})
    pins[ref] = {'img': shas, 'old_img': ML[ref].get('img') or [], 'centre_paper_pt': [cx, cy]}
assert len(media) == 2 * len(ROWS) and len({x['sha256'] for x in media}) == len(media), 'expected two distinct pictures per pin'
Path(OUTJ).write_text(json.dumps({'author': 'Andrew Fisher', 'what': 'v9.17 pin pictures re-made from the 2 Oct master, ring on the unit',
                                  'pdf_sha256': hashlib.sha256(Path(PDF).read_bytes()).hexdigest(), 'edge_rule': 'a window past the sheet (main) or the inset frame (CP1, WC81) is padded white at the full window scale, not stretched',
                                  'padded_past_the_edge': padded, 'pins': pins, 'media': media}, indent=1))
print(len(pins), 'pins,', len(media), 'pictures,', sum(x['bytes'] for x in media), 'bytes; padded past the edge:',
      ', '.join('%s %s' % (k, '+'.join(v)) for k, v in padded.items()) or 'none')
