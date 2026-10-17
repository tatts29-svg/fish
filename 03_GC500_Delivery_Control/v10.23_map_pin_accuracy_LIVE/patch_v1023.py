"""Author: Andrew Fisher. Map pin accuracy review, v10.23: a data-only patch for the one defect the repo's own sources
can settle. The master-plan footprints of WC57 and WC59 (MASTER_SHAPES926_DATA) are swapped against the master-plan
positions the page navigates to (MASTER_LOC) and the register: WC57 is the 2 toilets inside the SUPPLY fence
(register 2, the 14 Oct Event Portables arrival record 2), WC59 is the long row of 7 (register 7). The footprint
tracer of v9.26 had drawn the 7-toilet row under WC57 (five of them flagged "drawn as WC59", medium confidence) and
the pair under WC59. This patch gives each reference its own outline and anchor; no position, lat/lon, navigation
destination, QR, card text, quantity, rate or charge changes anywhere else, and no other footprint moves.

    python3 patch_v1023.py path/to/page.html

Guards, as AGENTS.md asks: refuses a page that is not the v10.21/v10.22 line (gate6Revision1021 must be present) and
refuses a repeat (the WC57 anchor already on WC57's own position). The footer goes v10.22 -> v10.23, so this patch
is applied after patch_v1022.py; with --footer-from v10.21 it applies straight onto live v10.21.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SHEET = (2384.0, 1684.0)
M_PER_PT = 0.705556
TAG = re.compile(r'<script id="shapes926-data" data-sha256="([a-f0-9]{64})">const MASTER_SHAPES926_DATA = ')


def brace(s, i):
    d = 0; j = i
    while True:
        c = s[j]
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: return j + 1
        elif c == '"':
            j += 1
            while s[j] != '"':
                if s[j] == '\\': j += 1
                j += 1
        j += 1


def compact(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    footer_from = a[a.index('--footer-from') + 1] if '--footer-from' in a else 'v10.22'
    if 'function gate6Revision1021(ref) {' not in html:
        sys.exit('patch_v1023: this is not the v10.21 line (gate6Revision1021 missing) - wrong base')

    # ---- the master positions the page navigates to
    i = html.index('const MASTER_LOC = ') + len('const MASTER_LOC = ')
    M = json.loads(html[i:brace(html, i)])
    pt57, pt59 = M['WC57']['pt'], M['WC59']['pt']
    assert 'the 2 toilets drawn inside the SUPPLY fence' in M['WC57']['how'], 'WC57 is no longer described as the pair inside the SUPPLY fence'
    assert 'the 7 toilets drawn on the master' in M['WC59']['how'], 'WC59 is no longer described as the row of 7'

    # ---- the footprint block, hashed by its data text (the way v9.26 wrote it and v10.20 re-hashed it)
    tag = TAG.search(html)
    if not tag: sys.exit('shapes926-data block not found')
    data_start = tag.end(); data_end = brace(html, data_start)
    data = html[data_start:data_end]
    if hashlib.sha256(data.encode('utf-8')).hexdigest() != tag.group(1):
        sys.exit('shapes926-data: the data-sha256 attribute does not hash the live data - stopping')
    SH = json.loads(data)
    r57, r59 = SH['shapes']['WC57'], SH['shapes']['WC59']

    def m(k, pt): return ((k[0] - pt[0]) ** 2 * SHEET[0] ** 2 + (k[1] - pt[1]) ** 2 * SHEET[1] ** 2) ** 0.5 * M_PER_PT
    if m(r57['k'], pt57) < 1.0 and m(r59['k'], pt59) < 1.0:
        sys.exit('patch_v1023 refuses a repeat: WC57 and WC59 footprints already sit on their own positions')
    if not (m(r57['k'], pt59) < 1.0 and m(r59['k'], pt57) < 1.0):
        sys.exit('patch_v1023: the footprints are not the swap this patch corrects (WC57 anchor %.1f m from WC59, WC59 anchor %.1f m from WC57) - stopping'
                 % (m(r57['k'], pt59), m(r59['k'], pt57)))

    # the row of 7 is the record under WC57 (two of its parts unflagged, five flagged "drawn as WC59"); the pair inside
    # the SUPPLY fence is the two unflagged parts of the record under WC59 (its other five are the row again, 'mc' medium)
    row7 = [dict(c) for c in r57['c']]
    pair = [dict(c) for c in r59['c'] if 'mc' not in c and 'dup' not in c]
    if len(row7) != 7 or len(pair) != 2:
        sys.exit(f'patch_v1023: unexpected part counts (row {len(row7)}, pair {len(pair)}) - stopping')
    for c in row7: c.pop('dup', None); c.pop('mc', None)
    # the pair sits at WC57's position, the row at WC59's: prove it before writing anything
    def centre(parts): return [sum(c['c'][0] for c in parts) / len(parts), sum(c['c'][1] for c in parts) / len(parts)]
    if m(centre(pair), pt57) > 3.0 or m(centre(row7), pt59) > 3.0:
        sys.exit('patch_v1023: the parts do not sit where the master positions say - stopping')
    new57 = dict(r57); new57['c'] = pair; new57['k'] = [round(pt57[0], 7), round(pt57[1], 7)]
    new59 = dict(r59); new59['c'] = row7; new59['k'] = [round(pt59[0], 7), round(pt59[1], 7)]

    old57, old59 = '"WC57":' + compact(r57), '"WC59":' + compact(r59)
    for old in (old57, old59):
        if data.count(old) != 1: sys.exit('patch_v1023: the record text does not round-trip exactly once - stopping')
    new_data = data.replace(old57, '"WC57":' + compact(new57)).replace(old59, '"WC59":' + compact(new59))
    assert json.loads(new_data)['shapes']['WC57']['k'] == new57['k']
    # everything else in the block is byte for byte what it was
    SH2 = json.loads(new_data)
    for ref in SH['shapes']:
        if ref not in ('WC57', 'WC59'): assert compact(SH['shapes'][ref]) == compact(SH2['shapes'][ref]), ref
    new_attr = hashlib.sha256(new_data.encode('utf-8')).hexdigest()
    html = html[:tag.start()] + f'<script id="shapes926-data" data-sha256="{new_attr}">const MASTER_SHAPES926_DATA = ' + new_data + html[data_end:]

    # ---- a one-line provenance note on the two cards, through the existing masterWords source text
    html = rep(html, '"WC57":{"ll":[', '"WC57":{"footprint1023":"footprint and anchor corrected 15 Oct 2026 (v10.23): the pair inside the SUPPLY fence, not the row of 7","ll":[', 'WC57 provenance', page)
    html = rep(html, '"WC59":{"ll":[', '"WC59":{"footprint1023":"footprint and anchor corrected 15 Oct 2026 (v10.23): the row of 7, not the pair","ll":[', 'WC59 provenance', page)

    html = rep(html, "+ ' · %s'" % footer_from, "+ ' · v10.23'", 'Release footer', page)
    page.write_text(html, encoding='utf-8')
    print(f'patch_v1023 applied: WC57 footprint -> the pair at pt {pt57}, WC59 footprint -> the row of 7 at pt {pt59}; '
          f'shapes926-data sha256 {tag.group(1)[:12]} -> {new_attr[:12]}; footer {footer_from} -> v10.23')


if __name__ == '__main__':
    main()
