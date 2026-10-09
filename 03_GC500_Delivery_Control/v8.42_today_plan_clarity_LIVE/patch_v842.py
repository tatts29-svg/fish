#!/usr/bin/env python3
"""Author: Andrew Fisher. Clear Today totals and explicitly based plan comparisons."""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '59088bb3da40fe01a2db224a538ebd010b26933d4a0c000969c744f9a30c2457'

def resolved_day(source):
    # The v8.41 integration already resolves the selected day at this wrapper.
    # Keep that behaviour exactly while replacing the separately stored UI source.
    original = 'function todayWorkBoard840(asOf) { return TodayWork840.build(asOf); }'
    effective = (
        "function todayWorkDay841(){ return /^\\d{4}-\\d{2}-\\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso(); }\n"
        "function todayGroupsMerged841(){ return state.tab === 'today' && !!document.querySelector('#gc500-work-board840[data-tw841-groups-merged=\"true\"]'); }\n"
        'function todayWorkBoard840(asOf) { return TodayWork840.build(todayWorkDay841()); }'
    )
    return rep(source, original, effective, 'Preserve selected-day wrapper', 'v8.42')

def build(raw):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Refusing a different live base; rebuild and review this patch')
    text = raw.decode('utf-8')
    if 'function todayWorkSummary842(' in text:
        raise ValueError('v8.42 already applied')
    previous = ROOT.parent / 'v8.41_timeline_fencing_clarity_LIVE'
    text = rep(text, resolved_day((previous / 'today_work841_src.js').read_text()),
               (ROOT / 'work_summary842_src.js').read_text() + '\n\n' +
               resolved_day((ROOT / 'today_work842_src.js').read_text()),
               'Clear totals and sourced programme status', 'v8.42')
    text = rep(text, '<style id="today-work-v840">\n' +
               (previous / 'today_work841_src.css').read_text() + '\n</style>',
               '<style id="today-work-v840">\n' +
               (ROOT / 'today_work842_src.css').read_text() + '\n</style>',
               'Readable laptop instruments', 'v8.42')
    text = rep(text, '<meta name="gc500-release" content="v8.41">',
               '<meta name="gc500-release" content="v8.42">', 'Release metadata', 'v8.42')
    text = rep(text, "+ ' · v8.41'; /* v8.19 - the footer names the release once */",
               "+ ' · v8.42'; /* v8.19 - the footer names the release once */",
               'Release footer', 'v8.42')
    return text.encode('utf-8')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v842.py WORKING_COPY.html')
    path = Path(sys.argv[1])
    path.write_bytes(build(path.read_bytes()))
    print('Today summary updated; native records and financial models unchanged.')
