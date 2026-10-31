"""v12.42.23 - Fencing, everything included: one card at the top of the Costs tab (money stays off the operational Fencing tab) - dockets invoiced and not yet, labour notes
and at-cost items, fence event labour (event scope), the Advanced race crew (forecast cost), the scrim rolls and 9997710 - with
the docket quantities by type, invoiced against not yet. Display only, read live; the job's total charge does not move.
Andrew, 28 Oct 2026: "i want everything included" -> "One fencing figure on page". Author: Andrew Fisher. Footer v12.42.23.
"""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

A = "function renderFencing(){ const kept849 = captureFenceComponents849('fencing'); return holdAssets(() => { renderFencing_held(); fencePrivateApply(); restoreFenceComponents849(kept849); }); }"
FOOT = ("+' · v12.42.22'; /* v8.19 release922", "+' · v12.42.23'; /* v8.19 release922")


def patch(t, path='page'):
    B = A + '\n' + (HERE / 'allin.js').read_text(encoding='utf-8')
    for a, b, what in ((A, B, 'fencing all-in card'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124223 applied')
