#!/usr/bin/env python3
"""v6.69d - "Email this" on Where we are writes its email when it is pressed, not every time the page is drawn (it
worked the whole day out again just to fill in a link nobody had pressed).
  python3 patch_v669d.py <page.html> [builder.py]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep
LAZY = """function progressMailto(asOf, X){"""
LAZY_NEW = """/* v6.69 - the email is written when "Email this" is pressed, from the record as it stands at that moment */
document.addEventListener('click', e => { const a = e.target && e.target.closest && e.target.closest('#emailProgress[data-mailasof]');
 if (a) { try { a.href = holdAssets(() => progressMailto(a.dataset.mailasof)); } catch (err) {} } }, true);
function progressMailto(asOf, X){"""
def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, '<a class="hb" id="emailProgress" href="${progressMailto(asOf)}">Email this</a>',
            '<a class="hb" id="emailProgress" href="mailto:" data-mailasof="${esc(asOf)}">Email this</a>', 'mail link', path, need)
    t = rep(t, LAZY, LAZY_NEW, 'mail lazy', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
patch(sys.argv[1], True)
if len(sys.argv) > 2: patch(sys.argv[2], False)
