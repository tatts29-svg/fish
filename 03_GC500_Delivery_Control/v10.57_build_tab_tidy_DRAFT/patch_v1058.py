"""Author: Andrew Fisher. v10.58 - completed day cards that read like a card of that day (Andrew, 17 Oct 2026: "Dont give
me a refernce description give me water barriers. Or Toilets or something bettwr than whta you have on the cards. If the
transport is not 100% i want a reason why. This need to refresh and be accurate. Needs to be neat and tidy its a card of
that day with details.").

- part2_daycats.py: WHAT WENT IN on every completed Build day card - a tidy grid of plain categories (Buildings, Toilets,
  Water barriers, Generators, Lighting towers, VMS boards, Forklifts, Track mat, Furniture, Fencing, Crowd barriers) with
  the true quantity that came in that day (close-to-close on the site record, receipts by their day). References and
  where each number came from are in More info.
- part3_ontime.py: COATES ON TIME rebuilt truck by truck from the full Coates text export (units booked together are
  separate units), arrival from the site record (a site-note time wins; otherwise the earlier of the Coates text and
  the site tick), against the first booked window. Under 100% the card says what was late in plain words, and More info
  gives every late load with its reason facts (window history, programme load, texts) and 'No cause recorded on site.'
  The v10.56 painter and the v10.48 day-panel fold stand down, so a day shows one figure.

The record does not change. Footer v10.57 -> v10.58.

    python3 patch_v1058.py path/to/page.html   (on the v10.57 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
sys.path.insert(0, str(HERE))
from rep import rep
import part2_daycats as part2
import part3_ontime as part3

PATCHES = part2.PATCHES + part3.PATCHES + [('Release footer', "+ ' · v10.57'", "+ ' · v10.58'")]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    for gate in ('daycats1057-script', 'ontime1057-script'):
        if gate in t: sys.exit('patch_v1058 refuses a repeat (' + gate + ')')
    if 'orders1057-script' not in t: sys.exit('patch_v1058 needs the v10.57 page')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1058 applied: WHAT WENT IN by category; Coates on time within the window given, with the time done; footer v10.57 -> v10.58')
