"""Author: Andrew Fisher. v12.45 (drafted as v12.42) - the Demob map: every asset on site as the icon of what it is, zoom to 16000%, tap for the
50 m × 50 m around a spot and send it.

Andrew, 26 Oct 2026: "the demob map remember zoom 16000% and desciption icons please, tap and you can do a 50m x 50m radius of
that and send to."

demobmap1242_src.js puts the map above the cards in Everything on site (the v12.42 Demob cards): every asset card placed on satellite
imagery (Esri World Imagery, as the VMS removals map) at its place on the record, the icon of what it is in a ring coloured by how
it stands; the units at one place fan out when zoomed in, each with its reference, description and asset number. Pinch, scroll or
+ / − to zoom to 16000%; drag; Fit. Tap a unit for its card; tap anywhere for the 50 m × 50 m around the spot, what is in it, and
its picture to Send, Text or Email, with Navigate. Read only: nothing is written to the record. Footer v12.42 -> v12.45.
    python3 patch_v1245.py page.html      (in place, on the live v12.42 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = None  # the verified live v12.42 SHA-256, set when v12.42 is live
FOOT_OLD, FOOT_NEW = "+' · v12.42'; /* v8.19 release922", "+' · v12.45'; /* v8.19 release922"
TAIL = '</body>\n</html>\n'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def patch(text):
    if not BASE or sha(text) != BASE: raise ValueError('Live base is not the verified v12.42; rebuild and retest')
    if 'demobmap1242-script' in text: raise ValueError('the Demob map is already on the page')
    if 'singles1238-script' not in text: raise ValueError('the v12.42 Demob cards are not on the page')
    if not text.endswith(TAIL): raise ValueError('the page does not end with </body></html>')
    text = text[:-len(TAIL)] + (HERE / 'demobmap1242_src.js').read_text(encoding='utf-8').rstrip() + '\n' + TAIL
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.42 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1245 applied: the Demob map (icons, zoom to 16000%, tap for 50 m x 50 m and send); footer v12.42 -> v12.45')
