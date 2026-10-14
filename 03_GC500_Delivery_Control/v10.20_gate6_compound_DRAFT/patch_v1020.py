"""Author: Andrew Fisher. Gate 6 compound moved as John Brett (iEDM) drew it on 14 Oct 2026: the pins, footprints,
card text and master-plan pictures of P60, P62, P63 and WC49, the GN06 pin and footprint, and WC49's driver destination.
Data only. Applies to the exact live v10.18 page, or to the v10.19 candidate built from it (patch_v1019 first)."""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASES = {
    '2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d': 'live v10.18',
    'c7e698c9c4e42f3d00088383e4bb032e5ccfd296907900ec888a8f1440e07679': 'v10.19 candidate (patch_v1019 on live v10.18)',
}
POS = json.loads((HERE / 'gate6_positions_1020.json').read_text())
MEDIA = json.loads((HERE / 'media' / 'index.json').read_text())
REFS = ['P60', 'P62', 'P63', 'WC49', 'GN06']
PICTURED = ['P60', 'P62', 'P63', 'WC49']
MEDIA_ANCHOR = '/* Hosted media: resolve references before any existing consumer sees DATA. */'
TABLE_ANCHOR = " const font=document.createElement('style');"
OLD_WC49_DESTINATION = '  "destination": "The Esplanade · Gate 5 ticket box / QFES office · P60/P62",'
OLD_WC49_COORDINATES = '  "coordinates": "-27.993976, 153.430676",'


def bracket_end(s, i):
    depth = 0; q = None; esc = False
    for j in range(i, len(s)):
        ch = s[j]
        if q:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == q: q = None
        else:
            if ch == '"': q = ch
            elif ch in '{[': depth += 1
            elif ch in '}]':
                depth -= 1
                if depth == 0: return j + 1
    raise ValueError('unbalanced JSON')


def compact(obj):
    return json.dumps(obj, separators=(',', ':'), ensure_ascii=True)


def one(html, needle, what):
    n = html.count(needle)
    if n != 1:
        sys.exit(f'{what}: expected once, found {n}: {needle[:80]!r}')
    return html.index(needle)


def new_master_loc(ref, old):
    """The MASTER_LOC entry with its keys in the live order: ll, how, near, beside, prec, img, pt."""
    p = POS['refs'][ref]
    out = {'ll': p['new']['ll'], 'how': p['text']['how'], 'near': p['text']['near'], 'beside': p['text']['beside'], 'prec': old['prec']}
    if ref in PICTURED:
        out['img'] = [MEDIA[ref]['close']['sha256'], MEDIA[ref]['wide']['sha256']]
    elif 'img' in old:
        out['img'] = old['img']
    out['pt'] = p['new']['pt']
    for k in old:
        if k not in out:
            sys.exit(f'MASTER_LOC {ref}: unexpected key {k}')
    return out


def media_override():
    rows = []
    for ref in PICTURED:
        for kind in ('close', 'wide'):
            m = MEDIA[ref][kind]
            data = (HERE / 'media' / m['file']).read_bytes()
            if hashlib.sha256(data).hexdigest() != m['sha256']:
                sys.exit(f'media {m["file"]}: sha256 does not match media/index.json')
            rows.append(f'"{m["sha256"]}":"data:image/webp;base64,{base64.b64encode(data).decode()}"')
    return ('/* Author: Andrew Fisher. Master-plan pictures for the Gate 6 compound as drawn on 14 Oct 2026 (iEDM); the master\n'
            '   itself has not been reissued, so these are carried in the page until they join the hosted media. */\n'
            'const MASTER_IMG1020 = {' + ','.join(rows) + '};\n')


def apply(html):
    sha = hashlib.sha256(html.encode()).hexdigest()
    if sha not in BASES:
        raise ValueError('Requires the exact live v10.18 page or the v10.19 candidate; refuses a repeat or a wrong base')
    # 1. MASTER_LOC pins and card text
    for ref in REFS:
        start = one(html, f'"{ref}":{{"ll":[', f'MASTER_LOC {ref}')
        end = bracket_end(html, start + len(ref) + 3)
        old = json.loads(html[start + len(ref) + 3:end])
        if old['pt'] != POS['refs'][ref]['old']['pt'] or old['ll'] != POS['refs'][ref]['old']['ll']:
            sys.exit(f'MASTER_LOC {ref}: the live pin is not the one the positions were computed from')
        html = html[:start] + f'"{ref}":' + compact(new_master_loc(ref, old)) + html[end:]
    # 2. MASTER_SHAPES926 footprints, then the data attribute that hashes that script's data
    tag = re.search(r'<script id="shapes926-data" data-sha256="([a-f0-9]{64})">const MASTER_SHAPES926_DATA = ', html)
    if not tag:
        sys.exit('shapes926-data script tag not found')
    data_start = tag.end()
    data_end = html.index('};</script>', data_start) + 1
    data = html[data_start:data_end]
    if hashlib.sha256(data.encode('utf-8')).hexdigest() != tag.group(1):
        sys.exit('shapes926-data: the data-sha256 attribute does not hash the live data')
    shapes_at = data.index('"shapes":{')
    for ref in REFS:
        needle = f'"{ref}":{{"c":[{{"k":"'
        n = data.count(needle, shapes_at)
        if n != 1:
            sys.exit(f'shapes {ref}: expected once in "shapes", found {n}')
        start = data.index(needle, shapes_at); end = bracket_end(data, start + len(ref) + 3)
        old = json.loads(data[start + len(ref) + 3:end])
        if old['k'] != POS['refs'][ref]['old']['shape_centre_pt']:
            sys.exit(f'shapes {ref}: the live footprint is not the one the positions were computed from')
        data = data[:start] + f'"{ref}":' + compact(POS['refs'][ref]['shape']) + data[end:]
    new_attr = hashlib.sha256(data.encode('utf-8')).hexdigest()
    html = html[:tag.start()] + f'<script id="shapes926-data" data-sha256="{new_attr}">const MASTER_SHAPES926_DATA = ' + data + html[data_end:]
    # 3. WC49's driver destination (DETAILS1002)
    d = POS['details1002_WC49']
    html = rep(html, OLD_WC49_DESTINATION, f'  "destination": "{d["destination"]}",', 'WC49 destination', 'v10.20')
    html = rep(html, OLD_WC49_COORDINATES, f'  "coordinates": "{d["coordinates"]}",', 'WC49 destination coordinates', 'v10.20')
    # 4. the pictures, resolved after the hosted media table is built
    html = rep(html, MEDIA_ANCHOR, media_override() + MEDIA_ANCHOR, 'master-plan pictures for the moved references', 'v10.20')
    html = rep(html, TABLE_ANCHOR,
               " if(typeof MASTER_IMG1020==='object'&&MASTER_IMG1020)for(const key of Object.keys(MASTER_IMG1020))table[key]=MASTER_IMG1020[key];\n" + TABLE_ANCHOR,
               'media table carries the v10.20 pictures', 'v10.20')
    # 5. footer
    footer_from = "+ ' · v10.19'" if html.count("+ ' · v10.19'") == 1 else "+ ' · v10.18'"
    html = rep(html, footer_from, "+ ' · v10.20'", 'Release footer', 'v10.20')
    return html


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
