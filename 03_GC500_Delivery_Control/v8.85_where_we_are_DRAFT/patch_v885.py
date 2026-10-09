# Author: Andrew Fisher. v8.85 Where we are: whole-job progress with five large race lights above the group cards.
# Presentation only; no data, record or other-tab changes. Needs v8.84 first: live, or chained in the same build:
#   toolchain/build.sh v8.85 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py
import sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text()
assert 'today884-style' in s and s.count(' · v8.84') == 1, 'v8.84 must be applied first'
assert 'function renderToday_held(' in s and 'function timeline841Lamp(' in s and 'function todayWorkSummary848(' in s
assert 'where885-style' not in s and 'function progress881Model(' not in s
s = rep(s, ' · v8.84', ' · v8.85', 'release footer', str(p))
s = s.replace('</head>', '<style id="where885-style">' + (here / 'where885.css').read_text() + '</style>\n</head>', 1)
js = (here / 'progress881_model.js').read_text() + '\n' + (here / 'where885.js').read_text()
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="where885-script">\n' + js + '</script>\n' + tag + tail
p.write_text(s)
