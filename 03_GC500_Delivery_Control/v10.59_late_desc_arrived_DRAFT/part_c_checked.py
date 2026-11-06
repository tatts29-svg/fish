"""Author: Andrew Fisher. v10.59 part C - Coates on time, corrected where the independent check found the page wrong.

An independent check of every Coates booking from 14 Sep to 16 Oct (rebuilt from the raw Coates text export and the
site record, then an adversarial pass on every disagreement) confirmed three things, all applied here:

- P16 (Team Office - WFL): first window 21 Sep 12:00-15:00. Coates re-booked it at 21 Sep 12:54, inside that window,
  for 22 Sep, delivered 22 Sep 11:09. On the window given it counts on 21 Sep, late: the site record ticks it on site
  21 Sep 15:34, so 34 min late (the earlier of the tick and the text, the page's rule). 21 Sep: 2 of 9 (22%);
  22 Sep: 0 of 1. (build_ontime1057.py RE_BOOKED; the page now takes a unit's own-day site time even when its
  delivered text came on a later day.)
- 15 Sep WC17: the site note "Both toilets turned up 08:00" times both units, not only the first (on time either way).
- 13 Oct: the rough-terrain 2.5t forklift is T0109 (asset 1281615, put on T0109 by the site record 13 Oct 12:19;
  register 9987005 line 7). On time.

Patches the v10.58 page's ontime1057 script in place: the embedded data (ontime1059_units.json) and two model lines.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

UNITS = HERE / 'ontime1059_units.json'
DATA_HEAD = " const D = W.document, T = "
DATA_TAIL = ", U = Array.isArray(T.units) ? T.units : [];"


def data_patch(page_text):
    i = page_text.index(DATA_HEAD) + len(DATA_HEAD)
    j = page_text.index(DATA_TAIL, i)
    old = page_text[i:j]
    data = json.loads(UNITS.read_text(encoding='utf-8'))
    data.pop('author', None)
    new = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    return ('ontime: the checked units (P16 re-booked, T0109 13 Oct)', DATA_HEAD + old + DATA_TAIL, DATA_HEAD + new + DATA_TAIL)


PATCHES = [
    ('ontime: a site note that says both/all covers every unit that day',
     "    if (ts.length) return {times: ts, src: 'site note'};",
     "    if (ts.length) return {times: ts, src: 'site note', all: /\\b(both|all)\\b/i.test(note)};"),
    ('ontime: a unit takes its own-day site time even when its delivered text came later; a both/all note times every unit',
     "    g.forEach((u, i) => { if (i < s.times.length && !u.td) M.site.set(u.id, {min: s.times[i], src: s.src, ref: refs[0]}); });\n"
     "    if (s.times.length === 1 && !g[0].td) g.forEach(u => { if (!M.site.has(u.id) && u.t && u.t === g[0].t && !u.td) M.site.set(u.id, {min: s.times[0], src: s.src, ref: refs[0]}); });",
     "    g.forEach((u, i) => { if (i < s.times.length) M.site.set(u.id, {min: s.times[i], src: s.src, ref: refs[0]}); });\n"
     "    if (s.times.length === 1 && !g[0].td) g.forEach(u => { if (!M.site.has(u.id) && !u.td && ((u.t && u.t === g[0].t) || s.all)) M.site.set(u.id, {min: s.times[0], src: s.src, ref: refs[0]}); });"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if "src: 'site note', all:" in t: sys.exit('part_c refuses a repeat')
    for what, old, new in [data_patch(t)] + PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('part_c applied: checked units (P16, T0109) and the WC17 both-note')
