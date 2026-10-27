"""v12.42.18 - 10000523 at Baseplan: line 2 water $450.34 and line 11 site shift of the supply container $500.00 charged.
Andrew, 28 Oct 2026: "can you not fix this 10000523-KINP"; water "Charge it, match Baseplan" (over the 27 Oct ruling that
water sits in the pump-outs); site shift "Yes, 2 shifts: charge it" (9968862/136 on 19 Oct is the first). Author: Andrew Fisher.
Footer v12.42.18.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = 'const BP12429 = {"9987005|1": 3600.0,'
B = 'const BP12429 = {"10000523|2": 450.34, "10000523|11": 500.0, /* v12.42.18: Andrew, 28 Oct 2026 - water charged to match Baseplan; a second site shift */ "9987005|1": 3600.0,'
FOOT = ("+' · v12.42.17'; /* v8.19 release922", "+' · v12.42.18'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, '10000523 lines 2 and 11'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124218 applied')
