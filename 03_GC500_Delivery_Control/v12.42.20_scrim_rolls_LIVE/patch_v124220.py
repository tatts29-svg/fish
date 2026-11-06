"""v12.42.20 - scrim rolls charged at Baseplan: 10000484/1 $984.12 (12 rolls), 10000484/2 $950.00 (10 rolls), 10000475/1
$2,296.28 (28 rolls), $4,230.40 in all. Andrew, 28 Oct 2026: "its a roll of scrim we brought to assit with fencing ... dont
take off fencing" - the rolls are extra cloth, separate from the scrim fence on Advanced's dockets; the fencing is unchanged.
Author: Andrew Fisher. Footer v12.42.20.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = 'const BP12429 = {"10000523|2": 450.34,'
B = 'const BP12429 = {"10000484|1": 984.12, "10000484|2": 950.0, "10000475|1": 2296.28, /* v12.42.20: scrim rolls we brought, separate from the fencing (Andrew, 28 Oct 2026) */ "10000523|2": 450.34,'
FOOT = ("+' · v12.42.19'; /* v8.19 release922", "+' · v12.42.20'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, 'scrim rolls'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124220 applied')
