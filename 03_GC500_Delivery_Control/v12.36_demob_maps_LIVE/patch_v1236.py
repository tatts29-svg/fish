"""Author: Andrew Fisher. v12.36 - the master plan beside every asset on the Demob tab.

Andrew, 26 Oct 2026: "Can we make better lets do a nice one of my map next to each asset. Refernce location. We need this
looking better . Push your potetntil further need to look 10/10".
Every pick-up line carries its own piece of the master plan D001-26003-03, drawn from the page's own plan tiles and ringed
in red where the reference is, with its place in words under it; a tap opens the page's own "on the map" card (close-up,
wider area, Navigate, Send). Above the lists, the whole site on the master plan with every line of the day as a dot in its
light's colour. Presentation only, screen only: no record, P&L, Today, charge, QR or tracker change.
Footer v12.35 -> v12.36.
    python3 patch_v1236.py page.html      (in place, on the verified live v12.35 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '10a21fc080d8e55d141318fcc53ef7d4c43aa600388531453d5126a692061476'
FOOT_OLD, FOOT_NEW = "+' · v12.35'; /* v8.19 release922", "+' · v12.36'; /* v8.19 release922"
TAIL = '</body>\n</html>\n'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.35; rebuild and retest')
    if 'demobmap1236-script' in text: raise ValueError('v12.36 is already on the page')
    for once in ('function rowHtml816(r, extra){', 'function renderDemob816(){', 'const MAP_TILES = ', 'W.Find1176 = {'):
        if text.count(once) != 1: raise ValueError(once + ' not found once')
    if not text.endswith(TAIL): raise ValueError('the page does not end with </body></html>')
    text = text[:-len(TAIL)] + (HERE / 'demobmap1236_src.js').read_text(encoding='utf-8').rstrip() + '\n' + TAIL
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.35 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1236 applied: demobmap1236 (the master plan beside every asset on the Demob tab); footer v12.35 -> v12.36')
