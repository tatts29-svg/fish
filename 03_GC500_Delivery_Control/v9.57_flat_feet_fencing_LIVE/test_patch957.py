# Author: Andrew Fisher
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

here = Path(__file__).resolve().parent
base = Path(os.environ['BASE_PAGE']).read_bytes()
patch = here / 'patch_v957.py'
checks = []
with tempfile.TemporaryDirectory() as temp:
    p = Path(temp) / 'candidate.html'
    p.write_bytes(base)
    result = subprocess.run([sys.executable, str(patch), str(p)], capture_output=True)
    assert result.returncode == 0, result.stderr.decode()
    final = p.read_bytes()
    checks.append('applies once to required live version')
    result = subprocess.run([sys.executable, str(patch), str(p)], capture_output=True)
    assert result.returncode != 0 and p.read_bytes() == final
    checks.append('repeat rejected without changing candidate')
    wrong = base.replace(" · v9.56'; /* v8.19".encode(), " · v9.55'; /* v8.19".encode())
    assert wrong != base
    p.write_bytes(wrong)
    result = subprocess.run([sys.executable, str(patch), str(p)], capture_output=True)
    assert result.returncode != 0 and p.read_bytes() == wrong
    checks.append('wrong previous version rejected without write')
    ambiguous = base + b'\nconst FCOL = FENCE.columns || [];\n'
    p.write_bytes(ambiguous)
    result = subprocess.run([sys.executable, str(patch), str(p)], capture_output=True)
    assert result.returncode != 0 and p.read_bytes() == ambiguous
    checks.append('ambiguous insertion anchor rejected without write')
    p.write_bytes(base)
    result = subprocess.run([sys.executable, str(patch), str(p)], capture_output=True)
    assert result.returncode == 0 and p.read_bytes() == final
    checks.append('repeat build is byte identical')
print(json.dumps({'author':'Andrew Fisher','pass':True,'checks':len(checks),'details':checks,
                  'candidate_sha256':hashlib.sha256(final).hexdigest(),'candidate_bytes':len(final)},indent=2))
