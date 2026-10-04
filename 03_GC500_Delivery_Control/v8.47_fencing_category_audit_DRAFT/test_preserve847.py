#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent boundaries for fencing category and installation-scope corrections."""
from pathlib import Path
import argparse
import hashlib
import re
import json

p = argparse.ArgumentParser()
p.add_argument('--base', required=True)
p.add_argument('--candidate', required=True)
a = p.parse_args()
b = Path(a.base).read_text(encoding='utf-8')
c = Path(a.candidate).read_text(encoding='utf-8')
root = Path(__file__).resolve().parent.parent
checks = []

def check(name, ok):
    checks.append((name, bool(ok)))
    print(('PASS ' if ok else 'FAIL ') + name)

def function(text, name):
    start = re.search(r'^(?:async )?function ' + re.escape(name) + r'\(', text, re.M)
    if not start:
        return None
    end = re.search(r'^(?:async )?function \w+\(', text[start.end():], re.M)
    return text[start.start():start.end()+end.start()] if end else None

for relative in [
    'v8.41_timeline_fencing_clarity_LIVE/fencing_metrics841_src.js',
    'v8.41_timeline_fencing_clarity_LIVE/group_details841_src.js',
    'v8.42_today_plan_clarity_LIVE/work_summary842_src.js',
    'v8.44_linked_completion_LIVE/linked_references844_src.js',
    'v8.41_timeline_fencing_clarity_LIVE/timeline841_src.js',
    'v8.41_timeline_fencing_clarity_LIVE/supplier_print841_src.js',
]:
    source = (root / relative).read_text()
    check(Path(relative).name + ' exact original model/controller preserved', source in b and source in c)

for name in ['setDone', 'deliveryOf', 'deliveryAsOf', 'assetStatusAsOf',
             'chargeLines', 'dsnState_', 'tradeCharges', 'contractCharge',
             'fenceTypes', 'fenceDerived', 'moneySummary', 'greenBookTotals', 'costDocket', 'allDockets', 'fenceByWeek', 'recordHireAgreement',
             'renderTimeline', 'renderPlant', 'renderCosts',
             'dsnBoard', 'renderCoatesWay',
             'destinationOf', 'dest782', 'navTargetFor', 'showOnMap', 'openAsset',
             'dropPhotosOf', 'filedPhotosOf', 'photoFor', 'lineNumbersOf']:
    before = function(b, name)
    check(name + ' exact native implementation preserved', before is not None and before == function(c, name))

def data_of(text):
    return json.JSONDecoder().raw_decode(text[text.index('const DATA = ') + len('const DATA = '):])[0]
bd, cd = data_of(b), data_of(c)
review = cd.pop('fence_ccb_review847', None)
check('all existing operational and financial source data unchanged', bd == cd)
check('separate source review catalogue exists', isinstance(review, dict) and review.get('schema') == 1)
check('legacy native financial functions are not reassigned', not re.search(r'(?:costDocket|allDockets|fenceByWeek|fenceTypes|fenceDerived)\s*=\s*(?:function|\()', c))

faces = re.findall(r'@font-face\s*\{[^}]+\}', b)
check('all embedded font faces unchanged', bool(faces) and faces == re.findall(r'@font-face\s*\{[^}]+\}', c))
check('static header and navigation shell unchanged', b[b.index('<body>'):b.index('<script', b.index('<body>'))] == c[c.index('<body>'):c.index('<script', c.index('<body>'))])
styles = re.findall(r'<style\b[^>]*>.*?</style>', b, re.S)
check('unrelated original styles unchanged', all(s in c for s in styles if 'id="today-work-v840"' not in s))
scripts = re.findall(r'<script\b[^>]*>.*?</script>', b, re.S)
check('unrelated supporting script blocks unchanged', all(s in c for s in scripts if 'function renderToday_held()' not in s))
check('exactly one Today board stylesheet', c.count('id="today-work-v840"') == 1)
print(f'{sum(ok for _, ok in checks)}/{len(checks)} independent preservation checks passed')
raise SystemExit(0 if all(ok for _, ok in checks) else 1)
