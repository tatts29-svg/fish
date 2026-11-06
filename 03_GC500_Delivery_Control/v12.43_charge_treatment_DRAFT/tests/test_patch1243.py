"""Author: Andrew Fisher. Exercise the release patch through the shared CLI contract."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


patch_file = Path(__file__).resolve().parent.parent / 'patch_v1243.py'
base = Path(os.environ['BASE']).read_bytes()
base_sha = hashlib.sha256(base).hexdigest()
cli_env = {**os.environ, 'GC500_V1243_BASE_SHA256': base_sha}
spec = importlib.util.spec_from_file_location('charge1243_patch', patch_file)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
checks = []

with tempfile.TemporaryDirectory(prefix='gc500-charge-patch-') as temporary:
    target = Path(temporary) / 'candidate.html'
    target.write_bytes(base)
    result = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True, env=cli_env)
    assert result.returncode == 0, result.stderr
    actual = target.read_bytes()
    expected = module.patch(base.decode(), str(target), expected_base_sha=base_sha).encode()
    assert actual == expected and actual != base
    checks.append('CLI applies the exact reviewed patch instead of silently round-tripping the base')
    assert actual.count(b'id="charge1239-script"') == 1 and b"+' \xc2\xb7 v12.43';" in actual
    checks.append('CLI result contains exactly one treatment module and the new release footer')
    repeated = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True, env=cli_env)
    assert repeated.returncode != 0 and target.read_bytes() == actual
    checks.append('Repeated CLI application refuses without altering the candidate')
    invalid = b'<html><body>Unsupported base</body></html>'
    target.write_bytes(invalid)
    rejected = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True, env=cli_env)
    assert rejected.returncode != 0 and target.read_bytes() == invalid
    checks.append('Unsupported CLI base refuses without partial output')
    target.write_bytes(base)
    no_binding = {k: v for k, v in os.environ.items() if k != 'GC500_V1243_BASE_SHA256'}
    unbound = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True, env=no_binding)
    assert unbound.returncode != 0 and 'explicit reviewed base SHA-256' in unbound.stderr and target.read_bytes() == base
    checks.append('Missing explicit base binding refuses without changing the file')
    mismatch = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True,
                              env={**cli_env, 'GC500_V1243_BASE_SHA256': '0' * 64})
    assert mismatch.returncode != 0 and 'base SHA-256 changed' in mismatch.stderr and target.read_bytes() == base
    checks.append('Different base bytes cannot reuse the supplied release binding')
    import re
    old_footer = re.sub(rb"\+' \xc2\xb7 v12\.(?:41|42)';", b"+' \xc2\xb7 v12.37';", base)
    assert old_footer != base
    target.write_bytes(old_footer)
    old = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True,
                         env={**cli_env, 'GC500_V1243_BASE_SHA256': hashlib.sha256(old_footer).hexdigest()})
    assert old.returncode != 0 and 'v12.41 or v12.42 footer' in old.stderr and target.read_bytes() == old_footer
    checks.append('Even an explicitly bound old-release footer cannot be relabelled as v12.43')
    without_perf = base.replace(b'id="performance1241-script"', b'id="unrelated-historical-script"', 1)
    target.write_bytes(without_perf)
    no_perf = subprocess.run([sys.executable, str(patch_file), str(target)], capture_output=True, text=True,
                             env={**cli_env, 'GC500_V1243_BASE_SHA256': hashlib.sha256(without_perf).hexdigest()})
    assert no_perf.returncode != 0 and 'requires the performance release' in no_perf.stderr and target.read_bytes() == without_perf
    checks.append('A footer alone cannot substitute for the required performance module')


print(json.dumps({'author': 'Andrew Fisher', 'suite': 'charge1243 release CLI',
                  'passed': len(checks), 'failed': 0, 'checks': checks,
                  'candidate_sha256': hashlib.sha256(actual).hexdigest()}))
