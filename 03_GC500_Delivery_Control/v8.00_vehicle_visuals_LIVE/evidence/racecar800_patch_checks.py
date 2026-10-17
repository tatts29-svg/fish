#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded module replacement and protected-source check."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

HERE = Path(__file__).resolve().parent
FOLDER = HERE.parent
spec = importlib.util.spec_from_file_location('patch_racecar800', FOLDER / 'patch_racecar800.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
base = Path(sys.argv[1])
text = base.read_text()
result = patch.apply(text, str(base))
checks = []


def check(name, good):
    checks.append({'name': name, 'pass': bool(good)})
    assert good, name


old_start = text.index(patch.START)
old_end = text.index(patch.END, old_start)
source = (FOLDER / 'racecar800_src.js').read_text()
check('all page content before and after the visual module is byte-preserved',
      result == text[:old_start] + source + text[old_end:])
check('visual module appears once', result.count('G.raceCarVisual800=') == 1)
for name, fixture in [
    ('double application refuses', result),
    ('different original geometry refuses', text.replace('function width(x){return.378', 'function width(x){return.379', 1)),
    ('missing original module refuses', text.replace(patch.START, 'Missing source marker', 1)),
    ('duplicate original module refuses', text + text[old_start:old_end]),
]:
    try:
        patch.apply(fixture, 'deliberate guard fixture')
    except SystemExit:
        check(name, True)
    else:
        check(name, False)

data = {'author': 'Andrew Fisher', 'originalSha256': hashlib.sha256(text.encode()).hexdigest(),
        'candidateSha256': hashlib.sha256(result.encode()).hexdigest(), 'checks': checks}
if len(sys.argv) > 2:
    Path(sys.argv[2]).write_text(json.dumps(data, indent=2) + '\n')
if len(sys.argv) > 3:
    Path(sys.argv[3]).write_text(result)
print(json.dumps({'passed': len(checks), 'candidateSha256': data['candidateSha256']}))
