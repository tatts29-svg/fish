#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent exact preservation of the verified page.

Reads private evidence in memory; no source quantities or financials are printed.
The reverse allowlist is independent of patch_v850.py.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BASE_HASH = '924955d5560006bcac1fd07765dffb51692154e04585dae1eefcc292ef602fb1'


def json_literal(text, prefix):
    if text.count(prefix) != 1:
        raise ValueError('Expected one declaration: ' + prefix)
    start = text.index(prefix) + len(prefix)
    value, size = json.JSONDecoder().raw_decode(text[start:])
    return value, text[start:start + size]


def main():
    parser = argparse.ArgumentParser()
    for name in ('base', 'candidate', 'evidence'):
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    raw_base, raw_candidate = Path(args.base).read_bytes(), Path(args.candidate).read_bytes()
    base, candidate = raw_base.decode('utf-8'), raw_candidate.decode('utf-8')
    checks = []

    def check(label, passed):
        checks.append((label, bool(passed)))
        print(('PASS ' if passed else 'FAIL ') + label)

    def undo(text, new, old, label):
        count = text.count(new)
        check(label + ' has one exact boundary', count == 1)
        return text.replace(new, old, 1) if count == 1 else text

    check('base is the exact verified v8.49 public page', hashlib.sha256(raw_base).hexdigest() == BASE_HASH)
    check('candidate identifies v8.50 exactly once', candidate.count('<meta name="gc500-release" content="v8.50">') == 1)
    for name in ('DATA', 'FENCE_REVIEW836', 'FENCE_TRACE837', 'FENCE_PROGRESS848', 'FENCE_EVIDENCE849'):
        check(name + ' complete value and literal bytes unchanged',
              json_literal(base, 'const ' + name + ' = ') == json_literal(candidate, 'const ' + name + ' = '))
    evidence = json.loads(Path(args.evidence).read_text(encoding='utf-8'))
    injected, literal = json_literal(candidate, 'const FENCE_PO850 = ')
    check('separate supplier catalogue equals reviewed private input', injected == evidence
          and injected.get('author') == 'Andrew Fisher' and injected.get('schema') == 1
          and injected.get('canAddToProgrammeDone') is False and 'FENCE_PO850' not in base)
    for folder, names in (
        ('v8.48_collapsible_groups_LIVE', ('fencing_metrics848_src.js', 'work_summary848_src.js', 'linked_fencing848_src.js')),
        ('v8.49_fencing_components_LIVE', ('components849_src.js', 'evidence849_src.js', 'components849.css'))):
        for name in names:
            source = (ROOT / folder / name).read_text(encoding='utf-8')
            check(name + ' implementation remains byte-exact', source in base and source in candidate)

    declarations = []
    for match in re.finditer(r'^const ([A-Z][A-Z0-9_]*) = ', base, re.M):
        try:
            old = json_literal(base, match.group(0))
        except (ValueError, json.JSONDecodeError):
            continue
        declarations.append((match.group(1), old == json_literal(candidate, match.group(0))))
    check('every original JSON declaration and source descriptor is byte-exact',
          bool(declarations) and all(passed for _, passed in declarations))
    media = lambda text: re.findall(r'<(?:video|audio|source|iframe)\b[^>]*>', text, re.I)
    external = lambda text: re.findall(r'<script\b[^>]*\bsrc=[^>]*>', text, re.I)
    check('all original media and external scripts unchanged', media(base) == media(candidate) and external(base) == external(candidate))

    normal = candidate
    addition = 'const FENCE_PO850 = ' + literal + ';\n\n' + '\n\n'.join(
        (HERE / name).read_text(encoding='utf-8') for name in ('po_progress850_src.js', 'po_evidence850_ui.js')) + '\n\n'
    normal = undo(normal, addition + 'var TodayWork840 = (() => {', 'var TodayWork840 = (() => {', 'Separate supplier module')
    # rep consumes the one leading space at this inline insertion boundary.
    normal = undo(normal,
                  "+ issueFold + renderFencePoEvidence850(day, scope) + fold('guide', 'Planning guide — separate estimates', planner)",
                  " + issueFold + fold('guide', 'Planning guide — separate estimates', planner)", 'Existing component disclosure insertion')
    old_sources = "const sources = [...(Array.isArray(reviewed) ? reviewed : []), ...(Array.isArray(operations) ? operations : []), ...(typeof FENCE_EVIDENCE849 !== 'undefined' && Array.isArray(FENCE_EVIDENCE849.sources) ? FENCE_EVIDENCE849.sources : [])];"
    new_sources = "const sources = [...(Array.isArray(reviewed) ? reviewed : []), ...(Array.isArray(operations) ? operations : []), ...(typeof FENCE_EVIDENCE849 !== 'undefined' && Array.isArray(FENCE_EVIDENCE849.sources) ? FENCE_EVIDENCE849.sources : []), ...(typeof FENCE_PO850 !== 'undefined' && Array.isArray(FENCE_PO850.sources) ? FENCE_PO850.sources : [])];"
    normal = undo(normal, new_sources, old_sources, 'Source hydration signature')
    css = HERE / 'po_evidence850.css'
    if css.exists():
        normal = undo(normal, '\n' + css.read_text(encoding='utf-8') + '\n</style>', '</style>', 'Isolated supplier evidence styles')
    normal = undo(normal, '<meta name="gc500-release" content="v8.50">', '<meta name="gc500-release" content="v8.49">', 'Release metadata')
    normal = undo(normal, "+ ' · v8.50'; /* v8.19 - the footer names the release once */", "+ ' · v8.49'; /* v8.19 - the footer names the release once */", 'Release footer')
    check('all remaining page bytes, existing UI, totals and financial helpers unchanged', normal.encode('utf-8') == raw_base)
    print(json.dumps({'author': 'Andrew Fisher', 'base': hashlib.sha256(raw_base).hexdigest(),
                      'candidate': hashlib.sha256(raw_candidate).hexdigest(), 'source_declarations': len(declarations),
                      'passed': sum(passed for _, passed in checks), 'total': len(checks)}))
    if not all(passed for _, passed in checks):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
