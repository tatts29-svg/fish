"""Author: Andrew Fisher. Exact two-change preservation and release-patch guards."""
import hashlib
import importlib.util
import json
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
base = Path(os.environ['BASE']).read_bytes()
page = Path(os.environ['PAGE']).read_bytes()
patch_path = Path(__file__).resolve().parents[1] / 'patch_v1223.py'
spec = importlib.util.spec_from_file_location('patch1223', patch_path)
patch_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch_module)
checks = 0


def check(name, condition):
    global checks
    assert condition, name
    checks += 1
    print('PASS ' + name)


def replace_once(value, old, new, name):
    old, new = old.encode('utf-8'), new.encode('utf-8')
    check(name + ' has exactly one baseline target', value.count(old) == 1)
    return value.replace(old, new, 1)


def matched(value, pattern):
    matches = re.findall(pattern, value, re.MULTILINE | re.DOTALL)
    assert len(matches) == 1, 'Expected exactly one preserved source block'
    return matches[0]


def module_source(value, name, end):
    start = value.index(('var ' + name + ' = (function () {').encode())
    stop = value.index(end, start) + len(end)
    return value[start:stop]


def rejects(value, reason):
    try:
        patch_module.patch(value.decode('utf-8'))
    except AssertionError as error:
        return str(error) == reason
    return False


version = patch_module.BASES.get(hashlib.sha256(base).hexdigest())
check('baseline is pinned by the release patch', bool(version))
expected = replace_once(base, "var JOBS1123 = ['pump', 'clean', 'refill'];",
                        "var JOBS1123 = ['pump', 'clean', 'refill', 'lockup']; /* v12.23 lock percentage */",
                        'Main servicing job list')
expected = replace_once(expected, "+' · " + version + "'; /* v8.19 release922",
                        "+' · v12.23'; /* v8.19 release922", 'Release footer')
check('only the job list and footer changed; every remaining byte is identical', page == expected)
check('actual release patch reproduces the candidate exactly',
      patch_module.patch(base.decode('utf-8')).encode('utf-8') == page)
check('native crew card and bundled tracker data are byte-for-byte unchanged',
      matched(base, rb'^var SVC1067_CARD=[^\r\n]+') == matched(page, rb'^var SVC1067_CARD=[^\r\n]+'))
check('main servicing configuration is byte-for-byte unchanged',
      matched(base, rb'^var SVC1067_DATA=[^\r\n]+') == matched(page, rb'^var SVC1067_DATA=[^\r\n]+'))
check('shared counting and cancellation model is byte-for-byte unchanged',
      module_source(base, 'SvcState', b'module.exports = SvcState;') ==
      module_source(page, 'SvcState', b'module.exports = SvcState;'))
check('declaration evidence model is byte-for-byte unchanged',
      module_source(base, 'SvcLock1221', b'module.exports=SvcLock1221;') ==
      module_source(page, 'SvcLock1221', b'module.exports=SvcLock1221;'))
report = rb'<script\b(?=[^>]*\bid="report1202-script")[^>]*>.*?</script\s*>'
check('servicing night report is byte-for-byte unchanged', matched(base, report) == matched(page, report))
check('wrong baseline is rejected by the hash guard', rejects(base + b'\n', 'Wrong verified live base'))
check('applying the patch twice is rejected', rejects(page, 'Already applied'))
print(json.dumps({'checks': checks, 'allowed_changes': ['main servicing job list', 'release footer'],
                  'all_other_bytes_unchanged': True, 'network_requests': 0, 'operational_writes': 0}))
