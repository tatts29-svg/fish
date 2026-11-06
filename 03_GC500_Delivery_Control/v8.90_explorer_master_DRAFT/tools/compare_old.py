# Author: Andrew Fisher. Does the converter reproduce the live scene from the 17 Sep PDF? Record-level proof.
#   python3 compare_old.py <17 Sep PDF> <live drawing-scene.bin>
import sys, os, gzip, json, time, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mupdf_scene as MS
import pymupdf as fitz
PDF, LIVE = sys.argv[1], sys.argv[2]
t = time.time()
P = json.load(gzip.open(LIVE)); print('live scene loaded', round(time.time() - t, 1), 's')
doc = fitz.open(PDF); pg = doc[0]
svg = pg.get_svg_image(text_as_path=True); print('svg', len(svg))
t = time.time(); par = MS.parse_svg(svg); print('parsed', len(par['records']), 'records', len(par['contexts']), 'contexts', len(par['defs']), 'defs in', round(time.time() - t, 1), 's')
S = MS.build_scene(par, P['labels'], P['meta'])
print('records live/new', len(P['r']), len(S['r']), 'styles', len(P['s']), len(S['s']), 'contexts', len(P['c']), len(S['c']), 'defs', len(P['d']), len(S['d']))
n = min(len(P['r']), len(S['r']))
same_d = sum(1 for i in range(n) if P['r'][i][6] == S['r'][i][6])
same_ctx = sum(1 for i in range(n) if P['r'][i][4] == S['r'][i][4])
same_style = sum(1 for i in range(n) if P['r'][i][5] == S['r'][i][5])
same_bbox = sum(1 for i in range(n) if P['r'][i][:4] == S['r'][i][:4])
close_bbox = sum(1 for i in range(n) if all(abs(a - b) <= 0.011 for a, b in zip(P['r'][i][:4], S['r'][i][:4])))
print('same d', same_d, 'same ctx', same_ctx, 'same style idx', same_style, 'same bbox', same_bbox, 'bbox within 0.01', close_bbox)
# style strings
ss = sum(1 for i in range(min(len(P['s']), len(S['s']))) if P['s'][i] == S['s'][i]); print('identical style entries', ss)
cs = sum(1 for i in range(min(len(P['c']), len(S['c']))) if P['c'][i] == S['c'][i]); print('identical context entries', cs)
ds = sum(1 for k in P['d'] if k in S['d'] and P['d'][k] == S['d'][k]); print('identical defs', ds, 'def order same', list(P['d']) == list(S['d']))
print('grid identical', P['grid'] == S['grid'], 'broad identical', P['broad'] == S['broad'], 'nx ny cell', (P['nx'], P['ny'], P['cell']) == (S['nx'], S['ny'], S['cell']))
# where bboxes differ: show a few with the style
diff = [i for i in range(n) if P['r'][i][:4] != S['r'][i][:4]]
cnt = collections.Counter()
for i in diff[:20000]:
    r = P['r'][i]; st = P['s'][r[5]][0] if r[5] >= 0 else 'image'
    dv = tuple(round(a - b, 2) for a, b in zip(P['r'][i][:4], S['r'][i][:4]))
    cnt[(st[:70], dv)] += 1
for k, v in cnt.most_common(12): print(v, k)
for i in diff[:5]: print(i, P['r'][i][:6], S['r'][i][:6], P['r'][i][6][:60])
# byte-level: json
js = MS.dumps(S); raw = gzip.open(LIVE).read()
print('json bytes live/new', len(raw), len(js), 'identical json:', raw == js.encode('utf-8'))
if raw != js.encode('utf-8'):
    # first difference
    a = raw.decode('utf-8'); j = 0
    while j < min(len(a), len(js)) and a[j] == js[j]: j += 1
    print('first diff at', j, repr(a[max(0, j - 80):j + 120]), '|||', repr(js[max(0, j - 80):j + 120]))
