"""v12.42.14 - AA and HRP carry their own hire schedules (Andrew, 28 Oct 2026: "AA and HRP pay for there separate are on HS#
9968926 & 9974238. not on v8 contract"): AA (Active Air crib room) HS 9968926, HRP (Hire Republic crib room) HS 9974238.
Wording only; still held out of every charge (v12.42.13). Author: Andrew Fisher. Footer v12.42.14.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

E = [
 (" const OTHER12413 = [['AA', 'Active Air'], ['HRP', 'Hire Republic']];",
  " const OTHER12413 = [['AA', 'Active Air', '9968926'], ['HRP', 'Hire Republic', '9974238']]; /* v12.42.14: their own hire schedules (Andrew, 28 Oct 2026) */"),
 (".concat(OTHER12413.map(([ref, who]) => [ref, Object.freeze({ref, hs: [], who, other: true})]))",
  ".concat(OTHER12413.map(([ref, who, hs]) => [ref, Object.freeze({ref, hs: [hs], who, other: true})]))"),
 ("if (h && h.other) return 'Not charged here: ' + h.who + '\\u2019s crib room is on ' + h.who + '\\u2019s own contract (Andrew, 28 Oct 2026). Tracked on this page.';",
  "if (h && h.other) return 'Not charged here: ' + h.who + '\\u2019s crib room is on hire schedule ' + h.hs.join(' & ') + ', paid by ' + h.who + ', not on the V8 contract (Andrew, 28 Oct 2026). Tracked on this page.';"),
 ("' is on ' + esc(h.who) + '\\u2019s own contract (Andrew, 28 Oct 2026).",
  "' is on hire schedule ' + esc(h.hs.join(' & ')) + ', paid by ' + esc(h.who) + ', not on the V8 contract (Andrew, 28 Oct 2026)."),
 ("+' · v12.42.13'; /* v8.19 release922", "+' · v12.42.14'; /* v8.19 release922"),
]


def patch(t, path='page'):
    for i, (a, b) in enumerate(E):
        if t.count(a) != 1: raise ValueError('edit %d not found once (%d)' % (i, t.count(a)))
        t = rep(t, a, b, 'edit %d' % i, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124214 applied')
