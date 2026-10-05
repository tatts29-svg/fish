#!/usr/bin/env python3
"""Author: Andrew Fisher. Separate source quantities; no progress or financial edits."""
from pathlib import Path
import hashlib
import json
import os
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '924955d5560006bcac1fd07765dffb51692154e04585dae1eefcc292ef602fb1'


def build(raw):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Refusing changed live base or repeated patch')
    source = os.environ.get('FENCE_PO850_INPUT')
    if not source:
        raise ValueError('Reviewed private P/O quantity evidence is required')
    evidence = json.loads(Path(source).read_text())
    if evidence.get('schema') != 1 or evidence.get('author') != 'Andrew Fisher' or not evidence.get('items') or not evidence.get('sources') or evidence.get('canAddToProgrammeDone') is not False:
        raise ValueError('Invalid separate source-quantity input')
    encoded = json.dumps(evidence, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029').replace('Andrew Fisher', 'Andrew\\u0020Fisher')
    addition = 'const FENCE_PO850 = ' + encoded + ';\n\n' + '\n\n'.join((ROOT / name).read_text() for name in ['po_progress850_src.js', 'po_evidence850_ui.js']) + '\n\n'
    text = rep(raw.decode('utf-8'), 'var TodayWork840 = (() => {', addition + 'var TodayWork840 = (() => {', 'Separate P/O source quantities', 'v8.50')
    old = "+ issueFold + fold('guide', 'Planning guide — separate estimates', planner)"
    new = "+ issueFold + renderFencePoEvidence850(day, scope) + fold('guide', 'Planning guide — separate estimates', planner)"
    text = rep(text, old, new, 'Source quantities inside existing disclosure', 'v8.50')
    old = "const sources = [...(Array.isArray(reviewed) ? reviewed : []), ...(Array.isArray(operations) ? operations : []), ...(typeof FENCE_EVIDENCE849 !== 'undefined' && Array.isArray(FENCE_EVIDENCE849.sources) ? FENCE_EVIDENCE849.sources : [])];"
    new = old.replace('];', ", ...(typeof FENCE_PO850 !== 'undefined' && Array.isArray(FENCE_PO850.sources) ? FENCE_PO850.sources : [])];")
    text = rep(text, old, new, 'P/O evidence source hydration', 'v8.50')
    css = ROOT / 'po_evidence850.css'
    if css.exists():
        start = text.index('<style id="today-work-v840"')
        end = text.index('</style>', start)
        text = text[:end] + '\n' + css.read_text() + '\n' + text[end:]
    text = rep(text, '<meta name="gc500-release" content="v8.49">', '<meta name="gc500-release" content="v8.50">', 'Release metadata', 'v8.50')
    text = rep(text, "+ ' · v8.49'; /* v8.19 - the footer names the release once */", "+ ' · v8.50'; /* v8.19 - the footer names the release once */", 'Release footer', 'v8.50')
    return text.encode('utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v850.py WORKING_COPY.html (requires FENCE_PO850_INPUT)')
    page = Path(sys.argv[1])
    page.write_bytes(build(page.read_bytes()))
    print('Added separate, linked P/O quantities; existing totals and financials unchanged.')
