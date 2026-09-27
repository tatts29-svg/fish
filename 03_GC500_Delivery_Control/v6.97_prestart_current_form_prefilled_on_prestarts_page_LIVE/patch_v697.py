#!/usr/bin/env python3
"""v6.97 - the Coates Installs pre-start, prefilled for the days ahead in the form the crew already use, on the Pre-starts
page (not the Timeline). Replaces the v6.95 draft. Applies to v6.90 (live) or later.
   python3 patch_v697.py <page.html> <prestart697.js>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, jsf, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function ps7Page(' in t: sys.exit('v6.97 already applied')
    if 'function prestartButton(' in t: sys.exit('this page carries the v6.95 Timeline pre-start; build v6.97 on a page without it')
    js = open(jsf, encoding='utf-8').read().rstrip() + '\n'
    t = rep(t, "function renderPrestarts(){", js + "function renderPrestarts(){", 'code', path, need)
    a_ = " ${rows.length ? `<ul class=\"prelist\">${rows.map(prestartRow).join('')}</ul>`"
    if t.count(a_) != 1: sys.exit('prelist anchor: %d' % t.count(a_))
    t = t.replace(a_, " ${c.key === 'coates' ? `<div class=\"ps7box\">${ps7ListHtml()}</div>` : ''}   \n" + a_, 1)
    t = rep(t, " pane.querySelectorAll('[data-preup]').forEach(b => b.onclick = () => prestartUpload(b.dataset.preup));",
            " pane.querySelectorAll('[data-preup]').forEach(b => b.onclick = () => prestartUpload(b.dataset.preup));\n"
            " pane.querySelectorAll('[data-ps7]').forEach(b => b.onclick = () => ps7Print(b.dataset.ps7));   /* v6.97 */", 'wire', path, need)
    css = """
/* v6.97 - the prefilled pre-starts on the Pre-starts page */
.ps7box{margin:10px 0 12px;border:1px solid var(--rule);border-left:4px solid #ff6a13;border-radius:10px;padding:10px 12px;background:var(--paper)}
.ps7head{display:flex;flex-direction:column;gap:3px;margin-bottom:6px}.ps7head b{font-size:14px}.ps7head span{color:var(--mute);font-size:12.5px;line-height:1.45}
.ps7list{margin:4px 0 2px}
"""
    k = t.find('</style>'); t = t[:k] + css + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], True)
