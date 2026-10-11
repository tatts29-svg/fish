#!/usr/bin/env python3
"""Read-only destination audit. Author: Andrew Fisher.

Usage: INPUT=/path/to/export EXPECTED=/path/to/ref-destination.json python verify_destinations_pdf.py
Also accepts positional INPUT EXPECTED. Writes only a private verification report.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import date
from pathlib import Path

import fitz

BASELINE = Path('/workspace/private-gc500-dest1002/native-details.json')
MM = 72 / 25.4


def pdf_normalise(value):
    """Match the app's epText860 conversion, ignoring PDF line wrapping only."""
    text = str(value).translate(str.maketrans({'–': '-', '—': '-', '‘': "'", '’': "'", '“': '"', '”': '"', '×': 'x'}))
    text = ''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c))
    return re.sub(r'\s+', '', text)


def native_url(row):
    return row.get('dispatchUrl') or row.get('url') or ''


def delivery_identity(row):
    return [row.get('ref'), row.get('item'), row.get('date'), row.get('remaining')]


def load_json(path):
    return json.loads(path.read_text())


def run(input_dir, expected_path, baseline_path, report_path):
    checks = []

    def check(name, passed, detail=None):
        result = {'name': name, 'pass': bool(passed)}
        if not passed:
            result['detail'] = detail
            print('FAIL:', name, json.dumps(detail, ensure_ascii=False), flush=True)
        checks.append(result)

    expected = load_json(expected_path)
    if not isinstance(expected, dict) or not all(isinstance(v, str) and v.strip() for v in expected.values()):
        raise ValueError('EXPECTED must be the reviewed JSON object {reference: "destination text"}, with no wrappers.')
    baseline = load_json(baseline_path)['model']['remaining']
    model = load_json(input_dir / 'model-private.json')
    current = model['remaining']
    manifest = load_json(input_dir / 'qr-manifest.json')
    baseline_refs = [r['ref'] for r in baseline]
    check('Baseline contains 41 unique remaining references', len(baseline) == len(set(baseline_refs)) == 41, baseline_refs)
    check('Reviewed destinations cover exactly the 41 baseline references', set(expected) == set(baseline_refs), {'missing': sorted(set(baseline_refs) - set(expected)), 'extra': sorted(set(expected) - set(baseline_refs))})
    check('Model reference, item, date, quantity and order unchanged', [delivery_identity(r) for r in current] == [delivery_identity(r) for r in baseline], {'baseline': [delivery_identity(r) for r in baseline], 'actual': [delivery_identity(r) for r in current]})
    check('Model remains 99 outstanding units', sum(r['remaining'] for r in current) == 99, sum(r['remaining'] for r in current))

    baseline_by_ref = {r['ref']: r for r in baseline}
    current_by_ref = {r['ref']: r for r in current}
    for row in current:
        ref = row['ref']
        check(ref + ' model destination matches reviewed text', row.get('location') == expected.get(ref), {'expected': expected.get(ref), 'actual': row.get('location')})
        original = baseline_by_ref.get(ref, {})
        check(ref + ' model navigation URL unchanged', native_url(row) == native_url(original), {'expected': native_url(original), 'actual': native_url(row)})

    by_day = defaultdict(list)
    for row in baseline:
        by_day[row['date']].append(row)
    check('Manifest dates and date order unchanged', list(manifest['days']) == list(by_day), {'expected': list(by_day), 'actual': list(manifest['days'])})
    for day, rows in by_day.items():
        actual = manifest['days'].get(day, [])
        wanted = [[r['ref'], r['remaining'], native_url(r)] for r in rows]
        check(day + ' manifest references, quantities, order and exact QR URLs unchanged', [[r['ref'], r['qty'], r.get('url', '')] for r in actual] == wanted, {'expected': wanted, 'actual': actual})

    pdf_dir = input_dir / 'pdf'
    pdf_files = sorted(pdf_dir.glob('*.pdf'))
    combined = [p for p in pdf_files if 'Remaining_All_dates_' in p.name]
    check('One combined remaining PDF exported', len(combined) == 1, [p.name for p in combined])
    jobs = [(combined[0], list(by_day))] if len(combined) == 1 else []
    for day in by_day:
        matches = [p for p in pdf_files if 'Remaining_' in p.name and 'All_dates_' not in p.name and p.name.endswith(day + '.pdf')]
        check(day + ' one individual remaining PDF exported', len(matches) == 1, [p.name for p in matches])
        if len(matches) == 1:
            jobs.append((matches[0], [day]))

    for path, days in jobs:
        with fitz.open(path) as doc:
            check(path.name + ' page count', len(doc) == len(days), {'expected': len(days), 'actual': len(doc)})
            for index, day in enumerate(days):
                if index >= len(doc):
                    break
                page = doc[index]
                rows = by_day[day]
                name = path.name + ' page ' + str(index + 1)
                text = page.get_text()
                label = date.fromisoformat(day).strftime('%a %d %b %Y')
                check(name + ' date heading', pdf_normalise(label) in pdf_normalise(text), label)
                check(name + ' full reviewed destinations present', all(pdf_normalise(expected.get(r['ref'], '\0')) in pdf_normalise(text) for r in rows), [{'ref': r['ref'], 'expected': expected.get(r['ref'])} for r in rows if pdf_normalise(expected.get(r['ref'], '\0')) not in pdf_normalise(text)])
                # The approved portrait export uses Stop / Reference / Qty / Destination / QR.
                # Anchor each destination to its own row, so text elsewhere on the page cannot pass.
                bounds = {}
                for drawing in page.get_drawings():
                    rectangle = drawing['rect']
                    if abs(rectangle.x0 - 8 * MM) < 0.2 and abs(rectangle.width - 10 * MM) < 0.2 and rectangle.y0 >= 52.8 * MM and rectangle.height >= 14 * MM:
                        bounds[tuple(round(v, 2) for v in rectangle)] = rectangle
                ordered = sorted(bounds.values(), key=lambda b: b.y0)
                check(name + ' table row count', len(ordered) == len(rows), {'expected': len(rows), 'actual': len(ordered)})
                if len(ordered) != len(rows):
                    continue
                for stop, (original, bounds) in enumerate(zip(rows, ordered), 1):
                    ref = original['ref']
                    title = name + ' ' + ref
                    extract = lambda x0, x1: page.get_text('text', clip=fitz.Rect(x0 * MM, bounds.y0, x1 * MM, bounds.y1))
                    row_current = current_by_ref.get(ref, {})
                    display_ref = (row_current.get('sourceRequest') or {}).get('name') or ref
                    check(title + ' reference paired to correct stop', pdf_normalise(display_ref) in pdf_normalise(extract(18, 57)) and extract(8, 18).strip() == str(stop), {'reference_cell': extract(18, 57), 'stop_cell': extract(8, 18)})
                    check(title + ' quantity unchanged', extract(57, 68).strip() == str(original['remaining']), {'expected': original['remaining'], 'actual': extract(57, 68)})
                    check(title + ' full reviewed destination in its own cell', pdf_normalise(expected.get(ref, '\0')) in pdf_normalise(extract(68, 179)), {'expected': expected.get(ref), 'actual': extract(68, 179)})

    failed = [c for c in checks if not c['pass']]
    report = {'author': 'Andrew Fisher', 'input': str(input_dir), 'reviewed_expected': str(expected_path), 'baseline': str(baseline_path), 'pass': not failed, 'checks': checks, 'check_count': len(checks), 'failure_count': len(failed), 'reference_count': len(current), 'quantity': sum(r['remaining'] for r in current), 'pdfs': [{'file': p.name, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p, _ in jobs]}
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2))
    print(json.dumps({k: report[k] for k in ['pass', 'check_count', 'failure_count', 'reference_count', 'quantity']}) + ' report=' + str(report_path), flush=True)
    return 0 if not failed else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', nargs='?', default=os.environ.get('INPUT'))
    parser.add_argument('expected', nargs='?', default=os.environ.get('EXPECTED'))
    parser.add_argument('--baseline', type=Path, default=BASELINE)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    if not args.input or not args.expected:
        parser.error('INPUT and EXPECTED are required, as positional arguments or environment variables.')
    input_dir = Path(args.input)
    return run(input_dir, Path(args.expected), args.baseline, args.report or input_dir / 'destination-verification.json')


if __name__ == '__main__':
    sys.exit(main())
