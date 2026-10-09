# Author: Andrew Fisher. v8.93: the two pictures every master pin carries (close-up and context), re-made from the aligned
# 2 Oct scene by the explorer's own renderer, so they show the same drawing in the same frame as the page picture and the
# explorer. Same crop windows and red ring as make_master889 (close: 120.5 x 76.7 picture px at 6.4x; context: 571 x 373.5 at
# 1.64x). WC32 keeps its 17 Sep pictures: the 2 Oct issue does not draw it, as its card says.
#   python3 make_thumbs893.py views   <page html> <pt overrides json> <out views.json>
#   python3 make_thumbs893.py compose <page html> <pt overrides json> <views.json> <renders dir> <out media dir> <out thumbs893.json>
import hashlib, io, json, re, sys
from pathlib import Path
from PIL import Image, ImageDraw
W, H, PW, PH = 2600, 1837, 2384.0, 1684.0
SPECS = (('close', 120.5, 76.7, 771, 491, 46, 6), ('context', 571.0, 373.5, 937, 613, 20, 4))
KEEP_OLD = {'WC32'}
mode, PAGE, OVER = sys.argv[1:4]
s = Path(PAGE).read_text()
m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); ML, _ = json.JSONDecoder().raw_decode(s[m.end():])
over = json.load(open(OVER))
pins = [(ref, over.get(ref, v['pt'])) for ref, v in ML.items() if v.get('img') and ref not in KEEP_OLD]
if mode == 'views':
    views = []
    for ref, pt in pins:
        cx, cy = pt[0] * PW, pt[1] * PH
        for name, ww, hh, ow, oh, r, lw in SPECS:
            w, h = ww * PW / W, hh * PH / H
            views.append({'name': ref + '-' + name, 'x': round(cx - w / 2, 4), 'y': round(cy - h / 2, 4), 'w': round(w, 4), 'h': round(h, 4), 'px': ow, 'mode': 'original', 'white': True})
    Path(sys.argv[4]).write_text(json.dumps(views)); print(len(pins), 'pins,', len(views), 'views')
else:
    VIEWS, REN, MEDIA, OUTJ = sys.argv[4:8]; REN, MEDIA = Path(REN), Path(MEDIA); MEDIA.mkdir(parents=True, exist_ok=True)
    thumbs, media = {}, []
    for ref, pt in pins:
        shas = []
        for name, ww, hh, ow, oh, r, lw in SPECS:
            im = Image.open(REN / (ref + '-' + name + '.png')).convert('RGB')
            if im.size != (ow, oh): im = im.resize((ow, oh), Image.LANCZOS)
            d = ImageDraw.Draw(im); d.ellipse((ow / 2 - r, oh / 2 - r, ow / 2 + r, oh / 2 + r), outline=(214, 40, 40), width=lw)
            b = io.BytesIO(); im.save(b, 'WEBP', quality=80, method=6); data = b.getvalue(); sha = hashlib.sha256(data).hexdigest()
            (MEDIA / (sha + '.webp')).write_bytes(data); shas.append(sha)
            media.append({'file': sha + '.webp', 'sha256': sha, 'type': 'image/webp', 'bytes': len(data), 'scope': 'view'})
        thumbs[ref] = {'pt': pt, 'img': shas, 'old_img': ML[ref]['img']}
    Path(OUTJ).write_text(json.dumps({'author': 'Andrew Fisher', 'what': 'pin pictures re-made from the aligned 2 Oct scene', 'kept_17_sep_pictures': sorted(KEEP_OLD),
                                      'pins': thumbs, 'media': media}, ensure_ascii=False, indent=1))
    print(len(thumbs), 'pins,', len(media), 'pictures,', sum(x['bytes'] for x in media), 'bytes')
