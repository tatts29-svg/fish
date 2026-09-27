#!/usr/bin/env python3
"""v6.94 - THE MAP, WOW. The satellite map (v6.93) becomes a live 3D model of the site and the circuit: see wow694.js for
what and why. Applied after patch_v693.py.   python3 patch_v694.py <page.html> <wow694.js>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, wowf, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'const WOW = {' in t: sys.exit('v6.94 already applied')
    if 'SAT_TRADES' not in t: sys.exit('v6.93 must be applied first')
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    wow = open(wowf, encoding='utf-8').read().rstrip() + '\n'
    t = R("""/* v6.93 - which trades and layers are showing; kept for the session, applied as filters (no rebuild) */""", wow + """/* v6.93 - which trades and layers are showing; kept for the session, applied as filters (no rebuild) */""", 'wow code')
    t = R("""function unmountSatBoard(){ if (document.querySelector('.mapcard.satfull')) satFull(false);""",
          """function unmountSatBoard(){ if (document.querySelector('.mapcard.satfull')) satFull(false); wowStop(); WOW.map = null;""", 'unmount')
    t = R("""style: 'mapbox://styles/mapbox/satellite-streets-v12', attributionControl: true, cooperativeGestures: false, fadeDuration: 0, renderWorldCopies: false, maxPitch: 70, antialias: true, projection: 'mercator',""",
          """style: WOW.fallback ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/standard-satellite',
 ...(WOW.fallback ? {} : {config: {basemap: {lightPreset: wowPreset(), showPointOfInterestLabels: false, showTransitLabels: false}}}),
 attributionControl: true, cooperativeGestures: false, fadeDuration: 0, renderWorldCopies: false, maxPitch: 78, antialias: true, projection: 'mercator',""", 'style')
    t = R(""" LIVEMAP.board = map; LIVEMAP.boardEl = el;""", """ LIVEMAP.board = map; LIVEMAP.boardEl = el;
 /* v6.94 - if the 3D style cannot load here, the flat satellite style takes over (same pins, no 3D city) */
 let wowLoaded = false; map.once('load', () => { wowLoaded = true; });
 const wowBack = () => { if (LIVEMAP.board === map && !WOW.fallback && !wowLoaded) { WOW.fallback = true; mountSatBoard(pins, drawn); } };
 map.on('error', ev => { const msg = String(ev && ev.error && (ev.error.message || ev.error.status) || ''); if (!wowLoaded && /standard|style|40[0-9]/i.test(msg)) wowBack(); });
 setTimeout(wowBack, 90000);""", 'fallback')
    t = R("""['sb-pins', 'sb-ways', 'sb-puts', 'sb-drawn', 'sb-extra'].forEach(l => {""", """wowLoad(map, gl, drawn); ['sb-pins', 'sb-ways', 'sb-puts', 'sb-drawn', 'sb-extra'].forEach(l => {""", 'wow hook')
    t = R("""if (!ll) return null; const g = satTrade(a);
 return {key: a.key, name: a.name || a.item || '', lat: ll.lat, lon: ll.lon, g, c: col[g], area: !!(m && m.prec && m.prec !== 'unit'), from};""",
          """if (!ll) return null; const g = satTrade(a), st = wowStatus(a);
 return {key: a.key, name: a.name || a.item || '', lat: ll.lat, lon: ll.lon, g, c: col[g], st, sc: WOW_STATUS[st] || '#9aa3ad', area: !!(m && m.prec && m.prec !== 'unit'), from};""", 'status on drawn')
    a_ = "area: d.area ? 1 : 0}))"
    if t.count(a_) < 1: sys.exit('drawn props')
    t = t.replace(a_, "area: d.area ? 1 : 0, sc: d.sc || '#9aa3ad', st: d.st || 'unknown'}))")
    t = R("""try { map.setFilter('sb-drawn', tf); map.setFilter('sb-drawn-label', tf); map.setFilter('sb-extra', xf); map.setFilter('sb-extra-label', xf); } catch (e) {}""",
          """try { map.setFilter('sb-drawn', tf); map.setFilter('sb-drawn-label', tf); map.setFilter('sb-extra', xf); map.setFilter('sb-extra-label', xf); } catch (e) {}
 ['sb-3d', 'sb-heat'].forEach(id => { try { if (map.getLayer(id)) map.setFilter(id, tf); } catch (e) {} });   /* v6.94 */""", 'chips 3d')
    css = """
/* v6.94 - the wow map: its toolbar, the ride-along readout, the hover card */
.wowbar{position:absolute;left:54px;top:10px;right:60px;z-index:3;display:flex;flex-wrap:wrap;gap:6px;pointer-events:none}
.wowbar>*{pointer-events:auto}
.wowbar button,.wowsel,.wowfind{height:34px;border-radius:9px;border:0;background:rgba(12,16,20,.86);color:#fff;font:600 12.5px/1 inherit;padding:0 12px;box-shadow:0 2px 8px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.wowbar button{cursor:pointer}.wowbar button[aria-pressed="true"]{background:#ff6a13;color:#1b1207}
.wowsel{display:inline-flex;align-items:center;gap:6px}.wowsel span{opacity:.7;font-weight:500}.wowsel select{background:transparent;color:#fff;border:0;font:600 12.5px inherit;outline:none}
.wowsel option{color:#111}
.wowfind{width:170px;outline:none}.wowfind::placeholder{color:rgba(255,255,255,.6)}.wowfind.miss{box-shadow:0 0 0 2px #ff4d4d}
.wowcard .mapboxgl-popup-content{padding:0;border-radius:10px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.35)}
.wowc{font:13px/1.35 inherit;color:#111;width:240px}.wowc img{display:block;width:100%;height:120px;object-fit:cover;background:#eee}
.wowct{padding:8px 10px 2px}.wowct b{font-size:14px}.wowct span{color:#555}
.wowcm{padding:2px 10px 4px;display:flex;align-items:center;gap:5px;font-size:12px;color:#333}.wowcm i{width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.35) inset;display:inline-block}
.wowcs{padding:0 10px 8px;font-size:11px;color:#888}
.satchips.bystatus .satchip i{background:#9aa3ad!important}
@media(max-width:640px){.wowbar{left:52px;right:52px}.wowfind{width:120px}.wowsel span{display:none}}
@media print{.wowbar{display:none!important}}
</style>"""
    k = t.find('</style>'); t = t[:k] + css + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], True)
