#!/usr/bin/env python3
"""Compare two parity captures: every pane's innerText and the Build cards. usage: pdiff.py a.json b.json"""
import json, sys, difflib, re
a, b = (json.load(open(f)) for f in sys.argv[1:3])
print('versions', a.get('version'), a['extra'].get('version2'), b.get('version'), b['extra'].get('version2'))
print('errors', a.get('errors'), b.get('errors'), a.get('err'), b.get('err'))
# text that moves with the clock (countdowns, "x min ago") is reported separately
clock = re.compile(r'\b\d+\s*(s|sec|secs|seconds|min|mins|minutes|h|hrs|hours)\b( ago)?|\b\d{1,2}:\d{2}(:\d{2})?\b|updated .*|ago\b', re.I)
same = diff = 0
for k in sorted(set(a['tabs']) | set(b['tabs'])):
    ta, tb = (a['tabs'].get(k) or {}).get('text'), (b['tabs'].get(k) or {}).get('text')
    if ta == tb:
        same += 1; print(f'  SAME {k} ({len(ta or "")} chars, {a["tabs"].get(k, {}).get("n")} / {b["tabs"].get(k, {}).get("n")} elements)'); continue
    la, lb = (ta or '').splitlines(), (tb or '').splitlines()
    d = [x for x in difflib.unified_diff(la, lb, lineterm='', n=0) if not x.startswith(('---', '+++', '@@'))]
    only_clock = all(clock.search(x) for x in d)
    diff += 1
    print(f'  DIFF {k}: {len(d)} lines' + (' (clock text only)' if only_clock else ''))
    for x in d[:12]: print('     ', x[:200])
ca, cb = a['extra'].get('timelineCards'), b['extra'].get('timelineCards')
print('timeline cards identical:', ca == cb, len(ca or []), len(cb or []))
if ca != cb:
    for x, y in zip(ca or [], cb or []):
        if x != y: print('   ', json.dumps(x)[:300]); print('   ', json.dumps(y)[:300]); break
print('panes same', same, 'diff', diff)
fs = fd = 0
for k in sorted(set(a['tabs']) | set(b['tabs'])):
    fa, fb = (a['tabs'].get(k) or {}).get('full'), (b['tabs'].get(k) or {}).get('full')
    if fa == fb: fs += 1
    else:
        fd += 1; import os
        i = next((j for j in range(min(len(fa or ''), len(fb or ''))) if fa[j] != fb[j]), None)
        print('  FULL TEXT DIFF', k, len(fa or ''), len(fb or ''), 'first at', i, repr((fa or '')[max(0,(i or 0)-80):(i or 0)+120]), '||', repr((fb or '')[max(0,(i or 0)-80):(i or 0)+120]))
print('full textContent (incl. folded/hidden) same', fs, 'diff', fd)
