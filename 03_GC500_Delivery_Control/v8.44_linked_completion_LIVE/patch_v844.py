#!/usr/bin/env python3
"""Author: Andrew Fisher. Link progress to native item, location and photo evidence."""
from pathlib import Path
import hashlib
import importlib.util
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '6b1c0c142e3633b9a05727f2279fcb5a549969e86191c82e3dc7776f6c7fefb7'
PREVIOUS = ROOT.parent / 'v8.43_type_instruments_LIVE'
spec = importlib.util.spec_from_file_location('previous843', PREVIOUS / 'patch_v843.py')
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)


def build(raw):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Refusing a different live base; rebuild and review this patch')
    text = raw.decode('utf-8')
    if 'function todayLinkedReferences844(' in text:
        raise ValueError('v8.44 already applied')
    resolve = previous.previous.resolved_day
    sources = [(ROOT / name).read_text() for name in
               ['linked_references844_src.js', 'linked_fencing844_src.js']]
    text = rep(text, resolve((PREVIOUS / 'today_work843_src.js').read_text()),
               '\n\n'.join(sources) + '\n\n' + resolve((ROOT / 'today_work844_src.js').read_text()),
               'Connected item and location details', 'v8.44')
    text = rep(text, '<style id="today-work-v840">\n' +
               (PREVIOUS / 'today_work843_src.css').read_text() + '\n</style>',
               '<style id="today-work-v840">\n' +
               (ROOT / 'today_work844_src.css').read_text() + '\n</style>',
               'Readable connected work details', 'v8.44')
    text = rep(text, '<meta name="gc500-release" content="v8.43">',
               '<meta name="gc500-release" content="v8.44">', 'Release metadata', 'v8.44')
    text = rep(text, "+ ' · v8.43'; /* v8.19 - the footer names the release once */",
               "+ ' · v8.44'; /* v8.19 - the footer names the release once */",
               'Release footer', 'v8.44')
    return text.encode('utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v844.py WORKING_COPY.html')
    path = Path(sys.argv[1])
    path.write_bytes(build(path.read_bytes()))
    print('Connected work details updated; shared records and native controls preserved.')
