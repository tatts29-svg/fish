# Author: Andrew Fisher. v8.93: every map works off the 2 Oct master, aligned the same way everywhere (Andrew, 8 Oct 2026:
# "We need to make sure the maps works off the new master and everything is aligned correctly").
# Data only. The page picture of the master is re-made from the explorer's aligned 2 Oct scene (same drawing, same frame as
# the explorer: the inset, legend and border stay where the 17 Sep picture had them, so the three inset pins go back to their
# 17 Sep positions), and every pin's two pictures are re-made from that scene. No navigation pin (ll), link or direction moves.
# Needs changes893.json beside this file (made by make_changes893.py) and the new media uploaded before release.
import json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text()
C = json.loads((here / 'changes893.json').read_text())
PREV_SHEET = C['previous_sheet_sha256']                      # v8.89's picture (the 2 Oct render pasted 28 px right)
assert C['sheet_media']['sha256'] not in s and s.count(PREV_SHEET) >= 2, 'expects the v8.89 page'

# footer: the release this follows (v8.89 straight after, or v8.91 / v8.92 if they go first)
f = re.findall(r' · v8\.(?:89|91|92)\b', s); assert len(f) == 1, f
s = rep(s, f[0], ' · v8.93', 'release footer', str(p))

# 1. DATA: the sheet picture and the media list
m = re.search(r'const DATA = (\{.*?\});\n', s); assert m
D = json.loads(m.group(1))
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == m.group(1), 'DATA must round-trip exactly'
d1 = next(x for x in D['sheets'] if x['key'] == 'D001')
assert d1['src'] == {'media': PREV_SHEET} and d1['sheet_id'] == 'D001-26003-03' and 'issued 2 Oct' in d1['subtitle']
d1['src'] = {'media': C['sheet_media']['sha256']}
for item in C['media']:
    D['media'][item['sha256']] = {k: item[k] for k in ('file', 'sha256', 'type', 'bytes', 'scope')}
s = s[:m.start(1)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]

# 2. MASTER_LOC: drawing positions (pt) and pictures (img) only; ll, how, near, next, beside, prec untouched
m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); assert m
ML, end = json.JSONDecoder().raw_decode(s[m.end():])
orig = s[m.end():m.end() + end]
fmt = next((f for f in (dict(ensure_ascii=a, separators=sep) for a in (True, False) for sep in ((',', ':'), (', ', ': ')))
            if json.dumps(ML, **f) == orig), None)
assert fmt, 'MASTER_LOC must round-trip exactly'
OLD_LOC = json.loads(json.dumps(ML))
for ref, ch in C['master_loc'].items():
    v = ML[ref]
    if 'pt' in ch:
        assert v['pt'] == ch['pt_was'], (ref, v['pt'], ch['pt_was']); v['pt'] = ch['pt']
    if 'img' in ch:
        assert v.get('img') == ch['img_was'], (ref, v.get('img'), ch['img_was']); v['img'] = ch['img']
    assert v['ll'] == OLD_LOC[ref]['ll']
s = s[:m.end()] + json.dumps(ML, **fmt) + s[m.end() + end:]

# 3. pictures no one uses any more leave the media list; 4. the manifest the service checks the page against
m = re.search(r'const DATA = (\{.*?\});\n', s); D = json.loads(m.group(1)); dropped = []
old_imgs = [x for ref, ch in C['master_loc'].items() for x in (ch.get('img_was') or [])]
for sha in [PREV_SHEET] + old_imgs:
    if sha in D['media'] and s.count(sha) == 3:          # only its own media entry names it: key, file and sha256
        D['media'].pop(sha); dropped.append(sha)
import hashlib
def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
assets = sorted(({k: x[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for x in D['media'].values()), key=lambda x: x['file'])
body = {'schema': 'gc500-media-v1', 'assets': assets}; manifest = dict(body, sha256=hashlib.sha256(canonical(body).encode('utf-8')).hexdigest())
D['hostedMedia']['manifest'] = manifest['sha256']
(p.parent / 'media_manifest_v893.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
s = s[:m.start(1)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
p.write_text(s)
print('v8.93 maps aligned: sheet', C['sheet_media']['sha256'][:12], '| media +', len(C['media']), '| pins', len(C['master_loc']), '| dropped', len(dropped), '| manifest', manifest['sha256'][:12], len(assets))
