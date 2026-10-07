# Author: Andrew Fisher. v8.93 explorer code: the v8.90-patched files (machine_code_v887_v890) with the asset cache token
# moved from the v8.90 scene to the v8.93 scene. Nothing else in the code changes.
#   python3 patch_explorer893.py <v8.87+v8.90 code dir> <v8.93 assets dir> <out code dir>
import hashlib, json, re, shutil, sys
from pathlib import Path
SRC, ASSETS, OUT = (Path(p) for p in sys.argv[1:4]); OUT.mkdir(parents=True, exist_ok=True)
prepared = json.loads((SRC / 'prepared890.json').read_text())
old_tok = prepared['token'] if 'token' in prepared else None
scene = (ASSETS / 'drawing-scene.bin').read_bytes(); new_tok = hashlib.sha256(scene).hexdigest()[:12]
if not old_tok:
    toks = set(re.findall(r'\?v=([0-9a-f]{12})', (SRC / 'explorer.js').read_text())); assert len(toks) == 1, toks; old_tok = toks.pop()
assert old_tok != new_tok
out = {'author': 'Andrew Fisher', 'from_token': old_tok, 'token': new_tok, 'scene_sha256': hashlib.sha256(scene).hexdigest(), 'files': {}}
total = 0
for p in sorted(SRC.iterdir()):
    if not p.is_file() or p.name.startswith('prepared'): continue
    b = p.read_bytes()
    if p.suffix in ('.js', '.html', '.css'):
        t = b.decode('utf-8'); n = t.count('?v=' + old_tok); t = t.replace('?v=' + old_tok, '?v=' + new_tok); b = t.encode('utf-8'); total += n
    else: n = 0
    (OUT / p.name).write_bytes(b); out['files'][p.name] = {'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b), 'tokens_replaced': n}
assert total >= 8, total
(OUT / 'prepared893.json').write_text(json.dumps(out, indent=1))
print('token', old_tok, '->', new_tok, '| replaced', total, 'in', sum(1 for f in out['files'].values() if f['tokens_replaced']), 'files |', len(out['files']), 'files written')
