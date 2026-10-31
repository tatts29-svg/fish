# Author: Andrew Fisher. v8.87 Map explorer, page part: the unit card's progress (the Timeline's five stages, who, when, the due day,
# what is left), the Progress button's dialog, and Escape in this page closing Fencing on the map. Presentation only; no data,
# record or other-tab changes. The explorer itself ships in the machine set (see patch_explorer887.py).
# Builds on v8.85 (or v8.86), chained in one build while they are unpublished:
#   toolchain/build.sh v8.87 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.87_map_explorer_DRAFT/patch_v887.py
import sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text()
assert 'where885-style' in s, 'v8.85 must be applied first'
assert 'window.gc500PlanCard = function(key){' in s and 'function timeline841State(' in s and 'function effectiveDates(' in s and 'function expApi(){' in s
assert 'gc500Map887' not in s, 'v8.87 is already applied'
hits = [(m, s.count(m)) for m in (' · v8.85', ' · v8.86')]   # the single release footer marker, whichever of the two unpublished builds is underneath
mark = [m for m, n in hits if n == 1]
assert len(mark) == 1 and sum(n for _, n in hits) == 1, 'expected exactly one release footer marker (v8.85 or v8.86): ' + repr(hits)
s = rep(s, mark[0], ' · v8.87', 'release footer', str(p))
js = (here / 'source' / 'map887.js').read_text()
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="map887-script">\n' + js + '</script>\n' + tag + tail
p.write_text(s)
