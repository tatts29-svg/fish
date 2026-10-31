#!/usr/bin/env python3
"""v5.99 (b) - on a phone the page never scrolls sideways: whatever a table or a plate spills, the main column keeps
it; the tables scroll inside their own wrappers as before.  python3 patch_v599b.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'
a = """.tblwrap{overflow-x:auto;border:1px solid var(--rule);border-radius:10px;background:var(--paper)}"""
assert s.count(a) == 1; s = s.replace(a, a + """
@media(max-width:640px){main{overflow-x:hidden}.tblwrap{max-width:100%}}   /* v5.99 - a phone never scrolls the page sideways */""")
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.99b')
