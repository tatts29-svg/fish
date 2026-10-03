#!/usr/bin/env python3
"""v7.23 - Questions cleaned up (see questions723_src.js). Andrew Fisher, 28 Sep 2026: "revisit all questions ... close off
some of these yourself ... easy to understand ... why and what info we need", with the Questions review handover of the
same morning. Replaces questionsList() and renderQuestions_held(); nothing else reads either.
    python3 patch_v723.py <page.html> [questions723_src.js] [questions723.css]"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))

def fn_span(t, name):
    m = re.search(r'function ' + re.escape(name) + r'\s*\(', t); assert m, name
    assert len(re.findall(r'function ' + re.escape(name) + r'\s*\(', t)) == 1, name
    k = t.index('{', m.start()); d = 0
    for p in range(k, len(t)):
        if t[p] == '{': d += 1
        elif t[p] == '}':
            d -= 1
            if d == 0: return m.start(), p + 1

p = sys.argv[1]
jsf = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'questions723_src.js')
cssf = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'questions723.css')
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
if 'const QHIST = [' in t: sys.exit('v7.23 already applied')
js = open(jsf, encoding='utf-8').read().rstrip() + '\n'; css = open(cssf, encoding='utf-8').read().rstrip() + '\n'
if re.findall(r" \.[A-Za-z_]", js): sys.exit('space before a dot in the source')
a, b = fn_span(t, 'renderQuestions_held'); t = t[:a] + '/* v7.23 - replaced; see questionsList */' + t[b:]
a, b = fn_span(t, 'questionsList'); t = t[:a] + js + t[b:]
k = t.find('</style>'); t = t[:k] + css + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(p), n0, '->', len(t))
