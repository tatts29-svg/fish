#!/usr/bin/env python3
"""v7.38 - track mat and water-filled barriers carry no asset numbers. Andrew Fisher, 29 Sep 2026: "Also track mats and
water barriers don't have asset numbers." The inventory stops counting them as "no number yet"; the Change form, the day
list, the drawer and the sheets say "not numbered" and ask for nothing.
    python3 patch_v738.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function unnumbered(' in t: sys.exit('v7.38 already applied')
if 'function subhireOf(' not in t: sys.exit('needs v7.37')
JS = open(os.path.join(here, 'unnum738_src.js'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# the inventory: no "Coates numbered" or "no number yet" for a trade that is never numbered
t = rep(t, " const c = LM ? Math.min((LM[x.item] || []).filter(n => cn.has(String(n))).length, x.onq - s.length) : Math.min(coates, x.onq - s.length);",
 " if (unnumbered(a)) { r.unnum = true; return; } /* v7.38 - counted by quantity, never numbered */\n const c = LM ? Math.min((LM[x.item] || []).filter(n => cn.has(String(n))).length, x.onq - s.length) : Math.min(coates, x.onq - s.length);", 'inventory', p, True)
t = rep(t, "<td class=\"num\">${invCell(r, 'coates', r.coates)}</td><td class=\"num\">${invCell(r, 'nonum', r.nonum)}</td>",
 "<td class=\"num\">${r.unnum ? '<span class=\"norate\" title=\"counted by quantity - no asset numbers\">not numbered</span>' : invCell(r, 'coates', r.coates)}</td><td class=\"num\">${r.unnum ? '<span class=\"norate\">-</span>' : invCell(r, 'nonum', r.nonum)}</td>", 'inventory cells', p, True)
# the drawer's pill
t = rep(t, " : '<span class=\"pill none\">No asset number on this one yet</span>'}",
 " : (unnumbered(a) ? '<span class=\"pill none\">Not numbered - counted by quantity</span>' : '<span class=\"pill none\">No asset number on this one yet</span>')}", 'drawer pill', p, True)
# the drawer's list and the Change form's list (the same words in both)
old = "}).join('')}</ul>` : '<p class=\"norate\">No asset number on this one yet.</p>'}"
new = "}).join('')}</ul>` : (unnumbered(a) ? '<p class=\"norate\">Not numbered - water-filled barriers and track mat are counted by quantity, not by asset number.</p>' : '<p class=\"norate\">No asset number on this one yet.</p>')}"
n = t.count(old)
if n != 1: sys.exit('drawer list anchor x%d' % n)
t = t.replace(old, new)
old2 = "</li>`).join('')}</ul>` : '<p class=\"norate\">No asset number on this one yet.</p>'}"
n2 = t.count(old2)
if n2 != 1: sys.exit('form list anchor x%d' % n2)
t = t.replace(old2, "</li>`).join('')}</ul>` : (unnumbered(a) ? '<p class=\"norate\">Not numbered - water-filled barriers and track mat are counted by quantity, not by asset number.</p>' : '<p class=\"norate\">No asset number on this one yet.</p>')}")
# the Change form: no box to add a number
t = rep(t, "${subhireCo(k) ? `<p class=\"norate\">Sub-hired location (", "${unnumbered(a) ? '' : subhireCo(k) ? `<p class=\"norate\">Sub-hired location (", 'form box', p, True)
# the day list
t = rep(t, "<span>Asset no. <b>${nums.length ? esc(nums.join(', ')) : '<span class=\"norate\">none yet</span>'}</b>",
 "<span>Asset no. <b>${nums.length ? esc(nums.join(', ')) : unnumbered(a) ? '<span class=\"norate\">not numbered</span>' : '<span class=\"norate\">none yet</span>'}</b>", 'day list', p, True)
# the driver and install sheets: no line to write a number on
t = rep(t, "return own.length || cos ? own.map(x => `<b class=\"dp-num\">${esc(x)}</b>`).join(' ') + cos :(subhireCo(r.a.key)",
 "return own.length || cos ? own.map(x => `<b class=\"dp-num\">${esc(x)}</b>`).join(' ') + cos : unnumbered(r.a) ? '<span>Not numbered - count only</span>' :(subhireCo(r.a.key)", 'sheets', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
