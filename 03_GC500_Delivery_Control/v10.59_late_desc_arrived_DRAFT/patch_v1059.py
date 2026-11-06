"""Author: Andrew Fisher. v10.59 - what was late, by its description; arrivals on the day they came; the checked figures.

Andrew, 17 Oct 2026: "Do we know what was late and by how late is what we need to know what was late. What description
it relates too"; "the swivel chairs turned up on the correct day. So did the fridges"; "What dates they should of had
turn up. Have it as those dates".

- part_a_latedesc.py: Coates on time names each late or failed load by its reference and description, in More info and
  on the card ("P60 Gate 5 Ticket Box · 26 min late").
- part_b_arrived.py: arrivedOn1059.set(key, iso) records an arrival on the day it came when it was recorded later, in
  the record's existing day-only form, and the screens that read the light history handle it (no second arrival, no
  invented time).
- part_c_checked.py: the independent check's three fixes (P16 counts on 21 Sep, 34 min late; WC17's "both" note;
  13 Oct forklift is T0109).

The record does not change in the build. After upload, a record step uses arrivedOn1059.set for P26, P28 and P34 on
14 Oct. Footer v10.58 -> v10.59.

    python3 patch_v1059.py path/to/page.html   (on the v10.58 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
sys.path.insert(0, str(HERE))
from rep import rep
import part_a_latedesc as part_a
import part_b_arrived as part_b
import part_c_checked as part_c

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    for gate in ('ot1059-late', 'arrivedon1059-script', "src: 'site note', all:"):
        if gate in t: sys.exit('patch_v1059 refuses a repeat (' + gate + ')')
    for need in ('ontime1057-script', 'daycats1057-script', "+ ' · v10.58'"):
        if need not in t: sys.exit('patch_v1059 needs the v10.58 page (' + need + ' not found)')
    patches = part_a.PATCHES + part_b.PATCHES + [part_c.data_patch(t)] + part_c.PATCHES + [('Release footer', "+ ' · v10.58'", "+ ' · v10.59'")]
    for what, old, new in patches:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1059 applied: late loads named by reference and description; arrivals on the day they came; checked figures; footer v10.58 -> v10.59')
