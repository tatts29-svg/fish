"""v12.42.21 - 9994954 at Baseplan to the cent: line 10 GN26 $2,005.08 and line 11 GN27 $2,551.92 (Baseplan's figures, not
12-26 Oct at the day rate with standdown), line 13 sync generators labour 12 h $1,801.32 (not charged on the page before).
These lines run through the generator model (generatorContract1004), so the pin sits there. Andrew, 28 Oct 2026: "9994954
can we get ours to match baseplan to the cent to fix". Author: Andrew Fisher. Footer v12.42.21.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

A = "function generatorLine1004(a,l){"
B = (";(function(){ /* v12.42.21: 9994954 at Baseplan to the cent (Andrew, 28 Oct 2026) */\n"
     " const G0 = generatorContract1004; const PIN12421 = {'9994954|10': 2005.08, '9994954|11': 2551.92, '9994954|13': 1801.32};\n"
     " generatorContract1004 = function(r){ const g = G0(r); if (!g || !r) return g; const v = PIN12421[String(r.rental_contract) + '|' + String(r.line)]; if (v == null) return g;\n"
     "  return Object.assign({}, g, {amount: v, forecast: v, actual: v, remaining: 0, arrived: true, branch: g.branch || r.branch_code, baseplan12421: true,\n"
     "   basis: 'Baseplan charges this line ' + money(v) + ' - Andrew, 28 Oct 2026: match Baseplan to the cent'}); };\n"
     " try { window.generatorContract1004 = generatorContract1004; } catch (e) {}\n"
     "})();\n"
     "function generatorLine1004(a,l){")
FOOT = ("+' · v12.42.20'; /* v8.19 release922", "+' · v12.42.21'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((A, B, '9994954 generator pins'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124221 applied')
