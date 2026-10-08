#!/usr/bin/env python3
"""v8.96: the equipment atlas staged in v8.81 (one 1774 x 887 PNG, 2.7 MB: eight rendered pictures in a 4 x 2 grid) cut into
eight WebP pictures sized for the cards, each named by its SHA-256 like every other hosted picture, plus atlas896.json: the
list the patch registers in the page's media table and the test serves locally until the files are on the service.

    python3 make_atlas896.py        # from this folder; writes assets/<sha256>.webp x 8 and atlas896.json

The grid lines are read off the picture (white columns at x 442-444, 885-888, 1329-1332; white row at y 441-444), and each
cell is cut 4 px inside them so no white edge is carried. Top row: Buildings, Toilets, Fencing, Generators; bottom row:
Lighting, VMS boards, Equipment (the forklift) and the yard with everything in it, which sits behind the Where we are plate.
Needs Pillow built with WebP. Author: Andrew Fisher."""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'v8.81_progress_scene_DRAFT' / 'assets' / 'equipment-atlas.png'
OUT = HERE / 'assets'
QUALITY = 58          # photographic WebP; about 19 KB a picture at the cell's own size, which is all a faint background needs
COLS = [(0, 441), (445, 884), (889, 1328), (1333, 1773)]
ROWS = [(0, 440), (445, 886)]
IDS = [['buildings', 'toilets', 'fencing', 'generators'], ['lighting', 'vms', 'equipment', 'yard']]
NAMES = {'buildings': 'Buildings', 'toilets': 'Toilets', 'fencing': 'Fencing', 'generators': 'Generators', 'lighting': 'Lighting',
         'vms': 'VMS boards', 'equipment': 'Equipment', 'yard': 'The yard (behind the Where we are plate)'}


def main():
    src = SOURCE.read_bytes()
    im = Image.open(SOURCE).convert('RGB')
    assert im.size == (1774, 887), im.size
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob('*.webp'):
        old.unlink()
    cells = []
    for r, (y0, y1) in enumerate(ROWS):
        for c, (x0, x1) in enumerate(COLS):
            box = (x0 + 4, y0 + 4, x1 - 3, y1 - 3)
            cell = im.crop(box)
            tmp = OUT / ('cell_%d_%d.webp' % (r, c))
            cell.save(tmp, 'WEBP', quality=QUALITY, method=6)
            data = tmp.read_bytes(); sha = hashlib.sha256(data).hexdigest()
            final = OUT / (sha + '.webp'); tmp.rename(final)
            cells.append({'id': IDS[r][c], 'name': NAMES[IDS[r][c]], 'cell': list(box), 'px': list(cell.size),
                          'file': sha + '.webp', 'sha256': sha, 'type': 'image/webp', 'bytes': len(data), 'scope': 'view'})
    meta = {'what': 'v8.96 equipment pictures for the Today group cards and the Where we are plate, cut from the staged v8.81 atlas',
            'source': {'file': str(SOURCE.relative_to(HERE.parent)), 'sha256': hashlib.sha256(src).hexdigest(), 'bytes': len(src), 'px': list(im.size)},
            'quality': QUALITY, 'cells': cells, 'total_bytes': sum(c['bytes'] for c in cells)}
    (HERE / 'atlas896.json').write_text(json.dumps(meta, indent=1, ensure_ascii=False) + '\n')
    for c in cells:
        print('%-11s %dx%d %6d bytes  %s' % (c['id'], c['px'][0], c['px'][1], c['bytes'], c['sha256'][:16]))
    print('total', meta['total_bytes'], 'bytes in', len(cells), 'pictures ->', OUT)


if __name__ == '__main__':
    sys.exit(main())
