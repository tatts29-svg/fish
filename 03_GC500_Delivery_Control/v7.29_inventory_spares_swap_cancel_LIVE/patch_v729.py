#!/usr/bin/env python3
"""v7.29 - inventory, spares, swap and cancel. Andrew Fisher, 28 Sep 2026:
"We need an inventory, and it says how much of each we currently have in stock. More so to work out how many sub-hired
things are on site. More so again somewhere to put asset numbers that are not allocated anywhere - I have a spare Coates
portaloo on site and one spare Event Portables toilet. Can I go into P12 and change a Coates toilet for a sub-hired one.
And an option to cancel an order - if a building has been cancelled, click on it and cancel that job completely."
 - S.spares: a new synced collection (map, one document per spare), in the record's load, export, blank and merge.
 - Change deliveries: an Inventory card under the day (by trade; ordered, at locations, Coates numbered, sub-hire by
   company, no number yet, spares, total on site), the spares list (Use at a location, or x when it has left), the add
   form, and a Check list (a spare's number also on a location; a cancelled order still carrying units).
 - The Change form: Cancel this order / Put it back on (the page's own cancelDialog and setRowOff), and a Swap on every
   Coates number and sub-hire unit (for a spare, a new sub-hire unit or a Coates number; what comes out goes to spares
   unless it has left site).
 - The cancel dialog offers to put an on-site order's units in spares.
    python3 patch_v729.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function inventory(' in t: sys.exit('v7.29 already applied')
JS = open(os.path.join(here, 'inv729_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'inv729.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# the record: sync, load, export, blank, merge
t = rep(t, " units: {kind: 'map', get: () => S.units, set: v => S.units = v},",
 " units: {kind: 'map', get: () => S.units, set: v => S.units = v},\n /* v7.29 - spares: units on site that are at no location, one document each */\n spares: {kind: 'map', get: () => S.spares, set: v => S.spares = v},", 'sync', p, True)
t = rep(t, " dropPhotos: (j && j.dropPhotos) || {}, units: (j && j.units) || {},",
 " dropPhotos: (j && j.dropPhotos) || {}, units: (j && j.units) || {}, spares: (j && j.spares) || {},", 'load', p, True)
t = rep(t, " units: S.units || {},\n /* A records-less import", " units: S.units || {},\n spares: S.spares || {},\n /* A records-less import", 'export', p, True)
t = rep(t, " assetNumbers:{}, rates:{}, accRates:{}, fenceRates:{}, fenceCosts:{}, weeks:{},", " assetNumbers:{}, rates:{}, accRates:{}, fenceRates:{}, fenceCosts:{}, weeks:{}, spares:{},", 'blank', p, True)
t = rep(t, "'places', 'runRules', 'answers'].forEach(f => { out[f] = {};", "'places', 'runRules', 'answers', 'spares'].forEach(f => { out[f] = {};", 'merge', p, True)
t = rep(t, "f === 'units' ? 'the things inside' :", "f === 'units' ? 'the things inside' : f === 'spares' ? 'the spare' :", 'merge words', p, True)
# the Change form: cancel / put back
t = rep(t, " ${a._cancelled ? `<div class=\"notice warn\"><b>${esc(k)} is cancelled.</b> ${esc(rowOffWords(k))}</div>` : ''}\n <div class=\"form chfields\">",
 " ${chCancelRow(a, ro)}\n <div class=\"form chfields\">", 'cancel row', p, True)
# swap on every Coates number
t = rep(t, """<button type="button" class="chnumx" data-chnumoff="${esc(n)}"${dis} aria-label="Take ${esc(n)} off ${esc(k)}" title="Take ${esc(n)} off ${esc(k)}">×</button></li>`).join('')}</ul>`""",
 """${chSwapBtn(k, {kind: 'c', no: String(n)}, dis)}<button type="button" class="chnumx" data-chnumoff="${esc(n)}"${dis} aria-label="Take ${esc(n)} off ${esc(k)}" title="Take ${esc(n)} off ${esc(k)}">×</button></li>`).join('')}</ul>`""", 'swap c', p, True)
# and every sub-hire unit
t = rep(t, """<button type="button" class="chnumx" data-suboff="${esc(x.u.asset_no || x.u.label)}\"""",
 """${chSwapBtn(k, {kind: 's', co: x.co, no: x.u.asset_no || '', label: x.u.label || ''}, dis)}<button type="button" class="chnumx" data-suboff="${esc(x.u.asset_no || x.u.label)}\"""", 'swap s', p, True)
