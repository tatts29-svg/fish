#!/usr/bin/env python3
"""v6.21 - THE BANNER'S PROPORTIONS (26 Sep 2026). Andrew Fisher, of v6.20 against his mock-ups: "Yours does not look good."
What was wrong: the map was a short letterboxed strip, the car and wordmark a small corner, the whole thing cramped. Now, on
a laptop: the left column stacks the wordmark (twice the size), the car (twice the size, its reflection and light streaks
with it) and the search as a wide pill with Tools beside it; the map keeps its own aspect so it fills its panel edge to
edge, taller, with a bigger caption and north mark; the pins carry a larger dot. On a phone the map keeps its aspect too,
so there are no dark bars. The fold stays for anyone who wants the room back.

  python3 patch_v621.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

OLD_END = """@media print{ .hzmap{display:none} }
</style></head>"""
NEW_END = """@media print{ .hzmap{display:none} }
/* ================================================================================================================
   v6.21 - THE BANNER'S PROPORTIONS (Andrew Fisher, 26 Sep 2026: "Yours does not look good"). The left column stacks the
   wordmark, the car and the search; the map fills its panel at its own aspect; everything a size up.
   ================================================================================================================ */
@media (min-width:641px){
  .brandrow{grid-template-columns:minmax(0,auto) minmax(0,auto) minmax(0,1fr);grid-template-areas:"lock lock map" "search tools map" "cluster cluster cluster";column-gap:22px;row-gap:10px;padding:14px 16px 14px 16px;align-items:end}
  .lockup{flex-direction:column;align-items:flex-start;gap:4px;align-self:start}
  .lockup .mark{order:0} .brandtxt{order:1} .hzcar{order:2}
  #bOrg{font-size:12px;letter-spacing:.3em}
  .wordmark{margin-top:5px;gap:12px} .wordmark .gc{font-size:44px} .wordmark .yr{font-size:22px;letter-spacing:.06em} .wordmark .when{font-size:12px;letter-spacing:.14em;text-transform:uppercase}
  .hzcar{width:400px;height:176px;margin:2px 0 0 -8px}
  .hzcarimg{width:428px;top:-6px} .hzcarref{top:128px;width:428px}
  .hzcar::before{left:-60px;top:62px;width:480px} .hzcar::after{top:96px;width:380px;left:-90px}
  .search{min-width:320px;max-width:560px;align-self:center} .search input{height:48px;border-radius:26px;padding-left:44px;font-size:14px;background:linear-gradient(180deg,rgba(6,4,3,.86),rgba(6,4,3,.74)) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9bfb4' stroke-width='2.2' stroke-linecap='round'><circle cx='11' cy='11' r='7'/><path d='M20 20l-3.6-3.6'/></svg>") 15px 50%/18px 18px no-repeat}
  .tools{align-self:center}
  .hzmap{aspect-ratio:4760/1989;max-height:none;height:auto;border-radius:16px;min-width:0;max-width:100%;justify-self:stretch}
  .hzmapcap{left:16px;top:13px;font-size:11px;letter-spacing:.24em} .hzmapcap span{font-size:12.5px;margin-top:5px}
  .hznorth{width:32px;height:32px;right:16px;top:12px} .hznorthl{right:52px;top:19px;font-size:13px}
  .hzmapfold{right:14px;bottom:12px;padding:6px 11px;font-size:10.5px}
  .hzpin .rplate{font-size:11.5px} .hzpin .dot{width:12px;height:12px} .hzpin .stem{height:9px}
}
@media (min-width:641px) and (max-width:1180px){ .wordmark .gc{font-size:36px} .hzcar{width:330px;height:146px} .hzcarimg,.hzcarref{width:352px} .hzcarref{top:104px} .search{min-width:240px} }
@media (max-width:640px){ .hzmap{height:auto;aspect-ratio:4760/1989} }
</style></head>"""

OLD_FOLD = """fold.textContent = f ? 'Map' : 'Fold';"""
NEW_FOLD = """fold.textContent = f ? 'Show the map' : 'Fold the map';"""
OLD_FOLD_BTN = """<button type="button" class="hzmapfold" id="hzmapFold" aria-expanded="true" title="Fold the map away, or open it again">Fold</button>"""
NEW_FOLD_BTN = """<button type="button" class="hzmapfold" id="hzmapFold" aria-expanded="true" title="Fold the map away, or open it again">Fold the map</button>"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_END, NEW_END, 'style end'); t = rep(t, OLD_FOLD, NEW_FOLD, 'fold label'); t = rep(t, OLD_FOLD_BTN, NEW_FOLD_BTN, 'fold button')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
