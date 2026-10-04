#!/usr/bin/env python3
"""Author: Andrew Fisher. Apply verified source-review context to the exact live base."""
import hashlib
from pathlib import Path
import sys

from fencing_review836 import apply, rep, require

BASE_SHA256 = 'e63a8b0bafc0c2741ab2048a0864a4db2bf213d274502cf1606eae86f70613eb'
RELEASE_CHANGES = [
    ('<meta name="gc500-release" content="v8.34">', '<meta name="gc500-release" content="v8.36">', 'Release metadata'),
    ("+ ' · v8.34'; /* v8.19 - the footer names the release once */", "+ ' · v8.36'; /* v8.19 - the footer names the release once */", 'Release footer'),
]


def build(raw, input_path=None):
    require(b'const FENCE_REVIEW836 =' not in raw and b'function fencingReview836(' not in raw, 'Review release is already applied')
    require(hashlib.sha256(raw).hexdigest() == BASE_SHA256, 'Expected the exact reviewed v8.34 live base')
    text = apply(raw.decode('utf-8'), input_path)
    for old, new, label in RELEASE_CHANGES:
        rep(text, old, new, label, 'v8.36')
        require(text.count(old) == 1, 'Release marker changed: ' + label)
        text = text.replace(old, new, 1)
    return text.encode('utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v836.py WORKING_COPY.html (requires FENCE_REVIEW836_INPUT)')
    working = Path(sys.argv[1])
    result = build(working.read_bytes())
    working.write_bytes(result)
    print('Guarded source-review presentation applied; native records and financial calculations unchanged.')
