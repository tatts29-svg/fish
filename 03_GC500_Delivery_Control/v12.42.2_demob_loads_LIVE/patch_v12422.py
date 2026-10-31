"""v12.42.2 - truck loads from what is Ready (Andrew, 26 Oct 2026, see README.md).

On the live v12.42.1 page, the cards' module (singles1238, as it went live from v12.42.1_demob_daycards) is replaced by this folder's
singles1238_src.js (made from it by make_src_from_v12421.py), and the footer reads v12.42.2. Nothing else on the page is touched.
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '85826c9bf9fcfc5a1bf10d5464971f4bab751e89fdcdb9152bf74b67a55b0f34'
OLD_SRC = HERE.parent / 'v12.42.1_demob_daycards_LIVE' / 'singles1238_src.js'
NEW_SRC = HERE / 'singles1238_src.js'
FOOT_OLD, FOOT_NEW = "+' · v12.42.1'; /* v8.19 release922", "+' · v12.42.2'; /* v8.19 release922"
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.42.1; rebuild and retest')
    old = OLD_SRC.read_text(encoding='utf-8').rstrip() + '\n'
    new = NEW_SRC.read_text(encoding='utf-8').rstrip() + '\n'
    if text.count(old) != 1: raise ValueError('the v12.42.1 cards module is not on the page exactly once')
    if "REL = 'v12.42.2'" not in new: raise ValueError('the new module does not carry v12.42.2')
    text = text.replace(old, new)
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.42.1 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v12422 applied: the Demob cards module replaced (truck loads from what is Ready); footer v12.42.1 -> v12.42.2')
