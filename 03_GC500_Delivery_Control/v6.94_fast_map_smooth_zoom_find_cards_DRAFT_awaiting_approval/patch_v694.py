#!/usr/bin/env python3
"""v6.94 - THE MAP, FAST: ready before you ask, less to draw, find anything with suggestions, colour by where it is, the
circuit outline, the card. See wow694.js for what and why. Applied after patch_v693.py.
  python3 patch_v694.py <page.html> <wow694.js>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, wowf, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'const WOW = {' in t: sys.exit('v6.94 already applied')
    if 'SAT_TRADES' not in t: sys.exit('v6.93 must be applied first')
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    wow = open(wowf, encoding='utf-8').read().rstrip() + '\n' + "setTimeout(wowWarm, 2500);   /* v6.94 - the map is ready before anybody presses Map */\n"
    t = R("""/* v6.93 - which trades and layers are showing; kept for the session, applied as filters (no rebuild) */""", wow + """/* v6.93 - which trades and layers are showing; kept for the session, applied as filters (no rebuild) */""", 'wow code')
    t = R("""function unmountSatBoard(){ if (document.querySelector('.mapcard.satfull')) satFull(false);""",
          """function unmountSatBoard(){ if (document.querySelector('.mapcard.satfull')) satFull(false); wowStop(); WOW.map = null;""", 'unmount')
    # a phone draws at twice its point size at most, and without the extra edge smoothing; the zoom limit stops at street level
    t = R("""maxPitch: 70, antialias: true, projection: 'mercator',""",
          """maxPitch: 70, antialias: !(window.matchMedia && matchMedia('(pointer: coarse)').matches), pixelRatio: Math.min(window.devicePixelRatio || 1, 2), maxZoom: 20.5, projection: 'mercator',""", 'lighter')
    t = R("""['sb-pins', 'sb-ways', 'sb-puts', 'sb-drawn', 'sb-extra'].forEach(l => {""", """wowLoad(map, gl, drawn); ['sb-pins', 'sb-ways', 'sb-puts', 'sb-drawn', 'sb-extra'].forEach(l => {""", 'wow hook')
    t = R("""if (!ll) return null; const g = satTrade(a);
 return {key: a.key, name: a.name || a.item || '', lat: ll.lat, lon: ll.lon, g, c: col[g], area: !!(m && m.prec && m.prec !== 'unit'), from};""",
          """if (!ll) return null; const g = satTrade(a), st = wowStatus(a);
 return {key: a.key, name: a.name || a.item || '', lat: ll.lat, lon: ll.lon, g, c: col[g], st, sc: WOW_STATUS[st] || '#9aa3ad', area: !!(m && m.prec && m.prec !== 'unit'), from};""", 'status on drawn')
    a_ = "area: d.area ? 1 : 0}))"
    if t.count(a_) < 1: sys.exit('drawn props')
    t = t.replace(a_, "area: d.area ? 1 : 0, sc: d.sc || '#9aa3ad', st: d.st || 'unknown'}))")
    # coming back to the Map tab: the same map, sized to its box again - no rebuild, no reload
    t = R(""" if (keep) { /* the map stays; only what is on it moves */""", """ if (keep) { /* the map stays; only what is on it moves */
 try { LIVEMAP.board.resize(); WOW.drawn = drawn; } catch (e) {}   /* v6.94 */""", 'keep resize')
    css = """
/* v6.94 - the fast map: find with suggestions, colour switch, the card */
.wowbar{position:absolute;left:54px;top:10px;right:60px;z-index:3;display:flex;flex-wrap:wrap;gap:6px;pointer-events:none}
.wowbar>*{pointer-events:auto}
.wowfindw{position:relative}
.wowfind,.wowsel{height:36px;border-radius:9px;border:0;background:rgba(12,16,20,.9);color:#fff;font:600 13.5px/1 inherit;padding:0 12px;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.wowfind{width:250px;outline:none}.wowfind::placeholder{color:rgba(255,255,255,.62)}.wowfind:focus{box-shadow:0 0 0 2px #ff6a13,0 2px 8px rgba(0,0,0,.35)}.wowfind.miss{box-shadow:0 0 0 2px #ff4d4d}
.wowsug{position:absolute;left:0;top:40px;width:320px;max-width:calc(100vw - 40px);background:#fff;color:#111;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.35);overflow:hidden}
.wowsug button{display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:0;background:#fff;padding:9px 12px;font:13.5px/1.2 inherit;cursor:pointer;border-bottom:1px solid #eee}
.wowsug button[aria-selected="true"],.wowsug button:hover{background:#fff3ea}
.wowsug button i{width:11px;height:11px;border-radius:50%;flex:none;box-shadow:0 0 0 1.5px #10151a inset}.wowsug button span{color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wownone{padding:10px 12px;color:#666;font-size:13px}
.wowsel{display:inline-flex;align-items:center;gap:6px}.wowsel span{opacity:.7;font-weight:500}.wowsel select{background:transparent;color:#fff;border:0;font:600 13px inherit;outline:none}.wowsel option{color:#111}
.wowcard .mapboxgl-popup-content{padding:0;border-radius:10px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.35)}
.wowc{font:13px/1.35 inherit;color:#111;width:240px}.wowc img{display:block;width:100%;height:120px;object-fit:cover;background:#eee}
.wowct{padding:8px 10px 2px}.wowct b{font-size:14px}.wowct span{color:#555}
.wowcm{padding:2px 10px 4px;display:flex;align-items:center;gap:5px;font-size:12px;color:#333}.wowcm i{width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.35) inset;display:inline-block}
.wowcs{padding:0 10px 8px;font-size:11px;color:#888}
.satchips.bystatus .satchip i{background:#9aa3ad!important}
@media(max-width:640px){.wowbar{left:52px;right:52px}.wowfind{width:calc(100vw - 200px);min-width:150px}.wowsel span{display:none}}
@media print{.wowbar{display:none!important}}
</style>"""
    k = t.find('</style>'); t = t[:k] + css + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], True)
