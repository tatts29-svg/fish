#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproduce the exact multisample patch guards."""
from pathlib import Path
import hashlib
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import patch_aa802

base = Path(sys.argv[1]).read_text()
out = patch_aa802.apply(base, sys.argv[1])
checks = []
for name, text in [
    ('repeat', out),
    ('allocation source changed', base.replace('if(!t||!gl.renderbufferStorageMultisample||wanted<2)return;',
                                              'if(!t||!gl.renderbufferStorageMultisample||wanted<3)return;', 1)),
    ('missing camera', base.replace('G.vehicleCamera800=', 'G.missingCamera800=')),
    ('duplicate lifecycle', base + '\nG.addMSAA=function(gl,t,wanted){'),
]:
    try:
        patch_aa802.apply(text, 'deliberate guard fixture')
    except SystemExit:
        checks.append({'name': name, 'pass': True})
    else:
        raise AssertionError(name)
result = {'author': 'Andrew Fisher', 'checks': checks,
          'baseSha256': hashlib.sha256(base.encode()).hexdigest(),
          'candidateSha256': hashlib.sha256(out.encode()).hexdigest()}
if len(sys.argv) > 2:
    Path(sys.argv[2]).write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': len(checks), 'candidateSha256': result['candidateSha256']}))
