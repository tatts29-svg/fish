#!/usr/bin/env python3
"""Author: Andrew Fisher. v9.29 unload-order icons on the Arrange loads rows (read only, no record or money change)."""
from pathlib import Path
import sys
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text(encoding='utf-8-sig'); bom = p.read_bytes().startswith(b'\xef\xbb\xbf')
if 'id="unload929-script"' in s: raise SystemExit('v9.29 is already applied')
if 'units925-script' not in s or 'Shapes926.panel(el,current,ui.selected)' not in s: raise SystemExit('needs v9.26 shapes in Arrange loads (live v9.28)')
s = rep(s, " · v9.28'; /* v8.19", " · v9.29'; /* v8.19", 'release footer', p)
css = (here / 'unload929.css').read_text(encoding='utf-8')
js = (here / 'unload929_src.js').read_text(encoding='utf-8')
s = rep(s, '<script id="drops911-script">',
        '<style id="unload929-style">' + css + '</style>\n<script id="unload929-script">\n' + js + '</script>\n<script id="drops911-script">',
        'icons and their style, before Arrange loads', p)
s = rep(s, "  const rows = model.loads.map((load, index) => {",
        "  const icons929 = typeof Unload929 !== 'undefined' ? Unload929.forDay(model.day) : null;\n  const rows = model.loads.map((load, index) => {",
        'the day\'s loads, worked out once per list', p)
s = rep(s, "'</b><span><strong>' + h(refs) + '</strong><span class=\"drops911-row-meta\">'",
        "'</b><span><strong>' + h(refs) + '</strong>' + (icons929 ? icons929(load) : '') + '<span class=\"drops911-row-meta\">'",
        'icons under the references on each row', p)
p.write_text(('﻿' if bom else '') + s, encoding='utf-8'); print('v9.29 unload-order icons applied; no records changed')
