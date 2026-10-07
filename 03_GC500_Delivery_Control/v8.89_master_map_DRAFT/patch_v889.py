# Author: Andrew Fisher. v8.89: the master is now D001-26003-03 issued 2 Oct (Andrew, 7 Oct: "this is to over write the current master").
# The 2 Oct sheet is laid over the live picture's frame (the drawing sits 9 mm further left on the new paper), so the fencing
# geometry and 157 pins traced on the 17 Sep issue stay exact. Pins the new issue moves are re-read off it.
# Needs changes889.json beside this file (made by make_master889.py) and the new media uploaded before release.
import json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text()
C = json.loads((here / 'changes889.json').read_text())
OLD_SHEET = 'd0df399ee0f4adb179772cddaec164db1be0c026aac10473883d1211a5afc567'
assert C['sheet_media']['sha256'] not in s and s.count(OLD_SHEET) >= 2

# footer: whichever release this follows (v8.85 to v8.88)
f = re.findall(r' · v8\.8[5-8]\b', s); assert len(f) == 1, f
s = rep(s, f[0], ' · v8.89', 'release footer', str(p))

# 1. DATA: the sheet picture, its media, the drawing register entry
m = re.search(r'const DATA = (\{.*?\});\n', s); assert m
D = json.loads(m.group(1))
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == m.group(1), 'DATA must round-trip exactly'
d1 = next(x for x in D['sheets'] if x['key'] == 'D001')
assert d1['src'] == {'media': OLD_SHEET} and d1['sheet_id'] == 'D001-26003-03'
d1['src'] = {'media': C['sheet_media']['sha256']}
d1['subtitle'] = 'D001-26003-03 · Master Layout Plan — General Arrangement · issued 2 Oct'
for item in C['media']:
    D['media'][item['sha256']] = {k: item[k] for k in ('file', 'sha256', 'type', 'bytes', 'scope')}
register = []
def walk(o):
    if isinstance(o, dict):
        if o.get('id') == 'D001-26003-03-MASTER.pdf' and o.get('kind') == 'map': register.append(o)
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(D); assert len(register) == 1, len(register)
r = register[0]; assert r['sha256'] == C['old_master_sha256']
r.update({'sha256': C['pdf_sha256'], 'bytes': C['pdf_bytes'], 'issued': '2026-10-02',
          'replaces': {'sha256': C['old_master_sha256'], 'issued': '2026-09-17', 'note': 'same drawing 9 mm further right on the paper; fencing traced on it still fits'}})
data_text = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
s = s[:m.start(1)] + data_text + s[m.end(1):]

# 2. MASTER_LOC: moved, new, inset and single-tag references
m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); assert m
ML, end = json.JSONDecoder().raw_decode(s[m.end():])
orig = s[m.end():m.end() + end]
fmt = next((f for f in (dict(ensure_ascii=a, separators=sep) for a in (True, False) for sep in ((',', ':'), (', ', ': ')))
            if json.dumps(ML, **f) == orig), None)
assert fmt, 'MASTER_LOC must round-trip exactly'
OLD_LOC = json.loads(json.dumps(ML))
for ref, v in C['master_loc'].items():
    ML[ref] = v
s = s[:m.end()] + json.dumps(ML, **fmt) + s[m.end() + end:]

# 3. old pictures no one uses any more leave the media list (the service checks every page against the media it holds)
m = re.search(r'const DATA = (\{.*?\});\n', s); D = json.loads(m.group(1)); dropped = []
old_imgs = [x for ref in C['master_loc'] for x in (OLD_LOC.get(ref, {}).get('img') or [])]
for sha in [OLD_SHEET] + old_imgs:
    if sha in D["media"] and s.count(sha) == 3:          # only its own media entry names it: key, file and sha256
        D['media'].pop(sha); dropped.append(sha)
# 4. the media manifest the service checks every page against (canonical form as the service computes it)
import hashlib
def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
assets = sorted(({k: x[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for x in D['media'].values()), key=lambda x: x['file'])
body = {'schema': 'gc500-media-v1', 'assets': assets}; manifest = dict(body, sha256=hashlib.sha256(canonical(body).encode('utf-8')).hexdigest())
D['hostedMedia']['manifest'] = manifest['sha256']
(p.parent / 'media_manifest_v889.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
s = s[:m.start(1)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
p.write_text(s)
print('v8.89 master: sheet', C['sheet_media']['sha256'][:12], '| media +', len(C['media']), '| pins', len(C['master_loc']), '| dropped', len(dropped), '| manifest', manifest['sha256'][:12], len(assets))
