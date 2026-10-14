"""Author: Andrew Fisher. Checks for the v10.20 Gate 6 compound patch, read-only.

    python3 tests/test_patch1020.py <live v10.18 page> [<v10.19 candidate>]

Applies the patch in memory to each base and checks: a wrong base and a repeat are refused; every pin, footprint,
card text, driver destination and picture is exactly what gate6_positions_1020.json and media/index.json say;
the shapes data attribute hashes the new data; nothing else in the page changed; the footer reads v10.20.
"""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
import patch_v1020 as P

POS = json.loads((HERE / 'gate6_positions_1020.json').read_text())
MEDIA = json.loads((HERE / 'media' / 'index.json').read_text())
results = []


def check(name, ok, detail=''):
    results.append((name, bool(ok), detail))
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {detail}' if detail and not ok else ''))


def master_loc(html, ref):
    i = html.index(f'"{ref}":{{"ll":['); j = P.bracket_end(html, i + len(ref) + 3)
    return json.loads(html[i + len(ref) + 3:j])


def shapes_data(html):
    m = re.search(r'<script id="shapes926-data" data-sha256="([a-f0-9]{64})">const MASTER_SHAPES926_DATA = ', html)
    start = m.end(); end = html.index('};</script>', start) + 1
    return m.group(1), html[start:end]


