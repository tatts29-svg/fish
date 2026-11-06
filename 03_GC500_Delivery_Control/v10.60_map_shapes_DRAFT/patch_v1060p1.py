"""Author: Andrew Fisher. v10.60.1 - a tap just beside a small drawn unit on the Map explorer picks that unit again.

On v10.60 a tap 5-9 px off a small shaped unit at an overview zoom fell through to the explorer's any-chip pick and could
open a hidden unit from another category (Generators at 100%: GN01 +6 px opened BS01; Toilets: WC02 -6 px opened P41).
v10.59 picked the drawn unit. Now, when the tap is inside no outline, the shaped units' old ring reach is tried before
the explorer's own fallback. Found by the final independent review of v10.60. Footer v10.60 -> v10.60.1.

    python3 patch_v1060p1.py path/to/page.html   (on the live v10.60 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

OLD = """   return top || labelHit1010(x, y) || hit(x, y, all);
  };"""
NEW = """   const own = top || labelHit1010(x, y) || hit(x, y, all); if (own) return own;
   marks = all.filter(m => shapeFor(m.it)); labelBounds1010 = [];    /* just beside a small drawn unit: its old ring's reach still picks it, so a hidden unit from another chip is never opened instead (v10.60.1) */
   try { return nativeMarkAt(x, y); } finally { marks = all; labelBounds1010 = lb; }
  };"""

# the source patch carries the same text, so a rebuild of v10.60 from its patch gives the same page
assert NEW in (HERE / 'patch_v1060.py').read_text(encoding='utf-8')

PATCHES = [
    ('map explorer: a near-miss tap beside a drawn unit picks it', OLD, NEW),
    ('Release footer', "+ ' · v10.60'", "+ ' · v10.60.1'"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'shapes1060-script' not in t or "+ ' · v10.60'" not in t: sys.exit('patch_v1060p1 needs the v10.60 page')
    if '(v10.60.1)' in t: sys.exit('patch_v1060p1 refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1060p1 applied: near-miss taps beside a drawn unit pick it again; footer v10.60 -> v10.60.1')
