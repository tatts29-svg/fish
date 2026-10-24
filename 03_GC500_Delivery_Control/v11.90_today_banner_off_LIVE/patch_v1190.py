"""Author: Andrew Fisher. v11.90 - the "areas at 100%" banner comes off the Today tab.

Andrew, 24 Oct 2026 (this chat), with a screenshot of the Today tab's "7 areas at 100%" banner: "Need to remove this. We need to start
cleaning this up and making all pages mpre ogranjsed now".
  clean1190_src.js: the v10.26 milestone banner (#ms1026) is no longer drawn at the top of Today. The Milestones section further down
  Today (#ms1025: each area's summary, Print this summary (A4), Print all (A4), Celebrate again) and the 100% badges on the Work progress
  board stay as built. The celebration code is untouched (Celebrate again still plays it). Footer -> v11.90. No record, servicing, crew
  card, QR code, server or charge change.

    python3 patch_v1190.py page.html      (in place, on the live v11.89 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = 'e8b601db60ccb0788e258a203598bf1c480e2aa966613a05e1f5d3983acea52d'
ANCHOR = '<script id="steady1143-script">'


def patch(html):
    if 'clean1190-script' in html: raise ValueError('v11.90 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.90 (expected v11.89 e8b601db...)')
    for need in ('<script id="ms1026-script">', 'W.ms1026After = ms1026After;', "if (typeof W.ms1026After === 'function') W.ms1026After({fire, all, board, asOf});",
                 '<section id="ms1025" class="ms1025">', 'who1189-script'):
        if need not in html: raise ValueError('the page has no %r' % need)
    if html.index('<script id="ms1026-script">') > html.index(ANCHOR): raise ValueError('the banner script must come before the anchor')
    src = (HERE / 'clean1190_src.js').read_text(encoding='utf-8')
    if '</script' in src.lower(): raise ValueError('source would close its own tag')
    html = rep(html, ANCHOR, '<script id="clean1190-script">\n' + src + '\n</script>\n' + ANCHOR, 'banner off', 'page')
    return rep(html, "+' · v11.89'; /* v8.19 release922", "+' · v11.90'; /* v8.19 release922", 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.90 banner off applied')
