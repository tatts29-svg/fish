#!/usr/bin/env python3
"""v5.99 (c) - on a phone the closure times and the typed-rate boxes wrap inside the screen instead of running off it."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'
a = """@media(max-width:640px){main{overflow-x:hidden}.tblwrap{max-width:100%}}   /* v5.99 - a phone never scrolls the page sideways */"""
assert s.count(a) == 1; s = s.replace(a, a + """
@media(max-width:640px){.clotbl td,.clotbl .clowin{white-space:normal}.clotbl .clowin{display:inline}.fratetbl input.rate,.fratetbl td.frs input.rate{width:100%;max-width:120px}}""")
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.99c')
