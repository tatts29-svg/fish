#!/usr/bin/env python3
"""v6.93 - THE SATELLITE MAP IS THE MAP (Andrew, 27 Sep 2026: "I'd rather we use this for maps ... it shows more ... only
thing you need to add is the satellite pins"; "I don't see any lighting towers or generators on the maps"; "maps is very
very clunky, very sluggish").

  The map    The Map tab opens on the satellite map (on the hosted link; the master plan is one press away, and a search
             that lands on the master still goes there). Its button comes first and reads "Satellite map".
  The pins   Every reference is placed from the master-plan position (MASTER_LOC, triple-checked in v6.89) and falls back
             to the older drawing arrow only where the master has none. Each pin wears its trade's colour - generators,
             light towers, toilets, buildings, barriers - with a key and a chip per trade to show or hide it; the
             reference is written beside it from zoom 16. The master's other layers (VMS boards, water barrier runs,
             gates, entry points, big screens, others' gensets, interface areas, drawn-not-ours) are there too, smaller,
             off until their chip is pressed.
  Smooth     No more "use two fingers / Ctrl to zoom" lock: the map takes the wheel, a drag and a pinch straight away.
             A full-screen button gives it the whole window (Esc brings it back). Fades off, no world copies, the
             pins are GPU layers (never DOM markers), and a chip press is a filter change, not a rebuild.

Applied after patch_v690.py.   python3 patch_v693.py <page.html>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'SAT_TRADES' in t: sys.exit('v6.93 already applied to ' + path)
    R = lambda old, new, what: rep(t, old, new, what, path, need)

    # 1. the positions: master first, the old drawing arrow only where the master has none; trade and colour on each
    t = R(""" const drawn = allAssets().map(a => { const pt = aerialPointFor(a); const ll = pt && lonLatOf(pt.ax, pt.ay); return ll ? {key: a.key, name: a.name || a.item || '', lat: ll.lat, lon: ll.lon} : null; }).filter(Boolean);""",
          """ const drawn = satDrawn();""", 'drawn from master')
    t = R("""function satBoardCount(pins, latest){""", """/* v6.93 - the trades on the satellite map, in the order the key reads, each with the colour its pins wear */
const SAT_TRADES = [['gen', 'Generators', '#ffd23f'], ['lt', 'Light towers', '#ffffff'], ['wc', 'Toilets & amenities', '#39e07a'],
 ['pb', 'Portable buildings', '#ff8a2a'], ['wfb', 'Water-filled barriers', '#4cc9f0'], ['acc', 'Access & plant', '#e27bd9'],
 ['oth', 'Other', '#c9c3bb']];
const SAT_XTRA = {vms: '#b18cff', wb: '#e8641b', gate: '#7bd88f', ep: '#35c2e0', screen: '#8fa8ff', gens: '#d97bd1', iface: '#ff6b6b', wcx: '#c9a27a'};
function satTrade(a){
 const p = String(a.product || '') + ' ' + String(a.discipline || '') + ' ' + String(a.item || '');
 if (/generator/i.test(p)) return 'gen'; if (/light ?tower/i.test(p)) return 'lt'; if (/toilet|amenit|shower|urinal|ablution/i.test(p)) return 'wc';
 if (/portable building|building|office|crib|container/i.test(p)) return 'pb'; if (/wfb|water.filled|barrier/i.test(p)) return 'wfb';
 if (/access|forklift|telehandler|boom|scissor/i.test(p)) return 'acc'; return 'oth';
}
function satDrawn(){
 const col = Object.fromEntries(SAT_TRADES.map(x => [x[0], x[2]]));
 return allAssets().map(a => {
 const m = typeof MASTER_LOC !== 'undefined' ? MASTER_LOC[a.key] : null; let ll = m && m.ll ? {lat: m.ll[0], lon: m.ll[1]} : null, from = 'master';
 if (!ll) { const pt = aerialPointFor(a); ll = pt && lonLatOf(pt.ax, pt.ay); from = 'drawing'; }
 if (!ll) return null; const g = satTrade(a);
 return {key: a.key, name: a.name || a.item || '', lat: ll.lat, lon: ll.lon, g, c: col[g], area: !!(m && m.prec && m.prec !== 'unit'), from};
 }).filter(Boolean);
}
function satExtras(){
 if (typeof MASTER_LAYERS === 'undefined') return {type: 'FeatureCollection', features: []};
 return {type: 'FeatureCollection', features: MASTER_LAYERS.filter(x => x.ll).map(x => ({type: 'Feature', geometry: {type: 'Point', coordinates: [x.ll[1], x.ll[0]]},
 properties: {layer: x.layer, label: x.label || x.face || '', face: x.face || '', note: x.note || '', src: x.src || '', c: SAT_XTRA[x.layer] || '#ccc'}}))};
}
function satBoardCount(pins, latest){""", 'trades')
    # 2. the drawn features carry what the paint needs
    a_ = "features: drawn.map(d => feat(d.lon, d.lat, {key: d.key, name: d.name}))"
    if t.count(a_) < 1: sys.exit('drawn props anchor')
    t = t.replace(a_, "features: drawn.map(d => feat(d.lon, d.lat, {key: d.key, name: d.name, g: d.g || 'oth', c: d.c || '#ff6a13', area: d.area ? 1 : 0}))")
    # 3. smooth: no gesture lock, no fades, no world copies
    t = R("""map = new gl.Map({container: el, style: 'mapbox://styles/mapbox/satellite-streets-v12', attributionControl: true, cooperativeGestures: true,""",
          """map = new gl.Map({container: el, style: 'mapbox://styles/mapbox/satellite-streets-v12', attributionControl: true, cooperativeGestures: false, fadeDuration: 0, renderWorldCopies: false, maxPitch: 70, antialias: true, projection: 'mercator',""", 'smooth')
    # 4. the pins in their trade colours, the references written beside them, the extra layers, a click on each
    t = R(""" map.addLayer({id: 'sb-drawn', type: 'circle', source: 'sb-drawn', minzoom: SHOW_FIXES ? 15.5 : 0, paint: {'circle-radius': 4, 'circle-color': '#ff6a13', 'circle-opacity': 0.55, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1, 'circle-stroke-opacity': 0.6}});""",
          """ map.addLayer({id: 'sb-drawn', type: 'circle', source: 'sb-drawn', minzoom: SHOW_FIXES ? 15.5 : 0, paint: {
 'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 3.2, 16, 5.5, 18, 9], 'circle-color': ['get', 'c'], 'circle-opacity': 0.96,
 'circle-stroke-color': ['case', ['==', ['get', 'g'], 'lt'], '#ff6a13', '#10151a'], 'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 14, 1, 18, 2.2]}});
 /* v6.93 - the reference beside its pin once there is room to read it */
 map.addLayer({id: 'sb-drawn-label', type: 'symbol', source: 'sb-drawn', minzoom: 16, layout: {'text-field': ['get', 'key'], 'text-size': ['interpolate', ['linear'], ['zoom'], 16, 10, 19, 13],
 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': false, 'text-optional': true, 'text-padding': 1},
 paint: {'text-color': '#fff', 'text-halo-color': 'rgba(10,14,18,.92)', 'text-halo-width': 1.6}});
 map.addSource('sb-extra', {type: 'geojson', data: satExtras()});
 map.addLayer({id: 'sb-extra', type: 'circle', source: 'sb-extra', layout: {visibility: 'visible'}, filter: ['in', ['get', 'layer'], ['literal', []]], paint: {
 'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2.4, 18, 6.5], 'circle-color': ['get', 'c'], 'circle-stroke-color': '#10151a', 'circle-stroke-width': 1}});
 map.addLayer({id: 'sb-extra-label', type: 'symbol', source: 'sb-extra', minzoom: 16.5, filter: ['in', ['get', 'layer'], ['literal', []]], layout: {'text-field': ['get', 'face'], 'text-size': 10, 'text-offset': [0, 1.0], 'text-anchor': 'top',
 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': false, 'text-optional': true}, paint: {'text-color': '#fff', 'text-halo-color': 'rgba(10,14,18,.9)', 'text-halo-width': 1.4}});
 map.on('click', 'sb-extra', ev => { const p = ev.features[0].properties;
 pop.setLngLat(ev.features[0].geometry.coordinates).setHTML(`<b>${esc(p.label)}${p.face && p.face !== p.label ? ' · ' + esc(p.face) : ''}</b><br>${esc(p.note)}<br><span style="color:#666">From ${esc(p.src || 'the master plan')}, laid on the photograph by image registration (about ±8 m).</span>`).addTo(map); });
 satApplyChips(map);""", 'pins paint')
    t = R("""['sb-pins', 'sb-ways', 'sb-puts', 'sb-drawn'].forEach(l => {""", """['sb-pins', 'sb-ways', 'sb-puts', 'sb-drawn', 'sb-extra'].forEach(l => {""", 'cursor')
    # the popup's pop is defined after sb-drawn in the original; move the extra click after it by defining pop earlier
    t = R(""" map.addSource('sb-moved', {type: 'geojson', data: g.moved});""", """ const pop = SAT_POP.pop = SAT_POP.pop && SAT_POP.map === map ? SAT_POP.pop : new gl.Popup({closeButton: false, offset: 12}); SAT_POP.map = map;
 map.addSource('sb-moved', {type: 'geojson', data: g.moved});""", 'pop early')
    t = R(""" const pop = new gl.Popup({closeButton: false, offset: 12});
 map.on('click', 'sb-pins',""", """ map.on('click', 'sb-pins',""", 'pop once')
    t = R("""function unmountSatBoard(){""", """/* v6.93 - which trades and layers are showing; kept for the session, applied as filters (no rebuild) */
const SAT_POP = {pop: null, map: null};
const SAT_SHOW = {trades: new Set(['gen', 'lt', 'wc', 'pb', 'wfb', 'acc', 'oth']), extra: new Set()};
function satApplyChips(map){
 map = map || LIVEMAP.board; if (!map || !map.getLayer || !map.getLayer('sb-drawn')) return;
 const tf = ['in', ['get', 'g'], ['literal', [...SAT_SHOW.trades]]], xf = ['in', ['get', 'layer'], ['literal', [...SAT_SHOW.extra]]];
 try { map.setFilter('sb-drawn', tf); map.setFilter('sb-drawn-label', tf); map.setFilter('sb-extra', xf); map.setFilter('sb-extra-label', xf); } catch (e) {}
}
function satChipsHtml(drawn){
 const n = {}; drawn.forEach(d => n[d.g] = (n[d.g] || 0) + 1);
 const xn = {}; (typeof MASTER_LAYERS !== 'undefined' ? MASTER_LAYERS : []).forEach(x => { if (x.ll) xn[x.layer] = (xn[x.layer] || 0) + 1; });
 const lay = typeof MAP_LAYERS !== 'undefined' ? MAP_LAYERS : [];
 return `<div class="satchips" id="satchips" role="group" aria-label="Show on the satellite map">`
 + SAT_TRADES.filter(x => n[x[0]]).map(([k, name, c]) => `<button type="button" class="satchip" data-st="${k}" aria-pressed="${SAT_SHOW.trades.has(k)}" style="--c:${c}"><i></i>${esc(name)} <small>${n[k]}</small></button>`).join('')
 + `<span class="satchipsep" aria-hidden="true"></span>`
 + lay.filter(x => xn[x[0]]).map(([k, name]) => `<button type="button" class="satchip xtra" data-sx="${k}" aria-pressed="${SAT_SHOW.extra.has(k)}" style="--c:${SAT_XTRA[k] || '#ccc'}"><i></i>${esc(name)} <small>${xn[k]}</small></button>`).join('')
 + `</div>`;
}
function satWireChips(){
 const box = $('#satchips'); if (!box) return;
 box.onclick = ev => { const b = ev.target.closest('.satchip'); if (!b) return;
 const set = b.dataset.st ? SAT_SHOW.trades : SAT_SHOW.extra, k = b.dataset.st || b.dataset.sx;
 if (set.has(k)) set.delete(k); else set.add(k); b.setAttribute('aria-pressed', String(set.has(k))); satApplyChips(); };
 const fs = $('#satfull'); if (fs) fs.onclick = () => satFull(!document.querySelector('.mapcard.satfull'));
}
function satFull(on){
 const card = $('#satboard') && $('#satboard').closest('.mapcard'); if (!card) return;
 card.classList.toggle('satfull', on); document.documentElement.classList.toggle('mapfull', on);
 const b = $('#satfull'); if (b) { b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Back to the page (Esc)' : 'Full screen'; }
 if (LIVEMAP.board) setTimeout(() => { try { LIVEMAP.board.resize(); } catch (e) {} }, 30);
}
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && document.querySelector('.mapcard.satfull')) satFull(false); });
function unmountSatBoard(){ if (document.querySelector('.mapcard.satfull')) satFull(false);""", 'chips')
    # 5. the chips, the key and the full-screen button on the board; the satellite first and named for what it is
    t = R(""" <p class="sub" id="satcount">${satBoardCount(pins, latest)}</p>
 <div class="satboard" id="satboard"><div class="livenote">Asking the service for the map key…</div></div>""",
          """ <p class="sub" id="satcount">${satBoardCount(pins, latest)}</p>
 ${satChipsHtml(drawn)}
 <div class="satwrap"><button type="button" class="satfullbtn" id="satfull" aria-pressed="false" title="Full screen" aria-label="Full screen"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
 <div class="satboard" id="satboard"><div class="livenote">Asking the service for the map key…</div></div></div>""", 'board chips')
    t = R(""" ${mapSheetsShown(typeof sh === 'undefined' ? null : sh).map(s => `<button class="btn sheetbtn" data-sheet="${s.key}">${esc(s.title)}</button>`).join('')}
 <button class="btn sheetbtn satbtn primary" data-sheet="${SAT_BOARD}">Satellite · pins</button>""",
          """ <button class="btn sheetbtn satbtn primary" data-sheet="${SAT_BOARD}">Satellite map</button>
 ${mapSheetsShown(typeof sh === 'undefined' ? null : sh).map(s => `<button class="btn sheetbtn" data-sheet="${s.key}">${esc(s.title)}</button>`).join('')}""", 'sat first')
    t = R("""<option value="${SAT_BOARD}" selected>Satellite · pins</option>""", """<option value="${SAT_BOARD}" selected>Satellite map</option>""", 'sel name')
    t = R(""" setHash('sheet/' + SAT_BOARD, {replace: location.hash === '#map'});
 mountSatBoard(pins, drawn);""", """ setHash('sheet/' + SAT_BOARD, {replace: location.hash === '#map'});
 satWireChips();
 mountSatBoard(pins, drawn);""", 'wire chips')
    # on the master's own toolbar the satellite map comes first too
    t = R(""" ${mapSheetsShown(typeof sh === 'undefined' ? null : sh).map(s => `<button class="btn sheetbtn ${s.key===sh.key?'primary':''}" data-sheet="${s.key}">${esc(s.title)}</button>`).join('')}
 ${liveMapPossible() ? `<button class="btn sheetbtn satbtn" data-sheet="${SAT_BOARD}" title="Mapbox's satellite photograph with every recorded pin on it — no drawing, updates as the crews pin things">Satellite · pins</button>` : ''}""",
          """ ${liveMapPossible() ? `<button class="btn sheetbtn satbtn" data-sheet="${SAT_BOARD}" title="The satellite photograph with every reference in its trade's colour">Satellite map</button>` : ''}
 ${mapSheetsShown(typeof sh === 'undefined' ? null : sh).map(s => `<button class="btn sheetbtn ${s.key===sh.key?'primary':''}" data-sheet="${s.key}">${esc(s.title)}</button>`).join('')}""", 'master toolbar')
    t = R("""<option value="${SAT_BOARD}">Satellite · pins</option>""", """<option value="${SAT_BOARD}">Satellite map</option>""", 'sel name 2') if t.count("""<option value="${SAT_BOARD}">Satellite · pins</option>""") == 1 else t
    # 6. the Map tab opens on the satellite map (a search that found something on the master still goes there)
    t = R(""" if (state.sheet === SAT_BOARD && liveMapPossible()) { renderSatBoard(); return; }""",
          """ if (!state.mapMasterSeen && !state.found && liveMapPossible() && !/^#sheet\\//.test(location.hash)) { state.mapMasterSeen = true; state.sheet = SAT_BOARD; }   /* v6.93 - the Map tab opens on the satellite map unless a link asked for a sheet */
 if (state.sheet === SAT_BOARD && liveMapPossible()) { renderSatBoard(); return; }""", 'default sat')
    # 7. open framed on the circuit: the middle 94 % of the plan positions, so an off-site yard does not zoom the whole board out
    t = R(""" const all = pins.map(p => [p.lon, p.lat]).concat(drawn.map(d => [d.lon, d.lat]));""",
          """ const all = (() => { const src = drawn.length ? drawn : pins, q = (arr, f) => arr.slice().sort((x, y) => x - y)[Math.max(0, Math.min(arr.length - 1, Math.round(f * (arr.length - 1))))];
 const la = src.map(d => d.lat), lo = src.map(d => d.lon); if (!src.length) return [];
 const b0 = [q(lo, .03), q(la, .03)], b1 = [q(lo, .97), q(la, .97)]; return [b0, b1]; })();   /* v6.93 - framed on the circuit */""", 'fit circuit')
    css = """
/* v6.93 - the satellite map: trade chips, full screen */
.satchips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}
.satchip{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);border-radius:16px;height:30px;padding:0 11px;font:600 12.5px/1 inherit;cursor:pointer}
.satchip i{width:11px;height:11px;border-radius:50%;background:var(--c);box-shadow:0 0 0 1.5px #10151a inset;opacity:.35}
.satchip[aria-pressed="true"]{border-color:#10151a;background:#10151a;color:#fff}.satchip[aria-pressed="true"] i{opacity:1}
.satchip small{color:inherit;opacity:.7;font-weight:500}.satchip.xtra{font-weight:500}
.satchipsep{width:1px;align-self:stretch;background:var(--rule);margin:0 4px}
.satwrap{position:relative}
.satfullbtn{position:absolute;left:10px;top:10px;z-index:3;width:34px;height:34px;border-radius:8px;border:0;background:#fff;color:#10151a;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;cursor:pointer}
.mapcard.satfull{position:fixed;inset:0;z-index:40;margin:0;border-radius:0;display:flex;flex-direction:column;padding:10px 12px}
.mapcard.satfull .maptools,.mapcard.satfull #sathint{display:none}
.mapcard.satfull .satwrap{flex:1;min-height:0}.mapcard.satfull .satboard{height:100% !important}
html.mapfull,html.mapfull body{overflow:hidden}
@media(max-width:640px){.satboard{height:calc(100svh - 250px);min-height:420px}.satchips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.satchip{flex:none}}
@media print{.satchips,.satfullbtn{display:none !important}}
</style>"""
    k = t.find('</style>'); t = t[:k] + css + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
