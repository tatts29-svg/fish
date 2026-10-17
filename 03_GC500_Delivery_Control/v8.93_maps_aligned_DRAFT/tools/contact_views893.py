# Author: Andrew Fisher. v8.93: one close view of the 2 Oct drawing for every overlay the page draws on the master, so each
# can be looked at; the 17 Sep drawing beside it where the pixels under the overlay changed.
#   python3 contact_views893.py views <overlay_audit893.json> <pt overrides json> <out views.json>
#   python3 contact_views893.py sheets <overlay_audit893.json> <pt overrides json> <new views dir> <old views dir> <out dir>
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
W, H, PW, PH = 2600, 1837, 2384.0, 1684.0
VW, VH, PX = 66.0, 44.0, 330            # view in sheet points (about 47 x 31 m) and its width in pixels (5 px per pt)
R6 = 6                                   # a change within 6 px (5.5 pt, 4 m) of the point is worth a second look
def items(audit, over):
    out = []
    for p in audit['pins']:
        pt = over.get(p['ref'], p['pt']); out.append(('pin', p['ref'], pt[0] * PW, pt[1] * PH, p['how'] or '', p['near_change']))
    for m in audit['d001_markers']: out.append(('d001', m['label'] + ' ' + m['kind'], m['fx'] * PW, m['fy'] * PH, '', m['near_change']))
    for v in audit['master_vms']: out.append(('vms', v['label'] + (' tip' if v['tip'] else ''), v['fx'] * PW, v['fy'] * PH, '', v['near_change']))
    for l in audit['master_layers']: out.append(('layer', '%d %s %s' % (l['i'], l['layer'], l['label']), l['fx'] * PW, l['fy'] * PH, l['src'] or '', l['near_change']))
    return out
mode, audit_path, over_path = sys.argv[1:4]
audit = json.load(open(audit_path)); over = json.load(open(over_path))
rows = items(audit, over)
if mode == 'views':
    views = []
    for i, (kind, label, x, y, how, near) in enumerate(rows):
        views.append({'name': 'v%03d' % i, 'x': round(x - VW / 2, 3), 'y': round(y - VH / 2, 3), 'w': VW, 'h': VH, 'px': PX, 'mode': 'original', 'white': True})
    Path(sys.argv[4]).write_text(json.dumps(views)); print(len(views), 'views')
else:
    new_dir, old_dir, out = Path(sys.argv[4]), Path(sys.argv[5]), Path(sys.argv[6]); out.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default()
    cw, ch = PX, round(PX * VH / VW); cols, per = 3, 18
    def cell(im, label, sub, colour):
        c = Image.new('RGB', (cw * 2 + 8, ch + 30), 'white'); d = ImageDraw.Draw(c)
        for j, p in enumerate(im):
            if p is None: continue
            c.paste(p, (j * (cw + 8), 30)); x0, y0 = j * (cw + 8) + cw / 2, 30 + ch / 2
            d.line((x0 - 14, y0, x0 + 14, y0), fill=colour, width=2); d.line((x0, y0 - 14, x0, y0 + 14), fill=colour, width=2)
            d.ellipse((x0 - 9, y0 - 9, x0 + 9, y0 + 9), outline=colour, width=2)
        d.text((4, 2), label, fill='black', font=font); d.text((4, 15), sub[:90], fill=(90, 90, 90), font=font)
        return c
    pages = []
    for i, (kind, label, x, y, how, near) in enumerate(rows):
        n = Image.open(new_dir / ('v%03d.png' % i)).convert('RGB'); o = Image.open(old_dir / ('v%03d.png' % i)).convert('RGB') if near else None
        pages.append((kind, cell([n, o], '%s  %s  (2 Oct%s)' % (kind, label, ' | 17 Sep' if o is not None else ''), how, (214, 40, 40) if kind == 'pin' else (20, 90, 200))))
    for k, kind in enumerate(('pin', 'd001', 'vms', 'layer')):
        cells = [c for kk, c in pages if kk == kind]
        for p in range(0, len(cells), per):
            chunk = cells[p:p + per]; rows_n = (len(chunk) + cols - 1) // cols
            sheet = Image.new('RGB', (cols * (cw * 2 + 16), rows_n * (ch + 36)), (235, 235, 235))
            for j, c in enumerate(chunk): sheet.paste(c, ((j % cols) * (cw * 2 + 16), (j // cols) * (ch + 36)))
            sheet.save(out / ('%s_%02d.png' % (kind, p // per + 1)))
        print(kind, len(cells), 'cells,', (len(cells) + per - 1) // per, 'pages')
