#!/usr/bin/env python3
"""v7.34 - the rest of an order on another day. Andrew Fisher, 29 Sep 2026, WC01's accessible toilet: "how do we get this
as not turned up, or push it to a next-day delivery?" A follow-up reference (WC01-R1) carries the short item's delivery on
its own day - Timeline, light, driver and install sheets, the location's map spot - with no charge lines and no money of
its own; the order, number and install stay on the parent, and a follow-up ticked on site counts as arrived there.
    python3 patch_v734.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function bookRest(' in t: sys.exit('v7.34 already applied')
if 'function labourKeep(' not in t: sys.exit('needs v7.33')
JS = open(os.path.join(here, 'rest734_src.js'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# a follow-up carries no order of its own: no charge lines, no money, no count
t = rep(t, "function chargeLines(a){\n if (a.charge_lines && a.charge_lines.length) return a.charge_lines;", "function chargeLines(a){\n if (a && a.rest_of) return []; /* v7.34 — a follow-up delivery: its order is on the parent */\n if (a.charge_lines && a.charge_lines.length) return a.charge_lines;", 'lines', p, True)
t = rep(t, "function assetTotal(a){\n const span = chargeSpanOf(a);", "function assetTotal(a){\n if (a && a.rest_of) return {lines: [], base: 0, accessories: 0, labour: 0, labour_any: false, known: 0, transport: 0, transport_known: true, accessories_known: 0, total: 0}; /* v7.34 */\n const span = chargeSpanOf(a);", 'total', p, True)
t = rep(t, " if (!a || a._cancelled || a.relocation || /water-filled|ground protection/i.test(a.discipline || '')) return null;", " if (!a || a._cancelled || a.relocation || a.rest_of || /water-filled|ground protection/i.test(a.discipline || '')) return null;", 'locNums', p, True)
# a follow-up ticked on site counts as arrived on the parent
t = rep(t, " const g = r.qty_supplied != null && String(r.qty_supplied).trim() !== '' && Number.isFinite(Number(r.qty_supplied)) ? Number(r.qty_supplied) : null;\n return {item: r.asked, q, g}; }).filter(x => x.q != null && x.g != null && x.g < x.q);",
 " const g0 = r.qty_supplied != null && String(r.qty_supplied).trim() !== '' && Number.isFinite(Number(r.qty_supplied)) ? Number(r.qty_supplied) : null, g = g0 == null ? null : g0 + restArrived(a, r.asked);\n return {item: r.asked, q, g}; }).filter(x => x.q != null && x.g != null && x.g < x.q);", 'short', p, True)
t = rep(t, "function shortWords(a){ return shortOf(a).map(x => `${x.item} ${x.g} of ${x.q}`).join(', '); }",
 "function shortWords(a){ return shortOf(a).map(x => { const pd = restPending(a, x.item); return `${x.item} ${x.g} of ${x.q}` + (pd.length ? ' - rest due ' + pd.map(y => { const r = assetOf(y.key), d = r ? effectiveDates(r).in : null; return (d ? chShort(d) : 'no day') + ' (' + y.key + ')'; }).join(', ') : ''); }).join(', '); }", 'short words', p, True)
t = rep(t, "function noneArrived(a, item){ const r = itemRows(a).find(x => x.asked === item); return !!(r && r.qty_supplied != null && String(r.qty_supplied).trim() !== '' && Number(r.qty_supplied) === 0); }",
 "function noneArrived(a, item){ const r = itemRows(a).find(x => x.asked === item); return !!(r && r.qty_supplied != null && String(r.qty_supplied).trim() !== '' && Number(r.qty_supplied) + restArrived(a, item) === 0); }", 'none arrived', p, True)
t = rep(t, " const room = L.map((l, i) => { const r = rows.find(x => x.asked === l.item) || {}, g = r.qty_supplied != null && String(r.qty_supplied).trim() !== '' ? Number(r.qty_supplied) : null;",
 " const room = L.map((l, i) => { const r = rows.find(x => x.asked === l.item) || {}, g = r.qty_supplied != null && String(r.qty_supplied).trim() !== '' ? Number(r.qty_supplied) + restArrived(a, l.item) : null;", 'room', p, True)
t = rep(t, " return {t: invTypeKey(l, a), item: l.item, asked, onq: on ? (sup != null ? sup : asked) : 0}; })", " return {t: invTypeKey(l, a), item: l.item, asked, onq: on ? (sup != null ? sup + restArrived(a, l.item) : asked) : 0}; })", 'inventory', p, True)
# What turned up: a follow-up counts; a short line offers Book it
t = rep(t, " const st = g == null ? '<span class=\"norate\">not recorded</span>' : g < q ? `<span class=\"chip act\">short ${q - g}</span>` : g > q ? `<span class=\"chip cand\">${g - q} extra</span>` : '<span class=\"chip ok\">all here</span>';\n return `<tr><td>${esc(l.item)}</td><td class=\"num\">${q}</td><td class=\"num\"><input type=\"number\" min=\"0\" step=\"1\" inputmode=\"numeric\" data-chgot=\"${esc(l.item)}\" value=\"${g == null ? '' : g}\" placeholder=\"${q}\" aria-label=\"How many ${esc(l.item)} arrived at ${esc(a.key)}\"${dis}></td><td>${st}</td></tr>`; }).join('')}",
 " const ga = g == null ? null : g + restArrived(a, l.item), st = ga == null ? '<span class=\"norate\">not recorded</span>' : ga < q ? `<span class=\"chip act\">short ${q - ga}</span>` : ga > q ? `<span class=\"chip cand\">${ga - q} extra</span>` : '<span class=\"chip ok\">all here</span>';\n return `<tr><td>${esc(l.item)}</td><td class=\"num\">${q}</td><td class=\"num\"><input type=\"number\" min=\"0\" step=\"1\" inputmode=\"numeric\" data-chgot=\"${esc(l.item)}\" value=\"${g == null ? '' : g}\" placeholder=\"${q}\" aria-label=\"How many ${esc(l.item)} arrived at ${esc(a.key)}\"${dis}></td><td>${st}</td></tr>` + (ga != null && (ga < q || restPending(a, l.item).length) ? chRestRow(a, l, q, g, ro) : ''); }).join('')}", 'got rows', p, True)
t = rep(t, " <div class=\"hint\">Blank means nobody has counted it. If one did not turn up, put what did arrive - ${esc(a.key)} shows <b>Short</b> on the Timeline and in Questions until the rest arrives.</div></div>`;",
 " <div class=\"hint\">Blank means nobody has counted it. If one did not turn up, put what did arrive - ${esc(a.key)} shows <b>Short</b> on the Timeline and in Questions. <b>Book it</b> puts the rest on a day of its own as a follow-up delivery; when that is ticked on site it counts here, so leave this box as it is.</div></div>`;", 'got hint', p, True)
t = rep(t, " ${chCancelRow(a, ro)}", " ${chCancelRow(a, ro)}${restNotice(a)}", 'rest notice', p, True)
t = rep(t, " pane.querySelectorAll('[data-chnumit]').forEach(s => s.onchange = () => setNumberItem(CHG.key, s.dataset.chnumit, s.value));",
 " pane.querySelectorAll('[data-chnumit]').forEach(s => s.onchange = () => setNumberItem(CHG.key, s.dataset.chnumit, s.value));\n pane.querySelectorAll('[data-chrest]').forEach(b => b.onclick = () => { const it = b.dataset.chrest, d = [...pane.querySelectorAll('[data-chrestday]')].find(x => x.dataset.chrestday === it); bookRest(CHG.key, it, d ? d.value : ''); });", 'bind', p, True)
# the follow-up takes the location's spot on the master plan
t = rep(t, "function buildAllAssets(){\n const extra = (S.added || []).map(a => Object.assign({", "function buildAllAssets(){\n try { (S.added || []).forEach(a => { if (a && a.rest_of && !MASTER_LOC[a.key] && MASTER_LOC[a.rest_of]) MASTER_LOC[a.key] = MASTER_LOC[a.rest_of]; }); } catch (e) {} /* v7.34 */\n const extra = (S.added || []).map(a => Object.assign({", 'master loc', p, True)
k = t.find('</style>'); t = t[:k] + "/* v7.34 - the rest of an order */\n.chrestr td{background:var(--tint);font-size:12.5px}\n.chresto{display:inline-flex;gap:6px;align-items:center;margin-right:12px}\n.chrestb{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center}\n.chrestb input{font-size:14px}\n.chrestn{margin:8px 0}\n" + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
