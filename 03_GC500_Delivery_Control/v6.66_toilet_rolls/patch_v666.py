#!/usr/bin/env python3
"""v6.66 - TOILET ROLLS OUT OF THE DUNNY (Andrew Fisher, 26 Sep 2026: "with the toilet one, can we see toilet rolls coming out
when the door's open"). rolls_v666.js: three rolls tumble out of the doorway each time it swings open, bounce down the road,
roll to a stop and unreel a streamer of paper behind them; drawn after the trailer with the same car shader.

  python3 patch_v666.py <page.html> <bundle gc3d_bundle.js> <rolls_v666.js>
"""
import os, sys
page, bundle, rolls = sys.argv[1:4]; ROLLS = open(rolls, encoding='utf-8').read()
for path in [bundle, page]:
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    for anchor, new, after in [('/* the vehicle on the circuit:', ROLLS, False),
        ("for(const part of S.trailerParts)drawPart(part,TM,w=>-T.spin*(.19/(w.r||.19)),tw);", "if(S.towKind==='loo'&&G.looRolls)G.looRolls(S,gl,drawPart,TM);   /* v6.66 - the rolls */", True)]:
        if t.count(anchor) != 1: sys.exit(f'anchor {anchor[:40]!r}: {t.count(anchor)} in {os.path.basename(path)}')
        t = t.replace(anchor, anchor + new if after else new + anchor, 1)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
