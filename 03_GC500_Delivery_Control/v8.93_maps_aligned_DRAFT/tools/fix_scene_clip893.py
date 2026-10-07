# Author: Andrew Fisher. v8.93: the main plan's window clip follows its content. v8.90 moved the 2 Oct drawing 25.5 pt back
# onto the 17 Sep frame but left the window clip where the paper draws it, so text and lines that the 2 Oct paper cuts at
# the window's western edge spilled into the 25.5 pt strip the new sheet no longer shows (162 records: HOUSE tags, ALOHA LN
# and a few lines). The clip's western edge moves with the content, from 49.46 pt to 74.96 pt (591 -> 1016 on the plot
# grid of 0.06 pt); its other three edges and every other window (inset, legend, border) stay as they are.
#   python3 fix_scene_clip893.py <v8.90 drawing-scene.bin> <out drawing-scene.bin> <out report json>
import gzip, hashlib, json, re, sys
SRC, OUT, REP = sys.argv[1:4]
raw = gzip.decompress(open(SRC, 'rb').read()); S = json.loads(raw)
assert json.dumps(S, separators=(',', ':')).encode('utf-8') == raw, 'the scene must round-trip before it is edited'
MAIN = re.compile(r'^M24244 (\d+)V(\d+)H38667V(\d+)H591V(\d+)H24244$')
LIKE = re.compile(r'^M24244 \d+V\d+H38667V\d+H\d+V\d+H24244$')   # the main window's L shape, whatever its west edge
n = like = 0
for k, d in S['d'].items():
    if not k.startswith('clip'): continue
    m = re.search(r' d="([^"]+)"', d[0])
    if m and LIKE.match(m.group(1)): like += 1
    if m and MAIN.match(m.group(1)):
        S['d'][k][0] = d[0].replace(m.group(1), m.group(1).replace('H591V', 'H1016V')); n += 1
assert n == like and n > 1000, (n, like)      # every copy of the window clip, and nothing else
S['meta']['window_clip'] = 'v8.93: the main plan window clips its content at 74.96 pt on this frame (the 2 Oct paper shows 9 mm less of the west); the frame lines stay where the paper draws them'
js = json.dumps(S, separators=(',', ':')).encode('utf-8'); gz = gzip.compress(js, 9, mtime=0)
open(OUT, 'wb').write(gz)
rep = {'author': 'Andrew Fisher', 'source_sha256': hashlib.sha256(open(SRC, 'rb').read()).hexdigest(), 'sha256': hashlib.sha256(gz).hexdigest(), 'bytes': len(gz),
       'clips_moved': n, 'west_edge_pt': {'was': 0.06 * 591 + 14, 'now': 0.06 * 1016 + 14}, 'records': len(S['r'])}
json.dump(rep, open(REP, 'w'), indent=1); print(json.dumps(rep))
