#!/usr/bin/env python3
"""Author: Andrew Fisher. Prove the presentation release preserves native inputs and workflows."""
import argparse
import hashlib
import importlib.util
from pathlib import Path
import re

parser = argparse.ArgumentParser()
parser.add_argument('--base', required=True)
parser.add_argument('--candidate', required=True)
args = parser.parse_args()
base = Path(args.base).read_bytes()
candidate = Path(args.candidate).read_bytes()
b, c = base.decode(), candidate.decode()
passed = 0

def check(ok, label):
    global passed
    assert ok, label
    passed += 1
    print('PASS ' + label)

def function(text, name):
    m = re.search(r'^function ' + re.escape(name) + r'\(', text, re.M)
    assert m, name + ' is present'
    n = re.search(r'^(?:async )?function \w+\(', text[m.end():], re.M)
    assert n, name + ' has a following function'
    return text[m.start():m.end() + n.start()]

root = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('patch840', root / 'patch_v840.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
check(hashlib.sha256(base).hexdigest() == patch.BASE_SHA256, 'verified release base')
check(patch.build(base) == candidate, 'candidate exactly reproduces from source and base')
for label, data in [('wrong base', base + b' '), ('repeated application', candidate)]:
    try:
        patch.build(data)
    except ValueError:
        check(True, label + ' is refused')
    else:
        check(False, label + ' must be refused')
check(re.findall(r'^const DATA = .*$', b, re.M) == re.findall(r'^const DATA = .*$', c, re.M), 'embedded source data unchanged')
for name in ['buildAllAssets', 'progCard', 'renderPlant', 'renderPlant_held',
             'renderCoatesWay', 'renderCoatesWay_held', 'renderFencing', 'renderFencing_held',
             'renderCosts', 'renderCosts_held', 'chargeLines', 'deliveryAsOf',
             'renderTimeline', 'renderTimeline_held', 'dsnBoard', 'syncFirst']:
    check(function(b, name) == function(c, name), name + ' unchanged')
styles = re.findall(r'<style\b[^>]*>.*?</style>', b, re.S)
check(all(style in c for style in styles), 'all existing style blocks preserved')
check(b[b.index('<body>'):b.index('<script', b.index('<body>'))] == c[c.index('<body>'):c.index('<script', c.index('<body>'))], 'native body, header and navigation shell preserved')
scripts = re.findall(r'<script\b[^>]*>.*?</script>', b, re.S)
unmodified = [script for script in scripts if 'function renderToday_held()' not in script]
check(all(script in c for script in unmodified), 'all supporting script blocks preserved')
check(c.count('id="today-work-v840"') == 1, 'one scoped instrument stylesheet')
check('var TodayWork840' in c and 'function todayWorkMetrics840' in c, 'model and controller embedded')
print(str(passed) + ' source preservation checks passed.')
