#!/usr/bin/env python3
"""v6.25 - THE PIT WALL (Andrew Fisher, 26 Sep 2026, with a photo of the page on his tablet: "No mate it looks terrible").
What the photo showed: the four pods huddled at the right of their row with an empty stretch beside them. The row is now a
full-width pit-wall strip: the clock, the race day, the record and the day at equal width across the whole banner, the
day pod's three figures spread across its share, the shift lights along the top. The top row is unchanged. CSS only.

  python3 patch_v625.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None
def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]
OLD_END = """@media (min-height:601px) and (max-height:760px){ main{min-height:40vh} }
</style></head>"""
NEW_END = """@media (min-height:601px) and (max-height:760px){ main{min-height:40vh} }
/* v6.25 - the pit wall: on a laptop or tablet the pods span the whole banner at equal width, nothing left empty */
@media (min-width:641px){
  .hzcluster{flex:1 1 100%;max-width:100%;margin-left:0;justify-content:stretch;gap:10px;flex-wrap:nowrap;padding:14px 12px 10px}
  .tpodwrap,.hzpod,.recstrip,.hzpod.hztd{flex:1 1 0;min-width:0}
  .tpcard > .face{display:block} .tphead{width:100%}
  .recstrip{align-items:flex-start}
  .hzpod.hztd{flex:1.35 1 0;flex-direction:column;align-items:stretch}
  .hztd .tdday{justify-content:flex-start}
  .hztd .tdrow{display:flex;gap:6px;margin-top:6px} .hztd .tdf{flex:1 1 0;min-width:0;align-items:flex-start}
  .hztd .tdf .tl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
  .hzshift{left:14px;right:14px}
}
@media (min-width:641px) and (max-width:1180px){ .hzcluster{flex-wrap:wrap} .tpodwrap,.hzpod,.recstrip{flex:1 1 30%} .hzpod.hztd{flex:1 1 100%} }
</style></head>"""
for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_END, NEW_END, 'style end')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
