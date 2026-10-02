#!/usr/bin/env python3
"""Author: Andrew Fisher. Source preservation checks for the Explorer entry arrangement."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import hashlib
import importlib.util
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('entry813', ROOT / 'patch_entry813.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
source = Path(sys.argv[1]).read_text(encoding='utf-8')
result = patch.apply(source)
checks = []


def check(name, passed):
    checks.append({'name': name, 'pass': bool(passed)})


class Tags(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = Counter()
        self.by_id = {}
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids[attrs['id']] += 1
            self.by_id[attrs['id']] = (tag, attrs)


old, new = Tags(source), Tags(result)
check('exact reviewed live source', hashlib.sha256(source.encode()).hexdigest() == patch.BASE_SHA256)
check('every original control ID retained exactly once', all(new.ids[k] == 1 for k in old.ids))
check('no duplicate new IDs', all(v == 1 for v in new.ids.values()))
check('all existing script contents and addresses unchanged', re.findall(r'<script\b.*?</script>', source, re.S) == re.findall(r'<script\b.*?</script>', result, re.S))
check('all existing CSS retained byte for byte', result.split('</style>', 1)[0].startswith(source.split('</style>', 1)[0]))
for heading in ['Alignment', 'Sources', 'Performance']:
    card = re.search(r'<div class="card"(?: id="perf")?><h3>' + heading + r'</h3>.*?</div>', source)
    comparison = result.replace('<p id="sourceImagery813">', '<p>').replace('<span id="sourceProvider813">Mapbox Satellite</span>', 'Mapbox Satellite')
    check(heading + ' card facts preserved exactly', card is not None and card.group(0) in comparison)
check('provider label has stable runtime update target', new.ids['sourceProvider813'] == 1 and new.ids['sourceImagery813'] == 1)
check('Find fold open by default', new.by_id['findCard'][0] == 'details' and 'open' in new.by_id['findCard'][1])
for ident in ['areas813', 'layers', 'about813']:
    check(ident + ' is a native closed fold', new.by_id[ident][0] == 'details' and 'open' not in new.by_id[ident][1])
check('search has persistent explicit label', new.by_id['q'][1].get('aria-labelledby') == 'searchLabel813' and new.ids['searchLabel813'] == 1)
check('range controls have native labels', '<label for="op">Drawing overlay opacity</label>' in result and '<label for="br">Satellite brightness</label>' in result)
check('legend labelled and programmatically focusable', new.by_id['legend'][1].get('role') == 'dialog' and new.by_id['legend'][1].get('tabindex') == '-1')
check('three original mode buttons preserved for native fourth-mode injection', re.findall(r'<button data-mode=.*?</button>', source) == re.findall(r'<button data-mode=.*?</button>', result))
check('every source attribution and warning preserved', all(re.search(r'<div class="' + c + r'".*?</div>', source).group(0) in result for c in ['satban', 'attrib', 'hud']))
for label, text in [('changed input', source + '\n'), ('repeat application', result)]:
    try:
        patch.apply(text)
        rejected = False
    except SystemExit:
        rejected = True
    check(label + ' rejected', rejected)
report = {'author': 'Andrew Fisher', 'sourceSHA256': patch.BASE_SHA256, 'candidateSHA256': hashlib.sha256(result.encode()).hexdigest(), 'checks': checks, 'passed': sum(c['pass'] for c in checks), 'total': len(checks)}
if len(sys.argv) > 2:
    Path(sys.argv[2]).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
sys.exit(0 if report['passed'] == report['total'] else 1)
