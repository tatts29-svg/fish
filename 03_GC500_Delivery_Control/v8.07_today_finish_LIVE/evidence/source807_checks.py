#!/usr/bin/env python3
"""Author: Andrew Fisher. Prove exact READY source integration and retained live work."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parent
BASE, PAGE = map(Path, sys.argv[1:3])
a, b = BASE.read_text(), PAGE.read_text()
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
checks = []
def ck(name, passed, detail=None):
    checks.append(dict(name=name, pass_=bool(passed), **({'detail': detail} if detail is not None else {})))

manifest = json.loads((ROOT / 'evidence/source_import.json').read_text())
for item in manifest['files']:
    ck('Exact imported READY file: ' + Path(item['path']).name,
       sha(PROJECT.parent / item.get('sourceArchivePath', item.get('publishedPath', item['path']))) == item['sha256'])
    if 'publishedPath' in item:
        ck('Published local file: ' + Path(item['publishedPath']).name,
           sha(PROJECT.parent / item['publishedPath']) == item['publishedSha256'])
ck('Official base is exact verified live v8.06', sha(BASE) == 'eaf5182106015aa68c06452493c208f6ca9551b7f164d56089e343920b9dc8f9')
ck('Single v8.07 release marker', re.findall(r'<meta name="gc500-release" content="([^"]+)">', b) == ['v8.07'])

def data(s):
    start = s.index('const DATA = ') + len('const DATA = ')
    value, end = json.JSONDecoder().raw_decode(s[start:])
    return value, s[start:start+end]
da, rawa = data(a)
db, rawb = data(b)
ck('Every DATA byte is unchanged', rawa == rawb)
ck('Every DATA value is unchanged', da == db)
ck('CW2 source plan and all historic fencing remain unchanged', da['fencing'] == db['fencing'])
scripts = lambda s: re.findall(r'<script\b[^>]*>(.*?)</script>', s, re.S)
sa, sb = scripts(a), scripts(b)
ck('Same inline script count', len(sa) == len(sb))
changed = [i for i, (x, y) in enumerate(zip(sa, sb)) if x != y]
ck('Only the existing main business script changes', changed == [1], changed)
ck('All Showcase, vehicle, map and extension scripts are byte-identical', sa[2:] == sb[2:] and sa[0] == sb[0])
style806 = lambda s: re.search(r'<style id="drawer-navigation806"[^>]*>.*?</style>', s, re.S).group(0)
ck('Entire v8.06 phone drawer style is byte-identical', style806(a) == style806(b))
css799 = '/* v7.99 - packed cards placed to fit, on the screen only (paper lays the cards out as it always has) */\n @media screen and (min-width:900px){ #pane-today .mas95 > [data-p799]{grid-column:var(--c799)!important;grid-row-start:var(--r799)!important} }\n'
styles = lambda s: re.findall(r'<style\b[^>]*>.*?</style>', s, re.S)
ck('Only the approved screen-only card placement CSS is added', b.count(css799) == 1 and styles(a) == styles(b.replace(css799, '', 1)))

with tempfile.TemporaryDirectory(prefix='gc500-v807-check-') as tmp:
    test = Path(tmp) / 'page.html'
    test.write_bytes(BASE.read_bytes())
    ready = subprocess.run([sys.executable, str(PROJECT / 'v7.99_today_faster_fuller_LIVE/patch_v799.py'), str(test)], capture_output=True, text=True)
    expected = test.read_text().replace('<meta name="gc500-release" content="v8.06">', '<meta name="gc500-release" content="v8.07">', 1)
    ck('Final page is exactly the unchanged READY patch plus release metadata', ready.returncode == 0 and expected == b)
    test.write_bytes(BASE.read_bytes())
    run = subprocess.run([sys.executable, str(ROOT / 'patch_v807.py'), str(test)], capture_output=True, text=True)
    ck('Wrapper deterministically reproduces official candidate', run.returncode == 0 and test.read_bytes() == PAGE.read_bytes())
    saved = test.read_bytes()
    run = subprocess.run([sys.executable, str(ROOT / 'patch_v807.py'), str(test)], capture_output=True, text=True)
    ck('Repeat application is rejected without changing any bytes', run.returncode != 0 and 'already or partially' in run.stderr and test.read_bytes() == saved)
    for name, text in [
        ('wrong release', a.replace('content="v8.06"', 'content="v8.03"', 1)),
        ('missing phone fix', a.replace('id="drawer-navigation806"', 'id="absent806"', 1)),
        ('missing CW2 plan', a.replace('function cw2Plan803(', 'function absent803(', 1)),
        ('missing Wednesday bookings', a.replace('function bookingOrder801(', 'function absent801(', 1)),
        ('missing Equipment component', a.replace('function eq796(', 'function absent796(', 1)),
        ('changed exact Today anchor', a.replace("const mk = 'money:' + (asOf || '');", "const mk = 'changed:' + (asOf || '');", 1))]:
        test.write_text(text)
        saved = test.read_bytes()
        run = subprocess.run([sys.executable, str(ROOT / 'patch_v807.py'), str(test)], capture_output=True, text=True)
        ck(name + ' is rejected without partial modification', run.returncode != 0 and test.read_bytes() == saved)

for c in checks:
    c['pass'] = c.pop('pass_')
report = {'author': 'Andrew Fisher', 'baseSha256': sha(BASE), 'candidateSha256': sha(PAGE),
          'candidateBytes': PAGE.stat().st_size, 'readySourceCommit': manifest['readyCommit'],
          'checks': checks, 'passed': sum(c['pass'] for c in checks), 'total': len(checks)}
(Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / 'evidence/source807_checks.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(0 if all(c['pass'] for c in checks) else 1)
