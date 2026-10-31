# Author: Andrew Fisher. v8.93: every master pin that marks a unit tag, read against the tag text on the 2 Oct sheet (and the
# 17 Sep sheet beside it). The labels come from the explorer scenes: text boxes in sheet points, same frame as the page picture.
#   python3 check_labels893.py <page html> <17 Sep source-labels.json> <2 Oct source-labels.json> <out json>
import json, re, sys
from pathlib import Path
PAGE, OLD, NEW, OUT = sys.argv[1:5]
W, H = 2384.0, 1684.0; M_PER_PT = 0.7056
s = Path(PAGE).read_text()
m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); ML, _ = json.JSONDecoder().raw_decode(s[m.end():])
m = re.search(r'const MASTER_LAYERS = ', s); LAYERS, _ = json.JSONDecoder().raw_decode(s[m.end():])
def load(p): return [(t.strip().upper(), x0, y0, x1, y1) for t, x0, y0, x1, y1 in json.load(open(p))]
old, new = load(OLD), load(NEW)
def nearest(labels, text, pt):
    x, y = pt[0] * W, pt[1] * H
    cands = [l for l in labels if l[0] == text]
    if not cands: return None
    def dist(l):   # distance from the point to the box (0 inside)
        dx = max(l[1] - x, 0, x - l[3]); dy = max(l[2] - y, 0, y - l[4]); return (dx * dx + dy * dy) ** 0.5
    l = min(cands, key=dist); dx = (l[1] + l[3]) / 2 - x; dy = (l[2] + l[4]) / 2 - y
    return {'box': [round(v, 2) for v in l[1:]], 'to_box_pt': round(dist(l), 2), 'inside': dist(l) == 0, 'centre_offset_pt': [round(dx, 2), round(dy, 2)], 'candidates': len(cands)}
def text_for(ref, how):
    how = str(how)
    if how.startswith('tag on the unit'): return ref.upper()
    m = re.match(r'^(?:the )?(.+?) label on the master', how)
    if m: return m.group(1).upper()
    return None
out = {'author': 'Andrew Fisher', 'pins': []}
for ref, v in ML.items():
    text = text_for(ref, v.get('how')); row = {'ref': ref, 'pt': v['pt'], 'how': v.get('how'), 'label_text': text}
    if text:
        row['on_17_sep'] = nearest(old, text, v['pt']); row['on_2_oct'] = nearest(new, text, v['pt'])
    out['pins'].append(row)
checked = [r for r in out['pins'] if r['label_text']]
def state(r, k):
    n = r.get(k); return 'no label' if not n else ('on it' if n['inside'] else '%.1f pt (%.1f m) off' % (n['to_box_pt'], n['to_box_pt'] * M_PER_PT))
off = [r for r in checked if not (r['on_2_oct'] and r['on_2_oct']['inside'])]
out['summary'] = {'pins': len(ML), 'with_label_text': len(checked), 'on_their_2_oct_label': len(checked) - len(off),
                  'not_on_a_2_oct_label': [{'ref': r['ref'], 'text': r['label_text'], '17_sep': state(r, 'on_17_sep'), '2_oct': state(r, 'on_2_oct')} for r in off]}
Path(OUT).write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(json.dumps(out['summary'], ensure_ascii=False, indent=1))
# labels the layers point at (entry points E.P, gates G1.., screens...) are symbols, not text; only the text ones are checked here
