"""Author: Andrew Fisher. Independent arithmetic/identity checks of private GET snapshots."""
import json
import sys
from collections import Counter
from pathlib import Path
from decimal import Decimal

base = Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/private-gc500-recheck14Oct2026/fencing')
s = json.loads((base / 'snapshot.json').read_text())
b = json.loads((base / 'barrier-views.json').read_text())
checks = []
def check(label, condition):
    checks.append({'check': label, 'passed': bool(condition)})
    if not condition:
        raise AssertionError(label)
def sumq(records, field):
    result = Counter()
    for row in records:
        for key, value in (row.get(field) or {}).items():
            if isinstance(value, (int, float)):
                result[key] += Decimal(str(value))
    return result

eligible = [d for d in s['dockets'] if d['state'] == 'included']
raw = sumq(eligible, 'quantities')
operations = Counter()
for op in s['fenceSummary']['evidence']['operations']:
    operations[op['type']] += Decimal(str(op['quantity']))
bytype = {row['id']: row for row in s['fenceSummary']['summaryRows']}
for name in ['clean', 'scrim', 'v_gates', 'ped_gates', 'ccb_event', 'ccb_demarc', 'fence_blocks', 'flat_feet']:
    check('Dated source quantities reconcile: ' + name, raw[name] == Decimal(str(bytype[name]['recorded'])))
for name in ['relocation', 'removal']:
    check('Dated work + separately sourced service metres: ' + name,
          raw[name] + operations[name] == Decimal(str(bytype[name]['recorded'])))
check('Scrim on existing fence stays separate', operations['scrim_existing'] == Decimal(str(bytype['scrim_existing']['recorded'])))
check('Unclassified CCB remains one shared allocation', bytype['ccb_unclassified']['recorded'] == s['fenceSummary']['classification']['unallocatedMetres'])
check('Reinstatement is not new mesh hire', operations['reinstatement'] == Decimal('32.5') and 'reinstatement' not in bytype)
for row in s['fenceSummary']['summaryRows']:
    if row.get('pct') is not None and row.get('planned'):
        expected = (Decimal(str(row['recorded'])) / Decimal(str(row['planned'])) * 100).quantize(Decimal('.01'))
        check('Percentage rounded to two decimals: ' + row['id'], expected == Decimal(str(row['pct'])))
components = sumq([d for d in eligible if d.get('docket_no')], 'components')
for row in s['components']['recorded']:
    check('Gross component quantity: ' + row['id'], components[row['id']] == Decimal(str(row['quantity'])))
collections = sumq(s['collections'], 'collected')
for row in s['components']['collections']:
    if row['quantity'] is not None:
        check('Collection quantity stays separate: ' + row['id'], collections[row['id']] == Decimal(str(row['quantity'])))
check('One numbered red docket per paper', len([d['docket_no'] for d in s['dockets'] if d['docket_no']]) == len({d['docket_no'] for d in s['dockets'] if d['docket_no']}))
check('Reviewed fencing area links remain current', all(row['state'] == 'current' for row in s['traceCurrent']['rows']))
check('Reviewed programme task links remain matched', len(s['reviews']) == 8 and all(r['state'] == 'matched' for r in s['reviews']))
check('Vehicle wheels are not silently converted to gate openings', bytype['v_gates']['recorded'] == 0 and s['gateEvidence']['acceptedQuantity'] == 68 and s['gateEvidence']['conflictQuantity'] == 7)
mapstates = {row['key']: row for row in b['map']['states']}
for asset in s['assets']:
    key = asset['asset']['key']
    q = sum(Decimal(str(line['computed'])) for line in asset['lines'])
    check('Reference/map quantity agrees: ' + key, q == sum(Decimal(str(item['quantity'])) for item in mapstates[key]['quantity']['items']))
    if asset['onsite']:
        check('Onsite complete map quantity: ' + key, mapstates[key]['state'] == 'complete' and all(item['completed'] == item['quantity'] for item in mapstates[key]['quantity']['items']))
water = next(row for row in s['inventory'] if row['item'] == 'TL2')
check('Recorded water-barrier stock retains onsite truth', water['on'] == 76 and {k for k, r in water['refs'].items() if r['on']} == {'WB01', 'WB02', 'WB03'})
check('Trakmat counted by quantity with no serial-number demand', next(row for row in s['inventory'] if row['item'] == 'Trakmat')['on'] == 20)
check('Confirmed repeat-placement inventory defect reproduced', water['asked'] == 375 and water['refs']['WB19']['asked'] + water['refs']['WB20']['asked'] == 64 and 'WB1934 ordered' in b['orderedDrillText'] and 'WB2030 ordered' in b['orderedDrillText'])
for snapshot in [s,b]:
    check('Actual-public GET only, no script errors', snapshot['counts']['page'] == 0 and snapshot['counts']['blocked'] == 0 and not snapshot['errors'])
result = {'author': 'Andrew Fisher', 'native_version': s['nativeVersion'], 'checks_passed': len(checks), 'checks': checks,
          'scope': 'Independent model/source-snapshot arithmetic and cross-view checks; original paper truth is not re-certified by this test.'}
(base / 'quantity-checks.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'checks_passed': len(checks), 'native_version': s['nativeVersion']}))
