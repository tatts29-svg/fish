"""Author: Andrew Fisher. Generators and VMS boards carry delivery, install and pick up, v10.35 (Andrew, 16 Oct 2026:
"Whatever as per rate card, that is the cost it will get, unless I unticked it. Generators as example: delivery,
install, pick up. VMS boards: delivery, install, pick up."). v10.32's rule said what an FWF, a toilet block, a waste
tank and a building carry; this adds the two he named: a generator and a VMS board carry the install line and the two
transport legs, and no demob line. The rule now reads the discipline as well as the item, because a generator is
'60kva', '100KVA TRAILER' or 'Generator 200kva' on the card. The install line's figure is as the card table holds it;
nothing here changes a rate. Footer v10.34 -> v10.35.

    python3 patch_v1035.py path/to/page.html   (after patch_v1034.py)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

OLD_RULE = "function labourKeep1032(item){ const s = String(item || '').trim(); if (/^FWF$/i.test(s)) return new Set(['install', 'demob']); if (/waste\\s*tank|holding\\s*tank|sewage/i.test(s)) return new Set(['install', 'levelling', 'cleaning', 'demob']); if (/block/i.test(s)) return new Set(['install', 'levelling', 'steps', 'cleaning', 'demob']); return null; }"
NEW_RULE = ("function labourKeep1032(item, disc){ const s = String(item || '').trim(), d = String(disc || '').trim();"
            " /* v10.35 - a generator and a VMS board carry the install line and the two transport legs, no demob (Andrew, 16 Oct 2026) */"
            " if (/^generators?$/i.test(d) || /^variable message signs?$/i.test(d) || /^vms$/i.test(s)) return new Set(['install']);"
            " if (/^FWF$/i.test(s)) return new Set(['install', 'demob']); if (/waste\\s*tank|holding\\s*tank|sewage/i.test(s)) return new Set(['install', 'levelling', 'cleaning', 'demob']); if (/block/i.test(s)) return new Set(['install', 'levelling', 'steps', 'cleaning', 'demob']); return null; }")

REPLACEMENTS = [
    ('The rule: generators and VMS boards', OLD_RULE, NEW_RULE),
    ('The rule reads the discipline too', 'const keep1032 = labourKeep1032(item);', 'const keep1032 = labourKeep1032(item, disc);'),
    ('Release footer', "+ ' · v10.34'", "+ ' · v10.35'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'labourKeep1032(item, disc)' in html: sys.exit('patch_v1035 refuses a repeat')
    if "+ ' · v10.34'" not in html: sys.exit('patch_v1035: not the v10.34 line - wrong base (apply patch_v1034.py first)')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1035 applied: generators and VMS boards carry delivery, install and pick up; footer v10.34 -> v10.35')


if __name__ == '__main__':
    main()
