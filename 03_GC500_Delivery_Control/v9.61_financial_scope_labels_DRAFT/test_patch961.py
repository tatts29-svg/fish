# Author: Andrew Fisher. Strict patch application and source-preservation checks.
import hashlib
import os
from pathlib import Path
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent
base = Path(os.environ['BASE_PAGE']).read_bytes()
checks = []
with tempfile.TemporaryDirectory(prefix='gc500-caption961-') as folder:
    target = Path(folder) / 'candidate.html'
    target.write_bytes(base)
    run = lambda: subprocess.run([sys.executable, str(HERE / 'patch_v961.py'), str(target)], capture_output=True, text=True)
    first = run()
    assert first.returncode == 0, first.stderr
    after = target.read_bytes()
    checks.append('strict v9.60 patch applies once')
    assert run().returncode != 0
    assert target.read_bytes() == after
    checks.append('repeat application refused without file changes')
    for bad in [base.replace(" · v9.60'".encode(), " · v9.59'".encode()), base.replace(b"who: 'our own fleet (STPS)'", b"who: 'changed'")]:
        target.write_bytes(bad)
        assert run().returncode != 0
        assert target.read_bytes() == bad
    checks.append('wrong base and changed caption anchors refused without writes')
    old = base.decode('utf-8-sig')
    new = after.decode('utf-8-sig')
    data = lambda s: s[s.index('const DATA = '):].split('\n')[0]
    assert data(old) == data(new)
    checks.append('embedded source and operational data unchanged')
    for start, end in [('const Source949 =', '})();'), ('function contractCharge(', '\nfunction '), ('function cj764Fencing(', '/* v7.65'), ('function fh866Model(', '\nfunction '), ('function rh766Model776Held(', '\nfunction '), ('function pl770Model(', '\nfunction ')]:
        def section(s):
            at = s.index(start)
            return s[at:s.index(end, at + len(start))]
        assert section(old) == section(new), start
    checks.append('pricing, source forecasts, P&L and Finance functions unchanged')
    assert "who: 'our own fleet (KINP)'" not in new and "who: 'our own fleet (STPS)'" not in new
    assert 'if (b.subLines) out.push(`<span class="w">${esc(supplierScopeWords961(' in new
    checks.append('visible branch and ownership captions use current scoped wording')
print({'author': 'Andrew Fisher', 'pass': True, 'checks': len(checks), 'details': checks, 'candidate_sha256': hashlib.sha256(after).hexdigest()})
