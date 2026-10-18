#!/usr/bin/env python3
"""Author: Andrew Fisher. Supplementary components and estimates; original totals untouched."""
from pathlib import Path
import hashlib
import json
import os
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '5d786af57e3986fc912cf34d33f094566a41836ee88a1160f5a3dab05e339a47'

def build(raw):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Refusing changed live base or repeated patch')
    text = raw.decode('utf-8')
    source = os.environ.get('FENCE_EVIDENCE849_INPUT')
    if not source:
        raise ValueError('The reviewed private evidence input is required')
    evidence = json.loads(Path(source).read_text())
    if evidence.get('schema') != 1 or evidence.get('author') != 'Andrew Fisher' or not evidence.get('sources') or not evidence.get('items'):
        raise ValueError('Invalid reviewed source input')
    encoded = json.dumps(evidence, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029').replace('Andrew Fisher', 'Andrew\\u0020Fisher')
    addition = 'const FENCE_EVIDENCE849 = ' + encoded + ';\n\n' + '\n\n'.join((ROOT / name).read_text() for name in ['components849_src.js', 'evidence849_src.js', 'components849_ui.js']) + '\n\nbindFenceComponents849(document);\n\n'
    text = rep(text, 'var TodayWork840 = (() => {', addition + 'var TodayWork840 = (() => {', 'Separate component evidence and planner', 'v8.49')
    text = rep(text, "+ compactFencing847() : '<div", "+ compactFencing847() + renderFenceComponents849(renderedDay, 'today') : '<div", 'Today component readings', 'v8.49')
    text = rep(text, '${fenceCcbOverview847()}<section class="fp-register"', '${fenceCcbOverview847()}${renderFenceComponents849(todayIso(), "fencing")}<section class="fp-register"', 'Fencing component readings', 'v8.49')
    text = rep(text, 'function renderFencing(){ return holdAssets(() => { renderFencing_held(); fencePrivateApply(); }); }', "function renderFencing(){ const kept849 = captureFenceComponents849('fencing'); return holdAssets(() => { renderFencing_held(); fencePrivateApply(); restoreFenceComponents849(kept849); }); }", 'Retain active planner focus during native redraw', 'v8.49')
    old = "const sources = [...(Array.isArray(reviewed) ? reviewed : []), ...(Array.isArray(operations) ? operations : [])];"
    # Extend the existing source-readiness signature without adding polling.
    if old in text:
        new = old.replace('];', ", ...(typeof FENCE_EVIDENCE849 !== 'undefined' && Array.isArray(FENCE_EVIDENCE849.sources) ? FENCE_EVIDENCE849.sources : [])];")
        text = rep(text, old, new, 'Evidence source hydration', 'v8.49')
    else:
        raise ValueError('Existing reviewed-source hydration signature changed')
    style_start = text.index('<style id="today-work-v840"')
    style_end = text.index('</style>', style_start)
    text = text[:style_end] + '\n' + (ROOT / 'components849.css').read_text() + '\n' + text[style_end:]
    text = rep(text, '<meta name="gc500-release" content="v8.48">', '<meta name="gc500-release" content="v8.49">', 'Release metadata', 'v8.49')
    text = rep(text, "+ ' · v8.48'; /* v8.19 - the footer names the release once */", "+ ' · v8.49'; /* v8.19 - the footer names the release once */", 'Release footer', 'v8.49')
    return text.encode('utf-8')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v849.py WORKING_COPY.html (requires FENCE_EVIDENCE849_INPUT)')
    page = Path(sys.argv[1])
    page.write_bytes(build(page.read_bytes()))
    print('Added separate component reconciliation and planning guide; original totals unchanged.')
