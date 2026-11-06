#!/usr/bin/env python3
"""v6.83 - LIGHT TOWERS ARE ONE EACH (Andrew, 27 Sep 2026: "Light towers qty 1 yes").

The 17 light-tower references (LT01-LT04, LTC01-LTC14) carry no asset numbers and no schedule quantity, so v6.82's
rule could not count them. Each is named as a single numbered tower ("Light tower 01", "Circuit light tower 05"),
and Andrew confirmed one each. The rule: a reference whose only charge line is a Light Tower with no quantity, and
whose name is a single numbered light tower, asks for 1. The line says so; a quantity a person types still wins.
Applied after patch_v682.py.   python3 patch_v683.py <page.html>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R(""" return Object.assign({}, a, {
 name: desc || a.name || null,""", """ /* v6.83 - A LIGHT TOWER IS ONE (Andrew, 27 Sep 2026: "Light towers qty 1 yes") */
 if (!a.relocation && chargeLinesOut && chargeLinesOut.length === 1 && chargeLinesOut[0].quantity == null
 && /^light tower$/i.test(String(chargeLinesOut[0].item || '').trim()) && /light tower\\s*\\d+/i.test(String(desc || a.name || ''))) {
 const l = chargeLinesOut[0];
 chargeLinesOut = [Object.assign({}, l, {quantity: 1, priceable: true, quantity_auto: true,
 quantity_on_the_schedule: 'quantity_on_the_schedule' in l ? l.quantity_on_the_schedule : l.quantity,
 quantity_state_on_the_schedule: l.quantity_state_on_the_schedule || l.quantity_state,
 quantity_state: 'one light tower — the reference names a single numbered tower, and Andrew confirmed one each on 27 Sep 2026. The schedule: ' + l.quantity_state})];
 }
 return Object.assign({}, a, {
 name: desc || a.name || null,""", 'light towers')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
