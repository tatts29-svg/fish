#!/usr/bin/env python3
"""v7.02 (plate part) - THE EDIT TILE ON THE TIMELINE'S DAY PLATE.

Kept apart from patch_v702.py on purpose: the "Day documents" plate belongs to v7.06 (and v7.07 after it), so the
plate's share of v7.02 is ONE rep() here plus its own CSS, and can be put back on top of a rebuilt plate as it stands.
The tile itself is dpEditTile(d), defined by patch_v702.py in the plate's own compact .dpt markup (icon, "Edit",
"Change deliveries"); it opens #change/<iso> through a click listener on the document ([data-chday]), so nothing of
the plate's wiring is touched. A view-only link keeps the tile: the page it opens shows everything and changes nothing.

ANCHOR: the end of dpPlate()'s return - ${dpEditTile(d)} goes in just before </section>, after the Email tile.
CSS: with Edit present the desk grid is auto + 5 equal tiles; on a phone (two columns) Edit runs across both, one slim
row. The CSS keys on :has(> .dpt-edit), so the plate's own rules are not edited.

  python3 patch_v702_plate.py <page.html>     (after patch_v702.py; patch_v702.py also calls apply() itself)"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

CSS = """
/* v7.02 - the Edit tile on the day plate: a fifth tile on a desk, one slim row across both columns on a phone */
.dplate:has(> .dpt-edit){grid-template-columns:auto repeat(5,minmax(0,1fr))}
@media (max-width:760px){
 .dplate:has(> .dpt-edit){grid-template-columns:repeat(2,minmax(0,1fr))}
 .dplate > .dpt-edit{grid-column:1 / -1;min-height:44px;padding-top:6px;padding-bottom:6px}
 .dplate > .dpt-edit .dpt-i{width:26px;height:26px}
}
"""


def apply(t, path, need=True):
    # ---- v7.02 PLATE HOOK: the one and only change to dpPlate() (dpEditTile is in patch_v702.py) ----
    i = t.find('function dpPlate(days, sel){')
    if i < 0: sys.exit('dpPlate not found in ' + os.path.basename(path))
    j = t.find('\n}', i)
    body = t[i:j]
    ms = list(re.finditer(r'</section>`;', body))
    if len(ms) != 1: sys.exit(f"plate edit tile (v7.02): expected one </section>` in dpPlate's return, found {len(ms)}")
    k = i + ms[0].start()
    t = t[:k] + '${dpEditTile(d)}' + t[k:]   # v7.02 - Edit: Change deliveries on this day, after Email
    s = t.find('</style>'); return t[:s] + CSS + t[s:]


if __name__ == '__main__':
    p = sys.argv[1]
    t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
    if 'function dpEditTile(' not in t: sys.exit('apply patch_v702.py first (dpEditTile)')
    if '${dpEditTile(d)}' in t: sys.exit('the plate Edit tile is already in')
    t = apply(t, p, True)
    open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(p))
