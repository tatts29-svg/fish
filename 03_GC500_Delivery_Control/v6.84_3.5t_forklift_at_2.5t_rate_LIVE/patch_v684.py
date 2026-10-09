#!/usr/bin/env python3
"""v6.84 - A 3.5 t STANDARD FORKLIFT IS CHARGED AT THE 2.5 t RATE (Andrew, 27 Sep 2026: "If we didn't supply enough
2.5t then the 3.5t is the same rate as the 2.5t").

The card has 2.5 t and 5 t forklifts and a 3.5 t telehandler, but no 3.5 t forklift, so T0085 (3.5T Forklift Std,
Supply) had no rate. A 3.5 t goes out when there are not enough 2.5 t, and it is charged at the 2.5 t standard line.
Applied after patch_v683.py.   python3 patch_v684.py <page.html>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R("""function cardRate(disc, item, key){
 let e = RM_ITEMS.get(disc + '|' + item) || null;""", """function cardRate(disc, item, key){
 let e = RM_ITEMS.get(disc + '|' + item) || null;
 /* v6.84 - a 3.5 t standard forklift, which goes out when there are not enough 2.5 t, is charged at the 2.5 t
 standard line (Andrew, 27 Sep 2026) */
 if ((!e || !e.priceable) && /^3\\.5\\s*t\\s*forklift(\\s*std|\\s*standard)?$/i.test(String(item || '').trim())) {
 const s = RM_ITEMS.get(disc + '|2.5T Forklift STD') || RM_ITEMS.get(disc + '|Forklift 2.5T');
 if (s && s.priceable) e = Object.assign({}, s, {state: 'matched', why: 'a 3.5 t forklift goes out when there are not enough 2.5 t, and is charged at the 2.5 t standard line (Andrew, 27 Sep 2026)'});
 }""", 'card 3.5t')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
