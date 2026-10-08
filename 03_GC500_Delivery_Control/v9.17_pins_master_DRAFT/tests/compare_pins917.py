# Author: Andrew Fisher. v9.17 - compare what the base and the candidate hand a driver, for every reference.
#   python3 tests/compare_pins917.py <base collect json> <candidate collect json> <out json>
# (3) every row: the 23 move by the listed metres (+-0.1 m) on Navigate, the Navigate button, the drop message (Directions
#     and "Or key in"), the job sheet lines, dpPos and the driver card, and stay "master plan"; every other row moves 0.0 m
#     and keeps its kind; CP1 and WC81 stay in the inset; the record version is the same before and after both runs.
# (4) Part 2, candidate: every surface's point equals Navigate's (dest782) to 0.0 m, for every reference.
import json, math, sys
from pathlib import Path
here = Path(__file__).resolve().parent
A, B = (json.loads(Path(x).read_text()) for x in sys.argv[1:3])
DER = json.loads((here.parent / 'evidence' / 'derive917.json').read_text())['rows']
# the "Moves" column of the audit table the project manager was given (metres)
TABLE = {'WC09': 6.6, 'CP1': 15.9, 'T0243': 5.4, 'WC24': 5.6, 'WC35': 5.6, 'WC81': 5.7, 'WC65': 5.5, 'WC26': 5.2, 'WC68': 5.1, 'WC86': 5.1,
         'WC25': 5.0, 'WC34': 5.0, 'WC70': 4.8, 'WC19': 4.4, 'WC16': 4.1, 'WC17': 4.1, 'WC44': 4.0, 'WC39': 3.6, 'WC62': 3.2, 'WC04': 3.2,
         'WC02': 3.1, 'WC28': 3.1, 'WC50': 3.1}
assert set(TABLE) == set(DER)
def hav(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))
r1 = lambda x: round(x + 1e-9, 1)
R6 = lambda ll: [round(ll[0], 6), round(ll[1], 6)]
fails, notes = [], []
def check(c, what):
    if not c: fails.append(what)
    return c
for X, n in ((A, 'base'), (B, 'candidate')):
    check(X['counts']['blocked'] == 0, n + ': a write was attempted')
    check(not X['errors'], n + ': page errors ' + str(X['errors'][:2]))
    check(X['version_start'] == X['version_end'], n + ': the record changed during the run')
    check(X['sync']['status'] == 'live', n + ': not live')
check(A['version_start'] == B['version_start'] == B['version_end'], 'record version differs between the runs: %s %s' % (A['version_start'], B['version_end']))
check(A['footer'] == B['footer'], 'footer differs')
BA = {r['key']: r for r in A['rows']}; BB = {r['key']: r for r in B['rows']}
check(set(BA) == set(BB), 'the rows differ: ' + str(sorted(set(BA) ^ set(BB))[:10]))
def pts_of(sf):
    """the points the 'driver-facing' surfaces of test 3 give"""
    out = {}
    if isinstance(sf.get('navBtn'), list): out['navBtn'] = sf['navBtn']
    if isinstance(sf.get('dropText'), dict) and sf['dropText'].get('ll'): out['dropText'] = [sf['dropText']['ll']]
    if isinstance(sf.get('text747'), list): out['text747'] = sf['text747']
    if isinstance(sf.get('dpPos'), dict) and sf['dpPos'].get('ll'): out['dpPos'] = [sf['dpPos']['ll']]
    if isinstance(sf.get('driverCard'), dict): out['driverCard'] = sf['driverCard']['dest'] + sf['driverCard']['earth']
    return out
