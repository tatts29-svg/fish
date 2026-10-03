#!/usr/bin/env python3
"""v6.22 - THE MAP COMES OUT OF THE BANNER (Andrew Fisher, 26 Sep 2026: "No remove the map I think"). The banner keeps
v6.21's proportions - the wordmark and the car a size up, the search as a pill with Tools beside it - and lays out as his
first mock-up did without the map: the lockup on the left, the three pods beside it, the day row under the pods. The map
panel stays in the markup, hidden, its pins never drawn, so nothing else changes; the map itself stays hosted for the Today
page if it is wanted there later.

  python3 patch_v622.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

OLD_END = """@media (max-width:640px){ .hzmap{height:auto;aspect-ratio:4760/1989} }
</style></head>"""
NEW_END = """@media (max-width:640px){ .hzmap{height:auto;aspect-ratio:4760/1989} }
/* v6.22 - the map out of the banner (Andrew Fisher, 26 Sep 2026); the lockup left, the three pods beside it, the day row under them */
.hzmap{display:none!important}
@media (min-width:641px){
  .brandrow{grid-template-columns:minmax(0,auto) minmax(0,auto) minmax(0,1fr);grid-template-areas:"lock lock cluster" "search tools cluster";align-items:center}
  .lockup{align-self:center} .search{min-width:380px;max-width:560px}
  .hzcluster{grid-area:cluster;justify-self:end;align-self:center;margin-left:0;max-width:min(100%,700px);flex-wrap:wrap;justify-content:flex-end;row-gap:8px}
  .hzpod.hztd{flex:1 1 100%;order:9}
}
@media (min-width:641px) and (max-width:1180px){
  .brandrow{grid-template-areas:"lock lock" "search tools" "cluster cluster";grid-template-columns:minmax(0,auto) minmax(0,1fr)}
  .hzcluster{justify-self:stretch;max-width:100%;justify-content:flex-end}
}
</style></head>"""
OLD_INIT = """  const box = $('#hzmap'), M = DATA.hzmap; if (!box || HZMAP.init) return; HZMAP.init = true;"""
NEW_INIT = """  const box = $('#hzmap'), M = DATA.hzmap; if (!box || HZMAP.init) return; HZMAP.init = true;
  if (getComputedStyle(box).display === 'none') { box.hidden = true; return; }   /* v6.22 - the map is out of the banner; nothing is fetched or drawn */"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_END, NEW_END, 'style end'); t = rep(t, OLD_INIT, NEW_INIT, 'map init')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
