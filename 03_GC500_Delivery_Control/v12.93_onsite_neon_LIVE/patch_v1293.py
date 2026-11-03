"""Author: Andrew Fisher. Neon glow and pulse on the existing Still on site view."""
from pathlib import Path
import hashlib
import re
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '49ddd53f5ff3edc7f45df2287f27568af7713a02a08751d7d70c47d82118ecf2'

def apply(text):
    if 'function onsiteNeon1291()' in text:
        raise ValueError('v12.93 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v12.93 requires exact verified live v12.92')
    pattern = re.compile(r'(<script id="spot1117-script">)(.*?)(</script>)', re.S)
    matches = list(pattern.finditer(text))
    if len(matches) != 1:
        raise ValueError('Expected one map presentation script')
    m = matches[0]
    body = rep(m.group(2), '  stillOnSite1290();', '  stillOnSite1290();\n' + (HERE / 'neon1291_src.js').read_text() + '\n  onsiteNeon1291();', 'install neon halo', 'spot1117')
    text = text[:m.start(2)] + body + text[m.end(2):]
    return rep(text, "+' · v12.92'; /* v8.19 release922", "+' · v12.93'; /* v8.19 release922", 'release footer', 'page')

if __name__ == '__main__':
    p = Path(sys.argv[1]);p.write_text(apply(p.read_text()))
    print('Applied v12.93 Still on site neon presentation. Author: Andrew Fisher.')
