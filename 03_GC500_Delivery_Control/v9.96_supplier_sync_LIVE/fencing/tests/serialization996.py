"""Author: Andrew Fisher. Exercise the real build scrubber after fencing serialization."""
import copy
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parents[2]
spec = importlib.util.spec_from_file_location('fencing996_serialization', HERE.parent / 'fencing996.py')
fencing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fencing)
base = (PROJECT / 'build/GC500_v9.95-final/GC500_Delivery_Control_hosted.html').read_text()
patched = fencing.patch(base)
names = ['DATA', 'FENCE_REVIEW836', 'FENCE_TRACE837', 'FENCE_EVIDENCE849', 'FENCE_PROGRESS848']
for name in names:
    assert len(re.findall(r'^const ' + name + r' = \{', patched, re.M)) == 1, name

old_data = fencing.constant(base, 'DATA')[1]
expected = copy.deepcopy(old_data)
next(r for r in expected['fence_ccb_review847']['rows'] if r['docket_no'] == '36560')['expected']['quantities']['ped_gates'] = 1
assert fencing.constant(patched, 'DATA')[1] == expected


def people(value, path='DATA'):
    out = {}
    if isinstance(value, dict):
        for key, item in value.items():
            child = path + '.' + key
            if key in ('name', 'by') and isinstance(item, str) and 'Andrew Fisher' in item:
                out[child] = item
            out.update(people(item, child))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            out.update(people(item, path + '[' + str(index) + ']'))
    return out


expected_people = people(old_data)
assert any(path.endswith('.name') for path in expected_people)
assert any(path.endswith('.by') for path in expected_people)
with tempfile.TemporaryDirectory(prefix='gc500-fencing996-') as tmp:
    page = Path(tmp) / 'page.html'
    page.write_text(patched)
    subprocess.run([sys.executable, str(PROJECT / 'toolchain/scrub_attributions.py'), str(page)],
                   check=True, capture_output=True, text=True)
    scrubbed = page.read_text()
    scrubbed_data = fencing.constant(scrubbed, 'DATA')[1]
    assert scrubbed_data == expected, 'Standard build scrub changed factual DATA'
    assert people(scrubbed_data) == expected_people
    for name in names:
        assert fencing.constant(scrubbed, name)[1] == fencing.constant(patched, name)[1], name

    # Demonstrate that the fixture detects the exact malformed prefix regression.
    page.write_text(patched.replace('const DATA = ', 'const DATA =', 1))
    subprocess.run([sys.executable, str(PROJECT / 'toolchain/scrub_attributions.py'), str(page)],
                   check=True, capture_output=True, text=True)
    bad = page.read_text()
    raw_start = bad.index('const DATA =') + len('const DATA =')
    bad_data = json.JSONDecoder().raw_decode(bad[raw_start:])[0]
    assert people(bad_data) != expected_people, 'Negative control did not detect the original bug'

print(json.dumps({'author': 'Andrew Fisher', 'passed': True, 'canonical_constants': len(names),
                  'preserved_person_fields': len(expected_people), 'standard_scrubber': True,
                  'negative_control': True, 'operational_writes': 0}))
