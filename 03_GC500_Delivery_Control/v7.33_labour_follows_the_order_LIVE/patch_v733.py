#!/usr/bin/env python3
"""v7.33 - labour follows the order. Andrew Fisher, 29 Sep 2026: "Check all similar for bugs."
 - labourUnits: never more units than the line orders (numbers recorded on site or typed here kept first); fewer
   numbers than ordered adds a 'rest' unit for the ones with no number, charged for their count.
 - lineNumbersOf: an ancillary item (tank, pee panel, steps) loses a tie.
 - Questions: locations carrying more numbers than they ordered.
 - Inventory: a location with more than one item counts its numbers as lineNumbersOf splits them.
    python3 patch_v733.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function labourKeep(' in t: sys.exit('v7.33 already applied')
if 'function lineNumbersOf(' not in t: sys.exit('needs v7.32')
JS = open(os.path.join(here, 'guard733_src.js'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# the units
t = rep(t, """ if (u.length <= 1) return [];
 /* v7.32 — on a location with more than one item, only the numbers that count as this item */
 if (item != null) { const m = lineNumbersOf(a); if (m) return m[item] || []; }
 return u;
}""", """ if (u.length <= 1) return [];
 if (item == null) return u;
 /* v7.32 — on a location with more than one item, only the numbers that count as this item */
 const m = lineNumbersOf(a);
 let us = m ? (m[item] || []) : u;
 /* v7.33 — never more buildings than the order (P36: two numbers, one building), and the ones with no number
    yet are one more set of ticks, so a part-numbered location can still have every unit ticked */
 const q = labourLineQty(a, item);
 if (q != null && us.length > q) us = labourKeep(a, us, q);
 if (!m && us.length <= 1) return [];
 if (q != null && us.length && us.length < q) us = us.concat([LAB_REST]);
 return us;
}""", 'labourUnits', p, True)
# money: the rest unit is charged for its count
t = rep(t, """ return {total: allTicked.reduce((s, x) => s + (x.rate || 0), 0), ticked: allTicked, info: info,
 blocked: false, qty: qty, units: per, perBuilding: true};""", """ const restN = labourRestN(a, l.item, units);
 return {total: per.reduce((s, p) => s + p.ticked.reduce((t, x) => t + (x.rate || 0), 0) * (p.unit === LAB_REST ? restN : 1), 0), ticked: allTicked, info: info,
 blocked: false, qty: qty, units: per, perBuilding: true};""", 'money', p, True)
# the plan
t = rep(t, """ const q = qtyOf(l), units = labourUnits(a, l.item);
 (units.length ? units : [null]).forEach(u => {
 const info = labourLinesFor(a.key, l.discipline, l.item, a.key, u || undefined, a);
 info.lines.forEach(L => {
 const value = typeof L.rate !== 'number' ? null : u ? L.rate : (q == null ? null : L.rate * q);""", """ const q = qtyOf(l), units = labourUnits(a, l.item), restN = labourRestN(a, l.item, units);
 (units.length ? units : [null]).forEach(u => {
 const info = labourLinesFor(a.key, l.discipline, l.item, a.key, u || undefined, a);
 info.lines.forEach(L => {
 const n = u === LAB_REST ? restN : 1;
 const value = typeof L.rate !== 'number' ? null : u ? L.rate * n : (q == null ? null : L.rate * q);""", 'plan value', p, True)
t = rep(t, "slots.push({ref: a.key, branch: code, item: l.item, disc: l.discipline, line: L.name, key: L.key, unit: u, rate: L.rate, qty: u ? 1 : q, value, state, by: L.by, at: L.at});",
 "slots.push({ref: a.key, branch: code, item: l.item, disc: l.discipline, line: L.name, key: L.key, unit: u, rate: L.rate, qty: u ? n : q, value, state, by: L.by, at: L.at});", 'plan qty', p, True)
# the tick boxes: the rest unit says what it is
t = rep(t, """ ? `<div class="labunits">${units.map(u => `<div class="labunit"><div class="labunith">${esc(u)}${
 unitWordsFor(a, u) ? ' <span>' + esc(unitWordsFor(a, u)) + '</span>' : ''}</div>""", """ ? `<div class="labunits">${units.map(u => `<div class="labunit"><div class="labunith">${u === LAB_REST ? esc(labourRestN(a, l.item, units) + ' more with no number yet') : esc(u)}${
 u !== LAB_REST && unitWordsFor(a, u) ? ' <span>' + esc(unitWordsFor(a, u)) + '</span>' : ''}</div>""", 'rest label', p, True)
t = rep(t, """ units.length ? ` <span class="chip ref" title="this reference carries ${units.length} asset numbers, so each one is ticked on its own">${units.length} buildings</span>` : ''}""",
 """ units.length ? ` <span class="chip ref" title="each numbered unit is ticked on its own${units.includes(LAB_REST) ? '; the ones with no number yet are ticked together' : ''}">${(() => { const q2 = labourLineQty(a, l.item); return (q2 != null ? q2 : units.length) + (units.length === 1 ? ' building' : ' buildings'); })()}</span>` : ''}""", 'units chip', p, True)
# the tie: an ancillary item loses
t = rep(t, " room.sort((x, y) => y.o - x.o || x.i - y.i);", " room.sort((x, y) => y.o - x.o || (LAB_ANCILLARY.test(x.item) ? 1 : 0) - (LAB_ANCILLARY.test(y.item) ? 1 : 0) || x.i - y.i);", 'tie', p, True)
# questions
t = rep(t, " chk('short deliveries', () => {", """ chk('extra numbers', () => { const X = extraNumbers();
 if (X.length) add('Schedule & plant', 'sp-extra', `${X.length} location${X.length === 1 ? '' : 's'} with more asset numbers than ordered`,
 'Each number is counted as a building. Labour now counts no more buildings than the order, keeping the numbers recorded on site first - but the extra number is still against the location, and on its drop sheet.',
 'Take the wrong number off: Timeline, the day, Edit, Change, Allocated asset numbers, x.', 'plant',
 {rows: X.map(x => `${x.a.key}${x.a.name ? ' ' + x.a.name : ''}: ${x.nums.length} numbers for ${x.q} ordered - ${x.nums.map(n => n + ' (' + ((x.src[n] || []).join(', ') || 'source not said') + ')').join('; ')}`)}); });
 chk('short deliveries', () => {""", 'questions', p, True)
# inventory: numbers as the split counts them
t = rep(t, " return {t: invTypeKey(l, a), asked, onq: on ? (sup != null ? sup : asked) : 0}; }).sort((x, y) => y.asked - x.asked);\n let coates = invCoatesNums(a).length; const subs = subOf(a.key).slice();",
 " return {t: invTypeKey(l, a), item: l.item, asked, onq: on ? (sup != null ? sup : asked) : 0}; }).sort((x, y) => y.asked - x.asked);\n let coates = invCoatesNums(a).length; const subs = subOf(a.key).slice(), LM = lineNumbersOf(a), cn = new Set(invCoatesNums(a));", 'inv split 1', p, True)
t = rep(t, " const c = Math.min(coates, x.onq - s.length); coates -= c; r.coates += c; R.coates += c;",
 " const c = LM ? Math.min((LM[x.item] || []).filter(n => cn.has(String(n))).length, x.onq - s.length) : Math.min(coates, x.onq - s.length); coates -= c; r.coates += c; R.coates += c;", 'inv split 2', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
