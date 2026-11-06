#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent boundaries for fencing category and installation-scope corrections."""
from pathlib import Path
import argparse
import hashlib
import re
import json
from copy import deepcopy
from fencing_corrections847 import apply_corrections, json_value

p = argparse.ArgumentParser()
p.add_argument('--base', required=True)
p.add_argument('--candidate', required=True)
p.add_argument('--corrections', required=True)
p.add_argument('--catalogue', required=True)
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
manifest = json.loads(Path(a.corrections).read_text())
catalogue = json.loads(Path(a.catalogue).read_text())
base_review = json_value(b, 'const FENCE_REVIEW836 = ')[0]
base_trace = json_value(b, 'const FENCE_TRACE837 = ')[0]
actual_review = json_value(c, 'const FENCE_REVIEW836 = ')[0]
actual_trace = json_value(c, 'const FENCE_TRACE837 = ')[0]
expected_data, expected_review, expected_trace, expected_catalogue = apply_corrections(
    bd, base_review, base_trace, catalogue, manifest, hashlib.sha256(Path(a.base).read_bytes()).hexdigest())
check('operational source delta equals the exact private correction manifest', cd == expected_data)
check('source review delta equals the exact correction bindings', actual_review == expected_review)
check('map trace delta equals the exact correction bindings with no new geometry', actual_trace == expected_trace)
check('source review catalogue equals the guarded corrected catalogue', review == expected_catalogue)
# Independent field constraints do not rely on the mutator's return value.
allowed = {r['record_id']: r for r in manifest['corrections']}
restored = deepcopy(cd)
old_records = {r['id']: r for r in bd['ops']['fencing']['dockets']}
for record in restored['ops']['fencing']['dockets']:
    if record['id'] not in allowed:
        continue
    old = old_records[record['id']]
    decision = allowed[record['id']]
    check('targeted docket keeps every original field except category quantities and appended note',
          {k:v for k,v in record.items() if k not in {'quantities','note'}} == {k:v for k,v in old.items() if k not in {'quantities','note'}})
    before_ccb = sum(old['quantities'].get(k,0) for k in ('ccb_event','ccb_demarc'))
    after_ccb = sum(record['quantities'].get(k,0) for k in ('ccb_event','ccb_demarc'))
    check('targeted docket retains exact total CCB metres and non-CCB quantities',
          before_ccb == after_ccb == decision['quantity'] and
          {k:v for k,v in record['quantities'].items() if k not in {'ccb_event','ccb_demarc'}} == {k:v for k,v in old['quantities'].items() if k not in {'ccb_event','ccb_demarc'}})
    check('targeted docket note preserves original wording before audit addition', record['note'].startswith(old['note'] + ' '))
    record['quantities'], record['note'] = deepcopy(old['quantities']), old['note']
check('all unrelated operational data, cached build costs, rates and source fields unchanged', restored == bd)
check('existing map geometry, areas, relations and commercial associations unchanged',
      {k:v for k,v in base_trace.items() if k != 'rows'} == {k:v for k,v in actual_trace.items() if k != 'rows'})
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
