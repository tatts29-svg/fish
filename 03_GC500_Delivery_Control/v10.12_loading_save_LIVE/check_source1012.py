"""Author: Andrew Fisher. Exact rebuild, release guards and unchanged native source data."""
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('release1012', HERE / 'patch_v1012.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
base, candidate = (Path(p) for p in sys.argv[1:3])
old, new = base.read_text(), candidate.read_text()
checks = []

def check(name, result):
    assert result, name
    checks.append({'name': name, 'pass': True})

check('Exact reviewed rebuild', patch.apply(old) == new)
for name, value in [('Repeat rejected', new), ('Wrong base rejected', old + '\n')]:
    try:
        patch.apply(value)
    except ValueError:
        check(name, True)
    else:
        raise AssertionError(name)

for marker in ['const DATA =', 'const COMMITTED =']:
    source = [line for line in old.splitlines() if line.startswith(marker)]
    if source:
        check(marker + ' source unchanged', all(line in new.splitlines() for line in source))

for name in ['loading_save1012.js', 'selection_save/selection_save1012.js']:
    check(name + ' exact source embedded', (HERE / name).read_text() in new)
for name in ['control_contrast1012.css', 'loading_save1012.css', 'selection_save/selection_save1012.css']:
    check(name + ' exact source embedded', (HERE / name).read_text() in new)

for script_id in ['pricing1010-script', 'financial-scopes1011-script']:
    pattern = re.compile(r'<script id="' + script_id + r'">(.*?)</script>', re.S)
    before, after = pattern.search(old), pattern.search(new)
    check(script_id + ' unchanged', before is not None and after is not None and before.group() == after.group())

report = {'author': 'Andrew Fisher', 'sha256': hashlib.sha256(candidate.read_bytes()).hexdigest(), 'bytes': candidate.stat().st_size, 'checks': checks}
(HERE / 'evidence').mkdir(exist_ok=True)
(HERE / 'evidence/source-guards.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
