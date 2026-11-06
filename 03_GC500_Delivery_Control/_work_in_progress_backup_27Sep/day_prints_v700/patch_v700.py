#!/usr/bin/env python3
"""v7.00 - the day's prints on the Timeline's day card, as one group: "Daily pre-start" (the v6.97 Coates Installs
pre-start, ps7Print), "Delivery drivers" (GC500-DRV-01) and "Install team" (GC500-INS-01). "Print the day" (the plain
run sheet) comes out of the row; dayPrint() stays. One A4 page per truck load: the reference as the hero, the pinned
location with a navigation QR, the pictures the record holds, the driver's JSEA, Take 5, the SWMS and procedures as QR
codes to the public view link, the Coates Life Saving Rules, the contacts. No sign-off.
Applies to v6.96 live or to the v6.99 draft (the Timeline is the same in both).
   python3 patch_v700.py <page.html> [dayprint700_src.js] [dayprint700.css]"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402


def patch(path, jsf, cssf, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function dpPrint(' in t: sys.exit('v7.00 already applied')
    if 'function ps7Print(' not in t: sys.exit('this page has no v6.97 pre-start (ps7Print): the Daily pre-start button calls it')
    if 'const PS7 = ' not in t: sys.exit('this page has no v6.97 pre-start data (PS7): the Life Saving Rules and the work list come from it')
    js = open(jsf, encoding='utf-8').read().rstrip() + '\n'
    css = open(cssf, encoding='utf-8').read().rstrip() + '\n'
    # 1. the code, just ahead of the day's run sheet it sits beside
    t = rep(t, "function dayPrint(iso){", js + "function dayPrint(iso){", 'code', path, need)
    # 2. the day's prints, as one group where "Print the day" was (the run sheet it printed is the driver sheet now;
    #    dayPrint() stays for anything else that calls it)
    b_ = ("<button class=\"btn\" data-print-day=\"${esc(d.iso)}\" title=\"One A4 run sheet for this day: the map location and the asset number "
          "on every drop, with a space to write the number where there is none\">Print the day</button>")
    if t.count(b_) != 1: sys.exit('print-day button anchor: %d' % t.count(b_))
    t = t.replace(b_, "${dpDayButtons(d)}", 1)
    # 3. the wiring
    w_ = "pane.querySelectorAll('[data-print-day]').forEach(n => n.onclick = () => dayPrint(n.dataset.printDay));"
    t = rep(t, w_, w_ + "\n pane.querySelectorAll('[data-print-drv]').forEach(n => n.onclick = () => dpPrint(n.dataset.printDrv, 'drv'));   /* v7.00 */"
            "\n pane.querySelectorAll('[data-print-ins]').forEach(n => n.onclick = () => dpPrint(n.dataset.printIns, 'ins'));   /* v7.00 */"
            "\n pane.querySelectorAll('[data-print-ps7]').forEach(n => n.onclick = () => ps7Print(n.dataset.printPs7));   /* v7.00 */"
            "\n pane.querySelectorAll('[data-ps7-later]').forEach(n => n.onclick = () => flash(n.dataset.ps7Later + '.'));   /* v7.00 */",
            'wire', path, need)
    # 4. the paper's style, in the page's own sheet (never inside a script, where the attribution scrub folds " .")
    css += """/* v7.00 - the day's three prints on the Timeline's day card */
.dayprints{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;padding:3px 6px 3px 8px;border:1px solid var(--rule);border-left:3px solid #ff6a13;border-radius:10px;background:var(--paper)}
.dayprints-l{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-right:2px}
.dayprints .btn.dp-off{opacity:.55;cursor:not-allowed}
@media (max-width:600px){.dayprints{display:flex;width:100%}.dayprints-l{width:100%}.dayprints .btn{flex:1 1 auto}}
"""
    k = t.find('</style>')
    if k < 0: sys.exit('no </style>')
    t = t[:k] + css + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    p = sys.argv[1]
    jsf = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'dayprint700_src.js')
    cssf = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'dayprint700.css')
    patch(p, jsf, cssf, True)
