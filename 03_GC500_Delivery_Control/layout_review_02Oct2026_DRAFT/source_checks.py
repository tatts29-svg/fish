#!/usr/bin/env python3
"""Author: Andrew Fisher. Bounded private-preview packaging and refusal checks."""
import argparse
import json
from pathlib import Path
from patch_preview import BASE_SHA, PREVIEW_SHA, SOURCE_SHA, build_preview, digest


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('base', type=Path)
    ap.add_argument('--report', type=Path, required=True)
    args = ap.parse_args()
    root = Path(__file__).resolve().parent
    base = args.base.read_bytes()
    source = (root / 'layout_preview.js').read_bytes()
    output = build_preview(base, source)
    insertion = b'<script>\n' + source + b'\n</script>\n'
    checks = [
        ('reviewed_base_hash', digest(base) == BASE_SHA),
        ('reviewed_source_hash', digest(source) == SOURCE_SHA),
        ('reviewed_preview_rebuilt_exactly', digest(output) == PREVIEW_SHA),
        ('one_component_at_final_body_only', output.count(insertion) == 1 and output.endswith(insertion + b'</body></html>\n')),
        ('all_original_bytes_restored', output.replace(insertion, b'') == base),
        ('no_new_stylesheet', b'<style' not in source),
    ]
    for name, b, s in [('repeat_application_refused', output, source),
                       ('changed_base_refused', base + b' ', source),
                       ('changed_component_refused', base, source + b' ')]:
        try:
            build_preview(b, s)
        except ValueError:
            checks.append((name, True))
        else:
            checks.append((name, False))
    report = {'author': 'Andrew Fisher', 'status': 'PRIVATE DRAFT packaging only',
              'base_sha256': BASE_SHA, 'source_sha256': SOURCE_SHA,
              'prototype_sha256': PREVIEW_SHA,
              'checks': [{'id': k, 'passed': v} for k, v in checks],
              'passed': sum(v for _, v in checks), 'total': len(checks),
              'limit': 'No release readiness or browser behaviour inferred from these static guards.'}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(str(report['passed']) + '/' + str(report['total']) + ' source guards passed')
    if not all(v for _, v in checks):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
