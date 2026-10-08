#!/usr/bin/env python3
"""Author: Andrew Fisher. Source-bound Schedule 6 dispatch integration.

No operational record writes. Before release, run native programme and
financial comparisons against the final integration base, not an old total.
"""
import copy
import hashlib
import json
import os
from pathlib import Path
import sys

sys.path.insert(0, os.environ.get('GC500_TOOLCHAIN', str(Path(__file__).resolve().parent.parent / 'toolchain')))
from rep import rep

SOURCE_HASH = '228801df246f21b29e6da196fa9c7c3a5ef492dc6b9aa814df0aceead67e2558'
source = Path(os.environ['SCHEDULE6_SOURCE'])
assert hashlib.sha256(source.read_bytes()).hexdigest() == SOURCE_HASH, 'wrong Schedule 6 source'
page = Path(sys.argv[1]); raw = page.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf')
s = raw.decode('utf-8-sig')
assert 'function bookingGroups801(' in s and 'GC500Refresh904' in s and 'Shapes926' in s and ' · v9.26' in s, 'requires the integrated v9.26 page'
start = s.index('const DATA = '); end = s.index('\n', start)
old = s[start:end]
D = json.loads(old[len('const DATA = '):-1]); before = copy.deepcopy(D)
assert 'schedule_review6' not in D, 'Schedule 6 already applied'
assert D['schedule_review875']['sha256'] == '6383ebdd66b2293453de07f85fd1812398d171c7ab75b2fad22196bbca8d4761', 'wrong schedule base'
log = []

def event(task):
    found = [(a, e) for a in D['assets'] for e in a.get('events', []) if e.get('task_id') == task]
    assert len(found) == 1, f'{task}: ambiguous asset event'
    return found[0]

def update(task, row, changes, order=None, loads=None):
    a, e = event(task)
    assert e['date'] == '2026-10-12' and e['movement'] == 'place', task
    for k in changes:
        assert e.get(k) is None, f'{task}: existing {k} needs reconciliation'
    e.update(changes)
    provenance = {'file': source.name, 'sha256': SOURCE_HASH, 'sheet': 'Week 1', 'row': row}
    e['source_revision6'] = provenance
    if loads:
        assert 'booking801' not in e
        e['booking801'] = {'date': e['date'], 'departure_order': order, 'location': a.get('name') or a['key'], 'source': 'Schedule 6', 'loads': [
            {'truck_id': f'schedule6-{task}-dd-{dd}', 'dd': dd, 'quantity': 1, 'asset_numbers': [], 'load_time': clock, 'carrier': 'SFL'}
            for dd, clock in loads
        ]}
    log.append({'task': task, 'ref': a['key'], 'source': provenance, 'changed': list(changes) + (['booking801'] if loads else [])})

update('T0260', 2, {'dd': '26121298 / 26121310', 'carrier': 'SFL', 'load_time': '11:00 / 11:30'}, loads=[('26121298', '11:00'), ('26121310', '11:30')])
update('T0105', 4, {'carrier': 'SFL'})
update('T0106', 5, {'dd': '26120550', 'carrier': 'SFL', 'load_time': '09:30', 'activity': 'D2D'}, order=2, loads=[('26120550', '09:30')])
update('T0261', 6, {'dd': '26120528', 'carrier': 'SFL', 'load_time': '08:30'}, order=1, loads=[('26120528', '08:30')])

# This unreferenced row remains the cost home. A clock alone does not trigger the
# plant-event card forecast (carrier/dd/cost do); native transport merges the
# source rows by task. Mirror only time/note to make the existing Timeline show it.
matches = [x for x in D['unreferenced'] if x.get('task_id') == 'T0266']
assert len(matches) == 1
u = matches[0]
assert u['date'] == '2026-10-13' and u.get('load_time') is None and u.get('notes') is None
u['load_time'] = '12:00'; u['notes'] = 'Rehire — Schedule 6; supplier and transport responsibility to confirm.'
u['source_revision6'] = {'file': source.name, 'sha256': SOURCE_HASH, 'sheet': 'Week 1', 'row': 14}
plant = [(a,e) for a in D['plant_lines']['lines'] for e in a.get('events',[]) if e.get('task_id') == 'T0266']
assert len(plant) == 1
pe = plant[0][1]
assert pe['date'] == '2026-10-13' and all(pe.get(k) is None for k in ['load_time','note','carrier','dd','transport_cost'])
pe['load_time'] = '12:00'; pe['note'] = u['notes']; pe['source_revision6'] = copy.deepcopy(u['source_revision6'])
log.append({'task': 'T0266', 'source': u['source_revision6'], 'changed': ['load_time', 'notes']})

D['schedule_review6'] = {'source': source.name, 'sha256': SOURCE_HASH, 'reviewed': '2026-10-09',
    'comparison': 'Schedule (5)', 'changed_cells': 40,
    'applied_tasks': ['T0260', 'T0105', 'T0106', 'T0261', 'T0266'],
    'held': ['GN13 loading time 700/800: one or two loads unconfirmed',
        'T0109 1274555/26120976: conflicts with existing on-site forklift',
        'Traffic-control source requirements do not overwrite operational status',
        'Gate 5 departure sequence 1st P63, 2nd P62, 3rd P60 needs order-only support; no invented booking',
        'No quantity, allocation, rate, cost, off-hire, labour or cancelled-reference changes']}

# Only these five source events and the provenance entry may change. The source
# outside DATA, plant events, rates, contracts, images and other assets are held.
allowed_assets = {event(t)[0]['key'] for t in ['T0260','T0105','T0106','T0261']}
for a, b in zip(D['assets'], before['assets']):
    if a['key'] not in allowed_assets: assert a == b
    else: assert {k:v for k,v in a.items() if k != 'events'} == {k:v for k,v in b.items() if k != 'events'}
for a, b in zip(D['unreferenced'], before['unreferenced']):
    if a['task_id'] != 'T0266': assert a == b
plant_copy=copy.deepcopy(D['plant_lines'])
for a in plant_copy['lines']:
    for e in a.get('events',[]):
        if e.get('task_id') == 'T0266':
            for k in ['load_time','source_revision6']: e.pop(k)
            e['note']=None
assert plant_copy == before['plant_lines']
for k in before:
    if k not in ('assets', 'unreferenced', 'plant_lines'): assert D[k] == before[k], k
new = 'const DATA = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';'
s = rep(s, old, new, 'Schedule 6 bounded dispatch source facts', str(page))
s = rep(s, ' · v9.26', ' · v9.27', 'publication footer', str(page))
page.write_bytes((b'\xef\xbb\xbf' if bom else b'') + s.encode())
if os.environ.get('SCHEDULE6_LOG'):
    Path(os.environ['SCHEDULE6_LOG']).write_text(json.dumps(log, indent=2))
print('Five Schedule 6 dispatch sources applied. Record, allocations, costs, rates and application code unchanged.')
