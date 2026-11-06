# v13.01 — the Showcase reads race weekend — LIVE

**LIVE 5 Nov 2026 16:08 AEST** on Andrew's word ("Showcase upload"). Built on the live v13.00 page `6b57277fbf7951133…` (17,065,377
bytes, unchanged until the upload); public page `2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b` (17,066,969 bytes),
the view link serving the build byte for byte. Media step first: the 14 takes (3,919,617 bytes) each accepted 200 under its SHA-256
name and the manifest `0a745402f95479d2b796055852eb163cc9ce526cade6e532f3e1633f9e36229a` (1,986 files) registered; then the page.
On the live page: `tests/test_v1301.cjs` 41/41 desktop and 41/41 phone (every take served 200 audio/mpeg with its bytes, no 404s,
no errors, no writes). No record change (record 13059 before and after).

Ready 5 Nov 2026 ~05:50 AEST (candidate `2f6bc154…`, media manifest `0a745402…`, 42/42 on the build).

Author: Andrew Fisher. Andrew, 5 Nov 2026: "As the job is complete can we ensure everything in the showcase is now 1000 % accurate
with all date", "Look at everything. Must be accurate", then the go-ahead on the audit's recommendation (STATUS, AUDIT entry of
5 Nov 2026).

## What changes (`patch_v1301.py`)

**1. Every scene reads race weekend.** The job is complete and demob is under way, so the Showcase's 25 scenes read the record as at
Fri 23 Oct 2026 whatever day the page is opened: `showScene(key, day)` is wrapped (`showcase1301-script`) to read every scene at that
day, so `showRender` and the crew-card refresh both show race weekend. The scenes still read the live record - every figure is the
record's own - only the day they are read at is fixed. Without the pin, 15 of the 25 scenes read today's record (after demob: 45 of
184 references complete, 13 VMS "still to arrive", weather to 4 Nov). With it the weather scene reads 113.6 mm, 18 wet mornings of 47,
archive 7 Sep – 23 Oct, 63 km/h; equipment 265 of 265, 52 of 52, 311 of 311, 24 of 24; checks 7 of 7 categories complete.

**2. Fourteen race-call turns re-voiced** with the record's figures at that day, same voice (GC500 Race Caller), flow and mix as
v11.65 and v11.83, two takes each, all 28 transcribed and compared word by word with the line (`takes/picks.json` says which take and
why; `turns_changes.json` carries each old and new line and the reason):

| Turn | Said | Says now |
|---|---|---|
| 2 | 727 pieces of equipment | 728 pieces of equipment on site |
| 4 | 361 hours | 375 hours (34 days unchanged) |
| 20 | 14 generators | 15 generators, the 350 kVA set named first |
| 22 | Tedder Avenue, Commodore Park | Turn Four, Gate Two (the runs the record carries) |
| 24 | 727 pieces, 121 asset numbers, 25 references on 16 Oct | 733 on the record, 728 on site by race day; 24 references on 16 Oct |
| 29 | 42 labour notes, 32 days, 45 dockets in five days | 43 labour notes, 31 days, 46 dockets in five days |
| 30 | 8,235 feet | 8,239 feet |
| 31 | 7,977 clamps, 1,426 braces, 133 vehicle gates | 7,981 clamps, 1,428 braces, 278 gate wheels |
| 32 | 2,903 barrier units | 2,913 barrier units |
| 36 | nine wet mornings out of ten | ten wet mornings out of ten |
| 37 | gusts over fifty on fifteen days | gusts of fifty or more on sixteen days |
| 39 | fifty-eight pre-starts | forty-eight pre-starts filed |
| 41 | 25 references on 16 Oct | 24 references on 16 Oct |
| 43 | 727 pieces, every one booked, on site | 728 pieces on site for race weekend |

Turn 18 stands: the live servicing tracker carries 266 units, 75 references, 15 areas. The 121 asset numbers come out of turn 24
because the page cannot reproduce them; the 133 vehicle gates come out of turn 31 for the same reason (the papers carry 278 gate wheels,
which is said instead). Fourteen takes out of the media table, fourteen in; manifest digest; the programme note records the revision;
footer v13.00 → v13.01. No record, servicing, crew card, tracker or printed-code change.

## Checks

`tests/test_v1301.cjs`: 42/42 on the build, desktop and phone - the pin on the page; all 25 scenes identical whatever day is asked
for; 15 scenes would differ without it; the equipment, checks and weather scenes carry the race-weekend figures and no scene names a
date after race weekend; `showRender` shows the pinned scene; each re-voiced turn carries its line and take (the take file ready in
`media_v1301/` until the media step, then served 200 audio/mpeg with its bytes on the live page); the other 37 turns byte-equal to the
base page; turns 1–51; fencing still 100% and five green; no page or console errors beyond the 14 expected 404s before the media step;
no writes. `check_page.py` PASS (225 inline scripts). Sweeps desktop and phone: 27 tabs, 7 deep links, Back; 0 errors, 0 blocked.

## Files

`patch_v1301.py` (pin + takes + footer), `turns_changes.json`, `takes/` (14 mixed takes, `takes.json`, `picks.json`), `mix1301.py`
(the v11.65 mix, bed checked by SHA-256), `upload_media1301.py`, `tests/test_v1301.cjs`. The raw takes and the circuit bed stay
private. The build folder (`build/GC500_v13.01/`) holds the page, `base_live.html`, `media_manifest_v1301.json`, `broadcast_v1301.json`
and `media_v1301/`.
