"""Author: Andrew Fisher. v11.17 - Map explorer: press and hold anywhere for that spot's coordinates; share them with a
picture of the map.

Andrew, 22 Oct 2026: "i want to be able to tap any where in here to get the exact map coordinates ... then i want to be
able to then attach and send a message with those coordinates and a map of that area". The layer is injected into the
explorer frame by the page, the way the v10.60 shapes are: it reads the explorer's own registration (sheet point ->
Web Mercator z18 pixels -> lat/lon, checked against the pinned references to 0.1 m), drops a pin on a press-and-hold or
a right-click, names the two nearest placed references, and shares the words plus a PNG of the map around the pin
(pin, north arrow, scale bar, caption) through the device's share sheet; Copy and Open in Maps beside it. Read-only: no
record writes. Pinned to the reviewed explorer build. Footer v11.16 -> v11.17.

    python3 patch_v1117.py page.html      (in place, on the live v11.16 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '8a19fcce4625eb204c2d5628bc5a885c2a4e799f11e8235ffa0b7c90cc1102ae'
JS = (HERE / 'spot1117_src.js').read_text(encoding='utf-8')
assert '</script' not in JS.lower() and 'gc500SpotLayer1117' in JS
END = '</body>\n</html>\n'
LOAD_OLD = " f.addEventListener('load', () => { contrast1007Map(f); try { if (window.gc500ShapeLayer1060) window.gc500ShapeLayer1060.mount(f); } catch (e) {} EXP.loaded = true;"
LOAD_NEW = " f.addEventListener('load', () => { contrast1007Map(f); try { if (window.gc500ShapeLayer1060) window.gc500ShapeLayer1060.mount(f); } catch (e) {} try { if (window.gc500SpotLayer1117) window.gc500SpotLayer1117.mount(f); } catch (e) {} EXP.loaded = true;"


def patch(text):
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.17 requires the live v11.16 page ' + BASE_SHA256)
    if 'spot1117-script' in text: raise ValueError('v11.17 already applied')
    if not text.endswith(END): raise ValueError('the page does not end as expected')
    text = text[:-len(END)] + '<script id="spot1117-script">\n' + JS + '</script>\n' + END
    text = rep(text, LOAD_OLD, LOAD_NEW, 'tap for coordinates: mount on each explorer frame load', 'page')
    text = rep(text, "+' · v11.16'; /* v8.19 release922", "+' · v11.17'; /* v8.19 release922", 'release footer', 'page')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    out = patch(t)
    p.write_text(out, encoding='utf-8')
    print('patch_v1117 applied: Map explorer press-and-hold coordinates with share; footer v11.16 -> v11.17')
