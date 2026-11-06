"""v12.42.13 - AA (Active Air crib room) and HRP (Hire Republic crib room) are on their own contracts (Andrew, 28 Oct 2026:
"remember these were on another contract" - "AA, HRP"): held out of every charge on the page like the team references -
tracked here, nothing in hire, labour, servicing or transport. Author: Andrew Fisher. Footer v12.42.13.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

L0 = " const OWN12425 = ['T0003', 'T0004', 'T0005', 'FL01', 'FL02', 'EQ0004', 'EQ0007'];\n"
L1 = L0 + " /* v12.42.13: crib rooms on their own contracts (Andrew, 28 Oct 2026: \"remember these were on another contract\" - \"AA, HRP\") */\n const OTHER12413 = [['AA', 'Active Air'], ['HRP', 'Hire Republic']];\n"
M0 = ".concat(OWN12425.map(ref => [ref, Object.freeze({ref, hs: [], who: 'Coates own use', own: true})])"
M1 = M0 + ".concat(OTHER12413.map(([ref, who]) => [ref, Object.freeze({ref, hs: [], who, other: true})]))"
W0 = " const why = ref => { const h = HELD.get(String(ref)); if (h && h.own) return"
W1 = " const why = ref => { const h = HELD.get(String(ref)); if (h && h.other) return 'Not charged here: ' + h.who + '\\u2019s crib room is on ' + h.who + '\\u2019s own contract (Andrew, 28 Oct 2026). Tracked on this page.'; if (h && h.own) return"
G0 = "   if (h.own) return '<section"
G1 = ("   if (h.other) return '<section class=\"notice charges952\" data-charges952=\"' + esc(a.key) + '\" data-held1152><b>Charges to V8 Supercars · arrived equipment</b><p><b>Not charged here.</b> ' + esc(a.key) + ' is on ' + esc(h.who) + '\\u2019s own contract (Andrew, 28 Oct 2026). Tracked on this page; nothing from this reference is in the hire, labour, servicing or transport figures.</p></section>'; /* v12.42.13 */\n"
      + G0)
T0 = " allAssets().filter(a => !a._cancelled && !a.rest_of).forEach(a => {\n const t = assetTotal(a); const br = (branchOf(a.key) || {}).code || 'no branch';"
T1 = " allAssets().filter(a => !a._cancelled && !a.rest_of && !(typeof NotChargedHere1152 !== 'undefined' && NotChargedHere1152.has(a.key))).forEach(a => { /* v12.42.13: no ticks priced on a held reference */\n const t = assetTotal(a); const br = (branchOf(a.key) || {}).code || 'no branch';"
S0 = "if (l.labour && l.labour.ticked.length) { labourTicks += l.labour.ticked.length;"
S1 = "if (l.labour && l.labour.ticked.length && !l.held1152) { labourTicks += l.labour.ticked.length; /* v12.42.13: a held reference's ticks are not charged */"
FOOT = ("+' · v12.42.12'; /* v8.19 release922", "+' · v12.42.13'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((L0, L1, 'other list'), (M0, M1, 'held map'), (W0, W1, 'why words'), (G0, G1, 'drawer words'), (T0, T1, 'ticks skip held'), (S0, S1, 'summary labour skip held'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124213 applied')
