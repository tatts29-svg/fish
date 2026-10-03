#!/usr/bin/env python3
"""Every reference's meet point on the page against the reference assignment (assign.py, kept private in the
scratchpad). assign.py is imported unchanged; only its PROBE table is pointed at the build's own probe (the same fields
its builder read: dest kind and position, zone816, wayIn816), and it is called the way its builders call it: the
master-plan position, or None.        python3 assign_check818.py <probe818.json> <path/to/assign.py dir>"""
import json, sys, importlib
probe = json.load(open(sys.argv[1])); sys.path.insert(0, sys.argv[2])
AS = importlib.import_module('assign')
AS.PROBE = {r['key']: r for r in probe['refs']}
ok = bad = 0; per = {}; fails = []
for r in probe['refs']:
    d = r.get('dest') or {}
    ll = (d['ll']['lat'], d['ll']['lon']) if d.get('kind') == 'master' and d.get('ll') else None
    p, m, how, flag = AS.assign(r['key'], ll)
    pg = r['page'] or {}
    if pg.get('id') == p['id'] and ((m is None and pg.get('m') is None) or (m is not None and pg.get('m') is not None and abs(m - pg['m']) < 0.01)):
        ok += 1; per[p['id']] = per.get(p['id'], 0) + 1
    else:
        bad += 1; fails.append((r['key'], p['id'], m, how, pg))
print(f'{ok} of {ok + bad} references: page meet point = reference assignment ({bad} differ)')
print('by meet point:', json.dumps(dict(sorted(per.items()))))
for f in fails[:40]: print('  DIFF', f)
if bad or not ok: sys.exit(1)
# and against the meet points the plan itself names (its loads and its on-site lists), where the item has its own WC ref.
# A drop the plan marks "no pin" (Coates directs to the spot) is the pit lane by the plan's own rule.
plan = json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__), '..', '..', 'meet_points_03Oct2026', 'event_portables_plan.json')))
page = {r['key']: (r['page'] or {}).get('id') for r in probe['refs']}
n = m = 0; diffs = []
for L in plan['loads']:
    for s in L['stops']:
        for x in s['drops']:
            if not x.get('ref') or x['ref'] not in page: continue
            n += 1; want = s['meet_point_id']
            if page[x['ref']] == want: m += 1
            else: diffs.append(('load %d' % L['n'], x['ref'], want, page[x['ref']], 'no pin' if x.get('no_pin') else ''))
for grp in ('event_portables_fwf', 'coates_fwf', 'non_fwf_toilet_items'):
    for x in plan['on_site'][grp]:
        if not x.get('ref') or x['ref'] not in page or not x.get('meet_point_id'): continue
        n += 1
        if page[x['ref']] == x['meet_point_id']: m += 1
        else: diffs.append((grp, x['ref'], x['meet_point_id'], page[x['ref']], ''))
print(f'{m} of {n} plan meet points (loads and on-site lists) = the page')
for d in diffs: print('  PLAN DIFF', d)
sys.exit(1 if diffs else 0)
