"""Author: Andrew Fisher. Bound media extraction and prove record/quality preservation."""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from patch_v1200 import MEDIA, canonical

base, page = [Path(p).read_text() for p in sys.argv[1:3]]
output = Path(sys.argv[2]).parent
checks = []


def check(name, ok):
    checks.append(dict(name=name, ok=bool(ok)))
    assert ok, name


def data(text):
    start = text.index('const DATA = ') + 13
    return json.JSONDecoder().raw_decode(text[start:])[0]


a, b = data(base), data(page)
manifest = json.loads((output / 'media1200-manifest.json').read_text())
extracted = json.loads((output / 'media1200-extracted.json').read_text())
am, bm = a.pop('media'), b.pop('media')
ah, bh = a['hostedMedia'].pop('manifest'), b['hostedMedia'].pop('manifest')
check('every non-media DATA field unchanged', a == b)
check('manifest matches the entire page media table', sorted(bm.values(), key=lambda x: x['file']) == manifest['assets'] and bh == manifest['sha256'])
check('manifest meets existing 2000-file guard', len(bm) == 1986 and len(bm) <= 2000)
check('retained descriptors and permissions unchanged', all(bm[k] == v for k, v in am.items() if k in bm))
digests = {hashlib.sha256(base64.b64decode(m[2], validate=True)).hexdigest() for m in MEDIA.finditer(base)}
check('all 56 extracted source files retained byte for byte', len(digests) == 56 and digests == {v['sha256'] for v in extracted['assets']} and all(hashlib.sha256((output / 'media1200' / v['file']).read_bytes()).hexdigest() == v['sha256'] for v in extracted['assets']))
check('every extracted reference uses its exact content-addressed file', all('/m/Coates-GC500-2026/' + v['file'] in page for v in extracted['assets']) and not MEDIA.search(page))
scripts = lambda s: re.findall(r'<script\b[^>]*>([\s\S]*?)</script>', s, re.I)
sa, sb = scripts(base), scripts(page)
check('only finder module appended', len(sb) == len(sa) + 1 and 'Loading1200' in sb[-1])
changed = [i for i in range(len(sa)) if sa[i] != sb[i]]
check('only planned scripts changed', set(changed) == {4, 75, 124, 126})
for i in [75, 124, 126]:
    normal = lambda s: MEDIA.sub(lambda m: 'MEDIA:' + hashlib.sha256(base64.b64decode(m[2])).hexdigest(), s)
    x = normal(sa[i])
    y = re.sub(r'https://gc500-production\.up\.railway\.app/m/Coates-GC500-2026/([a-f0-9]{64})\.[a-z0-9]+', r'MEDIA:\1', sb[i])
    check('script ' + str(i) + ' only relocates identical media', x == y)
for name in ['ShowcaseIncident1195', 'ShowcaseTruck1192', 'ShowcaseClarity1182', 'MapViewport1196', 'PL1194']:
    i = next(i for i, s in enumerate(sa) if name in s)
    check(name + ' source unchanged', sa[i] == sb[i])
check('servicing and crew-card script unchanged', sa[123] == sb[123])
check('HTML transfer source reduced by at least 30 percent', len(page.encode()) < len(base.encode()) * .7)
print(json.dumps(dict(author='Andrew Fisher', checks=checks, passed=len(checks))))
