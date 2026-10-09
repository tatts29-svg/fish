#!/usr/bin/env python3
"""v5.91 (second part) - Plant takes the Register's place in the primary bar; the Map tab's sheet view carries the
explorer and 3D proof buttons too.  python3 patch_v591b.py <builder|page>"""
import sys, re
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'
a = "const TAB_PRIMARY = ['today', 'progress', 'timeline', 'register', 'map', 'docs', 'coatesway'];"
assert s.count(a) == 1; s = s.replace(a, "const TAB_PRIMARY = ['today', 'progress', 'timeline', 'plant', 'map', 'docs', 'coatesway'];   /* v5.91 - Plant, carrying the register, where Register was */")
pat = re.compile(r'(   \$\{sat3dPossible\(\) \? `<button class="btn sheetbtn satbtn" data-sheet="\$\{SAT_3D\}" title="The circuit in three dimensions[^\n]*\n)')
m = pat.findall(s); assert len(m) == 1, len(m)
s = pat.sub(lambda mm: mm.group(1) + """   ${DATA.edition === 'hosted' ? `<button class="btn sheetbtn satbtn" type="button" data-mopen="explorer">Plan on satellite</button><button class="btn sheetbtn satbtn" type="button" data-mopen="proof3d">3D proof</button>` : ''}\n""", s)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.91b', p)
