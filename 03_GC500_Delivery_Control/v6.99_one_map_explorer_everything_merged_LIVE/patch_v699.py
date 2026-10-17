#!/usr/bin/env python3
"""v6.99 - ONE MAP: the Map explorer.

Andrew Fisher, 27 Sep 2026: "Everything in 3d proof should be merged into plan on satellite.. satellite 3d and satellite
pinned if its not in planned on satellite it needs to be in there. When u tap maps. It takes u directly into satellite
explorer. So maybe change the maps to map.explorer or something maybe. We dont wanna double up on info in here."

- The tab is "Map explorer" and it is the explorer and nothing else: no Satellite · pins, no Satellite · 3D, no 3D proof
  beside it. Their parts are inside the explorer (explorer-merge.js): 3D is a mode there (Plan / Sat + plan / Satellite /
  3D, with the model's Auto / Ultra (4K) / Light), and the reference card that Satellite · pins had - what it is, its
  trade, where the delivery stands, the master-plan close-up, who pinned it on the ground, Open.
- Anything that used to open one of those views opens the explorer instead: an old #sheet/__satellite or
  #sheet/__satellite3d link, a pin menu's satellite / 3D / explorer items, a "3D proof" or "Plan on satellite" button
  anywhere in the page. The Coates Way overlay no longer offers them as pages of its own.
- gc500PlanCard(key): the card's facts, from the record, for the explorer.
Build on v6.98.   python3 patch_v699.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

JS = r"""/* v6.99 - one map: the Map explorer (see patch_v699.py) */
window.gc500PlanCard = function(key){
 try {
  const a = allAssets().find(x => x.key === key); if (!a) return null;
  const m = typeof MASTER_LOC !== 'undefined' ? MASTER_LOC[key] : null;
  let img = m && m.img && DATA.media && typeof DATA.media[m.img[0]] === 'string' ? DATA.media[m.img[0]] : null;
  if (img) { try { img = new URL(img, location.href).href; } catch (e) {} }
  let st = 'unknown'; try { st = deliveryView(a).semantic || 'unknown'; } catch (e) {}
  const words = {'on site': 'On site', 'in transit': 'In transit', 'not on site': 'Not on site', 'unknown': 'No delivery record'};
  const cols = {'on site': '#39e07a', 'in transit': '#ffb000', 'not on site': '#ff4d4d', 'unknown': '#9aa3ad'};
  let pinned = '';
  try { const p = satBoardPins().find(x => (x.key === key || x.ref === key) && !/master plan|\bD0\d\d-|drawing/i.test(String(x.by || ''))); if (p) pinned = 'Pinned on the ground by ' + (p.by || 'unnamed') + (p.at ? ', ' + fmtStamp(p.at) : '') + ((p.of || 1) > 1 ? ' · ' + p.of + ' pins' : ''); } catch (e) {}
  return {name: a.name || a.item || '', status: words[st] || st, statusColour: cols[st] || '#9aa3ad', img, pinned, assets: (a.asset_numbers || []).join(', '), open: true};
 } catch (e) { return null; }
};
/* the explorer, from anywhere in the page, in 2D or 3D */
function expOpen2d(){ if (!expOn()) return false; state.sheet = SAT_EXPLORER; state.mapMasterSeen = true; go('map'); renderMap(); return true; }
function expOpen3d(key){ EXP.mode3d = true; if (key) return expFind(key); if (!expOn()) return false; state.sheet = SAT_EXPLORER; state.mapMasterSeen = true; go('map'); renderMap(); expFlush3d(); return true; }
function expFlush3d(){
 if (!EXP.mode3d) return;
 try { const w = EXP.frame && EXP.frame.contentWindow; if (w && w.__ready && w.GC500Explorer && typeof w.GC500Explorer.mode3d === 'function') { w.GC500Explorer.mode3d(true); EXP.mode3d = false; return; } } catch (e) {}
 setTimeout(expFlush3d, 250);
}
"""

CSS = """
/* v6.99 - one map: nothing beside the explorer, and nothing elsewhere that opens a second map */
#pane-map .maptools [data-sheet="__satellite"],#pane-map .maptools [data-sheet="__satellite3d"],#pane-map [data-mopen="proof3d"]{display:none !important}
#machine [data-mpage="explorer"],#machine [data-mpage="proof3d"]{display:none !important}
.exptools:empty{display:none}
.expcard{padding:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important}
.expcard .expwrap{border-radius:12px}
"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'gc500PlanCard' in t: sys.exit('v6.99 already applied')
    if 'SAT_EXPLORER' not in t: sys.exit('apply v6.98 first')
    t = rep(t, "function expTools(){", JS + "function expTools(){", 'code', path, need)
    # the tab's own toolbar: the explorer is the map; only full screen stays beside it
    t = rep(t, """ return `${liveMapPossible() ? `<button class="btn sheetbtn satbtn" data-sheet="${SAT_BOARD}">Satellite · pins</button>` : ''}
 ${sat3dPossible() ? `<button class="btn sheetbtn satbtn" data-sheet="${SAT_3D}">Satellite · 3D</button>` : ''}
 <button class="btn sheetbtn satbtn primary" data-sheet="${SAT_EXPLORER}" aria-pressed="true">Plan on satellite</button>
 <button class="btn sheetbtn satbtn" type="button" data-mopen="proof3d">3D proof</button>
 <button class="btn expfullbtn" type="button" id="expFull" aria-pressed="false" title="Full screen (Esc to leave)">Full screen</button>`;""",
            """ return '';""", 'tools', path, need)
    # the explorer fills what is left of the screen below the tabs, exactly, so its whole map and its card are in view
    t = rep(t, " w.style.height = Math.max(phone ? 440 : 520, Math.round(vh - (phone ? 96 : 118))) + 'px';",
            " const mn = document.querySelector('main'), top = w.getBoundingClientRect().top + (mn ? mn.scrollTop : 0) + (window.scrollY || 0);   /* v6.99 */\n"
            " w.style.height = Math.round(phone ? Math.max(440, vh - 64) : Math.max(480, vh - top - 12)) + 'px';", 'size', path, need)
    # 3D, when asked for, once the explorer is there
    t = rep(t, " expSize(); expFlush();\n}", " expSize(); expFlush(); expFlush3d();\n}", 'render 3d', path, need)
    # old links to the other views land in the explorer; a drawing sheet elsewhere still opens as a sheet
    t = rep(t, " if (state.sheet === SAT_EXPLORER && expOn()) { renderExplorerTab(); return; }   /* v6.98 */",
            " if ((state.sheet === SAT_BOARD || state.sheet === SAT_3D) && expOn()) { if (state.sheet === SAT_3D) EXP.mode3d = true; state.sheet = SAT_EXPLORER; }   /* v6.99 - one map */\n"
            " if (state.sheet === SAT_EXPLORER && expOn()) { renderExplorerTab(); return; }   /* v6.98 */", 'redirect', path, need)
    # a "3D proof" or "Plan on satellite" button anywhere opens the explorer, not the overlay
    t = rep(t, "function machineOpen(kind){",
            "function machineOpen(kind){\n if ((kind === 'proof3d' || kind === 'explorer') && expOn()) { if (kind === 'proof3d') expOpen3d(MACHINE.find || null); else if (MACHINE.find) expFind(MACHINE.find); else expOpen2d(); MACHINE.find = null; return; }   /* v6.99 - one map */", 'overlay', path, need)
    # a pin's menu: the satellite view and the 3D proof are the explorer now
    t = rep(t, "else if (act === 'sat') { mapLocate(place.sheet.key, place.label, key, {marker: place.marker}); state.fview = 'map'; renderPass(); }",
            "else if (act === 'sat') { if (!expFind(key)) { mapLocate(place.sheet.key, place.label, key, {marker: place.marker}); state.fview = 'map'; renderPass(); } }", 'pin sat', path, need)
    t = rep(t, "else if (act === 'proof3d') { machineOpen('proof3d'); }",
            "else if (act === 'proof3d') { if (!expOpen3d(key)) machineOpen('proof3d'); }", 'pin 3d', path, need)
    # the tab's name
    old = "['map','Map']"
    if t.count(old) != 1: sys.exit('tab name: %d' % t.count(old))
    t = t.replace(old, "['map','Map explorer']")
    k = t.find('</style>'); t = t[:k] + CSS + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
