#!/usr/bin/env python3
"""v6.24 - THE PAGE ALWAYS HAS ROOM TO SCROLL (Andrew Fisher, 26 Sep 2026: "u have locked the scrolling"). Measured: on a
phone held sideways (844 x 390) the header stood 293 px tall and left the page 34 px - nothing could scroll. On any screen
under 600 px tall the pod cluster now folds away and the top row shrinks (a slim car, the wordmark, the search, Tools), so
the header is under 100 px and the page scrolls; under 760 px tall the pods keep their row but the page is guaranteed at
least 40 % of the screen. CSS only.

  python3 patch_v624.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None
def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]
OLD_END = """@media (min-width:641px) and (max-width:1180px){ .hzcluster{flex-wrap:wrap;margin-left:auto} .hzpod.hztd{flex:0 0 auto} }
</style></head>"""
NEW_END = """@media (min-width:641px) and (max-width:1180px){ .hzcluster{flex-wrap:wrap;margin-left:auto} .hzpod.hztd{flex:0 0 auto} }
/* v6.24 - the page always has room: a screen under 600 px tall (a phone held sideways) folds the pods away and slims the top row */
@media (max-height:600px){
  .hzcluster{display:none!important}
  .hbar{min-height:0;padding:6px 10px 6px 0}
  .hzcar{width:150px;height:64px;margin:0 0 0 -4px} .hzcarimg{width:160px;top:-2px} .hzcarref{display:none} .hzcar::before,.hzcar::after{display:none}
  #bOrg{font-size:9px} .wordmark .gc{font-size:17px} .wordmark .yr{font-size:10px} .wordmark .when{display:none}
  .search input{height:38px}
  main{min-height:45vh}
}
@media (min-height:601px) and (max-height:760px){ main{min-height:40vh} }
</style></head>"""
for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_END, NEW_END, 'style end')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
