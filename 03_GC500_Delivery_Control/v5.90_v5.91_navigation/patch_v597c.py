#!/usr/bin/env python3
"""v5.97 (part C) - three more by-lines print the date alone: a cancelled row's words, "sent by … on …" on the
labour scope and the rehire quotes, and "what … said" on the race weekend loading.  python3 patch_v597c.py <builder|page>"""
import sys, re
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)
rep("""  return (c.why || 'Cancelled.') + ' ' + (c.said_by || 'somebody') + ', ' + fmtDate(c.on).slice(0, 11).trim();""",
    """  return (c.why || 'Cancelled.') + ' ' + fmtDate(c.on).slice(0, 11).trim();""", 'cancel words')
rep("""${esc(SCOPE.document)}, sent by ${esc(F.supplied_by)} on ${esc(fmtDate(F.supplied_on))} as what currently gets charged""",
    """${esc(SCOPE.document)}, received ${esc(fmtDate(F.supplied_on))} as what currently gets charged""", 'scope received')
rep("""printed ${esc(fmtDate(R.quotes_dated))}, sent by ${esc(R.supplied_by)} on ${esc(fmtDate(R.supplied_on))}""",
    """printed ${esc(fmtDate(R.quotes_dated))}, received ${esc(fmtDate(R.supplied_on))}""", 'quotes received')
m = re.findall(r"flat is what \$\{esc\([^)]*\)\} said", s); print('flat-is-what sites', len(m))
s = re.sub(r"flat is what \$\{esc\([^)]*\)\} said", "flat is what was said", s)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.97c', n0, '->', len(s))
