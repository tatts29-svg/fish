#!/usr/bin/env python3
r"""v7.91 - Today tidy-up after the full-width page. Author: Andrew Fisher.

The project manager, 2 Oct 2026, with screenshots of Today on a wide screen after v7.89: "this is how today looks now, this needs
some work to clean up". On a 2,000 px screen:
  - the BACK button had no place in the one-row header, so it dropped onto a row of its own (a dead band, also when slim);
  - the picture bands grew with the window - the Today banner was 723 px tall;
  - the Deliveries panel kept its 1,060 px block, leaving a third of the dark panel empty;
  - the cards under the day were a fixed grid, so the last card sat alone on a row.
On a desktop (641 px and wider; the phone is untouched):
  - Back sits in the header row beside the lockup;
  - the picture bands (Today's banner, the race strips on the other tabs) stop growing past 1,400 px and sit centred - the same
    picture, the same crop, so the board's words are never cut;
  - the Deliveries block fills its panel;
  - the cards wrap as a row that always fills the width, so none is left alone.

    python3 patch_v791.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.91 - Today tidy' in t: sys.exit('v7.91 already applied')
for need in ('header.top.slim89 .hzcluster{display:none!important}', 'grid-template-areas:"lock search cluster"!important', 'grid-template-areas:"lock search" "cluster cluster"!important'):
    if need not in t: sys.exit('v7.91 needs v7.89 (missing ' + need + ')')
# 1. Back in the header row
t = rep(t, 'grid-template-columns:auto minmax(200px,1fr) 50%!important;grid-template-areas:"lock search cluster"!important;',
        'grid-template-columns:auto auto minmax(200px,1fr) 50%!important;grid-template-areas:"lock tools search cluster"!important;', 'back in the row', p, True)
t = rep(t, 'grid-template-columns:auto minmax(0,1fr)!important;grid-template-areas:"lock search" "cluster cluster"!important',
        'grid-template-columns:auto auto minmax(0,1fr)!important;grid-template-areas:"lock tools search" "cluster cluster cluster"!important', 'back in the row, narrow', p, True)
# 2-4. bands, deliveries block, cards
t = rep(t, " header.top.slim89 .hzcluster{display:none!important}", """ header.top.slim89 .hzcluster{display:none!important}
 /* v7.91 - Today tidy after full width (the project manager, 2 Oct 2026: "this needs some work to clean up") */
 header.top .brandrow > .navback{grid-area:tools!important;justify-self:start;align-self:center}
 .pane .dsnband,.pane .pgban,.pane .rbhero{max-width:1400px;margin-left:auto!important;margin-right:auto!important}
 #pane-today .cblock{max-width:none!important}
 #pane-today .hub{display:flex!important;flex-wrap:wrap;gap:14px;align-items:stretch}
 #pane-today .hub > .card{flex:1 1 300px;min-width:0;margin:0}""", 'tidy css', p, True)
t = t.replace('/* v7.89 - compact header (one row, three equal pods', '/* v7.91 - Today tidy after full width: Back in the header row, picture bands capped at 1,400 px, Deliveries fills its panel, cards fill each row. */\n/* v7.89 - compact header (one row, three equal pods', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.91 applied: Back in the header row, bands capped, Deliveries fills, cards fill each row')
