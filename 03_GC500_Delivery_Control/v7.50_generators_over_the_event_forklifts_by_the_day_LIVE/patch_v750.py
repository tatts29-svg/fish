#!/usr/bin/env python3
"""v7.50 - generators and towers over the event only; a forklift by its day rate. Corrects the v7.49 that went live on
1 Oct 2026 (Andrew Fisher, 1 Oct 2026: "Forklift go by its day rate. Have our own correct logic on correct pricing.
You're correct about MEAD"; the branch's rule from Brenden Meek: everything but forklifts, VMS and water barriers is
charged over the event only). Replaces the v7.49 code block on the live page with the corrected one; nothing else moves.
    python3 patch_v750.py <page.html>"""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function forkliftWholeHire748(' in t: sys.exit('v7.50 already applied')
if 'function card748Html(' not in t or 'function text747What(' not in t: sys.exit('needs the live v7.49 (card748Html) and v7.48')
JS = open(os.path.join(here, 'card750_src.js'), encoding='utf-8').read()
START = '/* v7.49 - THE CARD FILLS THE GAPS.'
END = '\n/* v7.49 - the contract\'s own rule, as it was */\nfunction contractCharge_747(r){'
if t.count(START) != 1: sys.exit('start marker: expected once, found %d' % t.count(START))
if t.count(END) != 1: sys.exit('end marker: expected once, found %d' % t.count(END))
i = t.index(START); j = t.index(END)
if j < i: sys.exit('markers out of order')
old = t[i:j]
if 'function days748(' not in old or 'function card748Html(' not in old: sys.exit('the v7.49 block is not where it was expected')
t = t[:i] + JS + t[j:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p, 'replaced', len(old), 'chars with', len(JS))
