#!/usr/bin/env python3
"""v6.96 - the Map tab opens on Satellite · 3D (#sheet/__satellite3d), not the master plan, and its buttons are
exactly Satellite · pins, Satellite · 3D, Plan on satellite, 3D proof - once each, on a desktop and on a phone.
Andrew, 27 Sep 2026: "Maps is meant to open #sheet/__satellite3d" with the four buttons
Satellite · pins, Satellite · 3D, Plan on satellite, 3D proof - "It should not got to this view" (the master plan).
"And make sure we cover everything here dont double up any": the Master plan button is dropped (it doubles "Plan"
inside Plan on satellite, which carries Plan / Sat + plan / Satellite); a search that lands on the master still
goes there. On a phone the sheet drop-down (Master plan, pins, 3D - no Plan on satellite, no 3D proof) gives way
to the same four buttons, two by two.
A link or a search that asks for a sheet still goes there; where 3D can't run the map opens on the satellite pins.
On its own against v6.90 (the v6.93 map patch carries the same line).   python3 patch_v696.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


PLAN_ITEMS = r"""/* v6.96 - Plan on satellite opens inside this page and asks it for the master plan's own references and layers, so
   its numbers are the Map's numbers (Andrew, 27 Sep 2026: "Numbers here are wrong" - it counted D001's printed labels,
   which never carry the generators, light towers or barriers). Same record (cancellations and moves included), same
   places, same counts: the Trade row is discBar's population, the layers are the master's own markers. */
window.gc500PlanItems = function(){
 const sh = (DATA.sheets || []).find(s => s.master); if (!sh) return null;
 const placed = a => MASTER_LOC[a.key] && MASTER_LOC[a.key].pt;
 const live = allAssets().filter(a => placed(a) && !a._cancelled);
 const trades = [...new Set(live.map(a => a.discipline))].sort().map(d => { const n = live.filter(a => a.discipline === d).length, u = discUnit(d);
  return {name: d, n, count: u.one === 'asset' ? String(n) : discCount(d, n)}; });
 const items = live.map(a => { const m = MASTER_LOC[a.key]; return {key: a.key, trade: a.discipline, name: a.name || a.product || '', pt: m.pt, sec: m.sec || '', assets: (a.asset_numbers || []).join(', ')}; });
 const unplaced = allAssets().filter(a => !a._cancelled && !placed(a)).map(a => ({key: a.key, trade: a.discipline, name: a.name || a.product || '', drawing: a.drawing || ''}));
 const layers = MAP_LAYERS.map(([id, name, why]) => { const all = (sh.markers || []).filter(m => m.layer === id);
  return {id, name, why, n: all.length, marks: all.filter(m => Number.isFinite(m.fx) && Number.isFinite(m.fy)).map(m => ({face: String(m.face || m.label || ''), name: String(m.label || ''), note: String(m.note || ''), pt: [m.fx, m.fy]}))}; }).filter(l => l.n);
 return {v: 1, trades, items, unplaced, layers};
};
"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'mapBarSheets' in t: sys.exit('v6.96 already applied')
    # the four buttons, once each: drawing sheets other than the master still show when a search lands on one
    t = rep(t, "function mapSheetsShown(sh){", "function mapBarSheets(sh){ return mapSheetsShown(sh).filter(s => !s.master); }   /* v6.96 - the Master plan doubles Plan on satellite's Plan */\n" + PLAN_ITEMS + "function mapSheetsShown(sh){", 'bar sheets', path, need)
    a_ = " ${mapSheetsShown(typeof sh === 'undefined' ? null : sh).map(s => `<button class=\"btn sheetbtn"
    if t.count(a_) != 3: sys.exit('sheet button rows: %d' % t.count(a_))
    t = t.replace(a_, " ${mapBarSheets(typeof sh === 'undefined' ? null : sh).map(s => `<button class=\"btn sheetbtn")
    t = rep(t, "@media(max-width:640px){\n  .sheetsel{display:block;flex:1 1 100%} .sheetbtn{display:none}",
            "@media(max-width:640px){\n  .sheetsel{display:block;flex:1 1 100%} .sheetbtn{display:none}\n  #pane-map .maptools .sheetsel{display:none} #pane-map .maptools .sheetbtn{display:inline-flex;align-items:center;justify-content:center;flex:1 1 calc(50% - 8px);min-height:44px}   /* v6.96 - the same four buttons on a phone */", 'phone buttons', path, need)
    if 'state.sheet = sat3dPossible() ? SAT_3D' in t: print('default view already there (v6.93)')
    else: t = rep(t, " if (state.sheet === SAT_BOARD && liveMapPossible()) { renderSatBoard(); return; }",
            " if (!state.mapMasterSeen && !state.found && !/^#sheet\\//.test(location.hash) && (sat3dPossible() || liveMapPossible())) { state.mapMasterSeen = true; state.sheet = sat3dPossible() ? SAT_3D : SAT_BOARD; }   /* v6.96 - the Map tab opens on Satellite · 3D (#sheet/__satellite3d), or the satellite pins where 3D can't run, unless a link or a search asked for a sheet */\n"
            " if (state.sheet === SAT_BOARD && liveMapPossible()) { renderSatBoard(); return; }", 'default sat3d', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
