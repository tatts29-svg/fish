#!/usr/bin/env python3
# Author: Andrew Fisher. v8.86 narrow DATA identity: the candidate's DATA equals the live base except for the rows the
# Event Portables plan moves, and on those rows only the date fields change, to the plan's load day.
#   python3 test_data886.py base_live.html candidate.html meet_points_03Oct2026/event_portables_plan.json
import json, re, sys, datetime
from pathlib import Path

def read(path):
    t = Path(path).read_text(encoding='utf-8')
    return json.JSONDecoder().raw_decode(t[re.search(r'const DATA\s*=\s*', t).end():])[0]

base, cand = read(sys.argv[1]), read(sys.argv[2])
PLAN = json.loads(Path(sys.argv[3]).read_text(encoding='utf-8'))
OFF_PLAN = {'T0089'}
fails = []
def check(name, ok): print(('PASS ' if ok else 'FAIL ') + name); (ok or fails.append(name))

# 1. what the plan should move, worked out here from the plan and the base alone
bk = {a['key']: a for a in base['assets']}; bu = {r['task_id']: r for r in base['unreferenced']}
expect = {}   # (key, task_id) -> {'from','to','load'}
for L in PLAN['loads']:
    for st in L['stops']:
        for dr in st['drops']:
            if dr.get('ref'):
                a = bk[dr['ref']]
                items = [('FWF', dr['fwf'])] + ([('Pee Panel', dr['pee_panels'])] if dr.get('pee_panels') else [])
                for item, qty in items:
                    ev = [e for e in a['events'] if e.get('movement') == 'place' and e.get('item') == item and e.get('date') and e['date'] >= PLAN['prepared']]
                    assert len(ev) == 1 and ev[0]['quantity_raw'] == qty, (dr['ref'], item)
                    if ev[0]['date'] != L['date']: expect[(dr['ref'], ev[0]['task_id'])] = {'from': ev[0]['date'], 'to': L['date'], 'load': L['n']}
            elif dr.get('task_ref') and dr['task_ref'] not in OFF_PLAN:
                r = bu[dr['task_ref']]
                if r['date'] != L['date']: expect[(dr['task_ref'], dr['task_ref'])] = {'from': r['date'], 'to': L['date'], 'load': L['n']}
check('the plan moves 20 schedule rows (19 referenced, 1 unreferenced)', len(expect) == 20 and sum(1 for k in expect if k[0] == k[1]) == 1)
check('T0089 is not among them', not any(k[0] == 'T0089' for k in expect))
check('WC09 moves its FWF and pee panel rows only', {k[1] for k in expect if k[0] == 'WC09'} == {'T0101', 'T0259'})

# 2. every other section of DATA is identical
for key in base:
    if key not in ('assets', 'unreferenced'):
        check('DATA.' + key + ' identical', base[key] == cand[key])
check('no DATA key added or removed', set(base) == set(cand))

# 3. assets: identical except the moved rows' date fields and the touched references' own span fields
EV_ALLOWED = {'date', 'date_display', 'date_as_written', 'date_correction'}
A_ALLOWED = {'first_date', 'last_date', 'days_between_first_and_last', 'weeks_between_first_and_last', 'duration_state'}
touched_refs = {k[0] for k in expect if k[0] in bk}
check('same number of assets', len(base['assets']) == len(cand['assets']))
moved_seen = set()
for a, b in zip(base['assets'], cand['assets']):
    k = a['key']
    assert k == b['key']
    diff = {f for f in set(a) | set(b) if a.get(f) != b.get(f)}
    if k not in touched_refs:
        if diff: fails.append(k + ' changed: ' + ', '.join(sorted(diff)))
        continue
    if not diff <= (A_ALLOWED | {'events'}): fails.append(k + ' changed outside the date fields: ' + ', '.join(sorted(diff - A_ALLOWED - {'events'})))
    assert len(a['events']) == len(b['events'])
    for e, f in zip(a['events'], b['events']):
        ed = {g for g in set(e) | set(f) if e.get(g) != f.get(g)}
        x = expect.get((k, e['task_id']))
        if not x:
            if ed: fails.append(k + ' ' + e['task_id'] + ' changed but the plan does not move it: ' + ', '.join(sorted(ed)))
            continue
        moved_seen.add((k, e['task_id']))
        if not ed <= EV_ALLOWED: fails.append(k + ' ' + e['task_id'] + ' changed outside the date fields: ' + ', '.join(sorted(ed - EV_ALLOWED)))
        c = f.get('date_correction') or {}
        ok = (f['date'] == x['to'] and f['date_as_written'] == x['from'] and e['date'] == x['from'] and c.get('as_written') == x['from']
              and c.get('load') == x['load'] and c.get('load_date') == x['to'] and c.get('stated_by') == 'Event Portables plan v10, 3 Oct'
              and c.get('stated_on') == '2026-10-03' and c.get('plan886') is True
              and f.get('date_display') == datetime.date.fromisoformat(x['to']).strftime('%d %b'))
        if not ok: fails.append(k + ' ' + e['task_id'] + ' does not read the plan day as a correction')
    # the span follows the rows
    ds = sorted(e['date'] for e in b['events'] if e.get('date'))
    days = (datetime.date.fromisoformat(ds[-1]) - datetime.date.fromisoformat(ds[0])).days
    if not (b['first_date'] == ds[0] and b['last_date'] == ds[-1] and b['days_between_first_and_last'] == (days or None)
            and b['weeks_between_first_and_last'] == (round(days / 7, 1) if days else None)
            and b['duration_state'] == ('derived from the first and last scheduled dates for this reference — a planning span, not a confirmed on-hire period' if days else 'single dated event only')):
        fails.append(k + ' span fields do not follow its rows')
