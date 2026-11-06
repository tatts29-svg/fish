#!/usr/bin/env python3
"""v7.44 sub-hired gear entry in drawers and register. Author: Andrew Fisher."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
with open(path, encoding='utf-8') as source:
    text = source.read()
if 'function subhire744DrawerHtml(' in text:
    sys.exit('v7.44 sub-hire patch already applied')
if 'function drawerTidy(' not in text:
    sys.exit('v7.44 sub-hire patch needs v7.43')
with open(os.path.join(HERE, 'subhire744_src.js'), encoding='utf-8') as source:
    js = source.read()
with open(os.path.join(HERE, 'subhire744.css'), encoding='utf-8') as source:
    css = source.read()

def change(old, new, name):
    global text
    text = rep(text, old, new, name, path, True)

change('function openAsset_held(key, opts){', js + '\nfunction openAsset_held(key, opts){', 'drawer helpers')
start = text.index('function subhireBanner(a){')
end = text.index('/* after the drawer is drawn:', start)
change(text[start:end], 'function subhireBanner(a){ return subhire744Banner(a); }\n', 'supplier banner counts')
change(' ${subhireBanner(a)}\n', ' ${subhireBanner(a)}\n ${subhire744DrawerHtml(a)}\n', 'drawer entry')
change(' drawerTidy(a); /* v7.43 */\n wireSupplied(a);', ' drawerTidy(a); /* v7.43 */\n subhire744DrawerBind(a);\n wireSupplied(a);', 'drawer handlers')
change(" const v = $('#numAdd').value.trim(); if (!v) return;\n if ((a.asset_numbers || []).includes(v))", " if (!mayWrite('an asset number')) return;\n const v = $('#numAdd').value.trim(); if (!v) return;\n if (subhireCo(a.key)) { $('#numAdd').value = ''; subhire744Many(a.key, subhireCo(a.key), v); return; }\n if ((a.asset_numbers || []).includes(v))", 'supplier number writer')
change('<p class="sub">Every unit on the job that belongs to a sub-hire company, from the delivery record as it stands. Press a location to open it on the form.</p>${body}', '<p class="sub">Every unit on the job that belongs to a sub-hire company, from the delivery record as it stands. Press a location to open it on the form.</p>${subhire744RegisterHtml(ro)}${body}', 'register entry')
change(' chBind(pane); chSwapBind(pane); invBind(pane); walkBind(pane); subhireBind(pane);', ' chBind(pane); chSwapBind(pane); invBind(pane); walkBind(pane); subhireBind(pane); subhire744RegisterBind(pane);', 'register handlers')
start = text.index('function subAdd(key, co, no){')
end = text.index('/* v7.29', start)
change(text[start:end], 'function subAdd(key, co, no){\n return subhire744One(key, co, no);\n}\n', 'shared single supplier writer')
start = text.index('function subAddMany(key, co, text){')
end = text.index('function subManyHtml(a, ro){', start)
change(text[start:end], 'function subAddMany(key, co, text){\n return subhire744Many(key, co, text);\n}\n', 'shared bulk supplier writer')
change('<div class="f"><label for="uNo">Coates asset number</label><input id="uNo" inputmode="numeric" placeholder="1322588" value="${esc(p.asset_no || \'\')}"></div>', '<div class="f"><label for="uNo">${subhireCo(ref) ? esc(subhireCo(ref)) + \' fleet number\' : \'Coates asset number\'}</label><input id="uNo" placeholder="${subhireCo(ref) ? \'their number\' : \'1322588\'}" value="${esc(p.asset_no || \'\')}"></div>', 'unit form number label')
change('<div class="f"><label for="uLab">Its name on site</label><input id="uLab" placeholder="vms3, female block, north unit…" value="${esc(p.label || \'\')}"></div>', '<div class="f"><label for="uLab">${subhireCo(ref) ? \'Recorded as\' : \'Its name on site\'}</label><input id="uLab" placeholder="vms3, female block, north unit…" value="${esc(subhireCo(ref) ? \'Sub-hire: \' + subhireCo(ref) : p.label || \'\')}"${subhireCo(ref) ? \' readonly\' : \'\'}></div>', 'unit form company')
change(" const ok = unitAdd(ref, {asset_no: f.querySelector('#uNo').value, label: f.querySelector('#uLab').value,\n sheet: f.querySelector('#uSheet').value, callout: f.querySelector('#uCall').value});", " const place = {sheet: f.querySelector('#uSheet').value, callout: f.querySelector('#uCall').value};\n const ok = subhireCo(ref) ? subhire744One(ref, subhireCo(ref), f.querySelector('#uNo').value, place)\n : unitAdd(ref, {asset_no: f.querySelector('#uNo').value, label: f.querySelector('#uLab').value, ...place});", 'unit form supplier writer')
change('.notice.subhirebanner .subhireacts{margin-top:2px}', '.notice.subhirebanner .subhireacts{margin-top:2px}\n' + css, 'sub-hire styles')
with open(path, 'w', encoding='utf-8') as target:
    target.write(text)
print('ok', path)
