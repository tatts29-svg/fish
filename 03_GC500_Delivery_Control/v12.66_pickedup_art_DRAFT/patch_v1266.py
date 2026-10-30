"""Author: Andrew Fisher. Add a bounded decorative image to matching pickup stamps."""
import base64
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE = '10e8e8c23468d593a40c7ca7b88abb0ceceba203cffc4f9956933e193f1d0f64'
OLD = " + '\"><i class=\"stc1238\">' + SVG('<path d=\"m4.5 12.5 5 5 10-11\"/>')"
NEW = " + '\">' + pickedupArt1266(c) + '<i class=\"stc1238\">' + SVG('<path d=\"m4.5 12.5 5 5 10-11\"/>')"
FOOTER = "+' · v12.65'; /* v8.19 release922"
NEXT_FOOTER = "+' · v12.66'; /* v8.19 release922"

def additions():
    art = (HERE / 'assets/light-tower.webp').read_bytes()
    if len(art) > 24000 or art[:4] != b'RIFF' or art[8:12] != b'WEBP':
        raise ValueError('Expected the reviewed small WebP artwork')
    js = (HERE / 'pickedup1266_src.js').read_text()
    if js.count('__TOWER_WEBP__') != 1:
        raise ValueError('Expected one artwork insertion')
    js = js.replace('__TOWER_WEBP__', base64.b64encode(art).decode())
    css = (HERE / 'pickedup1266.css').read_text()
    return js, '<style id="pickedup1266-style">\n' + css + '</style>\n'

def patch(text):
    if 'PICKEDUP_ART1266_TOWER' in text:
        raise ValueError('Pickup artwork is already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE:
        raise ValueError('Expected exact verified v12.65; rebuild/retest on a changed live base')
    js, style = additions()
    out = rep(text, 'function stampHtml(c) {', js + 'function stampHtml(c) {', 'decorative artwork helper', __file__)
    out = rep(out, OLD, NEW, 'pickup stamp inner artwork only', __file__)
    out = rep(out, FOOTER, NEXT_FOOTER, 'release footer', __file__)
    out = rep(out, '</body>\n</html>', style + '</body>\n</html>', 'scoped artwork style', __file__)
    return out

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(encoding='utf-8')), encoding='utf-8')
    print('v12.66 applied: decorative matching light-tower artwork; native data/behaviour retained')
