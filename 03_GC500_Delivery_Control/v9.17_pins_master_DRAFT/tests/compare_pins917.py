# Author: Andrew Fisher. v9.17 - compare what the base and the candidate hand a driver, for every reference.
#   python3 tests/compare_pins917.py <base collect json> <candidate collect json> <out json>
# (3) every row: the 57 (the 23, GN18 and GN13, the 28 near moves, WC59, WC57, WC13 and WC69) move by the listed metres (+-0.1 m) on Navigate, the Navigate button, the drop message (Directions
#     and "Or key in"), the job sheet lines, dpPos and the driver card, and stay "master plan"; every other row moves 0.0 m
#     and keeps its kind; CP1 and WC81 stay in the inset; the record version is the same before and after both runs.
# (4) Part 2, candidate: every surface's point equals Navigate's (dest782) to 0.0 m, for every reference - including, after
#     the 8 Oct review, the printed drop sheet (Sat nav and the ring on its pictures), the driver card's Ground position,
#     the email's "Pinned on site" rows, the aerial point (aerialNav917), the 3D fly-to, Today's day card map (0.1 m: the
#     page's own 4-decimal rounding) and the driver page picture of every load; and the words beside them say so.
import json, math, sys
from pathlib import Path
here = Path(__file__).resolve().parent
A, B = (json.loads(Path(x).read_text()) for x in sys.argv[1:3])
DER = dict(json.loads((here.parent / 'evidence' / 'derive917.json').read_text())['rows'], **json.loads((here.parent / 'evidence' / 'derive917_add.json').read_text())['rows'],
           **json.loads((here.parent / 'evidence' / 'derive917_held.json').read_text())['rows'])
# the "Moves" column of the audit table the project manager was given (metres)
TABLE = {'WC09': 6.6, 'CP1': 15.9, 'T0243': 5.4, 'WC24': 5.6, 'WC35': 5.6, 'WC81': 5.7, 'WC65': 5.5, 'WC26': 5.2, 'WC68': 5.1, 'WC86': 5.1,
         'WC25': 5.0, 'WC34': 5.0, 'WC70': 4.8, 'WC19': 4.4, 'WC16': 4.1, 'WC17': 4.1, 'WC44': 4.0, 'WC39': 3.6, 'WC62': 3.2, 'WC04': 3.2,
         'WC02': 3.1, 'WC28': 3.1, 'WC50': 3.1,
         # second round: the project manager's figures for the generators (8 Oct) and the near list's metres (near37.json)
         # r4 (9 Oct): GN18 and GN13 on the symbol's outline centre; measured from the PDF derivation (derive917_add: 17.11 m, 11.55 m)
         'GN18': 17.11, 'GN13': 11.55,
         'WC06': 1.5, 'WC10': 2.4, 'WC11': 2.1, 'WC12': 2.4, 'WC21': 2.7, 'WC23': 2.0, 'WC29': 2.8, 'WC30': 1.4, 'WC33': 2.6, 'WC38': 2.0,
         'WC40': 1.9, 'WC41': 2.2, 'WC42': 2.2, 'WC43': 1.6, 'WC45': 1.9, 'WC46': 1.9, 'WC47': 2.2, 'WC48': 2.6, 'WC49': 1.9, 'WC53': 2.2,
         'WC54': 2.3, 'WC55': 1.6, 'WC56': 2.0, 'WC61': 2.0, 'WC67': 1.3, 'WC71': 2.4, 'WC72': 2.9, 'WC73': 1.9,
         # third round: the audit's metres for the four the project manager answered (8 Oct about 23:20 AEST)
         'WC59': 5.6, 'WC57': 11.8, 'WC13': 2.0, 'WC69': 2.3}
assert set(TABLE) == set(DER) and len(TABLE) == 57
HELD = ['P08', 'P44', 'P51', 'WC20', 'P27', 'P29', 'P34', 'WC51', 'WC01', 'P26', 'P28', 'T0022', 'T0023', 'P47', 'WC32']
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
rows3 = []; part2_moved = []
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
                # equal to Navigate exactly, or to Navigate as a link prints it (6 decimals): the second round's points have 7
                check(r1(min(hav(ll, db['ll']), hav(ll, R6(db['ll'])))) == 0.0, '%s: %s is %.2f m from Navigate' % (k, sname, hav(ll, db['ll'])))
        Pa = pts_of(a['sf'])
        for sname in Pa:
            for ll in Pa[sname]:
                check(min(hav(ll, da['ll']), hav(ll, R6(da['ll']))) < 0.1, '%s base: %s not on the old point' % (k, sname))
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
        changed = [s for s in set(Pa) | set(Pb) if Pa.get(s) != Pb.get(s)]
        # Part 2 may only bring the driver card (it carries the drawer's links) onto Navigate; nothing else may change
        p2 = [s for s in changed if s == 'driverCard' and db and db.get('ll') and all(r1(hav(ll, R6(db['ll']))) == 0.0 for ll in Pb.get(s, []))]
        if p2: part2_moved.append(k)
        check(not [s for s in changed if s not in p2], k + ': a driver-facing point changed: ' + str([s for s in changed if s not in p2]))
        check(a['master'] == b['master'], k + ': MASTER_LOC changed')
