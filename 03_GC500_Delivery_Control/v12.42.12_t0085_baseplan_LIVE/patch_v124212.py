"""v12.42.12 - T0085, the Supply forklift 5.0 t on 9987005/1, at Baseplan's dates (Andrew, 28 Oct 2026: "set it to baseplans
please"): 5 to 28 Oct 2026, 24 days at $150 = $3,600.00, Baseplan (9) to the cent (was 23 days, $3,450.00). Added to the v12.42.9
Baseplan-figure table. Author: Andrew Fisher. Footer v12.42.12.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = ' const BP12429 = {"9987005|2": 480.0,'
B = ' const BP12429 = {"9987005|1": 3600.0, "9987005|2": 480.0,'
FOOT = ("+' · v12.42.11'; /* v8.19 release922", "+' · v12.42.12'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, 'T0085 Baseplan figure'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once')
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124212 applied')
