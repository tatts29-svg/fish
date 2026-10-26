"""v12.42.1 - the Demob cards without the "booked" zeros (Andrew, 26 Oct 2026 22:2x: "On the cards I don't like the booked.
And ready for booked as it looks like nothing had been booked").

On the live v12.42 page (4737996a...), the cards' module (singles1238, as it went live from v12.42_demob_cards_LIVE) is
replaced by this folder's singles1238_src.js, and the footer reads v12.42.1. Nothing else on the page is touched.

What changes on the Demob tab:
  - a day card's box says what was Picked up (a day ahead: "to come"); today's also says how many units are Ready for
    collection now. The Booked and Ready-of-booked rows are gone; bookings still show as lines when there are any;
  - the box, its lines label, the day's list and the list button say "Picked up" ("and booked" only when that day has bookings);
  - a day ahead with nothing booked shows the demob's completion now and the units off site, not "Nothing booked";
  - asset cards say "Pick-up" beside the Book pick-up button, not "Pick-up: to be booked";
  - the Booked pick-ups panel and the "booked" filter show only once something is booked.
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '4737996a98c4577e455e28a0e87dc91db794a7a271a6fdf986618e34314529cc'
OLD_SRC = HERE.parent / 'v12.42_demob_cards_LIVE' / 'singles1238_src.js'
NEW_SRC = HERE / 'singles1238_src.js'
FOOT_OLD, FOOT_NEW = "+' · v12.42'; /* v8.19 release922", "+' · v12.42.1'; /* v8.19 release922"
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.42; rebuild and retest')
    old = OLD_SRC.read_text(encoding='utf-8').rstrip() + '\n'
    new = NEW_SRC.read_text(encoding='utf-8').rstrip() + '\n'
    if text.count(old) != 1: raise ValueError('the v12.42 cards module is not on the page exactly once')
    if "REL = 'v12.42.1'" not in new: raise ValueError('the new module does not carry v12.42.1')
    text = text.replace(old, new)
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.42 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v12421 applied: the Demob cards module replaced (no "booked" zeros on the day cards or asset cards); footer v12.42 -> v12.42.1')
