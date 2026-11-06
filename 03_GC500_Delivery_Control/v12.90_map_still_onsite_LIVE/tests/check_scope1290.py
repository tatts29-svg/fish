"""Author: Andrew Fisher. Verify the bounded page change and guarded patch behaviour.

Uses private local pages only. No network or operational record writes.
"""
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

base, candidate = (Path(p).read_text() for p in sys.argv[1:3])
release = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('patch1290', release / 'patch_v1290.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
assert patch.apply(base) == candidate, 'Build must reproduce exactly from the guarded patch'
for label, text in [('already patched', candidate), ('changed base', base + '\n')]:
    try:
        patch.apply(text)
    except (ValueError, SystemExit):
        pass
    else:
        raise AssertionError('Patch did not refuse ' + label)

def mask(text):
    for script in ['shapes1060-script', 'spot1117-script']:
        pattern = re.compile(r'<script id="' + script + r'">.*?</script>', re.S)
        assert len(pattern.findall(text)) == 1
        text = pattern.sub('<script id="' + script + '">[map presentation]</script>', text)
    return text

assert mask(base).replace("+' · v12.89';", "+' · v12.90';") == mask(candidate), 'Unexpected change outside map presentation and footer'
if len(sys.argv) > 3:
    functional = Path(sys.argv[3]).read_text()
    assert hashlib.sha256(functional.encode()).hexdigest() == '89c8edb98f2e6f89ea95dcc90b2f4571d17f88692f3d1fd3c2976f61ef0482f7'
    hud = ' body.onsite1290 .console,body.onsite1290 .hud,body.onsite1290 .rose{z-index:10}\n'
    assert candidate.count(hud) == 1 and candidate.replace(hud, '') == functional, 'Functional checks cannot be reused after a JavaScript or inactive-view change'
for name in ['SHAPE_NEW', 'SPOT_NEW']:
    # Exact positive/negative mount-guard checks belong to the preceding release;
    # this verifies their reviewed allowlists remain byte-identical here.
    lines = [l.strip() for l in base.splitlines() if ('v12.86:' in l and ('retain exact identity' in l if name == 'SHAPE_NEW' else 'same reviewed map identity' in l))]
    assert len(lines) == 1
    assert lines[0] in candidate, 'Reviewed script guard changed'
print(json.dumps({'author':'Andrew Fisher','passed':True,'baseSha256':hashlib.sha256(base.encode()).hexdigest(),'candidateSha256':hashlib.sha256(candidate.encode()).hexdigest(),'scope':'two map presentation scripts and footer only','patchGuards':2,'mountAllowlistsUnchanged':2}))
