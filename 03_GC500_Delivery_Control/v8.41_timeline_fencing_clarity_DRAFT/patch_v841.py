#!/usr/bin/env python3
"""Author: Andrew Fisher. Timeline lights and clearer live work instruments."""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '573df8e5440f7cd9c48452a52632114bdc4cedbdf3254db007dc6bff35e48929'

def require(ok, message):
    if not ok:
        raise ValueError(message)

def build(raw):
    require(hashlib.sha256(raw).hexdigest() == BASE_SHA256,
            'Refusing a different live base; rebuild and review this patch')
    text = raw.decode('utf-8')
    require('function todayFencingSummary841(' not in text,
            'v8.41 already applied')
    previous = ROOT.parent / 'v8.40_today_work_progress_LIVE'
    text = rep(text, (previous / 'today_work840_src.js').read_text(),
               (ROOT / 'fencing_metrics841_src.js').read_text() + '\n\n' +
               (ROOT / 'today_work841_src.js').read_text(),
               'Expanded fencing detail and automatic Today motion', 'v8.41')
    text = rep(text, '<style id="today-work-v840">\n' +
               (previous / 'today_work840_src.css').read_text() + '\n</style>',
               '<style id="today-work-v840">\n' +
               (ROOT / 'today_work841_src.css').read_text() + '\n</style>',
               'Crisp scoped instrument presentation', 'v8.41')
    # Timeline integration is supplied by its independently scoped implementation.
    sys.path.insert(0, str(ROOT))
    from timeline841_patch import apply
    text = apply(text)
    text = rep(text, '<meta name="gc500-release" content="v8.40">',
               '<meta name="gc500-release" content="v8.41">', 'Release metadata', 'v8.41')
    text = rep(text, "+ ' · v8.40'; /* v8.19 - the footer names the release once */",
               "+ ' · v8.41'; /* v8.19 - the footer names the release once */",
               'Release footer', 'v8.41')
    return text.encode('utf-8')

if __name__ == '__main__':
    require(len(sys.argv) == 2, 'Usage: patch_v841.py WORKING_COPY.html')
    path = Path(sys.argv[1])
    path.write_bytes(build(path.read_bytes()))
    print('Timeline and Today corrections applied; no shared record writes.')
