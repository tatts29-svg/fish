#!/usr/bin/env python3
"""Author: Andrew Fisher. Apply the reviewed map trace to one exact live base."""
import hashlib
from pathlib import Path
import sys

from fencing_trace837 import apply, exact, require

BASE_SHA256 = '9bf3f47e089913c51a4fbd0bf8fdb20371dbdcd12cc64273e362c8132da5b9ad'
RELEASE_CHANGES = [
    ('<meta name="gc500-release" content="v8.36">', '<meta name="gc500-release" content="v8.37">', 'Release metadata'),
    ("+ ' · v8.36'; /* v8.19 - the footer names the release once */", "+ ' · v8.37'; /* v8.19 - the footer names the release once */", 'Release footer'),
]


def build(raw, input_path=None, input_sha=None):
    require(b'const FENCE_TRACE837 =' not in raw and b'function fenceTraceSnapshot837(' not in raw, 'Trace release is already applied')
    require(hashlib.sha256(raw).hexdigest() == BASE_SHA256, 'Expected the exact reviewed v8.36 live base')
    text = apply(raw.decode('utf-8'), input_path, input_sha)
    for old, new, label in RELEASE_CHANGES:
        text = exact(text, old, new, label)
    return text.encode('utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v837.py WORKING_COPY.html (requires reviewed private inputs)')
    working = Path(sys.argv[1])
    result = build(working.read_bytes())
    working.write_bytes(result)
    print('Guarded map trace applied; geometry, records and financial calculations preserved.')
