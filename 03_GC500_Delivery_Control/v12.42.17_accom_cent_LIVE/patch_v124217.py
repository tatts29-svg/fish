"""v12.42.17 - accommodation and travel at Baseplan's $27,700.00 (9968862/140 + 9968955/163, $13,850 each), not $27,699.99.
The scope total rounded people and accommodation together, so the P&L's accommodation line (total less people) lost a cent;
the total is now people (rounded) plus accommodation (rounded). Andrew, 28 Oct 2026: "fix the 1 cent". Author: Andrew Fisher.
Footer v12.42.17.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = "total: cents(peopleExact + at), edits,"
B = "total: cents(people + cents(at)), edits, /* v12.42.17: people and accommodation each to the cent (Andrew, 28 Oct 2026: \"fix the 1 cent\") */"
FOOT = ("+' · v12.42.16'; /* v8.19 release922", "+' · v12.42.17'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, 'accommodation cent'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124217 applied')
