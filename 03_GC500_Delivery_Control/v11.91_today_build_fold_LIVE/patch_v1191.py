"""Author: Andrew Fisher. v11.91 - Today: the finished build folds away.

Andrew, 24 Oct 2026 (this chat): "We need to start cleaning this up and making all pages mpre ogranjsed now"; on the plan, "Yes, Today
first".
  build1191_src.js + build1191.css: on Today the Where we are plate, the Work progress board, Milestones and the embedded Where we are
  view (By group, On site, Trade by trade) fold behind one "Build complete" bar, closed by default and remembered on the device. A
  screen-only rule hides them; nothing is moved, deleted or redrawn and paper prints as before. The fold opens by itself for the jump
  buttons that lead into it, for go('progress') and for anything that scrolls to a part inside it. The bar is placed before Today's
  scroll restore (TodayWork840.restore), so a redraw does not jump.
  The v7.89 slim header: the folded Today is short on a desktop, and on a window about 1,180-1,270 px tall slimming the header left
  the page nothing to scroll, so it sprang back to the top and the header flipped on every turn of the wheel (any short page did
  this; Today was never short before). Now a page too short to stay scrolled once the header slims keeps the full header and
  scrolls as normal; every other page behaves exactly as before.
  Footer -> v11.91. No record, servicing, crew card, QR code, server or charge change.

    python3 patch_v1191.py page.html      (in place, on the live v11.90 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '6b8b06f21cc1b1c5b7717cc945ef12b00654346ad88bf2537b72c869816c9673'
ANCHOR = '<script id="steady1143-script">'
SLIM_OLD = (" let slim = false; const on = () => { const y = m.scrollTop; if (!slim && y > 90) { slim = true; h.classList.add('slim89'); }"
            " else if (slim && y < 12) { slim = false; h.classList.remove('slim89'); } };")
SLIM_NEW = (" let slim = false, short = ''; const on = () => { const y = m.scrollTop, size = m.scrollHeight + 'x' + m.clientHeight;"
            " if (!slim && y > 90 && size !== short) { slim = true; h.classList.add('slim89');"
            " if (m.scrollHeight - m.clientHeight < 12) { slim = false; h.classList.remove('slim89'); short = size; m.scrollTop = y; } }"
            " else if (slim && y < 12) { slim = false; h.classList.remove('slim89'); } };"
            " /* v11.91 - a page too short to stay scrolled once the header slims keeps the full header (it flipped back and forth) */")


def patch(html):
    if 'build1191-script' in html: raise ValueError('v11.91 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.91 (expected v11.90 6b8b06f2...)')
    for need in ('var TodayWork840 = (() => {', 'return {build, capture, restore, mount, stop,', "TodayWork840.restore(kept840);",
                 "el.id='where885'", "board.before(el);", '<section id="ms1025" class="ms1025">', 'function wwaEmbed793(){',
                 "nav.className = 'jump95'", "b.className = 'jb95'", 'function go(tab){', 'clean1190-script',
                 '(function slim89(){', SLIM_OLD):
        if need not in html: raise ValueError('the page has no %r' % need)
    if html.count(SLIM_OLD) != 1 or html.count("classList.add('slim89')") != 1: raise ValueError('the slim header must be the one v7.89 copy')
    for before in ('var TodayWork840 = (() => {', 'function go(tab){'):
        if html.index(before) > html.index(ANCHOR): raise ValueError('%r must load before the anchor' % before)
    src = (HERE / 'build1191_src.js').read_text(encoding='utf-8')
    css = (HERE / 'build1191.css').read_text(encoding='utf-8')
    if '</script' in src.lower() or '</style' in css.lower(): raise ValueError('source would close its own tag')
    block = '<style id="build1191-style">\n' + css + '</style>\n<script id="build1191-script">\n' + src + '\n</script>\n' + ANCHOR
    html = rep(html, ANCHOR, block, 'build fold', 'page')
    html = rep(html, SLIM_OLD, SLIM_NEW, 'slim header', 'page')
    return rep(html, "+' · v11.90'; /* v8.19 release922", "+' · v11.91'; /* v8.19 release922", 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.91 build fold applied')
