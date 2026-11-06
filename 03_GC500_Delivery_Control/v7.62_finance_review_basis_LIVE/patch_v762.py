#!/usr/bin/env python3
"""Author: Andrew Fisher. v7.62: evidence-qualified month-end Finance review.

Apply after v7.60 and v7.61. Presentation and read-only calculations only.
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, os.fspath(HERE.parent / 'toolchain'))
from rep import rep

p = sys.argv[1]
t = Path(p).read_text(encoding='utf-8')
if 'function acc762Round(' in t or 'function acc762FmtMoney(' in t:
    sys.exit('v7.62 already applied')
for marker in ['function pl760Ticks(', 'function acc761Model(', 'function acc761Labour(',
               'function acc761Text(', 'function acc761Bind(']:
    if marker not in t:
        sys.exit('needs ' + marker)

def section(text, start, end, source):
    if text.count(start) != 1 or text.count(end) != 1:
        sys.exit('ambiguous section: ' + start)
    first, last = text.index(start), text.index(end)
    if last <= first:
        sys.exit('wrong section order: ' + start)
    replacement = (HERE / source).read_text(encoding='utf-8').strip() + '\n'
    return rep(text, text[first:last], replacement, source, p, True)

t = section(t, 'function acc761Model(', 'function acc761Labour(', 'acc762_model.js')
t = section(t, 'function acc761Labour(', 'function acc761Text(', 'acc762_labour.js')
t = section(t, 'function acc761Text(', 'function acc761Bind(', 'acc762_ui.js')
t = rep(t, "'GC500_Accruals_' + X.month", "'GC500_Finance_review_' + X.month", 'review CSV name', p, True)
t = rep(t, 'Could not copy — use Export accruals CSV instead.', 'Could not copy — use Export review CSV instead.', 'review CSV fallback', p, True)
Path(p).write_text(t, encoding='utf-8')
print('ok', p)
