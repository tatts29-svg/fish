#!/usr/bin/env python3
"""v7.27 - every location carries the asset number of each unit on it. Andrew Fisher, 28 Sep 2026, after WC06 (Race Admin)
turned out to have 1 of its 2 toilets: "6 is the only short. Locations should have asset numbers."
 - Change deliveries: each line says "1 of 2" beside its asset numbers when it has fewer numbers than units.
 - Questions: one standing item, "On site, asset numbers missing", naming each on-site location and its count. Bulk items
   that carry no individual numbers (water-filled barriers, ground protection) are left out. It clears itself as the
   numbers go in; a location still short after its numbers are read is a short delivery, as WC06 was.
    python3 patch_v727.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function locNums(' in t: sys.exit('v7.27 already applied')
JS = r"""/* v7.27 - how many units a location has and how many of them carry a number (bulk items with no individual numbers are not counted) */
function locNums(a){
 if (!a || a._cancelled || a.relocation || /water-filled|ground protection/i.test(a.discipline || '')) return null;
 const q = a._qtyOnTheSchedule != null ? a._qtyOnTheSchedule : (a._qtyTyped != null ? a._qtyTyped : 1);
 const units = ((a._buildingNumbers && a._buildingNumbers.length) ? a._buildingNumbers : (a.asset_numbers || [])).filter(x => /^\d{5,8}$/.test(x));
 return {q: q, n: Math.min(units.length, q)};
}
"""
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot')
t = rep(t, "function questionsList(){", JS + "function questionsList(){", 'code', p, True)
t = rep(t, " QHIST.forEach(([id, st, title, known, need, go]) => { if (st !== QH_DONE)",
 """ chk('asset numbers', () => { const L = allAssets().filter(a => (S.delivery[a.key] || {}).state === 'on site').map(a => ({a, c: locNums(a)})).filter(x => x.c && x.c.n < x.c.q);
  if (L.length) add('Schedule & plant', 'sp-nums', `${L.length} location${L.length === 1 ? '' : 's'} on site with asset numbers missing`,
   'Every location should carry the number of each unit on it - that is how a short delivery shows up (WC06 Race Admin was found this way on 28 Sep: 1 toilet of 2). A sub-hire may have no Coates number; read its fleet number instead.',
   'Read the number off each unit and add it: Timeline, the day, Edit, Change, Asset numbers. If a location is still short after that, the unit is not there.', 'plant',
   {rows: L.map(x => `${x.a.key}${x.a.name ? ' ' + x.a.name : ''}: ${x.c.n} of ${x.c.q} numbered`)}); });
 QHIST.forEach(([id, st, title, known, need, go]) => { if (st !== QH_DONE)""", 'question', p, True)
t = rep(t, """ <span>Asset no. <b>${nums.length ? esc(nums.join(', ')) : '<span class="norate">none yet</span>'}</b></span>""",
 """ <span>Asset no. <b>${nums.length ? esc(nums.join(', ')) : '<span class="norate">none yet</span>'}</b>${(c => c && c.q > 1 || (c && c.n < c.q) ? ` <span class="chip ${c.n < c.q ? 'act' : 'ok'}" title="units at this location that carry an asset number">${c.n} of ${c.q}</span>` : '')(locNums(a))}</span>""", 'row count', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
