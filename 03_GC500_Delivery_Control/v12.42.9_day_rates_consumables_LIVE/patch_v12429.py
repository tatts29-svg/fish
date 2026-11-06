"""v12.42.9 - day-rate lines charged by the day, and the consumables charged, at Baseplan (8)'s own figures (Andrew, 28 Oct 2026:
"Yes to 2 to be charged" - both). Author: Andrew Fisher.

The page charged these lines' Rate 1 once; Baseplan bills them per day. Each now charges Baseplan (8)'s prebill to the cent:
trakmats, the P68 hydration station, the scissor lift, the knuckle boom, the fork extensions, the 1.8 m fence (9997710/1);
and the consumables toilet paper, hand towels (10000506) and shade cloth (9997710/2). Water stays part of the pump-outs;
scrim stays on the fencing dockets; forklifts unchanged until Andrew confirms which were Coates' own use. Footer v12.42.9.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

AMOUNTS = {'9987005|2': 480.00, '9992300|3': 270.60, '9992300|4': 1672.64, '9992300|5': 1865.70, '9992300|6': 531.30,
           '10000523|1': 3721.92, '10000523|4': 5796.00, '10000523|6': 2801.40, '10000523|8': 357.42, '9997710|1': 190.08,
           '10000506|1': 4647.50, '10000506|2': 2076.90, '9997710|2': 1349.28}
JS = ' const BP12429 = ' + str(AMOUNTS).replace("'", '"') + ';\n'
A = " /* v12.42.6: WB07 is part of WB06"
B = (" /* v12.42.9: Baseplan (8)'s own figure, to the cent, on its day-rate lines and consumables (Andrew, 28 Oct 2026) */\n"
     + JS +
     " if (r && BP12429[String(r.rental_contract) + '|' + String(r.line)] != null) { const y12429 = contractCharge_747(r); y12429.amount = BP12429[String(r.rental_contract) + '|' + String(r.line)]; y12429.basis = 'Baseplan (8) charges this line ' + money(y12429.amount) + ' (per day where it is hired by the day) - Andrew, 28 Oct 2026'; return y12429; }\n"
     + A)
FOOT = ("+' · v12.42.8'; /* v8.19 release922", "+' · v12.42.9'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, 'Baseplan figures'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once')
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v12429 applied')
