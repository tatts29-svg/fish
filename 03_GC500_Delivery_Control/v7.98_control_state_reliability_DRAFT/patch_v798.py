#!/usr/bin/env python3
"""v7.98 — current drawer connection state and optional font preflight.
Author: Andrew Fisher.

Apply after v7.96 (or a later page carrying Equipment). This patch changes no layout,
record, storage key, timer, picture, map or Showcase code.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

page = sys.argv[1]
text = Path(page).read_text(encoding='utf-8')
if 'function drawerSync798Word(' in text:
    sys.exit('v7.98 already applied')
if 'function eq796(' not in text:
    sys.exit('v7.98 needs v7.96 Equipment first')

source = Path(__file__).with_name('control798_src.js').read_text(encoding='utf-8')
text = rep(text, 'function precisionTags(a){', source + '\nfunction precisionTags(a){',
           'drawer status helpers', page)
text = rep(text,
           " const sync = SYNC.status === 'live' ? (SYNC.readonly ? 'Live · view only' : 'Live') : SYNC.status === 'file' ? 'No service behind this copy'\n"
           " : SYNC.status === 'connecting' ? 'Connecting' : SYNC.status === 'unreachable' ? 'Offline · will send' : 'Snapshot';",
           ' const sync = drawerSync798Word();', 'drawer initial status', page)
text = rep(text, ' recStrip(waiting, since);\n}',
           ' recStrip(waiting, since);\n drawerSync798Refresh(); /* v7.98 — text only; keep the open fields and focus */\n}',
           'refresh drawer on existing status updates', page)
text = rep(text,
           '.then(states => (document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => null) : null)\n'
           '.then ? document.fonts.ready.then(() => states).catch(() => states) : Promise.resolve(states))',
           '.then(states => (document.fonts && document.fonts.ready) ? document.fonts.ready.then(() => states).catch(() => states) : states)',
           'optional font API preflight', page)
Path(page).write_text(text, encoding='utf-8')
print('v7.98 applied: current drawer connection badge and optional font preflight')
