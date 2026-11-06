#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent exact v8.49 preservation boundaries.

Reads private evidence only in memory. Prints check labels and hashes, not
operational records, private source contents or commercial values.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BASE_HASH = '5d786af57e3986fc912cf34d33f094566a41836ee88a1160f5a3dab05e339a47'


def json_literal(text, prefix):
    if text.count(prefix) != 1:
        raise ValueError('Expected a unique declaration: ' + prefix)
    start = text.index(prefix) + len(prefix)
    value, length = json.JSONDecoder().raw_decode(text[start:])
    return value, text[start:start + length]


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

    check('base is the exact verified v8.48 public page', hashlib.sha256(raw_base).hexdigest() == BASE_HASH)
    check('candidate release identifies v8.49 exactly once', candidate.count('<meta name="gc500-release" content="v8.49">') == 1)
    for name in ('DATA', 'FENCE_REVIEW836', 'FENCE_TRACE837', 'FENCE_PROGRESS848'):
        before = json_literal(base, 'const ' + name + ' = ')
        after = json_literal(candidate, 'const ' + name + ' = ')
        check(name + ' complete source value and literal bytes unchanged', before == after)

    evidence = json.loads(Path(args.evidence).read_text(encoding='utf-8'))
    injected, literal = json_literal(candidate, 'const FENCE_EVIDENCE849 = ')
    check('supplementary evidence equals reviewed private input and stays outside DATA',
          injected == evidence and injected.get('author') == 'Andrew Fisher' and injected.get('schema') == 1
          and 'FENCE_EVIDENCE849' not in base
          and not any('849' in name for name in json_literal(candidate, 'const DATA = ')[0]))
    for name in ('fencing_metrics848_src.js', 'work_summary848_src.js', 'linked_fencing848_src.js'):
        source = (ROOT / 'v8.48_collapsible_groups_LIVE' / name).read_text(encoding='utf-8')
        check(name + ' existing metric implementation remains byte-exact', source in base and source in candidate)

    # JSON source descriptors include map geometry, source inventory, operational
    # records, programme quantities and money inputs. Compare every original
    # declaration that is a JSON value, rather than a handpicked record subset.
    declarations = []
    for match in re.finditer(r'^const ([A-Z][A-Z0-9_]*) = ', base, re.M):
        prefix = match.group(0)
        try:
            old = json_literal(base, prefix)
        except (ValueError, json.JSONDecodeError):
            continue
        declarations.append((match.group(1), old == json_literal(candidate, prefix)))
    check('all original JSON declarations and source-file descriptors are byte-exact',
          bool(declarations) and all(passed for _, passed in declarations))
    media = lambda text: re.findall(r'<(?:video|audio|source|iframe)\b[^>]*>', text, re.I)
    external = lambda text: re.findall(r'<script\b[^>]*\bsrc=[^>]*>', text, re.I)
    check('all original media markup and external script descriptors unchanged', media(base) == media(candidate) and external(base) == external(candidate))

    # Independent full-page restoration. The whitelist is explicit and does not
    # call the patch builder. Any unrelated code, rates, source, financial helper,
    # percentage calculation or media change leaves a byte mismatch.
    normal = candidate
    addition = 'const FENCE_EVIDENCE849 = ' + literal + ';\n\n' + '\n\n'.join(
        (HERE / name).read_text(encoding='utf-8') for name in
        ('components849_src.js', 'evidence849_src.js', 'components849_ui.js')) + '\n\nbindFenceComponents849(document);\n\n'
    normal = undo(normal, addition + 'var TodayWork840 = (() => {', 'var TodayWork840 = (() => {', 'Separate operational module')
    # rep() consumes leading whitespace at its match; restore only the exact
    # whitespace at these reviewed insertion sites, without normalising the page.
    normal = undo(normal, "+ compactFencing847() + renderFenceComponents849(renderedDay, 'today') : '<div", " + compactFencing847() : '<div", 'Today supplementary insertion')
    normal = undo(normal, '${fenceCcbOverview847()}${renderFenceComponents849(todayIso(), "fencing")}<section class="fp-register"', '${fenceCcbOverview847()}<section class="fp-register"', 'Fencing supplementary insertion')
    normal = undo(normal,
                  "function renderFencing(){ const kept849 = captureFenceComponents849('fencing'); return holdAssets(() => { renderFencing_held(); fencePrivateApply(); restoreFenceComponents849(kept849); }); }",
                  'function renderFencing(){ return holdAssets(() => { renderFencing_held(); fencePrivateApply(); }); }',
                  'Active supplementary planner focus restoration')
    original_sources = "const sources = [...(Array.isArray(reviewed) ? reviewed : []), ...(Array.isArray(operations) ? operations : [])];"
    extended_sources = "const sources = [...(Array.isArray(reviewed) ? reviewed : []), ...(Array.isArray(operations) ? operations : []), ...(typeof FENCE_EVIDENCE849 !== 'undefined' && Array.isArray(FENCE_EVIDENCE849.sources) ? FENCE_EVIDENCE849.sources : [])];"
    normal = undo(normal, extended_sources, '    ' + original_sources, 'Source readiness signature extension')
    normal = undo(normal, '\n' + (HERE / 'components849.css').read_text(encoding='utf-8') + '\n</style>', '</style>', 'Supplementary component styles')
    normal = undo(normal, '<meta name="gc500-release" content="v8.49">', '<meta name="gc500-release" content="v8.48">', 'Release metadata')
    normal = undo(normal, "+ ' · v8.49'; /* v8.19 - the footer names the release once */", "+ ' · v8.48'; /* v8.19 - the footer names the release once */", 'Release footer')
    check('all other page bytes including every financial helper and existing total are unchanged', normal.encode('utf-8') == raw_base)
    print(json.dumps({'author': 'Andrew Fisher', 'base': hashlib.sha256(raw_base).hexdigest(),
                      'candidate': hashlib.sha256(raw_candidate).hexdigest(),
                      'source_declarations': len(declarations), 'passed': sum(passed for _, passed in checks), 'total': len(checks)}))
    if not all(passed for _, passed in checks):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
