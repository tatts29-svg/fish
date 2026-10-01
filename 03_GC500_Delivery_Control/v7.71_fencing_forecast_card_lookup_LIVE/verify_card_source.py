#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproduce the three forecast rates from the issued PDF.

Normal builds read the checked JSON with Python's standard library. This explicit
source check uses pdftotext; --write regenerates the JSON from the same PDF.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
PDF = HERE.parent / 'reference_street_rate_card_2026' / 'Street_Rate_Card_2026.pdf'
MAP = HERE / 'forecast_card771.json'
ROWS = (
    ('Temporary Fence (m) — Hoarding', 'Hoarding Fencing 1.8m x 2.5m (per mtr)'),
    ('Crowd Control Barriers (m) — Flat Feet', 'CCB Flat feet'),
    ('Crowd Control Barriers (m) — WPF', 'White Picket fence'),
)


def extract():
    text = subprocess.check_output(['pdftotext', '-layout', str(PDF), '-'], text=True)
    section = re.search(r'^FENCING\b(.*?)^GENERATORS\b', text, re.M | re.S)
    if section is None or 'Per Mtr 2026' not in section.group(1):
        raise ValueError('Expected the issued fencing section and its 2026 per-metre heading')
    lines = [' '.join(line.split()) for line in section.group(1).splitlines()]
    entries = []
    for programme_type, label in ROWS:
        matches = [re.fullmatch(re.escape(label) + r' Included \$ ([0-9]+\.[0-9]{2})', line)
                   for line in lines]
        matches = [m for m in matches if m]
        if len(matches) != 1:
            raise ValueError(f'Expected exactly one issued card row: {label}')
        entries.append({'programme_type': programme_type, 'card_line': label,
                        'unit': 'm', 'rate': float(matches[0].group(1))})
    return {'schema': 'gc500-forecast-card-1', 'author': 'Andrew Fisher',
            'source': {'file': 'reference_street_rate_card_2026/Street_Rate_Card_2026.pdf',
                       'sha256': hashlib.sha256(PDF.read_bytes()).hexdigest(),
                       'section': 'FENCING — Per Mtr 2026', 'page': 1},
            'entries': entries}


if __name__ == '__main__':
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--write', action='store_true', help='Regenerate the source map')
    options = args.parse_args()
    actual = extract()
    if options.write:
        MAP.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('Wrote the forecast source map from three unique issued-card rows')
    else:
        if actual != json.loads(MAP.read_text(encoding='utf-8')):
            raise SystemExit('FAIL: the forecast source map differs from the issued PDF')
        print('PASS: all three forecast rates and source hash match the issued PDF')
