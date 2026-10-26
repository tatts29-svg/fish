"""Author: Andrew Fisher. v12.38 - book the pick-up date and time on every Demob card.

Andrew, 26 Oct 2026: "i want a spot someon can add the date and time when it will be picked up"; "lets not pre date anything
the pick up data is buil;t from this".

On the edit link every card on the Demob tab has a Book pick-up button: a date, a time and an optional note (who is collecting).
It is saved on the reference's delivery record as its own field, with who set it, when, and a history:
    pickup1238_at    the booked moment, Queensland time ("2026-10-27T07:00:00+10:00"); "" once cleared
    pickup1238_note  who is collecting, or a note (80 characters at most)
    pickup1238_by    who booked it ("Recording as")
    pickup1238_set   when it was booked or cleared: the clock it merges on
    pickup1238_history  every booking and clearing, kept like the other histories (400 at most)
It merges on its own clock the way the Ready tick does (mergeRecords): the later booking wins on any copy, and a clearing is a
dated event too, so it beats an older booking; the histories join; a record holding only a booking is kept (deliveryEmpty).
The view link shows the booking and cannot change it. Nothing is pre-dated: a card with no booking says "to be booked", and the
"Booked pick-ups" list above the groups is built only from what people have booked, by day and time. In a day's list the plan's
own day stays as it was, with the booking (or the button) above it. No departure, Ready, Emptied, charge, QR or tracker change.
Every edit must find its text exactly once on the verified live v12.36 page. Footer -> v12.38.
    python3 patch_v1238.py page.html      (in place, on the live v12.36 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '206d514f8496ebef054058357efab28f73349faa624f3d1dd009739f690da2aa'
FOOT_OLD, FOOT_NEW = "+' · v12.36'; /* v8.19 release922", "+' · v12.38'; /* v8.19 release922"
TAIL = '</body>\n</html>\n'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

READY_MERGE = "if (rw1231) Object.assign(m, rw1231);"
BOOK_MERGE = READY_MERGE + """
 /* v12.38 - the booked pick-up merges on its own clock (when it was booked or cleared): the moment, the note, who and when together; a clearing is a dated event too */
 const pka1238 = typeof a.pickup1238_at === 'string' ? {pickup1238_at: a.pickup1238_at, pickup1238_note: a.pickup1238_note || '', pickup1238_by: a.pickup1238_by || '', pickup1238_set: a.pickup1238_set || ''} : null, pkb1238 = typeof b.pickup1238_at === 'string' ? {pickup1238_at: b.pickup1238_at, pickup1238_note: b.pickup1238_note || '', pickup1238_by: b.pickup1238_by || '', pickup1238_set: b.pickup1238_set || ''} : null;
 const pkw1238 = !pka1238 ? pkb1238 : !pkb1238 ? pka1238 : String(pkb1238.pickup1238_set) !== String(pka1238.pickup1238_set) ? (String(pkb1238.pickup1238_set) > String(pka1238.pickup1238_set) ? pkb1238 : pka1238) : (J(pkb1238) > J(pka1238) ? pkb1238 : pka1238);
 if (pkw1238) Object.assign(m, pkw1238);"""
RH_OLD = "const RH1231 = hist(a.ready1231_history, b.ready1231_history, h => h.ready + '|' + h.at); if (RH1231.length) m.ready1231_history = RH1231; /* v12.31 */"
RH_NEW = RH_OLD + "\n const PKH1238 = hist(a.pickup1238_history, b.pickup1238_history, h => (h.pickup || '') + '|' + h.at); if (PKH1238.length) m.pickup1238_history = PKH1238; /* v12.38 */"
SPOT_OLD = """  if (DM816.view === ALLV) { const pk = tr.querySelector('td.pk1231'); if (pk && !pk.querySelector('.bk1236')) pk.insertAdjacentHTML('afterbegin', ps === 'gone' ? '<span class="bk1236"><b>Left site</b></span>' : '<span class="bk1236">Pick-up time: <b>to be booked</b></span>'); }"""
SPOT_NEW = """  { const pk = tr.querySelector('td.pk1231'), ev1238 = DM816.view === ALLV, bk1238 = W.Pickup1238 ? W.Pickup1238.html(r, ps, ev1238) : !ev1238 ? '' : ps === 'gone' ? '<span class="bk1236"><b>Left site</b></span>' : '<span class="bk1236">Pick-up time: <b>to be booked</b></span>'; if (pk && bk1238 && !pk.querySelector('.bk1236')) pk.insertAdjacentHTML('afterbegin', bk1238); } /* v12.38 - the booked pick-up, or the spot to book it */"""

EDITS = [
 ('the booking merges on its own clock', READY_MERGE, BOOK_MERGE),
 ('its history merges', RH_OLD, RH_NEW),
 ('a record holding only a booking is kept', "typeof d.ready1231 !== 'boolean' && !d.date_off_at", "typeof d.ready1231 !== 'boolean' && typeof d.pickup1238_at !== 'string' && !d.date_off_at"),
 ('the spot on each card', SPOT_OLD, SPOT_NEW),
]


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.36; rebuild and retest')
    if 'pickup1238-script' in text: raise ValueError('v12.38 is already on the page')
    for label, old, new in EDITS:
        if text.count(old) != 1: raise ValueError(f'{label}: expected text found {text.count(old)} times, not once')
        text = text.replace(old, new)
    if not text.endswith(TAIL): raise ValueError('the page does not end with </body></html>')
    text = text[:-len(TAIL)] + (HERE / 'pickup1238_src.js').read_text(encoding='utf-8').rstrip() + '\n' + TAIL
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.36 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print(f'patch_v1238 applied: {len(EDITS)} edits + pickup1238; every Demob card can book its pick-up date and time, kept on the record; footer v12.36 -> v12.38')
