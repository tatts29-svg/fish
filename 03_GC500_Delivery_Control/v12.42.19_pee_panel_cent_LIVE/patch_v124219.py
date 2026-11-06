"""v12.42.19 - pee panel hire at Baseplan's $672.17 (9994954/19: 6 x $672.17 = $4,033.02), not the card's $672.1677 ($4,033.01).
Andrew, 28 Oct 2026: "pee panel fix the cent up to match". Author: Andrew Fisher. Footer v12.42.19.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = "description:'Pee Panel',uom:'EA',daily:9.5996,hire:672.1677000000001}"
B = "description:'Pee Panel',uom:'EA',daily:9.5996,hire:672.17 /* v12.42.19: Baseplan 9994954/19 (Andrew, 28 Oct 2026) */}"
FOOT = ("+' · v12.42.18'; /* v8.19 release922", "+' · v12.42.19'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, 'pee panel rate'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124219 applied')
