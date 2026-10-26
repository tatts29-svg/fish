"""Author: Andrew Fisher. Exercise the release patch through the shared CLI contract."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


patch_file = Path(__file__).resolve().parent.parent / 'patch_v1239.py'
base = Path(os.environ['BASE']).read_bytes()
spec = importlib.util.spec_from_file_location('charge1239_patch', patch_file)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
checks = []

with tempfile.TemporaryDirectory(prefix='gc500-charge-patch-') as temporary:
    target = Path(temporary) / 'candidate.html'
    target.write_bytes(base)
    result = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    actual = target.read_bytes()
    expected = module.patch(base.decode(), str(target)).encode()
    assert actual == expected and actual != base
    checks.append('CLI applies the exact reviewed patch instead of silently round-tripping the base')
    assert actual.count(b'id="charge1239-script"') == 1 and b"+' \xc2\xb7 v12.39';" in actual
    checks.append('CLI result contains exactly one treatment module and the new release footer')
    repeated = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True)
    assert repeated.returncode != 0 and target.read_bytes() == actual
    checks.append('Repeated CLI application refuses without altering the candidate')
    invalid = b'<html><body>Unsupported base</body></html>'
    target.write_bytes(invalid)
    rejected = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True)
    assert rejected.returncode != 0 and target.read_bytes() == invalid
    checks.append('Unsupported CLI base refuses without partial output')

print(json.dumps({'author': 'Andrew Fisher', 'suite': 'charge1239 release CLI',
                  'passed': len(checks), 'failed': 0, 'checks': checks,
                  'candidate_sha256': hashlib.sha256(actual).hexdigest()}))
