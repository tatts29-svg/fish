#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded host-only source completion release."""
from pathlib import Path
import sys
from source_completion838 import apply, require


def build(raw, **kwargs):
    text = apply(raw.decode('utf-8'), **kwargs)
    for old, new in [
        ('<meta name="gc500-release" content="v8.37">', '<meta name="gc500-release" content="v8.38">'),
        ("+ ' · v8.37'; /* v8.19 - the footer names the release once */", "+ ' · v8.38'; /* v8.19 - the footer names the release once */"),
    ]:
        require(text.count(old) == 1, 'Exact release metadata changed')
        text = text.replace(old, new, 1)
    return text.encode('utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v838.py WORKING_COPY.html (requires private reviewed inputs and hashes)')
    path = Path(sys.argv[1])
    path.write_bytes(build(path.read_bytes()))
    print('Verified source completion applied; native records, money and previous geometry preserved.')
