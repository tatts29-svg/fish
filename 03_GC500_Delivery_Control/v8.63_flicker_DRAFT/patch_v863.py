# Author: Andrew Fisher. v8.63 - pages open and refresh without flicker (no white flash, steady Today banner).
import hashlib, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
p = Path(sys.argv[1]); root = Path(__file__).resolve().parent
BASES = {  # the exact live page this patch is for, and the footer version it carries
    'a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7': 'v8.61',  # test base only (v8.62 not yet live)
}
h = hashlib.sha256(p.read_bytes()).hexdigest()
assert h in BASES or os.environ.get('V863_BASE') == h, 'Wrong live base ' + h
prev = BASES.get(h) or os.environ['V863_PREV']
s = p.read_text(encoding='utf-8-sig')
assert 'gc500Flicker863' not in s and 'function wireBoard(' in s and '.pane.on.arrive > *{animation:v610rise' in s
def rep(a, b):
    global s
    s = replace(s, a, b, a[:70], str(p))
tail = '\n</script>\n</body></html>'
assert s.endswith(tail) or s.rstrip().endswith('</script>\n</body></html>')
js = '\n/* v8.63 flicker START */\n' + root.joinpath('flicker863.js').read_text() + '/* v8.63 flicker END */\n'
css = '<style id="flicker863">\n' + root.joinpath('flicker863.css').read_text() + '</style>\n'
i = s.rindex('</script>\n</body></html>')
s = s[:i] + js + '</script>\n' + css + '</body></html>' + s[i + len('</script>\n</body></html>'):]
rep('· ' + prev, '· v8.63')
p.write_text(s, encoding='utf-8-sig')
