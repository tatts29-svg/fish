"""v12.42.10 - the 60 ft straight boom 1286482 (EQ0003, 9992300/12) bills from Baseplan's dates (Andrew, 28 Oct 2026:
"60ft boom will bill from baseplan dates"): 21 to 27 Oct 2026, 7 days at $310.95 = $2,176.65, Baseplan (8)'s prebill to the cent.
It was 3 event days (23-25 Oct, v11.05). The v11.05 association wraps contractCharge for this line, so this wraps after it.
Author: Andrew Fisher. Footer v12.42.10.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = "  const previousFallback = rateFor;"
B = ("  /* v12.42.10: Baseplan's dates for this line, 21-27 Oct 2026 (Andrew, 28 Oct 2026: \"60ft boom will bill from baseplan dates\") */\n"
     "  const charge1105 = contractCharge;\n"
     "  contractCharge = function (row) {\n"
     "    const out = charge1105.apply(this, arguments);\n"
     "    if (!isTarget(row) || !out || typeof out !== 'object') return out;\n"
     "    return Object.assign({}, out, {amount: 2176.65, days: 7, basis: '$310.95 a day x 7 days, 21 to 27 Oct 2026 - Baseplan (8) dates (Andrew, 28 Oct 2026)'});\n"
     "  };\n" + A)
FOOT = ("+' · v12.42.9'; /* v8.19 release922", "+' · v12.42.10'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, 'boom on Baseplan dates'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once')
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124210 applied')
