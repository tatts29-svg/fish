#!/usr/bin/env python3
"""v7.04 - the day's documents as a plate at the top of the Timeline (see plate704_src.js).
Andrew Fisher, 27 Sep 2026: "can we have these more noticeable and up the top somewhere. They need to have its own card
feel. Almost like its own importance data plate."
Build on v7.00 (live).   python3 patch_v704.py <page.html> [plate704_src.js] [plate704.css]"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402


def patch(path, jsf, cssf, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function dpPlate(' in t: sys.exit('v7.04 already applied')
    if 'function dpDayButtons(' not in t: sys.exit('apply v7.00 first')
    js = open(jsf, encoding='utf-8').read().rstrip() + '\n'
    css = open(cssf, encoding='utf-8').read().rstrip() + '\n'
    bad = re.findall(r" \.[A-Za-z_]", js)
    if bad: sys.exit('the source holds a space before a dot, which the attribution scrub folds: %r' % bad[:5])
    # 1. the code, beside v7.00's
    t = rep(t, "function dpWireDay(pane){", js + "function dpWireDay(pane){", 'code', path, need)
    # 2. the plate, straight under the Timeline's heading, for the selected day
    t = rep(t, "$('#pane-timeline').innerHTML = paneHeadingHtml('timeline') + `",
            "$('#pane-timeline').innerHTML = dpHeadWithPlate(days, sel) + `", 'plate', path, need)
    # 3. the day steppers (the tiles carry v7.00's own data attributes, which dpWireDay already wires)
    t = rep(t, "dpWireDay(pane);   /* v7.00 - Pre-start, Drivers, Install, Email */",
            "dpWireDay(pane);   /* v7.00 - Pre-start, Drivers, Install, Email */\n dpWirePlate(pane);   /* v7.04 - the plate's day steppers */", 'wire', path, need)
    k = t.find('</style>')
    if k < 0: sys.exit('no </style>')
    t = t[:k] + css + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    p = sys.argv[1]
    patch(p, sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'plate704_src.js'),
          sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'plate704.css'), True)
