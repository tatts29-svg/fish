"""v12.42.24 - 9961265 (VMS boards) at Baseplan to the cent: line 1 $857.76, 12 VMS09 $1,018.59, 16 VMS12 $589.71, 31 VMS24
$268.05, 32/34/35/37/39 VMS13-17 $482.49 each, 43 VMS05a $107.22, and line 40 labour 24 h $4,247.28 (not charged on the page
before: no VMS install labour is ticked). Line 44 event labour stays on the event scope ($5,924.10). Andrew, 28 Oct 2026:
"match ours to baseplan please". Author: Andrew Fisher. Footer v12.42.24.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

V = {1: 857.76, 12: 1018.59, 16: 589.71, 31: 268.05, 32: 482.49, 34: 482.49, 35: 482.49, 37: 482.49, 39: 482.49, 43: 107.22, 40: 4247.28}
JD = ', '.join('"9961265|%d": %s' % (k, v) for k, v in V.items())
A = 'const BP12429 = {'
B = 'const BP12429 = {' + JD + ', /* v12.42.24: 9961265 at Baseplan (Andrew, 28 Oct 2026) */ '
FOOT = ("+' · v12.42.23'; /* v8.19 release922", "+' · v12.42.24'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, '9961265 lines'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124224 applied')
