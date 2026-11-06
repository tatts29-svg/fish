"""Author: Andrew Fisher. v10.57 - the Build tab tidied (Andrew, 17 Oct 2026: "Your locked order is taken up the whole
page. Hide it somewhere else not here. You have no twin steer but i cant even see the writing.. ... Needs to be neat and
tidy its a card of that day with details.").

This release is part 1 (part1_banner_orders.py): the no-twin-steer banner made legible, the locked delivery orders moved
off the Build tab to a fold at the foot of Demob (drawers keep theirs), and the Timeline's twin-steer rule as one red
line with the full rule behind More. The day-card categories and the on-time reasons follow as v10.58.

The record does not change. Footer v10.56 -> v10.57.

    python3 patch_v1057.py path/to/page.html   (on the v10.56 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
sys.path.insert(0, str(HERE))
from rep import rep
import part1_banner_orders as part1

PATCHES = part1.PATCHES + [('Release footer', "+ ' · v10.56'", "+ ' · v10.57'")]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'orders1057-script' in t: sys.exit('patch_v1057 refuses a repeat')
    if 'daycards1056-script' not in t: sys.exit('patch_v1057 needs the v10.56 page')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1057 applied: legible twin-steer banner; delivery orders folded on Demob; Timeline rule one line; footer v10.56 -> v10.57')
