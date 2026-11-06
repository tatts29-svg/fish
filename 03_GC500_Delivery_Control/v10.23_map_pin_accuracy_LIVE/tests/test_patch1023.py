#!/usr/bin/env python3
"""Author: Andrew Fisher. Proves what patch_v1023.py changed and, more importantly, what it did not.

    python3 test_patch1023.py base.html patched.html

Checks: (1) MASTER_LOC positions (pt and ll) are identical for every reference; (2) MASTER_SHAPES926_DATA differs in
exactly the WC57 and WC59 records; (3) WC57's footprint is the pair at WC57's position and WC59's is the row of 7 at
WC59's position, anchors within 0.5 m; (4) the data-sha256 attribute hashes the new data text; (5) DETAILS1002
coordinates, MASTER_LAYERS, the GN13 guard and the footer are as expected; (6) outside the shapes block, the two
provenance keys and the footer, the page is byte for byte the base.
"""
import hashlib, json, re, sys
from pathlib import Path

SHEET = (2384.0, 1684.0); M_PER_PT = 0.705556


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


def grab(s, anchor):
    assert s.count(anchor) == 1, anchor
    i = s.index(anchor) + len(anchor); return brace(s, i)


def metres(k, pt): return ((k[0] - pt[0]) ** 2 * SHEET[0] ** 2 + (k[1] - pt[1]) ** 2 * SHEET[1] ** 2) ** 0.5 * M_PER_PT


def main():
    base, new = (Path(p).read_text(encoding='utf-8') for p in sys.argv[1:3])
    fails = []
    ok = lambda cond, msg: None if cond else fails.append(msg)

    Mb, Mn = (json.loads(grab(s, 'const MASTER_LOC = ')) for s in (base, new))
    ok(set(Mb) == set(Mn), 'MASTER_LOC references changed')
    for r in Mb:
        ok(Mb[r]['pt'] == Mn[r]['pt'] and Mb[r]['ll'] == Mn[r]['ll'], f'{r}: position changed')
        kb, kn = set(Mb[r]) , set(Mn[r])
        ok(kb == kn or (r in ('WC57', 'WC59') and kn - kb == {'footprint1023'}), f'{r}: keys changed {kn ^ kb}')
    print(f'1. MASTER_LOC: {len(Mb)} references, every pt and ll unchanged')

    TAG = re.compile(r'<script id="shapes926-data" data-sha256="([a-f0-9]{64})">const MASTER_SHAPES926_DATA = ')
    tb, tn = TAG.search(base), TAG.search(new)
    db, dn = brace(base, tb.end()), brace(new, tn.end())
    ok(hashlib.sha256(dn.encode()).hexdigest() == tn.group(1), 'data-sha256 does not hash the new data')
    Sb, Sn = json.loads(db), json.loads(dn)
    changed = [r for r in Sb['shapes'] if json.dumps(Sb['shapes'][r], sort_keys=True) != json.dumps(Sn['shapes'][r], sort_keys=True)]
    ok(sorted(changed) == ['WC57', 'WC59'], f'footprints changed: {changed}')
    ok(all(json.dumps(Sb[k], sort_keys=True) == json.dumps(Sn[k], sort_keys=True) for k in Sb if k != 'shapes'), 'a non-shape field of the block changed')
    n57, n59 = Sn['shapes']['WC57'], Sn['shapes']['WC59']
    ok(len(n57['c']) == 2 and len(n59['c']) == 7, f'part counts WC57 {len(n57["c"])}, WC59 {len(n59["c"])}')
    ok(metres(n57['k'], Mn['WC57']['pt']) < 0.5 and metres(n59['k'], Mn['WC59']['pt']) < 0.5, 'anchors not on their own positions')
    ok(all('dup' not in c and 'mc' not in c for c in n57['c'] + n59['c']), 'duplicate flags left on the parts')
    cen = lambda parts: [sum(c['c'][0] for c in parts) / len(parts), sum(c['c'][1] for c in parts) / len(parts)]
    ok(metres(cen(n57['c']), Mn['WC57']['pt']) < 3 and metres(cen(n59['c']), Mn['WC59']['pt']) < 3, 'part centres not where the master positions say')
    # the parts themselves are the base's own geometry, not redrawn
    base_polys = {json.dumps(c['p']) for r in ('WC57', 'WC59') for c in Sb['shapes'][r]['c']}
    ok(all(json.dumps(c['p']) in base_polys for c in n57['c'] + n59['c']), 'a polygon was invented')
    print(f'2-4. footprints: only WC57 (now {len(n57["c"])} parts, anchor {metres(n57["k"], Mn["WC57"]["pt"]):.2f} m from its position) and WC59 '
          f'(now {len(n59["c"])} parts, {metres(n59["k"], Mn["WC59"]["pt"]):.2f} m) changed; block re-hashed {tb.group(1)[:8]} -> {tn.group(1)[:8]}')

    for anchor in ('const DETAILS1002 = ', 'const MASTER_LAYERS = '):
        ok(grab(base, anchor) == grab(new, anchor) if anchor.endswith('= ') and new[new.index(anchor) + len(anchor)] == '{' else True, anchor + ' changed')
    i = base.index('const MASTER_LAYERS = '); j = base.index('];', i)
    ok(base[i:j] == new[new.index('const MASTER_LAYERS = '):new.index('];', new.index('const MASTER_LAYERS = '))], 'MASTER_LAYERS changed')
    g = re.compile(r"target\.ll\.lat - (-?\d+\.\d+)\) > 0\.0000001 \|\|\s*Math\.abs\(target\.ll\.lon - (-?\d+\.\d+)\)")
    ok(g.search(base).groups() == g.search(new).groups(), 'GN13 guard changed')
    ok("+ ' · v10.23'" in new and "+ ' · v10.23'" not in base, 'footer not v10.23')
    print('5. DETAILS1002, MASTER_LAYERS and the GN13 guard unchanged; footer v10.23')

    # 6. everything else byte for byte
    def strip(s):
        t = TAG.search(s); d = brace(s, t.end())
        s = s[:t.start()] + '<SHAPES>' + s[t.end() + len(d):]
        s = re.sub(r'"footprint1023":"[^"]*",', '', s)
        return re.sub(r"\+ ' · v10\.2[0-9]'", "+ ' · vX'", s)
    ok(strip(base) == strip(new), 'the page differs outside the shapes block, the two provenance keys and the footer')
    print('6. outside the shapes block, the two provenance notes and the footer: byte for byte the base')

    if fails:
        print('FAIL'); [print('  -', f) for f in fails]; sys.exit(1)
    print('PASS test_patch1023')


if __name__ == '__main__':
    main()
