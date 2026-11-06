#!/usr/bin/env python3
"""Author: Andrew Fisher. Read-only source-boundary checks on a private host."""
import copy
import hashlib
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from banner_cleanup832 import apply_banner_cleanup, bounded_section, data_region, MARKER
from patch_v832 import build

source_path = Path(os.environ['BASE'])
source_bytes = source_path.read_bytes()
source = source_bytes.decode('utf-8')
candidate = apply_banner_cleanup(source)
before, _, _ = data_region(source)
after, _, _ = data_region(candidate)
checks = []


def check(name, condition):
    checks.append({'name': name, 'pass': bool(condition)})
    print(('PASS ' if condition else 'FAIL ') + name)


def rejects(fn):
    try:
        fn()
    except (ValueError, SystemExit):
        return True
    return False


expected = copy.deepcopy(before)
expected['pageBanners'] = {}
expected['raceBanners'] = {}
check('Only the two decorative-banner DATA selections change', after == expected)
check('Today video, still, hosted media catalog and manifest remain identical',
      all(before[key] == after[key] for key in ('board', 'media', 'hostedMedia')))
check('Showcase and Coates Way data remain identical',
      all(before.get(key) == after.get(key) for key in ('car', 'machine', 'broadcast', 'showSound')))
board_start = 'function dsnBoard(asOf, X, mode){'
board_end = '/* the whole screen */'
check('Today template, controls and complete playback lifecycle are byte-identical',
      bounded_section(source, board_start, board_end) == bounded_section(candidate, board_start, board_end))
today_call = "<div class=\"dsnband\">${dsnBoard(today, dsnState(today), 'video')}</div>"
check('Exactly one original Today video mount remains', source.count(today_call) == candidate.count(today_call) == 1)
check('No tab-banner renderer or fallback can reappear',
      all(token not in candidate for token in ('pageBanner(', 'raceBanner(', 'DATA.pageBanners', 'DATA.raceBanners')))
check('No obsolete Equipment illustration fold remains', "fold('equipment-image'" not in candidate)
check('Repeat application is refused', rejects(lambda: apply_banner_cleanup(candidate)))
check('Changed page-banner inventory is refused', rejects(lambda: apply_banner_cleanup(source.replace('"pageBanners":', '"otherBanners":', 1))))
check('Changed legacy-banner inventory is refused', rejects(lambda: apply_banner_cleanup(source.replace('"raceBanners":', '"otherRaceBanners":', 1))))
check('Ambiguous DATA assignment is refused', rejects(lambda: apply_banner_cleanup(source + '\nconst DATA = {};')))
check('Missing source boundary is refused', rejects(lambda: apply_banner_cleanup(source.replace('/* v5.49 — A PHOTOGRAPH, AND NOTHING OVER IT.', '/* Missing legacy source marker', 1))))
check('Release wrapper rejects an unreviewed base', rejects(lambda: build(source_bytes, '0' * 64)))
check('Release wrapper requires a complete source hash', rejects(lambda: build(source_bytes, '')))
check('Original private input is untouched', source_path.read_bytes() == source_bytes)
check('Exactly one cleanup marker identifies the transformed source', candidate.count(MARKER) == 1)

report = {'author': 'Andrew Fisher', 'scope': 'Banner component only; no browser or financial-record writes',
          'input_sha256': hashlib.sha256(source_bytes).hexdigest(),
          'component_sha256': hashlib.sha256(candidate.encode()).hexdigest(),
          'passed': sum(item['pass'] for item in checks), 'total': len(checks), 'checks': checks}
if os.environ.get('REPORT'):
    Path(os.environ['REPORT']).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ('passed', 'total', 'input_sha256', 'component_sha256')}))
raise SystemExit(0 if all(item['pass'] for item in checks) else 1)
