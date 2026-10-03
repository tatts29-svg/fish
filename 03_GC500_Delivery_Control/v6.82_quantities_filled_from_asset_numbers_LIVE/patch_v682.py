#!/usr/bin/env python3
"""v6.82 - A MISSING QUANTITY FILLED IN FROM THE ASSET NUMBERS (Andrew, 26 Sep 2026: "I need you just to fill it in
automatically").

Nine references have labour ticked as done but no readable quantity in the schedule, so the labour could not be
valued: P09, P13, P14, P15, P16, P41, P44, P58 (one portable building each) and WC05 (the toilet block beside its
waste tank). Each carries its own asset numbers, and the count is plain from them: one building, one asset number;
WC05 has two asset numbers, one of them the waste tank on its other line.

The rule, applied to every reference, not to a list: where exactly one charge line has no quantity, the
reference's asset numbers are known (the schedule's, recorded on site, typed here and the rental system's, less any taken off), and they number more than the quantities on its other lines, the
missing quantity is that difference. The line says so ("worked out from the asset numbers") and keeps what the
schedule wrote. A quantity a person types still wins. A reference with no asset numbers (the light towers) is
left unknown.

  python3 patch_v682.py <page.html>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R(""" return Object.assign({}, a, {
 name: desc || a.name || null,""", """ /* v6.82 - A MISSING QUANTITY WORKED OUT FROM THE ASSET NUMBERS (Andrew, 26 Sep 2026: fill it in automatically).
 One line with no quantity, the reference's asset numbers known and more of them than its other lines
 account for: the difference is the quantity. The line says how it was worked out and keeps the schedule's words. */
 if (!a.relocation && chargeLinesOut && chargeLinesOut.length) {
 const unk = chargeLinesOut.filter(l => l.quantity == null);
 const schedNums = kept; /* every number kept against the reference: the schedule's, recorded on site, typed here and the rental system's */
 const knownQ = chargeLinesOut.reduce((s, l) => s + (l.quantity != null && Number.isFinite(Number(l.quantity)) ? Number(l.quantity) : 0), 0);
 const n = schedNums.length - knownQ;
 if (unk.length === 1 && schedNums.length && n >= 1 && n <= MAX_QTY) chargeLinesOut = chargeLinesOut.map(l => l !== unk[0] ? l : Object.assign({}, l, {
 quantity: n, priceable: true, quantity_auto: true,
 quantity_on_the_schedule: 'quantity_on_the_schedule' in l ? l.quantity_on_the_schedule : l.quantity,
 quantity_state_on_the_schedule: l.quantity_state_on_the_schedule || l.quantity_state,
 quantity_state: `worked out from the asset numbers — ${schedNums.length} on this reference (${schedNums.join(', ')})${knownQ ? `, ${knownQ} of them on its other line${chargeLinesOut.length > 2 ? 's' : ''}` : ''}, so ${n}. The schedule: ${l.quantity_state}`}));
 }
 return Object.assign({}, a, {
 name: desc || a.name || null,""", 'auto qty')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
