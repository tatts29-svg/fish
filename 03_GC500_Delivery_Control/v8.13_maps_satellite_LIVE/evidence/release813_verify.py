#!/usr/bin/env python3
"""Author: Andrew Fisher. Read-only publication and record-preservation proof."""
import hashlib
import json
from pathlib import Path
import sys
import urllib.request

HOST = 'https://gc500-production.up.railway.app'
ROOT = Path(__file__).resolve().parent

def get(path):
    request = urllib.request.Request(HOST + path, headers={'x-gc500-token': 'Coates-GC500-2026'})
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()

def sha(value):
    return hashlib.sha256(value).hexdigest()

def state_summary():
    state = json.loads(get('/api/state'))
    return {'version': state.get('version'), 'collections': {
        name: sha(json.dumps(value, sort_keys=True, separators=(',', ':')).encode())
        for name, value in state['docs'].items()
    }}

mode = sys.argv[1]
if mode == 'before':
    result = {'author': 'Andrew Fisher', 'state': state_summary(),
              'livePageSha256': sha(get('/v/Coates-GC500-2026'))}
    (ROOT / 'publication_before.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'captured': True, 'recordVersion': result['state']['version']}))
elif mode == 'after':
    candidate = Path(sys.argv[2]).read_bytes()
    served = get('/v/Coates-GC500-2026')
    previous = json.loads((ROOT / 'publication_before.json').read_text())
    state = state_summary()
    result = {'author': 'Andrew Fisher', 'candidateSha256': sha(candidate),
              'servedSha256': sha(served), 'bytes': len(served),
              'exactPageMatch': served == candidate,
              'recordUnchanged': state == previous['state'],
              'beforeRecordVersion': previous['state']['version'],
              'afterRecordVersion': state['version']}
    (ROOT / 'release_verification.json').write_text(json.dumps(result, indent=2) + '\n')
    assert result['exactPageMatch'], 'Public page differs from tested candidate'
    assert result['recordUnchanged'], 'Shared operational record changed; inspect before claiming preservation'
    print(json.dumps(result))
else:
    raise SystemExit('Use before, or after PATH_TO_TESTED_PAGE')
