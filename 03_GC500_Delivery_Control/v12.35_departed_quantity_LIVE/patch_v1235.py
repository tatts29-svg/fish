"""Author: Andrew Fisher. v12.35 - a reference that has left in full keeps its quantity on the Demob tab.

Found recording EQ0002 (the 61 ft knuckle boom, 1300290, left 26 Oct 2026 12:47): for an added reference the Demob plan
counts the quantity from its supplied row, which follows the complete tick that every departure takes off, so a departed
added reference read "Nothing to collect" on the pick-up list and "Departure record needs review" in its departure reading.
units816, used only by the Demob plan, now keeps the quantity the reference's own departure recorded when it has left in
full and nothing else is counted. Read only: no record, P&L, Today, charge, QR or tracker change.
Footer v12.34 -> v12.35.
    python3 patch_v1235.py page.html      (in place, on the verified live v12.34 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '3625dd965f394bdd7b17aa6e8748236e58793dec1460be3a153b0d5f92598a33'
FOOT_OLD, FOOT_NEW = "+' · v12.34'; /* v8.19 release922", "+' · v12.35'; /* v8.19 release922"
TAIL = '</body>\n</html>\n'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.34; rebuild and retest')
    if 'demobqty1235-script' in text: raise ValueError('v12.35 is already on the page')
    if text.count('function units816(a){') != 1: raise ValueError('units816 not found once')
    if not text.endswith(TAIL): raise ValueError('the page does not end with </body></html>')
    text = text[:-len(TAIL)] + (HERE / 'demobqty1235_src.js').read_text(encoding='utf-8').rstrip() + '\n' + TAIL
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.34 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1235 applied: demobqty1235 (a departed reference keeps the quantity its departure recorded); footer v12.34 -> v12.35')
