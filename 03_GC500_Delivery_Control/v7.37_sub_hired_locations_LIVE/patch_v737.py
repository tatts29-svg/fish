#!/usr/bin/env python3
"""v7.37 - sub-hired locations. Andrew Fisher, 29 Sep 2026: "I want an option when I go into, e.g., WC41 to clearly say
this is a sub-hired unit, then it removes anything to do with Coates - with an option to do so. ... Make sure this is
easy, and define sub-hired gear and where it is."
 - S.subhire: a new synced collection (map, one document per location): whose gear, who marked it, when, and any Coates
   numbers taken off. In the record's load, export, blank and merge.
 - Change form: "This location is sub-hired..." (asks first: the company, and whether to take its Coates numbers off -
   to spares if it is on site); SUB-HIRED badge; no Coates number box on a sub-hired location; Add many at once.
 - Short fleet numbers (1-12 characters) for a sub-hire company; Coates numbers unchanged.
 - Walk-around: a sub-hired location records its units as its company whatever is set at the top, and shows the badge.
 - Driver and install sheets: a sub-hired location with no unit recorded yet says so.
 - Sub-hire register under the inventory; a Sub-hire button beside Inventory.
    python3 patch_v737.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function subhireOf(' in t: sys.exit('v7.37 already applied')
if 'function lineUnitNumbersOf(' not in t: sys.exit('needs v7.36')
JS = open(os.path.join(here, 'sub737_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'sub737.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# the record: sync, load, export, blank, merge
t = rep(t, " spares: {kind: 'map', get: () => S.spares, set: v => S.spares = v},",
 " spares: {kind: 'map', get: () => S.spares, set: v => S.spares = v},\n /* v7.37 - sub-hired locations: one document per location, whose gear it is */\n subhire: {kind: 'map', get: () => S.subhire, set: v => S.subhire = v},", 'sync', p, True)
t = rep(t, " spares: (j && j.spares) || {},", " spares: (j && j.spares) || {}, subhire: (j && j.subhire) || {},", 'load', p, True)
t = rep(t, " spares: S.spares || {},\n", " spares: S.spares || {},\n subhire: S.subhire || {},\n", 'export', p, True)
t = rep(t, " weeks:{}, spares:{},", " weeks:{}, spares:{}, subhire:{},", 'blank', p, True)
t = rep(t, "'answers', 'spares'].forEach(f => { out[f] = {};", "'answers', 'spares', 'subhire'].forEach(f => { out[f] = {};", 'merge', p, True)
t = rep(t, "f === 'spares' ? 'the spare' :", "f === 'spares' ? 'the spare' : f === 'subhire' ? 'the sub-hired location' :", 'merge words', p, True)
# short fleet numbers for a sub-hire company
t = rep(t, " if (asset_no && !/^[A-Za-z0-9-]{3,12}$/.test(asset_no)) { flash('An asset number is digits, sometimes with letters — 1322588, not ' + asset_no + '.'); return false; }",
 " if (asset_no && !(SUB_RX.test(label) ? /^[A-Za-z0-9-]{1,12}$/ : /^[A-Za-z0-9-]{3,12}$/).test(asset_no)) { flash('An asset number is digits, sometimes with letters — 1322588, not ' + asset_no + '.'); return false; } /* v7.37 - a sub-hire fleet number can be short */", 'unitAdd', p, True)
t = rep(t, " if (no && !/^[A-Za-z0-9-]{3,12}$/.test(no)) return {err: 'An asset number is digits, sometimes with letters - 1195658, not ' + no + '.'};",
 " if (no && !subNoRx(co).test(no)) return {err: 'An asset number is digits, sometimes with letters - 1195658, not ' + no + '.'}; /* v7.37 */", 'spareCheck', p, True)
# the walk-around: a sub-hired location records as its company
t = rep(t, " const co = String(WALK.co || '').trim().replace(/\\s+/g, ' ');", " const co = String(subhireCo(key) || WALK.co || '').trim().replace(/\\s+/g, ' '); /* v7.37 - a sub-hired location is its company's */", 'walk co', p, True)
t = rep(t, " if (n && !/^[A-Za-z0-9-]{3,12}$/.test(n)) { flash('An asset number is digits, sometimes with letters - ' + n + ' does not look like one.'); return false; }",
 " if (n && !subNoRx(co).test(n)) { flash('An asset number is digits, sometimes with letters - ' + n + ' does not look like one.'); return false; }", 'walk rx', p, True)
t = rep(t, "<span class=\"chip ${c.n < c.q ? 'act' : 'ok'}\">${c.n} of ${c.q}</span>${shortChip(a)}</div>",
 "<span class=\"chip ${c.n < c.q ? 'act' : 'ok'}\">${c.n} of ${c.q}</span>${shortChip(a)}${subhireChip(k)}</div>", 'walk chip', p, True)
t = rep(t, "placeholder=\"${WALK.co === INV_COATES ? 'Coates no.' : 'their no.'} at ${esc(k)}\" aria-label=\"${esc(WALK.co)} asset number at ${esc(k)}\"",
 "placeholder=\"${subhireCo(k) ? esc(subhireCo(k)) + ' no.' : WALK.co === INV_COATES ? 'Coates no.' : 'their no.'} at ${esc(k)}\" aria-label=\"${esc(subhireCo(k) || WALK.co)} asset number at ${esc(k)}\"", 'walk box', p, True)
t = rep(t, "${WALK.co !== INV_COATES ? `<button type=\"button\" class=\"btn ghost sm\" data-wknone=",
 "${(subhireCo(k) || WALK.co) !== INV_COATES ? `<button type=\"button\" class=\"btn ghost sm\" data-wknone=", 'walk none', p, True)
# the Change form
t = rep(t, "<div class=\"chmeta\"><span>Due in <b>", "<div class=\"chmeta\">${subhireChip(a.key)}<span>Due in <b>", 'form badge', p, True)
t = rep(t, " <div class=\"chdrow\"><input id=\"chNum\" inputmode=\"numeric\" autocomplete=\"off\" placeholder=\"add a Coates asset number\"${dis}><button type=\"button\" class=\"btn\" id=\"chNumAdd\"${dis}>Add</button></div>",
 " ${subhireCo(k) ? `<p class=\"norate\">Sub-hired location (${esc(subhireCo(k))}) - no Coates number here. Record the fleet numbers under Sub-hire below.</p>` : `<div class=\"chdrow\"><input id=\"chNum\" inputmode=\"numeric\" autocomplete=\"off\" placeholder=\"add a Coates asset number\"${dis}><button type=\"button\" class=\"btn\" id=\"chNumAdd\"${dis}>Add</button></div>`}", 'form coates box', p, True)
t = rep(t, "<div class=\"f chsub\"><label for=\"chSubCo\">Sub-hire</label>", "<div class=\"f chsub\"><label for=\"chSubCo\">Sub-hire</label>${subhireAskHtml(a, ro)}", 'form ask', p, True)
t = rep(t, "value=\"${esc(cos[0] || '')}\"${dis}><datalist id=\"chSubCos\">", "value=\"${esc(subhireCo(k) || cos[0] || '')}\"${dis}><datalist id=\"chSubCos\">", 'form co', p, True)
t = rep(t, "<input id=\"chSubNo\" autocomplete=\"off\" placeholder=\"their asset number\"${dis}><button type=\"button\" class=\"btn\" id=\"chSubAdd\"${dis}>Add</button></div>",
 "<input id=\"chSubNo\" autocomplete=\"off\" placeholder=\"their asset number\"${dis}><button type=\"button\" class=\"btn\" id=\"chSubAdd\"${dis}>Add</button></div>${subManyHtml(a, ro)}", 'form many', p, True)
# the sheets
t = rep(t, "(sub ? '<span>Subhired · no Coates number</span>' : '')",
 "(subhireCo(r.a.key) ? `<span class=\"dp-sub\">Sub-hire · ${esc(subhireCo(r.a.key))} · no Coates number</span>` : sub ? '<span>Subhired · no Coates number</span>' : '')", 'sheets', p, True)
# Questions: say it is a sub-hire's fleet numbers that are missing
t = rep(t, "{rows: L.map(x => `${x.a.key}${x.a.name ? ' ' + x.a.name : ''}: ${x.c.n} of ${x.c.q} numbered`)}",
 "{rows: L.map(x => `${x.a.key}${x.a.name ? ' ' + x.a.name : ''}: ${x.c.n} of ${x.c.q} numbered${subhireCo(x.a.key) ? ' - sub-hired ' + subhireCo(x.a.key) + ', their fleet numbers' : ''}`)}", 'questions', p, True)
# the page: the register under the inventory, a button to it, and the wiring
t = rep(t, "</div>${walkHtml(ro)}${invHtml(ro)}`;", "</div>${walkHtml(ro)}${invHtml(ro)}${subRegHtml(ro)}`;", 'register', p, True)
t = rep(t, "data-invjump>Inventory</button>", "data-invjump>Inventory</button><button type=\"button\" class=\"btn ghost\" data-subjump>Sub-hire</button>", 'jump', p, True)
t = rep(t, " chBind(pane); chSwapBind(pane); invBind(pane); walkBind(pane);",
 " chBind(pane); chSwapBind(pane); invBind(pane); walkBind(pane); subhireBind(pane);\n pane.querySelectorAll('[data-subjump]').forEach(b => b.onclick = () => { const c = $('#subRegCard'); if (c) { try { c.scrollIntoView({block: 'start', behavior: 'smooth'}); } catch (e) { c.scrollIntoView(); } } });", 'bind', p, True)
# the walk-around lists a company's numbers once, not the company before every number
t = rep(t, """${subs.map(x => ` <span class="wksub">${esc(x.co)}${x.no ? ' <span class="mono">' + esc(x.no) + '</span>' : ' (no number)'}</span>`).join('')}""",
 """${[...new Set(subs.map(x => x.co))].map(co => ` <span class="wksub">${esc(co)}: ${subs.filter(x => x.co === co).map(x => x.no ? '<span class="mono">' + esc(x.no) + '</span>' : '(no number)').join(' ')}</span>`).join('')}""", 'walk group', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
