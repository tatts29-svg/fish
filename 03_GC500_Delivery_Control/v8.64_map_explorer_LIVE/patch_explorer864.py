# Author: Andrew Fisher. v8.64 machine part: prepares the Map explorer's index.html plus two new assets in an output folder.
#   python3 patch_explorer864.py <live explorer index.html> <out dir>
# It needs the exact registered v8.37 index.html, adds explorer-fix864.css after fencing-map.css and explorer-fix864.js after
# fencing-map-explorer.js (each with a content-hash cache token), and copies the two assets. Every other explorer asset is
# unchanged and must stay as registered. This helper does not register or upload anything.
import hashlib, os, shutil, sys
from pathlib import Path
src, out = Path(sys.argv[1]), Path(sys.argv[2]); root = Path(__file__).resolve().parent / 'explorer'
BASE = '9c7e04a2baa12cdb9ad3a008a409b10b20e60f8f62fbc1cb6a1f0018b05deb99'
h = hashlib.sha256(src.read_bytes()).hexdigest()
assert h == BASE, 'Wrong explorer index.html ' + h
s = src.read_text(encoding='utf-8')
assert 'explorer-fix864' not in s
tok = lambda f: hashlib.sha256(root.joinpath(f).read_bytes()).hexdigest()[:12]
css_old = '<link rel="stylesheet" href="fencing-map.css?v=a4f3e8688702">'
js_old = '<script src="fencing-map-explorer.js?v=31418b528009"></script>'
assert s.count(css_old) == 1 and s.count(js_old) == 1, 'anchors'
s = s.replace(css_old, css_old + '\n<link rel="stylesheet" href="explorer-fix864.css?v=' + tok('explorer-fix864.css') + '">')
s = s.replace(js_old, js_old + '\n<script src="explorer-fix864.js?v=' + tok('explorer-fix864.js') + '"></script>')
out.mkdir(parents=True, exist_ok=True)
out.joinpath('index.html').write_text(s, encoding='utf-8')
for f in ('explorer-fix864.js', 'explorer-fix864.css'): shutil.copy(root / f, out / f)
for f in ('index.html', 'explorer-fix864.js', 'explorer-fix864.css'):
    b = out.joinpath(f).read_bytes(); print(f, len(b), hashlib.sha256(b).hexdigest())
