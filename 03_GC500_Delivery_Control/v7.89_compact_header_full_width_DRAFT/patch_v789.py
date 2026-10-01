#!/usr/bin/env python3
r"""v7.89 - a compact header and the full page width. Author: Andrew Fisher.

The project manager, 2 Oct 2026, with screenshots of the desktop: "you and codex please fix asap" ... "it's like this everywhere"
... "even this" (the header) ... "let's fix this first" ... "should we not be using the full page" ... "should these not all
be the same size" (the clock, race-day and record pods).

On a laptop screen the header took 272 of 693 px - 40% of the window - on every tab, and the page under it was held to a
1,500 px column in the middle of a wide screen. On a desktop (641 px and wider; the phone bar is untouched):
  - ONE ROW: the GC500 lockup, the search, and the three pods side by side - the pods take half the header's width (the project
    manager: "make sure these get half the page"), split three equal ways. Below 1,280 px
    the pods take a second row of their own, still equal. The shift lights stay along the top of the pods.
  - SLIM WHEN YOU SCROLL: once the page under the header is scrolled, the pods fold away and only the lockup, search and tabs
    stay; back at the top they return.
  - FULL WIDTH: the tabs use the whole window (16 px either side) instead of a 1,500 px column.
Nothing else changes: the same pods, the same figures, the same tabs.

    python3 patch_v789.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.89 - compact header' in t: sys.exit('v7.89 already applied')
for need in ('.brandrow{position:relative;z-index:4}', 'function liveMapKey(){', 'id="hzcluster"'):
    if need not in t: sys.exit('v7.89 cannot find ' + need)
t = rep(t, ".brandrow{position:relative;z-index:4}", """.brandrow{position:relative;z-index:4}
/* v7.89 - compact header and full width (the project manager, 2 Oct 2026: "let's fix this first" ... "should we not be using
   the full page" ... "should these not all be the same size"). Desktop only; the phone bar keeps its own rules. */
@media (min-width:641px){
 .pane{max-width:none!important}
 header.top .brandrow{display:grid!important;grid-template-columns:auto minmax(200px,1fr) 50%!important;grid-template-areas:"lock search cluster"!important;
  column-gap:16px!important;row-gap:8px!important;align-items:center!important;padding:8px 16px!important}
 header.top .lockup{grid-area:lock!important}
 header.top .brandrow > .search{grid-area:search!important;min-width:0}
 header.top .hzmap{display:none!important}
 header.top .hzcluster{grid-area:cluster!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%!important;max-width:none!important;margin-left:0!important;box-sizing:border-box}
 header.top .hzcluster > .tpodwrap,header.top .hzcluster > .hzpod,header.top .hzcluster > .recstrip{width:auto!important;max-width:none!important;min-width:0!important;box-sizing:border-box}
 header.top .hzcluster > .tpodwrap .tpcard,header.top .hzcluster > .tpodwrap .face{width:100%!important;max-width:100%!important;box-sizing:border-box}
 header.top.slim89 .hzcluster{display:none!important}
 header.top.slim89 .brandrow{padding-top:6px!important;padding-bottom:6px!important;min-height:0!important;height:auto!important}
 header.top.slim89 #bOrg{display:none!important}
 header.top.slim89 .wordmark .gc{font-size:30px!important}
 header.top.slim89 .wordmark .yr{font-size:16px!important}
}
@media (min-width:641px) and (max-width:1279px){
 header.top .brandrow{grid-template-columns:auto minmax(0,1fr)!important;grid-template-areas:"lock search" "cluster cluster"!important}
 header.top .hzcluster{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%!important}
 header.top .hzcluster > .tpodwrap,header.top .hzcluster > .hzpod,header.top .hzcluster > .recstrip{width:auto!important;max-width:none!important}
}""", 'compact header css', p, True)
t = rep(t, "function liveMapKey(){", """/* v7.89 - the header slims once the page under it is scrolled, and comes back at the top (hysteresis, so it never flickers) */
(function slim89(){ const go = () => { const m = document.querySelector('main'), h = document.querySelector('header.top'); if (!m || !h) return setTimeout(go, 400);
 let slim = false; const on = () => { const y = m.scrollTop; if (!slim && y > 90) { slim = true; h.classList.add('slim89'); } else if (slim && y < 12) { slim = false; h.classList.remove('slim89'); } };
 m.addEventListener('scroll', on, {passive: true}); window.addEventListener('hashchange', () => setTimeout(on, 50)); };
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go(); })();
function liveMapKey(){""", 'slim on scroll', p, True)
t = t.replace('/* v7.87 - Inventory: one line per location', '/* v7.89 - compact header (one row, three equal pods, slim when scrolled) and full-width tabs. */\n/* v7.87 - Inventory: one line per location', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.89 applied: compact header, equal pods, slim when scrolled, full width')
