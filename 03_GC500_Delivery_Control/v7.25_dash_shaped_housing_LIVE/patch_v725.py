#!/usr/bin/env python3
"""v7.25 - the v7.24 instrument panel in a moulded dash housing; applied on v7.23 with wip725_src.js / wip725.css."""
"""v7.24 - Where we are as one instrument panel (see wip725_src.js). Andrew Fisher, 28 Sep 2026: "make it look like a race
car dash that animates 4k ultra crystal clear. Animate it really good", with the instrument-panel handover.
Replaces, on Where we are only, the delivery block (completionBlock) and the four white cards (dsnHeadline). Today keeps
its own block.   python3 patch_v724.py <page.html> [wip725_src.js] [wip725.css]"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402
p = sys.argv[1]
jsf = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'wip725_src.js')
cssf = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'wip725.css')
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
if 'function wipPanel(' in t: sys.exit('v7.24/v7.25 already applied')
js = open(jsf, encoding='utf-8').read().rstrip() + '\n'; css = open(cssf, encoding='utf-8').read().rstrip() + '\n'
if re.findall(r" \.[A-Za-z_]", js): sys.exit('space before a dot in the source')
t = rep(t, "function completionBlock(asOf, C, opts){", js + "function completionBlock(asOf, C, opts){", 'code', p, True)
t = rep(t, '<div class="chero">${completionBlock(asOf, null, {head: true})}</div>', '<div class="chero">${wipPanel(asOf)}</div>', 'panel', p, True)
t = rep(t, "dsnHead(asOf) + dsnHeadline(asOf, X) + dsnGroups(asOf, X)", "dsnHead(asOf) + dsnGroups(asOf, X)", 'cards off', p, True)
t = rep(t, " const pane = $('#pane-progress');\n raceMount(pane);", " const pane = $('#pane-progress');\n raceMount(pane);\n wipWire(pane);   /* v7.24 - the instrument panel */", 'wire', p, True)
k = t.find('</style>'); t = t[:k] + css + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(p), n0, '->', len(t))
