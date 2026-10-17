#!/usr/bin/env python3
"""v7.09 - the Timeline, less happening. Andrew Fisher, 27 Sep 2026 ("we need to work out the layout for timeline, looks
like too much is happening" ... "and need to remove this from time line", with five screenshots). Taken off the Timeline:
 - the four whole-job tiles (59 green · 0 amber · 0 not on site · 140 no record) - whole-job numbers, still on Today;
 - "What a day shows", the explainer;
 - the trade chips and the Lights chips - and, because nothing on the Timeline can now set them, the Timeline reads the
   day with neither applied (a trade or light picked on the Plant register no longer thins the day's list unseen);
 - the programme bar (07 Sep ... 23 Oct ... 13 Nov);
 - the day's "Status check / Selected group" box.
Nothing is deleted from the record, and the same parts stay where else they appear. Build on v7.08.
   python3 patch_v709.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
CSS = """/* v7.09 - the Timeline without the whole-job tiles, the explainer, the filter chips, the programme bar and the status check */
#pane-timeline > .kpis,#pane-timeline > .notice.info,#pane-timeline > .pfold,#pane-timeline > .filters,#pane-timeline > .lightbar,
#pane-timeline > .card:has(> .pgm),#pane-timeline > .card.has-race,#pane-timeline .attnwrap{display:none !important}
"""
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.09 - the Timeline without' in t: sys.exit('v7.09 already applied')
t = rep(t, "function renderTimeline(){ return holdAssets(renderTimeline_held); }",
        "function renderTimeline(){ const keep = [state.disc, state.light]; state.disc = null; state.light = null;   /* v7.09 - no filter the Timeline cannot show */\n"
        " try { return holdAssets(renderTimeline_held); } finally { state.disc = keep[0]; state.light = keep[1]; } }", 'unfiltered', p, True)
k = t.find('</style>')
t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
