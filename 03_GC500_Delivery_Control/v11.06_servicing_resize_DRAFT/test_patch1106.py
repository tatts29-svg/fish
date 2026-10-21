"""Author: Andrew Fisher. Exact-base and bounded-change release guards; no live access."""
import hashlib
import os
from pathlib import Path
import patch_v1106 as release
import patch_servicing_resize_v1106 as resize
import patch_servicing_style_v1106 as style

base = Path(os.environ['SERVICING_BASE']).read_text()
checks = []
def check(name, value):
    assert value, name
    checks.append(name)
def rejects(name, fn):
    try:
        fn()
    except (ValueError, SystemExit):
        checks.append(name)
    else:
        raise AssertionError(name)

check('exact verified predecessor', hashlib.sha256(base.encode()).hexdigest() == release.BASE_SHA256)
result = release.patch(base)
check('release marker and both bounded changes present', 'v11.06' in result and resize.MARKER in result and 'id="svc1106-race-style"' in result)
check('existing map images preserved byte for byte', release._span(base, 'var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress') == release._span(result, 'var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress'))
check('native progress math and permanent tracker data preserved', release._span(base, 'var SvcState =', 'module.exports = SvcState;') == release._span(result, 'var SvcState =', 'module.exports = SvcState;') and release._span(base, 'var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;') == release._span(result, 'var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;'))
rejects('release rejects unexpected predecessor', lambda: release.patch(base + '\n'))
rejects('release rejects second application', lambda: release.patch(result))
rejects('resize rejects second application', lambda: resize.patch(result))
rejects('style rejects second application', lambda: style.patch(result))
print({'author': 'Andrew Fisher', 'passed': len(checks), 'candidate_sha256': hashlib.sha256(result.encode()).hexdigest(), 'checks': checks})
