#!/usr/bin/env python3
"""v7.76 — share the navigation draw's asset snapshot and repeated models.

Author: Andrew Fisher
Apply to the live v7.74 page. No record, calculation or presentation changes.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402

p = sys.argv[1]
with open(p, encoding='utf-8') as source:
    t = source.read()
if 'function go776Held(' in t:
    sys.exit('v7.76 already applied')
if 'v7.74 - tidy, the second pass:' not in t or "const mk770 = 'pl770Model';" not in t:
    sys.exit('v7.76 needs the v7.74 base first')

t = rep(t,
    "function go(tab){ if (!TABS.some(([k]) => k === tab)) tab = 'today';",
    """/* v7.76 — one synchronous asset snapshot for the tab alerts and the page they open.
   renderTabs() asks for the same assets as render(), so both use the existing hold.
   holdAssets releases its list and memo in finally, before any queued frame, timer or
   sync callback runs. A later navigation or record refresh always starts a fresh hold.
   The original navigation, rendering and capability refresh stay in their usual order. */
function go(tab){ return holdAssets(() => go776Held(tab)); }
function go776Held(tab){ if (!TABS.some(([k]) => k === tab)) tab = 'today';""",
    'share the navigation asset snapshot', p, True)

for name in ('cj764Model', 'rh766Model'):
    t = rep(t, 'function ' + name + '(){',
        '/* v7.76 — reuse this model only inside the current synchronous asset hold.\n'
        '   A standalone call remains uncached; the calculation below is unchanged. */\n'
        'function ' + name + "(){ return heldMemo('" + name + "776', " + name + '776Held); }\n'
        'function ' + name + '776Held(){',
        'reuse ' + name + ' within the current asset hold', p, True)

with open(p, 'w', encoding='utf-8') as target:
    target.write(t)
print('v7.76 applied: one synchronous navigation asset snapshot; forecast and rehire models reused within that hold')
