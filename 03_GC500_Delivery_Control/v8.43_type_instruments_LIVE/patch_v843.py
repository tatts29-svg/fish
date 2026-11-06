#!/usr/bin/env python3
"""Author: Andrew Fisher. Individual Today instruments for every supported type."""
from pathlib import Path
import hashlib
import importlib.util
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = 'd3495d9221414c8997d8962fc83031b86b10b500458c9e477197926b337d154a'
PREVIOUS = ROOT.parent / 'v8.42_today_plan_clarity_LIVE'
spec = importlib.util.spec_from_file_location('previous842', PREVIOUS / 'patch_v842.py')
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)


def build(raw):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Refusing a different live base; rebuild and review this patch')
    text = raw.decode('utf-8')
    if 'function todayTypeMetrics843(' in text:
        raise ValueError('v8.43 already applied')
    text = rep(text, previous.resolved_day((PREVIOUS / 'today_work842_src.js').read_text()),
               (ROOT / 'type_metrics843_src.js').read_text() + '\n\n' +
               previous.resolved_day((ROOT / 'today_work843_src.js').read_text()),
               'Individual type instruments and details', 'v8.43')
    text = rep(text, '<style id="today-work-v840">\n' +
               (PREVIOUS / 'today_work842_src.css').read_text() + '\n</style>',
               '<style id="today-work-v840">\n' +
               (ROOT / 'today_work843_src.css').read_text() + '\n</style>',
               'Readable per-type LED instruments', 'v8.43')
    text = rep(text, '<meta name="gc500-release" content="v8.42">',
               '<meta name="gc500-release" content="v8.43">', 'Release metadata', 'v8.43')
    text = rep(text, "+ ' · v8.42'; /* v8.19 - the footer names the release once */",
               "+ ' · v8.43'; /* v8.19 - the footer names the release once */",
               'Release footer', 'v8.43')
    return text.encode('utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v843.py WORKING_COPY.html')
    path = Path(sys.argv[1])
    path.write_bytes(build(path.read_bytes()))
    print('Type instruments updated; native records and financial models unchanged.')
