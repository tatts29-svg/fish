#!/usr/bin/env python3
"""v7.77 — distinguish text submission from delivery. Author: Andrew Fisher."""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

target = Path(sys.argv[1])
text = target.read_text(encoding='utf-8')
if 'function sms777Submission(' in text:
    sys.exit('v7.77 already applied')
if 'function go776Held(' not in text or '/* mms757 - with a picture of the map */' not in text:
    sys.exit('v7.77 needs the live v7.76 messaging base')
start = text.index('async function smsDropBox(a){')
end = text.index('\n/* Can this copy of the page ask the service to send an email?', start)
before = text[start:end]
if 'setTimeout(close, 2600)' not in before or "const run = async dry => {" not in before:
    sys.exit('v7.77: the messaging function changed; review before applying')
text = rep(text, before, (HERE / 'sms777_src.js').read_text().strip(), 'truthful message submission and delivery', str(target), True)
text = rep(text,
    "const go = d.querySelector('#smGo'); if (go) go.disabled = over;",
    "const go = d.querySelector('#smGo'); if (go) go.disabled = over || !!d._sms777Busy || !!d._sms777Locked;",
    'preserve the pending-send lock while editing the message', str(target), True)
target.write_text(text, encoding='utf-8')
print('v7.77 applied: per-recipient submission, delivery lookup, safe retry control')
