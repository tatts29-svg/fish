# Author: Andrew Fisher. v8.93: the tiles of the pyramid that cover the main plan's western edge (frame x 49..76 pt), as
# views for render_tiles.cjs, named so they drop straight into the v8.90 render tree (L<L>/<tx>_<ty>.png). Every other
# tile is unchanged by the window-clip fix, so only these are rendered again.
#   python3 strip_tiles893.py <levels.json of the v8.90 render> <out views.json> <render dir to prepare>
import json, os, sys
LEVELS, OUT, REN = sys.argv[1:4]
VT, W, H = 512, 2384, 1684; X0, X1 = 49.0, 76.5
views = []
for lv in json.load(open(LEVELS)):
    L, s = lv['L'], lv['scale']; span = VT / s
    nx, ny = lv['nx'], lv['ny']
    os.makedirs(os.path.join(REN, 'L%g' % L), exist_ok=True)
    for tx in range(nx):
        if tx * span >= X1 or (tx + 1) * span <= X0: continue
        for ty in range(ny):
            views.append({'name': 'L%g/%d_%d' % (L, tx, ty), 'x': tx * span, 'y': ty * span, 'w': span, 'h': span, 'px': VT, 'mode': 'hybrid', 'white': False})
json.dump(views, open(OUT, 'w')); print(len(views), 'tiles across', len(set(v['name'].split('/')[0] for v in views)), 'levels')
