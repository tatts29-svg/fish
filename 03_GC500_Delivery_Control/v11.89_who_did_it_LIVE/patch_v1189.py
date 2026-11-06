"""Author: Andrew Fisher. v11.89 - servicing: tap a place to see who did it.

Andrew, 24 Oct 2026 (this chat): "Also i want to be able to tap on something thats already been done find out who did it. So much was
missed last night."
  who1189_src.js + who1189.css: on the Servicing tab (edit link, event tracker) tap a place in an area table, or "Who did it" on the
  servicing map's selected place, for a sheet of that place's jobs on the night: the time each was done and the crew it was saved with,
  every tick, untick and cancel, and whose job a missed one was. Tap a crew's done count on Message the teams for the places saved with
  that crew. In the tables the crew name sits under the time (people's names only) instead of running into the next column on a phone.
  The area tables and the shift report printed a saved crew as "Crew group cleaners"; they now read the crew card's own labels.
  Footer -> v11.89. No record, tracker, tick, crew card, QR code, server or charge change.

    python3 patch_v1189.py page.html      (in place, on the live v11.88 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = 'f5a383605877e87621652520250dfbeb5006f3abf3861845b759492d534e462c'
ANCHOR = '<script id="steady1143-script">'


def patch(html):
    if 'who1189-script' in html: raise ValueError('v11.89 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.89 (expected v11.88 f5a38360...)')
    for need in ('teams1187-script', 'mapx1188-script', 'var SvcCrews1173 = (function', '<small class="crew1173-report">',
                 "'<tr class=\"svc-r1' + cls + '\"><th scope=\"row\"><b>' + esc(r.ref) + '</b>", "<th scope=\"rowgroup\" colspan=\"' + (cols.length + 1) + '\"><b>' + esc(r.ref) + '</b>",
                 "data-share1164-ref=\"'+esc(r.ref)+'\"", 'W.gc500Teams1187 = {open: open, close: close, last: function () { return last; }};'):
        if need not in html: raise ValueError('the page has no %r' % need)
    src = (HERE / 'who1189_src.js').read_text(encoding='utf-8')
    css = (HERE / 'who1189.css').read_text(encoding='utf-8')
    if '</script' in src.lower() or '</style' in css.lower(): raise ValueError('source would close its own tag')
    block = '<style id="who1189-style">\n' + css + '</style>\n<script id="who1189-script">\n' + src + '\n</script>\n' + ANCHOR
    html = rep(html, ANCHOR, block, 'who did it', 'page')
    return rep(html, "+' · v11.88'; /* v8.19 release922", "+' · v11.89'; /* v8.19 release922", 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.89 who did it applied')
