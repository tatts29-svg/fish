"""Author: Andrew Fisher. Neon glow and pulse on the existing Still on site view."""
from pathlib import Path
import hashlib
import re
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = 'ec56ffe5ef53670d286db566bd968366dfc366ad25edf6f2aa753076b10fc3e8'

def apply(text):
    if 'function onsiteNeon1291()' in text:
        raise ValueError('v12.91 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v12.91 requires exact verified live v12.90')
    pattern = re.compile(r'(<script id="spot1117-script">)(.*?)(</script>)', re.S)
    matches = list(pattern.finditer(text))
    if len(matches) != 1:
        raise ValueError('Expected one map presentation script')
    m = matches[0]
    body = rep(m.group(2), '  stillOnSite1290();', '  stillOnSite1290();\n' + (HERE / 'neon1291_src.js').read_text() + '\n  onsiteNeon1291();', 'install neon halo', 'spot1117')
    text = text[:m.start(2)] + body + text[m.end(2):]
    return rep(text, "+' · v12.90'; /* v8.19 release922", "+' · v12.91'; /* v8.19 release922", 'release footer', 'page')

if __name__ == '__main__':
    p = Path(sys.argv[1]);p.write_text(apply(p.read_text()))
    print('Applied v12.91 Still on site neon presentation. Author: Andrew Fisher.')
