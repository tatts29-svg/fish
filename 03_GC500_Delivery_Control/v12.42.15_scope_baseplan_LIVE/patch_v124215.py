"""v12.42.15 - event people at Baseplan's hours (Andrew, 28 Oct 2026: "Make our Match Baseplan"): project manager 30.44 h
$4,569.34 (9968862/141 + 9968955/164, half each), event toilets 27.15 h $2,474.45 (9968955/165), gen tech 31.55 h $4,735.97
(9961976/56), VMS movements 65 h $5,924.10 (9961265/44). The scope's own day hours stay shown; the line's total is Baseplan's.
Entertainment and fence lines already match. Author: Andrew Fisher. Footer v12.42.15.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = " return row; });\n const atV = safeNum((S.rates || {})['scope-at'], MAX_RATE);"
B = (" return row; });\n"
     " /* v12.42.15: Baseplan's hours and dollars on these lines (Andrew, 28 Oct 2026: \"Make our Match Baseplan\") */\n"
     " const BP12415 = {pm: [30.44, 4569.34, '9968862/141 + 9968955/164'], toilets: [27.15, 2474.45, '9968955/165'], gentech: [31.55, 4735.97, '9961976/56'], vms: [65, 5924.10, '9961265/44']};\n"
     " lines.forEach(row => { const b = BP12415[row.key]; if (!b) return; row.scope_hours12415 = row.hours; row.scope_amount12415 = row.amount; row.hours = b[0]; row.amount_exact = b[1]; row.amount = b[1]; row.baseplan12415 = 'Baseplan ' + b[2] + ': ' + b[0] + ' h, $' + b[1].toFixed(2) + ' (Andrew, 28 Oct 2026)'; });\n"
     " const atV = safeNum((S.rates || {})['scope-at'], MAX_RATE);")
FOOT = ("+' · v12.42.14'; /* v8.19 release922", "+' · v12.42.15'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, 'scope at Baseplan'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124215 applied')