# the swap box, under the sub-hire box
t = rep(t, """<div class="hint">One per unit. A Coates sticker goes in Allocated asset numbers above; a supplier's sticker goes here, with their number.${hint ? ' ' + esc(hint) : ''}</div></div>`; })()}""",
 """<div class="hint">One per unit. A Coates sticker goes in Allocated asset numbers above; a supplier's sticker goes here, with their number.${hint ? ' ' + esc(hint) : ''}</div></div>`; })()}
 ${chSwapHtml(a, ro)}""", 'swap box', p, True)
# the page: the Inventory card under the day, a jump to it, and its wiring
t = rep(t, """ <div class="chside">${chFormHtml(ro)}${chAddHtml(ro)}${chChangesHtml(iso, ro)}</div>
 </div>`;""", """ <div class="chside">${chFormHtml(ro)}${chAddHtml(ro)}${chChangesHtml(iso, ro)}</div>
 </div>${invHtml(ro)}`;""", 'inventory card', p, True)
t = rep(t, """<button type="button" class="btn ghost" data-chtl="${esc(iso)}">Open on the Timeline</button>""",
 """<button type="button" class="btn ghost" data-chtl="${esc(iso)}">Open on the Timeline</button><button type="button" class="btn ghost" data-invjump>Inventory</button>""", 'jump', p, True)
t = rep(t, " chBind(pane);\n if (state.tab === 'change')", " chBind(pane); chSwapBind(pane); invBind(pane);\n if (state.tab === 'change')", 'bind', p, True)
# the cancel dialog: an on-site order's units to spares
t = rep(t, """It can be put back from the same button.</div>
 </div></div>
 <div class="df"><button class="btn primary" id="cxSave">""", """It can be put back from the same button.</div>
 ${cxSpareHtml(key)}
 </div></div>
 <div class="df"><button class="btn primary" id="cxSave">""", 'cancel dialog box', p, True)
t = rep(t, " if (setRowOff(key, true, why)) { shut(); render(); } };",
 " if (setRowOff(key, true, why)) { const sp = $('#cxSpare', d); if (sp && sp.checked) spareFromCancelled(key); shut(); render(); } };", 'cancel dialog go', p, True)
# a number typed onto a location leaves spares
t = rep(t, " CHG.clash = null; chSay(v + ' is now on ' + key + ' — it counts everywhere the page counts asset numbers');\n numberPutOn(key, v, who); bump();",
 " CHG.clash = null; chSay(v + ' is now on ' + key + ' — it counts everywhere the page counts asset numbers');\n numberPutOn(key, v, who); if (spareClaim(v, INV_COATES, who)) chSay(v + ' is now on ' + key + ' — out of spares'); bump();", 'claim c', p, True)
t = rep(t, " if (unitAdd(key, {label, asset_no: no})) chSay(key + ': ' + co + ' sub-hire' + (no ? ' no. ' + no : '') + ' recorded');",
 " if (unitAdd(key, {label, asset_no: no})) { chSay(key + ': ' + co + ' sub-hire' + (no ? ' no. ' + no : '') + ' recorded'); if (spareClaim(no, co, whoAmI())) { chSay(key + ': ' + co + ' no. ' + no + ' recorded - out of spares'); bump(); } }", 'claim s', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
