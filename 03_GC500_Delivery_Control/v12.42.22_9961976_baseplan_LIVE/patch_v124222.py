"""v12.42.22 - 9961976 (NVAC) at Baseplan to the cent: lighting towers LT01-04/LT09 $643.30 each and LT05/06 pods $385.98
each (full hire, not the 3 event days); every generator at Baseplan's figure (not the card over the hire; G10 no longer priced
as 20 kVA); generator labour lines 51 $3,302.42 and 52 $333.12, light tower labour 58 $1,275.96, 350 kVA labour 60 $333.12
(none charged on the page before - no generator or tower labour is ticked). Line 56 event gen tech stays on the event scope
($4,735.97, v12.42.15). Andrew, 28 Oct 2026: "let match our to baseplan please ... for 9961976". Author: Andrew Fisher.
Footer v12.42.22.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

V = {1: 643.3, 2: 643.3, 3: 643.3, 4: 643.3, 5: 643.3, 6: 6260.4, 7: 1254.5, 9: 2412.54, 10: 1132.28, 11: 2187.36, 14: 919.97,
     15: 1142.96, 16: 1544.0, 18: 855.63, 19: 385.98, 20: 385.98, 37: 0, 38: 868.5, 44: 1406.72, 48: 1168.72, 49: 984.33,
     51: 3302.42, 52: 333.12, 58: 1275.96, 60: 333.12}
JS = ', '.join("'9961976|%d': %s" % (k, v) for k, v in V.items())
JD = ', '.join('"9961976|%d": %s' % (k, v) for k, v in V.items())
A1 = "const PIN12421 = {'9994954|10': 2005.08,"
B1 = "const PIN12421 = {" + JS + ", /* v12.42.22: 9961976 at Baseplan (Andrew, 28 Oct 2026) */ '9994954|10': 2005.08,"
A2 = 'const BP12429 = {"10000484|1": 984.12,'
B2 = 'const BP12429 = {' + JD + ', /* v12.42.22: 9961976 at Baseplan (Andrew, 28 Oct 2026) */ "10000484|1": 984.12,'
FOOT = ("+' · v12.42.21'; /* v8.19 release922", "+' · v12.42.22'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A1, B1, '9961976 generator pins'), (A2, B2, '9961976 contract lines'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124222 applied')
