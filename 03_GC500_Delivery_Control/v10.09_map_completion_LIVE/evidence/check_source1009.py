"""Author: Andrew Fisher. Exact-base guards and preservation of all existing parent source."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('patch1009', ROOT / 'patch_v1009.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
base = Path(sys.argv[1]).read_text()
candidate = patch.apply(base)
for value in [candidate, base + '\n']:
    try:
        patch.apply(value)
    except ValueError:
        pass
    else:
        raise AssertionError('Repeat or wrong-base guard did not reject')
addition = '<script id="map-status1009-script">\n' + (ROOT / 'map_status1009.js').read_text() + '\n</script>\n'
assert candidate.replace(addition, '').replace("+ ' · v10.09'", "+ ' · v10.08'") == base
if len(sys.argv) > 2:
    assert Path(sys.argv[2]).read_text() == candidate
print(json.dumps({'author':'Andrew Fisher', 'repeatGuard':True, 'wrongBaseGuard':True,
    'allExistingSourcePreserved':True, 'candidateSha256':hashlib.sha256(candidate.encode()).hexdigest()}))
