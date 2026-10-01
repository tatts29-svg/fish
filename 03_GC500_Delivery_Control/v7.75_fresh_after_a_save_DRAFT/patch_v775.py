#!/usr/bin/env python3
r"""v7.75 - fresh after a save, and the recovery ratios wait for the quotes. Apply to the live v7.76.

  1. A save inside a held draw is seen by the rest of that draw (Claude's cross-check of v7.76, 1 Oct 2026 19:22).
     v7.76 holds one asset list and one result per model for the whole of go(), so a tab change builds them once.
     But go() moves the focus to the new pane after it draws, and moving the focus commits a box still being typed
     in on the old pane: its handler writes the record, save()s and render()s - inside the hold, so that redraw read
     the list and the forecast and Rehire models from before the write (the record was right; the screen was stale
     until the next draw, and Costs to job end could disagree with the Forecast P&L above it). Now save() marks an
     active hold stale, and the next read in it (allAssets, heldMemo, a nested holdAssets) rebuilds the list and
     empties the memo once. A draw with no save in it builds exactly as v7.76 does.
  2. Transport Recovery and Consumables Recovery read the Event Portables quotes' split: when the quotes do not split
     to the cent, or are not approved, the pump-out and water costs are not on their own lines, so the two ratios
     would divide by the wrong cost. They now read "not readable yet" with the reason, as Rehire Recovery already
     does. Today the quotes split and are approved, so nothing on the page changes.
  No figure, rule or record changes.
    python3 patch_v775.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function heldFresh775(' in t: sys.exit('v7.75 already applied')
if 'function go776Held(' not in t: sys.exit('v7.75 needs the v7.76 base first')

# 1. the hold goes stale on a save, and is rebuilt once on the next read
t = rep(t, """let ASSETS_HELD = null;
const HELD_MEMO = new Map();
function heldMemo(k, f){ if (!ASSETS_HELD) return f(); if (HELD_MEMO.has(k)) return HELD_MEMO.get(k); const v = f(); HELD_MEMO.set(k, v); return v; }""",
 """let ASSETS_HELD = null;
const HELD_MEMO = new Map();
/* v7.75 - a save inside a hold makes the held list and memo stale; the next read rebuilds them once, so the rest of
   that draw shows the record as it now is. A draw with no save in it builds once, as before. */
let HELD_STALE775 = false;
function heldFresh775(){ if (ASSETS_HELD && HELD_STALE775) { HELD_STALE775 = false; ASSETS_HELD = buildAllAssets(); HELD_MEMO.clear(); } }
function heldMemo(k, f){ if (!ASSETS_HELD) return f(); heldFresh775(); if (HELD_MEMO.has(k)) return HELD_MEMO.get(k); const v = f(); HELD_MEMO.set(k, v); return v; }""",
 'held memo goes stale on a save', p, True)
t = rep(t, "function allAssets(){ return ASSETS_HELD || buildAllAssets(); }",
 "function allAssets(){ heldFresh775(); return ASSETS_HELD || buildAllAssets(); }", 'allAssets reads fresh after a save', p, True)
t = rep(t, """if (ASSETS_HELD) return fn();
 ASSETS_HELD = buildAllAssets(); HELD_MEMO.clear();
 try { return fn(); } finally { ASSETS_HELD = null; HELD_MEMO.clear(); }""",
 """if (ASSETS_HELD) { heldFresh775(); return fn(); }
 ASSETS_HELD = buildAllAssets(); HELD_MEMO.clear(); HELD_STALE775 = false;
 try { return fn(); } finally { ASSETS_HELD = null; HELD_MEMO.clear(); HELD_STALE775 = false; }""",
 'nested hold reads fresh after a save', p, True)
t = rep(t, "function save(){",
 """/* v7.75 - every edit reaches save(); a save during a held draw marks the hold stale (heldFresh775) */
function save(){ const r775 = save775Inner.apply(this, arguments); if (ASSETS_HELD) HELD_STALE775 = true; return r775; }
function save775Inner(){""", 'save marks the hold stale', p, True)

# 2. the two ratios that read the quotes' split wait for it
t = rep(t, """ ];
 const near = (a, b) => a != null && b != null && Math.abs(a - b) < 0.015;
 const out770""", """ ];
 /* v7.75 - Transport and Consumables Recovery read the quotes' split (3325 and 2144); without it they wait */
 if (!qClean) { const wait775 = 'not readable yet: ' + (rqOn ? 'the Event Portables quotes did not split to the cent by line, so they are carried whole on Rehire and the pump-out and water costs are not on their own lines' : 'the Event Portables quotes are not approved, so the pump-out and water costs are not counted');
  rec.forEach(r => { if (r.name === 'Transport Recovery' || r.name === 'Consumables Recovery') { r.now = null; r.job = null; r.words = wait775; } }); }
 const near = (a, b) => a != null && b != null && Math.abs(a - b) < 0.015;
 const out770""", 'ratios wait for the quotes split', p, True)

t = t.replace('/* v7.74 - tidy, the second pass:', '/* v7.75 - fresh after a save inside a held draw; the recovery ratios wait for the quotes\' split. */\n/* v7.74 - tidy, the second pass:', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.75 applied: a save inside a held draw is seen by the rest of it; Transport and Consumables Recovery wait for the quotes split')
