#!/usr/bin/env python3
"""Author: Andrew Fisher. Verify protected financial boundaries on a supplied base."""
import importlib.util
import json
from pathlib import Path
import re
import sys

spec = importlib.util.spec_from_file_location('patch831', Path(__file__).resolve().parent.parent / 'patch_v831.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
raw = Path(sys.argv[1]).read_bytes()
supplement = {'schema': 1, 'author': 'Andrew Fisher', 'card': {'sha256': 'a'*64, 'originalWorkbookSha256': 'b'*64, 'eachWay': True}, 'rateSupplements': [], 'coverage': [], 'included': [], 'heldScopes': []}
after = patch.patch_bytes(raw, supplement)
old, new = raw.decode('utf-8'), after.decode('utf-8')

def function(text, name):
    match = re.search(r'^function ' + re.escape(name) + r'\(', text, re.M)
    assert match, name
    end = re.search(r'^function ', text[match.end():], re.M)
    return text[match.start():match.end()+end.start() if end else len(text)]

for name in ['moneySummary', 'moneySummary_', 'pl760BranchTable', 'acc761Model',
             'contractCharge', 'contractCharge_747', 'assetTotal', 'ourCosts', 'fin745Rows',
             'cj764Fencing', 'rh766Model', 'pl752Rows']:
    assert function(old,name) == function(new,name), 'Changed protected function: '+name
for text in [old,new]:
    start = text.index('const DATA =') + len('const DATA =')
    data, count = json.JSONDecoder().raw_decode(text[start:].lstrip())
    if text is old:
        before_data = data
        corrected = 0
        for group in ['items','accessories']:
            for row in before_data['rate_match'][group]:
                transport = row.get('transport') or {}
                if transport.get('unit') == patch.OLD_UNIT:
                    transport['unit'] = patch.NEW_UNIT
                    corrected += 1
        assert corrected == 34
    else:
        assert data.pop('transport_forecast831') == supplement
        assert data == before_data, 'Embedded DATA changed beyond exact supplement and 34 reviewed unit metadata values'
assert new.count('function buildingTransport831(')==1
assert 'transportToCome: buildingTransport.uncoveredAdditional' in new
assert 'n(c.delivery) + n(X.revenue.transportToCome)' in new
for bad in [raw+b' ', after]:
    try:
        patch.patch_bytes(bad, supplement)
    except ValueError:
        pass
    else:
        raise AssertionError('Guard accepted wrong base/repeated patch')
helper=Path(__file__).resolve().parent.parent.joinpath('building_transport831.js').read_text()
assert not re.search(r'\b(?:save|stampIt|fetch|setSupplied|setRental)\s*\(',helper)
assert not re.search(r'\bS\s*[.\[]',helper)
for invalid in [None, {}, dict(supplement, coverage=[{'id':'x'}]), dict(supplement, extra='unexpected')]:
    try:
        patch.validate_supplement(invalid)
    except ValueError:
        pass
    else:
        raise AssertionError('Accepted unreviewable source schema')
print(json.dumps({'author':'Andrew Fisher','passed':18,'boundaries':'current money, Finance, cost functions, native DATA; exact-base and repeat guards'}))
