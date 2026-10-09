#!/usr/bin/env python3
"""v7.52 - the P&L, as management read it: one statement at the head of the Costs tab (revenue by line and by branch,
direct costs against the eight categories, difference so far, what is not in it), every figure the same figure the
working below holds; the old "Are we making money?" card folds under it. The project manager, 1 Oct 2026.
    python3 patch_v752.py <page.html>   (needs v7.49 or later - servicing748Total, card748Html)"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function pl752Card(' in t: sys.exit('v7.52 already applied')
if 'function card748Html(' not in t or 'function marginCard(' not in t: sys.exit('needs the live v7.49 (card748Html) and marginCard')
JS = open(os.path.join(here, 'pl752_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'pl752.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function marginCard(){", JS + "\nfunction marginCard(){", 'code', p, True)
t = rep(t, " ${fin745Html()}\n ${marginCard()}\n",
 " ${pl752Card()}\n ${fin745Html()}\n <details class=\"plfold752\"><summary>Are we making money? — the working behind every figure<small>streams, the two sides of the ledger, the sources</small></summary>${marginCard()}</details>\n", 'costs pane', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