# (4) Part 2 on the candidate (and, for the record, how many disagreed on the base)
def part2(X, building_pins, words_bad=None, notes917=None, report_aerial=None):
    words_bad = [] if words_bad is None else words_bad; notes917 = [] if notes917 is None else notes917
    report_aerial = [] if report_aerial is None else report_aerial; rounded = []
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
        # after the 8 Oct review: the printed drop sheet, the driver card's Ground position, the email's pins, the pictures
        ds = sf.get('dropSheet')
        if isinstance(ds, dict):
            got.append(('drop sheet Sat nav', ds.get('satnav')))
            # the pit lane (no drop-off set) is where the driver reports, not where the thing goes: its pictures keep the
            # drawn spot by design (aerialNav917); they are listed, not counted
            if d.get('kind') == 'report':
                if ds.get('rings'): report_aerial.append(r['key'] + ' drop sheet pictures')
            else: got += [('drop sheet picture ring', x) for x in (ds.get('rings') or [])]
            if ds.get('satnav') and not str(ds.get('words') or '').startswith('the same point as Navigate'): words_bad.append({'ref': r['key'], 'surface': 'drop sheet Sat nav', 'words': ds.get('words')})
        g = sf.get('ground')
        if isinstance(g, dict):
            got.append(('driver card Ground position', g.get('ll')))
            if 'the same point as Navigate' not in str(g.get('words')): words_bad.append({'ref': r['key'], 'surface': 'Ground position', 'words': g.get('words')})
        ep = sf.get('emailPins')
        if isinstance(ep, dict):
            for row in ep.get('rows') or []:
                if row.get('unit'):
                    for ll in row.get('links') or []:
                        if r1(min(hav(ll, d['ll']), hav(ll, D))) != 0.0: building_pins.append({'ref': r['key'], 'surface': 'email building pin', 'm': r1(hav(ll, d['ll']))})
                    continue
                got += [('email pinned on site', ll) for ll in row.get('links') or []]
            if ep.get('note'): notes917.append({'ref': r['key'], 'kind': d.get('kind'), 'note': ep['note'][:160]})
        ae = sf.get('aerial')
        if isinstance(ae, dict):
            if d.get('kind') == 'report':
                if ae.get('helper'): report_aerial.append(r['key'] + ' aerial point')
            else:
                got += [('aerial point (aerialNav917)', ae.get('helper')), ('3D fly-to', ae.get('fly3d'))]
                if ae.get('dayCardMap'): rounded.append(('Today day card map', ae['dayCardMap']))
        # a reference with a pin per building (not a master unit) lists every building's pin in its drawer and driver card;
        # those rows are the buildings' own pins by design (on the record only T0022) and are reported, not counted
        per_building = isinstance(pb, dict) and not pb.get('master') and pb.get('rows', 0) > 1
        for sname, ll in rounded:  # the page writes this one as a 4-decimal fraction of the crop: 0.1 m is its own rounding
            n_checked += 1; per[sname] = per.get(sname, 0) + 1
            if min(hav(ll, d['ll']), hav(ll, D)) > 0.1: bad.append({'ref': r['key'], 'surface': sname, 'm': r1(hav(ll, d['ll']))})
        rounded.clear()
        for sname, ll in got:
            if ll is None: continue
            # equal to Navigate exactly, or to Navigate as the page prints it (6 decimals in a link)
            m = min(hav(ll, d['ll']), hav(ll, D))
            if per_building and sname == 'driverCard' and r1(m) != 0.0:
                building_pins.append({'ref': r['key'], 'm': r1(m)}); continue
            n_checked += 1; per[sname] = per.get(sname, 0) + 1
            if r1(m) != 0.0: bad.append({'ref': r['key'], 'surface': sname, 'm': r1(m)})
    return bad, n_checked, per
