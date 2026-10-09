#!/usr/bin/env python3
"""v6.27 - THE BRAND BLOCK GETS ROOM (Andrew Fisher, 26 Sep 2026: "Give the coates industrial solutions and the gc500 2026
more space should be above the time and to race day boxes"). COATES INDUSTRIAL SOLUTIONS and GC500 2026 a size up with
air around them, sitting over the clock and race-day pods at the left of the pit wall; the search stays beside them,
vertically centred. A smaller step up on a phone. CSS only.

  python3 patch_v627.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None
def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]
OLD_END = """@media (max-width:640px){ nav.tabs .tools{padding-left:6px;padding-right:2px} .hbar{padding-right:12px} }
</style></head>"""
NEW_END = """@media (max-width:640px){ nav.tabs .tools{padding-left:6px;padding-right:2px} .hbar{padding-right:12px} }
/* v6.27 - the brand block gets room, over the clock and race-day pods (Andrew Fisher, 26 Sep 2026) */
@media (min-width:641px){
  .brandrow{padding-top:16px;row-gap:12px}
  .lockup{padding:4px 0 2px 12px;align-self:center}
  #bOrg{font-size:14px;letter-spacing:.34em;text-shadow:0 1px 2px #000,0 0 14px rgba(0,0,0,.85)}
  .wordmark{margin-top:8px;gap:12px;align-items:baseline} .wordmark .gc{font-size:42px;letter-spacing:-.02em;text-shadow:0 2px 3px rgba(0,0,0,.8),0 0 18px rgba(0,0,0,.6)} .wordmark .yr{font-size:20px;letter-spacing:.08em} .wordmark .when{font-size:12px;letter-spacing:.12em;text-transform:uppercase}
  .wordmark .chq{transform:scale(1.35);transform-origin:left center;margin-left:6px}
  .search{align-self:center;flex:1 1 300px} .navback{align-self:center}
}
@media (max-width:640px){
  .lockup{padding:6px 0 2px 4px} #bOrg{display:block;font-size:10px;letter-spacing:.26em;margin-bottom:2px} .wordmark .gc{font-size:30px} .wordmark .yr{font-size:15px} .wordmark .chq{display:inline-block;transform:scale(1.1);transform-origin:left center}
}
</style></head>"""
for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_END, NEW_END, 'style end')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
