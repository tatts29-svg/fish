# Author: Andrew Fisher. v8.64 page part: the Map explorer's fencing snapshot builds the Documents file index once, not per photo.
import hashlib, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
p = Path(sys.argv[1]); root = Path(__file__).resolve().parent
BASES = {'4b3a61e3ff12921bb1efe34570e6a1ef7a65ce42104bc21ba041340eaf79b64e': 'v8.63'}  # live v8.63
h = hashlib.sha256(p.read_bytes()).hexdigest()
assert h in BASES, 'Wrong live base ' + h
s = p.read_text(encoding='utf-8-sig')
assert 'gc500FenceSnap864' not in s and 'window.gc500FencingMapSnapshot = function(){' in s and 'function dropFileIndex(){' in s
js = '\n/* v8.64 fencing snapshot START */\n' + root.joinpath('fencesnap864.js').read_text() + '/* v8.64 fencing snapshot END */\n'
tail = '</script>\n<style id="flicker863">'
i = s.rindex(tail)
s = s[:i] + js + s[i:]
s = replace(s, '· ' + BASES[h], '· v8.64', 'footer version', str(p))
p.write_text(s, encoding='utf-8-sig')
