#!/usr/bin/env python3
"""v6.28 - GC500 IN WHITE (Andrew Fisher, 26 Sep 2026: "Make sure the gc500 is white"). The wordmark's GC500 was filled
with a brushed-silver gradient (v5.87); it is solid white now, with the same drop shadow, at every size. CSS only.

  python3 patch_v628.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None
def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]
OLD_END = """  .lockup{padding:6px 0 2px 4px} #bOrg{display:block;font-size:10px;letter-spacing:.26em;margin-bottom:2px} .wordmark .gc{font-size:30px} .wordmark .yr{font-size:15px} .wordmark .chq{display:inline-block;transform:scale(1.1);transform-origin:left center}
}
</style></head>"""
NEW_END = """  .lockup{padding:6px 0 2px 4px} #bOrg{display:block;font-size:10px;letter-spacing:.26em;margin-bottom:2px} .wordmark .gc{font-size:30px} .wordmark .yr{font-size:15px} .wordmark .chq{display:inline-block;transform:scale(1.1);transform-origin:left center}
}
/* v6.28 - GC500 in white, not brushed silver (Andrew Fisher, 26 Sep 2026) */
.wordmark .gc{background:none;-webkit-background-clip:initial;background-clip:initial;-webkit-text-fill-color:#fff;color:#fff;text-shadow:0 2px 3px rgba(0,0,0,.85),0 0 16px rgba(0,0,0,.6)}
</style></head>"""
for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_END, NEW_END, 'style end')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