check('every moved referenced row is exactly the plan\'s set', moved_seen == {k for k in expect if k[0] in bk})

# 4. unreferenced rows: only T0176's date fields
check('same number of unreferenced rows', len(base['unreferenced']) == len(cand['unreferenced']))
for r, q in zip(base['unreferenced'], cand['unreferenced']):
    rd = {g for g in set(r) | set(q) if r.get(g) != q.get(g)}
    x = expect.get((r['task_id'], r['task_id']))
    if not x:
        if rd: fails.append(r['task_id'] + ' (unreferenced) changed: ' + ', '.join(sorted(rd)))
        continue
    c = q.get('date_correction') or {}
    if not (rd <= {'date', 'date_as_written', 'date_correction'} and q['date'] == x['to'] and q['date_as_written'] == x['from'] and c.get('as_written') == x['from'] and c.get('load') == x['load'] and c.get('plan886') is True):
        fails.append(r['task_id'] + ' (unreferenced) does not read the plan day as a correction')
check('T0176 (Red Bull, no WC number) reads Mon 19 Oct from Load 4; T0089 untouched',
      next(q for q in cand['unreferenced'] if q['task_id'] == 'T0176')['date'] == '2026-10-19'
      and next(q for q in cand['unreferenced'] if q['task_id'] == 'T0089') == next(r for r in base['unreferenced'] if r['task_id'] == 'T0089'))

# 5. the headline rows
ck = {a['key']: a for a in cand['assets']}
ev = lambda k, t: next(e for e in ck[k]['events'] if e['task_id'] == t)
check('WC09: FWF x4 and Pee Panel x6 on Fri 9 Oct, the two 6 m toilet blocks still Thu 8 Oct',
      ev('WC09', 'T0101')['date'] == '2026-10-09' and ev('WC09', 'T0259')['date'] == '2026-10-09' and ev('WC09', 'T0102')['date'] == '2026-10-08'
      and not ev('WC09', 'T0102').get('date_correction') and ck['WC09']['first_date'] == '2026-10-08' and ck['WC09']['last_date'] == '2026-10-09')
check('WC57 Mon 12 -> Fri 9 Oct; WC34 Thu 8 -> Fri 9 Oct', ck['WC57']['first_date'] == '2026-10-09' and ck['WC34']['first_date'] == '2026-10-09')
check('WC67: the 2 FWF on site since 1 Oct untouched, the second 2 move Mon 12 -> Tue 13 Oct', ev('WC67', 'T0081')['date'] == '2026-10-01' and not ev('WC67', 'T0081').get('date_correction') and ev('WC67', 'T0262')['date'] == '2026-10-13')
check('WC32 and WC66 (cancelled) untouched', ck['WC32'] == bk['WC32'] and ck['WC66'] == bk['WC66'])
check('WC29 keeps its Mon 26 Oct removal', ev('WC29', 'T0183') == next(e for e in bk['WC29']['events'] if e['task_id'] == 'T0183') and ck['WC29']['last_date'] == '2026-10-26')

for f in fails:
    if f[:2] in ('WC', 'PG', 'T0'): print('FAIL ' + f)   # row-level findings; the named checks already printed their line
print('data886: ' + ('PASS - DATA identical to live except the %d plan rows and their references\' span fields' % len(expect) if not fails else 'FAIL - %d finding(s)' % len(fails)))
sys.exit(1 if fails else 0)
