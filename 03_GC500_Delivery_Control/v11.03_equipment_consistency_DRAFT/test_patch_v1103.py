"""Author: Andrew Fisher. Exact-base and protected-source release checks."""
import contextlib
import hashlib
import io
import re
import sys
from pathlib import Path

from patch_v1103 import BASE_SHA256, patch

base = Path(sys.argv[1]).read_text()
assert hashlib.sha256(base.encode()).hexdigest() == BASE_SHA256
with contextlib.redirect_stdout(io.StringIO()):
    out = patch(base)
checks = 1
for bad in (base + '\n', out):
    try:
        patch(bad)
    except ValueError:
        checks += 1
    else:
        raise AssertionError('wrong-base or repeat patch was accepted')

def between(value, start, end):
    i = value.index(start)
    return value[i:value.index(end, i)]

for start, end in [
    ('function allAssets(){', 'function holdAssets(fn){'),
    ('function write(pos, patch, what){', '/* --------------------------------------------------------------------------------------------------------- the tab */'),
    ('function recordFor(key){', 'function inventoryProjection(I,c){'),
    ('function setComplete(pos,done){', 'const api={dayOf,evidence'),
    ('var SvcState =', 'module.exports = SvcState;'),
    ('var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;'),
    ('var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress'),
]:
    assert between(base, start, end) == between(out, start, end), start
    checks += 1
assert len(re.findall(r'<script\b', out)) == len(re.findall(r'<script\b', base))
checks += 1
assert "+' · v11.03'; /* v8.19 release922" in out
checks += 1
assert 'As at the last update of this page: <b>${cs.items_recorded_as_supplied' not in out
checks += 1
print(f'{checks} patch and protected-source checks passed')
