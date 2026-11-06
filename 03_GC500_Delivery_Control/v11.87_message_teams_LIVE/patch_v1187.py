"""Author: Andrew Fisher. v11.87 - message the servicing teams.

Andrew, 24 Oct 2026 (this chat, about servicing): "Lets do a message to if things are missing. We can message each team and let
them know. 5 teams when u message its send message to both.. clear simple and easy."
  teams1187_src.js + teams1187.css: on the Servicing tab (edit link, event tracker only) a "Message the teams" card under the
  pump / clean / water meters. Each of the five crew groups shows what is still to do on the selected night (or what was missed
  once it closed) for its own jobs, with one button that opens a message to both people on that crew: sent by the service's own
  texting (/api/sms, a result for each number) or from the phone's own Messages. The crews' numbers stay on the phone.
  Footer -> v11.87. No record, tracker, tick, crew card, QR code, server or charge change.

    python3 patch_v1187.py page.html      (in place, on the live v11.86 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = 'b8366b090459abf3e2e571ab995551b81355c4f2f23a294749eb9eab64588840'
ANCHOR = '<script id="steady1143-script">'


def patch(html):
    if 'teams1187-script' in html: raise ValueError('v11.87 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.87 (expected v11.86 b8366b09...)')
    for need in ('var SvcPanel = (function', 'var SvcCrews1173 = (function', 'function sms777Submission(', 'function sms777Results(', 'function tokenOf(',
                 'const TEXT747_SERVICE_MAX = 480;', 'W.renderServicing1084 = wake;', '"crewGroups":[{"id":"cleaners"'):
        if need not in html: raise ValueError('the page has no %r' % need)
    src = (HERE / 'teams1187_src.js').read_text(encoding='utf-8')
    css = (HERE / 'teams1187.css').read_text(encoding='utf-8')
    if '</script' in src.lower() or '</style' in css.lower(): raise ValueError('source would close its own tag')
    block = ('<style id="teams1187-style">\n' + css + '</style>\n<script id="teams1187-script">\n' + src +
             "\nif (typeof window.renderServicing1084 === 'function') window.renderServicing1084();\n</script>\n" + ANCHOR)
    html = rep(html, ANCHOR, block, 'message the teams', 'page')
    return rep(html, "+' · v11.86'; /* v8.19 release922", "+' · v11.87'; /* v8.19 release922", 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.87 message the teams applied')
