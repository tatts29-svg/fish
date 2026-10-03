#!/usr/bin/env python3
"""v7.36 - an ordered item recorded as its own unit has its number. Andrew Fisher, 29 Sep 2026: "1328978 waste tank is
onsite, inventory says no number for this location." WC05's tank is a unit, kept out of the building numbers (v5.59);
the count now reads it as the Waste tank's number. And a location with more than one item counts every line in its
"n of q numbered", not just the first. Labour and money are untouched.
    python3 patch_v736.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function lineUnitNumbersOf(' in t: sys.exit('v7.36 already applied')
if 'function staleClaim(' not in t: sys.exit('needs v7.35')
JS = open(os.path.join(here, 'tank736_src.js'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
# locNums: every line, and the ordered items recorded as units
t = rep(t, """function locNums(a){
 if (!a || a._cancelled || a.relocation || a.rest_of || /water-filled|ground protection/i.test(a.discipline || '')) return null;
 const q = a._qtyOnTheSchedule != null ? a._qtyOnTheSchedule : (a._qtyTyped != null ? a._qtyTyped : 1);
 const units = ((a._buildingNumbers && a._buildingNumbers.length) ? a._buildingNumbers : (a.asset_numbers || [])).filter(x => /^\\d{5,8}$/.test(x));""",
 """function locNums(a){
 if (!a || a._cancelled || a.relocation || a.rest_of || /water-filled|ground protection/i.test(a.discipline || '')) return null;
 const q = locQty(a) != null ? locQty(a) : (a._qtyOnTheSchedule != null ? a._qtyOnTheSchedule : (a._qtyTyped != null ? a._qtyTyped : 1)); /* v7.36 - every line */
 const units = [...new Set(((a._buildingNumbers && a._buildingNumbers.length) ? a._buildingNumbers : (a.asset_numbers || [])).filter(x => /^\\d{5,8}$/.test(x)).concat(lineUnitNums(a)))]; /* v7.36 - and a tank it ordered */""", 'locNums', p, True)
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# the inventory: count with the tank, split by item with the tank
t = rep(t, " let coates = invCoatesNums(a).length; const subs = subOf(a.key).slice(), LM = lineNumbersOf(a), cn = new Set(invCoatesNums(a));",
 " let coates = invCountNums(a).length; const subs = subOf(a.key).slice(), LM = itemNumbersOf(a), cn = new Set(invCountNums(a)); /* v7.36 */", 'inventory', p, True)
t = rep(t, " const offOn = allAssets().filter(a => a._cancelled && (invCoatesNums(a).length || subOf(a.key).length)).map(a => ({a, nums: invCoatesNums(a),",
 " const offOn = allAssets().filter(a => a._cancelled && (invCountNums(a).length || subOf(a.key).length)).map(a => ({a, nums: invCountNums(a),", 'offOn', p, True)
# the list under a count: that item's own numbers
t = rep(t, " coates: refs.filter(x => x.coates > 0).map(x => [x, `${x.coates} Coates: ${invCoatesNums(assetOf(x.key)).join(', ')}`]),",
 " coates: refs.filter(x => x.coates > 0).map(x => [x, `${x.coates} Coates: ${invItemNums(assetOf(x.key), r.item).join(', ')}`]), /* v7.36 - this item's */", 'drill', p, True)
# the walk-around shows the tank's number with the rest
t = rep(t, " const rows = list.map(({a, c}) => { const k = a.key, own = invCoatesNums(a), subs = subOf(k),",
 " const rows = list.map(({a, c}) => { const k = a.key, own = invCountNums(a), subs = subOf(k),", 'walk', p, True)
# a cancelled order's tank goes to spares with its other units
t = rep(t, """ const type = invTypeOf(a) || '', nums = invCoatesNums(a), subs = subOf(key);
 nums.forEach(n => { invTakeOff(key, {kind: 'c', no: n}, who); spareWrite(type, INV_COATES, n, 'From cancelled ' + key, who); });""",
 """ const type = invTypeOf(a) || '', nums = invCoatesNums(a), subs = subOf(key), tk = lineUnitTypes(a), tn = {};
 nums.forEach(n => { tn[n] = invTypeOfNumber(a, n); }); /* v7.36 - each number as the item it counts as, worked out before anything comes off */
 const offUnit = n => { if (unitsOf(key).some(u => String(u.asset_no || '').trim() === n)) unitRemove(key, {asset_no: n}); }; /* v7.36 - the on-site unit record comes off with its number */
 nums.forEach(n => { invTakeOff(key, {kind: 'c', no: n}, who); offUnit(n); spareWrite(tn[n] || type, INV_COATES, n, 'From cancelled ' + key, who); });
 tk.forEach(x => { numberTakeOff(key, x.no, who); offUnit(x.no); spareWrite(x.type, INV_COATES, x.no, 'From cancelled ' + key, who); }); /* v7.36 - a tank it ordered */""", 'cancel spares', p, True)
t = rep(t, " flash((nums.length + subs.length) + ' unit' + (nums.length + subs.length === 1 ? '' : 's') + ' from cancelled ' + key + ' moved to spares by ' + who + '.');",
 " flash((nums.length + tk.length + subs.length) + ' unit' + (nums.length + tk.length + subs.length === 1 ? '' : 's') + ' from cancelled ' + key + ' moved to spares by ' + who + '.');", 'cancel said', p, True)
t = rep(t, " const nums = invCoatesNums(a), subs = subOf(key), n = nums.length + subs.length; if (!n) return '';",
 " const nums = invCountNums(a), subs = subOf(key), n = nums.length + subs.length; if (!n) return ''; /* v7.36 */", 'cancel dialog', p, True)
# releasing a cancelled, never-arrived order's planned numbers: its tank unit too
t = rep(t, "  const ns = invCoatesNums(a); ns.forEach(n => numberTakeOff(k, n, who)); bump();",
 "  const ns = invCoatesNums(a), tu = lineUnitNums(a).filter(n => !ns.includes(n)); ns.forEach(n => numberTakeOff(k, n, who)); tu.forEach(n => { numberTakeOff(k, n, who); unitRemove(k, {asset_no: n}); }); ns.push(...tu); bump();", 'release', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
