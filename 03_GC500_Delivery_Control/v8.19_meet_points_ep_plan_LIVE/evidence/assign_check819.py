#!/usr/bin/env python3
"""Every reference's meet point on the page against the reference assignment (assign.py, kept private in the
scratchpad). assign.py is imported unchanged; only its PROBE table is pointed at the build's own probe (the same fields
its builder read: dest kind and position, zone816, wayIn816).
  1. every WC toilet and every other master-plan reference: assign.py exactly as it is, called the way its builders
     call it - the master-plan position, or None (the three WC references with no master-plan position, WC10 and WC85
     reported at the pit lane and WC100 with none, go to the pit lane entry under both).
  2. every other reference: the same rule with the reviewer's correction (3 Oct) - a pinned or confirmed position gets
     the nearest-point rule too, and any real map position (master, pinned, confirmed, unverified, placed) gets the area
     outline test; a description spot or the pit-lane report point is no pin. Done by giving assign.py's own zone_of the
     wider kinds; its code is not otherwise touched.
        python3 assign_check819.py <probe819.json> <path/to/assign.py dir>"""
import json, sys, importlib, os
probe = json.load(open(sys.argv[1])); sys.path.insert(0, sys.argv[2])
AS = importlib.import_module('assign')
AS.PROBE = {r['key']: r for r in probe['refs']}
ZONE_MASTER = AS.zone_of
RULE, AREA = ('master', 'pinned', 'confirmed'), ('master', 'pinned', 'confirmed', 'unverified', 'placed')
def zone_wide(key):
    r = AS.PROBE.get(key)
    if not r or (r.get('dest') or {}).get('kind') not in RULE: return None
    k = r['dest']['kind']; r['dest']['kind'] = 'master'
    try: return ZONE_MASTER(key)
    finally: r['dest']['kind'] = k
def same(pg, p, m):
    return pg.get('id') == p['id'] and ((m is None and pg.get('m') is None) or (m is not None and pg.get('m') is not None and abs(m - pg['m']) < 0.01))
res = {'master': [0, 0], 'other': [0, 0]}; per = {}; fails = []; wc_not_master = []
for r in probe['refs']:
    d = r.get('dest') or {}; kind = d.get('kind'); pg = r['page'] or {}
    if r['key'].startswith('WC') and kind != 'master': wc_not_master.append((r['key'], kind))
    if kind == 'master' or r['key'].startswith('WC'):
        AS.zone_of = ZONE_MASTER; p, m, how, flag = AS.assign(r['key'], (d['ll']['lat'], d['ll']['lon']) if kind == 'master' and d.get('ll') else None); grp = 'master'
    else:
        AS.zone_of = zone_wide; ll = (d['ll']['lat'], d['ll']['lon']) if kind in AREA and d.get('ll') else None
        p, m, how, flag = AS.assign(r['key'], ll); grp = 'other'
    if same(pg, p, m): res[grp][0] += 1; per[p['id']] = per.get(p['id'], 0) + 1
    else: res[grp][1] += 1; fails.append((grp, r['key'], kind, p['id'], m, how, pg))
AS.zone_of = ZONE_MASTER
n = sum(a + b for a, b in res.values()); good = sum(a for a, _ in res.values())
print(f'{res["master"][0]} of {sum(res["master"])} master-plan references and WC toilets (all {sum(1 for r in probe["refs"] if r["key"].startswith("WC"))} WC among them): page = assign.py unchanged ({res["master"][1]} differ)')
print(f'{res["other"][0]} of {sum(res["other"])} other references (pinned, confirmed, description, report, none): page = the same rule with pinned/confirmed included ({res["other"][1]} differ)')
print(f'{good} of {n} references in all')
print('by meet point:', json.dumps(dict(sorted(per.items()))))
print('by kind:', json.dumps(dict(sorted({k: sum(1 for r in probe['refs'] if ((r.get('dest') or {}).get('kind') or 'none') == k) for k in {((r.get('dest') or {}).get('kind') or 'none') for r in probe['refs']}}.items()))))
for f in fails[:40]: print('  DIFF', f)
if wc_not_master: print('  WC references with no master-plan position (no pin under both):', wc_not_master)
want = {'T0022': 'ISLAND_WEST_PARK', 'T0023': 'ISLAND_WEST_PARK', 'P47': 'COMMODORE'}
pgid = {r['key']: (r['page'] or {}).get('id') for r in probe['refs']}
for k, v in want.items(): print(('PASS' if pgid.get(k) == v else 'FAIL'), f'{k} -> {pgid.get(k)} (want {v})')
if fails or not good or any(pgid.get(k) != v for k, v in want.items()): sys.exit(1)
# and against the meet points the plan itself names (its loads and its on-site lists), where the item has its own WC ref.
plan = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'meet_points_03Oct2026', 'event_portables_plan.json')))
n = m = 0; diffs = []
for L in plan['loads']:
    for s in L['stops']:
        for x in s['drops']:
            if not x.get('ref') or x['ref'] not in pgid: continue
            n += 1
            if pgid[x['ref']] == s['meet_point_id']: m += 1
            else: diffs.append(('load %d' % L['n'], x['ref'], s['meet_point_id'], pgid[x['ref']], 'no pin' if x.get('no_pin') else ''))
for grp in ('event_portables_fwf', 'coates_fwf', 'non_fwf_toilet_items'):
    for x in plan['on_site'][grp]:
        if not x.get('ref') or x['ref'] not in pgid or not x.get('meet_point_id'): continue
        n += 1
        if pgid[x['ref']] == x['meet_point_id']: m += 1
        else: diffs.append((grp, x['ref'], x['meet_point_id'], pgid[x['ref']], ''))
print(f'{m} of {n} plan meet points (loads and on-site lists) = the page')
for d in diffs: print('  PLAN DIFF', d)
sys.exit(1 if diffs else 0)
