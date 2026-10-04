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
               (ROOT / 'group_details841_src.js').read_text() + '\n\n' +
               (ROOT / 'today_work841_src.js').read_text(),
               'Expanded fencing detail and automatic Today motion', 'v8.41')
    text = rep(text, '<style id="today-work-v840">\n' +
               (previous / 'today_work840_src.css').read_text() + '\n</style>',
               '<style id="today-work-v840">\n' +
               (ROOT / 'today_work841_src.css').read_text() + '\n</style>',
               'Crisp scoped instrument presentation', 'v8.41')
    # The old group section is omitted only after its replacement confirms full
    # coverage. Native group, money and record calculations remain authoritative.
    text = rep(text,
               'function todayWorkBoard840(asOf) { return TodayWork840.build(asOf); }',
               "function todayWorkDay841(){ return /^\\d{4}-\\d{2}-\\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso(); }\n"
               "function todayGroupsMerged841(){ return state.tab === 'today' && !!document.querySelector('#gc500-work-board840[data-tw841-groups-merged=\"true\"]'); }\n"
               'function todayWorkBoard840(asOf) { return TodayWork840.build(todayWorkDay841()); }',
               'One selected date across merged work instruments', 'v8.41')
    text = rep(text, 'function dsnGroups(asOf, X){\n const {rows, P} = X;',
               "function dsnGroups(asOf, X){\n if (todayGroupsMerged841()) return ''; /* v8.41: represented once in the work instruments */\n const {rows, P} = X;",
               'Remove migrated group section after full coverage', 'v8.41')
    text = rep(text,
               'function renderProgress(){ return holdAssets(() => {const r = renderProgress_held(); wwaPlace793(); pack795(); return r; }); } /* v7.93 */ /* v6.69 - one asset list for the whole draw */',
               'function renderProgress(){ if (todayGroupsMerged841()) return renderToday(); return holdAssets(() => {const r = renderProgress_held(); wwaPlace793(); pack795(); return r; }); } /* v8.41: replay refreshes the merged instruments together */',
               'Date replay and progress refresh retain one board', 'v8.41')
    text = rep(text,
               "const byGroup = [...dsn.querySelectorAll(':scope > h3.sec')].find(h => /^By group/.test(h.textContent.trim()));",
               "const byGroup = todayGroupsMerged841() ? document.getElementById('gc500-work-board840') : [...dsn.querySelectorAll(':scope > h3.sec')].find(h => /^By group/.test(h.textContent.trim()));",
               'Current work navigation target', 'v8.41')
    text = rep(text, "['By group', byGroup]",
               "[todayGroupsMerged841() ? 'Work progress' : 'By group', byGroup]",
               'One work progress navigation label', 'v8.41')
    text = rep(text,
               "if (n === 'By group') return [...pp.querySelectorAll('.dsn > h3.sec')].find(h => /^By group/.test(h.textContent.trim())) || null;",
               "if (n === 'By group' || n === 'Work progress') return (todayGroupsMerged841() && document.getElementById('gc500-work-board840')) || [...pp.querySelectorAll('.dsn > h3.sec')].find(h => /^By group/.test(h.textContent.trim())) || null;",
               'Restore work target after refresh', 'v8.41')
    text = rep(text, "land795(() => pp.querySelector('.dsn > h3.sec'));",
               "land795(() => (todayGroupsMerged841() && document.getElementById('gc500-work-board840')) || pp.querySelector('.dsn > h3.sec'));",
               'Legacy Where we are link lands on instruments', 'v8.41')
    # Timeline integration is supplied by its independently scoped implementation.
    sys.path.insert(0, str(ROOT))
    from timeline841_patch import apply
    text = apply(text)
    from supplier_print841_patch import apply as apply_supplier_print
    text = apply_supplier_print(text)
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
