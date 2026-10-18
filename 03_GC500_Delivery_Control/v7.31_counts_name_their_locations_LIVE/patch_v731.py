#!/usr/bin/env python3
"""v7.31 - every inventory count names its locations. Andrew Fisher, 29 Sep 2026: "When you say we are missing inventory
I need to be able to click what reference is missing it."
 - inventory() keeps, per type, the locations behind each count; the table's counts are buttons; a list under the
   table names the locations, each opening on the Change form (fixRef). New column: Still to come (ordered, not on
   site yet, or short).
 - Questions: a detail row that starts with a location opens it the same way.
    python3 patch_v731.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function invDrillHtml(' in t: sys.exit('v7.31 already applied')
if 'function walkHtml(' not in t: sys.exit('needs v7.30')
JS = open(os.path.join(here, 'drill731_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'drill731.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# inventory(): the locations behind each count
t = rep(t, "sub: {}, nonum: 0, spareC: 0, spareSub: {}, spares: 0}); return rows.get(t); };", "sub: {}, nonum: 0, spareC: 0, spareSub: {}, spares: 0, refs: {}}); return rows.get(t); };", 'row refs', p, True)
t = rep(t, """  lines.forEach(x => { const r = row(x.t); r.asked += x.asked; if (!x.onq) return; r.on += x.onq;
   const s = subs.splice(0, x.onq); s.forEach(u => { r.sub[u.co] = (r.sub[u.co] || 0) + 1; });
   const c = Math.min(coates, x.onq - s.length); coates -= c; r.coates += c; r.nonum += x.onq - s.length - c; });""",
"""  lines.forEach(x => { const r = row(x.t); r.asked += x.asked;
   const R = r.refs[a.key] || (r.refs[a.key] = {key: a.key, asked: 0, on: 0, coates: 0, sub: 0, cos: {}, nonum: 0, onsite: on}); R.asked += x.asked;
   if (!x.onq) return; r.on += x.onq; R.on += x.onq;
   const s = subs.splice(0, x.onq); s.forEach(u => { r.sub[u.co] = (r.sub[u.co] || 0) + 1; R.sub++; R.cos[u.co] = (R.cos[u.co] || 0) + 1; });
   const c = Math.min(coates, x.onq - s.length); coates -= c; r.coates += c; R.coates += c; r.nonum += x.onq - s.length - c; R.nonum += x.onq - s.length - c; });""", 'ref detail', p, True)
# the table: every count a button, a Still to come column, the list under it
i = t.find(' <div class="invwrap"><table class="invtab">'); j = t.find('</table></div>', i) + len('</table></div>')
if i < 0 or j < len('</table></div>') or t.count(' <div class="invwrap"><table class="invtab">') != 1: sys.exit('table not found once')
NEW = r""" <div class="invwrap"><table class="invtab"><thead><tr><th>Type</th><th class="num">Total on site</th><th>Sub-hire</th><th>Spare</th><th class="num">At locations</th><th class="num">Coates numbered</th><th class="num">No number yet</th><th class="num">Still to come</th><th class="num">Ordered</th></tr></thead>
 <tbody>${rows.map(r => `<tr><td>${esc(r.item)}${INV.disc === '*' ? `<span class="w"> · ${esc(r.disc)}</span>` : ''}</td><td class="num"><b>${invCell(r, 'total', r.on + r.spares)}</b></td><td>${invCell(r, 'sub', Object.keys(r.sub).length, coTxt(r.sub))}</td>
 <td>${invCell(r, 'spare', r.spares, r.spares ? [r.spareC ? 'Coates ' + r.spareC : ''].concat(Object.entries(r.spareSub).map(([c, n]) => esc(c) + ' ' + n)).filter(Boolean).join('<br>') : null)}</td>
 <td class="num">${invCell(r, 'on', r.on)}</td><td class="num">${invCell(r, 'coates', r.coates)}</td><td class="num">${invCell(r, 'nonum', r.nonum)}</td><td class="num">${invCell(r, 'togo', Math.max(0, r.asked - r.on))}</td><td class="num">${invCell(r, 'asked', r.asked)}</td></tr>`).join('') || '<tr><td colspan="9" class="norate">Nothing of this trade on the job.</td></tr>'}</tbody>
 <tfoot><tr><td>Total</td><td class="num"><b>${tot('on') + tot('spares')}</b></td><td>${sumObj('sub')}</td><td>${tot('spares')}</td><td class="num">${tot('on')}</td><td class="num">${tot('coates')}</td><td class="num">${tot('nonum')}</td><td class="num">${Math.max(0, tot('asked') - tot('on'))}</td><td class="num">${tot('asked')}</td></tr></tfoot></table></div>
 ${invDrillHtml(I)}"""
t = t[:i] + NEW + t[j:]
t = rep(t, """<div class="hint">Total on site = at locations + spares.""", """<div class="hint">Press any number to see which locations are behind it. Total on site = at locations + spares.""", 'hint', p, True)
# the wiring: a count opens its list, x closes it
t = rep(t, " pane.querySelectorAll('[data-invdisc]').forEach(b => b.onclick = () => { INV.disc = b.dataset.invdisc; render(); });",
 """ pane.querySelectorAll('[data-invdisc]').forEach(b => b.onclick = () => { INV.disc = b.dataset.invdisc; INV.drill = null; render(); });
 pane.querySelectorAll('[data-invdrill]').forEach(b => b.onclick = () => { const v = b.dataset.invdrill, k = v.lastIndexOf('|'), d = {t: v.slice(0, k), col: v.slice(k + 1)};
  INV.drill = INV.drill && INV.drill.t === d.t && INV.drill.col === d.col ? null : d; render();
  if (INV.drill) setTimeout(() => { const x = $('#invDrill'); if (x) { try { x.scrollIntoView({block: 'nearest', behavior: 'smooth'}); } catch (e) {} } }, 0); });
 pane.querySelectorAll('[data-invdrill-x]').forEach(b => b.onclick = () => { INV.drill = null; render(); });""", 'wire', p, True)
# Questions: the location at the start of a row is a button
t = rep(t, "${q.rows ? `<ul class=\"qrows\">${q.rows.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}", "${q.rows ? `<ul class=\"qrows\">${q.rows.map(r => `<li>${qRowHtml(r)}</li>`).join('')}</ul>` : ''}", 'questions rows', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
