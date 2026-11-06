#!/usr/bin/env python3
"""Author: Andrew Fisher. Today selected-card motion, built from the current live page."""
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

folder = Path(__file__).resolve().parent
page = Path(sys.argv[1])
text = page.read_text(encoding='utf-8')
if 'TodayMotion820' in text or 'gc500-today-v820' in text:
    sys.exit('v8.20 already applied; refusing a second installation')
base_marker = '<meta name="gc500-weather-v818" content="selected-day weather v8.18">'
if text.count(base_marker) != 1 or 'function renderToday(' not in text:
    sys.exit('v8.20 requires the live v8.18 weather release and native Today renderer')

css = (folder / 'today820_src.css').read_text(encoding='utf-8')
js = (folder / 'today820_src.js').read_text(encoding='utf-8')
text = rep(text, base_marker, base_marker + '\n'
           '<meta name="gc500-today-v820" content="GC500 v8.20 — Today selected-card motion">\n'
           '<style id="today-polish-v820">\n' + css + '\n</style>',
           'Today release marker and scoped styles', page)

# A nested printable template also contains closing document tags. Bind the replacement
# to the actual document tail, then use the shared exactly-once replacement helper.
tail_match = re.search(r'(?P<tail>.{0,320}</body>\s*</html>\s*)\Z', text, re.S)
if not tail_match:
    sys.exit('v8.20 cannot find the final document closing tags')
tail = tail_match.group('tail')
updated_tail = tail[:tail.rfind('</body>')] + '<script id="today-motion-v820">\n' + js + '\n</script>\n' + tail[tail.rfind('</body>'):]
text = rep(text, tail, updated_tail, 'Today selected-card controller at document end', page)

footer = "$('#footL').textContent = DATA.brand.footer + ' · built ' + DATA.built + ' · ' + DATA.build_version;"
text = rep(text, footer, footer[:-1] + " + ' · Today v8.20';", 'Today release footer', page)
page.write_text(text, encoding='utf-8')
print('v8.20 Today selected-card motion applied; native record calculations and routes unchanged')
