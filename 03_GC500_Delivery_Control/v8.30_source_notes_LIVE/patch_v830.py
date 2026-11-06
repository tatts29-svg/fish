#!/usr/bin/env python3
"""Author: Andrew Fisher. Merge reviewed note context without changing work records.
The source specification remains private. This patch performs no network writes.
"""
import hashlib
import json
import os
from pathlib import Path
import sys

from patch_plan_notes import patch_host

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep


def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v830.py INPUT.html')
    source = Path(os.environ['GC500_V830_PRIVATE_SPEC'])
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != os.environ['GC500_V830_SPEC_SHA256']:
        raise ValueError('Reviewed private source specification changed')
    path = Path(sys.argv[1])
    candidate, _ = patch_host(path.read_bytes(), json.loads(raw))
    text = candidate.decode('utf-8')
    text = rep(text, '<meta name="gc500-release" content="v8.29">',
               '<meta name="gc500-release" content="v8.30">', 'Release metadata', str(path))
    text = rep(text, "+ ' · v8.29'; /* v8.19 - the footer names the release once */",
               "+ ' · v8.30'; /* v8.19 - the footer names the release once */", 'Release footer', str(path))
    path.write_text(text, encoding='utf-8')
    print('Reviewed plan-note transcription applied; operational records untouched.')


if __name__ == '__main__':
    main()
