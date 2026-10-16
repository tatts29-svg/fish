"""Author: Andrew Fisher. v10.39 - the drawer opens quickly again, and pee panels carry no steps (Andrew, 16 Oct 2026:
"everything is very laggy and slow at the moment please fix ... pee panels will have a delivery, install charge, level
charge, clean charge, demob charge, pick up").

1. The seven-symbol row (v10.33) worked out its ticks outside the page's one-pass asset hold, so every call rebuilt the
   asset list over and over inside the transport model: 8.8 s for one reference, three times on every drawer open. It
   now runs inside holdAssets, like every other render path: 0.2 s. Same answer, nothing else changes.
2. A pee panel carries install, level, clean and demob (with the delivery and pick-up legs) - no steps. Pricing already
   charged it that way; the tick row offered a steps tick it should not have. The labour-lines rule now says so.
Footer v10.38 -> v10.39. No record changes.

    python3 patch_v1039.py path/to/page.html   (on the live v10.38 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARK = '/* v10.39 - quick-drawer-1039 */'
REPLACEMENTS = [
    ('the tick row inside the asset hold', "function state(ref){\n  const a = assetOf(ref); if (!a) return null; const d = deliveryOf(ref); const out = {}; let T = null;",
     "function state(ref){ " + MARK + " return typeof holdAssets === 'function' ? holdAssets(() => state1039(ref)) : state1039(ref); }\n function state1039(ref){\n  const a = assetOf(ref); if (!a) return null; const d = deliveryOf(ref); const out = {}; let T = null;"),
    ('pee panels: install, level, clean, demob', "if (/^FWF$/i.test(s)) return new Set(['install', 'demob']);",
     "if (/^FWF$/i.test(s)) return new Set(['install', 'demob']); if (/pee\\s*panel/i.test(s)) return new Set(['install', 'levelling', 'cleaning', 'demob']); /* v10.39 - a pee panel: install, level, clean, demob and the two legs, no steps (Andrew, 16 Oct 2026) */"),
    ('Release footer', "+ ' · v10.38'", "+ ' · v10.39'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if MARK in html: sys.exit('patch_v1039 refuses a repeat')
    if "+ ' · v10.38'" not in html: sys.exit('patch_v1039: not the v10.38 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1039 applied: the tick row runs inside the asset hold (drawer quick again); pee panels carry no steps; footer v10.38 -> v10.39')


if __name__ == '__main__':
    main()
