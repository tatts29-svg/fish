"""Author: Andrew Fisher. v11.98 - Today: the asset-number clash card off.

Andrew, 25 Oct 2026 (this chat), with a screenshot of the Today card "Asset numbers delivered against two references":
"Can we remove this looks messy on todays page".
  The Today hub's clash card (clashcard) draws nothing. The warning still rides with the number wherever it goes: the
  P41 and P62 drawers, load briefs, drop sheets and driver cards (clashOf). No record change.
  Footer -> v11.98. No record, rate, servicing, crew card, QR code or server change.

    python3 patch_v1198.py page.html      (in place, on the live v11.96 page named by BASE)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = 'f8a93ce25459abd4493e65a28d9e9170d031237302b35af2ea1cf419bca08b68'
CARD_OLD = " const grades = claimGrades(); if (!grades.size) return '';"
CARD_NEW = (" return ''; /* v11.98 - off Today (Andrew, 25 Oct 2026: \"Can we remove this looks messy on todays page\"); the warning rides"
            " with the number on each reference's drawer, load brief, drop sheet and driver card (clashOf) */"
            " const grades = claimGrades(); if (!grades.size) return '';")
FOOT_OLD, FOOT_NEW = "+' · v11.96'; /* v8.19 release922", "+' · v11.98'; /* v8.19 release922"


def patch(html):
    if 'v11.98 - off Today' in html: raise ValueError('v11.98 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.98 (expected v11.96 f8a93ce2...)')
    for need in (CARD_OLD, FOOT_OLD, 'clashcard', 'function clashOf', "'Asset number on two references — ' + clash.short + '; check the plate'"):
        if need not in html: raise ValueError('the page has no %r' % need[:70])
    for once in (CARD_OLD, FOOT_OLD):
        if html.count(once) != 1: raise ValueError('%r must be there exactly once' % once[:60])
    html = rep(html, CARD_OLD, CARD_NEW, 'Today clash card off', 'page')
    return rep(html, FOOT_OLD, FOOT_NEW, 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.98 Today clash card off applied')
