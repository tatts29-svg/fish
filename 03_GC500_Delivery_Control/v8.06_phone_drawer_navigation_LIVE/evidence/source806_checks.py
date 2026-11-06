#!/usr/bin/env python3
"""Author: Andrew Fisher. Verify CSS-only scope and exact reversal."""
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
base, candidate = map(Path, sys.argv[1:3])
a, b = base.read_text(), candidate.read_text()
checks = []
def ck(name, passed): checks.append({'name': name, 'pass': bool(passed)})
scripts = lambda s: re.findall(r'<script\b[^>]*>([\s\S]*?)</script>', s, re.I)
ck('Every script is byte-for-byte unchanged', scripts(a) == scripts(b))
ck('Exactly the supplied two scoped CSS rules are embedded', b.count((root / 'drawer_navigation806_src.css').read_text()) == 1)
with tempfile.TemporaryDirectory() as temp:
    p = Path(temp) / 'page.html'
    p.write_text(b)
    run = subprocess.run([sys.executable, str(root / 'patch_v806.py'), str(p), '--reverse'], capture_output=True, text=True)
    ck('Reversing CSS and release marker restores every original byte including DATA', run.returncode == 0 and p.read_bytes() == base.read_bytes())
    run = subprocess.run([sys.executable, str(root / 'patch_v806.py'), str(p)], capture_output=True, text=True)
    ck('Reapplying to official fresh base reproduces candidate bytes', run.returncode == 0 and p.read_bytes() == candidate.read_bytes())
    saved = p.read_bytes()
    run = subprocess.run([sys.executable, str(root / 'patch_v806.py'), str(p)], capture_output=True, text=True)
    ck('Repeat application is rejected without writing', run.returncode != 0 and 'already applied' in run.stderr and p.read_bytes() == saved)
    p.write_text(a.replace('function cw2Plan803(', 'function noPlan803(', 1))
    saved = p.read_bytes()
    run = subprocess.run([sys.executable, str(root / 'patch_v806.py'), str(p)], capture_output=True, text=True)
    ck('Wrong base is rejected without writing', run.returncode != 0 and 'requires' in run.stderr and p.read_bytes() == saved)
r = {'author': 'Andrew Fisher', 'baseSha256': hashlib.sha256(base.read_bytes()).hexdigest(), 'candidateSha256': hashlib.sha256(candidate.read_bytes()).hexdigest(), 'checks': checks}
(root / 'evidence' / 'source806_checks.json').write_text(json.dumps(r, indent=2) + '\n')
print(json.dumps(r))
raise SystemExit(0 if all(c['pass'] for c in checks) else 1)
