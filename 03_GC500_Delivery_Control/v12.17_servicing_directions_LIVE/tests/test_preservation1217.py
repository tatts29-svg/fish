"""Author: Andrew Fisher. Exact page preservation and patch boundary checks."""
import importlib.util
import sys
from pathlib import Path

folder = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('patch1217', folder / 'patch_v1217.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
base, candidate = (Path(x).read_text() for x in sys.argv[1:3])
restored = candidate.replace((folder / 'directions1217_src.js').read_text() + '\n', '')
restored = restored.replace(patch.NEW, patch.OLD)
restored = restored.replace("+' · v12.17'; /* v8.19 release922", "+' · v12.16'; /* v8.19 release922")
assert restored == base, 'Unrelated page content changed'
for wrong in (candidate, base + ' '):
    try:
        patch.patch(wrong)
    except ValueError:
        pass
    else:
        raise AssertionError('Wrong base or double application accepted')
print('PASS 3 preservation checks: exact unrelated content; wrong base and double application refused')
