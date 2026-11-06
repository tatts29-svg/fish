#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent release boundaries and source preservation."""
import argparse
import hashlib
import importlib.util
from pathlib import Path
import re

p = argparse.ArgumentParser()
p.add_argument('--base', required=True)
p.add_argument('--candidate', required=True)
a = p.parse_args()
base, candidate = Path(a.base).read_bytes(), Path(a.candidate).read_bytes()
b, c = base.decode(), candidate.decode()
passed = 0

def check(ok, label):
    global passed
    assert ok, label
    passed += 1
    print('PASS ' + label)

def function(text, name):
    m = re.search(r'^(?:async )?function ' + re.escape(name) + r'\(', text, re.M)
    assert m, name + ' present'
    n = re.search(r'^(?:async )?function \w+\(', text[m.end():], re.M)
    assert n, name + ' following function'
    return text[m.start():m.end() + n.start()]

root = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('patch844', root / 'patch_v844.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
check(hashlib.sha256(base).hexdigest() == patch.BASE_SHA256, 'verified live base')
check(patch.build(base) == candidate, 'candidate reproduces exactly')
for label, raw in [('different base', base + b' '), ('repeat application', candidate)]:
    try:
        patch.build(raw)
    except ValueError:
        check(True, label + ' rejected')
    else:
        check(False, label + ' must be rejected')
check(re.findall(r'^const DATA = .*$', b, re.M) == re.findall(r'^const DATA = .*$', c, re.M), 'embedded operational source unchanged')
for name in ['buildAllAssets', 'progCard', 'renderPlant', 'renderPlant_held',
             'renderCoatesWay', 'renderCoatesWay_held', 'renderFencing', 'renderFencing_held',
             'renderCosts', 'renderCosts_held', 'chargeLines', 'deliveryAsOf',
             'dsnBoard', 'syncFirst', 'dsnState_', 'tradeCharges', 'contractCharge',
             'fenceTypes', 'fenceDerived', 'moneySummary', 'greenBookTotals',
             'dsnGroups', 'renderTimeline', 'setDone', 'deliveryOf',
             'destinationOf', 'dest782', 'navTargetFor', 'showOnMap', 'openAsset',
             'dropPhotosOf', 'filedPhotosOf', 'photoFor', 'lineNumbersOf']:
    check(function(b, name) == function(c, name), name + ' preserved')
check((root.parent / 'v8.40_today_work_progress_LIVE/work_metrics840_src.js').read_text() in c,
      'existing Today work metric model preserved')
styles = re.findall(r'<style\b[^>]*>.*?</style>', b, re.S)
check(all(s in c for s in styles if 'id="today-work-v840"' not in s), 'all other existing styles preserved')
check(b[b.index('<body>'):b.index('<script', b.index('<body>'))] == c[c.index('<body>'):c.index('<script', c.index('<body>'))], 'header and navigation shell preserved')
scripts = re.findall(r'<script\b[^>]*>.*?</script>', b, re.S)
check(all(s in c for s in scripts if 'function renderToday_held()' not in s), 'supporting script blocks preserved')
check(c.count('id="today-work-v840"') == 1, 'one Today instrument stylesheet')
check('function todayFencingSummary841(' in c, 'separate fencing summary embedded')
check('function todayGroupDetails841(' in c, 'group detail adapter embedded')
check('function todayWorkSummary842(' in c, 'qualified completion and plan adapter embedded')
check('content="v8.44"' in c, 'release metadata updated')
for name in ['timeline841_src.js', 'timeline841_src.css', 'supplier_print841_src.js',
             'fencing_metrics841_src.js', 'group_details841_src.js']:
    source = (root.parent / 'v8.41_timeline_fencing_clarity_LIVE' / name).read_text()
    check(source in c and source in b, name + ' preserved')
check((root.parent / 'v8.42_today_plan_clarity_LIVE/work_summary842_src.js').read_text() in c, 'existing qualified group summary preserved')
check('function todayTypeMetrics843(' in c, 'per-type adapter embedded')
check((root.parent / 'v8.43_type_instruments_LIVE/type_metrics843_src.js').read_text() in c, 'existing exact type metrics preserved')
check('function todayLinkedReferences844(' in c, 'linked reference adapter embedded')
check('function todayLinkedFencing844(' in c, 'linked fencing adapter embedded')
print(str(passed) + ' preservation checks passed')
