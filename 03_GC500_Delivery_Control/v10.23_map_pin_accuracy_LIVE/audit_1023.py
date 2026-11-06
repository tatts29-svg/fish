#!/usr/bin/env python3
"""Author: Andrew Fisher. Read-only audit of every map position on the GC500 page (v10.23).

    python3 audit_1023.py path/to/live_page.html [--json out.json]

Recomputes, for every reference the page positions:
  1. MASTER_LOC.ll from MASTER_LOC.pt through the explorer's registration (the page's own GENERATOR_GEO1017
     matrices: D001 sheet point -> Web Mercator zoom-18 pixel -> lat/lon), main plan or Cypress inset by region;
  2. the MASTER_SHAPES926 footprint anchor (k) and footprint centre against MASTER_LOC.pt, in metres;
  3. DETAILS1002 reviewed-destination coordinates against MASTER_LOC.ll (the page only shows the reviewed text
     when they agree to 6 decimals);
  4. MASTER_LAYERS marks: fx/fy against ll;
  5. the GN13 guard constants in generatorDestination994 against MASTER_LOC.GN13.ll;
  6. the independent reads in the repo: v6.85 master_loc.json, locations_from_master_27sep/resolved.json,
     record_29Sep2026_master_plan_positions (the 33 places written on 29 Sep), each against today's page.
Prints a plain report and writes the findings as JSON. Nothing is written to the page or the service.
"""
import json, math, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
JOB = HERE.parent
W18 = 512 * 2 ** 18
SHEET = (2384.0, 1684.0)          # D001 PDF points, 17 Sep frame (MASTER_LOC.pt is a fraction of this)
M_PER_PT = 0.705556               # the master's scale: 1 PDF point = 0.705556 m (MASTER_SHAPES926.m_per_pt)


def brace(s, i):
    d = 0; j = i
    while True:
        c = s[j]
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: return s[i:j + 1]
        elif c == '"':
            j += 1
            while s[j] != '"':
                if s[j] == '\\': j += 1
                j += 1
        j += 1


def bracket(s, i):
    d = 0; j = i
    while True:
        c = s[j]
        if c == '[': d += 1
        elif c == ']':
            d -= 1
            if d == 0: return s[i:j + 1]
        elif c == '"':
            j += 1
            while s[j] != '"':
                if s[j] == '\\': j += 1
                j += 1
        j += 1


def after(s, anchor):
    n = s.count(anchor)
    if n != 1: raise SystemExit(f'anchor {anchor!r} occurs {n} times, expected once')
    return s.index(anchor) + len(anchor)


def to_ll(m, x, y):
    px = m[0][0] * x + m[0][1] * y + m[0][2]
    py = m[1][0] * x + m[1][1] * y + m[1][2]
    lon = px / W18 * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / W18))))
    return lat, lon


def metres(a, b):
    """distance between two [lat, lon] in metres (local flat earth, fine at 100 m)"""
    lat = math.radians((a[0] + b[0]) / 2)
    dy = (a[0] - b[0]) * 111320.0
    dx = (a[1] - b[1]) * 111320.0 * math.cos(lat)
    return math.hypot(dx, dy)


