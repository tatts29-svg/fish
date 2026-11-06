# Author: Andrew Fisher. v8.97 Completion on the maps, page part: the verified completion the Map explorer asks for
# (gc500CompleteKeys897: the record's Complete tick AND the Timeline's Finished reading), and "✓ Complete" on the finder's
# asset rows. Presentation only; no data, record or money changes. The explorer itself ships in the machine set
# (see patch_explorer897.py). Builds on v8.87 (the explorer card's Timeline stage) and chains after v8.89 .. v8.96:
#   toolchain/build.sh v8.97 <the full chain ... patch_v894.py> v8.97_map_completion_DRAFT/patch_v897.py
import re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text()
assert 'gc500Map887' in s, 'v8.97 needs v8.87 (the explorer card reads the Timeline stage) first'
assert 'window.gc500DoneKeys = function(){' in s and 'function timeline841State(' in s and 'function deliveryOf(' in s and 'function finderRow(' in s and 'function assetOf(' in s
assert 'gc500Map897' not in s and 'map897-script' not in s, 'v8.97 is already applied'
# the release footer: whichever release this follows, exactly one marker, once
marks = re.findall(r' · v8\.(?:89|9[0-6])\b', s)
assert len(marks) == 1 and s.count(marks[0]) == 1, 'expected one footer marker once, found %r' % marks
s = rep(s, marks[0], ' · v8.97', 'release footer', str(p))
css = (here / 'source' / 'map897.css').read_text(); js = (here / 'source' / 'map897.js').read_text()
assert '</style' not in css and '</script' not in js
for bad, what in ((r'\$\s?\d', 'a dollar figure'), (r'(?i)site\s?iq', 'SiteIQ'), (r'(?i)\b(?:codex|claude|chatgpt|openai|anthropic)\b', 'an agent name')):
    assert not re.search(bad, js + css), 'v8.97 carries ' + what
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<style id="map897-style">' + css + '</style>\n<script id="map897-script">\n' + js + '</script>\n' + tag + tail
p.write_text(s)
print('v8.97 page part applied: gc500CompleteKeys897, finder rows, footer', marks[0].strip(), '->', 'v8.97')
