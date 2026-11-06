#!/usr/bin/env python3
"""Author: Andrew Fisher. Apply v8.32 to a hash-verified v8.31 working copy."""
import hashlib
import os
from pathlib import Path
import re
import sys

from banner_cleanup832 import apply_banner_cleanup
from labour_labels832 import apply_labour_labels

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep


def build(raw, expected_sha256):
    if not re.fullmatch(r'[a-f0-9]{64}', expected_sha256 or ''):
        raise ValueError('Set GC500_V832_BASE_SHA256 to the reviewed v8.31 hash')
    if hashlib.sha256(raw).hexdigest() != expected_sha256:
        raise ValueError('The v8.32 base differs from the reviewed source')
    text = raw.decode('utf-8')
    if 'function buildingTransportModel831(' not in text:
        raise ValueError('The v8.31 transport release must be present')
    text = apply_banner_cleanup(text)
    text = apply_labour_labels(text)
    text = rep(text, '<meta name="gc500-release" content="v8.31">',
               '<meta name="gc500-release" content="v8.32">',
               'Release metadata', 'host')
    text = rep(text, "+ ' · v8.31'; /* v8.19 - the footer names the release once */",
               "+ ' · v8.32'; /* v8.19 - the footer names the release once */",
               'Release footer', 'host')
    return text.encode('utf-8')


def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v832.py WORKING_COPY.html')
    path = Path(sys.argv[1])
    candidate = build(path.read_bytes(), os.environ.get('GC500_V832_BASE_SHA256'))
    path.write_bytes(candidate)
    print('Banner cleanup and current-card labour labels applied; Today video retained.')


if __name__ == '__main__':
    main()
