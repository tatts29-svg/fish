"""Author: Andrew Fisher. v11.88 - Map explorer, one map at a time.

Andrew, 24 Oct 2026 (this chat): "can we look at map explorer it look very over corwed very confising we need to make this simple
and easy we showing 2 maps why easy simple maybe drop down selection".
  mapx1188_src.js + mapx1188.css: a "Show map" drop-down at the top of Map explorer picks the site plan (the explorer: master plan,
  satellite, 3D) or the satellite map of VMS boards, generators, grandstands, turns and gates; the other is folded away. Kept on
  the device; a place asked for elsewhere opens the right map. The note under "Highlight area" and the satellite map's list fold
  behind one tap. Footer -> v11.88. No record, servicing, crew card, QR or server change.

    python3 patch_v1188.py page.html      (in place, on the live v11.87 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = 'b18acda01b96e653ff39612f12ed2dae29123d0dded5e8757fd680ac8b13bdfa'
ANCHOR = '<script id="steady1143-script">'


def patch(html):
    if 'mapx1188-script' in html: raise ValueError('v11.88 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.88 (expected v11.87 b18acda0...)')
    for need in ('function go(tab){', 'function renderMap(){', 'function mapLocate(sheetKey, label, key,', 'function expFind(key){', 'function expOpen2d(){',
                 'function expOpen3d(key){', 'function showOnMap(key){', 'W.gate1156Zoom = function (lat, lon, id) {', "{key: 'map', pane: 'pane-map', after: '#expcard'",
                 "bar.id='map1147-controls'", 'teams1187-script'):
        if need not in html: raise ValueError('the page has no %r' % need)
    src = (HERE / 'mapx1188_src.js').read_text(encoding='utf-8')
    css = (HERE / 'mapx1188.css').read_text(encoding='utf-8')
    if '</script' in src.lower() or '</style' in css.lower(): raise ValueError('source would close its own tag')
    block = '<style id="mapx1188-style">\n' + css + '</style>\n<script id="mapx1188-script">\n' + src + '\n</script>\n' + ANCHOR
    html = rep(html, ANCHOR, block, 'map explorer one map', 'page')
    return rep(html, "+' · v11.87'; /* v8.19 release922", "+' · v11.88'; /* v8.19 release922", 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.88 map explorer one map applied')
