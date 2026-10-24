# v12.01 Build cards: the stamp inked like a real stamp, CLOSED off, and late deliveries named

Author: Andrew Fisher

DRAFT, 25 Oct 2026. The mock-up (candidate built on the real page) went to Andrew at 05:3x AEST. It isn't uploaded until he says yes.

Andrew, 25 Oct 2026, in this chat:
- "Remove the closed and have stamp here like its been stamped with a stamp"
- "Theres is a lot saying item late. I want to know what was late"
- "Do we need ti make cards a little wider does this hekp you ?"

## What changes

1. **CLOSED comes off every closed day card** (Build and Demob). TODAY and UPCOMING stay on open cards.
2. **The stamp is the closed mark, inked like a real rubber stamp.** Same artwork, same place in the gap beside the date, re-centred in the taller gap CLOSED leaves. No glow, no screen blend, no pulse. It's solid ink with a fine speckle where the ink missed and a little uneven pressure. Each card is struck at its own angle (-7°, -9°, -11° or -13°).
3. **A late delivery is named for what it was.** When a Coates booking text names no reference, the on-time list (on the card and in More info) uses the text's own words instead of "Item". The same goes for a reference with no register description. A bracket the text was cut off inside is left off. On 21 Oct:
   - Knuckle Boom 61ft (18.6M) – Diesel · 1 h 21 min late (booked 07:30–11:00, done 12:21)
   - Straight Boom Lift 60ft – Diesel · 34 min late (booked 08:30–11:30, done 12:04)
   - Portable Airconditioner 4.5kW Electric · 4 min late (booked 09:00–12:00, done 12:04)
4. **A late time never splits across two lines** on the card ("1 h 21 min late" stays in one piece).

Every figure, window and time is unchanged. No record, rate, servicing, crew card, QR code or server change.

**Card width:**
- Measured on the real page: on a phone a day card is 374 px of a 390 px screen, so it's already full width.
- On tablets and computers the cards stop at 400 px in a sideways-scrolling strip.
- Widening them on big screens is a layout change, so it waits for Andrew's word.

## Files

- `cards1201.css`: CLOSED off, the stamp, the one-piece late time.
- `patch_v1201.py`: the CSS before `steady1143-script`; eight edits inside `ontime1057-script` (the naming helpers `said1201`, `kind1201`, `lbl1201`, `itm1201`); footer v12.01. It refuses a base other than live v11.99 `2c653073…`.
- `tests/test_native1201.cjs`: read only. 11 checks: the naming rule, 21 Oct names, "Item" nowhere on 23 days of rows and More info, CLOSED off 46 closed cards and the Demob ones, the stamp is ink at 4 angles, centred within 2 px and clear of the date, the label line and the weather, no page errors, zero writes.

## Where it's up to

- Candidate `d80a9f7b…` on live v11.99 `2c653073230aa8533fd2121cf87f3459c6fbde66a0aac22df564dc55161e671e`.
- Tests: native 11/11 on desktop and on phone.
- Next: Andrew's yes, then sweeps, upload and LIVE. If Codex's v12.00 publishes first, this rebuilds on it.
