#!/usr/bin/env python3
"""Author: Andrew Fisher. v8.18 — selected-day weather scenes, using real existing forecast rows."""
import hashlib
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
raw = open(path, 'rb').read()
text = raw.decode('utf-8')
if 'const WX818 =' in text or 'gc500-weather-v818' in text:
    sys.exit('v8.18 already applied')
base_sha = '7ae89da4e80b070ade2977ef4e47ed3e766be6dc7722bd610e21ad78ddaa77d0'
if hashlib.sha256(raw).hexdigest() != base_sha:
    sys.exit('v8.18 requires the verified v8.16 base 7ae89da4; review a changed base before rebuilding')
for anchor in ('function driverPos816(', 'function renderTimeline_held(){', 'function wxfPaint(){', 'function motionApply(){'):
    if anchor not in text:
        sys.exit('v8.18 missing required base anchor: ' + anchor)
js = open(os.path.join(here, 'weather818_src.js'), encoding='utf-8').read()
css = open(os.path.join(here, 'weather818.css'), encoding='utf-8').read()
if '</script' in js.lower() or '</style' in css.lower() or '__WX818_ART__' in js:
    sys.exit('v8.18 source is incomplete or would close its containing tag')

text = rep(text, '<meta name="viewport" content="width=device-width, initial-scale=1">',
           '<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="gc500-weather-v818" content="selected-day weather v8.18">',
           'weather release marker', path)
text = rep(text, 'function wxCardHtml(iso){', js + '\n\nfunction wxCardHtml(iso){', 'weather runtime', path)
text = rep(text,
           'try { const kp = ldKeep(); const r = holdAssets(renderTimeline_held); ldPutBack(kp); return r; } finally { state.disc = keep[0]; state.light = keep[1]; } }',
           'try { const kp = ldKeep(); const r = holdAssets(renderTimeline_held); ldPutBack(kp); WX818.reconcile(); return r; } finally { state.disc = keep[0]; state.light = keep[1]; } }',
           'timeline weather reconciliation', path)
text = rep(text,
           "document.querySelectorAll('.daywx[data-wxday]').forEach(el => { const h = wxDayHtml(el.dataset.wxday, 'line'); if (h && el.innerHTML !== h) el.innerHTML = h; });",
           "document.querySelectorAll('.daywx[data-wxday]').forEach(el => { const h = wxDayHtml(el.dataset.wxday, 'line'); if (el.innerHTML !== h) el.innerHTML = h; });\n WX818.reconcile(); /* v8.18 - refresh, deletion and expiry keep the scene and heading honest */",
           'async forecast repaint and empty heading', path)
text = rep(text,
           "foldForPhone($('#pane-' + state.tab));\n}",
           "foldForPhone($('#pane-' + state.tab));\n WX818.reconcile(); /* v8.18 - pause on tab departure and release detached scene nodes */\n}",
           'full render weather lifecycle', path)
at = text.index('</style>')
text = text[:at] + '\n' + css + '\n' + text[at:]
open(path, 'w', encoding='utf-8').write(text)
print('v8.18 applied: approved weather art, native selected-day motion, real forecast eligibility')
