#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent read-only, exact-byte preservation check."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
spec = importlib.util.spec_from_file_location('preserve850', ROOT / 'v8.50_po_gate_progress_LIVE/test_preserve850.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
literal = module.json_literal


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    parser.add_argument('--candidate', required=True)
    args = parser.parse_args()
    raw_base, raw_candidate = Path(args.base).read_bytes(), Path(args.candidate).read_bytes()
    old, new = raw_base.decode('utf-8'), raw_candidate.decode('utf-8')
    checks = []

    def check(label, passed):
        checks.append((label, bool(passed)))
        print(('PASS ' if passed else 'FAIL ') + label)

    def undo(text, replacement, original, label):
        check(label + ' has one exact boundary', text.count(replacement) == 1)
        return text.replace(replacement, original, 1) if text.count(replacement) == 1 else text

    check('Exact verified v8.52 base', hashlib.sha256(raw_base).hexdigest() == '7a07fac2b357c9c19ea9ff26fd1b863d2f7395c2d505098579ea5ed72c705873')
    check('Candidate identifies v8.53 exactly once', new.count('<meta name="gc500-release" content="v8.53">') == 1)
    declarations = []
    for match in re.finditer(r'^const ([A-Z][A-Z0-9_]*) = ', old, re.M):
        try:
            previous = literal(old, match.group(0))
        except (ValueError, json.JSONDecodeError):
            continue
        declarations.append(match.group(1))
        check(match.group(1) + ' value and literal bytes preserved', previous == literal(new, match.group(0)))
    check('Original JSON source declarations exist', bool(declarations))
    media = lambda text: re.findall(r'<(?:img|video|audio|source|iframe)\b[^>]*>', text, re.I)
    external = lambda text: re.findall(r'<script\b[^>]*\bsrc=[^>]*>', text, re.I)
    check('Original media and external script tags unchanged', media(old) == media(new) and external(old) == external(new))
    for folder, files in (
        ('v8.48_collapsible_groups_LIVE', ('fencing_metrics848_src.js', 'work_summary848_src.js', 'linked_fencing848_src.js')),
        ('v8.49_fencing_components_LIVE', ('components849_src.js', 'evidence849_src.js', 'components849.css')),
        ('v8.50_po_gate_progress_LIVE', ('po_progress850_src.js',)),
    ):
        for filename in files:
            source = (ROOT / folder / filename).read_text()
            check(filename + ' remains byte-exact', source in old and source in new)

    normal = new
    normal = undo(normal, (HERE / 'fencing_overall853_src.js').read_text() + '\nvar TodayWork840 = (() => {', 'var TodayWork840 = (() => {', 'Separate read-only work-metres model')
    normal = undo(normal, 'let areas = [], fencing = null, groupDetails = null, overallFencing = null, workSummary = null,', '  let areas = [], fencing = null, groupDetails = null, workSummary = null,', 'Today display state')
    normal = undo(normal, (HERE / 'fencing_overall853_ui.js').read_text() + '\n  function groupSummary848(area) {', '  function groupSummary848(area) {', 'Separate display helpers')
    normal = undo(normal, 'const body = fence ? overallFencingCard853(area, title) :', "    const body = fence ? '<div class=\"tw846-fence-title\">' + title + '<p>Recorded and left by work type</p></div>'+ compactFencing847() + renderFenceComponents849(renderedDay, 'today') :", 'Today fencing headline renderer')
    normal = undo(normal, "const expanded = (fence ? fencingRows() + renderFenceComponents849(renderedDay, 'today') :", '    const expanded = (fence ? fencingRows() :', 'Preserved readings moved into View details')
    normal = undo(normal, "+ ' aria-pressed=", " + (fence ? ' hidden' : '') + ' aria-pressed=", 'Existing fencing animation control enabled')
    normal = undo(normal, "const compact = fence ? '<span class=\"tw848-closed-counts\"><span><strong>' + overallRange853(overallFencing?.pct,'%') + '</strong> work metres recorded</span></span><span class=\"tw848-closed-basis\">' + (count ? format(count) + ' work types' : 'Loading work types') + (overallFencing?.provisional ? ' · provisional programme' : '') + '</span>' :", "    const compact = fence ? '<span class=\"tw848-closed-basis\">' + (count ? format(count) + ' work types' : 'Loading work types') + ' · totals, recorded and left</span>' :", 'Collapsed fencing display copy')
    normal = undo(normal, 'workSummary = todayWorkSummary848(asOf, areas, groupDetails, fencing);\n    overallFencing = fenceOverall853(asOf, workSummary, fencing);', '    workSummary = todayWorkSummary848(asOf, areas, groupDetails, fencing);', 'Read existing authoritative model')
    normal = undo(normal, "  function detailHtml(area, mode) {\n    if (area.id === 'fencing') return overallFencingDetail853(mode);", '  function detailHtml(area, mode) {', 'Overall fencing detail display route')
    normal = undo(normal, '<style id="fencing-overall853">\n' + (HERE / 'fencing_overall853.css').read_text() + '\n</style>\n</head>\n<body>', '</head>\n<body>', 'Scoped display styles')
    normal = undo(normal, '<meta name="gc500-release" content="v8.53">', '<meta name="gc500-release" content="v8.52">', 'Release metadata')
    normal = undo(normal, "+ ' · v8.53'; /* v8.19 - the footer names the release once */", "+ ' · v8.52'; /* v8.19 - the footer names the release once */", 'Release footer')
    check('All other page bytes, financial logic, source logic, controls and media unchanged', normal.encode('utf-8') == raw_base)
    print(json.dumps({'author': 'Andrew Fisher', 'base': hashlib.sha256(raw_base).hexdigest(), 'candidate': hashlib.sha256(raw_candidate).hexdigest(), 'bytes': len(raw_candidate), 'sourceDeclarations': len(declarations), 'passed': sum(passed for _, passed in checks), 'total': len(checks)}))
    if not all(passed for _, passed in checks):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
