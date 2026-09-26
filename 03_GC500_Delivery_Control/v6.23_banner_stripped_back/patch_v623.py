#!/usr/bin/env python3
"""v6.23 - THE BANNER, STRIPPED BACK (Andrew Fisher, 26 Sep 2026: "Your idea with banner does not work its to much").
Two slim rows on a laptop: the car, the wordmark, the search and Tools at their original size in the first; the clock, the
race day, the record and the day as a compact fourth pod (the date plate, the day, three small figures) in the second,
right-aligned as the pods always were. The big car, the stacked lockup and the wide plate row of v6.21/v6.22 are undone.
The phone keeps its own layout. CSS only, written after everything above so it wins.

  python3 patch_v623.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

OLD_END = """  .hzcluster{justify-self:stretch;max-width:100%;justify-content:flex-end}
}
</style></head>"""
NEW_END = """  .hzcluster{justify-self:stretch;max-width:100%;justify-content:flex-end}
}
/* ================================================================================================================
   v6.23 - STRIPPED BACK (Andrew Fisher, 26 Sep 2026: "its to much"). Two slim rows: the lockup row as it always was; one
   row of pods with the day as a compact fourth pod. Undoes the v6.21/v6.22 sizes and grid.
   ================================================================================================================ */
@media (min-width:641px){
  .brandrow{display:flex;flex-wrap:wrap;align-items:center;gap:14px;padding:12px 14px 12px 0;row-gap:8px}
  .lockup{flex-direction:row;align-items:center;gap:11px;align-self:auto;flex:0 0 auto}
  .lockup .mark,.brandtxt,.hzcar{order:0}
  #bOrg{font-size:10.5px;letter-spacing:.24em}
  .wordmark{margin-top:3px;gap:9px} .wordmark .gc{font-size:21px} .wordmark .yr{font-size:12px;letter-spacing:.1em} .wordmark .when{font-size:11px;letter-spacing:.04em;text-transform:none}
  .hzcar{width:214px;height:92px;margin:0 0 0 -6px} .hzcarimg{width:228px;top:-4px} .hzcarref{top:68px;width:228px}
  .hzcar::before{left:-40px;top:32px;width:250px} .hzcar::after{top:50px;width:200px;left:-60px}
  .search{flex:1 1 260px;min-width:0;max-width:none;align-self:auto} .search input{height:46px;border-radius:12px;padding-left:13px;font-size:inherit;background:linear-gradient(180deg,rgba(6,4,3,.82),rgba(6,4,3,.7))}
  .tools{order:4;align-self:auto}
  .hzcluster{order:5;flex:0 0 auto;margin-left:auto;max-width:100%;flex-wrap:nowrap;justify-content:flex-end;gap:10px;align-self:center;justify-self:auto}
  .hzpod.hztd{flex:0 0 auto;min-width:0;order:9;flex-direction:column;align-items:flex-start;gap:0;padding:8px 11px 9px;flex-wrap:nowrap}
  .hztd .tdday{border-right:0;padding-right:0;gap:7px;flex:0 0 auto}
  .hztd .tdday .rplate{font-size:12px} .hztd .tdw{font:700 9.5px/1.2 'Inter',var(--sans,system-ui,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:#a9b4b3;max-width:none;white-space:nowrap} .hztd .tdw b{color:#f4f7f6}
  .hztd .tdrow{gap:5px;margin-top:6px;flex:0 0 auto}
  .hztd .tdf{flex:0 0 auto;flex-direction:column;align-items:flex-start;gap:1px;padding:3px 8px 4px;min-width:52px}
  .hztd .tdf .tl{font-size:7px;letter-spacing:.14em} .hztd .tdf .tn b{font-size:20px} .hztd .tdf .tn svg{display:none} .hztd .tdf .ts{display:none}
}
@media (min-width:641px) and (max-width:1180px){ .hzcluster{flex-wrap:wrap;margin-left:auto} .hzpod.hztd{flex:0 0 auto} }
</style></head>"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_END, NEW_END, 'style end')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
