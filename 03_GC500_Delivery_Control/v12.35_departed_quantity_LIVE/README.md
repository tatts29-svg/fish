# v12.35: a reference that has left in full keeps its quantity on the Demob tab

Author: Andrew Fisher · 26 Oct 2026

Found while recording EQ0002, the 61 ft knuckle boom (1300290), which Andrew reported picked up at 12:47 on 26 Oct 2026: "Also picked up now 1300290".

## The fault

The departure was recorded through the page's own form: the light went to in transit, and the history held the departure with its time, unit and recorder. But the Demob tab then showed:
- **"Nothing to collect"** on EQ0002's pick-up line, with no lights;
- **"Departure record needs review"** in its departure reading.

**Why:**
- For an added reference (the EQ, FL, FR, TM, NVLT, BJR01, SVP01 and GN20-A lines), the Demob plan counts the quantity from the reference's supplied row.
- That row follows the complete tick, and every departure takes the complete tick off, as the page's rule says.
- So the quantity fell to nothing the moment the reference left. The departure, recorded for one knuckle boom, no longer matched.

Generators, toilets and the other base lines count from their own lines and were never affected. The same fault was on v12.33.

## The fix

`units816`, used only by the Demob plan, keeps the quantity the reference's own departure recorded. It does this only when all of these hold:
- the light is in transit or not on site;
- the last departure since it last arrived took the whole reference;
- nothing else is counted.

A reference on site, and every reference whose quantity still counts, is untouched.

EQ0002 now reads:
- Left site at 12:47 in its departure reading;
- picked up with the green light and the DEPARTED stamp on its line;
- "Departed 26 Oct 12:47" in words.

**Not changed:** the record, the P&L, Today, charges, QR codes and the servicing tracker.

## Files

| File | What it does |
|---|---|
| `demobqty1235_src.js` | The module, inserted before `</body>`. It wraps `units816` and clears the Demob plan's cached copy once. |
| `patch_v1235.py` | Inserts the module on the verified live v12.34 page (BASE `3625dd96…`) and moves the footer from v12.34 to v12.35. |
| `tests/test_v1235.cjs` | v12.34's 53 checks, plus four for this fix. |

**The four new checks:**
- EQ0002 reads Left site, with its 12:47 departure whole and no review asked;
- on the plan it keeps the quantity its departure recorded and reads picked up, "Departed 26 Oct 12:47";
- no reference on site, and no generator, takes a departure quantity;
- its line wears the green light and the stamp at 12:47, not "Nothing to collect".

## Checks

- **LIVE 26 Oct 2026 13:27 AEST.** The view link serves the build byte for byte: 15,528,033 bytes, sha256 `10a21fc0…`. A separate public fetch at 13:28 is identical.
- **On the live bytes:** desktop 57/57 and phone 57/57 (`evidence/test_live_desktop.txt`, `evidence/test_live_phone.txt`), EQ0002's four checks among them.

- Candidate `10a21fc0…`, 15,528,033 bytes, on live v12.34 `3625dd96…`; check_page PASS.
- Desktop 57/57 and phone 57/57 (`evidence/test_v1235_desktop.txt`, `evidence/test_v1235_phone.txt`): v12.34's 53 checks and the four above. Every rehearsal was captured in the page; nothing reached the network.
- Both sweeps: 27 tabs, 19 panes shown, 7 deep links; 0 errors, 0 console messages and 0 writes (`evidence/sweeps.json`).
- GN13 (1276503) was recorded as left site at 13:02 between the tests and the sweeps, through the page's own form on live v12.34. It is a generator, counted from its own line, so this fix does not touch it; the tests follow the record and pass with it.