def run(base_path, label):
    html = Path(base_path).read_text()
    sha = hashlib.sha256(html.encode()).hexdigest()
    check(f'{label}: base is one the patch accepts', sha in P.BASES, sha)
    out = P.apply(html)
    # refusals
    try:
        P.apply(out); check(f'{label}: a repeat is refused', False)
    except ValueError:
        check(f'{label}: a repeat is refused', True)
    try:
        P.apply(html + '\n'); check(f'{label}: a wrong base is refused', False)
    except ValueError:
        check(f'{label}: a wrong base is refused', True)
    # pins and card text
    for ref in P.REFS:
        got = master_loc(out, ref); want = POS['refs'][ref]
        check(f'{label}: MASTER_LOC {ref} pin', got['pt'] == want['new']['pt'] and got['ll'] == want['new']['ll'], json.dumps(got))
        check(f'{label}: MASTER_LOC {ref} card text', got['how'] == want['text']['how'] and got['beside'] == want['text']['beside'] and got['near'] == want['text']['near'])
        check(f'{label}: MASTER_LOC {ref} keeps prec', got['prec'] == master_loc(html, ref)['prec'])
        if ref in P.PICTURED:
            check(f'{label}: MASTER_LOC {ref} pictures', got['img'] == [MEDIA[ref]['close']['sha256'], MEDIA[ref]['wide']['sha256']])
        old_near = master_loc(html, ref).get('near')
        if old_near:
            check(f'{label}: MASTER_LOC {ref} distance to Gate 6 changed with the move', got['near'] != old_near or ref == 'P63')
    # the moved pins are inside the new fence
    f = POS['fence']
    for ref in P.REFS:
        x, y = POS['refs'][ref]['new']['sheet_pt']
        check(f'{label}: {ref} sits inside the new compound fence', f['north_x'] <= x <= f['south_x'] and min(f['east_y']) - 1 <= y <= max(f['west_y']) + 1, f'{x},{y}')
    # footprints
    attr, data = shapes_data(out)
    check(f'{label}: shapes data-sha256 hashes the new data', hashlib.sha256(data.encode('utf-8')).hexdigest() == attr)
    D = json.loads(data)
    for ref in P.REFS:
        got = D['shapes'][ref]; want = POS['refs'][ref]['shape']
        check(f'{label}: footprint {ref} moved rigidly', got == want)
        old = json.loads(shapes_data(html)[1])['shapes'][ref]
        dz = all(a['z'] == b['z'] and a['a'] == b['a'] for a, b in zip(old['c'], got['c']))
        check(f'{label}: footprint {ref} keeps its size and angle', dz)
        doors = [(a.get('f'), a.get('o')) for it in old['c'] for a in it.get('d', [])]
        ndoors = [(a.get('f'), a.get('o')) for it in got['c'] for a in it.get('d', [])]
        check(f'{label}: footprint {ref} keeps its door side', doors == ndoors)
        cx = sum(p[0] for it in got['c'] for p in it['p']) / sum(len(it['p']) for it in got['c'])
        check(f'{label}: footprint {ref} centre matches its pin within 1 m', abs(cx * 2384 - POS['refs'][ref]['new']['sheet_pt'][0]) * 0.705556 < 1.0 or ref == 'WC49')
    other = [k for k in D['shapes'] if k not in P.REFS]
    oldD = json.loads(shapes_data(html)[1])
    check(f'{label}: every other footprint unchanged', all(D['shapes'][k] == oldD['shapes'][k] for k in other) and len(D['shapes']) == len(oldD['shapes']))
    # destination
    check(f'{label}: WC49 driver destination', f'"destination": "{POS["details1002_WC49"]["destination"]}"' in out and f'"coordinates": "{POS["details1002_WC49"]["coordinates"]}"' in out)
    check(f'{label}: old WC49 destination gone', P.OLD_WC49_DESTINATION not in out and P.OLD_WC49_COORDINATES not in out)
    # pictures
    m = re.search(r'const MASTER_IMG1020 = (\{.*?\});\n', out)
    table = json.loads(m.group(1)) if m else {}
    check(f'{label}: picture table has 8 entries', len(table) == 8)
    for key, uri in table.items():
        raw = base64.b64decode(uri.split(',', 1)[1])
        check(f'{label}: picture {key[:12]} hashes to its key and is a WebP', hashlib.sha256(raw).hexdigest() == key and raw[:4] == b'RIFF' and raw[8:12] == b'WEBP')
    check(f'{label}: media table merge present once', out.count("table[key]=MASTER_IMG1020[key]") == 1)
    # footer and nothing else
    check(f'{label}: footer v10.20', out.count("+ ' · v10.20'") == 1 and "+ ' · v10.18'" not in out and "+ ' · v10.19'" not in out)
    # everything outside the known edits is unchanged: strip the edited regions from both and compare
    def strip(h):
        h = re.sub(r'/\* Author: Andrew Fisher\. Master-plan pictures for the Gate 6 compound[^\n]*\n[^\n]*\*/\nconst MASTER_IMG1020 = \{.*?\};\n', '', h)
        h = h.replace(" if(typeof MASTER_IMG1020==='object'&&MASTER_IMG1020)for(const key of Object.keys(MASTER_IMG1020))table[key]=MASTER_IMG1020[key];\n", '')
        for ref in P.REFS:
            i = h.index(f'"{ref}":{{"ll":['); j = P.bracket_end(h, i + len(ref) + 3); h = h[:i] + h[j:]
        a, d = shapes_data(h); h = h.replace(a, 'X' * 64).replace(d, '')
        h = re.sub(r'  "destination": "[^"]*",\n  "sourceText": "Toilets",\n  "coordinates": "-27\.99[0-9]+, 153\.43[0-9]+",', '', h, count=1)
        h = h.replace("+ ' · v10.20'", "+ ' · vX'").replace("+ ' · v10.19'", "+ ' · vX'").replace("+ ' · v10.18'", "+ ' · vX'")
        return h
    a, b = strip(html), strip(out)
    if a != b:
        k = next((i for i in range(min(len(a), len(b))) if a[i] != b[i]), min(len(a), len(b)))
        detail = f'first difference at {k}: base {a[max(0, k - 60):k + 60]!r} | patched {b[max(0, k - 60):k + 60]!r}'
    else:
        detail = ''
    check(f'{label}: nothing outside the listed edits changed', a == b, detail)
    return out


if __name__ == '__main__':
    bases = sys.argv[1:]
    for i, b in enumerate(bases):
        run(b, 'base %d (%s)' % (i + 1, Path(b).parent.name))
    bad = [r for r in results if not r[1]]
    print(f'{len(results) - len(bad)}/{len(results)} PASS')
    if bad:
        sys.exit(1)
