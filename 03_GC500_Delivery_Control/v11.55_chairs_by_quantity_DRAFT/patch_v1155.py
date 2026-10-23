"""Author: Andrew Fisher. v11.55 - pad chairs are counted by quantity, never numbered.

Andrew, 23 Oct 2026 12:58: "P34 pad chairs are here just add the qty no assets on these chairs". The page's rule for things
counted by quantity (water-filled barriers, ground protection, track mats) takes pad chairs in, so the Questions tab's
asset-number check stops asking for numbers on them and the drawer says "Not numbered - counted by quantity". One regex,
and the footer v11.54 -> v11.55. No record change (the two chairs received are recorded through the page separately).

    python3 patch_v1155.py page.html      (in place, on the live v11.54 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.55 requires the live v11.54 page ' + BASE_SHA256)
    text = rep(text, "const UNNUMBERED_RX = /water-filled|ground protection|track ?mat|trakmat/i;",
               "const UNNUMBERED_RX = /water-filled|ground protection|track ?mat|trakmat|pad chairs?/i; /* v11.55 - pad chairs are counted by quantity, never numbered (the project manager, 23 Oct 2026) */", 'unnumbered types', 'page')
    text = rep(text, "+' · v11.54'; /* v8.19 release922", "+' · v11.55'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [('trakmat|pad chairs?/i', 1), ("+' · v11.55'; /* v8.19 release922", 1)]:
        if text.count(needle) != n: raise ValueError('v11.55 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1155 applied: pad chairs counted by quantity; footer v11.54 -> v11.55')
