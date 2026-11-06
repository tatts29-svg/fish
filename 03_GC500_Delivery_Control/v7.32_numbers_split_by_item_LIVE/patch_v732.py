#!/usr/bin/env python3
"""v7.32 - a location's numbers split by item. Andrew Fisher, 29 Sep 2026, WC01: two FWF arrived and were numbered, the
accessible toilet did not; the labour card showed both numbers under Accessible Toilet as well as FWF (four install
boxes). Each number now counts against one item (chosen on the Change form, else filled by what turned up or the order,
biggest first); an item counted as none arrived says so instead of offering ticks. Single-item locations unchanged.
    python3 patch_v732.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function lineNumbersOf(' in t: sys.exit('v7.32 already applied')
JS = open(os.path.join(here, 'split732_src.js'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# the units: per item where the location carries more than one
t = rep(t, """function labourUnits(a){
 /* v5.59 — the BUILDINGS, never the things inside them: a fridge is not a place to fit stairs */
 const u = buildingNumbersOf(a).filter(Boolean);
 return u.length > 1 ? u : [];
}""", """function labourUnits(a, item){
 /* v5.59 — the BUILDINGS, never the things inside them: a fridge is not a place to fit stairs */
 const u = buildingNumbersOf(a).filter(Boolean);
 if (u.length <= 1) return [];
 /* v7.32 — on a location with more than one item, only the numbers that count as this item */
 if (item != null) { const m = lineNumbersOf(a); if (m) return m[item] || []; }
 return u;
}""", 'labourUnits', p, True)
t = rep(t, " const a = asset || allAssets().find(x => x.key === ref), us = a ? labourUnits(a) : [];\n return us.length ? us.every(", " const a = asset || allAssets().find(x => x.key === ref), us = a ? labourUnits(a, item) : [];\n return us.length ? us.every(", 'ticked', p, True)
t = rep(t, " const a = allAssets().find(x => x.key === ref), us = a ? labourUnits(a) : [];\n if (!us.length) return {of: 1,", " const a = allAssets().find(x => x.key === ref), us = a ? labourUnits(a, item) : [];\n if (!us.length) return {of: 1,", 'part', p, True)
t = rep(t, " const a = asset || allAssets().find(x => x.key === ref);\n const units = a ? labourUnits(a) : [];\n const qty = qtyOf(l);", " const a = asset || allAssets().find(x => x.key === ref);\n const units = a ? labourUnits(a, l.item) : [];\n const qty = qtyOf(l);", 'money', p, True)
t = rep(t, " const out = lines.map(l => {\n const info = labourLinesFor(a.key, l.discipline, l.item, a.key);\n const q = qtyOf(l);",
 " const out = lines.map(l => {\n const units = labourUnits(a, l.item); /* v7.32 — this item's own numbers */\n const info = labourLinesFor(a.key, l.discipline, l.item, a.key);\n const q = qtyOf(l);\n if (noneArrived(a, l.item)) return `<div><b>${esc(l.item)}</b> — <span class=\"chip act\">none arrived — counted 0 of ${esc(String(q == null ? '?' : q))}, nothing to install yet</span></div>`;", 'ticks html', p, True)
t = rep(t, " (a ? labourUnits(a) : []).forEach(u => {\n const uk = labourKey(ref, disc, item, line, u);", " (a ? labourUnits(a, item) : []).forEach(u => {\n const uk = labourKey(ref, disc, item, line, u);", 'setLabour', p, True)
t = rep(t, " const us = labourUnits(a);\n (us.length ? us : [null]).forEach(u => {\n const k = labourKey(a.key, disc, item, line, u);", " const us = labourUnits(a, item);\n (us.length ? us : [null]).forEach(u => {\n const k = labourKey(a.key, disc, item, line, u);", 'tick all', p, True)
t = rep(t, " live.forEach(a => chargeLines(a).forEach(l => {\n const units = labourUnits(a);", " live.forEach(a => chargeLines(a).forEach(l => {\n const units = labourUnits(a, l.item);", 'effort', p, True)
t = rep(t, " chargeLines(a).forEach(l => {\n const q = qtyOf(l);\n (units.length ? units : [null]).forEach(u => {", " chargeLines(a).forEach(l => {\n const q = qtyOf(l), units = labourUnits(a, l.item);\n (units.length ? units : [null]).forEach(u => {", 'plan', p, True)
t = rep(t, " const of = t.refs.reduce((n, {a}) => n + (labourUnits(a).length || 1), 0);", " const of = t.refs.reduce((n, {a}) => n + (labourUnits(a, t.item).length || 1), 0);", 'card', p, True)
# a supplied item carrying only its chosen numbers is kept
t = rep(t, " if (!it.supplied && it.qty_supplied == null) r.items = r.items.filter(i => i !== it);", " if (!it.supplied && it.qty_supplied == null && !(Array.isArray(it.nums) && it.nums.length)) r.items = r.items.filter(i => i !== it);", 'keep nums', p, True)
# the Change form: which item each number counts as
t = rep(t, """<li><b class="mono">${esc(n)}</b><span class="w">${esc(((a._numberSources || {})[n] || []).join(', '))}</span>""", """<li><b class="mono">${esc(n)}</b>${chNumItemSel(a, n, dis)}<span class="w">${esc(((a._numberSources || {})[n] || []).join(', '))}</span>""", 'form select', p, True)
t = rep(t, " chBind(pane); chSwapBind(pane); invBind(pane); walkBind(pane);", " chBind(pane); chSwapBind(pane); invBind(pane); walkBind(pane);\n pane.querySelectorAll('[data-chnumit]').forEach(s => s.onchange = () => setNumberItem(CHG.key, s.dataset.chnumit, s.value));", 'bind', p, True)
# the drawer: Short goes on the line under the name, clear of the Navigate button on a phone
t = rep(t, " <div class=\"sub\">${esc(a.name||'')} · ${esc(a.discipline)}${(() => { const c = contractOf(a.key);", " <div class=\"sub\">${shortChip(a)} ${esc(a.name||'')} · ${esc(a.discipline)}${(() => { const c = contractOf(a.key);", 'drawer short', p, True)
k = t.find('</style>'); t = t[:k] + "/* v7.32 - which item a number counts as; Short in the drawer sits under the name */\n.chnumit{font-size:12px;padding:1px 4px;max-width:9.5rem;border-radius:6px}\n#drawer .dh > div > div:first-child .shortchip{display:none}\n#drawer .dh .sub .shortchip{margin-right:6px}\n" + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