rows3 = []
for k in sorted(BB):
    a, b = BA.get(k), BB[k]
    if not a: continue
    da, db = a['dest'], b['dest']
    if k in DER:
        want = DER[k]['listed_ll']
        ok = check(db and db.get('kind') == 'master' and db.get('label') == 'master plan' and db.get('sms') == 'master plan', k + ': not "master plan" on the candidate')
        moved = hav(da['ll'], db['ll']) if da and db and da.get('ll') and db.get('ll') else None
        check(moved is not None and abs(moved - TABLE[k]) <= 0.1 + 1e-9, k + ': moved %s m, the table says %.1f m' % (moved, TABLE[k]))
        check(db and hav(db['ll'], want) == 0, k + ': Navigate is not the listed point')
        check(b['master']['ll'] == want and b['master']['pt'] == DER[k]['listed_pt'], k + ': MASTER_LOC is not the listed point')
        check(da.get('kind') == db.get('kind'), k + ': kind changed')
        P = pts_of(b['sf'])
        for sname, lst in P.items():
            for ll in lst:
                check(r1(hav(ll, R6(db['ll']))) == 0.0, '%s: %s is %.2f m from Navigate' % (k, sname, hav(ll, db['ll'])))
        Pa = pts_of(a['sf'])
        for sname in Pa:
            for ll in Pa[sname]:
                check(abs(hav(ll, R6(da['ll']))) < 0.1, '%s base: %s not on the old point' % (k, sname))
        check('master plan' in (b['sf'].get('dropText') or {}).get('keyin', ''), k + ': drop message does not say master plan')
        if k in ('CP1', 'WC81'):
            fx, fy = b['master']['pt']
            x17, y17 = fx * 2384.0, fy * 1837 / (2600 / 2384.0)
            check(1482.86 <= x17 <= 2334.08 and 873.42 <= y17 <= 1464.24, k + ': not in the inset')
        rows3.append({'ref': k, 'kind': db.get('kind'), 'moved_m': r1(moved) if moved is not None else None, 'table_m': TABLE[k], 'surfaces': sorted(P)})
    else:
        same_kind = (da or {}).get('kind') == (db or {}).get('kind')
        moved = hav(da['ll'], db['ll']) if da and db and da.get('ll') and db.get('ll') else (0.0 if (da or {}).get('ll') == (db or {}).get('ll') else None)
        check(same_kind, k + ': kind changed %s -> %s' % ((da or {}).get('kind'), (db or {}).get('kind')))
        check(moved == 0.0, k + ': Navigate moved %s m' % moved)
        Pa, Pb = pts_of(a['sf']), pts_of(b['sf'])
        check(Pa == Pb, k + ': a driver-facing point changed: ' + str([s for s in set(Pa) | set(Pb) if Pa.get(s) != Pb.get(s)]))
        check(a['master'] == b['master'], k + ': MASTER_LOC changed')
# (4) Part 2 on the candidate (and, for the record, how many disagreed on the base)
def part2(X):
    bad, n_checked, per = [], 0, {}
    for r in X['rows']:
        d = r['dest']
        if not d or not d.get('ll'): continue
        D = R6(d['ll']); sf = r['sf']; got = []
        e = sf.get('email') or {}
        if isinstance(e, dict): got += [('email Sat nav', e.get('satnav')), ('email button', e.get('button'))]
        s = sf.get('satellite')
        if isinstance(s, dict) and s.get('pos'):
            got += [('satellite ' + n, s.get(n)) for n in ('approx', 'copy', 'navigate', 'streetView', 'earth', 'fromDepot', 'fly', 'svHere')]
        pb = sf.get('pinBlock')
        if isinstance(pb, dict) and pb.get('master'):
            got += [('drawer ' + (x['mode'] or 'link'), x['ll']) for x in pb['dest']] + [('drawer earth', x) for x in pb['earth']]
        sp = sf.get('spotOf')
        if isinstance(sp, dict) and sp.get('ll'): got.append(('map spot', sp['ll']))
        if isinstance(sf.get('ldGo751'), list): got.append(('load Go', sf['ldGo751']))
        for x in (sf.get('dayPinCell') if isinstance(sf.get('dayPinCell'), list) else []): got.append(('day pin', x))
        for sname, lst in pts_of(sf).items():
            for ll in lst: got.append((sname, ll))
        for sname, ll in got:
            if ll is None: continue
            n_checked += 1; per[sname] = per.get(sname, 0) + 1
            m = hav(ll, D)
            if r1(m) != 0.0: bad.append({'ref': r['key'], 'surface': sname, 'm': r1(m)})
    return bad, n_checked, per
bad_b, nb, per_b = part2(B); bad_a, na, _ = part2(A)
check(not bad_b, 'Part 2: %d surface points are not on Navigate: %s' % (len(bad_b), bad_b[:8]))
# Navigate itself does not move because of Part 2: only the 23 change (checked above), and the base's surfaces that disagreed are now fixed
refs_fixed = sorted({x['ref'] for x in bad_a})
out = {'rows': len(BB), 'record_version': B['version_end'], 'footer': B['footer'], 'moved_23': rows3,
       'part2': {'candidate_points_checked': nb, 'candidate_not_on_navigate': bad_b, 'per_surface': per_b,
                 'base_points_checked': na, 'base_not_on_navigate': len(bad_a), 'base_refs_with_a_second_point': len(refs_fixed), 'base_refs': refs_fixed,
                 'base_worst': sorted(bad_a, key=lambda x: -x['m'])[:15]},
       'fails': fails}
Path(sys.argv[3]).write_text(json.dumps(out, indent=1))
print('rows', len(BB), '| record', A['version_start'], '->', B['version_end'], '| the 23:', ', '.join('%s %.1f m' % (x['ref'], x['moved_m']) for x in rows3))
print('Part 2: candidate %d points, %d off Navigate; base %d points off Navigate on %d references' % (nb, len(bad_b), len(bad_a), len(refs_fixed)))
print(('FAIL %d: ' % len(fails)) + '; '.join(fails[:12]) if fails else 'PASS')
sys.exit(1 if fails else 0)
