#!/usr/bin/env python3
r"""v7.80 - what a draw keeps (RENDER_MEMO) is emptied by every save. Apply to the live page (v7.75 + v7.77 or later).

  Found by the v7.75 critic, 1 Oct 2026: a paid fence rate typed on the Fencing tab (data-fck) saves and calls
  renderFencing(), which is not a full draw (renderPass), so RENDER_MEMO was not emptied. The "Paid to Advanced, by P&L
  line" card (fencePaidSplit) kept the old figure while the KPI above it showed the new one, until the next tab change.
  The same held for every per-draw result (fencePaidSplit, the P&L model, the money summary, the branch roll-up, the pins,
  the labour plan) read by any partial redraw after a save. Now save() empties RENDER_MEMO before and after the save, as
  v7.75 marks the held asset list stale, so whatever draws next reads the record as it now is.
  No figure, rule or record changes.
    python3 patch_v780.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'RENDER_MEMO.clear(); /* v7.80' in t: sys.exit('v7.80 already applied')
if 'function save775Inner(' not in t: sys.exit('v7.80 needs the v7.75 base first')

t = rep(t, "function save(){ if (ASSETS_HELD) HELD_STALE775 = true; const r775 = save775Inner.apply(this, arguments); if (ASSETS_HELD) HELD_STALE775 = true; return r775; }",
 "function save(){ RENDER_MEMO.clear(); /* v7.80 - a save empties what the draw kept, so a partial redraw (renderFencing) reads the edit */ if (ASSETS_HELD) HELD_STALE775 = true; const r775 = save775Inner.apply(this, arguments); RENDER_MEMO.clear(); if (ASSETS_HELD) HELD_STALE775 = true; return r775; }",
 'save empties the per-draw memo', p, True)

t = t.replace("/* v7.75 - fresh after a save inside a held draw;", "/* v7.80 - a save empties the per-draw memo (RENDER_MEMO): the Fencing card follows a typed rate at once. */\n/* v7.75 - fresh after a save inside a held draw;", 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.80 applied: a save empties the per-draw memo; the Paid to Advanced card follows a typed rate')
