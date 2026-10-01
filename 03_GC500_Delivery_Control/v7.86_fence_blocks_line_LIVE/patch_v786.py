#!/usr/bin/env python3
r"""v7.86 - a Fence blocks line on the Fencing tab. Author: Andrew Fisher. One patch on the live page (v7.84, or the v7.85 Showcase release once it is live).

Andrew, 2 Oct 2026, on hire agreement 36566 (rear of the pit building / Puppet Theatre: "Brace existing fence. Not
scrimmed." - 216 bases, 216 clamps, 108 braces, no metres): "charge as per what was used", then "continue with your
logic" on the proposal - the 216 bases on the 2026 street rate card's own line "Fence Blocks( per block)", $3.02 a
block ($652.32). Clamps and braces have no line on the card; on every other docket they sit inside the per-metre fence
rate, so they are not charged separately. Advanced's price sheet prices by the metre only, so what Advanced bill for
this comes off their invoice - the paid side shows as not yet known, never estimated.

  - The line joins the fencing lines the page already reads (the record-a-paper form, the rates table, the docket,
    week and area totals) as "Fence blocks", counted each, at $3.02, settled by the project manager on 2 Oct 2026.
  - Nothing else changes. No figure on any existing docket moves.
    python3 patch_v785.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if "key: 'fence_blocks'" in t: sys.exit('v7.86 already applied')
for need in ('const WAYIN784 = ', 'function costDocket(', 'function paperCols(', 'detail781Button'):
    if need not in t: sys.exit('v7.86 needs v7.84 or later (missing ' + need + ')')
t = rep(t, "const FCOL = FENCE.columns || [];",
        r"""const FCOL = FENCE.columns || [];
/* v7.86 - FENCE BLOCKS, a line of their own (the project manager, 2 Oct 2026, on 36566 "charge as per what was used"): the
   2026 street rate card's "Fence Blocks( per block)" at $3.02, for a docket that puts blocks on with no fence metres -
   bracing an existing fence. Clamps and braces have no card line and stay inside the per-metre fence rate. Advanced's
   sheet has no per-block price, so the paid side is not known until their invoice says. */
if (!FCOL.some(c => c.key === 'fence_blocks')) FCOL.push({key: 'fence_blocks', name_as_written: 'Fence blocks', unit: 'each',
 programme_type: null, settled_by: 'the project manager', settled_on: '2026-10-02', settled_said: 'charge as per what was used',
 settled_note: 'the issued Street Rate Card 2026 line "Fence Blocks( per block)", $3.02 a block - for blocks put on with no fence metres (bracing an existing fence, docket 36566); clamps and braces stay inside the per-metre fence rate',
 unit_basis: 'the card line prices per block', rate: 3.02, rate_year: 2026, rate_source: 'the project manager, 2026-10-02',
 card: null, card_line: 'Fence Blocks( per block)', card_state: 'matched', card_why: 'the same words', card_candidates: [],
 cost_rate: null, cost_basis: "Advanced's price sheet has no per-block line - the cost comes off their invoice", issued_card_rate: 3.02, issued_card_differs: false});""", 'fence blocks line', p, True)
# 2. TRACK DETAIL OFF UNTIL IT COVERS THE WHOLE LAP (the project manager, 2 Oct 2026: "The whole point is to have the whole
#    track" ... "can we take this out until its fixed, don't have it in there, it's almost like a bug"). The v7.85 scene
#    details 250 m of the pit straight and the drive runs out of it. Its button is simply not added, so nobody can switch
#    it on; the rest of the Showcase (MP4/weather, speedos, cameras, the car) is exactly as before v7.85. The scene's code
#    stays in the page, untouched, for Codex to finish and switch back on.
t = rep(t, "function attach(){\n const controls=document.getElementById('showQualityL')||document.getElementById('showBackdrop');",
        "function attach(){ if (window.TRACK_DETAIL_OFF786 !== false) return; /* v7.86 - off until it covers the whole lap */\n const controls=document.getElementById('showQualityL')||document.getElementById('showBackdrop');", 'track detail off', p, True)
t = t.replace('/* v7.84 - the ways in the project manager gave', "/* v7.86 - a Fence blocks line on the Fencing tab ($3.02 a block, the 2026 card), for 36566; Showcase Track detail off until it covers the whole lap. */\n/* v7.84 - the ways in the project manager gave", 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.86 applied: a Fence blocks line; Track detail off until the whole lap')
