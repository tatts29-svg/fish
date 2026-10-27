"""v12.42.22 - 9972648 water barriers at Baseplan to the cent: lines 3 WB02 $280.84, 4 WB05 $169.92, 5 WB04 $184.08,
6 WB06 $920.40, 12 WB17 $49.56, 16 WB06 $920.40, 17 WB06 $521.56, 18 WB22 $4.72, 21 WB17 $0.00. Andrew, 28 Oct 2026:
"let match our to baseplan please". Author: Andrew Fisher. Footer v12.42.22.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = 'const BP12429 = {"10000484|1": 984.12,'
B = ('const BP12429 = {"9972648|3": 280.84, "9972648|4": 169.92, "9972648|5": 184.08, "9972648|6": 920.4, "9972648|12": 49.56, '
     '"9972648|16": 920.4, "9972648|17": 521.56, "9972648|18": 4.72, "9972648|21": 0, /* v12.42.22: 9972648 at Baseplan (Andrew, 28 Oct 2026) */ "10000484|1": 984.12,')
FOOT = ("+' · v12.42.21'; /* v8.19 release922", "+' · v12.42.22'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, '9972648 lines'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124222 applied')