def main():
    a = sys.argv[1:]
    page = Path(a[0]); s = page.read_text(encoding='utf-8')
    out = a[a.index('--json') + 1] if '--json' in a else None
    F = {'page': page.name, 'checks': {}}

    M = json.loads(brace(s, after(s, 'const MASTER_LOC = ')))
    i = after(s, 'const GENERATOR_GEO1017=Object.freeze(')
    geo_txt = brace(s, i)
    main_m = json.loads(bracket(geo_txt, geo_txt.index('main:') + 5))
    inset_m = json.loads(bracket(geo_txt, geo_txt.index('inset:') + 6))
    region = json.loads(bracket(geo_txt, geo_txt.index('insetRegion:') + 12))

    # 1. ll from pt, every entry
    rows = []
    for r, m in M.items():
        x, y = m['pt'][0] * SHEET[0], m['pt'][1] * SHEET[1]
        inset = region[0] <= x <= region[2] and region[1] <= y <= region[3]
        ll = to_ll(inset_m if inset else main_m, x, y)
        rows.append((metres(ll, m['ll']), r, inset))
    rows.sort(reverse=True)
    dev = [d for d, _, _ in rows]
    F['checks']['ll_from_pt'] = {'n': len(rows), 'median_m': round(sorted(dev)[len(dev) // 2], 3), 'max_m': round(rows[0][0], 3),
                                 'worst': [(r, round(d, 3)) for d, r, _ in rows[:5]], 'inset_refs': [r for _, r, ins in rows if ins]}
    print(f"1. MASTER_LOC.ll recomputed from pt for {len(rows)} references: median {F['checks']['ll_from_pt']['median_m']} m, "
          f"max {F['checks']['ll_from_pt']['max_m']} m ({rows[0][1]}); inset refs {F['checks']['ll_from_pt']['inset_refs']}")
    unit = [r for r, m in M.items() if m.get('prec') == 'unit']; area = [r for r in M if r not in unit]
    print(f"   prec unit {len(unit)}, area {len(area)}, unverified {[r for r, m in M.items() if m.get('unverified')]}")

    # 2. footprints
    i = after(s, 'const MASTER_SHAPES926_DATA = ')
    raw = s[i:s.index('</script>', i)].strip().rstrip(';')
    SH = json.loads(raw); shapes = SH['shapes']
    mpp = SH.get('m_per_pt', M_PER_PT)
    gaps = []
    for r, sh in shapes.items():
        m = M.get(r)
        if not m or not sh.get('k'): continue
        # k is a fraction of the sheet, like pt
        k = sh['k']
        gaps.append((math.hypot((k[0] - m['pt'][0]) * SHEET[0], (k[1] - m['pt'][1]) * SHEET[1]) * mpp, r, m.get('prec')))
    gaps.sort(reverse=True)
    F['checks']['footprint_anchor_vs_pt'] = {'n': len(gaps), 'over_2m_unit': [(r, round(d, 1)) for d, r, p in gaps if d > 2 and p == 'unit'],
                                             'over_2m_area': [(r, round(d, 1)) for d, r, p in gaps if d > 2 and p != 'unit']}
    print(f"2. footprint anchor k vs pt, {len(gaps)} references with a footprint; unit refs over 2 m: {F['checks']['footprint_anchor_vs_pt']['over_2m_unit']}")
    # the WC57 / WC59 question: whose anchor sits on whose pt
    for r in ('WC57', 'WC59'):
        k = shapes[r]['k']; near = sorted((math.hypot((k[0] - M[q]['pt'][0]) * SHEET[0], (k[1] - M[q]['pt'][1]) * SHEET[1]) * mpp, q) for q in M)[:2]
        n_units = sum(len(c.get('p', [])) for c in shapes[r].get('c', []))
        print(f"   {r}: anchor k {k} is nearest to {near[0][1]} ({near[0][0]:.1f} m), then {near[1][1]} ({near[1][0]:.1f} m); "
              f"{len(shapes[r].get('c', []))} drawn parts; how: {M[r]['how'][:70]!r}")
        F['checks'][f'{r}_anchor'] = {'k': k, 'nearest': [(q, round(d, 1)) for d, q in near], 'parts': len(shapes[r].get('c', []))}

    # 3. DETAILS1002 coordinates
    i = after(s, 'const DETAILS1002 = ') if s.count('const DETAILS1002 = ') == 1 else after(s, 'DETAILS1002 = ')
    D = json.loads(brace(s, i)) if s[i] == '{' else json.loads(bracket(s, i))
    items = D.items() if isinstance(D, dict) else [(d.get('ref') or d.get('key'), d) for d in D]
    bad, n = [], 0
    for r, d in items:
        c = (d or {}).get('coordinates')
        if not c: continue
        n += 1
        m = M.get(r)
        want = '%.6f, %.6f' % tuple(m['ll']) if m else None
        if want != c: bad.append((r, c, want))
    F['checks']['details1002_coordinates'] = {'n': n, 'mismatch': bad}
    print(f"3. DETAILS1002 reviewed destinations with coordinates: {n}; mismatching MASTER_LOC.ll: {bad or 'none'}")

    # 4. MASTER_LAYERS
    i = after(s, 'const MASTER_LAYERS = ')
    L = json.loads(bracket(s, i))
    lg = []
    for mk in L:
        if mk.get('ll') and mk.get('fx') is not None:
            x, y = mk['fx'] * SHEET[0], mk['fy'] * SHEET[1]
            lg.append((metres(to_ll(main_m, x, y), mk['ll']), mk.get('label')))
    lg.sort(reverse=True)
    F['checks']['master_layers'] = {'n': len(lg), 'max_m': round(lg[0][0], 3) if lg else None}
    print(f"4. MASTER_LAYERS marks {len(lg)}: fx/fy vs ll max {F['checks']['master_layers']['max_m']} m")

    # 5. GN13 guard
    g = re.search(r"target\.ll\.lat - (-?\d+\.\d+)\) > 0\.0000001 \|\|\s*Math\.abs\(target\.ll\.lon - (-?\d+\.\d+)\)", s)
    guard = [float(g.group(1)), float(g.group(2))] if g else None
    F['checks']['gn13_guard'] = {'guard': guard, 'master': M.get('GN13', {}).get('ll'), 'ok': guard == M.get('GN13', {}).get('ll')}
    print(f"5. GN13 guard {guard} vs MASTER_LOC.GN13.ll {M.get('GN13', {}).get('ll')}: {'agree' if F['checks']['gn13_guard']['ok'] else 'DIFFER'}")

    # 6. independent reads
    v685 = json.loads((JOB / 'v6.85_master_plan_positions_everywhere_LIVE' / 'master_loc.json').read_text())
    moved = sorted(((metres(v['ll'], M[r]['ll']), r) for r, v in v685.items() if r in M), reverse=True)
    same = sum(1 for d, _ in moved if d < 0.5)
    F['checks']['v685_master_loc'] = {'n': len(moved), 'within_0_5m': same, 'moved_over_5m': [(r, round(d, 1)) for d, r in moved if d > 5],
                                      'not_in_v685': sorted(set(M) - set(v685)), 'not_on_page': sorted(set(v685) - set(M))}
    print(f"6a. v6.85 master_loc.json: {len(moved)} shared, {same} within 0.5 m, {len([1 for d, _ in moved if d > 5])} moved over 5 m since 27 Sep "
          f"(by later releases); new since: {F['checks']['v685_master_loc']['not_in_v685']}")
    res = json.loads((JOB / 'locations_from_master_27sep' / 'resolved.json').read_text())
    rr = sorted(((metres(row['latlng'], M[row['k']]['ll']), row['k']) for row in res if row.get('latlng') and row.get('k') in M), reverse=True)
    F['checks']['resolved_27sep'] = {'n': len(rr), 'within_0_5m': sum(1 for d, _ in rr if d < 0.5), 'moved_over_5m': [(r, round(d, 1)) for d, r in rr if d > 5]}
    print(f"6b. locations_from_master_27sep/resolved.json: {len(rr)} shared, {F['checks']['resolved_27sep']['within_0_5m']} within 0.5 m, "
          f"{len(F['checks']['resolved_27sep']['moved_over_5m'])} moved over 5 m since")
    log = json.loads((JOB / 'record_29Sep2026_master_plan_positions' / 'actions_log.json').read_text())
    placed = [(row[1], row[3]) for row in log if row[0] == 'placed']
    stale = sorted(((metres(ll, M[r]['ll']), r) for r, ll in placed if r in M), reverse=True)
    F['checks']['places_29sep'] = {'n': len(placed), 'stale_over_2m': [(r, round(d, 1)) for d, r in stale if d > 2]}
    print(f"6c. 29 Sep places (native record, shadowed by the master for prec unit): {len(placed)} written; "
          f"now over 2 m from today's master: {F['checks']['places_29sep']['stale_over_2m']}")

    if out:
        Path(out).write_text(json.dumps(F, indent=1) + '\n')
        print('findings:', out)


if __name__ == '__main__':
    main()
