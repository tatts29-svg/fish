#!/usr/bin/env python3
"""v7.51 - Navigate and a QR code on every load line of the Timeline (the project manager, 1 Oct 2026, with the Timeline on
a big screen: "Can I get a navigate to, as well as a QR code taking you to the exact pinned location. Make it look
good and suited to that line. Animate it. Pulsate it.").
Touches only the load line (ldLine) and its styles; independent of v7.50, applies before or after it.
    python3 patch_v751.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function ldGo751(' in t: sys.exit('v7.51 already applied')
if 'function ldLine(' not in t or 'function text747What(' not in t: sys.exit('needs the live v7.48 or later (ldLine, text747What)')
JS = open(os.path.join(here, 'nav751_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'nav751.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
# 1. the code sits with the load lines
t = rep(t, "function ldLine(d, g, n, open, timed){", JS + "\nfunction ldLine(d, g, n, open, timed){", 'code', p, True)
# 2. the line knows it carries a Navigate, and carries it after its own button
t = rep(t, " return `<div class=\"ld${open ? ' on' : ''}${g.kind === 'removals' ? ' out' : ''}${g.rows.length > 1 ? ' multi' : ''}\" role=\"listitem\">`",
 " const go751 = ldGo751(g); /* v7.51 */\n return `<div class=\"ld${go751 ? ' go' : ''}${open ? ' on' : ''}${g.kind === 'removals' ? ' out' : ''}${g.rows.length > 1 ? ' multi' : ''}\" role=\"listitem\">`", 'line class', p, True)
t = rep(t, "<span class=\"ld-sum\">${sum}</span><span class=\"ld-x\" aria-hidden=\"true\"></span></button>`\n + (open ?",
 "<span class=\"ld-sum\">${sum}</span><span class=\"ld-x\" aria-hidden=\"true\"></span></button>` + go751\n + (open ?", 'line body', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
