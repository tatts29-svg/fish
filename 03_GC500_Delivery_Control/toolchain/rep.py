"""rep(): the one text replacement every GC500 patch uses. It matches the old text with any run of whitespace
standing for any other, and insists the match is found EXACTLY ONCE - so a patch never lands in the wrong place and
never lands twice. need=False turns a miss into a printed skip instead of a stop.

    import sys, os; sys.path.insert(0, '<repo>/03_GC500_Delivery_Control/toolchain'); from rep import rep
    t = rep(t, old_text, new_text, 'what this is', path_for_messages, True)
"""
import os, re, sys


def rep(text, old, new, what, path, need=True):
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1:
        if need: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
        print(f'  skip {what} in {os.path.basename(path)} ({len(ms)})'); return text
    m = ms[0]; return text[:m.start()] + new + text[m.end():]
