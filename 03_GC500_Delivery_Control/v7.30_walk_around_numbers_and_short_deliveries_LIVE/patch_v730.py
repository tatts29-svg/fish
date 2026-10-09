#!/usr/bin/env python3
"""v7.30 - walk-around numbers and short deliveries. Andrew Fisher, 29 Sep 2026: "I will need to go around today and get
asset numbers off Event Portables loos. Is there any way I can add this into the reference, e.g. WC11, and add a new
sub-hired toilet asset number. Also some locations like WC01 have multiple items; it says it is complete even if one did
not turn up. How can we fix."
 - Change deliveries: a Walk-around card (every location of a trade, n of q numbered, the numbers on it, one box per
   location; Add or Enter moves on to the next location still missing numbers; whose units set once at the top).
 - The Change form: What turned up, per item (the location's supplied record, as its details card writes it).
 - Short: beside the light on the day's list and the form, beside Complete, on the Timeline load line, and on Questions.
    python3 patch_v730.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function walkHtml(' in t: sys.exit('v7.30 already applied')
if 'function inventory(' not in t: sys.exit('needs v7.29')
JS = open(os.path.join(here, 'walk730_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'walk730.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# the page: walk-around card above the inventory, a jump, the wiring
t = rep(t, " </div>${invHtml(ro)}`;", " </div>${walkHtml(ro)}${invHtml(ro)}`;", 'walk card', p, True)
t = rep(t, """<button type="button" class="btn ghost" data-invjump>Inventory</button>""", """<button type="button" class="btn ghost" data-walkjump>Walk-around</button><button type="button" class="btn ghost" data-invjump>Inventory</button>""", 'jump', p, True)
t = rep(t, " chBind(pane); chSwapBind(pane); invBind(pane);", " chBind(pane); chSwapBind(pane); invBind(pane); walkBind(pane);", 'bind', p, True)
# the Change form: what turned up, above the asset numbers
t = rep(t, """ <div class="f"><label for="chNum">Allocated asset numbers</label>""", """ ${chGotHtml(a, ro)}
 <div class="f"><label for="chNum">Allocated asset numbers</label>""", 'what turned up', p, True)
# short: beside the light on the day's list, on the form head, beside Complete, on the load line
t = rep(t, """<div class="chref">${refPlate(a.key, 26)}<span class="chlt">${lightChip(a)}</span></div>""", """<div class="chref">${refPlate(a.key, 26)}<span class="chlt">${lightChip(a)}</span></div>${shortChip(a)}""", 'row short', p, True)
t = rep(t, """<div class="sub">${esc(a.discipline || '')} · ${esc((a.item_types || []).join(', '))} ${lightChip(a, {full: true})}</div></div>""", """<div class="sub">${esc(a.discipline || '')} · ${esc((a.item_types || []).join(', '))} ${lightChip(a, {full: true})}${shortChip(a)}</div></div>""", 'form short', p, True)
t = rep(t, """ return `<span class="tick" title="${esc(title)}" aria-label="${esc(title)}">✓ Complete</span>`;""", """ return `<span class="tick" title="${esc(title)}" aria-label="${esc(title)}">✓ Complete</span>${shortChip(a)}`;""", 'done short', p, True)
t = rep(t, """ if (d.steps) t.push(`<i class="ld-tk sp" title="Steps installed">${stepsGlyph(12)}</i>`);""", """ if (d.steps) t.push(`<i class="ld-tk sp" title="Steps installed">${stepsGlyph(12)}</i>`);
 { const sw = shortWords(a); if (sw) t.push(`<i class="ld-tk sh" title="Short: ${esc(sw)}">short</i>`); }""", 'load line short', p, True)
# questions
t = rep(t, " QHIST.forEach(([id, st, title, known, need, go]) =>", """ chk('short deliveries', () => { const L = allAssets().map(a => ({a, w: shortWords(a)})).filter(x => x.w);
 if (L.length) add('Schedule & plant', 'sp-short', `${L.length} location${L.length === 1 ? '' : 's'} short - something did not turn up`,
 'What turned up was counted and is less than the order. It stays here until the rest arrives or the order is changed.',
 'Chase the missing units, or change the order: Timeline, the day, Edit, Change, What turned up.', 'plant', {rows: L.map(x => `${x.a.key}${x.a.name ? ' ' + x.a.name : ''}: ${x.w}`)}); });
 QHIST.forEach(([id, st, title, known, need, go]) =>""", 'questions', p, True)
# the inventory's trade chips: the one showing goes first, so a phone's scrolling row shows it
t = rep(t, " const chips = [['*', 'Everything']].concat(discs.map(d => [d, d]))", " const chips = (INV.disc !== '*' ? [[INV.disc, INV.disc], ['*', 'Everything']] : [['*', 'Everything']]).concat(discs.filter(d => d !== INV.disc).map(d => [d, d]))", 'inv chips', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
