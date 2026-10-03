#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact base, restart and source guards for the separate Explorer asset."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('performance813', root / 'patch_performance813.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
base_path, candidate_path, output_path = map(Path, sys.argv[1:4])
base, candidate = base_path.read_text(), candidate_path.read_text()
checks = []


def check(name, condition):
    assert condition, name
    checks.append({'name': name, 'pass': True})


def rejected(text):
    try:
        patch.apply(text)
    except SystemExit:
        return True
    return False


check('Exact verified live Explorer base', hashlib.sha256(base.encode()).hexdigest() == patch.BASE_SHA256)
check('Offline patch replay is byte exact', patch.apply(base) == candidate)
check('Already-applied patch is refused', rejected(candidate))
check('Wrong base is refused before replacement', rejected(base + '\n'))
check('Unchanged live source is not overwritten', hashlib.sha256(base_path.read_bytes()).hexdigest() == patch.BASE_SHA256)
check('Master-plan dimensions and max/min zoom unchanged',
      next(l for l in base.splitlines() if l.startswith('const SHEET_W')) == next(l for l in candidate.splitlines() if l.startswith('const SHEET_W')))
check('Camera starts at the same plan centre',
      next(l for l in base.splitlines() if l.startswith('let camera =')) == next(l for l in candidate.splitlines() if l.startswith('let camera =')))
check('Tile request parallelism remains eight', 'if (!queue.size || running >= 8) return;' in candidate and 'if (running >= 8) break;' in candidate)
check('Bitmap cache caps remain 90 phone / 200 desktop', 'TILE_CAP = PHONE ? 90 : 200' in candidate)
check('Vector cache caps and range transport remain unchanged',
      'VT_CAP = PHONE ? 110 : 240' in candidate and 'headers: {Range: `bytes=${e[0]}-${e[0] + e[1] - 1}`}' in candidate)
check('API methods and viewport output remain available', all(x in candidate for x in ['window.GC500Explorer = {ready:', 'get state()', 'goto: (r, l', 'zoom: z =>', 'setMode, render: () => pumpVT()']))
result = {'author': 'Andrew Fisher', 'baseSha256': patch.BASE_SHA256,
          'candidateSha256': hashlib.sha256(candidate.encode()).hexdigest(),
          'checks': checks, 'passed': len(checks), 'failed': 0,
          'scope': 'Explorer asset only. Host page, index, merge, worker and source map assets are outside this patch.'}
output_path.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': len(checks), 'candidateSha256': result['candidateSha256']}))