bp_b, bp_a = [], []
wb_b, nt_b, ra_b = [], [], []
bad_b, nb, per_b = part2(B, bp_b, wb_b, nt_b, ra_b); bad_a, na, per_a = part2(A, bp_a)
check(not bad_b, 'Part 2: %d surface points are not on Navigate: %s' % (len(bad_b), bad_b[:8]))
check(not wb_b, 'Part 2: %d lines do not say they are Navigate\'s point: %s' % (len(wb_b), wb_b[:4]))
check(all(k in per_b for k in ('drop sheet Sat nav', 'drop sheet picture ring', 'driver card Ground position', 'email pinned on site', 'aerial point (aerialNav917)', '3D fly-to', 'Today day card map')),
      'Part 2: a review surface was not read on the candidate: ' + str(sorted(per_b)))
# the driver page picture of every load on the programme (loadDrop), against Navigate for the load's first reference
def loads_off(X):
    off, n = [], 0
    for l in X.get('loads') or []:
        if l.get('error'): off.append(l); continue
        if not l.get('pic') or not l.get('dest') or l.get('kind') == 'report': continue
        n += 1
        if r1(hav(l['pic'], l['dest'])) != 0.0: off.append({'load': l['id'], 'ref': l['key'], 'm': r1(hav(l['pic'], l['dest']))})
    return off, n
lo_b, ln_b = loads_off(B); lo_a, ln_a = loads_off(A)
check(not lo_b and ln_b > 0, 'driver page pictures: %d of %d not on Navigate: %s' % (len(lo_b), ln_b, lo_b[:4]))
# Navigate itself does not move because of Part 2: only the 23 change (checked above), and the base's surfaces that disagreed are now fixed
refs_fixed = sorted({x['ref'] for x in bad_a})
held_seen = []
for k in HELD:
    a, b = BA.get(k), BB.get(k)
    if not (a and b): continue
    da, db = a['dest'] or {}, b['dest'] or {}
    check(da.get('ll') == db.get('ll') and da.get('kind') == db.get('kind'), k + ': a held reference moved')
    held_seen.append(k)
check(len(held_seen) >= 14, 'held references not all read: ' + str(sorted(set(HELD) - set(held_seen))))
out = {'held_not_moved': held_seen, 'driver_card_brought_onto_navigate_by_part2': part2_moved, 'rows': len(BB), 'record_version': B['version_end'], 'footer': B['footer'], 'moved_57': rows3,
       'part2': {'candidate_points_checked': nb, 'candidate_not_on_navigate': bad_b, 'per_building_pins_shown_not_counted': bp_b, 'per_surface': per_b,
                 'candidate_words_not_navigate': wb_b, 'email_unverified_master_notes': nt_b, 'report_kind_pictures_keep_drawn_spot': ra_b,
                 'driver_page_pictures': {'candidate_checked': ln_b, 'candidate_off': lo_b, 'base_checked': ln_a, 'base_off': len(lo_a), 'base_worst': sorted([x for x in lo_a if 'm' in x], key=lambda x: -x['m'])[:8]},
                 'base_per_surface_checked': per_a,
                 'base_points_checked': na, 'base_not_on_navigate': len(bad_a), 'base_refs_with_a_second_point': len(refs_fixed), 'base_refs': refs_fixed,
                 'base_worst': sorted(bad_a, key=lambda x: -x['m'])[:15]},
       'fails': fails}
Path(sys.argv[3]).write_text(json.dumps(out, indent=1))
print('rows', len(BB), '| record', A['version_start'], '->', B['version_end'], '| moved %d:' % len(rows3), ', '.join('%s %.1f m' % (x['ref'], x['moved_m']) for x in rows3))
print('held, Navigate unchanged (0.0 m, same kind):', ', '.join(held_seen))
print('Part 2: candidate %d points, %d off Navigate; base %d points off Navigate on %d references' % (nb, len(bad_b), len(bad_a), len(refs_fixed)))
print('  per surface (candidate):', ', '.join('%s %d' % kv for kv in sorted(per_b.items())))
print('  driver page pictures: candidate %d checked, %d off; base %d off' % (ln_b, len(lo_b), len(lo_a)))
print('  email notes (unverified master position not offered):', ', '.join(x['ref'] for x in nt_b) or 'none', '| pit-lane references whose pictures keep the drawn spot:', ', '.join(sorted({x.split()[0] for x in ra_b})) or 'none')
print(('FAIL %d: ' % len(fails)) + '; '.join(fails[:12]) if fails else 'PASS')
sys.exit(1 if fails else 0)
