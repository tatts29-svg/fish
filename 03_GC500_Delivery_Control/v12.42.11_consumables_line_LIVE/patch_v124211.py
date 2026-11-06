"""v12.42.11 - the consumables on their own P&L line (Andrew, 28 Oct 2026: "Consumbles should be a consumables line").
Toilet paper 10000506/1, hand towel 10000506/2 and shade cloth 9997710/2 (v12.42.9, Baseplan (8) to the cent) leave Hire Revenue
1005 for Consumables 1020. Water stays part of the pump-outs. No total changes. Author: Andrew Fisher. Footer v12.42.11.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

CONS = "(()=>{let s=0;for(const r of ONHIRE_ROWS){if(['10000506|1','10000506|2','9997710|2'].includes(String(r.rental_contract)+'|'+String(r.line))){const a=contractCharge(r).amount;if(typeof a==='number')s+=a;}}return Math.round(s*100)/100;})()"
H0 = "{key: 'hire', code: '1005', line: 'Hire Revenue', what: 'gear on the contracts not booked as hired in: Rate 1 over the event — forklifts, VMS and water barriers by the day from when they go in — and the card where a line has none',now: hire,job: r2(hire +generatorModel1004()"
H1 = "{key: 'hire', code: '1005', line: 'Hire Revenue', what: 'gear on the contracts not booked as hired in: Rate 1 over the event — forklifts, VMS and water barriers by the day from when they go in — and the card where a line has none',now: r2(hire - " + CONS + "),job: r2(hire - " + CONS + " +generatorModel1004()"
C0 = "{key: 'cons', code: '1020', line: 'Consumables', what: 'water is part of the pump-out charges (Andrew, 27 Oct 2026): not charged on its own', now: 0, job: 0, basis: 'Q6846’s lines at cost — the line Finance posts water to'}"
C1 = "{key: 'cons', code: '1020', line: 'Consumables', what: 'toilet paper, hand towels and shade cloth at Baseplan (8)’s figures (Andrew, 28 Oct 2026); water is part of the pump-out charges', now: " + CONS + ", job: " + CONS + ", basis: '10000506 lines 1–2 (toilet paper, hand towel) and 9997710 line 2 (shade cloth), Baseplan (8) to the cent; moved here from Hire Revenue (v12.42.11)'}"
FOOT = ("+' · v12.42.10'; /* v8.19 release922", "+' · v12.42.11'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((H0, H1, 'hire less consumables'), (C0, C1, 'consumables line'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once')
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124211 applied')
