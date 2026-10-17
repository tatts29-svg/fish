#!/usr/bin/env python3
"""v7.98 — drawer connection state, font fallback and recorded delivery notes.
Author: Andrew Fisher.

Apply after v7.96 (or a later page carrying Equipment). This patch changes no layout,
record, storage key, timer, picture, map or Showcase code. Existing print fields carry
their recorded delivery notes using the current component styles.
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
text = rep(text,
           "dpSec('Where it goes', dpWhere(g, doc, posOf))",
           "dpSec('Where it goes', dpWhere(g, doc, posOf) + dpDeliveryNotes798(g))",
           'recorded delivery notes on driver and installer sheets', page)
text = rep(text,
           "wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';",
           "wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';\n"
           "wrap.style.setProperty('--dpz', '1'); /* v7.98 — measure rebuilt A4 sheets before the screen-only preview fit */",
           'reset preview scale before measuring print sheets', page)
text = rep(text, 'body.dpbar-on{padding-top:64px}',
           'body.dpbar-on{padding-top:var(--dpbar-height798,64px)}',
           'preview offset follows wrapped toolbar height', page)
text = rep(text, 'function dpZoomFit(){',
           "function dpZoomFit(){\n"
           " const bar = document.getElementById('dpbar');\n"
           " const offset = () => { if (bar && document.body.classList.contains('dpbar-on')) document.body.style.setProperty('--dpbar-height798', Math.ceil(bar.getBoundingClientRect().height) + 'px'); };",
           'measure toolbar in existing preview fit and resize path', page)
text = rep(text, " const w = document.getElementById('dayprint'); if (!w) return;\n w.style.setProperty('--dpz', '1');",
           " const w = document.getElementById('dayprint'); if (!w) { offset(); return; }\n w.style.setProperty('--dpz', '1');",
           'measure toolbar without a print wrapper', page)
text = rep(text,
           " w.style.setProperty('--dpz', String(sw > vw ? Math.max(0.3, Math.floor((vw - 12) / sw * 1000) / 1000) : 1));\n}",
           " w.style.setProperty('--dpz', String(sw > vw ? Math.max(0.3, Math.floor((vw - 12) / sw * 1000) / 1000) : 1));\n offset();\n}",
           'measure final toolbar wrapping after preview width fit', page)
text = rep(text,
           " const p = b.querySelector('[data-dpbar-print]'); p.disabled = !ready;\n}",
           " const p = b.querySelector('[data-dpbar-print]'); p.disabled = !ready;\n dpZoomFit();\n}",
           'refit after preview status text wraps', page)
text = rep(text, " document.body.classList.remove('dpbar-on');",
           " document.body.classList.remove('dpbar-on');\n document.body.style.removeProperty('--dpbar-height798');",
           'clear preview offset on close', page)
text = rep(text, " document.body.appendChild(bar); document.body.classList.add('dpbar-on');",
           " document.body.appendChild(bar); document.body.classList.add('dpbar-on'); dpZoomFit();",
           'measure initial preview toolbar', page)
Path(page).write_text(text, encoding='utf-8')
print('v7.98 applied: current drawer badge, optional font preflight and delivery-sheet notes')
